import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import * as XLSX from "xlsx";

export default function ReconciliationUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const compareMutation = trpc.sales.compareIqedData.useMutation({
    onSuccess: (data) => {
      setResults(data);
      setIsProcessing(false);
    },
    onError: () => {
      setIsProcessing(false);
      alert("Error processing comparison");
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet);
      
      // Parse rows into standard format for the backend
      const parsedData = rows.map((row: any) => {
        // Try to guess the column names, assuming common variations
        const admNo = row["Admission No"] || row["Adm No"] || row["ADM_NO"] || row["admNo"] || row["id"];
        const studentName = row["Student Name"] || row["Name"] || row["name"] || row["Student"];
        const totalFee = row["Total Fee"] || row["Total"] || row["totalFee"] || row["Fee"];
        const paid = row["Paid"] || row["Amount Paid"] || row["paid"] || row["First Inst"];
        
        return {
          admNo: admNo ? String(admNo) : undefined,
          studentName: studentName ? String(studentName) : undefined,
          totalFee: totalFee ? Number(totalFee) : undefined,
          paid: paid ? Number(paid) : undefined,
          rawRow: row // Keep original row for debugging if needed
        };
      });

      compareMutation.mutate(parsedData);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
            IQED Data Reconciliation
          </CardTitle>
          <CardDescription>
            Upload the Excel/CSV file from IQED. We will match it against the Sales Closures database to find missing entries or mismatched amounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <input 
              type="file" 
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100
                dark:file:bg-indigo-900/30 dark:file:text-indigo-300"
            />
            <Button 
              onClick={handleUpload} 
              disabled={!file || isProcessing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
            >
              {isProcessing ? "Processing..." : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Compare
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardContent className="p-6">
                <div className="text-sm font-medium text-slate-500 mb-1">Total Processed</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{results.totalProcessed}</div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardContent className="p-6">
                <div className="text-sm font-medium text-emerald-500 mb-1 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Exact Matches
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{results.matchedCount}</div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardContent className="p-6">
                <div className="text-sm font-medium text-amber-500 mb-1 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Amount Mismatches
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{results.mismatchedCount}</div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardContent className="p-6">
                <div className="text-sm font-medium text-red-500 mb-1 flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> Missing from DB
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{results.missingCount}</div>
              </CardContent>
            </Card>
          </div>

          {results.mismatchedCount > 0 && (
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-amber-600 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Mismatched Amounts
                </CardTitle>
                <CardDescription>Records where the Admission No / Name matches, but Total Fee or Paid amounts differ.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                    <TableRow>
                      <TableHead>Adm No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">DB Total Fee</TableHead>
                      <TableHead className="text-right text-amber-600">IQED Total Fee</TableHead>
                      <TableHead className="text-right">DB Paid</TableHead>
                      <TableHead className="text-right text-amber-600">IQED Paid</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.mismatched.map((item: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>{item.dbRecord.admNo}</TableCell>
                        <TableCell>{item.dbRecord.studentName}</TableCell>
                        <TableCell className="text-right">₹{item.dbRecord.totalFee}</TableCell>
                        <TableCell className={`text-right font-medium ${item.diffs.totalFee ? 'text-amber-600' : ''}`}>
                          ₹{item.iqedRecord.totalFee}
                        </TableCell>
                        <TableCell className="text-right">₹{item.dbRecord.firstInst}</TableCell>
                        <TableCell className={`text-right font-medium ${item.diffs.paid ? 'text-amber-600' : ''}`}>
                          ₹{item.iqedRecord.paid}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {results.missingCount > 0 && (
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Missing from Database
                </CardTitle>
                <CardDescription>These records appear in the IQED file but couldn't be matched to any Sales Closure.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                    <TableRow>
                      <TableHead>Adm No (IQED)</TableHead>
                      <TableHead>Name (IQED)</TableHead>
                      <TableHead className="text-right">Total Fee (IQED)</TableHead>
                      <TableHead className="text-right">Paid (IQED)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.missingInDb.map((item: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>{item.admNo || "—"}</TableCell>
                        <TableCell>{item.studentName || "—"}</TableCell>
                        <TableCell className="text-right">₹{item.totalFee || 0}</TableCell>
                        <TableCell className="text-right">₹{item.paid || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
