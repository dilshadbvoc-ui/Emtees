import re

file_path = "server/src/lib/classEngine.ts"

with open(file_path, "r") as f:
    content = f.read()

# Fix inArray null issue
content = content.replace(
    'const classBatchIds = Array.from(new Set([cls.batchId, ...cbList.map(x => x.batchId)]));',
    'const classBatchIds = Array.from(new Set([cls.batchId, ...cbList.map(x => x.batchId)].filter(Boolean)));'
)

# Insert absent_consecutive_threshold check after sending "missed_class" notification
consecutive_logic = """      // Also check consecutive absences threshold
      const absentSetting = await db.query.systemSettings.findFirst({ where: eq(systemSettings.key, "absent_consecutive_threshold") });
      const absentThreshold = absentSetting ? parseInt(absentSetting.value) || 7 : 7;

      // Find last N attendance records for this student
      const lastN = await db.select({ status: attendance.status })
        .from(attendance)
        .where(eq(attendance.studentId, enr.studentId))
        .orderBy(sql`${attendance.id} DESC`)
        .limit(absentThreshold);

      if (lastN.length === absentThreshold && lastN.every((r: any) => r.status === "absent")) {
        await NotificationService.dispatch({
          userId: enr.studentId,
          subject: "Absence Alert",
          message: `You have been absent for ${absentThreshold} consecutive classes. Please reach out if you need assistance.`,
          type: "absence_alert",
          channels: ["in_app", "email", "sms"]
        });

        const adminIds = (await db.query.users.findMany({ where: inArray(users.role, ["super_admin", "admin", "academic_head"]) })).map((u: any) => u.id);
        for (const adminId of adminIds) {
          await NotificationService.dispatch({
            userId: adminId,
            subject: "Student Absence Alert",
            message: `Student ${enr.student.name} has been absent for ${absentThreshold} consecutive classes.`,
            type: "absence_alert",
            channels: ["in_app"]
          });
        }
      }"""

content = content.replace(
    'channels: ["in_app", "email", "whatsapp", "sms"] // Let the service handle enabled/disabled ones\n      });\n    }',
    'channels: ["in_app", "email", "whatsapp", "sms"] // Let the service handle enabled/disabled ones\n      });\n\n' + consecutive_logic + '\n    }'
)

with open(file_path, "w") as f:
    f.write(content)

print("Patch applied to classEngine.ts")
