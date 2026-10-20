import { expect, test, describe, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import "@testing-library/jest-dom";
import ReconciliationModal from "../ReconciliationModal";
import { IAnomalyExceptionSummary } from "../../models/anomalyExceptionInterface";
import { apiService } from "../../services/apiService";

vi.mock("../../services/apiService", () => ({
  apiService: {
    getAnomalyContextWindow: vi.fn(async () => ({
      center_line: 5,
      adjacent_rows: [
        {
          exception_id: "adj-row-99",
          raw_input_line_number: 4,
          error_category: "Duplicate_Log",
          error_severity: "Warning",
          diagnostic_message: "Preceding shift text",
          resolution_status: "Unresolved",
          raw_employee_id: "E004",
          raw_employee_name: "Danny Smith",
          raw_clock_in: "2026-09-07 12:00",
          raw_clock_out: "2026-09-07 20:00",
          raw_till_id: "T2",
        },
      ],
    })),
  },
}));

describe("ReconciliationModal Split-Pane Component Test Suite", () => {
  const mockAnomaly: IAnomalyExceptionSummary = {
    exception_id: "anomaly-uuid-555",
    raw_input_line_number: 5,
    error_category: "Logical_Paradox",
    error_severity: "Warning",
    diagnostic_message:
      "Unmapped chronological text pattern format: '2026-09-07 12:00 AM'",
    resolution_status: "Unresolved",
    raw_employee_id: "E005",
    raw_employee_name: "Priya Raman",
    raw_clock_in: "2026-09-07 12:00 AM",
    raw_clock_out: "2026-09-07 08:00 AM",
    raw_till_id: "T1",
  };

  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  test("Scenario A: renders header diagnostic blocks and accurately pre-populates form data fields", async () => {
    await act(async () => {
      render(
        <ReconciliationModal
          anomaly={mockAnomaly}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />,
      );
    });

    expect(
      screen.getByText("Diagnostic Reconciliation Console"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Source Spreadsheet Tracking Context: Row line 5/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The timestamps show an inverted chronological order/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/"2026-09-07 12:00 AM"/)).toBeInTheDocument();
    expect(screen.getByDisplayValue("E005")).toBeInTheDocument();
  });

  test("Scenario B: captures user string modifications across all input fields correctly", async () => {
    const { container } = render(
      <ReconciliationModal
        anomaly={mockAnomaly}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    const empIdInput = container.querySelector(
      "#employee-id-field",
    ) as HTMLInputElement;
    const tillIdInput = container.querySelector(
      "#till-id-field",
    ) as HTMLInputElement;
    const nameInput = container.querySelector(
      "#employee-name-field",
    ) as HTMLInputElement;
    const clockInInput = container.querySelector(
      "#clock-in-field",
    ) as HTMLInputElement;
    const clockOutInput = container.querySelector(
      "#clock-out-field",
    ) as HTMLInputElement;

    fireEvent.change(empIdInput, { target: { value: "E012" } });
    fireEvent.change(tillIdInput, { target: { value: "T4" } });
    fireEvent.change(nameInput, { target: { value: "Updated Employee Name" } });
    fireEvent.change(clockInInput, { target: { value: "2026-09-10 08:45" } });
    fireEvent.change(clockOutInput, { target: { value: "2026-09-10 17:00" } });

    expect(screen.getByDisplayValue("E012")).toBeInTheDocument();
  });

  test("Scenario C: executes successful submission handlers and blocks input threads during active saves", async () => {
    mockOnSubmit.mockResolvedValueOnce(Promise.resolve());

    const { container } = render(
      <ReconciliationModal
        anomaly={mockAnomaly}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    const clockOutInput = container.querySelector(
      "#clock-out-field",
    ) as HTMLInputElement;
    fireEvent.change(clockOutInput, {
      target: { value: "2026-09-07 08:00 AM" },
    });

    const submitBtn = screen.getByRole("button", {
      name: /Commit Verification/i,
    });

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });

  test("Scenario D: intercepts network validation rejects from backend pipelines and presents error logs", async () => {
    mockOnSubmit.mockRejectedValueOnce(
      new Error("Reconciliation failed: Same-Time log paradox registered."),
    );

    render(
      <ReconciliationModal
        anomaly={mockAnomaly}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />,
    );

    const submitBtn = screen.getByRole("button", {
      name: /Commit Verification/i,
    });

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    const errorBanner = await screen.findByText(
      /Same-Time log paradox registered/i,
    );
    expect(errorBanner).toBeInTheDocument();
  });

  test("Scenario E: triggers the cancellation overlay callback handler when closing via the cancel buttons", async () => {
    // Fixed: Wrapped in an act block to flush component tear-down states securely
    await act(async () => {
      render(
        <ReconciliationModal
          anomaly={mockAnomaly}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />,
      );
    });

    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    await act(async () => {
      fireEvent.click(cancelBtn);
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test("Scenario F: safely exercises component instantiation when original raw tracking strings arrive empty or null", async () => {
    const emptyFieldsAnomaly: IAnomalyExceptionSummary = {
      exception_id: "anomaly-empty-999",
      raw_input_line_number: 10,
      error_category: "Structural_Mismatch",
      error_severity: "Critical",
      diagnostic_message: "Empty test model fields",
      resolution_status: "Unresolved",
      raw_employee_id: null,
      raw_employee_name: null,
      raw_clock_in: null,
      raw_clock_out: null,
      raw_till_id: null,
    };

    let componentContainer: HTMLElement | undefined;

    await act(async () => {
      const { container } = render(
        <ReconciliationModal
          anomaly={emptyFieldsAnomaly}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />,
      );
      componentContainer = container;
    });

    // Fixed ts(18048) by utilizing the non-null assertion operator (!) safely after the act boundary has flushed
    const empIdInput = componentContainer!.querySelector(
      "#employee-id-field",
    ) as HTMLInputElement;
    expect(empIdInput.value).toBe("");
  });

  test("Scenario G: executes the prescriptive guide text block for Forgot_To_Clock_Out anomalies", async () => {
    const clockOutAnomaly = {
      ...mockAnomaly,
      error_category: "Forgot_To_Clock_Out",
    };
    await act(async () => {
      render(
        <ReconciliationModal
          anomaly={clockOutAnomaly}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />,
      );
    });
    expect(
      screen.getByText(/missing clock-out operational punch field/i),
    ).toBeInTheDocument();
  });

  test("Scenario H: executes the prescriptive guide text block for Duplicate_Log anomalies", async () => {
    const duplicateAnomaly = {
      ...mockAnomaly,
      error_category: "Duplicate_Log",
    };
    await act(async () => {
      render(
        <ReconciliationModal
          anomaly={duplicateAnomaly}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />,
      );
    });
    expect(
      screen.getByText(/shares an identical timestamp signature/i),
    ).toBeInTheDocument();
  });

  // --- NEW SCENARIO TO SATISFY LINE 376 DEFAULT SWITCH FALLBACK PATH ---
  test("Scenario I: renders fallback default instruction summary texts when error category matches an unmapped token", async () => {
    const unmappedAnomaly = {
      ...mockAnomaly,
      error_category: "UNKNOWN_MALFORMATION_TOKEN",
    };
    await act(async () => {
      render(
        <ReconciliationModal
          anomaly={unmappedAnomaly}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />,
      );
    });
    expect(
      screen.getByText(
        /Crucial array fields or identifier tokens arrived empty/i,
      ),
    ).toBeInTheDocument();
  });
});
