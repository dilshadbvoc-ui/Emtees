import { appRouter } from "./server/src/router";
import { getDb } from "./server/src/db/connection";
import { users } from "./server/src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const db = getDb();
  const ctx = { req: {} as any, res: {} as any, user: null, ip: "127.0.0.1" };
  const caller = appRouter.createCaller(ctx);

  try {
    const regRes = await caller.salesExecutive.registerStudentWithReferral({
      name: "Test Login",
      phone: "1231231235",
      username: "testlogin123",
      password: "password123",
      courseId: 1,
      preferredClassTime: "Morning",
      referralCode: "AM33",
      paymentOption: "full_payment"
    });
    console.log("Registered:", regRes);

    const loginRes = await caller.auth.login({
      username: "testlogin123",
      password: "password123",
    });
    console.log("Login Success:", loginRes.user.username);
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}
main().then(() => process.exit(0));
