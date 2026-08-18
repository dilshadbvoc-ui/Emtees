import pg from "pg";
import { config } from "dotenv";
config();

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const query = `insert into "one_to_one_sessions" ("id", "teacher_id", "student_id", "class_id", "title", "remarks", "created_by", "session_length", "scheduled_at", "session_status", "started_at", "ended_at", "actual_duration", "teacher_duration", "student_duration", "teacher_attendance", "student_attendance", "meeting_room_id", "meeting_url", "reminder_1day_sent_at", "reminder_1hour_sent_at", "reminder_10min_sent_at", "valid_from", "valid_until", "completed_at", "recording_url", "recording_deleted_at", "created_at") values (default, $1, $2, default, $3, default, $4, $5, $6, $7, default, default, default, default, default, default, default, $8, $9, default, default, default, default, default, default, default, default, default)`;
    const values = [21, 23, "1-to-1 Session", 1, 30, "2026-08-19T17:27:00.000Z", "scheduled", "c5584401-8bee-499e-8ead-0e4237513e5a", "https://meet.emteesacademy.com/c5584401-8bee-499e-8ead-0e4237513e5a"];
    await pool.query(query, values);
    console.log("Success");
  } catch(e) {
    console.error("PG ERROR:", e);
  }
  process.exit(0);
}
main();
