const { Pool } = require("pg");
require("dotenv").config({ path: ".env" });

async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  try {
    const res = await pool.query("SELECT count(*) FROM departments");
    console.log("Departments count:", res.rows[0].count);
    const res2 = await pool.query("SELECT count(*) FROM department_teachers");
    console.log("Department teachers count:", res2.rows[0].count);
  } catch (err) {
    console.error("DB Error:", err.message);
  } finally {
    pool.end();
  }
}
run();
