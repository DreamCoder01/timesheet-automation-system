import { expect, test, describe, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import "@testing-library/jest-dom";
import FileUploader from "../FileUploader";

describe("FileUploader Drag-and-Drop Presentation Component Test Suite", () => {
  const mockOnUploadSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("alert", vi.fn());
  });

  test("Scenario A: cleanly renders initial passive state layout upload markers", () => {
    render(
      <FileUploader
        onUploadSuccess={mockOnUploadSuccess}
        isProcessing={false}
      />,
    );

    expect(screen.getByText("Till system report")).toBeInTheDocument();
    expect(
      screen.getByText(/or drag and drop your report here/i),
    ).toBeInTheDocument();
  });

  test("Scenario B: successfully captures standard input file upload changes and executes callback", () => {
    const { container } = render(
      <FileUploader
        onUploadSuccess={mockOnUploadSuccess}
        isProcessing={false}
      />,
    );

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const testFile = new File(
      ["employee_id,clock_in\nE001,09:00"],
      "hours.csv",
      { type: "text/csv" },
    );

    fireEvent.change(fileInput, { target: { files: [testFile] } });

    expect(mockOnUploadSuccess).toHaveBeenCalledTimes(1);
    expect(mockOnUploadSuccess).toHaveBeenCalledWith(testFile);
  });

  test("Scenario C: renders active loading spinners and locks inputs during active processing transitions", () => {
    const { container } = render(
      <FileUploader
        onUploadSuccess={mockOnUploadSuccess}
        isProcessing={true}
      />,
    );

    expect(
      screen.getByText("Processing timesheet records..."),
    ).toBeInTheDocument();
    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(fileInput).toBeDisabled();
  });

  test("Scenario D: tracks and responds to interactive dragover style updates cleanly", () => {
    render(
      <FileUploader
        onUploadSuccess={mockOnUploadSuccess}
        isProcessing={false}
      />,
    );

    const dropZone = screen
      .getByText(/or drag and drop your report here/i)
      .closest("div.border-2");
    expect(dropZone).toBeInTheDocument();

    if (dropZone) {
      fireEvent.dragOver(dropZone);
      expect(dropZone.className).toContain("border-amber-500");
    }
  });

  test("Scenario E: handles empty or invalid unmapped drag-drop events safely to clear alternative branch tracks", () => {
    const { container } = render(
      <FileUploader
        onUploadSuccess={mockOnUploadSuccess}
        isProcessing={false}
      />,
    );

    const dropZone = screen
      .getByText(/or drag and drop your report here/i)
      .closest("div.border-2");
    expect(dropZone).toBeInTheDocument();

    if (dropZone) {
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [] },
      });
      expect(mockOnUploadSuccess).not.toHaveBeenCalled();

      const invalidFile = new File(["logo"], "image.png", {
        type: "image/png",
      });
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [invalidFile] },
      });

      expect(window.alert).toHaveBeenCalledWith(
        "Invalid file type. Please upload a structured .csv file report.",
      );
      expect(mockOnUploadSuccess).not.toHaveBeenCalled();
    }

    // --- NEW FIX: Triggers line 36 empty-file change exception branch handler ---
    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: null } });
      fireEvent.change(fileInput, { target: { files: [] } });
      expect(mockOnUploadSuccess).not.toHaveBeenCalled();
    }
  });
});
