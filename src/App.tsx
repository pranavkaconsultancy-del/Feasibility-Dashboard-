import React, { useState, useEffect, useMemo } from "react";
import {
  Calculator,
  TrendingUp,
  Coins,
  Building2,
  Percent,
  Save,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Info,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Download,
  Database,
  PlusCircle,
  ArrowLeft,
  ArrowRight,
  FileText,
  Settings,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { calculateProject, formatIndianCurrency } from "./calculations";
import { FeasibilityProject } from "./types";
import { jsPDF } from "jspdf";

const DEFAULT_PROJECT_INPUTS = {
  project_name: "Greenwood Heights Redevelopment",
  project_address: "Bandra West, Mumbai",
  plot_area: 12000,
  zone_type: "NON-TOD",

  basic_fsi_percent: 150,
  tdr_percent: 100,
  existing_road_widening_deduction: 500,
  open_space_deduction: 1000,
  amenity_plot_deduction: 500,

  residential_rate_per_sqft: 12000,
  parking_count: 20,
  parking_rate: 300000,

  land_cost: 15000000, // ₹1.5 Cr
  govt_approval_mode: "percentage",
  govt_approval_percent: 10, // 10% of sales
  govt_approval_charges: 12000000, // ₹1.2 Cr fallback
  construction_cost_per_sqft: 2800,
  marketing_percent: 5, // 5% of sales

  loan_amount_mode: "auto",
  loan_amount: 10000000,
  interest_rate_percent: 12,
  loan_period_years: 2
};

export default function App() {
  // Navigation: 1 to 5 for the simple screens
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Connection settings modal
  const [isDbSettingsOpen, setIsDbSettingsOpen] = useState<boolean>(false);
  const [customSupabaseUrl, setCustomSupabaseUrl] = useState<string>(
    localStorage.getItem("supabase_custom_url") || "https://lwhhntbtzazfofxjhzuv.supabase.co"
  );
  const [customSupabaseAnonKey, setCustomSupabaseAnonKey] = useState<string>(
    localStorage.getItem("supabase_custom_anon_key") || "sb_publishable_3Wgp8cFrmNJSQhziiWmGGg_iRUqVblC"
  );

  // States
  const [inputs, setInputs] = useState<Record<string, any>>({ ...DEFAULT_PROJECT_INPUTS });
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const [currentId, setCurrentId] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Dynamic headers function to send custom credentials if stored locally
  const getSupabaseHeaders = (): Record<string, string> => {
    const url = localStorage.getItem("supabase_custom_url") || "https://lwhhntbtzazfofxjhzuv.supabase.co";
    const key = localStorage.getItem("supabase_custom_anon_key") || "sb_publishable_3Wgp8cFrmNJSQhziiWmGGg_iRUqVblC";
    const headers: Record<string, string> = {};
    if (url) headers["x-supabase-url"] = url;
    if (key) headers["x-supabase-anon-key"] = key;
    return headers;
  };

  // Run calculation memoized
  const calculated = useMemo(() => {
    return calculateProject(inputs);
  }, [inputs]);

  // Load projects from backend or local storage backup on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/projects", {
        headers: getSupabaseHeaders()
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setSavedProjects(result.data || []);
        setSupabaseConnected(true);
        localStorage.setItem("local_feasibility_projects", JSON.stringify(result.data || []));
      } else {
        setSupabaseConnected(false);
        loadLocalBackup();
        console.warn("Supabase fetch failed, loaded local backup.");
      }
    } catch (err: any) {
      console.error("Fetch projects error:", err);
      setSupabaseConnected(false);
      loadLocalBackup();
    } finally {
      setIsLoading(false);
    }
  };

  const loadLocalBackup = () => {
    const localData = localStorage.getItem("local_feasibility_projects");
    if (localData) {
      try {
        setSavedProjects(JSON.parse(localData));
      } catch (parseErr) {
        console.error("Error parsing local projects storage:", parseErr);
      }
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setInputs((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNewProject = () => {
    setInputs({
      ...DEFAULT_PROJECT_INPUTS,
      project_name: "My Redevelopment Study " + (savedProjects.length + 1)
    });
    setCurrentId(null);
    setCurrentStep(1);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputs.project_name.trim()) {
      setErrorMessage("Please enter a valid Project Name before saving.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const isLocalId = !currentId || String(currentId).startsWith("local-");
    const activeId = currentId || `local-${Date.now()}`;
    const payload = {
      id: isLocalId ? null : currentId,
      ...calculated
    };

    // Keep a local backup immediately to prevent data loss
    let localProjects: any[] = [];
    try {
      const localData = localStorage.getItem("local_feasibility_projects");
      if (localData) {
        localProjects = JSON.parse(localData);
      }
    } catch (e) {
      console.error("Error reading local backup:", e);
    }

    const localPayload = {
      ...payload,
      id: activeId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const existingIndex = localProjects.findIndex(
      (p) => p.id === activeId || p.project_name === payload.project_name
    );
    if (existingIndex >= 0) {
      localProjects[existingIndex] = { ...localProjects[existingIndex], ...localPayload };
    } else {
      localProjects.unshift(localPayload);
    }
    localStorage.setItem("local_feasibility_projects", JSON.stringify(localProjects));

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getSupabaseHeaders()
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setSuccessMessage(`Project "${inputs.project_name}" successfully saved to database!`);
        setSupabaseConnected(true);
        if (result.data && result.data.id) {
          setCurrentId(result.data.id);
          // Sync database ID into our local storage copy
          const index = localProjects.findIndex((p) => p.project_name === payload.project_name);
          if (index >= 0) {
            localProjects[index].id = result.data.id;
            localStorage.setItem("local_feasibility_projects", JSON.stringify(localProjects));
          }
        }
        await fetchProjects();
      } else {
        throw new Error(result.error || "Save rejected by database server");
      }
    } catch (err: any) {
      console.warn("Supabase save failed, fallback to local backup:", err);
      setSavedProjects(localProjects);
      setSupabaseConnected(false);
      setSuccessMessage(`Project "${inputs.project_name}" saved LOCALLY in browser. (DB disconnected: ${err.message || String(err)})`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: any, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to permanently delete project "${name}"?`)) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    let localProjects: any[] = [];
    try {
      const localData = localStorage.getItem("local_feasibility_projects");
      if (localData) {
        localProjects = JSON.parse(localData);
      }
    } catch (e) {
      console.error("Error reading local projects for delete:", e);
    }
    localProjects = localProjects.filter((p) => p.id !== id && p.project_name !== name);
    localStorage.setItem("local_feasibility_projects", JSON.stringify(localProjects));

    const isLocalId = String(id).startsWith("local-");
    if (isLocalId) {
      setSavedProjects(localProjects);
      setSuccessMessage(`Local project "${name}" deleted successfully.`);
      if (currentId === id) {
        handleNewProject();
      }
      return;
    }

    try {
      const res = await fetch("/api/projects", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...getSupabaseHeaders()
        },
        body: JSON.stringify({ id, project_name: name })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setSuccessMessage(`Project "${name}" permanently deleted from Supabase.`);
        if (currentId === id) {
          handleNewProject();
        }
        await fetchProjects();
      } else {
        throw new Error(result.error || "Delete operation failed on server");
      }
    } catch (err: any) {
      setErrorMessage(`Could not delete project from database: ${err.message || String(err)}`);
      setSavedProjects(localProjects);
    }
  };

  const handleSelectProject = (proj: any) => {
    // Populate simple inputs from the saved database payload, defaulting back safely
    setInputs({
      project_name: proj.project_name || "Loaded Project",
      project_address: proj.project_address || "",
      plot_area: proj.plot_area || 0,
      zone_type: proj.zone_type || "NON-TOD",

      basic_fsi_percent: proj.basic_fsi_percent || 0,
      tdr_percent: proj.tdr_percent || 0,
      existing_road_widening_deduction: proj.existing_road_widening_deduction || 0,
      open_space_deduction: proj.open_space_deduction || 0,
      amenity_plot_deduction: proj.amenity_plot_deduction || 0,

      residential_rate_per_sqft: proj.residential_rate_per_sqft || 0,
      parking_count: proj.parking_count || 0,
      parking_rate: proj.parking_rate || 0,

      land_cost: proj.land_cost || 0,
      govt_approval_mode: proj.govt_approval_mode || "absolute",
      govt_approval_percent: proj.govt_approval_percent || 0,
      govt_approval_charges: proj.govt_approval_charges || 0,
      construction_cost_per_sqft: proj.construction_cost_per_sqft || 0,
      marketing_percent: proj.marketing_percent || 0,

      loan_amount_mode: proj.loan_amount_mode || "auto",
      loan_amount: proj.loan_amount || 0,
      interest_rate_percent: proj.interest_rate_percent || 0,
      loan_period_years: proj.loan_period_years || 0
    });
    setCurrentId(proj.id);
    setCurrentStep(1);
    setSuccessMessage(`Loaded project "${proj.project_name}" successfully.`);
    setErrorMessage(null);
  };

  const handleSaveDbSettings = () => {
    localStorage.setItem("supabase_custom_url", customSupabaseUrl);
    localStorage.setItem("supabase_custom_anon_key", customSupabaseAnonKey);
    setIsDbSettingsOpen(false);
    fetchProjects();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");

    const primaryColor = [26, 86, 219]; // Blue (#1A56DF)
    const darkText = [31, 41, 55]; // Gray-800
    const lightText = [107, 114, 128]; // Gray-500
    const tableBorder = [229, 231, 235]; // Gray-200
    const rowBgAlternate = [249, 250, 251]; // Gray-50

    // 1. Header: Project Name, Location, Date
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(inputs.project_name || "Feasibility Study", 15, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(lightText[0], lightText[1], lightText[2]);
    doc.text(`Location: ${inputs.project_address || "Not Specified"}`, 15, 26);
    doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 195, 26, { align: "right" });

    // Accent line under header
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(1);
    doc.line(15, 30, 195, 30);

    // 2. A simple 2-column summary table
    let y = 45;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(darkText[0], darkText[1], darkText[2]);
    doc.text("Feasibility Summary", 15, y);
    y += 8;

    const marginPercent = calculated.total_sales_value > 0
      ? (calculated.pbt / calculated.total_sales_value) * 100
      : 0;

    const tableRows = [
      { label: "Total Area You Can Build (sq.ft.)", val: `${Math.round(calculated.buildable_area).toLocaleString()} sq.ft.` },
      { label: "Total Expected Sales (₹)", val: formatIndianCurrency(calculated.total_sales_value) },
      { label: "Total Costs (₹)", val: formatIndianCurrency(calculated.total_expenses) },
      { label: "Profit Before Interest (₹)", val: formatIndianCurrency(calculated.pbit) },
      { label: "Loan Interest Cost (₹)", val: formatIndianCurrency(calculated.interest_cost) },
      { label: "Final Profit (₹)", val: formatIndianCurrency(calculated.pbt) },
      { label: "Profit Margin (%)", val: `${marginPercent.toFixed(2)}%` }
    ];

    // Table Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(15, y, 180, 10, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text("Key Metric", 20, y + 6.5);
    doc.text("Value", 190, y + 6.5, { align: "right" });
    y += 10;

    // Table Rows
    tableRows.forEach((row, idx) => {
      // Background shading for alternate rows
      if (idx % 2 === 1) {
        doc.setFillColor(rowBgAlternate[0], rowBgAlternate[1], rowBgAlternate[2]);
        doc.rect(15, y, 180, 12, "F");
      }

      // Border underneath
      doc.setDrawColor(tableBorder[0], tableBorder[1], tableBorder[2]);
      doc.setLineWidth(0.3);
      doc.line(15, y + 12, 195, y + 12);

      // Label
      const isBoldRow = row.label.includes("Final Profit") || row.label.includes("Profit Margin");
      doc.setFont("helvetica", isBoldRow ? "bold" : "normal");
      doc.setFontSize(10);
      doc.setTextColor(isBoldRow ? primaryColor[0] : darkText[0], isBoldRow ? primaryColor[1] : darkText[1], isBoldRow ? primaryColor[2] : darkText[2]);
      doc.text(row.label, 20, y + 7.5);

      // Value
      doc.text(row.val, 190, y + 7.5, { align: "right" });

      y += 12;
    });

    y += 15;

    // 3. One plain-English summary line at the bottom
    doc.setFillColor(239, 246, 255); // light blue tint
    doc.setDrawColor(191, 219, 254); // blue border
    doc.setLineWidth(0.5);
    doc.rect(15, y, 180, 22, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Project Conclusion", 20, y + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(darkText[0], darkText[1], darkText[2]);
    const summaryStr = `This project is expected to make ${formatIndianCurrency(calculated.total_sales_value)} in sales and ${formatIndianCurrency(calculated.pbt)} in final profit, a margin of ${marginPercent.toFixed(2)}%.`;
    const splitStr = doc.splitTextToSize(summaryStr, 170);
    doc.text(splitStr, 20, y + 14);

    // Save PDF
    const fileName = (inputs.project_name || "feasibility").toLowerCase().replace(/\s+/g, "_") + "_summary.pdf";
    doc.save(fileName);
  };

  const steps = [
    { num: 1, title: "PROJECT INFO", icon: Calculator },
    { num: 2, title: "WHAT YOU CAN BUILD", icon: Building2 },
    { num: 3, title: "MONEY IN (Sales)", icon: Coins },
    { num: 4, title: "MONEY OUT (Costs)", icon: TrendingUp },
    { num: 5, title: "YOUR PROFIT", icon: Percent }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased flex flex-col">
      {/* HEADER / TOP NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-lg">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Redevelopment Feasibility</h1>
            <p className="text-xs text-slate-500 font-medium">Simplified Real Estate Feasibility Modeler</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active File Label */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200">
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <span className="text-xs font-semibold text-slate-700">
              Active: <span className="font-bold">{inputs.project_name}</span>
            </span>
            {currentId ? (
              <span className="text-3xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-sm font-mono font-bold uppercase ml-1">
                Saved
              </span>
            ) : (
              <span className="text-3xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm font-mono font-bold uppercase ml-1">
                Draft
              </span>
            )}
          </div>

          <button
            onClick={handleNewProject}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            id="top-add-project"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Project</span>
          </button>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            title="My Projects Sidebar"
          >
            <Database className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline">My Projects ({savedProjects.length})</span>
          </button>

          <button
            onClick={() => setIsDbSettingsOpen(true)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Database Connection Config"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* DYNAMIC ERROR / SUCCESS BANNERS */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-900 p-4 rounded-xl flex items-start gap-3 shadow-xs"
          >
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="grow">
              <h3 className="font-semibold text-sm">Action Failed</h3>
              <p className="text-xs text-red-700 mt-1">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="mx-6 mt-4 bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl flex items-start gap-3 shadow-xs"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="grow">
              <h3 className="font-semibold text-sm">Success</h3>
              <p className="text-xs text-emerald-700 mt-1">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-400 hover:text-emerald-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CORE WRAPPER */}
      <div className="grow flex relative overflow-hidden">
        
        {/* SIDEBAR: SAVED PROJECTS */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="hidden lg:flex shrink-0 flex-col bg-white border-r border-slate-200 overflow-hidden select-none"
            >
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">My Saved Projects</span>
                <span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${supabaseConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {supabaseConnected ? "Connected" : "Offline Copy"}
                </span>
              </div>

              <div className="grow overflow-y-auto p-3 space-y-2">
                {savedProjects.length === 0 ? (
                  <div className="p-6 text-center space-y-2">
                    <Database className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-400 font-medium">No projects found. Use &quot;Save Project&quot; in the bottom bar to sync to database.</p>
                  </div>
                ) : (
                  savedProjects.map((p) => {
                    const isCurrent = p.id === currentId || (p.project_name === inputs.project_name && !currentId);
                    return (
                      <div
                        key={p.id || p.project_name}
                        onClick={() => handleSelectProject(p)}
                        className={`group p-3 rounded-xl border transition-all cursor-pointer relative ${
                          isCurrent
                            ? "bg-blue-50/70 border-blue-200 ring-2 ring-blue-500/5"
                            : "bg-white hover:bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="pr-8">
                          <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{p.project_name}</h4>
                          <p className="text-3xs text-slate-400 font-mono mt-1 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            <span className="line-clamp-1">{p.project_address || "No address"}</span>
                          </p>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-100/70 flex justify-between items-center text-3xs font-semibold text-slate-500">
                          <div>
                            Buildable: <span className="font-bold text-slate-700">{Math.round(p.buildable_area || 0).toLocaleString()} sqft</span>
                          </div>
                          <div className={`font-bold ${p.pbt >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            Net: {formatIndianCurrency(p.pbt || 0)}
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleDelete(p.id, p.project_name, e)}
                          className="absolute top-2.5 right-2.5 p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* MAIN WORKSPACE */}
        <main className="grow overflow-y-auto p-4 lg:p-8 flex flex-col gap-6">
          
          {/* STEPPER BAR */}
          <nav className="bg-white rounded-xl border border-slate-200 p-2 flex flex-wrap justify-between items-center shadow-2xs gap-1 select-none">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.num;
              const isPassed = currentStep > step.num;
              return (
                <button
                  key={step.num}
                  onClick={() => setCurrentStep(step.num)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs scale-102"
                      : isPassed
                      ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs font-mono font-bold shrink-0 ${
                    isActive ? "bg-white text-blue-600" : isPassed ? "bg-blue-200 text-blue-800" : "bg-slate-100 text-slate-500"
                  }`}>
                    {step.num}
                  </span>
                  <span className="hidden sm:inline uppercase font-sans tracking-tight">{step.title}</span>
                </button>
              );
            })}
          </nav>

          {/* TWO COLUMN CONTENT AREA */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* STEP SPECIFIC FORM: Span 8 */}
            <div className="xl:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-blue-600 font-mono">0{currentStep}</span>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    {steps[currentStep - 1].title}
                  </h2>
                </div>
                <span className="text-3xs font-semibold uppercase tracking-wider font-mono text-slate-400 bg-slate-200/50 px-2.5 py-1 rounded-full">
                  Step {currentStep} of 5
                </span>
              </div>

              {/* STEP 1: PROJECT INFO */}
              {currentStep === 1 && (
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Project Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={inputs.project_name}
                        onChange={(e) => handleInputChange("project_name", e.target.value)}
                        placeholder="e.g. Greenwood Heights Redevelopment"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-hidden transition-all bg-white font-semibold text-slate-800"
                      />
                      <p className="text-3xs text-slate-400 leading-normal">The name used to store and search this study in the dashboard.</p>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Location / Address</label>
                      <input
                        type="text"
                        value={inputs.project_address}
                        onChange={(e) => handleInputChange("project_address", e.target.value)}
                        placeholder="e.g. Bandra West, Mumbai"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-hidden transition-all bg-white text-slate-700"
                      />
                      <p className="text-3xs text-slate-400 leading-normal">Street address or locality of the redevelopment asset.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Plot Area (sq.ft.)</label>
                      <input
                        type="number"
                        value={inputs.plot_area || ""}
                        onChange={(e) => handleInputChange("plot_area", e.target.value === "" ? 0 : Number(e.target.value))}
                        placeholder="e.g. 12000"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-hidden transition-all bg-white text-slate-800"
                      />
                      <p className="text-3xs text-slate-400 leading-normal">The total demarcated area of the plot as per registry.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Zone Type</label>
                      <select
                        value={inputs.zone_type}
                        onChange={(e) => handleInputChange("zone_type", e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-hidden bg-white text-slate-700 font-semibold"
                      >
                        <option value="NON-TOD">NON-TOD (Standard Redevelopment)</option>
                        <option value="TOD">TOD (Transit Oriented Development - Higher FSI)</option>
                      </select>
                      <p className="text-3xs text-slate-400 leading-normal">TOD zone applies if within transit corridor limits, allowing maximum density.</p>
                    </div>
                  </div>

                  {/* Quick Welcome Prompt */}
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3 items-start">
                    <PlusCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-blue-900 uppercase">Interactive Walkthrough</h4>
                      <p className="text-3xs text-blue-700 mt-1 leading-normal">
                        Use this 5-step calculator to quickly model a project. Click any stepper tab above to navigate directly, or use the Next and Back buttons at the bottom of the card.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: WHAT YOU CAN BUILD */}
              {currentStep === 2 && (
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">FSI Allowed (%)</label>
                      <input
                        type="number"
                        value={inputs.basic_fsi_percent || ""}
                        onChange={(e) => handleInputChange("basic_fsi_percent", e.target.value === "" ? 0 : Number(e.target.value))}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-hidden bg-white"
                      />
                      <p className="text-3xs text-slate-400">The base Floor Space Index allowed for this zone (e.g. 150%).</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">TDR Allowed (%)</label>
                      <input
                        type="number"
                        value={inputs.tdr_percent || ""}
                        onChange={(e) => handleInputChange("tdr_percent", e.target.value === "" ? 0 : Number(e.target.value))}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-hidden bg-white"
                      />
                      <p className="text-3xs text-slate-400">Transfer of Development Rights purchasable capacity (e.g. 100%).</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Road Widening Setback (sq.ft.)</label>
                      <input
                        type="number"
                        value={inputs.existing_road_widening_deduction || ""}
                        onChange={(e) => handleInputChange("existing_road_widening_deduction", e.target.value === "" ? 0 : Number(e.target.value))}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-hidden bg-white"
                      />
                      <p className="text-3xs text-slate-400">Deduction from plot area due to statutory road widening setback.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Open Space RG Deduction (sq.ft.)</label>
                      <input
                        type="number"
                        value={inputs.open_space_deduction || ""}
                        onChange={(e) => handleInputChange("open_space_deduction", e.target.value === "" ? 0 : Number(e.target.value))}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-hidden bg-white"
                      />
                      <p className="text-3xs text-slate-400">Recreational Ground space required to be left open on the plot.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Amenity Plot Surrender (sq.ft.)</label>
                      <input
                        type="number"
                        value={inputs.amenity_plot_deduction || ""}
                        onChange={(e) => handleInputChange("amenity_plot_deduction", e.target.value === "" ? 0 : Number(e.target.value))}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-hidden bg-white"
                      />
                      <p className="text-3xs text-slate-400">Deduction for handing over physical land to municipal body.</p>
                    </div>
                  </div>

                  {/* Clear Result Panel at the bottom */}
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-center">
                    <span className="text-3xs font-bold uppercase tracking-wider text-slate-400 font-mono">Automatic Calculation</span>
                    <h3 className="text-3xl font-black text-blue-600 font-mono tracking-tight">
                      {Math.round(calculated.buildable_area).toLocaleString()} <span className="text-lg font-bold">sq.ft.</span>
                    </h3>
                    <h4 className="text-xs font-bold text-slate-800">Total Area You Can Build (sq.ft.)</h4>
                    <p className="text-2xs text-slate-500 leading-normal max-w-md mx-auto">
                      This is the maximum construction area allowed after all deductions.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 3: MONEY IN (Revenues) */}
              {currentStep === 3 && (
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Selling Rate per sq.ft. (₹)</label>
                      <input
                        type="number"
                        value={inputs.residential_rate_per_sqft || ""}
                        onChange={(e) => handleInputChange("residential_rate_per_sqft", e.target.value === "" ? 0 : Number(e.target.value))}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-hidden bg-white text-slate-800"
                      />
                      <p className="text-3xs text-slate-400">The average market rate for selling built-up carpet or saleable area (₹/sqft).</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Number of Parking Spots</label>
                      <input
                        type="number"
                        value={inputs.parking_count || ""}
                        onChange={(e) => handleInputChange("parking_count", e.target.value === "" ? 0 : Number(e.target.value))}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-hidden bg-white"
                      />
                      <p className="text-3xs text-slate-400">Total saleable parking spots allocated to the development project.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Parking Space Selling Rate (₹)</label>
                      <input
                        type="number"
                        value={inputs.parking_rate || ""}
                        onChange={(e) => handleInputChange("parking_rate", e.target.value === "" ? 0 : Number(e.target.value))}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-hidden bg-white"
                      />
                      <p className="text-3xs text-slate-400">The baseline market rate charged to buyers per parking slot (₹).</p>
                    </div>
                  </div>

                  {/* Revenue Result Box */}
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1">
                    <span className="text-3xs font-bold uppercase tracking-wider text-slate-400 font-mono">Revenue Forecast</span>
                    <h3 className="text-3xl font-black text-blue-600 font-mono tracking-tight">
                      {formatIndianCurrency(calculated.total_sales_value)}
                    </h3>
                    <h4 className="text-xs font-bold text-slate-800">Total Expected Sales (₹)</h4>
                    <p className="text-3xs text-slate-400 leading-normal max-w-sm mx-auto mt-1">
                      Computed as: (Buildable Area × Selling Rate) + (Parking Slots × Parking Rate)
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 4: MONEY OUT (Costs) */}
              {currentStep === 4 && (
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">1. Land & Acquisition Cost (₹)</label>
                      <input
                        type="number"
                        value={inputs.land_cost || ""}
                        onChange={(e) => handleInputChange("land_cost", e.target.value === "" ? 0 : Number(e.target.value))}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-hidden bg-white text-slate-800"
                      />
                      <p className="text-3xs text-slate-400">Total upfront payment, landlord settlement, stamp duty on agreement, and registration fees.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">2. Gov & Approval cost Mode</label>
                      <select
                        value={inputs.govt_approval_mode}
                        onChange={(e) => handleInputChange("govt_approval_mode", e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-hidden bg-white text-slate-700 font-semibold"
                      >
                        <option value="percentage">Percentage of Sales (%)</option>
                        <option value="absolute">Combined Flat Amount (₹)</option>
                      </select>
                      <p className="text-3xs text-slate-400">Choose whether to input municipal approvals as % of top-line sales or flat sum.</p>
                    </div>

                    {inputs.govt_approval_mode === "percentage" ? (
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Govt Approval Percent (%)</label>
                        <input
                          type="number"
                          value={inputs.govt_approval_percent || ""}
                          onChange={(e) => handleInputChange("govt_approval_percent", e.target.value === "" ? 0 : Number(e.target.value))}
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-hidden bg-white text-slate-800"
                        />
                        <p className="text-3xs text-slate-400">e.g. 10% of total sales goes to RERA, FSI premiums, TDR costs, etc.</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Govt Approval Combined Cost (₹)</label>
                        <input
                          type="number"
                          value={inputs.govt_approval_charges || ""}
                          onChange={(e) => handleInputChange("govt_approval_charges", e.target.value === "" ? 0 : Number(e.target.value))}
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-hidden bg-white text-slate-800"
                        />
                        <p className="text-3xs text-slate-400">Flat fee model covering plan sanctions, environmental NOCs, tree clearance, etc.</p>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">3. Construction Rate (₹ / sq.ft.)</label>
                      <input
                        type="number"
                        value={inputs.construction_cost_per_sqft || ""}
                        onChange={(e) => handleInputChange("construction_cost_per_sqft", e.target.value === "" ? 0 : Number(e.target.value))}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-hidden bg-white text-slate-800"
                      />
                      <p className="text-3xs text-slate-400">RCC structural cost, materials, wages, finishes per sq.ft. of buildable space.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">4. Other Costs (% of Sales)</label>
                      <input
                        type="number"
                        value={inputs.marketing_percent || ""}
                        onChange={(e) => handleInputChange("marketing_percent", e.target.value === "" ? 0 : Number(e.target.value))}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-hidden bg-white text-slate-800"
                      />
                      <p className="text-3xs text-slate-400">Marketing, brokerages, general overheads, and site-level contingencies combined.</p>
                    </div>
                  </div>

                  {/* Expense Breakdown / Result Banner */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <span className="text-3xs font-bold uppercase tracking-wider text-slate-400 font-mono block text-center">Project Costs Summary</span>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-2xs text-slate-600 border-b border-slate-200/60 pb-3">
                      <div>
                        <span className="block text-slate-400 uppercase font-bold tracking-tight">Land Outlay:</span>
                        <span className="font-bold text-slate-700">{formatIndianCurrency(calculated.land_cost)}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 uppercase font-bold tracking-tight">Gov Approvals:</span>
                        <span className="font-bold text-slate-700">{formatIndianCurrency(calculated.govt_approval_cost_total)}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 uppercase font-bold tracking-tight">Construction:</span>
                        <span className="font-bold text-slate-700">{formatIndianCurrency(calculated.construction_cost_total)}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 uppercase font-bold tracking-tight">Other Costs:</span>
                        <span className="font-bold text-slate-700">{formatIndianCurrency(calculated.other_costs_total)}</span>
                      </div>
                    </div>

                    <div className="text-center">
                      <h3 className="text-2xl font-black text-slate-800 font-mono">
                        {formatIndianCurrency(calculated.total_expenses)}
                      </h3>
                      <h4 className="text-xs font-bold text-slate-500">Total Costs (₹)</h4>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: YOUR PROFIT (RESULTS) */}
              {currentStep === 5 && (
                <div className="p-6 space-y-6 animate-fade-in">
                  
                  {/* SIMPLE LOAN PARAMS AREA */}
                  <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Loan & Interest Parameters</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="block text-2xs font-bold text-slate-500 uppercase">Average Loan Amount Mode</label>
                        <select
                          value={inputs.loan_amount_mode}
                          onChange={(e) => handleInputChange("loan_amount_mode", e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                        >
                          <option value="auto">Auto (50% of construction cost)</option>
                          <option value="custom">Custom Flat Amount (₹)</option>
                        </select>
                      </div>

                      {inputs.loan_amount_mode === "custom" && (
                        <div className="space-y-1">
                          <label className="block text-2xs font-bold text-slate-500 uppercase">Average Loan Amount (₹)</label>
                          <input
                            type="number"
                            value={inputs.loan_amount || ""}
                            onChange={(e) => handleInputChange("loan_amount", e.target.value === "" ? 0 : Number(e.target.value))}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono bg-white"
                          />
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="block text-2xs font-bold text-slate-500 uppercase">Interest Rate (% per year)</label>
                        <input
                          type="number"
                          value={inputs.interest_rate_percent || ""}
                          onChange={(e) => handleInputChange("interest_rate_percent", e.target.value === "" ? 0 : Number(e.target.value))}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-2xs font-bold text-slate-500 uppercase">Loan Period (Years)</label>
                        <input
                          type="number"
                          value={inputs.loan_period_years || ""}
                          onChange={(e) => handleInputChange("loan_period_years", e.target.value === "" ? 0 : Number(e.target.value))}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3 LARGE CARD RESULTS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* CARD 1: PROFIT BEFORE INTEREST */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs flex flex-col justify-between hover:border-slate-300 transition-all">
                      <div>
                        <span className="text-3xs font-bold text-slate-400 uppercase tracking-wider font-mono">Metric 1</span>
                        <h4 className="text-xs font-bold text-slate-800 mt-1">Profit Before Interest</h4>
                        <p className="text-4xs text-slate-400 leading-normal mt-1">Total Expected Sales − Total Costs</p>
                      </div>
                      <div className="mt-4">
                        <span className="text-lg font-black text-slate-800 font-mono block">
                          {formatIndianCurrency(calculated.pbit)}
                        </span>
                      </div>
                    </div>

                    {/* CARD 2: LOAN INTEREST COST */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs flex flex-col justify-between hover:border-slate-300 transition-all">
                      <div>
                        <span className="text-3xs font-bold text-slate-400 uppercase tracking-wider font-mono">Metric 2</span>
                        <h4 className="text-xs font-bold text-slate-800 mt-1">Loan Interest Cost</h4>
                        <p className="text-4xs text-slate-400 leading-normal mt-1">Loan × rate % × years</p>
                      </div>
                      <div className="mt-4">
                        <span className="text-lg font-black text-red-600 font-mono block">
                          {formatIndianCurrency(calculated.interest_cost)}
                        </span>
                      </div>
                    </div>

                    {/* CARD 3: FINAL PROFIT */}
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-3xs flex flex-col justify-between hover:border-blue-300 transition-all">
                      <div>
                        <span className="text-3xs font-bold text-blue-400 uppercase tracking-wider font-mono">Metric 3</span>
                        <h4 className="text-xs font-bold text-blue-900 mt-1">Final Profit</h4>
                        <p className="text-4xs text-blue-600 leading-normal mt-1">Profit Before Interest − Interest Cost</p>
                      </div>
                      <div className="mt-4">
                        <span className={`text-xl font-black font-mono block ${calculated.pbt >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                          {formatIndianCurrency(calculated.pbt)}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* SUMMARY SENTENCE */}
                  <div className="p-5 bg-blue-600 text-white rounded-2xl shadow-sm text-center">
                    <p className="text-sm font-semibold leading-relaxed">
                      &quot;This project is expected to make <span className="font-extrabold">{formatIndianCurrency(calculated.total_sales_value)}</span> in sales and <span className="font-extrabold">{formatIndianCurrency(calculated.pbt)}</span> in final profit.&quot;
                    </p>
                  </div>

                  {/* DOWNLOAD PDF ACTION */}
                  <div className="pt-2 flex justify-center">
                    <button
                      onClick={handleDownloadPDF}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-md transition-all scale-102 hover:scale-105 cursor-pointer"
                    >
                      <Download className="w-4.5 h-4.5" />
                      Download PDF Report
                    </button>
                  </div>

                </div>
              )}

              {/* STEP CARD NAVIGATION FOOTER */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                  disabled={currentStep === 1}
                  className={`flex items-center gap-1 text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer ${
                    currentStep === 1
                      ? "text-slate-300 bg-slate-100 cursor-not-allowed"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSave()}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-slate-500" />
                    {isSaving ? "Saving..." : "Save Project"}
                  </button>

                  {currentStep < 5 ? (
                    <button
                      onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer"
                    >
                      Next Step
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleDownloadPDF}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Export Report
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* QUICK RESULTS METRICS VIEW (Span 4) */}
            <div className="xl:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5 select-none sticky top-24">
              <div className="border-b border-slate-100 pb-2">
                <span className="text-3xs font-extrabold uppercase tracking-widest text-slate-400 font-mono block">Real-time Summary</span>
                <h3 className="text-xs font-extrabold uppercase text-slate-800 tracking-tight mt-1">Key Calculations</h3>
              </div>

              <div className="space-y-4">
                {/* Metric 1 */}
                <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 text-blue-700 rounded-md">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-3xs font-extrabold uppercase text-slate-400 font-mono">Buildable Area</span>
                      <span className="text-xs font-bold text-slate-700">Max construction</span>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold font-mono text-slate-800">
                    {Math.round(calculated.buildable_area).toLocaleString()} <span className="text-3xs font-sans font-bold">sqft</span>
                  </span>
                </div>

                {/* Metric 2 */}
                <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-3xs font-extrabold uppercase text-slate-400 font-mono">Expected Sales</span>
                      <span className="text-xs font-bold text-slate-700">Gross inflows</span>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold font-mono text-slate-800">
                    {formatIndianCurrency(calculated.total_sales_value)}
                  </span>
                </div>

                {/* Metric 3 */}
                <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-red-100 text-red-700 rounded-md">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-3xs font-extrabold uppercase text-slate-400 font-mono">Total Expenses</span>
                      <span className="text-xs font-bold text-slate-700">Cumulative outlays</span>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold font-mono text-slate-800">
                    {formatIndianCurrency(calculated.total_expenses)}
                  </span>
                </div>

                {/* Metric 4 */}
                <div className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
                  calculated.pbt >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${
                      calculated.pbt >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      <Percent className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-3xs font-extrabold uppercase text-slate-400 font-mono">Net Profit</span>
                      <span className="text-xs font-bold text-slate-700">Bottom-line return</span>
                    </div>
                  </div>
                  <span className={`text-sm font-extrabold font-mono ${
                    calculated.pbt >= 0 ? 'text-emerald-700' : 'text-red-700'
                  }`}>
                    {formatIndianCurrency(calculated.pbt)}
                  </span>
                </div>
              </div>

              {/* Helper text */}
              <p className="text-4xs text-slate-400 leading-normal">
                These calculations update live as you adjust values inside any of the 5 steps.
              </p>
            </div>

          </div>
        </main>
      </div>

      {/* DATABASE SETTINGS DIALOG */}
      {isDbSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold uppercase text-slate-800">Database Connection Credentials</h3>
              <button
                onClick={() => setIsDbSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 uppercase">Supabase API URL</label>
                <input
                  type="text"
                  value={customSupabaseUrl}
                  onChange={(e) => setCustomSupabaseUrl(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 uppercase">Supabase Anon Key</label>
                <input
                  type="text"
                  value={customSupabaseAnonKey}
                  onChange={(e) => setCustomSupabaseAnonKey(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <p className="text-4xs text-slate-400 leading-normal">
                Configure your own Supabase instance credentials if you want to bypass the environment&apos;s standard schema cache. Leave defaults to run on our pre-allocated database.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsDbSettingsOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDbSettings}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
              >
                Connect Credentials
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
