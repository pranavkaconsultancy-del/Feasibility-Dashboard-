export interface FeasibilityProject {
  id?: any;
  created_at?: string;
  updated_at?: string;

  // SECTION 1 — PROJECT BASICS
  project_name: string;
  project_address: string;
  road_name: string;
  road_facing_width: number;
  zone_type: string; // "TOD" or "NON-TOD"
  existing_commercial_units: number;
  existing_commercial_carpet_area: number;
  plot_area: number;

  // SECTION 2 — AREA WORKINGS
  existing_road_widening_deduction: number;
  additional_road_widening_deduction: number;
  balance_plot_area: number;
  open_space_deduction: number;
  amenity_plot_deduction: number;
  balance_plot_after_deductions: number;
  basic_fsi_ratio: number;
  basic_fsi_permissible: number;
  premium_fsi_ratio: number;
  premium_fsi_permissible: number;
  tdr_ratio: number;
  tdr_permissible: number;
  total_fsi_permissible: number;
  ancillary_fsi_ratio: number;
  ancillary_fsi_permissible: number;
  total_permissible_fsi: number;
  loading_factor: number;
  total_construction_area: number;
  saleable_factor: number;
  total_saleable_area: number;
  carpet_factor: number;
  total_proposed_carpet: number;
  extra_carpet_percent: number;
  area_returned_to_commercial_members: number;
  balance_area_with_developer_for_sale: number;
  commercial_balance_sale_area_to_developer: number;

  // SECTION 3 — SALES
  typical_floor_sale_area: number;
  typical_floor_sale_rate: number;
  typical_floor_sale_amount: number; // in ₹ Cr
  parking_count: number;
  parking_rate: number; // rate per slot in ₹
  parking_amount: number; // in ₹ Cr
  total_sales_value: number; // in ₹ Cr

  // SECTION 4 — EXPENSES (All cost amounts stored in ₹ Cr)
  // GROUP A — SOCIETY RELATED COST
  land_cost: number;
  agent_brokerage: number;
  stamp_duty_dev_agreement: number;
  additional_area_members_stamp_duty_res: number;
  additional_area_members_stamp_duty_comm: number;
  additional_area_members_gst_res: number;
  additional_area_members_gst_comm: number;
  member_corpus_per_member: number;
  member_corpus_total: number;
  member_betterment_charges_per_member: number;
  member_betterment_charges_total: number;
  movers_packers_per_member: number;
  movers_packers_total: number;
  residential_member_count: number;
  residential_member_rent_rate: number;
  residential_member_rent_months: number;
  residential_member_rent_area: number;
  residential_member_rent_total: number;
  commercial_member_count: number;
  commercial_member_rent_rate: number;
  commercial_member_rent_months: number;
  commercial_member_rent_area: number;
  commercial_member_rent_total: number;
  brokerage_per_res_member: number;
  brokerage_res_member_total: number;
  brokerage_per_comm_member: number;
  brokerage_comm_member_total: number;
  group_a_total: number;

  // GROUP B — SANCTION COST / PREMIUMS
  ready_reckoner_rate: number; // Base rate per sqft
  premium_fsi_cost: number;
  ancillary_fsi_cost: number;
  tdr_cost: number;
  tdr_gst: number;
  tdr_utilization_charges: number;
  development_charges_land: number;
  development_charges_building: number;
  scrutiny_charges: number;
  rada_roda_charges: number;
  labour_cess_rate: number;
  labour_cess_cost: number;
  out_of_pocket_expenses: number;
  fire_premium_charges: number;
  construction_rate_per_sqft: number;
  construction_cost_total: number;
  land_development_cost: number;
  parking_slab_cost: number;
  stack_parking_charges: number;
  gst_on_construction_percent: number;
  gst_on_construction_cost: number;
  architect_fee_percent: number;
  architect_fee_total: number;
  group_b_total: number;

  // GROUP C — OTHER EXPENSES
  overhead_direct: number;
  overhead_indirect: number;
  marketing_and_brokerage: number;
  contingencies_cost: number;
  group_c_total: number;

  // SECTION 5 — PROFIT SUMMARY (All amounts in ₹ Cr)
  total_expenses: number;
  pbit: number;
  interest_rate_percent: number;
  interest_on_construction_cost_25: number;
  interest_on_premium_costs: number;
  interest_on_rent_and_stamp: number;
  interest_on_balance_construction: number;
  total_interest: number;
  pbt: number;
}
