"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import NewClosureForm from "@/components/Sales/NewClosureForm";
import ClosuresList from "@/components/Sales/ClosuresList";
import SalesReportsView from "@/components/Sales/SalesReportsView";
import PointsEngineConfig from "@/components/Sales/PointsEngineConfig";
import HierarchyManager from "@/components/Sales/HierarchyManager";

export default function SalesDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("closures");

  const isAdmin = ["super_admin", "admin"].includes(user?.role || "");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Sales & Account Module</h1>
        <p className="text-slate-400">Manage closures, team hierarchy, points calculation, and dynamic reports.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="closures" className="data-[state=active]:bg-indigo-600">Closures</TabsTrigger>
          <TabsTrigger value="new-closure" className="data-[state=active]:bg-indigo-600">New Closure (Data Entry)</TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-indigo-600">Reports</TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="hierarchy" className="data-[state=active]:bg-indigo-600">Hierarchy & Teams</TabsTrigger>
              <TabsTrigger value="points-engine" className="data-[state=active]:bg-indigo-600">Points Engine</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="closures" className="mt-6">
          <ClosuresList />
        </TabsContent>

        <TabsContent value="new-closure" className="mt-6">
          <NewClosureForm onSuccess={() => setActiveTab("closures")} />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <SalesReportsView />
        </TabsContent>

        {isAdmin && (
          <>
            <TabsContent value="hierarchy" className="mt-6">
              <HierarchyManager />
            </TabsContent>
            <TabsContent value="points-engine" className="mt-6">
              <PointsEngineConfig />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
