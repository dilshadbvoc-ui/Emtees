import { getDb } from "./server/src/queries/connection";

async function main() {
  const db = getDb();
  const depts = await db.query.departments.findMany({
    with: {
      head: { columns: { id: true, username: true, name: true } },
      departmentModules: {
        with: { module: { columns: { id: true, name: true } } },
      },
      departmentTeachers: {
        with: { teacher: { columns: { id: true, name: true } } },
      },
    },
  });
  console.log("Success", depts.length);
}

main().catch(console.error);
