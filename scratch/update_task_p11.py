import re

file_path = "/Users/retro/.gemini/antigravity-ide/brain/a9191a8f-07c7-4a51-9033-04d76ff18858/task.md"

with open(file_path, "r") as f:
    content = f.read()

# Mark Phase 10 done
content = content.replace("- [ ] Add `/departments` route to `App.tsx`", "- [x] Add `/departments` route to `App.tsx`")
content = content.replace("- [ ] Add \"Departments\" to admin navItems in `Layout.tsx`", "- [x] Add \"Departments\" to admin navItems in `Layout.tsx`")
content = content.replace("- [ ] Add `academic_head` portal nav items", "- [x] Add `academic_head` portal nav items")

# Mark Phase 11 partial done
content = content.replace("- [ ] `npm run build` (client)", "- [x] `npm run build` (client)")
content = content.replace("- [ ] `npm run build` (server)", "- [x] `npm run build` (server)")

with open(file_path, "w") as f:
    f.write(content)

print("Tasks Phase 10 and 11 updated.")
