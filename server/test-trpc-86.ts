import { appRouter } from './src/router';
import * as dotenv from 'dotenv';
dotenv.config();
async function run() {
  const caller = appRouter.createCaller({ user: { id: 86, role: "academic_head" } } as any);
  try {
    const students = await caller.department.getMyStudents();
    console.log(`Head 86: Found ${students.length} students`);
  } catch(e) { console.error(e); }
  process.exit(0);
}
run();
