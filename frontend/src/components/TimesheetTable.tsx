"use client";

import React from "react";
import { IValidatedShiftSummary } from "../models/validatedShiftInterface";

interface TimesheetTableProps {
  shifts: IValidatedShiftSummary[];
}

export default function TimesheetTable({ shifts }: TimesheetTableProps) {
  if (shifts.length === 0) return null;

  // 1. Parse hours_display strings ("7:30") to sum total minutes using your existing fields safely
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
    <div className="w-full bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
        <h3 className="font-semibold text-neutral-800 text-sm">
          Processed Employee Records
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-xs font-bold text-neutral-400 uppercase tracking-wider">
              <th className="px-6 py-3">Employee</th>
              <th className="px-6 py-3">Shift Date</th>
              <th className="px-6 py-3">Hours</th>
              <th className="px-6 py-3 text-right">Decimal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-sm text-neutral-700">
            {shifts.map((shift, idx) => (
              <tr
                key={idx}
                className="hover:bg-neutral-50/50 transition-colors"
              >
                <td className="px-6 py-4 font-medium text-neutral-900">
                  {shift.employee_full_name}{" "}
                  <span className="text-xs text-neutral-400 ml-1">
                    ({shift.employee_id})
                  </span>
                </td>
                <td className="px-6 py-4 text-neutral-500">
                  {shift.shift_date}
                </td>
                <td className="px-6 py-4 font-mono font-medium text-neutral-800">
                  {shift.hours_display}
                </td>
                <td className="px-6 py-4 text-right font-mono font-semibold text-amber-600">
                  {shift.decimal_hours.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          {/* --- Aligned Summary Totals Row --- */}
          <tfoot className="bg-neutral-50/90 font-bold border-t-2 border-neutral-200 text-neutral-900">
            <tr className="transition-colors hover:bg-neutral-100/50">
              <td className="px-6 py-4 text-left font-semibold text-neutral-600">
                Total Hours
              </td>
              <td className="px-6 py-4 text-neutral-400">---</td>
              <td className="px-6 py-4 font-mono font-bold text-neutral-900">
                {totalHoursDisplay}
              </td>
              <td className="px-6 py-4 text-right font-mono font-bold text-amber-600">
                {totalDecimal.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
