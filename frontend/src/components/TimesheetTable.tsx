"use client";

import React from "react";
import { IValidatedShiftSummary } from "../models/validatedShiftInterface";

interface TimesheetTableProps {
  shifts: IValidatedShiftSummary[];
}

export default function TimesheetTable({ shifts }: TimesheetTableProps) {
  if (shifts.length === 0) return null;

  // 1. Parse hours_display strings ("7:30") to sum total minutes safely
  const totalMinutes = shifts.reduce((acc, shift) => {
    const [hours, minutes] = (shift.hours_display || "0:00")
      .split(":")
      .map(Number);
    return acc + (hours * 60 + minutes);
  }, 0);

  // 2. Accumulate base-10 decimal hours floats directly
  const totalDecimal = shifts.reduce(
    (acc, shift) => acc + (shift.decimal_hours || 0),
    0,
  );

  // 3. Re-format the accumulated minutes back into a standard "X:XX" clock string configuration
  const totalHoursPart = Math.floor(totalMinutes / 60);
  const totalMinutesPart = totalMinutes % 60;
  const totalHoursDisplay = `${totalHoursPart}:${totalMinutesPart.toString().padStart(2, "0")}`;

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* Title section - Rigidly locked at the top */}
      <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50 shrink-0">
        <h3 className="font-semibold text-neutral-800 text-sm">
          Processed Employee Records
        </h3>
      </div>

      {/* --- CEMENTED HEADERS LAYER --- */}
      {/* This row sits outside the scrolling view completely, preventing any bounce or jitter */}
      <div className="border-b border-neutral-200 bg-neutral-50 text-xs font-bold text-neutral-400 uppercase tracking-wider shrink-0 px-6 py-3">
        <div className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-5">Employee</div>
          <div className="col-span-3">Shift Date</div>
          <div className="col-span-2">Hours</div>
          <div className="col-span-2 text-right">Decimal</div>
        </div>
      </div>

      {/* --- SCROLLABLE DATA BODY --- */}
      {/* This container captures the scroll context independently */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 select-none">
        <div className="divide-y divide-neutral-100 text-sm text-neutral-700 px-6">
          {shifts.map((shift, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 gap-4 items-center py-4 hover:bg-neutral-50/50 transition-colors"
            >
              <div className="col-span-5 font-medium text-neutral-900 truncate pr-2">
                {shift.employee_full_name}{" "}
                <span className="text-xs text-neutral-400 font-normal block lg:inline lg:ml-1">
                  ({shift.employee_id})
                </span>
              </div>
              <div className="col-span-3 text-neutral-500 whitespace-nowrap">
                {shift.shift_date}
              </div>
              <div className="col-span-2 font-mono font-medium text-neutral-800 whitespace-nowrap">
                {shift.hours_display}
              </div>
              <div className="col-span-2 text-right font-mono font-semibold text-amber-600 whitespace-nowrap">
                {shift.decimal_hours.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- FLOATING TOTALS BASELINE --- */}
      {/* Lifted completely outside the scroll body container */}
      <div className="border-t-2 border-neutral-200 bg-neutral-50/90 font-bold text-neutral-900 px-6 py-4 shrink-0 shadow-[0_-2px_10px_0_rgba(0,0,0,0.02)]">
        <div className="grid grid-cols-12 gap-4 items-center text-sm">
          <div className="col-span-5 font-semibold text-neutral-600">
            Total Hours
          </div>
          <div className="col-span-3"></div>
          <div className="col-span-2 font-mono font-bold text-neutral-900 whitespace-nowrap">
            {totalHoursDisplay}
          </div>
          <div className="col-span-2 text-right font-mono font-bold text-amber-600 whitespace-nowrap">
            {totalDecimal.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
