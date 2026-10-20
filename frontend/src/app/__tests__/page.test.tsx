import { expect, test, describe } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import "@testing-library/jest-dom";
import TimesheetTable from "../../components/TimesheetTable";
import { IValidatedShiftSummary } from "../../models/validatedShiftInterface";

describe("TimesheetTable Presentation Component Test Suite", () => {
  test("Scenario A: returns a null layout view tree and renders nothing when shifts array is completely empty", () => {
    const { container } = render(<TimesheetTable shifts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test("Scenario B: cleanly renders stationary headers, row details, and aggregates summary totals for single shifts", () => {
    const mockShifts: IValidatedShiftSummary[] = [
      {
        employee_id: "EMP-001",
        employee_full_name: "Sarah Connor",
        shift_date: "2026-10-18",
        hours_display: "7:30",
        decimal_hours: 7.5,
        status: "Complete" as const,
      },
    ];

    render(<TimesheetTable shifts={mockShifts} />);

    expect(screen.getByText("Processed Employee Records")).toBeInTheDocument();
    expect(screen.getByText("Employee")).toBeInTheDocument();
    expect(screen.getByText("Shift Date")).toBeInTheDocument();

    expect(screen.getByText(/Sarah Connor/i)).toBeInTheDocument();
    expect(screen.getByText("(EMP-001)")).toBeInTheDocument();
    expect(screen.getByText("2026-10-18")).toBeInTheDocument();

    const hoursElements = screen.getAllByText("7:30");
    expect(hoursElements.length).toBe(2);

    const decimalElements = screen.getAllByText("7.50");
    expect(decimalElements.length).toBe(2);

    expect(screen.getByText("Total Hours")).toBeInTheDocument();
  });

  test("Scenario C: executes mathematical time-parsing algorithms correctly across complex hour boundaries", () => {
    const complexMultiShifts: IValidatedShiftSummary[] = [
      {
        employee_id: "EMP-002",
        employee_full_name: "John Connor",
        shift_date: "2026-10-14",
        hours_display: "8:45",
        decimal_hours: 8.75,
        status: "Complete" as const,
      },
      {
        employee_id: "EMP-002",
        employee_full_name: "John Connor",
        shift_date: "2026-10-15",
        hours_display: "11:35",
        decimal_hours: 11.5833,
        status: "Flagged" as const,
      },
    ];

    render(<TimesheetTable shifts={complexMultiShifts} />);

    expect(screen.getByText("20:20")).toBeInTheDocument();
    expect(screen.getByText("20.33")).toBeInTheDocument();
  });

  test("Scenario D: ensures mathematical structural padding applies correctly to single-digit minute string aggregates", () => {
    const paddingTestShifts: IValidatedShiftSummary[] = [
      {
        employee_id: "EMP-003",
        employee_full_name: "Kyle Reese",
        shift_date: "2026-10-16",
        hours_display: "4:02",
        decimal_hours: 4.0333,
        status: "Processing" as const,
      },
      {
        employee_id: "EMP-003",
        employee_full_name: "Kyle Reese",
        shift_date: "2026-10-17",
        hours_display: "2:03",
        decimal_hours: 2.05,
        status: "Anomaly" as const,
      },
    ];

    render(<TimesheetTable shifts={paddingTestShifts} />);

    expect(screen.getByText("6:05")).toBeInTheDocument();
    expect(screen.getByText("6.08")).toBeInTheDocument();
  });

  // --- NEW SCENARIO TO SATISFY THE GLOBAL BRANCH OVERRIDES ---
  test("Scenario E: triggers the fallback default time branch when hours_display parameters arrive empty or undefined", () => {
    const fallbackShifts: any[] = [
      {
        employee_id: "EMP-004",
        employee_full_name: "T-800",
        shift_date: "2026-10-18",
        hours_display: undefined, // Forces execution flow directly through the '|| "0:00"' branch condition
        decimal_hours: 0.0,
        status: "Complete",
      },
    ];

    render(<TimesheetTable shifts={fallbackShifts} />);

    // Total Hours row should safely fall back and calculate "0:00" instead of throwing a parsing exception
    const zeroTimeElements = screen.getAllByText("0:00");
    expect(zeroTimeElements.length).toBeGreaterThanOrEqual(1);
  });
});
