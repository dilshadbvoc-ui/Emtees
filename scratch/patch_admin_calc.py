import re

file_path = "server/src/routers/admin.ts"

with open(file_path, "r") as f:
    content = f.read()

# 1. Fetch completed demo classes
fetch_demos = """  // Fetch completed demo classes for this teacher in the month
  const demoClassesList = await db.select({
      id: demoClasses.id,
      scheduledAt: demoClasses.scheduledAt
    })
    .from(demoClasses)
    .where(and(
      eq(demoClasses.teacherId, teacherId),
      eq(demoClasses.status, "completed"),
      sql`TO_CHAR(${demoClasses.updatedAt}, 'YYYY-MM') = ${month}`
    ));
    
  const demoCount = demoClassesList.length;
  const demoBaseRate = config ? parseFloat(config.demoBaseRate) : 0;
  const demoBaseEarnings = demoCount * demoBaseRate;

  // 5b. Calculate Demo Conversion Bonus"""

content = content.replace("  // 5b. Calculate Demo Conversion Bonus", fetch_demos)

# 2. Add demoBaseEarnings to netSalary
content = content.replace(
    "const netSalary = basicSalary + sessionEarnings + demoBonusAmount;",
    "const netSalary = basicSalary + sessionEarnings + demoBaseEarnings + demoBonusAmount;"
)

with open(file_path, "w") as f:
    f.write(content)

print("Patch complete.")
