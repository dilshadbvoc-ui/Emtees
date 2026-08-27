import fs from 'fs';

function fixFile(path, replacer) {
  const content = fs.readFileSync(path, 'utf-8');
  const newContent = replacer(content);
  if (content !== newContent) {
    fs.writeFileSync(path, newContent);
    console.log(`Updated ${path}`);
  }
}

// 1. Fix teacherId in student_class_allocations
const otoSql = 'sql`CAST(${studentClassAllocations.allocation}->\\\'oneToOne\\\'->>\\\'teacherId\\\' AS INTEGER)`';
const groupSql = 'sql`CAST(${studentClassAllocations.allocation}->\\\'group\\\'->>\\\'teacherId\\\' AS INTEGER)`';
const replaceStudentClassAllocations = (content) => {
  return content.replace(
    /inArray\(studentClassAllocations\.teacherId,\s*(teacherIds|allDepartmentUserIds)\)/g,
    (match, p1) => `or(inArray(${otoSql}, ${p1}), inArray(${groupSql}, ${p1}))`
  );
};

fixFile('server/src/routers/admin.ts', (content) => {
  let modified = replaceStudentClassAllocations(content);
  // Fix class_ledger_transactions in admin.ts
  modified = modified.replace(
    /inArray\(classLedgerTransactions\.teacherId,\s*teacherIds\)/g,
    'inArray(classLedgerTransactions.studentId, allStudentIds)'
  );
  
  // Wait, allStudentIds isn't defined at the scope of ledgerCreditsQuery.
  // I need to pull out allStudentIds calculation. Let's do a more surgical replacement for admin.ts.
  return modified;
});

fixFile('server/src/routers/discipline.ts', replaceStudentClassAllocations);

fixFile('server/src/routers/performance.ts', (content) => {
  let modified = replaceStudentClassAllocations(content);
  // Add missing imports
  if (!modified.includes('departments')) {
    modified = modified.replace(/import \{([^}]+)\}\s*from\s*["']\.\.\/\.\.\/db\/schema["'];/, 'import {$1, departments, studentClassAllocations} from "../../db/schema";');
  }
  return modified;
});

fixFile('server/src/routers/privateMessages.ts', (content) => {
  let modified = replaceStudentClassAllocations(content);
  if (!modified.includes('departments')) {
    modified = modified.replace(/import \{([^}]+)\}\s*from\s*["']\.\.\/\.\.\/db\/schema["'];/, 'import {$1, departments, studentClassAllocations} from "../../db/schema";');
  }
  return modified;
});

console.log('Done');
