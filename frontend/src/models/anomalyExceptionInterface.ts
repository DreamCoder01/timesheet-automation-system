import { IValidatedShiftSummary } from "./validatedShiftInterface";

export interface IAnomalyExceptionSummary {
  exception_id: string;
  raw_input_line_number: number;
  error_category: string;
  error_severity: "Critical" | "Warning" | "Info";
  diagnostic_message: string;
  resolution_status: "Unresolved" | "Investigating" | "Resolved" | "Overridden";

  // Appended raw backup tracking parameters to hydrate forms accurately
  raw_employee_id?: string | null;
  raw_employee_name?: string | null;
  raw_clock_in?: string | null;
  raw_clock_out?: string | null;
  raw_till_id?: string | null;
}

export interface IGlobalDashboardPayload {
  total_employees: number;
  total_shifts_counted: number;
  total_rows_skipped: number;
  week_covered_range: string;
  healthy_data_pool: IValidatedShiftSummary[];
  unhealthy_data_pool: IAnomalyExceptionSummary[];
}
