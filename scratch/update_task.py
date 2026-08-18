import re

file_path = "/Users/retro/.gemini/antigravity-ide/brain/a9191a8f-07c7-4a51-9033-04d76ff18858/task.md"

with open(file_path, "r") as f:
    content = f.read()

# Mark Phase 4 done
content = content.replace("- [ ] Add demo class procedures to `salesExecutive.ts`", "- [x] Add demo class procedures to `salesExecutive.ts`")
content = content.replace("- [ ] `createDemoClass`", "- [x] `createDemoClass`")
content = content.replace("- [ ] `listDemoClasses`", "- [x] `listDemoClasses`")
content = content.replace("- [ ] `completeDemoClass`", "- [x] `completeDemoClass`")
content = content.replace("- [ ] `getAvailableTeachers`", "- [x] `getAvailableTeachers`")
content = content.replace("- [ ] `getDemoJoinToken`", "- [x] `getDemoJoinToken`")

# Mark Phase 5 done
content = content.replace("- [ ] Verify demoBaseRate in salary config UI", "- [x] Verify demoBaseRate in salary config UI")
content = content.replace("- [ ] Add `getDailyTeacherReport`", "- [x] Add `getDailyTeacherReport`")
content = content.replace("- [ ] Add `getTeacherStudentWiseReport`", "- [x] Add `getTeacherStudentWiseReport`")

# Mark Phase 7 done
content = content.replace("- [ ] Update `SalesDashboard.tsx` or create `SalesDemoClasses.tsx`", "- [x] Update `SalesDashboard.tsx` or create `SalesDemoClasses.tsx`")
content = content.replace("- [ ] \"Book Demo Class\" button", "- [x] \"Book Demo Class\" button")
content = content.replace("- [ ] Select teacher", "- [x] Select teacher")
content = content.replace("- [ ] Enter student name/phone/email", "- [x] Enter student name/phone/email")
content = content.replace("- [ ] Copy enrollment link", "- [x] Copy enrollment link")
content = content.replace("- [ ] List of past demo classes", "- [x] List of past demo classes")

# Mark Phase 10 partial
content = content.replace("- [ ] Add `/sales-management/demo-classes` route", "- [x] Add `/sales-management/demo-classes` route")
content = content.replace("- [ ] Add \"Demo Classes\" to salesNav", "- [x] Add \"Demo Classes\" to salesNav")

with open(file_path, "w") as f:
    f.write(content)

print("Tasks updated.")
