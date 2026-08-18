import "dotenv/config";
import { fetchFullTeacherReportData } from './src/routers/admin';

async function run() {
  try {
    const data = await fetchFullTeacherReportData(15);
    console.log("Students List length:", data.studentsList?.length);
    console.log("Students List:", JSON.stringify(data.studentsList, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
