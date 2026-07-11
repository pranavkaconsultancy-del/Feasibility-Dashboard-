import React, { useState } from "react";
import { 
  Briefcase, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Save, 
  FileText, 
  Building2, 
  Coins, 
  TrendingUp, 
  Percent, 
  MapPin, 
  Sparkles,
  HelpCircle
} from "lucide-react";

interface InteractiveCalculatorProps {
  inputs: Record<string, any>;
  setInputs: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  calculatedData: any;
  currentId: any;
  isSaving: boolean;
  onSave: (e: React.FormEvent) => void;
  onDownloadPDF: () => void;
  formatCur: (val: number) => string;
  formatSqFt: (val: number) => string;
  onNavigateToChat: () => void;
}

// Compact Field Row helper for simple inputs
interface FieldProps {
  label: string;
  helper: string;
  id: string;
  type?: string;
  value: any;
  onChange: (val: any) => void;
  suffix?: string;
  step?: string;
  disabled?: boolean;
}

const FieldRow: React.FC<FieldProps> = ({
  label,
  helper,
  id,
  type = "number",
  value,
  onChange,
  suffix,
  step,
  disabled
}) => (
  <div className="space-y-1">
    <div className="flex justify-between items-baseline">
      <label htmlFor={id} className="block text-xs font-semibold text-gray-700">{label}</label>
      {suffix && <span className="text-3xs font-mono text-gray-400 font-semibold">{suffix}</span>}
    </div>
    <input
      id={id}
      type={type}
      step={step}
      disabled={disabled}
      value={value ?? ""}
      onChange={(e) => onChange(type === "number" ? (e.target.value === "" ? 0 : Number(e.target.value)) : e.target.value)}
      className={`w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all font-mono ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
    />
    <p className="text-3xs text-gray-400 leading-tight">{helper}</p>
  </div>
);

export const InteractiveCalculator: React.FC<InteractiveCalculatorProps> = ({
  inputs,
  setInputs,
  calculatedData,
  currentId,
  isSaving,
  onSave,
  onDownloadPDF,
  formatCur,
  formatSqFt,
  onNavigateToChat
}) => {
  // Collapsible sections
  const [expanded, setExpanded] = useState({
    basics: true,
    workings: true,
    sales: true,
    groupA: true,
    groupB: true,
    financing: true
  });

  const toggle = (sec: keyof typeof expanded) => {
    setExpanded(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const updateField = (field: string, val: any) => {
    setInputs(prev => ({ ...prev, [field]: val }));
  };

  const data = calculatedData;

  // Format Crores helper for display
  const formatCr = (val: number) => {
    return `₹${val.toFixed(2)} Cr`;
  };

  // Profit margin color and status helper
  const marginPercent = data.total_sales_value > 0 ? (data.pbt / data.total_sales_value) * 100 : 0;
  const isHealthy = marginPercent >= 15;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* LEFT COLUMN: Input form containing the 5 sections */}
      <form onSubmit={onSave} className="lg:col-span-7 space-y-6">
        
        {/* Active Study Banner */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4.5 h-4.5 text-blue-600" />
            <div>
              <span className="text-xs text-gray-500 block uppercase font-mono tracking-wider font-semibold">
                Active Study File
              </span>
              <span className="font-semibold text-gray-900 text-sm">
                {inputs.project_name || "Untitled Feasibility study"}
              </span>
            </div>
          </div>
          <div>
            {currentId ? (
              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-2xs font-semibold font-mono">
                CONNECTED TO SUPABASE DB
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-2xs font-semibold font-mono animate-pulse">
                UNSAVED WORKSPACE DRAFT
              </span>
            )}
          </div>
        </div>

        {/* SECTION 1 — PROJECT BASICS */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <button
            type="button"
            onClick={() => toggle("basics")}
            className="w-full px-5 py-4 flex items-center justify-between bg-gray-50/70 border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs font-mono">1</span>
              <span className="font-bold text-gray-900 text-sm tracking-tight uppercase">SECTION 1 — PROJECT BASICS</span>
            </div>
            {expanded.basics ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {expanded.basics && (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <FieldRow
                  id="input-project_name"
                  label="Project Name"
                  helper="Used for naming and identifying this feasibility report"
                  type="text"
                  value={inputs.project_name}
                  onChange={(val) => updateField("project_name", val)}
                />
              </div>
              <div className="sm:col-span-2">
                <FieldRow
                  id="input-project_address"
                  label="Project Address / Location"
                  helper="The exact location of the property being redeveloped"
                  type="text"
                  value={inputs.project_address}
                  onChange={(val) => updateField("project_address", val)}
                />
              </div>
              <FieldRow
                id="input-road_name"
                label="Fronting Road Name"
                helper="Name of primary street/road access"
                type="text"
                value={inputs.road_name}
                onChange={(val) => updateField("road_name", val)}
              />
              <FieldRow
                id="input-road_facing_width"
                label="Road Facing Width"
                suffix="ft"
                helper="Width of fronting road in feet (affects permissible TDR / FSI)"
                value={inputs.road_facing_width}
                onChange={(val) => updateField("road_facing_width", val)}
              />
              <div className="space-y-1">
                <label htmlFor="input-zone_type" className="block text-xs font-semibold text-gray-700">Zone Type</label>
                <select
                  id="input-zone_type"
                  value={inputs.zone_type || "NON-TOD"}
                  onChange={(e) => updateField("zone_type", e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all font-mono"
                >
                  <option value="NON-TOD">NON-TOD (Standard redevelopment rules)</option>
                  <option value="TOD">TOD (Transit Oriented Development - Higher FSI)</option>
                </select>
                <p className="text-3xs text-gray-400 leading-tight">TOD applies if near railway stations or major transit hubs</p>
              </div>
              <FieldRow
                id="input-plot_area"
                label="Total Plot Area"
                suffix="sqft"
                helper="Registered land area as per property documents"
                value={inputs.plot_area}
                onChange={(val) => updateField("plot_area", val)}
              />
              <FieldRow
                id="input-existing_commercial_units"
                label="Existing Commercial Units"
                suffix="units"
                helper="Number of retail stores/commercial units currently on site"
                value={inputs.existing_commercial_units}
                onChange={(val) => updateField("existing_commercial_units", val)}
              />
              <FieldRow
                id="input-existing_commercial_carpet_area"
                label="Existing Commercial Carpet Area"
                suffix="sqft"
                helper="Sum of current retail carpet area (auto-rehabilitated)"
                value={inputs.existing_commercial_carpet_area}
                onChange={(val) => updateField("existing_commercial_carpet_area", val)}
              />
            </div>
          )}
        </div>

        {/* SECTION 2 — AREA WORKINGS */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <button
            type="button"
            onClick={() => toggle("workings")}
            className="w-full px-5 py-4 flex items-center justify-between bg-gray-50/70 border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs font-mono">2</span>
              <span className="font-bold text-gray-900 text-sm tracking-tight uppercase">SECTION 2 — AREA & FSI WORKINGS</span>
            </div>
            {expanded.workings ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {expanded.workings && (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldRow
                  id="input-existing_road_widening_deduction"
                  label="Existing Road Widening"
                  suffix="sqft"
                  helper="Area lost to existing road expansion schemes"
                  value={inputs.existing_road_widening_deduction}
                  onChange={(val) => updateField("existing_road_widening_deduction", val)}
                />
                <FieldRow
                  id="input-additional_road_widening_deduction"
                  label="Additional Road Widening"
                  suffix="sqft"
                  helper="Extra setbacks/reservations ordered by the municipality"
                  value={inputs.additional_road_widening_deduction}
                  onChange={(val) => updateField("additional_road_widening_deduction", val)}
                />
                <FieldRow
                  id="input-open_space_deduction"
                  label="Required Open Space Setback"
                  suffix="sqft"
                  helper="Mandatory ground-level garden/open space setback"
                  value={inputs.open_space_deduction}
                  onChange={(val) => updateField("open_space_deduction", val)}
                />
                <FieldRow
                  id="input-amenity_plot_deduction"
                  label="Amenity Plot Surrender"
                  suffix="sqft"
                  helper="Land ceded to city for civic amenities"
                  value={inputs.amenity_plot_deduction}
                  onChange={(val) => updateField("amenity_plot_deduction", val)}
                />
              </div>

              <div className="pt-3 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">FSI Ratios (Multipliers)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FieldRow
                    id="input-basic_fsi_ratio"
                    label="Basic FSI Ratio"
                    suffix="ratio"
                    step="0.01"
                    helper="Free foundational FSI (typically 1.1 or 1.5)"
                    value={inputs.basic_fsi_ratio}
                    onChange={(val) => updateField("basic_fsi_ratio", val)}
                  />
                  <FieldRow
                    id="input-premium_fsi_ratio"
                    label="Premium FSI"
                    suffix="ratio"
                    step="0.01"
                    helper="Paid FSI bought from municipal corp (typically 0.5)"
                    value={inputs.premium_fsi_ratio}
                    onChange={(val) => updateField("premium_fsi_ratio", val)}
                  />
                  <FieldRow
                    id="input-tdr_ratio"
                    label="TDR Ratio"
                    suffix="ratio"
                    step="0.01"
                    helper="Transferable Development Rights purchased (max 1.4)"
                    value={inputs.tdr_ratio}
                    onChange={(val) => updateField("tdr_ratio", val)}
                  />
                  <FieldRow
                    id="input-ancillary_fsi_ratio"
                    label="Ancillary FSI"
                    suffix="ratio"
                    step="0.01"
                    helper="Ancillary lobby/passage FSI concessions (typically 0.8)"
                    value={inputs.ancillary_fsi_ratio}
                    onChange={(val) => updateField("ancillary_fsi_ratio", val)}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Efficiency Factors & Rehabilation Parameters</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FieldRow
                    id="input-loading_factor"
                    label="Loading Factor"
                    suffix="ratio"
                    step="0.01"
                    helper="Multiplied to permissible FSI to get raw construction area (typically 1.18)"
                    value={inputs.loading_factor}
                    onChange={(val) => updateField("loading_factor", val)}
                  />
                  <FieldRow
                    id="input-saleable_factor"
                    label="Saleable Factor"
                    suffix="ratio"
                    step="0.01"
                    helper="Ratio of total construction area to saleable area (typically 1.1)"
                    value={inputs.saleable_factor}
                    onChange={(val) => updateField("saleable_factor", val)}
                  />
                  <FieldRow
                    id="input-carpet_factor"
                    label="Carpet Factor"
                    suffix="ratio"
                    step="0.01"
                    helper="Efficiency ratio to calculate carpet area from saleable (typically 0.8)"
                    value={inputs.carpet_factor}
                    onChange={(val) => updateField("carpet_factor", val)}
                  />
                  <FieldRow
                    id="input-extra_carpet_percent"
                    label="Extra Rehab Carpet"
                    suffix="%"
                    helper="Bonus carpet area granted to existing society members (typically 35%)"
                    value={inputs.extra_carpet_percent}
                    onChange={(val) => updateField("extra_carpet_percent", val)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3 — SALES */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <button
            type="button"
            onClick={() => toggle("sales")}
            className="w-full px-5 py-4 flex items-center justify-between bg-gray-50/70 border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs font-mono">3</span>
              <span className="font-bold text-gray-900 text-sm tracking-tight uppercase">SECTION 3 — SALES REVENUE EXPECTATIONS</span>
            </div>
            {expanded.sales ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {expanded.sales && (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldRow
                id="input-typical_floor_sale_area"
                label="Explicit Typical Floor Sale Area"
                suffix="sqft"
                helper="If specified, overrides developer's balance sale area. Leave blank to auto-use all developer balance carpet!"
                value={inputs.typical_floor_sale_area}
                onChange={(val) => updateField("typical_floor_sale_area", val)}
              />
              <FieldRow
                id="input-typical_floor_sale_rate"
                label="Typical Floor Sale Rate"
                suffix="Rs/sqft"
                helper="Market selling price per square foot of saleable area (typically ₹10k - ₹35k depending on micro-market)"
                value={inputs.typical_floor_sale_rate}
                onChange={(val) => updateField("typical_floor_sale_rate", val)}
              />
              <FieldRow
                id="input-parking_count"
                label="Commercial Parking Slots for Sale"
                suffix="slots"
                helper="Number of car parking bays available for developer to sell separately"
                value={inputs.parking_count}
                onChange={(val) => updateField("parking_count", val)}
              />
              <FieldRow
                id="input-parking_rate"
                label="Parking Price per Slot"
                suffix="Rs/slot"
                helper="Price charged to buyers for a single car parking slot (e.g., ₹3,00,000)"
                value={inputs.parking_rate}
                onChange={(val) => updateField("parking_rate", val)}
              />
            </div>
          )}
        </div>

        {/* SECTION 4 — EXPENSES - GROUP A */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <button
            type="button"
            onClick={() => toggle("groupA")}
            className="w-full px-5 py-4 flex items-center justify-between bg-gray-50/70 border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs font-mono">4A</span>
              <span className="font-bold text-gray-900 text-sm tracking-tight uppercase">SEC 4 — GROUP A: SOCIETY REHABILITATION</span>
            </div>
            {expanded.groupA ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {expanded.groupA && (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldRow
                  id="input-land_cost"
                  label="Direct Land Cost"
                  suffix="Rs"
                  helper="Outright land acquisition costs if any. Usually 0 in rehab-led housing societies."
                  value={inputs.land_cost}
                  onChange={(val) => updateField("land_cost", val)}
                />
                <FieldRow
                  id="input-agent_brokerage"
                  label="Agent Sourcing Brokerage Rate"
                  suffix="ratio"
                  step="0.01"
                  helper="Commission paid to land aggregator or agent (e.g., 0.05 for 5%)"
                  value={inputs.agent_brokerage}
                  onChange={(val) => updateField("agent_brokerage", val)}
                />
                <FieldRow
                  id="input-stamp_duty_dev_agreement"
                  label="Stamp Duty on Dev Agreement"
                  suffix="Rs"
                  helper="Stamp duty registration on redevelopment contract (leave blank to calculate at 1% of land value)"
                  value={inputs.stamp_duty_dev_agreement}
                  onChange={(val) => updateField("stamp_duty_dev_agreement", val)}
                />
                <FieldRow
                  id="input-residential_member_count"
                  label="Residential Society Member Count"
                  suffix="members"
                  helper="Number of families residing in society who require displacement rent and corpus"
                  value={inputs.residential_member_count}
                  onChange={(val) => updateField("residential_member_count", val)}
                />
              </div>

              <div className="pt-3 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Displacement Rent benefits (Rent Compensation)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FieldRow
                    id="input-residential_member_rent_rate"
                    label="Res Member Monthly Rent Rate"
                    suffix="Rs/sqft"
                    helper="Monthly displacement rent per sqft of existing carpet (typically ₹50/sqft)"
                    value={inputs.residential_member_rent_rate}
                    onChange={(val) => updateField("residential_member_rent_rate", val)}
                  />
                  <FieldRow
                    id="input-residential_member_rent_area"
                    label="Existing Res Carpet Area Sum"
                    suffix="sqft"
                    helper="Sum of current residential carpet area on which monthly rent is calculated"
                    value={inputs.residential_member_rent_area}
                    onChange={(val) => updateField("residential_member_rent_area", val)}
                  />
                  <FieldRow
                    id="input-residential_member_rent_months"
                    label="Displacement Period Months"
                    suffix="months"
                    helper="Duration of construction rent benefits (typically 24 - 36 months)"
                    value={inputs.residential_member_rent_months}
                    onChange={(val) => updateField("residential_member_rent_months", val)}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Rehab Allowances & Sinking Corpus (Per Member Rates)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FieldRow
                    id="input-member_corpus_per_member"
                    label="Sinking Fund Corpus per Member"
                    suffix="Rs"
                    helper="One-time cash corpus given to each existing member as rehab premium (e.g., ₹5,00,000)"
                    value={inputs.member_corpus_per_member}
                    onChange={(val) => updateField("member_corpus_per_member", val)}
                  />
                  <FieldRow
                    id="input-member_betterment_charges_per_member"
                    label="Betterment Fee per Member"
                    suffix="Rs"
                    helper="Upgrades allowance provided per society member (e.g. ₹50,000)"
                    value={inputs.member_betterment_charges_per_member}
                    onChange={(val) => updateField("member_betterment_charges_per_member", val)}
                  />
                  <FieldRow
                    id="input-movers_packers_per_member"
                    label="Movers & Packers Allowance"
                    suffix="Rs"
                    helper="Shifting allowance paid per member to move out and return (e.g. ₹40,000)"
                    value={inputs.movers_packers_per_member}
                    onChange={(val) => updateField("movers_packers_per_member", val)}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Commercial Rehab Rent & Brokerage Allowances</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <FieldRow
                    id="input-commercial_member_rent_rate"
                    label="Comm Rent Rate"
                    suffix="Rs/sqft"
                    helper="Monthly displacement rent for existing commercial carpet"
                    value={inputs.commercial_member_rent_rate}
                    onChange={(val) => updateField("commercial_member_rent_rate", val)}
                  />
                  <FieldRow
                    id="input-commercial_member_rent_months"
                    label="Comm Rent Months"
                    suffix="months"
                    helper="Commercial displacement duration"
                    value={inputs.commercial_member_rent_months}
                    onChange={(val) => updateField("commercial_member_rent_months", val)}
                  />
                  <FieldRow
                    id="input-brokerage_per_res_member"
                    label="Brokerage per Res"
                    suffix="Rs"
                    helper="Brokerage assistance for res members to find rent flat (e.g., ₹40,000)"
                    value={inputs.brokerage_per_res_member}
                    onChange={(val) => updateField("brokerage_per_res_member", val)}
                  />
                  <FieldRow
                    id="input-brokerage_per_comm_member"
                    label="Brokerage per Comm"
                    suffix="Rs"
                    helper="Brokerage assistance for commercial members (e.g., ₹60,000)"
                    value={inputs.brokerage_per_comm_member}
                    onChange={(val) => updateField("brokerage_per_comm_member", val)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4 — EXPENSES - GROUP B */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <button
            type="button"
            onClick={() => toggle("groupB")}
            className="w-full px-5 py-4 flex items-center justify-between bg-gray-50/70 border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs font-mono">4B</span>
              <span className="font-bold text-gray-900 text-sm tracking-tight uppercase">SEC 4 — GROUP B: SANCTIONS & CONSTRUCTION</span>
            </div>
            {expanded.groupB ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {expanded.groupB && (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FieldRow
                  id="input-ready_reckoner_rate"
                  label="Ready Reckoner (RR) Rate"
                  suffix="Rs/sqft"
                  helper="Government-mandated base land evaluation rate. Direct multiplier for Premium FSI buyouts!"
                  value={inputs.ready_reckoner_rate}
                  onChange={(val) => updateField("ready_reckoner_rate", val)}
                />
                <FieldRow
                  id="input-tdr_utilization_charges"
                  label="TDR Buying Rate Coeff"
                  suffix="coeff"
                  step="0.01"
                  helper="Purchasing multiplier for TDR based on RR rate (typically 0.12 of RR)"
                  value={inputs.tdr_utilization_charges}
                  onChange={(val) => updateField("tdr_utilization_charges", val)}
                />
                <FieldRow
                  id="input-scrutiny_charges"
                  label="Scrutiny Charge Coeff"
                  suffix="coeff"
                  step="0.01"
                  helper="Municipal building plan scrutiny fee factor (typically 0.08 of RR)"
                  value={inputs.scrutiny_charges}
                  onChange={(val) => updateField("scrutiny_charges", val)}
                />
                <FieldRow
                  id="input-rada_roda_charges"
                  label="Rada Roda Debris Coeff"
                  suffix="coeff"
                  step="0.01"
                  helper="Debris removal and site cleaning fee factor (typically 0.04 of RR)"
                  value={inputs.rada_roda_charges}
                  onChange={(val) => updateField("rada_roda_charges", val)}
                />
                <FieldRow
                  id="input-labour_cess_rate"
                  label="Labour Welfare Cess Rate"
                  suffix="%"
                  helper="Welfare tax based on estimated structural construction cost (typically 1%)"
                  value={inputs.labour_cess_rate}
                  onChange={(val) => updateField("labour_cess_rate", val)}
                />
                <FieldRow
                  id="input-out_of_pocket_expenses"
                  label="Out of Pocket Expenses Factor"
                  suffix="ratio"
                  step="0.01"
                  helper="Liaisoning and speed money expenses (e.g. 0.15 for 15% of RR)"
                  value={inputs.out_of_pocket_expenses}
                  onChange={(val) => updateField("out_of_pocket_expenses", val)}
                />
                <FieldRow
                  id="input-fire_premium_charges"
                  label="Fire Safety Premium"
                  suffix="ratio"
                  step="0.01"
                  helper="CFO compliance NOC buyouts premium factor (typically 0.18 of RR)"
                  value={inputs.fire_premium_charges}
                  onChange={(val) => updateField("fire_premium_charges", val)}
                />
                <FieldRow
                  id="input-land_development_cost"
                  label="Land Development Cost Coeff"
                  suffix="coeff"
                  step="0.01"
                  helper="Excavation and shoring charges factor (typically 0.10 of RR)"
                  value={inputs.land_development_cost}
                  onChange={(val) => updateField("land_development_cost", val)}
                />
                <FieldRow
                  id="input-parking_slab_cost"
                  label="Basement Parking Slab Coeff"
                  suffix="coeff"
                  step="0.01"
                  helper="Structural overhead basement civil cost factor (typically 0.30 of RR)"
                  value={inputs.parking_slab_cost}
                  onChange={(val) => updateField("parking_slab_cost", val)}
                />
                <FieldRow
                  id="input-stack_parking_charges"
                  label="Mechanical Stack Parking Cost"
                  suffix="coeff"
                  step="0.01"
                  helper="Purchasing and installation stack lift cost factor (typically 0.12 of RR)"
                  value={inputs.stack_parking_charges}
                  onChange={(val) => updateField("stack_parking_charges", val)}
                />
                <FieldRow
                  id="input-gst_on_construction_percent"
                  label="GST on Hard Construction"
                  suffix="%"
                  helper="Indirect tax on cement/steel/labour services (typically 18%)"
                  value={inputs.gst_on_construction_percent}
                  onChange={(val) => updateField("gst_on_construction_percent", val)}
                />
                <FieldRow
                  id="input-architect_fee_percent"
                  label="Professional Consultant Fee %"
                  suffix="%"
                  helper="Fees for architects, structural designers, and geologists (typically 3% of construction cost)"
                  value={inputs.architect_fee_percent}
                  onChange={(val) => updateField("architect_fee_percent", val)}
                />
              </div>

              <div className="pt-3 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Hard Civil Structure Cost</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldRow
                    id="input-construction_rate_per_sqft"
                    label="Base Construction Cost per SqFt"
                    suffix="Rs/sqft"
                    helper="Average rate of civil, structural, finishing, lift and plumbing works (e.g. ₹2800)"
                    value={inputs.construction_rate_per_sqft}
                    onChange={(val) => updateField("construction_rate_per_sqft", val)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 5 — FINANCING */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <button
            type="button"
            onClick={() => toggle("financing")}
            className="w-full px-5 py-4 flex items-center justify-between bg-gray-50/70 border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs font-mono">5</span>
              <span className="font-bold text-gray-900 text-sm tracking-tight uppercase">SECTION 5 — FINANCING INTEREST PARAMETERS</span>
            </div>
            {expanded.financing ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {expanded.financing && (
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldRow
                  id="input-interest_rate_percent"
                  label="Bank Debt Annual Interest Rate"
                  suffix="%"
                  helper="Weighted interest rate of project funding loan from NBFCs/banks (typically 11% - 14% p.a.)"
                  value={inputs.interest_rate_percent}
                  onChange={(val) => updateField("interest_rate_percent", val)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action button panel */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {isSaving ? "Saving study progress..." : "Save Progress to Supabase DB"}
          </button>
          
          <button
            type="button"
            onClick={onDownloadPDF}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border-2 border-gray-200 text-gray-800 font-semibold shadow-xs hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-5 h-5 text-gray-500" />
            Download PDF Report
          </button>
        </div>

      </form>

      {/* RIGHT COLUMN: Live Calculated Results & Summary Verdict */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* SECTION 2 RESULTS: AREA METRICS BREAKDOWN */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-tight">SEC 2 RESULT — AREA WORKINGS</h3>
          </div>
          
          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Gross Plot Area:</span>
              <span className="text-gray-900 font-semibold">{formatSqFt(inputs.plot_area)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Less: Road Widening:</span>
              <span className="text-rose-600 font-semibold">
                -{formatSqFt(Number(inputs.existing_road_widening_deduction || 0) + Number(inputs.additional_road_widening_deduction || 0))}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50 bg-blue-50/40 px-1">
              <span className="text-blue-900 font-medium">Balance Plot Area:</span>
              <span className="text-blue-900 font-bold">{formatSqFt(data.balance_plot_area)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Less: Setback & Amenity:</span>
              <span className="text-rose-600">
                -{formatSqFt(Number(inputs.open_space_deduction || 0) + Number(inputs.amenity_plot_deduction || 0))}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50 bg-blue-50/60 px-1 font-semibold">
              <span className="text-blue-900">Balance Plot (Net):</span>
              <span className="text-blue-900">{formatSqFt(data.balance_plot_after_deductions)}</span>
            </div>
            
            <div className="pt-2">
              <p className="text-3xs text-gray-400 font-sans uppercase font-bold tracking-wider mb-1">Permissible FSI Breakdown</p>
              <div className="grid grid-cols-2 gap-2 text-2xs p-2 bg-gray-50 rounded-lg">
                <div>Basic FSI: <span className="font-semibold text-gray-900">{formatSqFt(data.basic_fsi_permissible)}</span></div>
                <div>Premium FSI: <span className="font-semibold text-gray-900">{formatSqFt(data.premium_fsi_permissible)}</span></div>
                <div>TDR Buying: <span className="font-semibold text-gray-900">{formatSqFt(data.tdr_permissible)}</span></div>
                <div className="font-bold text-blue-800">Total FSI: {formatSqFt(data.total_fsi_permissible)}</div>
              </div>
            </div>

            <div className="flex justify-between py-1 border-b border-gray-50 pt-2">
              <span className="text-gray-500">Plus: Ancillary FSI (0.8):</span>
              <span className="text-gray-900 font-semibold">+{formatSqFt(data.ancillary_fsi_permissible)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50 bg-blue-50 px-1 font-bold">
              <span className="text-blue-900">Total Permissible FSI:</span>
              <span className="text-blue-900">{formatSqFt(data.total_permissible_fsi)}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-3xs font-sans">
              <div className="p-1.5 bg-gray-50 rounded-sm">
                <p className="text-gray-400 font-semibold">CONSTRUCTION AREA</p>
                <p className="font-mono text-gray-900 font-bold mt-0.5">{formatSqFt(data.total_construction_area)}</p>
              </div>
              <div className="p-1.5 bg-gray-50 rounded-sm">
                <p className="text-gray-400 font-semibold">SALEABLE AREA</p>
                <p className="font-mono text-gray-900 font-bold mt-0.5">{formatSqFt(data.saleable_area)}</p>
              </div>
              <div className="p-1.5 bg-gray-50 rounded-sm">
                <p className="text-gray-400 font-semibold">PROPOSED CARPET</p>
                <p className="font-mono text-gray-900 font-bold mt-0.5">{formatSqFt(data.total_proposed_carpet)}</p>
              </div>
            </div>

            <div className="flex justify-between py-1 border-b border-gray-50 pt-2">
              <span className="text-gray-500">Returned to Members:</span>
              <span className="text-rose-600">-{formatSqFt(data.area_returned_to_commercial_members)}</span>
            </div>
            <div className="flex justify-between py-1.5 bg-green-50 px-1 font-bold">
              <span className="text-green-900">Developer Saleable Carpet:</span>
              <span className="text-green-900">{formatSqFt(data.balance_area_with_developer_for_sale)}</span>
            </div>
          </div>
        </div>

        {/* SECTION 3 RESULTS: REVENUE WORKINGS */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
            <Coins className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-tight">SEC 3 RESULT — SALES REVENUE</h3>
          </div>
          
          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Typical Floor Sale Area:</span>
              <span className="text-gray-900">{formatSqFt(data.typical_floor_sale_area)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Sale price per sqft:</span>
              <span className="text-gray-900">₹{inputs.typical_floor_sale_rate?.toLocaleString("en-IN")}/sqft</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50 font-semibold">
              <span className="text-gray-700">Subtotal Floor Revenue:</span>
              <span className="text-gray-900">{formatCr(data.typical_floor_sale_amount)}</span>
            </div>
            
            <div className="flex justify-between py-1 border-b border-gray-50 pt-1">
              <span className="text-gray-500">Parking slots sold ({inputs.parking_count || 0}):</span>
              <span className="text-gray-900">{formatCr(data.parking_amount)}</span>
            </div>
            
            <div className="flex justify-between py-2 bg-blue-50 px-1 font-bold text-sm">
              <span className="text-blue-950 uppercase text-xs">Total Sales Realization:</span>
              <span className="text-blue-950">{formatCr(data.total_sales_value)}</span>
            </div>
          </div>
        </div>

        {/* SECTION 4 RESULTS: COST GROUPS OUTLAY */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-tight">SEC 4 RESULT — CAPITAL EXPENSES</h3>
          </div>
          
          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Group A (Society Related):</span>
              <span className="text-gray-900 font-semibold">{formatCr(data.group_a_total)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50 text-2xs text-gray-400 pl-3">
              <span>Displacement Rent subtotal:</span>
              <span>{formatCr((data.residential_member_rent_total + data.commercial_member_rent_total))}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50 text-2xs text-gray-400 pl-3">
              <span>Members Corpus Fund premium:</span>
              <span>{formatCr(data.member_corpus_total)}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Group B (Municipal/Construction):</span>
              <span className="text-gray-900 font-semibold">{formatCr(data.group_b_total)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50 text-2xs text-gray-400 pl-3">
              <span>Civil Structure Construction:</span>
              <span>{formatCr(data.construction_cost_total)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50 text-2xs text-gray-400 pl-3">
              <span>FSI & TDR Premiums:</span>
              <span>{formatCr((data.premium_fsi_cost + data.ancillary_fsi_cost + data.tdr_cost))}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Group C (Admin & Overheads):</span>
              <span className="text-gray-900 font-semibold">{formatCr(data.group_c_total)}</span>
            </div>
            
            <div className="flex justify-between py-2 bg-gray-100 px-1 font-bold text-sm">
              <span className="text-gray-900">Total Project Expenses:</span>
              <span className="text-gray-900">{formatCr(data.total_expenses)}</span>
            </div>
          </div>
        </div>

        {/* SECTION 5 RESULTS: NET PROFIT & BANK INTEREST */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-md">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
            <Percent className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-tight">SEC 5 RESULT — PROFIT VERDICT</h3>
          </div>
          
          <div className="space-y-3 font-mono">
            <div className="flex justify-between text-xs py-1 border-b border-gray-50">
              <span className="text-gray-500 font-sans">Operating Profit (PBIT):</span>
              <span className="text-gray-900 font-bold">{formatCr(data.pbit)}</span>
            </div>
            
            <div className="p-2.5 bg-rose-50/50 rounded-lg space-y-1.5 text-2xs text-rose-950 border border-rose-100">
              <p className="font-sans font-bold text-3xs text-rose-800 uppercase tracking-wider">Weighted Bank Loan Interest ({inputs.interest_rate_percent}%)</p>
              <div className="flex justify-between">
                <span>Interest on Civil construction (25% size):</span>
                <span>{formatCr(data.interest_on_construction_cost_25)}</span>
              </div>
              <div className="flex justify-between">
                <span>Interest on municipal premium outlays:</span>
                <span>{formatCr(data.interest_on_premium_costs)}</span>
              </div>
              <div className="flex justify-between">
                <span>Interest on displacement rent and stamp duty:</span>
                <span>{formatCr(data.interest_on_rent_and_stamp)}</span>
              </div>
              <div className="flex justify-between">
                <span>Interest on balance construction:</span>
                <span>{formatCr(data.interest_on_balance_construction)}</span>
              </div>
              <div className="flex justify-between border-t border-rose-100 pt-1 font-bold text-xs text-rose-900">
                <span>Total Interest Cost:</span>
                <span>-{formatCr(data.total_interest)}</span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${isHealthy ? 'bg-green-50 border-green-200 text-green-950' : 'bg-amber-50 border-amber-200 text-amber-950'} space-y-2`}>
              <div className="flex justify-between items-baseline font-bold">
                <span className="text-xs uppercase tracking-tight font-sans">Net Developer Profit (PBT):</span>
                <span className="text-base font-bold">{formatCr(data.pbt)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-sans text-2xs">Net Profit Margin %:</span>
                <span className="font-bold">{marginPercent.toFixed(1)}%</span>
              </div>
              
              <div className="pt-2 border-t border-black/5 text-3xs font-sans leading-relaxed flex items-start gap-1.5">
                <span className="text-sm shrink-0">💡</span>
                <div>
                  <p className="font-semibold">{isHealthy ? "HEALTHY FEASIBILITY STUDY" : "MARGINS ARE TIGHT"}</p>
                  <p className="opacity-80">
                    {isHealthy 
                      ? "This study satisfies standard NBFC banking criteria of >= 15% margins. This is a highly bankable project."
                      : "Standard real estate banking standards seek >= 15% return. Consider optimizing ratios, lowering costs, or seeking higher sale premiums."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STUDY IN SIMPLE WORDS EXPLAINER */}
        <div className="bg-blue-900 text-white p-5 rounded-xl shadow-md space-y-4">
          <div className="flex items-center gap-1.5 pb-1 border-b border-white/15">
            <HelpCircle className="w-5 h-5 text-blue-200" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-blue-100">Study Verdict in Simple Words</h4>
          </div>
          
          <p className="text-xs leading-relaxed opacity-95 font-sans">
            For the redevelopment of <strong className="text-blue-200">{inputs.project_name || "this project"}</strong> in Bandra West, Mumbai, we start with a plot of <strong className="font-mono">{inputs.plot_area} sqft</strong>. After deducting setbacks for road widening, the net buildable land is <strong className="font-mono">{formatSqFt(data.balance_plot_area)}</strong>.
          </p>
          
          <p className="text-xs leading-relaxed opacity-95 font-sans">
            Based on zoning rules (Basic, Premium, TDR, and Ancillary FSI ratios), we can build a total structural building of <strong className="font-mono">{formatSqFt(data.total_construction_area)}</strong>. After giving back rehabilitated apartments to the existing <strong className="font-mono">{inputs.residential_member_count || 0} members</strong> with their <strong className="font-mono">35% extra area benefit</strong>, the developer has <strong className="font-mono">{formatSqFt(data.balance_area_with_developer_for_sale)}</strong> of saleable carpet area to sell on the open market.
          </p>

          <p className="text-xs leading-relaxed opacity-95 font-sans">
            From these sales (at <strong className="font-mono">₹{inputs.typical_floor_sale_rate?.toLocaleString("en-IN")}/sqft</strong>), we will generate a total revenue of <strong className="text-green-300 font-mono">{formatCr(data.total_sales_value)}</strong>. It will cost <strong className="text-rose-300 font-mono">{formatCr(data.total_expenses)}</strong> to construct and rehabilitate.
          </p>

          <p className="text-xs leading-relaxed opacity-95 font-sans">
            Before bank interest, our operating profit is <strong className="font-mono">{formatCr(data.pbit)}</strong>. After paying <strong className="text-rose-300 font-mono">{formatCr(data.total_interest)}</strong> in bank interest, the final developer net profit is <strong className="text-green-300 font-bold font-mono">{formatCr(data.pbt)}</strong>, yielding a <strong className="font-bold font-mono">{marginPercent.toFixed(1)}% margin</strong>.
          </p>

          <div className="pt-2 border-t border-white/10 flex justify-between items-center gap-3">
            <span className="text-3xs text-blue-200 leading-normal font-sans">AI indicative calculation. Review all terms locally before banking.</span>
            <button
              onClick={onNavigateToChat}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-800 text-blue-100 font-bold hover:bg-blue-700 transition-colors flex items-center gap-1 shrink-0 shadow-xs"
            >
              <Sparkles className="w-3 h-3 text-blue-300" />
              Analyze Scenarios
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
