import { eq, and, sql, inArray } from "drizzle-orm";
import { getDb } from "../queries/connection";
import { attendanceEvents, attendance, classLedgerTransactions, classes, users, profiles, batches, batchEnrollments, classBatches, systemSettings } from "@db/schema";
import { recalculateSalaryInternal } from "../routers/admin";
import { NotificationService } from "./notificationService";

async function getClassDurationThreshold(db: ReturnType<typeof getDb>): Promise<number> {
  const setting = await db.query.systemSettings.findFirst({ where: eq(systemSettings.key, "class_duration_threshold") });
  return setting ? parseInt(setting.value) || 20 : 20;
}

export async function evaluateClassCompletion(classId: number) {
  const db = getDb();
  
  // 1. Fetch class details
  const cls = await db.query.classes.findFirst({
    where: eq(classes.id, classId)
  });
  
  if (!cls) return;

  // 2. Fetch all events for this class
  const events = await db.select().from(attendanceEvents).where(eq(attendanceEvents.classId, classId)).orderBy(attendanceEvents.timestamp);
  
  // Calculate duration per user
  const userDurations: Record<number, number> = {};
  const activeSessions: Record<number, Date> = {};

  for (const event of events) {
    const uid = event.userId;
    if (event.eventType === "join") {
      if (!activeSessions[uid]) {
        activeSessions[uid] = event.timestamp;
      }
    } else if (event.eventType === "leave") {
      if (activeSessions[uid]) {
        const diffMs = event.timestamp.getTime() - activeSessions[uid].getTime();
        const diffMins = diffMs / 60000;
        userDurations[uid] = (userDurations[uid] || 0) + diffMins;
        delete activeSessions[uid]; // End this session block
      }
    }
  }

  // If the class ended, anyone still "active" gets duration calculated until class endedAt (or now)
  const classEndTime = cls.endedAt || new Date();
  for (const uid in activeSessions) {
    const diffMs = classEndTime.getTime() - activeSessions[uid].getTime();
    const diffMins = diffMs / 60000;
    userDurations[uid] = (userDurations[uid] || 0) + diffMins;
  }

  // 3. Determine if teacher met the configurable duration threshold
  const durationThreshold = await getClassDurationThreshold(db);
  const teacherId = cls.teacherId;
  const teacherDuration = userDurations[teacherId] || 0;
  const teacherValid = teacherDuration >= durationThreshold;

  // 4. Determine student validities and create Ledger Debits
  const students = Object.keys(userDurations)
    .map(Number)
    .filter(id => id !== teacherId);

  for (const studentId of students) {
    const duration = userDurations[studentId] || 0;
    const studentValid = duration >= durationThreshold;
    
    let finalStatus: "present" | "absent" = "absent";
    if (teacherValid && studentValid) {
      finalStatus = "present";
    }
    
    // Upsert attendance record
    const [existingAtt] = await db.select().from(attendance).where(and(eq(attendance.classId, classId), eq(attendance.studentId, studentId)));
    if (existingAtt) {
      await db.update(attendance).set({
        status: finalStatus,
        joinedAt: events.find((e: any) => e.userId === studentId && e.eventType === "join")?.timestamp,
        leftAt: events.slice().reverse().find((e: any) => e.userId === studentId && e.eventType === "leave")?.timestamp || classEndTime,
        duration: Math.floor(duration),
      }).where(eq(attendance.id, existingAtt.id));
    } else {
      await db.insert(attendance).values({
        classId,
        studentId: studentId,
        status: finalStatus,
        joinedAt: events.find((e: any) => e.userId === studentId && e.eventType === "join")?.timestamp,
        leftAt: events.slice().reverse().find((e: any) => e.userId === studentId && e.eventType === "leave")?.timestamp || classEndTime,
        duration: Math.floor(duration),
      });
    }

    // Process Ledger Debit ONLY if they were present (both teacher & student >= 20 mins)
    if (finalStatus === "present") {
      // Find active enrollment
      const [enrollment] = await db.select().from(batchEnrollments).where(and(
        eq(batchEnrollments.studentId, studentId),
        eq(batchEnrollments.status, "active") // assuming they are active
      )).limit(1);

      if (enrollment) {
        // Check if ledger already debited for this class
        const [existingLedger] = await db.select().from(classLedgerTransactions).where(and(
          eq(classLedgerTransactions.studentId, studentId),
          eq(classLedgerTransactions.referenceClassId, classId),
          eq(classLedgerTransactions.type, "debit")
        ));
        
        if (!existingLedger) {
          await db.insert(classLedgerTransactions).values({
            studentId,
            enrollmentId: enrollment.id,
            type: "debit",
            amount: 1, // 1 class credit
            referenceClassId: classId,
            remarks: `Class ${classId} completed`,
          });
          
          // Also set validityEndDate if this is the FIRST class (and not Rejoin)
          if (!enrollment.isRejoin) {
            const [profile] = await db.select().from(profiles).where(eq(profiles.userId, studentId));
            if (profile && !profile.validityEndDate) {
              const allocated = profile.totalAllocatedSessions || 0;
              const daysValid = allocated * 2; // double the applicable number of classes
              const validityDate = new Date();
              validityDate.setDate(validityDate.getDate() + daysValid);
              
              await db.update(profiles).set({
                validityEndDate: validityDate
              }).where(eq(profiles.id, profile.id));
            }
          }
        }
      }
    }
  }

  // Calculate remuneration if teacher met the rule
  if (teacherValid) {
    const monthStr = classEndTime.toISOString().substring(0, 7);
    await recalculateSalaryInternal(db, teacherId, monthStr);
  }

  // 5. Post-Class Followups: Auto-message absentees
  // Find all batches for this class
  const cbList = await db.select({ batchId: classBatches.batchId }).from(classBatches).where(eq(classBatches.classId, classId));
  const classBatchIds = Array.from(new Set([cls.batchId, ...cbList.map(x => x.batchId)].filter(Boolean)));

  // Find all active enrollments for these batches
  const activeEnrollments = await db.query.batchEnrollments.findMany({
    where: and(
      inArray(batchEnrollments.batchId, classBatchIds),
      eq(batchEnrollments.status, "active")
    ),
    with: { student: true }
  });

  // Find who was marked present in attendance
  const presents = await db.select({ studentId: attendance.studentId }).from(attendance)
    .where(and(eq(attendance.classId, classId), eq(attendance.status, "present")));
  const presentSet = new Set(presents.map(p => p.studentId));

  // Send notifications to those not present
  for (const enr of activeEnrollments) {
    if (!presentSet.has(enr.studentId) && enr.student) {
      await NotificationService.dispatch({
        userId: enr.studentId,
        phone: enr.student.phone || undefined,
        email: enr.student.email || undefined,
        subject: "Missed Class Notification",
        message: `Hi ${enr.student.name}, we missed you in today's class "${cls.title}". If you face any issues joining, please let us know.`,
        type: "missed_class",
        channels: ["in_app", "email", "whatsapp", "sms"] // Let the service handle enabled/disabled ones
      });

      // Also check consecutive absences threshold
      const absentSetting = await db.query.systemSettings.findFirst({ where: eq(systemSettings.key, "absent_consecutive_threshold") });
      const absentThreshold = absentSetting ? parseInt(absentSetting.value) || 7 : 7;

      // Find last N attendance records for this student
      const lastN = await db.select({ status: attendance.status })
        .from(attendance)
        .where(eq(attendance.studentId, enr.studentId))
        .orderBy(sql`${attendance.id} DESC`)
        .limit(absentThreshold);

      if (lastN.length === absentThreshold && lastN.every((r: any) => r.status === "absent")) {
        await NotificationService.dispatch({
          userId: enr.studentId,
          subject: "Absence Alert",
          message: `You have been absent for ${absentThreshold} consecutive classes. Please reach out if you need assistance.`,
          type: "absence_alert",
          channels: ["in_app", "email", "sms"]
        });

        const adminIds = (await db.query.users.findMany({ where: inArray(users.role, ["super_admin", "admin", "academic_head"]) })).map((u: any) => u.id);
        for (const adminId of adminIds) {
          await NotificationService.dispatch({
            userId: adminId,
            subject: "Student Absence Alert",
            message: `Student ${enr.student.name} has been absent for ${absentThreshold} consecutive classes.`,
            type: "absence_alert",
            channels: ["in_app"]
          });
        }
      }
    }
  }
}
