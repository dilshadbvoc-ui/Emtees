import re

file_path = "server/src/routers/admin.ts"

with open(file_path, "r") as f:
    content = f.read()

old_logic = """  if (demoConversionBonusRate > 0) {
    const closuresInMonth = await db.select({
        studentId: salesClosures.studentId,
        admNo: salesClosures.admNo,
        closingDate: salesClosures.closingDate
      })
      .from(salesClosures)
      .where(and(
        eq(salesClosures.isDeleted, false),
        sql`TO_CHAR(${salesClosures.closingDate}, 'YYYY-MM') = ${month}`
      ));
      
    for (const closure of closuresInMonth) {
      let sId = closure.studentId;
      if (!sId && closure.admNo) {
        const student = await db.query.users.findFirst({ where: eq(users.username, closure.admNo) });
        if (student) sId = student.id;
      }
      
      if (sId) {
        // Find if this teacher took a 1-on-1 session with this student BEFORE the closure
        const demo = await db.query.oneToOneSessions.findFirst({
          where: and(
            eq(oneToOneSessions.studentId, sId),
            eq(oneToOneSessions.teacherId, teacherId),
            eq(oneToOneSessions.status, "completed"),
            lte(oneToOneSessions.scheduledAt, closure.closingDate)
          )
        });
        if (demo) {
          demoConversionCount++;
        }
      }
    }
  }"""

new_logic = """  if (demoConversionBonusRate > 0) {
    const convertedDemos = await db.select({
        id: demoClasses.id
      })
      .from(demoClasses)
      .where(and(
        eq(demoClasses.teacherId, teacherId),
        eq(demoClasses.status, "completed"),
        eq(demoClasses.convertedToEnrollment, true),
        sql`TO_CHAR(${demoClasses.scheduledAt}, 'YYYY-MM') = ${month}`
      ));
      
    demoConversionCount = convertedDemos.length;
  }"""

if old_logic in content:
    content = content.replace(old_logic, new_logic)
    with open(file_path, "w") as f:
        f.write(content)
    print("Patch successful!")
else:
    print("Failed to find the old logic.")
