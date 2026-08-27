import { getDb } from "../src/queries/connection.js";
import { users } from "./schema.js";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";
dotenv.config();

async function run() {
  const db = getDb();
  
  const list = await db.query.users.findMany({
    where: eq(users.role, "student"),
    with: { profile: true },
    limit: 10
  });
  
  console.log("Students from list query:");
  for (const u of list) {
    console.log(`- ${u.name} (ID: ${u.id})`);
    console.log(`  Profile moduleId:`, (u.profile as any)?.moduleId);
  }
  process.exit(0);
}
run().catch(console.error);
