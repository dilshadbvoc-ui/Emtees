import { getDb } from './src/queries/connection';
async function run() {
  const db = getDb();
  const modules = await db.query.modules.findMany();
  console.log("All modules:");
  console.log(modules.map(m => ({ id: m.id, name: m.name })));
  
  const depts = await db.query.departments.findMany({
    with: { departmentModules: true },
  });
  console.log("Departments and their modules:");
  console.log(depts.map(d => ({
    name: d.name,
    modules: d.departmentModules.map(dm => dm.moduleId)
  })));
  process.exit(0);
}
run();
