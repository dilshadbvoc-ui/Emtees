import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Award, Trophy, Medal } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";

export default function WeeklyLeaderboard() {
  const [weekStart, setWeekStart] = useState(format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"));
  const [weekEnd, setWeekEnd] = useState(format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"));
  
  const { data: leaderboard, isLoading } = trpc.sales.getWeeklyLeaderboard.useQuery({ weekStart, weekEnd });

  const getRankIcon = (index: number) => {
    switch(index) {
      case 0: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 1: return <Medal className="w-5 h-5 text-slate-400" />;
      case 2: return <Medal className="w-5 h-5 text-amber-700" />;
      default: return <span className="font-mono text-slate-500 w-5 inline-block text-center">{index + 1}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-500" />
              Weekly Points Leaderboard
            </CardTitle>
            <CardDescription>Sales points are calculated automatically using active Points Engine rules.</CardDescription>
          </div>
          <div className="flex gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Start Date</Label>
              <Input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)} className="w-[150px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End Date</Label>
              <Input type="date" value={weekEnd} onChange={e => setWeekEnd(e.target.value)} className="w-[150px]" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-100 dark:bg-slate-800">
                <TableRow>
                  <TableHead className="w-16 text-center text-slate-700 dark:text-slate-300">Rank</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">CA Name</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Team / ASM</TableHead>
                  <TableHead className="text-right text-slate-700 dark:text-slate-300">Closures</TableHead>
                  <TableHead className="text-right text-slate-700 dark:text-slate-300">Revenue</TableHead>
                  <TableHead className="text-right text-slate-700 dark:text-slate-300 font-bold">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">Calculating points...</TableCell>
                  </TableRow>
                ) : leaderboard?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">No closures found in this date range.</TableCell>
                  </TableRow>
                ) : (
                  leaderboard?.map((row, idx) => (
                    <TableRow key={row.caId} className="border-slate-200 dark:border-slate-800">
                      <TableCell className="text-center flex justify-center items-center h-12">
                        {getRankIcon(idx)}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                        {row.caName}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-indigo-600">{row.groupName}</div>
                        <div className="text-xs text-slate-500">{row.asmName}</div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{row.closures}</TableCell>
                      <TableCell className="text-right text-emerald-600 font-medium">₹{row.revenue.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold text-xl text-indigo-600 dark:text-indigo-400">
                        {Math.floor(row.points).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
