import { getDb } from "./src/queries/connection";
import { salesClosures, salesExecutives, users } from "./db/schema";
import { eq } from "drizzle-orm";
import xlsx from "xlsx";

async function importExcel() {
  const filePath = '/Users/retro/Downloads/New Account Kaifa (1).xlsx';
  const wb = xlsx.readFile(filePath, { cellDates: true });
  const sheetName = wb.SheetNames[0];
  const rows = xlsx.utils.sheet_to_json<any>(wb.Sheets[sheetName], { header: 1 });

  // Rows format:
  // [0] Total row
  // [1] Headers
  // [2+] Data

  const dataRows = rows.slice(2).filter(row => row && row[0]); // filter out empty rows

  const db = getDb();
  const getOrCreateExec = async (name: string, category: string) => {
     if (!name || name === "CA Name" || name === "TOTAL") return null;
     const cleanName = name.trim();
     if (!cleanName) return null;
     
     const existing = await db.select().from(salesExecutives).where(eq(salesExecutives.name, cleanName));
     if (existing.length > 0) return existing[0].id;
     
     // create dummy user
     const [newUser] = await db.insert(users).values({
        unionId: `dummy_union_${Date.now()}`,
        username: `ca_${cleanName.replace(/\\s+/g, "_").toLowerCase()}_${Date.now()}`,
        name: cleanName,
        email: `dummy_${Date.now()}@example.com`,
        password: "hashed_password",
        role: "sales_executive",
     }).returning();

     const execUsername = `ca_${cleanName.replace(/\\s+/g, "_").toLowerCase()}_${Date.now()}`;
     const [newExec] = await db.insert(salesExecutives).values({
        userId: newUser.id,
        employeeId: `EMP_${Date.now()}`,
        name: cleanName,
        username: execUsername,
        password: "hashed_password",
        referralCode: `REF_${Date.now()}`,
        status: "active",
     }).returning();
     
     // update user with salesExecutiveId
     await db.update(users).set({ salesExecutiveId: newExec.id }).where(eq(users.id, newUser.id));
     
     return newExec.id;
  };

  let imported = 0;
  for (const row of dataRows) {
    const rawDate = row[0]; // Closing Date
    if (!rawDate) continue; // Skip invalid
    let date = new Date();
    if (rawDate instanceof Date) {
      date = rawDate;
    } else if (typeof rawDate === 'number') {
      // Excel serial date to JS Date
      date = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
    }

    const monthStr = row[1]; // Month
    const caCategory = row[2];
    const caName = row[3];
    const courseName = row[4];
    const admNo = row[5];
    const studentName = row[7];
    const totalFee = parseFloat(row[8]) || 0;
    const firstInst = parseFloat(row[9]) || 0;
    const secondInst = parseFloat(row[10]) || 0;
    const thirdInst = parseFloat(row[11]) || 0;
    const bank = row[13];
    const isVerified = row[14] === true || row[14] === 'TRUE';
    const vStatus = row[15];

    // Compute balance
    const collected = firstInst + secondInst + thirdInst;
    const balance = totalFee - collected;
    const points = (collected / (totalFee || 1)) * 5; // basic mock formula

    const caId = await getOrCreateExec(caName, caCategory);

    await db.insert(salesClosures).values({
       closingDate: date,
       monthStr: monthStr ? `${monthStr} 2025` : "May 2025",
       cleanMonthStr: monthStr,
       caCategory: caCategory,
       caId: caId,
       courseName: courseName,
       admNo: admNo,
       studentName: studentName,
       type: "New Closure",
       totalFee: totalFee.toString(),
       firstInst: firstInst.toString(),
       secondInst: secondInst.toString(),
       thirdInst: thirdInst.toString(),
       balance: balance.toString(),
       points: points.toString(),
       baseAmountForPoints: collected.toString(),
       bank: bank,
       isVerified: isVerified,
       verificationStatus: vStatus,
    });
    imported++;
  }

  console.log(`Successfully imported ${imported} rows.`);
  process.exit(0);
}

importExcel().catch(console.error);
