import { expect, test, describe, vi, beforeEach } from "vitest";
import { apiService } from "../apiService";

describe("apiService Client Transport Layer Isolation Test Suite", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.spyOn(console, "error").mockImplementation(() => {});
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
    } as unknown as Response);

    const result = await apiService.uploadTillReport(mockFile);
    expect(result.total_employees).toBe(1);
  });

  test("Scenario B: traps backend server internal crashes cleanly within exception handling blocks", async () => {
    const mockFile = new File(["data"], "test.csv", { type: "text/csv" });
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    } as unknown as Response);
    await expect(apiService.uploadTillReport(mockFile)).rejects.toThrow(
      /Backend sanitization pipeline failed/,
    );
  });

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
    } as unknown as Response);

    const result = await apiService.getDashboardData();
    expect(result.total_employees).toBe(2);
  });

  test("Scenario D: handles getDashboardData network failures gracefully", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    } as unknown as Response);
    await expect(apiService.getDashboardData()).rejects.toThrow(
      /Failed to load historical dashboard data cache/,
    );
  });

  test("Scenario E: successfully executes reconcileAnomalyRecord PATCH requests", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
    } as unknown as Response);

    const mockCorrections = {
      employee_id: "E011",
      clock_out: "2026-09-10 17:00",
    };

    await expect(
      apiService.reconcileAnomalyRecord("anomaly-123", mockCorrections),
    ).resolves.toBeUndefined();

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/timesheets/reconcile/anomaly-123",
      {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mockCorrections),
      },
    );
  });

  test("Scenario F: handles reconcileAnomalyRecord network rejections and extracts backend text descriptions", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ detail: "Record reference could not be located." }),
    } as unknown as Response);

    await expect(
      apiService.reconcileAnomalyRecord("invalid-uuid", {}),
    ).rejects.toThrow(
      /Reconciliation tracking rejected \(404\): Record reference could not be located\./,
    );
  });

  test("Scenario G: traps low-level client fetch errors safely within reconcileAnomalyRecord catch segments", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(
      new Error("Network connection dropped."),
    );
    await expect(
      apiService.reconcileAnomalyRecord("anomaly-555", {}),
    ).rejects.toThrow("Network connection dropped.");
  });

  test("Scenario H: triggers fallback unknown error text when a network failure response lacks a clean JSON detail format", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: async () => Promise.reject(new Error("Corrupt response bytes")),
    } as unknown as Response);

    await expect(
      apiService.reconcileAnomalyRecord("anomaly-999", {}),
    ).rejects.toThrow(
      /Reconciliation tracking rejected \(400\): Unknown validation error/,
    );
  });

  test("Scenario I: successfully executes getAnomalyContextWindow GET transactions", async () => {
    const mockContextPayload = {
      center_line: 5,
      adjacent_rows: [],
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockContextPayload,
    } as unknown as Response);

    const result = await apiService.getAnomalyContextWindow(
      "anomaly-uuid-context",
    );
    expect(result.center_line).toBe(5);
  });

  // --- NEW WORKFLOWS TO FLUSH THE REMAINING API SERVICE BRANCHES ---
  test("Scenario J: handles getAnomalyContextWindow HTTP rejection responses cleanly", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      statusText: "Not Found",
    } as unknown as Response);

    await expect(
      apiService.getAnomalyContextWindow("missing-anomaly"),
    ).rejects.toThrow(/Failed to fetch adjacent timeline logs window context/);
  });

  test("Scenario K: intercepts connection drops during getAnomalyContextWindow requests", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(
      new Error("Database connection timeout."),
    );
    await expect(
      apiService.getAnomalyContextWindow("timeout-anomaly"),
    ).rejects.toThrow("Database connection timeout.");
  });
});
