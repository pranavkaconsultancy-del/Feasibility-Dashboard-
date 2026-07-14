import { FeasibilityProject } from "./types";

export function calculateProject(inputs: Record<string, any>): any {
  // 1. PROJECT INFO (Screen 1)
  const project_name = inputs.project_name || "New Feasibility Study";
  const project_address = inputs.project_address || "";
  const plot_area = Math.max(0, Number(inputs.plot_area) || 0);
  const zone_type = inputs.zone_type || "NON-TOD";

  // 2. WHAT YOU CAN BUILD (Screen 2)
  const basic_fsi_percent = Math.max(0, Number(inputs.basic_fsi_percent) || 0);
  const tdr_percent = Math.max(0, Number(inputs.tdr_percent) || 0);
  
  const existing_road_widening_deduction = Math.max(0, Number(inputs.existing_road_widening_deduction) || 0);
  const open_space_deduction = Math.max(0, Number(inputs.open_space_deduction) || 0);
  const amenity_plot_deduction = Math.max(0, Number(inputs.amenity_plot_deduction) || 0);

  const deductions_total = existing_road_widening_deduction + open_space_deduction + amenity_plot_deduction;
  const net_plot_area = Math.max(0, plot_area - deductions_total);
  const total_fsi_percent = basic_fsi_percent + tdr_percent;
  const buildable_area = net_plot_area * (total_fsi_percent / 100);

  // 3. MONEY IN (Sales - Screen 3)
  const residential_rate_per_sqft = Math.max(0, Number(inputs.residential_rate_per_sqft) || 0);
  const parking_count = Math.max(0, Number(inputs.parking_count) || 0);
  const parking_rate = Math.max(0, Number(inputs.parking_rate) || 0);

  const typical_floor_sale_amount = buildable_area * residential_rate_per_sqft;
  const parking_amount = parking_count * parking_rate;
  const total_sales_value = typical_floor_sale_amount + parking_amount;

  // 4. MONEY OUT (Costs - Screen 4)
  const land_cost = Math.max(0, Number(inputs.land_cost) || 0);
  
  const govt_approval_mode = inputs.govt_approval_mode || "absolute";
  const govt_approval_percent = Math.max(0, Number(inputs.govt_approval_percent) || 0);
  const govt_approval_charges = Math.max(0, Number(inputs.govt_approval_charges) || 0);

  const govt_approval_cost_total = govt_approval_mode === "percentage"
    ? total_sales_value * (govt_approval_percent / 100)
    : govt_approval_charges;

  const construction_cost_per_sqft = Math.max(0, Number(inputs.construction_cost_per_sqft) || 0);
  const construction_cost_total = construction_cost_per_sqft * buildable_area;

  const marketing_percent = Math.max(0, Number(inputs.marketing_percent) || 0);
  const other_costs_total = total_sales_value * (marketing_percent / 100);

  const total_expenses = land_cost + govt_approval_cost_total + construction_cost_total + other_costs_total;

  // 5. YOUR PROFIT (Screen 5)
  const pbit = total_sales_value - total_expenses; // Profit Before Interest

  const loan_amount_mode = inputs.loan_amount_mode || "auto";
  const loan_amount_input = Math.max(0, Number(inputs.loan_amount) || 0);
  // Default to 50% of construction cost if auto
  const loan_amount = loan_amount_mode === "auto"
    ? construction_cost_total * 0.5
    : loan_amount_input;

  const interest_rate_percent = Math.max(0, Number(inputs.interest_rate_percent) || 0);
  const loan_period_years = Math.max(0, Number(inputs.loan_period_years) || 0);

  const interest_cost = loan_amount * (interest_rate_percent / 100) * loan_period_years;
  const pbt = pbit - interest_cost; // Final Profit

  return {
    // Inputs (for database saving convenience)
    project_name,
    project_address,
    plot_area,
    zone_type,

    basic_fsi_percent,
    tdr_percent,
    existing_road_widening_deduction,
    open_space_deduction,
    amenity_plot_deduction,

    residential_rate_per_sqft,
    parking_count,
    parking_rate,

    land_cost,
    govt_approval_mode,
    govt_approval_percent,
    govt_approval_charges,
    govt_approval_cost_total,
    construction_cost_per_sqft,
    construction_cost_total,
    marketing_percent,
    other_costs_total,
    total_expenses,

    pbit,
    loan_amount_mode,
    loan_amount,
    interest_rate_percent,
    loan_period_years,
    interest_cost,
    pbt,

    // Readable summaries
    deductions_total,
    net_plot_area,
    total_fsi_percent,
    buildable_area,
    typical_floor_sale_amount,
    parking_amount,
    total_sales_value
  };
}

export function formatIndianCurrency(val: number): string {
  const isNegative = val < 0;
  const absVal = Math.abs(val);
  let formatted = "";
  if (absVal >= 10000000) {
    formatted = (absVal / 10000000).toFixed(2) + " Cr";
  } else if (absVal >= 100000) {
    formatted = (absVal / 100000).toFixed(2) + " Lakh";
  } else {
    formatted = absVal.toLocaleString("en-IN");
  }
  return (isNegative ? "-" : "") + "₹" + formatted;
}
