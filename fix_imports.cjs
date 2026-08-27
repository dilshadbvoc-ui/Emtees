const fs = require('fs');

function addImports(file, imports, fromModule) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Find the import line for the specific module
  const importRegex = new RegExp(`import\\s+\\{([^}]+)\\}\\s+from\\s+['"]${fromModule}['"]`);
  const match = content.match(importRegex);
  
  if (match) {
    const existingImports = match[1].split(',').map(s => s.trim());
    let added = false;
    for (const imp of imports) {
      if (!existingImports.includes(imp)) {
        existingImports.push(imp);
        added = true;
      }
    }
    if (added) {
      const newImportString = `import { ${existingImports.join(', ')} } from "${fromModule}"`;
      content = content.replace(match[0], newImportString);
    }
  } else {
    // Add the import to the top
    content = `import { ${imports.join(', ')} } from "${fromModule}";\n` + content;
  }
  
  fs.writeFileSync(file, content);
  console.log(`Updated imports in ${file}`);
}

addImports('server/src/routers/discipline.ts', ['or'], 'drizzle-orm');
addImports('server/src/routers/performance.ts', ['departments', 'studentClassAllocations'], '../schema');
addImports('server/src/routers/privateMessages.ts', ['departments', 'studentClassAllocations'], '../schema');

// For admin.ts we need to see what's on line 3280 and 3359
let adminContent = fs.readFileSync('server/src/routers/admin.ts', 'utf8');
// Fix undefined in where clause
// Find `.where(` and the variable inside it.
// Actually, let's just use string replacement if we can identify it.
// Let's just output those lines for manual fixing.
const lines = adminContent.split('\n');
console.log("admin.ts line 3280:", lines[3280 - 1]);
console.log("admin.ts line 3359:", lines[3359 - 1]);

