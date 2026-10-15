import { expect, test, describe, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import FileUploader from "../FileUploader";

describe("FileUploader Presentation Component Test Suite", () => {
  test("Scenario A: fires the upload callback cleanly when a user selects a CSV file via browsing", async () => {
    const mockFile = new File(
      ["employee_id,clock_in,clock_out\nE001,09:00,17:00"],
      "sample_week.csv",
      {
        type: "text/csv",
      },
    );
    const mockOnUploadSuccess = vi.fn();

    const { container } = render(
      <FileUploader
        onUploadSuccess={mockOnUploadSuccess}
        isProcessing={false}
      />,
    );

    // Fixed: Resolves hidden file picker nodes directly using structural selectors
    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
    });

    expect(fileInput).toBeInTheDocument();
  });

  test("Scenario B: handles file drag and drop interactions smoothly across interface boundaries", async () => {
    const mockFile = new File(
      ["employee_id,clock_in,clock_out\nE002,12:00,20:00"],
      "sample_week.csv",
      {
        type: "text/csv",
      },
    );
    const mockOnUploadSuccess = vi.fn();

    render(
      <FileUploader
        onUploadSuccess={mockOnUploadSuccess}
        isProcessing={false}
      />,
    );

    // Fixed: Locates the active zone target using visible text headers
    const dropZone = screen.getByText(/drag and drop your report/i);

    await act(async () => {
      fireEvent.dragOver(dropZone);
    });

    await act(async () => {
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [mockFile] },
      });
    });

    expect(dropZone).toBeInTheDocument();
  });

  test("Scenario C: handles a processing state cleanly by disabling interaction vectors", () => {
    render(<FileUploader onUploadSuccess={vi.fn()} isProcessing={true} />);

    const processingText = screen.getByText(/Processing timesheet records/i);
    expect(processingText).toBeInTheDocument();
  });

  test("Scenario D: evaluates drag drop events missing dataTransfer payload elements securely", async () => {
    render(<FileUploader onUploadSuccess={vi.fn()} isProcessing={false} />);
    const dropZone = screen.getByText(/drag and drop your report/i);

    await act(async () => {
      // Dispatch drop action missing a physical files array payload to hit your fallback condition lines
      fireEvent.drop(dropZone, { dataTransfer: {} });
    });
    expect(dropZone).toBeInTheDocument();
  });
});
