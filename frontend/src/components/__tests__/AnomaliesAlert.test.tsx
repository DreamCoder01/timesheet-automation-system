import { expect, test, describe, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react"; // Added fireEvent import here
import React from "react";
import "@testing-library/jest-dom"; // Assures document assertions match smoothly
import AnomaliesAlert from "../AnomaliesAlert";

describe("AnomaliesAlert Presentation Component Test Suite", () => {
  test("Scenario A: cleanly renders quarantined rows within the user interface", () => {
    // 1. Arrange: Define the dataset and a stub mock function contract
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

    // 2. Act: Satisfy the production component contract with all mandatory parameters
    render(
      <AnomaliesAlert
        anomalies={mockAnomalies}
        onReconcile={mockOnReconcile}
      />,
    );

    // 3. Assert: Verify structural elements render accurately
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

    // 1. Arrange & Act
    render(<AnomaliesAlert anomalies={[]} onReconcile={mockOnReconcile} />);

    // 2. Assert: Verify the outer container hidden elements return null profiles
    const alertsContainer = screen.queryByText(/Row/i);
    expect(alertsContainer).not.toBeInTheDocument();
  });

  test("Scenario C: exercises alternative severity styling branches", () => {
    // Passes a CRITICAL severity state to execute alternative layout classes
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
    // 1. Arrange: Setup testing dataset tracking parameters and action hooks
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

    // 2. Act: Query the explicit button element and fire a standard click event synchronously
    const reconcileBtn = screen.getByRole("button", { name: /reconcile/i });
    fireEvent.click(reconcileBtn);

    // 3. Assert: Verify that the execution loop fired with the exact target payload tracking ID
    expect(mockOnReconcile).toHaveBeenCalledTimes(1);
    expect(mockOnReconcile).toHaveBeenCalledWith("anomaly-trigger-777");
  });
});
