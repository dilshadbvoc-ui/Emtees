import { getDb } from './src/queries/connection.js';
import { studentClassAllocations, users } from './db/schema.js';
import { eq } from 'drizzle-orm';

async function run() {
  const db = getDb();
  
  // Find a student
  const student = await db.query.users.findFirst({
    where: eq(users.role, 'student')
  });

  if (!student) {
    console.log("No student found");
    return;
  }

  console.log(`Found student: ${student.id} ${student.name}`);

  // Try fetching current alloc
  const currentAlloc = await db.query.studentClassAllocations.findFirst({
    where: eq(studentClassAllocations.studentId, student.id)
  });

  console.log("Current alloc for student:", JSON.stringify(currentAlloc, null, 2));

  // Try all studentClassAllocations
  const all = await db.query.studentClassAllocations.findMany();
  console.log(`Total alloc records: ${all.length}`);
}

run().catch(console.error).then(() => process.exit(0));
