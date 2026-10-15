"use client";

import React from "react";
import { IValidatedShiftSummary } from "../models/validatedShiftInterface";

interface TimesheetTableProps {
  shifts: IValidatedShiftSummary[];
}

export default function TimesheetTable({ shifts }: TimesheetTableProps) {
  if (shifts.length === 0) return null;

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
        </table>
      </div>
    </div>
  );
}
