import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import "dotenv/config";
import * as schema from './db/schema';
import * as relations from './db/relations';
import { eq, or, sql, inArray } from 'drizzle-orm';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/emtees' });
const db = drizzle(pool, { schema: { ...schema, ...relations } });

async function run() {
  const userId = 15; // T003
  
  // Existing logic mock:
  const teacherBatches = await db.query.batches.findMany({ where: eq(schema.batches.teacherId, userId) });
  const otoClasses = await db.query.oneToOneSessions.findMany({ where: eq(schema.oneToOneSessions.teacherId, userId) });
  const groupClasses = await db.query.classes.findMany({ where: eq(schema.classes.teacherId, userId) });
  const teacherCompletedClassesIds = groupClasses.filter(c => c.status === "completed").map(c => c.id);

  const enrolledStudentIds = new Set<number>();
  const batchToStudents = new Map<number, Set<number>>();
  
  for (const batch of teacherBatches) {
    const enrollments = await db.query.batchEnrollments.findMany({
      where: eq(schema.batchEnrollments.batchId, batch.id),
    });
    
    const bStudents = new Set<number>();
    enrollments.forEach((e) => {
      enrolledStudentIds.add(e.studentId);
      bStudents.add(e.studentId);
    });
    batchToStudents.set(batch.id, bStudents);
  }

  // NEW LOGIC: Fetch allocations for this teacher
  const teacherAllocations = await db.select({
      studentId: schema.studentClassAllocations.studentId,
      allocation: schema.studentClassAllocations.allocation,
  }).from(schema.studentClassAllocations).where(
    or(
      sql`CAST(${schema.studentClassAllocations.allocation}->'oneToOne'->>'teacherId' AS INTEGER) = ${userId}`,
      sql`CAST(${schema.studentClassAllocations.allocation}->'group'->>'teacherId' AS INTEGER) = ${userId}`
    )
  );
  
  const studentsMap = new Map<number, any>();
  const allStudentIds = new Set<number>(enrolledStudentIds);
  for (const session of otoClasses) {
    allStudentIds.add(session.studentId);
  }
  for (const alloc of teacherAllocations) {
    allStudentIds.add(alloc.studentId);
  }
  
  if (allStudentIds.size > 0) {
    const studentUsers = await db.query.users.findMany({
      where: inArray(schema.users.id, Array.from(allStudentIds)),
    });
    
    for (const u of studentUsers) {
      studentsMap.set(u.id, {
        id: u.id,
        name: u.name,
        unionId: u.unionId,
        status: u.status,
        batchNames: new Set<string>(),
        oneToOneConducted: 0,
        oneToOneRemaining: 0,
        groupConducted: 0,
        groupRemaining: 0,
      });
    }
  }

  // Use the new allocation fetch to populate remaining classes
  // We need to fetch ALL allocations for `allStudentIds` in case they were added from `batchEnrollments` but didn't have teacherId in JSON directly (though they should).
  if (allStudentIds.size > 0) {
      const allAllocs = await db.select({
          studentId: schema.studentClassAllocations.studentId,
          allocation: schema.studentClassAllocations.allocation,
      }).from(schema.studentClassAllocations).where(
          inArray(schema.studentClassAllocations.studentId, Array.from(allStudentIds))
      );
      
      for (const a of allAllocs) {
          if (studentsMap.has(a.studentId) && a.allocation) {
              const st = studentsMap.get(a.studentId);
              const alloc: any = a.allocation;
              
              if (alloc.oneToOne) {
                  st.oneToOneRemaining = (alloc.oneToOne.remaining30 || 0) + (alloc.oneToOne.remaining45 || 0) + (alloc.oneToOne.remaining60 || 0);
              }
              if (alloc.group) {
                  st.groupRemaining = (alloc.group.remaining30 || 0) + (alloc.group.remaining45 || 0) + (alloc.group.remaining60 || 0);
              }
          }
      }
  }

  for (const batch of teacherBatches) {
    const bStudents = batchToStudents.get(batch.id) || new Set();
    for (const sid of bStudents) {
      if (studentsMap.has(sid)) {
        studentsMap.get(sid).batchNames.add(batch.name);
      }
    }
  }

  // Count conducted from sessions
  for (const session of otoClasses) {
    if (studentsMap.has(session.studentId)) {
      const st = studentsMap.get(session.studentId);
      st.batchNames.add("One-to-One");
      if (session.status === "completed") {
        st.oneToOneConducted++;
      }
    }
  }

  if (teacherCompletedClassesIds.length > 0) {
    const studentAttendanceRecords = await db
      .select({ studentId: schema.attendance.studentId })
      .from(schema.attendance)
      .where(inArray(schema.attendance.classId, teacherCompletedClassesIds));
      
    for (const r of studentAttendanceRecords) {
      if (studentsMap.has(r.studentId)) {
        studentsMap.get(r.studentId).groupConducted++;
      }
    }
  }

  const studentsDetails = Array.from(studentsMap.values()).map(st => ({
    ...st,
    batchNames: Array.from(st.batchNames),
    totalClassesConducted: st.oneToOneConducted + st.groupConducted,
    totalClassesRemaining: st.oneToOneRemaining + st.groupRemaining,
  }));
  
  console.log("Students details:", JSON.stringify(studentsDetails, null, 2));
  
  pool.end();
}
run();
