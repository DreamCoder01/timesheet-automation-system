import { IGlobalDashboardPayload } from "../models/anomalyExceptionInterface";

class ApiService {
  // Use a relative path prefix. Next.js next.config.js proxy rules automatically
  // rewrite '/api/v1/*' requests to route to your running Python backend on port 8000
  private baseUrl = "/api/v1/timesheets";

  /**
   * Uploads a raw till report CSV file stream to the backend normalization pipeline.
   * @param file The standard JavaScript File object captured from the browser's file upload field.
   * @returns A promise resolving to a type-safe IGlobalDashboardPayload block.
   */
  public async uploadTillReport(file: File): Promise<IGlobalDashboardPayload> {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${this.baseUrl}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        // Extract technical detail string from backend if available
        const errorText = await response.text();
        throw new Error(
          `Backend sanitization pipeline failed status code ${response.status}: ${errorText || response.statusText}`,
        );
      }

      const payload: IGlobalDashboardPayload = await response.json();
      return payload;
    } catch (error) {
      console.error(
        "Network transaction exception caught in apiService:",
        error,
      );
      throw error;
    }
  }

  /**
   * Fetches the current dashboard data states from the persistence layer database.
   */
  public async getDashboardData(): Promise<IGlobalDashboardPayload> {
    try {
      const response = await fetch(`${this.baseUrl}/dashboard`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to load historical dashboard data cache: ${response.statusText}`,
        );
      }

      const payload: IGlobalDashboardPayload = await response.json();
      return payload;
    } catch (error) {
      console.error("Fetch exception caught in apiService:", error);
      throw error;
    }
  }
}

// Export a single singleton instance to prevent duplicate configuration instantiations across components
export const apiService = new ApiService();
