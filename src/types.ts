export interface FeasibilityProject {
  id?: any;
  created_at?: string;
  updated_at?: string;

  // Screen 1: Project Info
  project_name: string;
  project_address: string; // Location
  plot_area: number;
  zone_type: string; // "TOD" or "NON-TOD"

  // Screen 2: What You Can Build
  basic_fsi_percent: number; // FSI allowed (%)
  tdr_percent: number; // TDR (%)
  existing_road_widening_deduction: number;
  open_space_deduction: number;
  amenity_plot_deduction: number;

  // Screen 3: Money In (Sales)
  residential_rate_per_sqft: number; // Selling rate per sq.ft.
  parking_count: number; // Number of parking spots
  parking_rate: number; // Rate per spot

  // Screen 4: Money Out (Costs)
  land_cost: number; // Land purchase + stamp duty + registration + legal
  govt_approval_mode: string; // "percentage" | "absolute"
  govt_approval_percent: number; // Government & Approval Costs %
  govt_approval_charges: number; // Government & Approval Costs direct ₹
  construction_cost_per_sqft: number; // Construction rate per sqft
  marketing_percent: number; // Other Costs % of sales (marketing, overheads, contingency)

  // Screen 5: Your Profit
  loan_amount_mode: string; // "auto" | "custom"
  loan_amount: number; // Average loan amount
  interest_rate_percent: number; // Interest rate
  loan_period_years: number; // Loan period in years
}
