const { Pool } = require("pg");
require("dotenv").config({ path: ".env" });

async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "department_teachers" (
        "id" serial PRIMARY KEY NOT NULL,
        "department_id" bigint NOT NULL,
        "teacher_id" bigint NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    
    // Check if constraint exists before adding to avoid error
    const constraintCheck = await pool.query(`
      SELECT conname FROM pg_constraint WHERE conname = 'department_teachers_department_id_departments_id_fk'
    `);
    if (constraintCheck.rows.length === 0) {
      await pool.query(`
        ALTER TABLE "department_teachers" ADD CONSTRAINT "department_teachers_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;
      `);
    }

    const constraintCheck2 = await pool.query(`
      SELECT conname FROM pg_constraint WHERE conname = 'department_teachers_teacher_id_users_id_fk'
    `);
    if (constraintCheck2.rows.length === 0) {
      await pool.query(`
        ALTER TABLE "department_teachers" ADD CONSTRAINT "department_teachers_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
      `);
    }

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "unique_dept_teacher_idx" ON "department_teachers" USING btree ("department_id","teacher_id");
    `);

    console.log("DB Fixed successfully!");
  } catch (err) {
    console.error("DB Error:", err.message);
  } finally {
    pool.end();
  }
}
run();
