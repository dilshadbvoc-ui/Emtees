import re

file_path = "server/src/routers/salesExecutive.ts"

with open(file_path, "r") as f:
    content = f.read()

# 1. Add import
if "recalculateSalaryInternal" not in content:
    content = content.replace('import { getDb } from "../queries/connection";', 
                              'import { getDb } from "../queries/connection";\nimport { recalculateSalaryInternal } from "./admin";')

# 2. Add recalculation inside completeDemoClass
recalc_code = """      }).where(eq(demoClasses.id, input.id));

      // Trigger salary recalculation for the teacher
      const month = demo.scheduledAt 
        ? new Date(demo.scheduledAt).toISOString().slice(0, 7)
        : new Date().toISOString().slice(0, 7);
      await recalculateSalaryInternal(db, demo.teacherId, month, true).catch(e => console.error("Failed to recalculate salary on demo complete:", e));

      return { success: true };"""

content = content.replace("      }).where(eq(demoClasses.id, input.id));\n\n      return { success: true };", recalc_code)

with open(file_path, "w") as f:
    f.write(content)

print("Patch applied to salesExecutive.ts")
