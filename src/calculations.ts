import { FeasibilityProject } from "./types";

export function calculateProject(inputs: Record<string, any>): FeasibilityProject {
  // --- SECTION 1: PROJECT BASICS (Inputs) ---
  const projectName = inputs.project_name || "Un-named Project";
  const projectAddress = inputs.project_address || "";
  const roadName = inputs.road_name || "";
  const roadFacingWidth = Number(inputs.road_facing_width) || 40;
  const zoneType = inputs.zone_type || "NON-TOD";
  const existingCommercialUnits = Number(inputs.existing_commercial_units) || 0;
  const existingCommercialCarpetArea = Number(inputs.existing_commercial_carpet_area) || 0;
  const plotArea = Number(inputs.plot_area) || 10000;

  // --- SECTION 2: AREA WORKINGS (Sequential) ---
  const existingRoadWideningDeduction = Number(inputs.existing_road_widening_deduction) || 0;
  const additionalRoadWideningDeduction = Number(inputs.additional_road_widening_deduction) || 0;

  // Balance Plot (= Area of Plot − both road widening deductions)
  const balancePlotArea = Math.max(0, plotArea - existingRoadWideningDeduction - additionalRoadWideningDeduction);

  const openSpaceDeduction = Number(inputs.open_space_deduction) || 0;
  const amenityPlotDeduction = Number(inputs.amenity_plot_deduction) || 0;

  // Balance Plot After Deductions
  const balancePlotAfterDeductions = Math.max(0, balancePlotArea - openSpaceDeduction - amenityPlotDeduction);

  // FSI Permissible ratios (TOD zone might get higher FSI, e.g. Basic 1.5, Premium 0.8, TDR 1.7)
  const isTod = zoneType === "TOD";
  const basicFsiRatio = Number(inputs.basic_fsi_ratio) !== undefined && inputs.basic_fsi_ratio !== ""
    ? Number(inputs.basic_fsi_ratio)
    : (isTod ? 1.5 : 1.1);

  const premiumFsiRatio = Number(inputs.premium_fsi_ratio) !== undefined && inputs.premium_fsi_ratio !== ""
    ? Number(inputs.premium_fsi_ratio)
    : (isTod ? 0.8 : 0.5);

  const tdrRatio = Number(inputs.tdr_ratio) !== undefined && inputs.tdr_ratio !== ""
    ? Number(inputs.tdr_ratio)
    : (isTod ? 1.7 : 1.4);

  // FSI Areas
  const basicFsiPermissible = balancePlotAfterDeductions * basicFsiRatio;
  const premiumFsiPermissible = balancePlotAfterDeductions * premiumFsiRatio;
  const tdrPermissible = balancePlotAfterDeductions * tdrRatio;

  // Total FSI Permissible = sum of Basic + Premium + TDR
  const totalFsiPermissible = basicFsiPermissible + premiumFsiPermissible + tdrPermissible;

  // Add Ancillary FSI (Balance Plot After Deductions * Ancillary ratio, e.g. 0.8)
  const ancillaryFsiRatio = Number(inputs.ancillary_fsi_ratio) !== undefined && inputs.ancillary_fsi_ratio !== ""
    ? Number(inputs.ancillary_fsi_ratio)
    : 0.8;
  const ancillaryFsiPermissible = balancePlotAfterDeductions * ancillaryFsiRatio;

  // Total Permissible FSI = Total FSI + Ancillary FSI
  const totalPermissibleFsi = totalFsiPermissible + ancillaryFsiPermissible;

  // Total Construction Area = Total Permissible FSI * loading factor (e.g. 1.18)
  const loadingFactor = Number(inputs.loading_factor) || 1.18;
  const totalConstructionArea = totalPermissibleFsi * loadingFactor;

  // Total Saleable Area = Total Construction Area * factor (e.g. 1.1) or custom entered
  const saleableFactor = Number(inputs.saleable_factor) || 1.1;
  const totalSaleableArea = totalConstructionArea * saleableFactor;

  // Total Proposed Carpet = Total Saleable Area * factor (e.g. 0.8)
  const carpetFactor = Number(inputs.carpet_factor) || 0.8;
  const totalProposedCarpet = totalSaleableArea * carpetFactor;

  // Existing Commercial Carpet (from Section 1)
  // Area Returned to Commercial Members = Existing Commercial Carpet * (1 + extra carpet %, e.g. 35%)
  const extraCarpetPercent = Number(inputs.extra_carpet_percent) !== undefined && inputs.extra_carpet_percent !== ""
    ? Number(inputs.extra_carpet_percent)
    : 35;
  const areaReturnedToCommercialMembers = existingCommercialCarpetArea * (1 + extraCarpetPercent / 100);

  // Balance Area With Developer for Sale (Total Proposed Carpet - Area Returned to Members)
  const balanceAreaWithDeveloperForSale = Math.max(0, totalProposedCarpet - areaReturnedToCommercialMembers);

  // Commercial Balance Sale Area to Developer (Total Saleable Area - Area Returned to Members)
  const commercialBalanceSaleAreaToDeveloper = Math.max(0, totalSaleableArea - areaReturnedToCommercialMembers);

  // --- SECTION 3: SALES ---
  // Typical Floor Sale (Sale Area is typical_floor_sale_area, default is Commercial Balance Sale Area to Developer)
  const typicalFloorSaleArea = Number(inputs.typical_floor_sale_area) !== undefined && inputs.typical_floor_sale_area !== ""
    ? Number(inputs.typical_floor_sale_area)
    : commercialBalanceSaleAreaToDeveloper;
  const typicalFloorSaleRate = Number(inputs.typical_floor_sale_rate) || 12000; // e.g. ₹12,000 per sqft
  const typicalFloorSaleAmount = (typicalFloorSaleArea * typicalFloorSaleRate) / 10000000; // in ₹ Cr

  const parkingCount = Number(inputs.parking_count) || 20;
  const parkingRate = Number(inputs.parking_rate) || 300000; // e.g. ₹3,00,000 per slot
  const parkingAmount = (parkingCount * parkingRate) / 10000000; // in ₹ Cr

  // TOTAL SALES VALUE = sum of the above (in ₹ Cr)
  const totalSalesValue = typicalFloorSaleAmount + parkingAmount;

  // --- SECTION 4: EXPENSES (all cost amounts in ₹ Cr) ---
  // GROUP A — SOCIETY RELATED COST
  const landCost = Number(inputs.land_cost) || 0; // editable (₹ Cr)
  const agentBrokerage = Number(inputs.agent_brokerage) || 0; // editable (₹ Cr)

  const readyReckonerRate = Number(inputs.ready_reckoner_rate) || 5000; // ₹ / sqft

  // Stamp Duty on Development Agreement (based on Ready Reckoner open plot rate, e.g. 5% of open plot value)
  const stampDutyDevAgreement = Number(inputs.stamp_duty_dev_agreement) !== undefined && inputs.stamp_duty_dev_agreement !== ""
    ? Number(inputs.stamp_duty_dev_agreement)
    : (readyReckonerRate * plotArea * 0.05) / 10000000; // in ₹ Cr

  const additionalAreaMembersStampDutyRes = Number(inputs.additional_area_members_stamp_duty_res) || 0.15; // default ₹ Cr
  const additionalAreaMembersStampDutyComm = Number(inputs.additional_area_members_stamp_duty_comm) || 0.05; // default ₹ Cr
  const additionalAreaMembersGstRes = Number(inputs.additional_area_members_gst_res) || 0.08; // default ₹ Cr
  const additionalAreaMembersGstComm = Number(inputs.additional_area_members_gst_comm) || 0.03; // default ₹ Cr

  // Members corpus costs
  const memberCorpusPerMember = Number(inputs.member_corpus_per_member) || 500000; // e.g. ₹5,00,000 per member
  const residentialMemberCount = Number(inputs.residential_member_count) || 15;
  const totalMembers = existingCommercialUnits + residentialMemberCount;
  const memberCorpusTotal = (memberCorpusPerMember * totalMembers) / 10000000; // in ₹ Cr

  const memberBettermentChargesPerMember = Number(inputs.member_betterment_charges_per_member) || 50000; // e.g. ₹50,000 per member
  const memberBettermentChargesTotal = (memberBettermentChargesPerMember * totalMembers) / 10000000; // in ₹ Cr

  const moversPackersPerMember = Number(inputs.movers_packers_per_member) || 40000; // e.g. ₹40,000 per member
  const moversPackersTotal = (moversPackersPerMember * totalMembers) / 10000000; // in ₹ Cr

  // Residential Member Rent (monthly rate × months × area)
  const residentialMemberRentRate = Number(inputs.residential_member_rent_rate) || 50; // ₹ / sqft / month
  const residentialMemberRentMonths = Number(inputs.residential_member_rent_months) || 24;
  const residentialMemberRentArea = Number(inputs.residential_member_rent_area) || 12000; // total area for residential members
  const residentialMemberRentTotal = (residentialMemberRentRate * residentialMemberRentMonths * residentialMemberRentArea) / 10000000; // ₹ Cr

  // Commercial Member Rent (monthly rate × months × area)
  const commercialMemberRentRate = Number(inputs.commercial_member_rent_rate) || 80; // ₹ / sqft / month
  const commercialMemberRentMonths = Number(inputs.commercial_member_rent_months) || 24;
  const commercialMemberRentArea = Number(inputs.commercial_member_rent_area) || existingCommercialCarpetArea;
  const commercialMemberRentTotal = (commercialMemberRentRate * commercialMemberRentMonths * commercialMemberRentArea) / 10000000; // ₹ Cr

  // Brokerage to Each Residential Member (rate * count or similar)
  const brokeragePerResMember = Number(inputs.brokerage_per_res_member) || 40000; // e.g. ₹40,000
  const brokerageResMemberTotal = (brokeragePerResMember * residentialMemberCount) / 10000000; // ₹ Cr

  // Brokerage to Each Commercial Member
  const brokeragePerCommMember = Number(inputs.brokerage_per_comm_member) || 60000; // e.g. ₹60,000
  const brokerageCommMemberTotal = (brokeragePerCommMember * existingCommercialUnits) / 10000000; // ₹ Cr

  const groupATotal =
    landCost +
    agentBrokerage +
    stampDutyDevAgreement +
    additionalAreaMembersStampDutyRes +
    additionalAreaMembersStampDutyComm +
    additionalAreaMembersGstRes +
    additionalAreaMembersGstComm +
    memberCorpusTotal +
    memberBettermentChargesTotal +
    moversPackersTotal +
    residentialMemberRentTotal +
    commercialMemberRentTotal +
    brokerageResMemberTotal +
    brokerageCommMemberTotal;

  // GROUP B — SANCTION COST / PREMIUMS
  // Premium FSI Cost (Premium FSI Area × 35% of Ready Reckoner rate)
  const premiumFsiCost = (premiumFsiPermissible * 0.35 * readyReckonerRate) / 10000000;

  // Ancillary FSI Cost (Ancillary FSI Area × 15% of Ready Reckoner rate)
  const ancillaryFsiCost = (ancillaryFsiPermissible * 0.15 * readyReckonerRate) / 10000000;

  // TDR Cost (TDR Area × 120% of Ready Reckoner rate)
  const tdrCost = (tdrPermissible * 1.20 * readyReckonerRate) / 10000000;

  // TDR GST (18% of TDR Cost)
  const tdrGst = tdrCost * 0.18;

  const tdrUtilizationCharges = Number(inputs.tdr_utilization_charges) || 0.12; // Flat ₹ Cr

  // Development Charges — Land (1% of Ready Reckoner rate × Plot Area)
  const developmentChargesLand = (readyReckonerRate * plotArea * 0.01) / 10000000;

  // Development Charges — Building (8% of Ready Reckoner rate × Total Permissible FSI)
  const developmentChargesBuilding = (readyReckonerRate * totalPermissibleFsi * 0.08) / 10000000;

  const scrutinyCharges = Number(inputs.scrutiny_charges) || 0.08;
  const radaRodaCharges = Number(inputs.rada_roda_charges) || 0.04;

  // Upkar / Labour Cess (1% of construction cost per sqm rate or construction cost)
  const constructionRatePerSqft = Number(inputs.construction_rate_per_sqft) || 2800; // ₹ / sqft
  const constructionCostTotal = (totalConstructionArea * constructionRatePerSqft) / 10000000; // ₹ Cr

  const labourCessRate = Number(inputs.labour_cess_rate) || 1; // 1%
  const labourCessCost = constructionCostTotal * (labourCessRate / 100);

  const outOfPocketExpenses = Number(inputs.out_of_pocket_expenses) || 0.15;
  const firePremiumCharges = Number(inputs.fire_premium_charges) || 0.18;

  const landDevelopmentCost = Number(inputs.land_development_cost) || 0.10;
  const parkingSlabCost = Number(inputs.parking_slab_cost) || 0.30;
  const stackParkingCharges = Number(inputs.stack_parking_charges) || 0.12;

  // GST on Construction Cost (18%)
  const gstOnConstructionPercent = Number(inputs.gst_on_construction_percent) || 18;
  const gstOnConstructionCost = constructionCostTotal * (gstOnConstructionPercent / 100);

  // Architect/Consultants Fees + GST (18%)
  const architectFeePercent = Number(inputs.architect_fee_percent) || 3; // e.g. 3% of construction cost
  const architectFeeTotal = constructionCostTotal * (architectFeePercent / 100) * 1.18;

  const groupBTotal =
    premiumFsiCost +
    ancillaryFsiCost +
    tdrCost +
    tdrGst +
    tdrUtilizationCharges +
    developmentChargesLand +
    developmentChargesBuilding +
    scrutinyCharges +
    radaRodaCharges +
    labourCessCost +
    outOfPocketExpenses +
    firePremiumCharges +
    constructionCostTotal +
    landDevelopmentCost +
    parkingSlabCost +
    stackParkingCharges +
    gstOnConstructionCost +
    architectFeeTotal;

  // GROUP C — OTHER EXPENSES
  const overheadDirect = totalSalesValue * 0.02; // Overhead Direct (2% of Total Sales Value)
  const overheadIndirect = totalSalesValue * 0.02; // Overhead Indirect (2% of Total Sales Value)
  const marketingAndBrokerage = totalSalesValue * 0.03; // Marketing and Brokerage (3% of Total Sales Value)
  const contingenciesCost = (groupATotal + groupBTotal) * 0.05; // Contingencies Cost (5%)

  const groupCTotal = overheadDirect + overheadIndirect + marketingAndBrokerage + contingenciesCost;

  // --- SECTION 5: PROFIT SUMMARY ---
  const totalExpenses = groupATotal + groupBTotal + groupCTotal;
  const pbit = totalSalesValue - totalExpenses; // Profit Before Interest & Tax

  // INTEREST (for average 12 months)
  const interestRatePercent = Number(inputs.interest_rate_percent) !== undefined && inputs.interest_rate_percent !== ""
    ? Number(inputs.interest_rate_percent)
    : 12; // e.g. 12% per annum

  // - On 25% of Construction Cost (× interest rate %)
  const interestOnConstructionCost25 = (constructionCostTotal * 0.25) * (interestRatePercent / 100);

  // - On Premium Costs (× interest rate %)
  const interestOnPremiumCosts = (premiumFsiCost + ancillaryFsiCost) * (interestRatePercent / 100);

  // - On Member Rent for 1 Year + Stamp Duty Registration (× interest rate %)
  // Rent for 1 year = monthly rate * 12 * area
  const rentForOneYear = (residentialMemberRentRate * 12 * residentialMemberRentArea + commercialMemberRentRate * 12 * commercialMemberRentArea) / 10000000;
  const interestOnRentAndStamp = (rentForOneYear + stampDutyDevAgreement) * (interestRatePercent / 100);

  // - On Balance Construction Cost (× interest rate %)
  const interestOnBalanceConstruction = (constructionCostTotal * 0.75) * (interestRatePercent / 100);

  // Total Interest Subtotal
  const totalInterest =
    interestOnConstructionCost25 +
    interestOnPremiumCosts +
    interestOnRentAndStamp +
    interestOnBalanceConstruction;

  // PBT (Profit Before Tax) = PBIT − Total Interest
  const pbt = pbit - totalInterest;

  return {
    project_name: projectName,
    project_address: projectAddress,
    road_name: roadName,
    road_facing_width: roadFacingWidth,
    zone_type: zoneType,
    existing_commercial_units: existingCommercialUnits,
    existing_commercial_carpet_area: existingCommercialCarpetArea,
    plot_area: plotArea,

    // Area Workings Outputs
    existing_road_widening_deduction: existingRoadWideningDeduction,
    additional_road_widening_deduction: additionalRoadWideningDeduction,
    balance_plot_area: Math.round(balancePlotArea * 100) / 100,
    open_space_deduction: openSpaceDeduction,
    amenity_plot_deduction: amenityPlotDeduction,
    balance_plot_after_deductions: Math.round(balancePlotAfterDeductions * 100) / 100,
    basic_fsi_ratio: basicFsiRatio,
    basic_fsi_permissible: Math.round(basicFsiPermissible * 100) / 100,
    premium_fsi_ratio: premiumFsiRatio,
    premium_fsi_permissible: Math.round(premiumFsiPermissible * 100) / 100,
    tdr_ratio: tdrRatio,
    tdr_permissible: Math.round(tdrPermissible * 100) / 100,
    total_fsi_permissible: Math.round(totalFsiPermissible * 100) / 100,
    ancillary_fsi_ratio: ancillaryFsiRatio,
    ancillary_fsi_permissible: Math.round(ancillaryFsiPermissible * 100) / 100,
    total_permissible_fsi: Math.round(totalPermissibleFsi * 100) / 100,
    loading_factor: loadingFactor,
    total_construction_area: Math.round(totalConstructionArea * 100) / 100,
    saleable_factor: saleableFactor,
    total_saleable_area: Math.round(totalSaleableArea * 100) / 100,
    carpet_factor: carpetFactor,
    total_proposed_carpet: Math.round(totalProposedCarpet * 100) / 100,
    extra_carpet_percent: extraCarpetPercent,
    area_returned_to_commercial_members: Math.round(areaReturnedToCommercialMembers * 100) / 100,
    balance_area_with_developer_for_sale: Math.round(balanceAreaWithDeveloperForSale * 100) / 100,
    commercial_balance_sale_area_to_developer: Math.round(commercialBalanceSaleAreaToDeveloper * 100) / 100,

    // Sales Outputs
    typical_floor_sale_area: Math.round(typicalFloorSaleArea * 100) / 100,
    typical_floor_sale_rate: typicalFloorSaleRate,
    typical_floor_sale_amount: Math.round(typicalFloorSaleAmount * 10000) / 10000,
    parking_count: parkingCount,
    parking_rate: parkingRate,
    parking_amount: Math.round(parkingAmount * 10000) / 10000,
    total_sales_value: Math.round(totalSalesValue * 10000) / 10000,

    // Expenses Outputs
    land_cost: landCost,
    agent_brokerage: agentBrokerage,
    ready_reckoner_rate: readyReckonerRate,
    stamp_duty_dev_agreement: Math.round(stampDutyDevAgreement * 10000) / 10000,
    additional_area_members_stamp_duty_res: additionalAreaMembersStampDutyRes,
    additional_area_members_stamp_duty_comm: additionalAreaMembersStampDutyComm,
    additional_area_members_gst_res: additionalAreaMembersGstRes,
    additional_area_members_gst_comm: additionalAreaMembersGstComm,
    member_corpus_per_member: memberCorpusPerMember,
    member_corpus_total: Math.round(memberCorpusTotal * 10000) / 10000,
    member_betterment_charges_per_member: memberBettermentChargesPerMember,
    member_betterment_charges_total: Math.round(memberBettermentChargesTotal * 10000) / 10000,
    movers_packers_per_member: moversPackersPerMember,
    movers_packers_total: Math.round(moversPackersTotal * 10000) / 10000,
    residential_member_count: residentialMemberCount,
    residential_member_rent_rate: residentialMemberRentRate,
    residential_member_rent_months: residentialMemberRentMonths,
    residential_member_rent_area: residentialMemberRentArea,
    residential_member_rent_total: Math.round(residentialMemberRentTotal * 10000) / 10000,
    commercial_member_count: existingCommercialUnits,
    commercial_member_rent_rate: commercialMemberRentRate,
    commercial_member_rent_months: commercialMemberRentMonths,
    commercial_member_rent_area: commercialMemberRentArea,
    commercial_member_rent_total: Math.round(commercialMemberRentTotal * 10000) / 10000,
    brokerage_per_res_member: brokeragePerResMember,
    brokerage_res_member_total: Math.round(brokerageResMemberTotal * 10000) / 10000,
    brokerage_per_comm_member: brokeragePerCommMember,
    brokerage_comm_member_total: Math.round(brokerageCommMemberTotal * 10000) / 10000,
    group_a_total: Math.round(groupATotal * 10000) / 10000,

    premium_fsi_cost: Math.round(premiumFsiCost * 10000) / 10000,
    ancillary_fsi_cost: Math.round(ancillaryFsiCost * 10000) / 10000,
    tdr_cost: Math.round(tdrCost * 10000) / 10000,
    tdr_gst: Math.round(tdrGst * 10000) / 10000,
    tdr_utilization_charges: tdrUtilizationCharges,
    development_charges_land: Math.round(developmentChargesLand * 10000) / 10000,
    development_charges_building: Math.round(developmentChargesBuilding * 10000) / 10000,
    scrutiny_charges: scrutinyCharges,
    rada_roda_charges: radaRodaCharges,
    labour_cess_rate: labourCessRate,
    labour_cess_cost: Math.round(labourCessCost * 10000) / 10000,
    out_of_pocket_expenses: outOfPocketExpenses,
    fire_premium_charges: firePremiumCharges,
    construction_rate_per_sqft: constructionRatePerSqft,
    construction_cost_total: Math.round(constructionCostTotal * 10000) / 10000,
    land_development_cost: landDevelopmentCost,
    parking_slab_cost: parkingSlabCost,
    stack_parking_charges: stackParkingCharges,
    gst_on_construction_percent: gstOnConstructionPercent,
    gst_on_construction_cost: Math.round(gstOnConstructionCost * 10000) / 10000,
    architect_fee_percent: architectFeePercent,
    architect_fee_total: Math.round(architectFeeTotal * 10000) / 10000,
    group_b_total: Math.round(groupBTotal * 10000) / 10000,

    overhead_direct: Math.round(overheadDirect * 10000) / 10000,
    overhead_indirect: Math.round(overheadIndirect * 10000) / 10000,
    marketing_and_brokerage: Math.round(marketingAndBrokerage * 10000) / 10000,
    contingencies_cost: Math.round(contingenciesCost * 10000) / 10000,
    group_c_total: Math.round(groupCTotal * 10000) / 10000,

    // Profit Summary Outputs
    total_expenses: Math.round(totalExpenses * 10000) / 10000,
    pbit: Math.round(pbit * 10000) / 10000,
    interest_rate_percent: interestRatePercent,
    interest_on_construction_cost_25: Math.round(interestOnConstructionCost25 * 10000) / 10000,
    interest_on_premium_costs: Math.round(interestOnPremiumCosts * 10000) / 10000,
    interest_on_rent_and_stamp: Math.round(interestOnRentAndStamp * 10000) / 10000,
    interest_on_balance_construction: Math.round(interestOnBalanceConstruction * 10000) / 10000,
    total_interest: Math.round(totalInterest * 10000) / 10000,
    pbt: Math.round(pbt * 10000) / 10000,
  };
}
