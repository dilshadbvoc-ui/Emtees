import { getDb } from "./src/queries/connection";
import { fetchFullStudentReportData, fetchFullTeacherReportData } from "./src/routers/admin";

async function run() {
  const db = getDb();
  console.log("Testing student report...");
  try {
    const s = await fetchFullStudentReportData(db, 1);
    console.log("Student report success.");
  } catch (e: any) {
    console.error("Student report error:", e.message);
  }

  console.log("Testing teacher report...");
  try {
    const t = await fetchFullTeacherReportData(db, 2);
    console.log("Teacher report success.");
  } catch (e: any) {
    console.error("Teacher report error:", e.message);
  }
  
  process.exit(0);
}
run();
