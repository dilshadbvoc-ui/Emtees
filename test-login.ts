import { db } from "./server/src/db";
import { users } from "./server/src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function main() {
  const allStudents = await db.query.users.findMany({
    where: eq(users.role, "student"),
    orderBy: (users, { desc }) => [desc(users.id)],
    limit: 5,
  });
  
  for (const s of allStudents) {
    console.log(`ID: ${s.id}, Username: ${s.username}, UnionId: ${s.unionId}, PassHashed: ${s.password ? "Yes" : "No"}`);
  }
}

main().catch(console.error);
