import { getDb } from "./src/queries/connection.js";
import { attendance, classes, users } from "./db/schema.js";
import { eq, and, sql } from "drizzle-orm";

async function run() {
  const db = getDb();
  console.log("Testing leaderboard query...");
  try {
    const students = await db.query.users.findMany({
      where: eq(users.role, "student"),
    });

    const results = [];
    for (const student of students) {
      const attendanceRecords = await db.query.attendance.findMany({
        where: eq(attendance.studentId, student.id),
      });
      const total = attendanceRecords.length;
      const present = attendanceRecords.filter((a) => a.status === "present").length;
      const attendancePct = total > 0 ? Math.round((present / total) * 100) : 0;

      const chatActivity = attendanceRecords.reduce((sum, r) => sum + (r.chatCount ?? 0), 0);
      const compositeScore = attendancePct + chatActivity;

      results.push({
        id: student.id,
        name: student.name,
        attendancePct,
        chatActivity,
        compositeScore,
      });
    }

    console.log("Leaderboard success.", results.length);
  } catch (e: any) {
    console.error("Leaderboard error:", e.message);
  }
  
  process.exit(0);
}
run();
