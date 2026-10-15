export interface IValidatedShiftSummary {
  employee_id: string;
  employee_full_name: string;
  shift_date: string;
  hours_display: string; // Format: "44:30"
  decimal_hours: number; // Format: 44.50
  status: "Complete" | "Processing" | "Anomaly" | "Flagged";
}
