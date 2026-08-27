import { getDb } from './src/queries/connection';
async function run() {
  const db = getDb();
  const depts = await db.query.departments.findMany({
    with: { departmentModules: true },
  });
  console.log(depts.map(d => ({
    id: d.id,
    name: d.name,
    modules: d.departmentModules.map(dm => dm.moduleId)
  })));
  process.exit(0);
}
run();
