import { expect, test, describe } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import AnomaliesAlert from "../AnomaliesAlert";

describe("AnomaliesAlert Presentation Component Test Suite", () => {
  test("Scenario A: cleanly renders quarantined rows within the user interface", () => {
    // 1. Arrange: Define the dataset to match what AnomaliesAlertProps expects
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

    // 2. Act: Pass only the 'anomalies' property to match the production component contract
    render(<AnomaliesAlert anomalies={mockAnomalies} />);

    // 3. Assert: Verify the structural elements render accurately based on the true HTML output
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
    // 1. Arrange & Act
    render(<AnomaliesAlert anomalies={[]} />);

    // 2. Assert: Verify the table elements are hidden when the array is empty
    const alertsContainer = screen.queryByText(/Row/i);
    expect(alertsContainer).not.toBeInTheDocument();
  });

  test("Scenario C: exercises alternative severity styling branches", () => {
    // Passes a CRITICAL severity state to execute alternative ternary branches (Line 42)
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

    render(<AnomaliesAlert anomalies={criticalAnomaly} />);
    expect(screen.getByText(/Critical/i)).toBeInTheDocument();
  });
});
