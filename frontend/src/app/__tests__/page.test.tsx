import { expect, test, describe, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import Home from "../page";
import { apiService } from "../../services/apiService";

vi.mock("../../services/apiService", () => ({
  apiService: {
    uploadTillReport: vi.fn(),
    getDashboardData: vi.fn(async () => ({
      total_employees: 0,
      total_shifts_counted: 0,
      total_rows_skipped: 0,
      week_covered_range: "No report uploaded",
      healthy_data_pool: [],
      unhealthy_data_pool: [],
    })),
  },
}));

describe("Home Root View Page Controller Integration Suite", () => {
  test("Scenario A: mounts base dashboard structures and triggers file upload state loops", async () => {
    vi.mocked(apiService.uploadTillReport).mockResolvedValueOnce({
      total_employees: 5,
      total_shifts_counted: 10,
      total_rows_skipped: 2,
      week_covered_range: "Mon 7 Sep - Sun 13 Sep",
      healthy_data_pool: [],
      unhealthy_data_pool: [],
    });

    const { container } = render(<Home />);
    expect(screen.getByText("Weekly Hours")).toBeInTheDocument();

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const mockFile = new File(["test"], "sample_week.csv", {
      type: "text/csv",
    });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
    });

    expect(apiService.uploadTillReport).toHaveBeenCalledWith(mockFile);
  });

  test("Scenario B: exercises catch blocks during pipeline execution crashes", async () => {
    // Forces line 30 catch branch to execute by rejecting the mock request
    vi.mocked(apiService.uploadTillReport).mockRejectedValueOnce(
      new Error("Pipeline Refusal Link Error"),
    );

    const { container } = render(<Home />);
    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const mockFile = new File(["test"], "sample_week.csv", {
      type: "text/csv",
    });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
    });

    expect(screen.getByText("Weekly Hours")).toBeInTheDocument();
  });
});
