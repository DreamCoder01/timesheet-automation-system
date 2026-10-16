import { expect, test, describe } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import TimesheetTable from "../TimesheetTable";

describe("TimesheetTable Presentation Component Test Suite", () => {
  test("Scenario A: cleanly renders formatted employee shift entries and verified footer totals", () => {
    const mockShifts: any[] = [
      {
        employee_id: "E006",
        employee_full_name: "Tom Wallace",
        shift_date: "2026-09-07",
        hours_display: "7:30",
        decimal_hours: 7.5,
        status: "Complete",
      },
    ];

    render(<TimesheetTable shifts={mockShifts} />);

    expect(screen.getByText(/E006/i)).toBeInTheDocument();
    expect(screen.getByText(/Tom Wallace/i)).toBeInTheDocument();
    expect(screen.getByText("2026-09-07")).toBeInTheDocument();
    expect(screen.getByText("Total Hours")).toBeInTheDocument();

    // Fixed: Uses getAllByText to safely account for both the row entry and footer total
    const hoursElements = screen.getAllByText("7:30");
    expect(hoursElements).toHaveLength(2);

    const decimalElements = screen.getAllByText(/7.50/);
    expect(decimalElements).toHaveLength(2);
  });

  test("Scenario B: handles empty datasets gracefully and triggers code branch fallbacks", () => {
    render(<TimesheetTable shifts={[]} />);
    const employeeRowCell = screen.queryByText(/E006/i);
    const totalsRowLabel = screen.queryByText("Total Hours");

    expect(employeeRowCell).not.toBeInTheDocument();
    expect(totalsRowLabel).not.toBeInTheDocument();
  });
});
