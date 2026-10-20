import {
  IGlobalDashboardPayload,
  IAnomalyExceptionSummary,
} from "../models/anomalyExceptionInterface";

export interface IReconciliationCorrection {
  employee_id?: string | null;
  employee_name?: string | null;
  clock_in?: string | null;
  clock_out?: string | null;
  till_id?: string | null;
}

export interface IContextWindowPayload {
  center_line: number;
  adjacent_rows: IAnomalyExceptionSummary[];
}

class ApiService {
  private baseUrl = "/api/v1/timesheets";

  public async uploadTillReport(file: File): Promise<IGlobalDashboardPayload> {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${this.baseUrl}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Backend sanitization pipeline failed: ${errorText || response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error(
        "Network transaction exception caught in apiService:",
        error,
      );
      throw error;
    }
  }

  public async getDashboardData(): Promise<IGlobalDashboardPayload> {
    try {
      const response = await fetch(`${this.baseUrl}/dashboard`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to load historical dashboard data cache: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Fetch exception caught in apiService:", error);
      throw error;
    }
  }

  /**
   * Queries adjacent row lines surrounding a target quarantine item to provide time-stream context.
   */
  public async getAnomalyContextWindow(
    exceptionId: string,
  ): Promise<IContextWindowPayload> {
    try {
      const response = await fetch(
        `${this.baseUrl}/reconcile/${exceptionId}/context`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch adjacent timeline logs window context: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Context fetch exception caught in apiService:", error);
      throw error;
    }
  }

  public async reconcileAnomalyRecord(
    exceptionId: string,
    corrections: IReconciliationCorrection,
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/reconcile/${exceptionId}`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(corrections),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Unknown validation error" }));
        const errorMessage = errorData.detail || response.statusText;
        throw new Error(
          `Reconciliation tracking rejected (${response.status}): ${errorMessage}`,
        );
      }
    } catch (error) {
      console.error(
        "Failed to transmit patch network transaction in apiService:",
        error,
      );
      throw error;
    }
  }
}

export const apiService = new ApiService();
