import { expect, test, describe } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import TimesheetTable from "../TimesheetTable";

describe("TimesheetTable Presentation Component Test Suite", () => {
  test("Scenario A: cleanly renders formatted employee shift entries", () => {
    const mockShifts: any[] = [
      {
        entry_id: "shift-uuid-999",
        employee_id: "E006",
        employee_full_name: "Tom Wallace",
        department_id: "Default cost center",
        shift_date: "2026-09-07",
        total_payable_minutes: 450,
        status: "Complete",
        hours_display: "7:30",
        decimal_hours: 7.5,
      },
    ];

    render(<TimesheetTable shifts={mockShifts} />);

    // Fixed: Employs partial regex match bounds to catch nested row text parameters seamlessly
    expect(screen.getByText(/E006/i)).toBeInTheDocument();
    expect(screen.getByText(/Tom Wallace/i)).toBeInTheDocument();
    expect(screen.getByText("2026-09-07")).toBeInTheDocument();
    expect(screen.getByText("7:30")).toBeInTheDocument();
    expect(screen.getByText(/7.50/)).toBeInTheDocument();
  });

  test("Scenario B: handles empty datasets gracefully and triggers code branch fallbacks", () => {
    render(<TimesheetTable shifts={[]} />);
    const employeeRowCell = screen.queryByText(/E006/i);
    expect(employeeRowCell).not.toBeInTheDocument();
  });
});
