import re

file_path = "/Users/retro/.gemini/antigravity-ide/brain/a9191a8f-07c7-4a51-9033-04d76ff18858/task.md"

with open(file_path, "r") as f:
    content = f.read()

# Mark Phase 2 done
content = content.replace("- [ ] Seed `class_duration_threshold`", "- [x] Seed `class_duration_threshold`")
content = content.replace("- [ ] Update `classEngine.ts` to read threshold", "- [x] Update `classEngine.ts` to read threshold")
content = content.replace("- [ ] Update `classes.ts` line 1853", "- [x] Update `classes.ts` line 1853")

# Mark Phase 9 done
content = content.replace("- [ ] Add \"Academic Rules\" section to `Settings.tsx`", "- [x] Add \"Academic Rules\" section to `Settings.tsx`")
content = content.replace("- [ ] Class duration threshold input", "- [x] Class duration threshold input")
content = content.replace("- [ ] Consecutive absence alert threshold input", "- [x] Consecutive absence alert threshold input")

with open(file_path, "w") as f:
    f.write(content)

print("Tasks Phase 2 and 9 updated.")
