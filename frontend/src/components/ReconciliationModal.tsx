"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  HelpCircle,
  CornerDownRight,
  ShieldAlert,
  Trash2,
  Layers,
} from "lucide-react";
import { IAnomalyExceptionSummary } from "../models/anomalyExceptionInterface";
import { apiService, IReconciliationCorrection } from "../services/apiService";

interface ReconciliationModalProps {
  anomaly: IAnomalyExceptionSummary;
  onClose: () => void;
  onSubmit: (corrections: IReconciliationCorrection) => Promise<void>;
}

export default function ReconciliationModal({
  anomaly,
  onClose,
  onSubmit,
}: ReconciliationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [adjacentRows, setAdjacentRows] = useState<IAnomalyExceptionSummary[]>(
    [],
  );

  // Initialize input state configurations mapped cleanly to states
  const [employeeId, setEmployeeId] = useState(anomaly.raw_employee_id || "");
  const [employeeName, setEmployeeName] = useState(
    anomaly.raw_employee_name || "",
  );
  const [clockIn, setClockIn] = useState(anomaly.raw_clock_in || "");
  const [clockOut, setClockOut] = useState(anomaly.raw_clock_out || "");
  const [tillId, setTillId] = useState(anomaly.raw_till_id || "");

  // Pull preceding and following spreadsheet row logs to populate the timeline context window
  useEffect(() => {
    apiService
      .getAnomalyContextWindow(anomaly.exception_id)
      .then((payload) => setAdjacentRows(payload.adjacent_rows))
      .catch((err) =>
        console.error(
          "Failed to recover time-stream context matrix logs:",
          err,
        ),
      );
  }, [anomaly.exception_id]);

  // Zone 1 Content Blueprint Engine: Serves explicit actionable guidelines to the payroll operator
  const getPrescriptiveActionGuide = (): string => {
    switch (anomaly.error_category) {
      case "Forgot_To_Clock_Out":
        return "Action Required: The system caught a missing clock-out operational punch field. Cross-reference your physical security logs, till activity reports, or store manager rotas to enter their true clock-out timestamp on the right panel.";
      case "Duplicate_Log":
        return "Action Required: This row shares an identical timestamp signature with a ledger entry already written to disk. If this is an accidental double-tap click anomaly, edit the timestamps to separate shifts, or choose to discard the entry.";
      case "Logical_Paradox":
        return "Action Required: The timestamps show an inverted chronological order or matching time values. Verify if this shift was an accidental double-tap. Adjust the timestamps to reflect their actual working shift interval or hit Discard.";
      case "Structural_Mismatch":
      default:
        return "Action Required: Crucial array fields or identifier tokens arrived empty or corrupted. Locate this employee in your active store registry, map their missing employee id or name parameters, and type updates into the form fields.";
    }
  };

  const handleFormSubmit = async (
    e: React.FormEvent,
    isDiscardTrigger = false,
  ) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    // If a supervisor triggers an explicit discard shortcut, copy timestamps to invoke a safe zero-minute exit path
    const payload: IReconciliationCorrection = isDiscardTrigger
      ? {
          employee_id: employeeId.trim() || "DISCARD",
          employee_name: employeeName.trim() || "DISCARD",
          clock_in: "2026-09-07 09:00",
          clock_out: "2026-09-07 09:00",
          till_id: tillId.trim() || "DISCARD",
        }
      : {
          employee_id: employeeId.trim() || null,
          employee_name: employeeName.trim() || null,
          clock_in: clockIn.trim() || null,
          clock_out: clockOut.trim() || null,
          till_id: tillId.trim() || null,
        };

    try {
      await onSubmit(payload);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Network transaction blocked reprocessing.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden max-h-[95vh]">
        {/* Global Modal Header Wrapper */}
        <div className="px-6 py-4 bg-amber-50 border-b border-amber-100 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <HelpCircle className="h-5 w-5 text-amber-600" />
            <div>
              <h3 className="font-bold text-sm text-neutral-900">
                Diagnostic Reconciliation Console
              </h3>
              <p className="text-[11px] text-amber-700 font-medium">
                Source Spreadsheet Tracking Context: Row line{" "}
                {anomaly.raw_input_line_number}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 hover:bg-amber-100 rounded-lg text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* --- ZONE 1: ACTION GUIDE & PRESCRIPTION ALERTS PANEL --- */}
        <div className="p-4 bg-amber-50/40 border-b border-amber-100 shrink-0 text-xs">
          <div className="bg-white border border-amber-200 rounded-xl p-3 flex gap-3 items-start shadow-sm/5">
            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold uppercase tracking-wider text-[10px] text-amber-800">
                Category Diagnostic Signature:{" "}
                <span className="font-mono underline">
                  {anomaly.error_category.replace(/_/g, " ")}
                </span>
              </span>
              <p className="text-neutral-600 leading-relaxed font-medium">
                {getPrescriptiveActionGuide()}
              </p>
            </div>
          </div>
        </div>

        {/* --- ZONE 2: SPLIT-SCREEN WORKSPACE CANVAS --- */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-200 min-h-0 bg-neutral-50/30">
          {/* ZONE 2A: LEFT READ-ONLY AUDIT CONTEXT PANEL */}
          <div className="p-6 space-y-4">
            <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-3 w-3" /> Frozen Raw Payload Extracted From
              Spreadsheet
            </h4>

            <div className="bg-neutral-900 text-neutral-300 font-mono text-[11px] p-4 rounded-xl space-y-2.5 shadow-inner border border-neutral-800 leading-normal select-none">
              <div>
                <span className="text-neutral-500">row_line:</span>{" "}
                {anomaly.raw_input_line_number}
              </div>
              <div>
                <span className="text-neutral-500">employee_id:</span>{" "}
                <span
                  className={
                    !anomaly.raw_employee_id
                      ? "text-red-400 underline font-bold"
                      : ""
                  }
                >
                  "{anomaly.raw_employee_id || "NULL"}"
                </span>
              </div>
              <div>
                <span className="text-neutral-500">employee_name:</span> "
                {anomaly.raw_employee_name || "NULL"}"
              </div>
              <div>
                <span className="text-neutral-500">clock_in:</span>{" "}
                <span
                  className={
                    anomaly.error_category === "Logical_Paradox"
                      ? "text-amber-400 underline font-bold"
                      : ""
                  }
                >
                  "{anomaly.raw_clock_in || "NULL"}"
                </span>
              </div>
              <div>
                <span className="text-neutral-500">clock_out:</span>{" "}
                <span
                  className={
                    !anomaly.raw_clock_out ||
                    anomaly.error_category === "Logical_Paradox"
                      ? "text-red-400 underline font-bold"
                      : ""
                  }
                >
                  "{anomaly.raw_clock_out || "NULL"}"
                </span>
              </div>
              <div>
                <span className="text-neutral-500">till_id:</span> "
                {anomaly.raw_till_id || "NULL"}"
              </div>
              <div className="border-t border-neutral-800 pt-2 mt-2 text-neutral-400 italic">
                <span className="text-neutral-500">diagnostic_alert:</span>{" "}
                {anomaly.diagnostic_message}
              </div>
            </div>
          </div>

          {/* ZONE 2B: RIGHT INTERACTIVE OVERRIDE MODIFICATION FORM */}
          <form
            id="reconciliation-form"
            onSubmit={(e) => handleFormSubmit(e, false)}
            className="p-6 space-y-4 flex flex-col justify-start"
          >
            <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Supervisor Compensation Corrections
            </h4>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700 leading-normal">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <label
                  htmlFor="employee-id-field"
                  className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider"
                >
                  Employee ID
                </label>
                <input
                  id="employee-id-field"
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. E001"
                  className={`px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono transition-all ${!employeeId ? "border-red-300 ring-2 ring-red-500/5 bg-red-50/20" : "border-neutral-300"}`}
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label
                  htmlFor="till-id-field"
                  className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase"
                >
                  Till ID
                </label>
                <input
                  id="till-id-field"
                  type="text"
                  value={tillId}
                  onChange={(e) => setTillId(e.target.value)}
                  placeholder="e.g. T1"
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label
                htmlFor="employee-name-field"
                className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider"
              >
                Employee Full Name
              </label>
              <input
                id="employee-name-field"
                type="text"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="Full legal registry name"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm font-medium"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label
                htmlFor="clock-in-field"
                className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider"
              >
                Clock In Timestamp
              </label>
              <input
                id="clock-in-field"
                type="text"
                value={clockIn}
                onChange={(e) => setClockIn(e.target.value)}
                placeholder="YYYY-MM-DD HH:MM"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm font-mono"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label
                htmlFor="clock-out-field"
                className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider"
              >
                Clock Out Timestamp
              </label>
              <input
                id="clock-out-field"
                type="text"
                value={clockOut}
                onChange={(e) => setClockOut(e.target.value)}
                placeholder="YYYY-MM-DD HH:MM"
                className={`w-full px-3 py-2 border rounded-lg text-sm font-mono transition-all ${!clockOut || anomaly.error_category === "Logical_Paradox" ? "border-red-300 ring-2 ring-red-500/5 bg-red-50/20" : "border-neutral-300"}`}
              />
            </div>
          </form>
        </div>

        {/* --- ZONE 3: ADJACENT TIME-STREAM CONTEXT WINDOW TABLE --- */}
        {adjacentRows.length > 0 && (
          <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50/50 shrink-0 select-none">
            <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Time-Stream Window: Adjacent Rows Sitting in Spreadsheet Context
            </h4>
            <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white shadow-sm/5">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-400 border-b border-neutral-200 font-bold uppercase tracking-tight">
                    <th className="px-3 py-1.5 w-16">Row ID</th>
                    <th className="px-3 py-1.5">Employee ID</th>
                    <th className="px-3 py-1.5">Captured Name</th>
                    <th className="px-3 py-1.5">Clock In</th>
                    <th className="px-3 py-1.5">Clock Out</th>
                    <th className="px-3 py-1.5">Hardware</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-600 font-mono">
                  {adjacentRows.map((row) => (
                    <tr
                      key={row.exception_id}
                      className="hover:bg-neutral-50/30"
                    >
                      <td className="px-3 py-1.5 font-bold text-neutral-400">
                        Line {row.raw_input_line_number}
                      </td>
                      <td className="px-3 py-1.5 text-neutral-900 font-semibold">
                        {row.raw_employee_id || "—"}
                      </td>
                      <td className="px-3 py-1.5 font-sans font-medium text-neutral-700">
                        {row.raw_employee_name || "—"}
                      </td>
                      <td className="px-3 py-1.5">{row.raw_clock_in || "—"}</td>
                      <td className="px-3 py-1.5">
                        {row.raw_clock_out || "—"}
                      </td>
                      <td className="px-3 py-1.5 font-bold text-neutral-500">
                        {row.raw_till_id || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Global Footer Controls Area */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between shrink-0">
          <div>
            {(anomaly.error_category === "Logical_Paradox" ||
              anomaly.raw_clock_in === anomaly.raw_clock_out) && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={(e) => handleFormSubmit(e, true)}
                className="px-3 py-2 border border-red-200 hover:border-red-300 hover:bg-red-50 text-red-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Discard Ghost Entry
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-neutral-300 rounded-lg text-xs font-semibold text-neutral-600 hover:bg-neutral-100 disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              form="reconciliation-form"
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm hover:shadow flex items-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                "Processing..."
              ) : (
                <>
                  <CornerDownRight className="h-3.5 w-3.5" /> Commit
                  Verification
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
