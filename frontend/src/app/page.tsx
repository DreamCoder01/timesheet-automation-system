"use client";

import React, { useState } from "react";
import { FileClock } from "lucide-react";
import { apiService } from "../services/apiService";
import { IGlobalDashboardPayload } from "../models/anomalyExceptionInterface";
import FileUploader from "../components/FileUploader";
import MetricsGrid from "../components/MetricsGrid";
import TimesheetTable from "../components/TimesheetTable";
import AnomaliesAlert from "../components/AnomaliesAlert";

export default function DashboardPage() {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [dashboardData, setDashboardData] = useState<IGlobalDashboardPayload>({
    total_employees: 0,
    total_shifts_counted: 0,
    total_rows_skipped: 0,
    week_covered_range: "No report uploaded",
    healthy_data_pool: [],
    unhealthy_data_pool: [],
  });

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      const freshPayload = await apiService.uploadTillReport(file);
      setDashboardData(freshPayload);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "An unexpected exception blocked file parsing processing.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Reconcile processing loop handler: Modifies local client state pools instantly
  const handleReconcileException = (exceptionId: string) => {
    setDashboardData((prevData) => {
      const updatedUnhealthyPool = prevData.unhealthy_data_pool.filter(
        (item) => item.exception_id !== exceptionId,
      );

      return {
        ...prevData,
        total_rows_skipped: updatedUnhealthyPool.length,
        unhealthy_data_pool: updatedUnhealthyPool,
      };
    });
  };

  // Check if any processed rows exist across pools to prevent empty container shells from leaking
  const hasActiveData =
    dashboardData.healthy_data_pool.length > 0 ||
    dashboardData.unhealthy_data_pool.length > 0;

  return (
    <main className="min-h-screen max-h-screen flex flex-col bg-neutral-50/50 text-neutral-900 selection:bg-amber-100">
      {/* Structural Global Header Shell */}
      <header className="w-full bg-white border-b border-neutral-200 sticky top-0 z-50 shadow-sm/5 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
              <FileClock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-base font-bold text-neutral-900 tracking-tight">
                Weekly Hours
              </h1>
              <p className="text-xs text-neutral-500 font-medium">
                Internal Reconciliation Console
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-500 bg-neutral-100 border border-neutral-200 rounded-full px-3 py-1">
            <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
            Connected to Analytics Core
          </div>
        </div>
      </header>

      {/* Primary Dashboard Content Layout Matrix */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex flex-col flex-1 min-h-0 pb-6">
        <div className="max-w-3xl mb-4 shrink-0">
          <p className="text-sm text-neutral-600 leading-relaxed">
            Upload the weekly report from the till system to total the hours
            worked by each member of the team, then reconcile the weekly total
            against the rota.
          </p>
        </div>

        {/* Global Metric KPI Summary Blocks Section */}
        <div className="shrink-0">
          <MetricsGrid
            totalEmployees={dashboardData.total_employees}
            totalShifts={dashboardData.total_shifts_counted}
            totalSkipped={dashboardData.total_rows_skipped}
            weekRange={dashboardData.week_covered_range}
          />
        </div>

        {/* Drag-and-Drop System File Ingestion Panel Boundary */}
        <div className="shrink-0">
          <FileUploader
            onUploadSuccess={handleFileUpload}
            isProcessing={isProcessing}
          />
        </div>

        {/* --- Viewport-Isolated Layout Grid Matrix --- */}
        {hasActiveData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start lg:items-stretch flex-1 min-h-0 overflow-hidden mb-4">
            {/* Left Table Section Layout: Scroll management handed cleanly into the child table component */}
            <div className="lg:col-span-2 flex flex-col h-full overflow-hidden border border-neutral-200 rounded-xl bg-white shadow-sm">
              <TimesheetTable shifts={dashboardData.healthy_data_pool} />
            </div>

            {/* Right Anomalies Section Layout */}
            <div className="lg:col-span-1 flex flex-col h-full min-h-0 overflow-hidden">
              <AnomaliesAlert
                anomalies={dashboardData.unhealthy_data_pool}
                onReconcile={handleReconcileException}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
