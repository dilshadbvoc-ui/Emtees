import { appRouter } from './src/router';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const ctx = {
    user: { id: 85, role: "academic_head" } // HINDI ONE TO ONE head
  };
  
  const caller = appRouter.createCaller(ctx as any);
  
  try {
    const students = await caller.department.getMyStudents();
    console.log(`Found ${students.length} students`);
    console.log(students.slice(0, 3));
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
