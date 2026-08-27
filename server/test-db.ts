import { getDb } from './src/queries/connection';
import * as schema from './db/schema';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const db = getDb();
  const result = await db.select({
    id: schema.profiles.id,
    userId: schema.profiles.userId,
    course: schema.profiles.course,
    moduleId: schema.profiles.moduleId,
  }).from(schema.profiles).limit(10);
  console.log(result);
  process.exit(0);
}
run();
