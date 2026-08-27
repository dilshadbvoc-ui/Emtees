import { getDb } from "../src/queries/connection.js";
import { profiles, users, modules } from "./schema.js";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";
dotenv.config();

async function run() {
  const db = getDb();
  
  const allProfiles = await db.select({
    userId: profiles.userId,
    course: profiles.course,
    moduleId: profiles.moduleId
  }).from(profiles).limit(10);
  
  console.log("Sample profiles:", allProfiles);

  const allModules = await db.select().from(modules);
  console.log("All modules:", allModules.map(m => ({ id: m.id, name: m.name })));
  
  let count = 0;
  
  const fullProfiles = await db.select({
    userId: profiles.userId,
    course: profiles.course,
    moduleId: profiles.moduleId
  }).from(profiles);

  for (const p of fullProfiles) {
    if (!p.moduleId && p.course) {
      const match = allModules.find(m => m.name.toLowerCase() === p.course?.toLowerCase());
      if (match) {
        await db.update(profiles).set({ moduleId: match.id }).where(eq(profiles.userId, p.userId));
        count++;
      }
    }
  }
  
  console.log(`Updated ${count} profiles by matching course name.`);
  
  process.exit(0);
}
run().catch(console.error);
