import re

file_path = "client/src/lms-pages/Salaries.tsx"

with open(file_path, "r") as f:
    content = f.read()

# 1. Add "Demo Classes" to the Breakdown table (which lists One-To-One Sessions, etc.)
demo_breakdown = """                        <TableRow>
                          <TableCell className="font-medium text-gray-800 py-1 text-xs">Demo Classes</TableCell>
                          <TableCell className="text-center text-gray-600 py-1 text-xs">{activeStatement.demoCount || 0}</TableCell>
                          <TableCell className="text-center text-gray-500 py-1 text-xs">₹{parseFloat(activeStatement.demoBaseRate || "0").toLocaleString("en-IN")}</TableCell>
                          <TableCell className="text-right font-medium text-gray-800 py-1 text-xs">₹{((activeStatement.demoCount || 0) * parseFloat(activeStatement.demoBaseRate || "0")).toLocaleString("en-IN")}</TableCell>
                        </TableRow>"""

# Find One-To-One 60 min row:
#                           <TableCell className="text-center text-gray-600 py-1 text-xs">{activeStatement.oneToOne60MinCount || 0}</TableCell>
#                           <TableCell className="text-center text-gray-500 py-1 text-xs">₹{parseFloat(activeStatement.oneToOne60MinRate || "0").toLocaleString("en-IN")}</TableCell>
#                           <TableCell className="text-right font-medium text-gray-800 py-1 text-xs">₹{((activeStatement.oneToOne60MinCount || 0) * parseFloat(activeStatement.oneToOne60MinRate || "0")).toLocaleString("en-IN")}</TableCell>
#                         </TableRow>

# We can replace the end of the One-To-One row with itself + the demo_breakdown
content = re.sub(
    r'(<TableCell className="text-right font-medium text-gray-800 py-1 text-xs">₹\{\(\(activeStatement\.oneToOne60MinCount \|\| 0\) \* parseFloat\(activeStatement\.oneToOne60MinRate \|\| "0"\)\)\.toLocaleString\("en-IN"\)\}</TableCell>\n\s*</TableRow>)',
    r'\1\n' + demo_breakdown,
    content
)

# 2. Add "Demo Class Earnings" to the Final Calculation table
demo_final_calc = """                        <TableRow>
                          <TableCell className="font-medium text-gray-800 py-1 text-xs">Demo Class Earnings</TableCell>
                          <TableCell className="text-right font-medium text-gray-800 py-1 text-xs">
                            ₹{((activeStatement.demoCount || 0) * parseFloat(activeStatement.demoBaseRate || "0")).toLocaleString("en-IN")}
                          </TableCell>
                        </TableRow>"""

# We can find "Demo Class Bonus" row and insert BEFORE it
content = re.sub(
    r'(<TableRow>\n\s*<TableCell className="font-medium text-gray-800 py-1 text-xs">Demo Class Bonus</TableCell>)',
    demo_final_calc + r'\n\1',
    content
)

with open(file_path, "w") as f:
    f.write(content)

print("Replacement complete.")
