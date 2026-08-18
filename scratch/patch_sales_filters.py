import re

file_path = "server/src/routers/sales.ts"

with open(file_path, "r") as f:
    content = f.read()

# Fix in getSalesPerformanceReport
content = content.replace(
    'if (input.endDate) leadFilters.push(lte(leadCampaigns.createdAt, new Date(input.endDate)));',
    'if (input.endDate) leadFilters.push(lte(leadCampaigns.createdAt, new Date(input.endDate + "T23:59:59Z")));'
)

content = content.replace(
    'if (input.endDate) closureFilters.push(lte(salesClosures.closingDate, new Date(input.endDate)));',
    'if (input.endDate) closureFilters.push(lte(salesClosures.closingDate, new Date(input.endDate + "T23:59:59Z")));'
)

with open(file_path, "w") as f:
    f.write(content)

print("Patch applied to sales.ts")
