const { getDb } = require('./dist/queries/connection');
const { fetchFullStudentReportData, fetchFullTeacherReportData } = require('./dist/routers/admin');

async function run() {
  const db = getDb();
  console.log("Testing student report...");
  try {
    const s = await fetchFullStudentReportData(db, 1);
    console.log("Student report success.");
  } catch (e) {
    console.error("Student report error:", e);
  }

  console.log("Testing teacher report...");
  try {
    const t = await fetchFullTeacherReportData(db, 2);
    console.log("Teacher report success.");
  } catch (e) {
    console.error("Teacher report error:", e);
  }
  
  process.exit(0);
}
run();
