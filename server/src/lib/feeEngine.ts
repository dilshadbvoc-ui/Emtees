import { eq, and } from "drizzle-orm";
import { profiles, batchEnrollments, modules } from "@db/schema";

export async function recalculateStudentFees(db: any, studentId: number) {
  const enrollments = await db.query.batchEnrollments.findMany({
    where: and(
      eq(batchEnrollments.studentId, studentId),
      eq(batchEnrollments.status, "active")
    ),
    with: {
      batch: {
        with: {
          module: true,
        },
      },
    },
  });

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, studentId),
  });

  let totalFees = 0;
  if (enrollments && enrollments.length > 0) {
    const moduleFees = new Map<number, number>();
    for (const e of enrollments) {
      if (e.batch?.module) {
        moduleFees.set(
          e.batch.module.id,
          parseFloat(e.batch.module.fees ?? "0")
        );
      }
    }
    totalFees = Array.from(moduleFees.values()).reduce(
      (sum, fee) => sum + fee,
      0
    );
  } else if (profile?.course) {
    const matchedModule = await db.query.modules.findFirst({
      where: eq(modules.name, profile.course),
    });
    if (matchedModule) {
      totalFees = parseFloat(matchedModule.fees ?? "0");
    }
  }

  if (profile) {
    const discount = parseFloat(profile.discount ?? "0");
    const feesPaid = parseFloat(profile.feesPaid ?? "0");
    const feesBalance = totalFees - discount - feesPaid;

    await db
      .update(profiles)
      .set({
        feesTotal: String(totalFees),
        feesBalance: String(feesBalance),
      })
      .where(eq(profiles.userId, studentId));
  }
}
