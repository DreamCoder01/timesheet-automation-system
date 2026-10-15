import { expect, test, describe, vi, beforeEach } from "vitest";
import { apiService } from "../apiService";

describe("apiService Client Transport Layer Isolation Test Suite", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  test("Scenario A: processes successful HTTP multipart transactions and returns response models", async () => {
    const mockFile = new File(["data"], "test.csv", { type: "text/csv" });
    const mockResponsePayload = {
      total_employees: 1,
      total_shifts_counted: 1,
      total_rows_skipped: 0,
      week_covered_range: "Mon 7 Sep - Sun 13 Sep",
      healthy_data_pool: [],
      unhealthy_data_pool: [],
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponsePayload,
    } as Response);

    const result = await apiService.uploadTillReport(mockFile);
    expect(result.total_employees).toBe(1);
  });

  test("Scenario B: traps backend server internal crashes cleanly within exception handling blocks", async () => {
    const mockFile = new File(["data"], "test.csv", { type: "text/csv" });
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Error",
    } as Response);
    await expect(apiService.uploadTillReport(mockFile)).rejects.toThrow();
  });

  // Added: Exercises lines 46-64 completely to clear the 80%+ floor
  test("Scenario C: executes getDashboardData round-trips successfully", async () => {
    const mockPayload = {
      total_employees: 2,
      total_shifts_counted: 5,
      total_rows_skipped: 1,
      week_covered_range: "Mon 7 Sep",
      healthy_data_pool: [],
      unhealthy_data_pool: [],
    };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockPayload,
    } as Response);

    const result = await apiService.getDashboardData();
    expect(result.total_employees).toBe(2);
  });

  test("Scenario D: handles getDashboardData network failures gracefully", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    } as Response);
    await expect(apiService.getDashboardData()).rejects.toThrow();
  });
});
