-- Create table for Feasibility Projects in Supabase matching the exact Indian real-estate redevelopment data model
create table if not exists public.feasibility_projects (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- SECTION 1 — PROJECT BASICS
  project_name text not null,
  project_address text,
  road_name text,
  road_facing_width numeric default 0,
  zone_type text default 'NON-TOD',
  existing_commercial_units integer default 0,
  existing_commercial_carpet_area numeric default 0,
  plot_area numeric default 0,

  -- SECTION 2 — AREA WORKINGS
  existing_road_widening_deduction numeric default 0,
  additional_road_widening_deduction numeric default 0,
  balance_plot_area numeric default 0,
  open_space_deduction numeric default 0,
  amenity_plot_deduction numeric default 0,
  balance_plot_after_deductions numeric default 0,
  basic_fsi_ratio numeric default 1.1,
  basic_fsi_permissible numeric default 0,
  premium_fsi_ratio numeric default 0.5,
  premium_fsi_permissible numeric default 0,
  tdr_ratio numeric default 1.4,
  tdr_permissible numeric default 0,
  total_fsi_permissible numeric default 0,
  ancillary_fsi_ratio numeric default 0.8,
  ancillary_fsi_permissible numeric default 0,
  total_permissible_fsi numeric default 0,
  loading_factor numeric default 1.18,
  total_construction_area numeric default 0,
  saleable_factor numeric default 1.1,
  total_saleable_area numeric default 0,
  carpet_factor numeric default 0.8,
  total_proposed_carpet numeric default 0,
  extra_carpet_percent numeric default 35,
  area_returned_to_commercial_members numeric default 0,
  balance_area_with_developer_for_sale numeric default 0,
  commercial_balance_sale_area_to_developer numeric default 0,

  -- SECTION 3 — SALES
  typical_floor_sale_area numeric default 0,
  typical_floor_sale_rate numeric default 12000,
  typical_floor_sale_amount numeric default 0,
  parking_count integer default 0,
  parking_rate numeric default 300000,
  parking_amount numeric default 0,
  total_sales_value numeric default 0,

  -- SECTION 4 — EXPENSES (All cost amounts stored in ₹ Cr)
  -- GROUP A — SOCIETY RELATED COST
  land_cost numeric default 0,
  agent_brokerage numeric default 0,
  stamp_duty_dev_agreement numeric default 0,
  additional_area_members_stamp_duty_res numeric default 0.15,
  additional_area_members_stamp_duty_comm numeric default 0.05,
  additional_area_members_gst_res numeric default 0.08,
  additional_area_members_gst_comm numeric default 0.03,
  member_corpus_per_member numeric default 500000,
  member_corpus_total numeric default 0,
  member_betterment_charges_per_member numeric default 50000,
  member_betterment_charges_total numeric default 0,
  movers_packers_per_member numeric default 40000,
  movers_packers_total numeric default 0,
  residential_member_count integer default 0,
  residential_member_rent_rate numeric default 50,
  residential_member_rent_months integer default 24,
  residential_member_rent_area numeric default 0,
  residential_member_rent_total numeric default 0,
  commercial_member_count integer default 0,
  commercial_member_rent_rate numeric default 80,
  commercial_member_rent_months integer default 24,
  commercial_member_rent_area numeric default 0,
  commercial_member_rent_total numeric default 0,
  brokerage_per_res_member numeric default 40000,
  brokerage_res_member_total numeric default 0,
  brokerage_per_comm_member numeric default 60000,
  brokerage_comm_member_total numeric default 0,
  group_a_total numeric default 0,

  -- GROUP B — SANCTION COST / PREMIUMS
  ready_reckoner_rate numeric default 5000,
  premium_fsi_cost numeric default 0,
  ancillary_fsi_cost numeric default 0,
  tdr_cost numeric default 0,
  tdr_gst numeric default 0,
  tdr_utilization_charges numeric default 0.12,
  development_charges_land numeric default 0,
  development_charges_building numeric default 0,
  scrutiny_charges numeric default 0.08,
  rada_roda_charges numeric default 0.04,
  labour_cess_rate numeric default 1,
  labour_cess_cost numeric default 0,
  out_of_pocket_expenses numeric default 0.15,
  fire_premium_charges numeric default 0.18,
  construction_rate_per_sqft numeric default 2800,
  construction_cost_total numeric default 0,
  land_development_cost numeric default 0.10,
  parking_slab_cost numeric default 0.30,
  stack_parking_charges numeric default 0.12,
  gst_on_construction_percent numeric default 18,
  gst_on_construction_cost numeric default 0,
  architect_fee_percent numeric default 3,
  architect_fee_total numeric default 0,
  group_b_total numeric default 0,

  -- GROUP C — OTHER EXPENSES (All stored in ₹ Cr)
  overhead_direct numeric default 0,
  overhead_indirect numeric default 0,
  marketing_and_brokerage numeric default 0,
  contingencies_cost numeric default 0,
  group_c_total numeric default 0,

  -- SECTION 5 — PROFIT SUMMARY (All stored in ₹ Cr)
  total_expenses numeric default 0,
  pbit numeric default 0,
  interest_rate_percent numeric default 12,
  interest_on_construction_cost_25 numeric default 0,
  interest_on_premium_costs numeric default 0,
  interest_on_rent_and_stamp numeric default 0,
  interest_on_balance_construction numeric default 0,
  total_interest numeric default 0,
  pbt numeric default 0,

  -- SECTION 6 — NEW MODULE DETAILS & PLATFORM EXTENSIONS
  project_type text default 'Residential',
  units_count integer default 100,
  project_duration integer default 24,

  registration_cost numeric default 0.05,
  legal_charges numeric default 0.02,

  construction_breakdown_mode text default 'percentage',
  civil_work_percent numeric default 30,
  material_cost_percent numeric default 30,
  labour_cost_percent numeric default 15,
  mep_cost_percent numeric default 10,
  finishing_cost_percent numeric default 10,
  contingency_cost_percent numeric default 5,
  civil_work_val numeric default 0,
  material_cost_val numeric default 0,
  labour_cost_val numeric default 0,
  mep_cost_val numeric default 0,
  finishing_cost_val numeric default 0,
  contingency_cost_val numeric default 0,

  rera_fees numeric default 0.05,
  govt_approval_charges numeric default 0.20,
  environmental_clearance numeric default 0.10,
  fire_noc_charges numeric default 0.05,
  other_statutory_costs numeric default 0.10,

  sold_count integer default 15,
  booked_count integer default 10,
  sales_months_elapsed integer default 6,

  market_rate_per_sqft numeric default 11500,
  competitor_name_1 text default 'Skyline Residency',
  competitor_rate_1 numeric default 12500,
  competitor_dist_1 numeric default 0.5,
  competitor_name_2 text default 'Aura Grand',
  competitor_rate_2 numeric default 13000,
  competitor_dist_2 numeric default 1.2,
  demand_analysis text,
  supply_analysis text default 'Moderate',
  growth_potential_rating text default 'High',
  growth_potential_reason text,

  risk_construction text default 'Medium',
  risk_construction_reason text,
  risk_market text default 'Low',
  risk_market_reason text,
  risk_financial text default 'Medium',
  risk_financial_reason text,
  risk_legal text default 'Low',
  risk_legal_reason text,

  -- SIMPLE STEPPER INPUTS & DYNAMIC CALCULATIONS
  basic_fsi_percent numeric default 0,
  tdr_percent numeric default 0,
  govt_approval_mode text default 'absolute',
  govt_approval_percent numeric default 0,
  govt_approval_cost_total numeric default 0,
  construction_cost_per_sqft numeric default 0,
  marketing_percent numeric default 0,
  other_costs_total numeric default 0,
  loan_amount_mode text default 'auto',
  loan_amount numeric default 0,
  loan_period_years numeric default 0,
  interest_cost numeric default 0,
  deductions_total numeric default 0,
  net_plot_area numeric default 0,
  total_fsi_percent numeric default 0,
  buildable_area numeric default 0
);

-- Enable Row Level Security (RLS)
alter table public.feasibility_projects enable row level security;

-- Drop policy if exists first to prevent errors on re-running SQL
drop policy if exists "Allow all operations for everyone" on public.feasibility_projects;

-- Create an open policy for select, insert, update, delete for the preview
create policy "Allow all operations for everyone"
on public.feasibility_projects
for all
using (true)
with check (true);

-- Create trigger to auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on public.feasibility_projects;
create trigger set_updated_at
before update on public.feasibility_projects
for each row
execute function public.handle_updated_at();

-- Explicitly grant access to the table for API-level queries
grant all on table public.feasibility_projects to anon;
grant all on table public.feasibility_projects to authenticated;
grant all on table public.feasibility_projects to service_role;

