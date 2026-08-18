import re
import sys

file_path = "client/src/lms-pages/Salaries.tsx"

with open(file_path, "r") as f:
    content = f.read()

# 1. State Variable
content = content.replace(
    "const [oneToOne60MinRate, setOneToOne60MinRate] = useState<number>(0);",
    "const [oneToOne60MinRate, setOneToOne60MinRate] = useState<number>(0);\n  const [demoBaseRate, setDemoBaseRate] = useState<number>(0);"
)

# 2. configQuery.data
content = content.replace(
    "setOneToOne60MinRate(parseFloat(configQuery.data.oneToOne60MinRate) || 0);",
    "setOneToOne60MinRate(parseFloat(configQuery.data.oneToOne60MinRate) || 0);\n      setDemoBaseRate(parseFloat(configQuery.data.demoBaseRate) || 0);"
)

# 3. submit payload
content = content.replace(
    "oneToOne60MinRate\n    });",
    "oneToOne60MinRate,\n      demoBaseRate\n    });"
)

# 4. reset config
content = content.replace(
    "setOneToOne60MinRate(0);\n          }",
    "setOneToOne60MinRate(0);\n            setDemoBaseRate(0);\n          }"
)

# 5. UI form
form_injection = """                    <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                      <Label htmlFor="demo-base-rate" className="text-left text-xs font-medium text-gray-700">Demo Class Base Rate</Label>
                      <div className="col-span-2 relative">
                        <span className="absolute left-3 top-1.5 text-gray-400 text-xs">₹</span>
                        <Input 
                          id="demo-base-rate" 
                          type="number" 
                          value={demoBaseRate} 
                          onChange={(e) => setDemoBaseRate(parseFloat(e.target.value) || 0)} 
                          className="pl-7 h-8 text-sm bg-white border border-gray-200"
                        />
                      </div>
                    </div>"""
content = re.sub(
    r'(<div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">\s*<Label htmlFor="oto-60min"[\s\S]*?</div>\s*</div>)',
    r'\1\n' + form_injection,
    content,
    count=1
)

with open(file_path, "w") as f:
    f.write(content)

print("Replacement complete.")
