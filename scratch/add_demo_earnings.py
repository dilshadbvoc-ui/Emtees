import re

file_path = "client/src/lms-pages/Salaries.tsx"

with open(file_path, "r") as f:
    content = f.read()

demo_row = """                        <TableRow>
                          <TableCell className="font-medium text-gray-800 py-1 text-xs">Demo Class Bonus</TableCell>
                          <TableCell className="text-right font-medium text-gray-800 py-1 text-xs">₹{parseFloat(activeStatement.demoBonusAmount || "0").toLocaleString("en-IN")}</TableCell>
                        </TableRow>"""

# We want to insert the demo_row after the One-To-One Earnings row, which is:
#                         <TableRow>
#                           <TableCell className="font-medium text-gray-800 py-1 text-xs">One-To-One Earnings</TableCell>
#                           <TableCell className="text-right font-medium text-gray-800 py-1 text-xs">
#                             ₹{(
#                               ...
#                             ).toLocaleString("en-IN")}
#                           </TableCell>
#                         </TableRow>

# We can find this by matching the TableRow before Total Salary.
content = re.sub(
    r'(</TableRow>)\s*(<TableRow className="bg-gray-50/50">)',
    r'\1\n' + demo_row + r'\n\2',
    content
)

with open(file_path, "w") as f:
    f.write(content)

print("Replacement complete.")
