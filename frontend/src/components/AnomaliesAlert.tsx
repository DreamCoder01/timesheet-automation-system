"use client";

import React from "react";
import { ShieldAlert, HelpCircle } from "lucide-react";
import { IAnomalyExceptionSummary } from "../models/anomalyExceptionInterface";

interface AnomaliesAlertProps {
  anomalies: IAnomalyExceptionSummary[];
  onReconcile: (exceptionId: string) => void;
}

export default function AnomaliesAlert({
  anomalies,
  onReconcile,
}: AnomaliesAlertProps) {
  if (anomalies.length === 0) return null;

  return (
    <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-900 flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-4 border-b border-amber-200/60 pb-3 shrink-0">
        <ShieldAlert className="h-5 w-5 text-amber-600" />
        <h3 className="font-bold text-sm text-amber-800">
          Quarantined Processing Exceptions ({anomalies.length})
        </h3>
      </div>
      <p className="text-xs text-amber-700 mb-4 leading-relaxed shrink-0">
        The following rows contained layout failures, double taps, or logical
        conflicts. They have been isolated to protect payroll integrity.
      </p>

      {/* flex-1 handles smooth independent scrollbar overflow trails */}
      <div className="space-y-3 flex-1 overflow-y-auto pr-1 min-h-0">
        {anomalies.map((item) => (
          <div
            key={item.exception_id}
            className="bg-white/80 backdrop-blur-sm border border-amber-200/40 rounded-lg p-3 shadow-sm flex items-start justify-between text-xs transition-all hover:bg-white gap-4"
          >
            <div className="flex gap-3 items-start min-w-0">
              {/* Added explicit shrink-0, whitespace-nowrap, and h-fit constraints */}
              <div className="mt-0.5 px-1.5 py-0.5 shrink-0 whitespace-nowrap h-fit bg-amber-100 rounded text-amber-800 font-bold tracking-tight">
                Row {item.raw_input_line_number}
              </div>
              <div className="flex flex-col space-y-0.5 min-w-0">
                <span className="font-semibold text-neutral-800 capitalize flex items-center gap-1 flex-wrap">
                  {item.error_category.replace("_", " ")}
                  <span
                    className={`text-[10px] px-1 rounded font-bold uppercase shrink-0 ${
                      item.error_severity === "Critical"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {item.error_severity}
                  </span>
                </span>
                <span className="text-neutral-600 leading-normal break-words">
                  {item.diagnostic_message}
                </span>
              </div>
            </div>

            <button
              onClick={() => onReconcile(item.exception_id)}
              className="text-amber-700 hover:text-amber-900 font-medium flex items-center gap-1 transition-colors border border-amber-200 rounded px-2 py-1 bg-amber-50 hover:bg-amber-100 cursor-pointer shrink-0"
            >
              <HelpCircle className="h-3 w-3" /> Reconcile
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
