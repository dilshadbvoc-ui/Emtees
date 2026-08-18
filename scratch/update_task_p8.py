import re

file_path = "/Users/retro/.gemini/antigravity-ide/brain/a9191a8f-07c7-4a51-9033-04d76ff18858/task.md"

with open(file_path, "r") as f:
    content = f.read()

# Mark Phase 8 done
content = content.replace("- [ ] Add \"Teacher Report\" tab", "- [x] Add \"Teacher Report\" tab")
content = content.replace("- [ ] Teacher selector + date range", "- [x] Teacher selector + date range")
content = content.replace("- [ ] Per-student attendance table", "- [x] Per-student attendance table")
content = content.replace("- [ ] Totals row", "- [x] Totals row")
content = content.replace("- [ ] Add \"Daily Report\" tab", "- [x] Add \"Daily Report\" tab")
content = content.replace("- [ ] Date picker", "- [x] Date picker")
content = content.replace("- [ ] All teachers table", "- [x] All teachers table")

with open(file_path, "w") as f:
    f.write(content)

print("Tasks Phase 8 updated.")
