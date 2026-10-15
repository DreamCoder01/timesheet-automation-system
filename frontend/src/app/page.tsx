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
      // Stream file directly through proxy layer adapters to FastAPI engine loops
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

  return (
    <main className="min-h-screen bg-neutral-50/50 text-neutral-900 selection:bg-amber-100 pb-16">
      {/* Structural Global Header Shell */}
      <header className="w-full bg-white border-b border-neutral-200 sticky top-0 z-50 shadow-sm/5">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="max-w-3xl mb-8">
          <p className="text-sm text-neutral-600 leading-relaxed">
            Upload the weekly report from the till system to total the hours
            worked by each member of the team, then reconcile the weekly total
            against the rota.
          </p>
        </div>

        {/* 1. Global Metric KPI Summary Blocks Section */}
        <MetricsGrid
          totalEmployees={dashboardData.total_employees}
          totalShifts={dashboardData.total_shifts_counted}
          totalSkipped={dashboardData.total_rows_skipped}
          weekRange={dashboardData.week_covered_range}
        />

        {/* 2. Drag-and-Drop System File Ingestion Panel Boundary */}
        <FileUploader
          onUploadSuccess={handleFileUpload}
          isProcessing={isProcessing}
        />

        {/* 3. Splitting Grid Layout for Valid Outputs and Quarantined Items */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <TimesheetTable shifts={dashboardData.healthy_data_pool} />
          </div>
          <div className="lg:col-span-1">
            <AnomaliesAlert anomalies={dashboardData.unhealthy_data_pool} />
          </div>
        </div>
      </div>
    </main>
  );
}
