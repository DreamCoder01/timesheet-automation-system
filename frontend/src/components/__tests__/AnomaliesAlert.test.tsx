import { expect, test, describe, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import "@testing-library/jest-dom";
import AnomaliesAlert from "../AnomaliesAlert";

describe("AnomaliesAlert Presentation Component Test Suite", () => {
  test("Scenario A: cleanly renders quarantined rows within the user interface", () => {
    const mockAnomalies: any[] = [
      {
        exception_id: "anomaly-abc-123",
        raw_input_line_number: 6,
        error_category: "Duplicate_Log",
        error_severity: "Warning",
        diagnostic_message: "Identical data log signature caught at row line 6",
        resolution_status: "Unresolved",
      },
    ];
    const mockOnReconcile = vi.fn();

    render(
      <AnomaliesAlert
        anomalies={mockAnomalies}
        onReconcile={mockOnReconcile}
      />,
    );

    expect(screen.getByText(/Row 6/i)).toBeInTheDocument();
    expect(screen.getByText(/Duplicate Log/i)).toBeInTheDocument();
    expect(
      screen.getByText("Identical data log signature caught at row line 6"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reconcile/i }),
    ).toBeInTheDocument();
  });

  test("Scenario B: handles empty or zero data state branches cleanly without crashing", () => {
    const mockOnReconcile = vi.fn();
    render(<AnomaliesAlert anomalies={[]} onReconcile={mockOnReconcile} />);
    const alertsContainer = screen.queryByText(/Row/i);
    expect(alertsContainer).not.toBeInTheDocument();
  });

  test("Scenario C: exercises alternative severity styling branches", () => {
    const criticalAnomaly: any[] = [
      {
        exception_id: "anomaly-crit-999",
        raw_input_line_number: 12,
        error_category: "Structural_Mismatch",
        error_severity: "Critical",
        diagnostic_message: "Fatal row structural truncation",
        resolution_status: "Unresolved",
      },
    ];
    const mockOnReconcile = vi.fn();

    render(
      <AnomaliesAlert
        anomalies={criticalAnomaly}
        onReconcile={mockOnReconcile}
      />,
    );
    expect(screen.getByText(/Critical/i)).toBeInTheDocument();
  });

  test("Scenario D: triggers the onReconcile callback when the Reconcile button is pressed", () => {
    const mockAnomalies: any[] = [
      {
        exception_id: "anomaly-trigger-777",
        raw_input_line_number: 14,
        error_category: "Layout_Failure",
        error_severity: "Info",
        diagnostic_message: "Malformed fields structural format",
        resolution_status: "Unresolved",
      },
    ];
    const mockOnReconcile = vi.fn();

    render(
      <AnomaliesAlert
        anomalies={mockAnomalies}
        onReconcile={mockOnReconcile}
      />,
    );

    const reconcileBtn = screen.getByRole("button", { name: /reconcile/i });
    fireEvent.click(reconcileBtn);

    expect(mockOnReconcile).toHaveBeenCalledTimes(1);
    expect(mockOnReconcile).toHaveBeenCalledWith("anomaly-trigger-777");
  });

  test("Scenario E: renders info severity anomaly fallback background text classes correctly", () => {
    const infoAnomaly: any[] = [
      {
        exception_id: "anomaly-info-555",
        raw_input_line_number: 8,
        error_category: "Identity_Fault",
        error_severity: "Info",
        diagnostic_message: "Minor tracking info mismatch signature discovered",
        resolution_status: "Unresolved",
      },
    ];
    const mockOnReconcile = vi.fn();

    render(
      <AnomaliesAlert anomalies={infoAnomaly} onReconcile={mockOnReconcile} />,
    );

    // Explicit string selector guarantees precise target tracking node selection
    const infoBadge = screen.getByText("Info", { selector: "span" });
    expect(infoBadge).toBeInTheDocument();
    expect(infoBadge).toHaveClass("bg-amber-100", "text-amber-700");
  });
});
