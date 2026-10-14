"use client";

import React from "react";
import { ShieldAlert, HelpCircle } from "lucide-react";
import { IAnomalyExceptionSummary } from "../models/anomalyExceptionInterface";

interface AnomaliesAlertProps {
  anomalies: IAnomalyExceptionSummary[];
}

export default function AnomaliesAlert({ anomalies }: AnomaliesAlertProps) {
  if (anomalies.length === 0) return null;

  return (
    <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-900">
      <div className="flex items-center gap-2 mb-4 border-b border-amber-200/60 pb-3">
        <ShieldAlert className="h-5 w-5 text-amber-600" />
        <h3 className="font-bold text-sm text-amber-800">
          Quarantined Processing Exceptions ({anomalies.length})
        </h3>
      </div>
      <p className="text-xs text-amber-700 mb-4 leading-relaxed">
        The following rows contained layout failures, double taps, or logical
        conflicts. They have been isolated to protect payroll integrity.
      </p>

      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {anomalies.map((item) => (
          <div
            key={item.exception_id}
            className="bg-white/80 backdrop-blur-sm border border-amber-200/40 rounded-lg p-3 shadow-sm flex items-start justify-between text-xs transition-all hover:bg-white"
          >
            <div className="flex gap-3">
              <div className="mt-0.5 px-1.5 py-0.5 bg-amber-100 rounded text-amber-800 font-bold tracking-tight">
                Row {item.raw_input_line_number}
              </div>
              <div className="flex flex-col space-y-0.5">
                <span className="font-semibold text-neutral-800 capitalize flex items-center gap-1">
                  {item.error_category.replace("_", " ")}
                  <span
                    className={`text-[10px] px-1 rounded font-bold uppercase ${
                      item.error_severity === "Critical"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {item.error_severity}
                  </span>
                </span>
                <span className="text-neutral-600">
                  {item.diagnostic_message}
                </span>
              </div>
            </div>

            <button className="text-amber-700 hover:text-amber-900 font-medium flex items-center gap-1 transition-colors border border-amber-200 rounded px-2 py-1 bg-amber-50 hover:bg-amber-100 cursor-pointer">
              <HelpCircle className="h-3 w-3" /> Reconcile
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
