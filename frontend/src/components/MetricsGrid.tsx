"use client";

import React from "react";
import { Users, ClipboardList, AlertTriangle, Calendar } from "lucide-react";

interface MetricsGridProps {
  totalEmployees: number;
  totalShifts: number;
  totalSkipped: number;
  weekRange: string;
}

export default function MetricsGrid({
  totalEmployees,
  totalShifts,
  totalSkipped,
  weekRange,
}: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {/* Total Employees */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
        <div className="text-xs font-bold text-neutral-400 tracking-wider uppercase mb-1">
          Team Members
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-bold text-neutral-900">
            {totalEmployees}
          </span>
          <Users className="h-5 w-5 text-neutral-400" />
        </div>
      </div>

      {/* Shifts Counted */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
        <div className="text-xs font-bold text-neutral-400 tracking-wider uppercase mb-1">
          Shifts Counted
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-bold text-neutral-900">
            {totalShifts}
          </span>
          <ClipboardList className="h-5 w-5 text-neutral-400" />
        </div>
      </div>

      {/* Rows Skipped / Anomalies */}
      <div
        className={`border rounded-xl p-5 shadow-sm flex flex-col justify-between transition-colors ${
          totalSkipped > 0
            ? "bg-amber-50 border-amber-200 text-amber-900"
            : "bg-white border border-neutral-200 text-neutral-900"
        }`}
      >
        <div
          className={`text-xs font-bold tracking-wider uppercase mb-1 ${totalSkipped > 0 ? "text-amber-600" : "text-neutral-400"}`}
        >
          Rows Skipped
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-bold">{totalSkipped}</span>
          <AlertTriangle
            className={`h-5 w-5 ${totalSkipped > 0 ? "text-amber-500 animate-bounce" : "text-neutral-400"}`}
          />
        </div>
      </div>

      {/* Week Covered Range */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
        <div className="text-xs font-bold text-neutral-400 tracking-wider uppercase mb-1">
          Week Covered
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-neutral-800 truncate pr-2">
            {weekRange || "—"}
          </span>
          <Calendar className="h-5 w-5 text-neutral-400" />
        </div>
      </div>
    </div>
  );
}
