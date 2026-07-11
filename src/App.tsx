import React, { useState, useEffect, useMemo } from "react";
import {
  Calculator,
  TrendingUp,
  Coins,
  Building2,
  Percent,
  Save,
  FolderOpen,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
  DollarSign,
  MapPin,
  Sparkles,
  Columns,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowRightLeft,
  Search,
  Database,
  Briefcase,
  MessageSquare,
  Send,
  Globe,
  HelpCircle,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { calculateProject } from "./calculations";
import { FeasibilityProject } from "./types";
import { jsPDF } from "jspdf";
import { InteractiveCalculator } from "./components/InteractiveCalculator";

// Realistic baseline inputs for a real-estate redevelopment project in India
const DEFAULT_PROJECT_INPUTS = {
  project_name: "Greenwood Heights Redevelopment",
  project_address: "Bandra West, Mumbai",
  road_name: "S.V. Road",
  road_facing_width: 45,
  zone_type: "NON-TOD",
  existing_commercial_units: 3,
  existing_commercial_carpet_area: 2500,
  plot_area: 12000,

  existing_road_widening_deduction: 500,
  additional_road_widening_deduction: 300,
  open_space_deduction: 1200,
  amenity_plot_deduction: 600,

  basic_fsi_ratio: 1.1,
  premium_fsi_ratio: 0.5,
  tdr_ratio: 1.4,
  ancillary_fsi_ratio: 0.8,
  loading_factor: 1.18,
  saleable_factor: 1.1,
  carpet_factor: 0.8,
  extra_carpet_percent: 35,

  typical_floor_sale_area: "",
  typical_floor_sale_rate: 12000,
  parking_count: 20,
  parking_rate: 300000,

  land_cost: 0,
  agent_brokerage: 0.05,
  ready_reckoner_rate: 5000,
  stamp_duty_dev_agreement: "",
  additional_area_members_stamp_duty_res: 0.15,
  additional_area_members_stamp_duty_comm: 0.05,
  additional_area_members_gst_res: 0.08,
  additional_area_members_gst_comm: 0.03,
  member_corpus_per_member: 500000,
  member_betterment_charges_per_member: 50000,
  movers_packers_per_member: 40000,
  residential_member_count: 15,
  residential_member_rent_rate: 50,
  residential_member_rent_months: 24,
  residential_member_rent_area: 12000,
  commercial_member_rent_rate: 80,
  commercial_member_rent_months: 24,
  brokerage_per_res_member: 40000,
  brokerage_per_comm_member: 60000,

  tdr_utilization_charges: 0.12,
  scrutiny_charges: 0.08,
  rada_roda_charges: 0.04,
  construction_rate_per_sqft: 2800,
  labour_cess_rate: 1,
  out_of_pocket_expenses: 0.15,
  fire_premium_charges: 0.18,
  land_development_cost: 0.10,
  parking_slab_cost: 0.30,
  stack_parking_charges: 0.12,
  gst_on_construction_percent: 18,
  architect_fee_percent: 3,

  interest_rate_percent: 12
};

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

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<"calculator" | "projects" | "compare" | "chat" | "research">("calculator");

  // Custom Supabase override states
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [customSupabaseUrl, setCustomSupabaseUrl] = useState<string>(localStorage.getItem("supabase_custom_url") || "https://lwhhntbtzazfofxjhzuv.supabase.co");
  const [customSupabaseAnonKey, setCustomSupabaseAnonKey] = useState<string>(localStorage.getItem("supabase_custom_anon_key") || "sb_publishable_3Wgp8cFrmNJSQhziiWmGGg_iRUqVblC");

  // Dynamic headers function to send custom credentials if stored locally
  const getSupabaseHeaders = (): Record<string, string> => {
    const url = localStorage.getItem("supabase_custom_url") || "https://lwhhntbtzazfofxjhzuv.supabase.co";
    const key = localStorage.getItem("supabase_custom_anon_key") || "sb_publishable_3Wgp8cFrmNJSQhziiWmGGg_iRUqVblC";
    const headers: Record<string, string> = {};
    if (url) headers["x-supabase-url"] = url;
    if (key) headers["x-supabase-anon-key"] = key;
    return headers;
  };

  // Chat panel states
  const [chatInput, setChatInput] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant" | "error"; content: string; timestamp: string }>>([
    {
      role: "assistant",
      content: "Hello! I am your AI Feasibility Analyst. Ask me anything about the selected project's numbers (e.g. 'what happens to PBT if construction cost rises 10%?').\n\nI can run step-by-step calculations and analyze profit projections grounded strictly in actual project figures.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatIsLoading, setChatIsLoading] = useState<boolean>(false);
  const [chatProjectSource, setChatProjectSource] = useState<string>("current"); // "current" or a saved project's ID

  // Market research states
  const [researchLocation, setResearchLocation] = useState<string>("");
  const [researchResult, setResearchResult] = useState<string | null>(null);
  const [researchSources, setResearchSources] = useState<Array<{ title: string; uri: string }>>([]);
  const [researchIsLoading, setResearchIsLoading] = useState<boolean>(false);
  const [researchError, setResearchError] = useState<string | null>(null);

  // Markdown rendering helper
  const parseInlineBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderMarkdown = (text: string) => {
    if (!text) return null;
    return text.split("\n").map((line, idx) => {
      if (line.startsWith("### ")) {
        return <h4 key={idx} className="text-sm font-bold text-gray-800 mt-4 mb-1.5">{line.replace("### ", "")}</h4>;
      }
      if (line.startsWith("## ")) {
        return <h3 key={idx} className="text-base font-bold text-gray-900 mt-5 mb-2">{line.replace("## ", "")}</h3>;
      }
      if (line.startsWith("# ")) {
        return <h2 key={idx} className="text-lg font-bold text-gray-900 mt-6 mb-3">{line.replace("# ", "")}</h2>;
      }
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const content = line.trim().substring(2);
        return (
          <div key={idx} className="flex items-start gap-2 pl-4 my-1">
            <span className="text-blue-500 mt-1 shrink-0">•</span>
            <span className="text-xs text-gray-600 leading-relaxed">{parseInlineBold(content)}</span>
          </div>
        );
      }
      if (/^\d+\.\s/.test(line.trim())) {
        const content = line.trim().replace(/^\d+\.\s/, "");
        const num = line.trim().match(/^\d+/)?.[0] || "1";
        return (
          <div key={idx} className="flex items-start gap-2 pl-4 my-1">
            <span className="text-blue-600 font-mono text-xs font-semibold shrink-0">{num}.</span>
            <span className="text-xs text-gray-600 leading-relaxed">{parseInlineBold(content)}</span>
          </div>
        );
      }
      if (line.trim() === "") return <div key={idx} className="h-2" />;
      return <p key={idx} className="text-xs text-gray-600 leading-relaxed my-1.5">{parseInlineBold(line)}</p>;
    });
  };

  // Handlers for Chat Panel
  const handleSendChatMessage = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const msg = customMsg || chatInput;
    if (!msg.trim() || chatIsLoading) return;

    const userMsg = {
      role: "user" as const,
      content: msg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!customMsg) setChatInput("");
    setChatIsLoading(true);

    try {
      let payload: Record<string, any> = {
        message: msg,
        history: chatMessages.slice(1).map((m) => ({
          role: m.role === "user" ? "user" : "model",
          content: m.content
        }))
      };

      if (chatProjectSource === "current") {
        payload.projectData = calculatedData;
      } else {
        payload.projectId = chatProjectSource;
      }

      const res = await fetch("/api/chat-project", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...getSupabaseHeaders()
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.answer,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        throw new Error(data.error || "An error occurred while generating the response.");
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "error",
          content: `Error: ${err.message || String(err)}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setChatIsLoading(false);
    }
  };

  // Handler for Market Research
  const handleGenerateMarketResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!researchLocation.trim() || researchIsLoading) return;

    setResearchIsLoading(true);
    setResearchError(null);
    setResearchResult(null);
    setResearchSources([]);

    try {
      const res = await fetch("/api/market-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: researchLocation })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResearchResult(data.report);
        setResearchSources(data.sources || []);
      } else {
        throw new Error(data.error || "An error occurred while performing research.");
      }
    } catch (err: any) {
      console.error("Research error:", err);
      setResearchError(err.message || String(err));
    } finally {
      setResearchIsLoading(false);
    }
  };

  // Project Inputs & State
  const [inputs, setInputs] = useState<Record<string, any>>(DEFAULT_PROJECT_INPUTS);
  const [currentId, setCurrentId] = useState<any>(null); // DB Row primary key

  // Supabase Status and Fetched Data
  const [savedProjects, setSavedProjects] = useState<FeasibilityProject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);
  
  // Feedback Messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Collapsible Form Section States
  const [sectionsExpanded, setSectionsExpanded] = useState({
    plot: true,
    fsi: true,
    rates: true,
    costs: true,
    interest: true,
  });

  // Comparison IDs
  const [compareId1, setCompareId1] = useState<string>("");
  const [compareId2, setCompareId2] = useState<string>("");

  // Search filter for projects list
  const [projectSearch, setProjectSearch] = useState<string>("");

  // Auto-run Live Calculations
  const calculatedData = useMemo(() => {
    return calculateProject(inputs);
  }, [inputs]);

  // Load projects from backend on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/projects", {
        headers: getSupabaseHeaders()
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setSavedProjects(result.data);
        setSupabaseConnected(true);
      } else {
        setSupabaseConnected(false);
        if (result.needsConfig) {
          console.warn("Supabase credentials not set in secrets panel.");
        } else {
          setErrorMessage("Failed to retrieve projects: " + (result.error || "Unknown error"));
        }
      }
    } catch (err: any) {
      console.error("Fetch projects error:", err);
      setSupabaseConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setInputs((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleSection = (section: keyof typeof sectionsExpanded) => {
    setSectionsExpanded((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputs.project_name.trim()) {
      setErrorMessage("Please provide a Project Name before saving.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Merge raw inputs and calculated outputs into a single payload matching the exact DB column list
    const payload = {
      id: currentId, // will be null for new insert
      ...calculatedData,
    };

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...getSupabaseHeaders()
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setSuccessMessage(`Project "${inputs.project_name}" has been saved successfully to Supabase!`);
        
        // As requested: Re-fetch live from Supabase to confirm and update lists
        await fetchProjects();
        
        // If it was a new project, bind the returned ID so subsequent saves act as updates
        if (result.data && result.data.id) {
          setCurrentId(result.data.id);
        }
        
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        throw new Error(result.error || "Database operation failed");
      }
    } catch (err: any) {
      console.error("Save error:", err);
      setErrorMessage(`Failed to save project: ${err.message || String(err)}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: any, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete project model "${name}"?`)) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

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
        setSuccessMessage(`Project "${name}" was deleted successfully.`);
        
        // Reset current editing project if it's the deleted one
        if (currentId === id || (inputs.project_name === name && !currentId)) {
          handleNewProject();
        }

        await fetchProjects();
      } else {
        throw new Error(result.error || "Failed to delete");
      }
    } catch (err: any) {
      console.error("Delete error:", err);
      setErrorMessage(`Failed to delete project: ${err.message || String(err)}`);
    }
  };

  const handleOpenProject = (proj: FeasibilityProject) => {
    // Populate form with saved data
    const { id, created_at, updated_at, ...cleanInputs } = proj as any;
    setInputs(cleanInputs);

    setCurrentId(proj.id || null);

    setSuccessMessage(`Loaded "${proj.project_name}" into calculator!`);
    setErrorMessage(null);
    setActiveTab("calculator");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNewProject = () => {
    setInputs({
      ...DEFAULT_PROJECT_INPUTS,
      project_name: "New Feasibility Study " + (savedProjects.length + 1)
    });
    setCurrentId(null);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  // Format Helper functions
  const formatCur = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatSqFt = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(val) + " sqft";
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const data = calculatedData;
    
    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("FEASIBILITY ANALYSIS REPORT", 14, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Project Model: ${inputs.project_name || "N/A"} | Generated: ${new Date().toLocaleDateString()}`, 14, 26);
    doc.line(14, 28, 196, 28);

    // Section 1: Project Basics
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("SECTION 1: PROJECT BASICS", 14, 36);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Project Name: ${inputs.project_name || "N/A"}`, 14, 43);
    doc.text(`Address: ${inputs.project_address || "N/A"}`, 14, 49);
    doc.text(`Road facing width: ${inputs.road_facing_width || 0} feet (${inputs.road_name || "N/A"})`, 14, 55);
    doc.text(`Zone Type: ${inputs.zone_type || "N/A"}`, 14, 61);
    doc.text(`Existing commercial units: ${inputs.existing_commercial_units || 0} | Area: ${inputs.existing_commercial_carpet_area || 0} sqft`, 14, 67);

    // Section 2: Area Workings
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("SECTION 2: AREA WORKINGS", 14, 77);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Area of Plot: ${formatSqFt(inputs.plot_area)}`, 14, 84);
    doc.text(`Less Road widening: ${formatSqFt(Number(inputs.existing_road_widening_deduction) + Number(inputs.additional_road_widening_deduction))}`, 14, 90);
    doc.text(`Balance Plot: ${formatSqFt(data.balance_plot_area)}`, 14, 96);
    doc.text(`Less Deductions (Open + Amenity): ${formatSqFt(Number(inputs.open_space_deduction) + Number(inputs.amenity_plot_deduction))}`, 14, 102);
    doc.text(`Balance Plot After Deductions: ${formatSqFt(data.balance_plot_after_deductions)}`, 14, 108);
    doc.text(`Permissible Gross FSI: ${formatSqFt(data.permissible_fsi_area)}`, 14, 114);
    doc.text(`Total Construction Area (incl. Ancillary & loading): ${formatSqFt(data.total_construction_area)}`, 14, 120);
    doc.text(`Total Saleable Area: ${formatSqFt(data.saleable_area)}`, 14, 126);
    doc.text(`Total Proposed Carpet: ${formatSqFt(data.total_proposed_carpet)}`, 14, 132);
    doc.text(`Area Returned to Members: ${formatSqFt(data.area_returned_to_commercial_members)}`, 14, 138);
    doc.text(`Balance Developer Carpet for Sale: ${formatSqFt(data.balance_area_with_developer_for_sale)}`, 14, 144);

    // Section 3: Sales Revenue
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("SECTION 3: SALES REVENUE", 14, 154);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Floor Saleable Area: ${formatSqFt(data.typical_floor_sale_area)} @ Rs. ${inputs.typical_floor_sale_rate}/sqft`, 14, 161);
    doc.text(`Parking slots: ${inputs.parking_count || 0} @ Rs. ${inputs.parking_rate || 0}/slot`, 14, 167);
    doc.text(`Total Sales Realization: ${formatCur(data.total_sales_value * 10000000)}`, 14, 173);

    // Add Page
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("SECTION 4: CAPITAL EXPENSES BREAKDOWN", 14, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Group A (Society Related Costs): ${formatCur(data.group_a_total * 10000000)}`, 14, 27);
    doc.text(`  - Corpus + Betterment + Rent Displacement + Brokerage`, 14, 33);
    doc.text(`Group B (Sanction Costs / Premiums / Construction): ${formatCur(data.group_b_total * 10000000)}`, 14, 39);
    doc.text(`  - TDR + Premiums + Scrutiny + Arch fee + Construction`, 14, 45);
    doc.text(`Group C (Other Expenses): ${formatCur(data.group_c_total * 10000000)}`, 14, 51);
    doc.text(`  - Overheads + Marketing + Contingencies`, 14, 57);
    doc.text(`Total Capital Expenses: ${formatCur(data.total_expenses * 10000000)}`, 14, 63);

    // Section 5: Profit & Feasibility Summary
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("SECTION 5: PROFIT & FEASIBILITY", 14, 73);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Operating Profit (PBIT): ${formatCur(data.pbit * 10000000)}`, 14, 80);
    doc.text(`Interest on Debt Financing: ${formatCur(data.total_interest * 10000000)} (Rate: ${inputs.interest_rate_percent}%)`, 14, 86);
    doc.text(`Net Developer Profit (PBT): ${formatCur(data.pbt * 10000000)}`, 14, 92);
    doc.text(`PBT Margin: ${data.total_sales_value > 0 ? ((data.pbt / data.total_sales_value) * 100).toFixed(2) : "0.00"}%`, 14, 98);

    doc.setFont("helvetica", "bold");
    doc.text("FEASIBILITY VERDICT SUMMARY IN SIMPLE WORDS:", 14, 110);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    
    // Split text for simple explanation
    const totalDeductions = Number(inputs.existing_road_widening_deduction || 0) + Number(inputs.additional_road_widening_deduction || 0);
    const simpleText = `For the re-development of ${inputs.project_name || "this project"} in ${inputs.project_address || "Mumbai"}, we start with a plot of ${inputs.plot_area} sqft. After subtracting ${totalDeductions} sqft for road widening, the net buildable land is ${data.balance_plot_area} sqft. Based on the zoning rules (Basic, Premium, TDR, and Ancillary), we can build a total of ${data.total_permissible_fsi} sqft in FSI. This translates to a total physical building size of ${data.total_construction_area} sqft (including passages and lift shafts). From this, we can sell ${data.total_saleable_area} sqft on the open market.
    
From sales, we expect to bring in a total revenue of ${formatCur(data.total_sales_value * 10000000)} (including typical floor sales of ${formatSqFt(data.typical_floor_sale_area)} and ${inputs.parking_count} car parking slots).
    
To build this, the total developer cost is ${formatCur(data.total_expenses * 10000000)}. This is split into:
- Society Rehabilitation & Rent benefits: ${formatCur(data.group_a_total * 10000000)}
- Municipal Premiums, Sanction fees & Construction: ${formatCur(data.group_b_total * 10000000)}
- Other direct/indirect costs & marketing: ${formatCur(data.group_c_total * 10000000)}
    
Before counting loan interest, the Operating Profit is ${formatCur(data.pbit * 10000000)}. After deducting ${formatCur(data.total_interest * 10000000)} for bank interest (at ${inputs.interest_rate_percent}% interest rate), the Developer's Net Profit is ${formatCur(data.pbt * 10000000)}. This gives a net return of ${data.total_sales_value > 0 ? ((data.pbt / data.total_sales_value) * 100).toFixed(1) : "0"}% on total sales value.`;

    const lines = doc.splitTextToSize(simpleText, 180);
    doc.text(lines, 14, 118);

    doc.save(`${inputs.project_name?.replace(/\s+/g, "_") || "Project"}_Feasibility_Report.pdf`);
  };

  // Find Projects for Side-by-Side Comparison
  const compProject1 = useMemo(() => {
    return savedProjects.find(p => String(p.id) === String(compareId1) || p.project_name === compareId1);
  }, [savedProjects, compareId1]);

  const compProject2 = useMemo(() => {
    return savedProjects.find(p => String(p.id) === String(compareId2) || p.project_name === compareId2);
  }, [savedProjects, compareId2]);

  // Set default comparison options once projects load
  useEffect(() => {
    if (savedProjects.length >= 2) {
      if (!compareId1) setCompareId1(String(savedProjects[0].id || savedProjects[0].project_name));
      if (!compareId2) setCompareId2(String(savedProjects[1].id || savedProjects[1].project_name));
    }
  }, [savedProjects]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] antialiased pb-20">
      {/* Top Professional Header Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-xs">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold tracking-tight text-gray-900">
                Redevelopment Feasibility Calculator
              </h1>
              <p className="text-xs text-gray-500">
                Professional Real Estate Financial Modelling & Zoning Compliance Analyzer
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Database Keys settings trigger */}
            <button
              onClick={() => {
                setCustomSupabaseUrl(localStorage.getItem("supabase_custom_url") || "");
                setCustomSupabaseAnonKey(localStorage.getItem("supabase_custom_anon_key") || "");
                setIsSupabaseModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 transition border border-blue-100 shadow-3xs"
            >
              <Database className="w-3.5 h-3.5" />
              Configure Supabase Keys
            </button>

            {/* Supabase Status Indicator */}
            {supabaseConnected === true ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 shadow-3xs">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Supabase Connected
              </span>
            ) : supabaseConnected === false ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Setup Required / Local
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Connecting...
              </span>
            )}

            {/* Quick Actions */}
            {currentId && (
              <button
                onClick={handleNewProject}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                New Model
              </button>
            )}
          </div>
        </div>

        {/* Global Tabs Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex border-t border-gray-100">
            <button
              onClick={() => setActiveTab("calculator")}
              className={`py-3 px-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "calculator"
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200"
              }`}
            >
              <Calculator className="w-4 h-4" />
              Interactive Calculator
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`py-3 px-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "projects"
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200"
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              My Saved Projects ({savedProjects.length})
            </button>
            <button
              onClick={() => setActiveTab("compare")}
              className={`py-3 px-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "compare"
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200"
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              Project Comparison View
            </button>
            <button
              onClick={() => {
                setActiveTab("chat");
                // Pre-set selected project to the currently open one if we have an active study
                if (currentId) {
                  setChatProjectSource(String(currentId));
                } else {
                  setChatProjectSource("current");
                }
              }}
              className={`py-3 px-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "chat"
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Ask About Project
            </button>
            <button
              onClick={() => setActiveTab("research")}
              className={`py-3 px-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "research"
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200"
              }`}
            >
              <Search className="w-4 h-4" />
              Market Research
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Status Alerts */}
        <AnimatePresence mode="popLayout">
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 flex items-start gap-3 shadow-xs"
            >
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm">Success</p>
                <p className="text-xs">{successMessage}</p>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-500 hover:text-green-700 text-sm font-semibold"
              >
                Dismiss
              </button>
            </motion.div>
          )}

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-start gap-3 shadow-xs"
            >
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm">Action Required</p>
                <p className="text-xs">{errorMessage}</p>
                {supabaseConnected === false && (
                  <p className="text-3xs mt-1 text-red-500 font-mono">
                    TIP: Ensure SUPABASE_URL & SUPABASE_ANON_KEY are filled in your secrets panel.
                  </p>
                )}
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-red-500 hover:text-red-700 text-sm font-semibold"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =========================================================================
            TAB 1: INTERACTIVE CALCULATOR
            ========================================================================= */}
        {activeTab === "calculator" && (
          <InteractiveCalculator
            inputs={inputs}
            setInputs={setInputs}
            calculatedData={calculatedData}
            currentId={currentId}
            isSaving={isSaving}
            onSave={handleSave}
            onDownloadPDF={handleDownloadPDF}
            formatCur={formatCur}
            formatSqFt={formatSqFt}
            onNavigateToChat={() => setActiveTab("chat")}
          />
        )}

        {/* =========================================================================
            TAB 2: MY PROJECTS LIST SCREEN
            ========================================================================= */}
        {activeTab === "projects" && (
          <div className="space-y-6">
            
            {/* Search & Statistics Bar */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative max-w-md w-full">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  placeholder="Search feasibility models by project name..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                />
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
                <div>
                  <span className="font-semibold text-gray-900">{savedProjects.length}</span> Total Saved Models
                </div>
                <div className="h-4 w-px bg-gray-200"></div>
                <div>
                  Average PBT:{" "}
                  <span className="font-bold text-blue-600">
                    {formatCur(
                      savedProjects.length > 0
                        ? savedProjects.reduce((sum, p) => sum + (p.pbt || 0), 0) / savedProjects.length
                        : 0
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* List Table/Cards container */}
            {isLoading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="font-medium text-sm">Fetching model database from Supabase...</p>
                <p className="text-xs text-gray-400 mt-1">Getting live calculation entries.</p>
              </div>
            ) : savedProjects.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-bold text-gray-800 text-sm">No Feasibility Projects Found</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-6">
                  {supabaseConnected === false
                    ? "Supabase is not configured yet. Paste your SUPABASE_URL and SUPABASE_ANON_KEY into the Secrets panel in AI Studio to sync your data live to the cloud!"
                    : "You haven't saved any feasibility studies yet. Model your inputs and click 'Save Project' to preserve your calculations."}
                </p>
                <button
                  onClick={() => setActiveTab("calculator")}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition"
                >
                  Create First Feasibility Study
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedProjects
                  .filter((p) => p.project_name.toLowerCase().includes(projectSearch.toLowerCase()))
                  .map((proj) => {
                    const margin = proj.total_sales_value > 0 ? (proj.pbt / proj.total_sales_value) * 100 : 0;
                    const formattedDate = proj.created_at
                      ? new Date(proj.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Local Draft";

                    return (
                      <div
                        key={proj.id || proj.project_name}
                        className="bg-white rounded-xl border border-gray-200 shadow-2xs hover:shadow-xs hover:border-blue-200 transition-all overflow-hidden flex flex-col justify-between"
                      >
                        <div className="p-5">
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-3xs font-semibold bg-gray-100 text-gray-800 font-mono mb-1">
                                {proj.zone_type || "Residential"}
                              </span>
                              <h4 className="font-bold text-gray-900 text-sm tracking-tight line-clamp-1">
                                {proj.project_name}
                              </h4>
                            </div>
                            <span className="text-3xs text-gray-400 shrink-0 font-mono">{formattedDate}</span>
                          </div>

                          {/* Metric overview */}
                          <div className="grid grid-cols-2 gap-4 py-3 border-y border-gray-50 my-3 text-xs">
                            <div>
                              <p className="text-gray-400 text-3xs uppercase font-mono tracking-wider">Saleable Area</p>
                              <p className="font-semibold text-gray-800 font-mono">{formatSqFt(proj.saleable_area)}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-3xs uppercase font-mono tracking-wider">Total Revenue</p>
                              <p className="font-semibold text-gray-800 font-mono">{formatCur(proj.total_sales_value)}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-3xs uppercase font-mono tracking-wider">Total Capital Cost</p>
                              <p className="font-semibold text-gray-800 font-mono">{formatCur(proj.total_expenses)}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-3xs uppercase font-mono tracking-wider">Profit Margin</p>
                              <p className={`font-bold font-mono ${margin >= 15 ? "text-emerald-600" : margin >= 0 ? "text-blue-600" : "text-rose-600"}`}>
                                {margin.toFixed(1)}% ({formatCur(proj.pbt)})
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="bg-gray-50/75 px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                          <button
                            onClick={() => handleDelete(proj.id, proj.project_name)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 rounded transition"
                            title="Delete Study"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenProject(proj)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            Open & Edit Study
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

          </div>
        )}

        {/* =========================================================================
            TAB 3: SIDE-BY-SIDE COMPARISON
            ========================================================================= */}
        {activeTab === "compare" && (
          <div className="space-y-6">
            
            {/* Project Selector Panel */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
              <h3 className="font-bold text-sm tracking-tight text-gray-800 mb-3 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                Select Two Projects to Analyze Side-by-Side
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Project A (Baseline)</label>
                  <select
                    value={compareId1}
                    onChange={(e) => setCompareId1(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                  >
                    <option value="">-- Choose Project A --</option>
                    {savedProjects.map((p) => (
                      <option key={p.id || p.project_name} value={p.id || p.project_name}>
                        {p.project_name} ({p.zone_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Project B (Scenario / Alternate)</label>
                  <select
                    value={compareId2}
                    onChange={(e) => setCompareId2(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                  >
                    <option value="">-- Choose Project B --</option>
                    {savedProjects.map((p) => (
                      <option key={p.id || p.project_name} value={p.id || p.project_name}>
                        {p.project_name} ({p.zone_type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Comparison Display table */}
            {!compProject1 || !compProject2 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
                <Columns className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="font-semibold text-sm">Awaiting Comparison Selection</p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  Please select two saved feasibility studies in the dropdowns above. You must have at least two saved models in Supabase.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
                
                {/* Headers */}
                <div className="grid grid-cols-12 bg-gray-50/75 p-4 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-600 font-mono">
                  <div className="col-span-4">Metric Parameters</div>
                  <div className="col-span-3 text-right text-gray-900">{compProject1.project_name}</div>
                  <div className="col-span-3 text-right text-gray-900">{compProject2.project_name}</div>
                  <div className="col-span-2 text-right">Absolute Variance</div>
                </div>

                {/* Rows Table Body */}
                <div className="divide-y divide-gray-100 text-xs">
                  
                  {/* SECTION 1: PHYSICAL DIMENSIONS */}
                  <div className="bg-blue-50/15 px-4 py-2 font-bold text-blue-900">Physical Dimensions</div>

                  <div className="grid grid-cols-12 p-4 items-center hover:bg-gray-50/50">
                    <div className="col-span-4 text-gray-600">Zoning Designation</div>
                    <div className="col-span-3 text-right font-medium">{compProject1.zone_type}</div>
                    <div className="col-span-3 text-right font-medium">{compProject2.zone_type}</div>
                    <div className="col-span-2 text-right text-gray-400">-</div>
                  </div>

                  <div className="grid grid-cols-12 p-4 items-center hover:bg-gray-50/50">
                    <div className="col-span-4 text-gray-600">Base Plot Area (sqft)</div>
                    <div className="col-span-3 text-right font-medium font-mono">{formatSqFt(compProject1.plot_area)}</div>
                    <div className="col-span-3 text-right font-medium font-mono">{formatSqFt(compProject2.plot_area)}</div>
                    <div className="col-span-2 text-right font-mono text-gray-600">{formatSqFt(compProject2.plot_area - compProject1.plot_area)}</div>
                  </div>

                  <div className="grid grid-cols-12 p-4 items-center hover:bg-gray-50/50">
                    <div className="col-span-4 text-gray-600">Net Balance Plot Area (sqft)</div>
                    <div className="col-span-3 text-right font-medium font-mono">{formatSqFt(compProject1.balance_plot_area)}</div>
                    <div className="col-span-3 text-right font-medium font-mono">{formatSqFt(compProject2.balance_plot_area)}</div>
                    <div className="col-span-2 text-right font-mono text-gray-600">{formatSqFt(compProject2.balance_plot_area - compProject1.balance_plot_area)}</div>
                  </div>

                  <div className="grid grid-cols-12 p-4 items-center hover:bg-gray-50/50">
                    <div className="col-span-4 text-gray-600">Approved FSI Permitted (sqft)</div>
                    <div className="col-span-3 text-right font-medium font-mono">{formatSqFt(compProject1.permissible_fsi_area)}</div>
                    <div className="col-span-3 text-right font-medium font-mono">{formatSqFt(compProject2.permissible_fsi_area)}</div>
                    <div className="col-span-2 text-right font-mono text-gray-600">{formatSqFt(compProject2.permissible_fsi_area - compProject1.permissible_fsi_area)}</div>
                  </div>

                  <div className="grid grid-cols-12 p-4 items-center hover:bg-gray-50/50">
                    <div className="col-span-4 text-gray-600">Open Market Saleable Area (sqft)</div>
                    <div className="col-span-3 text-right font-medium font-mono font-semibold text-blue-600">{formatSqFt(compProject1.saleable_area)}</div>
                    <div className="col-span-3 text-right font-medium font-mono font-semibold text-blue-600">{formatSqFt(compProject2.saleable_area)}</div>
                    <div className="col-span-2 text-right font-mono text-gray-600">{formatSqFt(compProject2.saleable_area - compProject1.saleable_area)}</div>
                  </div>

                  {/* SECTION 2: RATES & REALIZATION */}
                  <div className="bg-blue-50/15 px-4 py-2 font-bold text-blue-900">Revenue Metrics</div>

                  <div className="grid grid-cols-12 p-4 items-center hover:bg-gray-50/50">
                    <div className="col-span-4 text-gray-600">Residential Base Rate (₹/sqft)</div>
                    <div className="col-span-3 text-right font-mono">{formatCur(compProject1.residential_rate_per_sqft)}</div>
                    <div className="col-span-3 text-right font-mono">{formatCur(compProject2.residential_rate_per_sqft)}</div>
                    <div className="col-span-2 text-right font-mono">{formatCur(compProject2.residential_rate_per_sqft - compProject1.residential_rate_per_sqft)}</div>
                  </div>

                  <div className="grid grid-cols-12 p-4 items-center hover:bg-gray-50/50">
                    <div className="col-span-4 text-gray-600">Commercial Base Rate (₹/sqft)</div>
                    <div className="col-span-3 text-right font-mono">{formatCur(compProject1.commercial_rate_per_sqft)}</div>
                    <div className="col-span-3 text-right font-mono">{formatCur(compProject2.commercial_rate_per_sqft)}</div>
                    <div className="col-span-2 text-right font-mono">{formatCur(compProject2.commercial_rate_per_sqft - compProject1.commercial_rate_per_sqft)}</div>
                  </div>

                  <div className="grid grid-cols-12 p-4 items-center hover:bg-gray-50/50">
                    <div className="col-span-4 text-gray-600">Gross Sales Value (₹)</div>
                    <div className="col-span-3 text-right font-medium font-mono text-emerald-600">{formatCur(compProject1.total_sales_value)}</div>
                    <div className="col-span-3 text-right font-medium font-mono text-emerald-600">{formatCur(compProject2.total_sales_value)}</div>
                    <div className={`col-span-2 text-right font-mono font-semibold ${compProject2.total_sales_value - compProject1.total_sales_value >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {compProject2.total_sales_value - compProject1.total_sales_value >= 0 ? "+" : ""}
                      {formatCur(compProject2.total_sales_value - compProject1.total_sales_value)}
                    </div>
                  </div>

                  {/* SECTION 3: EXPENSES & COSTS */}
                  <div className="bg-blue-50/15 px-4 py-2 font-bold text-blue-900">Capital Costs Breakdown</div>

                  <div className="grid grid-cols-12 p-4 items-center hover:bg-gray-50/50">
                    <div className="col-span-4 text-gray-600">Base Construction Outlay (₹)</div>
                    <div className="col-span-3 text-right font-mono">{formatCur(compProject1.permissible_fsi_area * compProject1.construction_cost_per_sqft)}</div>
                    <div className="col-span-3 text-right font-mono">{formatCur(compProject2.permissible_fsi_area * compProject2.construction_cost_per_sqft)}</div>
                    <div className="col-span-2 text-right font-mono">{formatCur((compProject2.permissible_fsi_area * compProject2.construction_cost_per_sqft) - (compProject1.permissible_fsi_area * compProject1.construction_cost_per_sqft))}</div>
                  </div>

                  <div className="grid grid-cols-12 p-4 items-center hover:bg-gray-50/50">
                    <div className="col-span-4 text-gray-600">Rehabilitation Corpus Benefits (₹)</div>
                    <div className="col-span-3 text-right font-mono">{formatCur(compProject1.member_corpus)}</div>
                    <div className="col-span-3 text-right font-mono">{formatCur(compProject2.member_corpus)}</div>
                    <div className="col-span-2 text-right font-mono">{formatCur(compProject2.member_corpus - compProject1.member_corpus)}</div>
                  </div>

                  <div className="grid grid-cols-12 p-4 items-center hover:bg-gray-50/50">
                    <div className="col-span-4 text-gray-600">Tenant Rent Displacement (₹)</div>
                    <div className="col-span-3 text-right font-mono">{formatCur(compProject1.member_rent)}</div>
                    <div className="col-span-3 text-right font-mono">{formatCur(compProject2.member_rent)}</div>
                    <div className="col-span-2 text-right font-mono">{formatCur(compProject2.member_rent - compProject1.member_rent)}</div>
                  </div>

                  <div className="grid grid-cols-12 p-4 items-center hover:bg-gray-50/50 bg-gray-50/20 font-bold">
                    <div className="col-span-4 text-gray-800">Total Project Capital Cost (₹)</div>
                    <div className="col-span-3 text-right font-mono text-gray-900">{formatCur(compProject1.total_expenses)}</div>
                    <div className="col-span-3 text-right font-mono text-gray-900">{formatCur(compProject2.total_expenses)}</div>
                    <div className={`col-span-2 text-right font-mono ${compProject2.total_expenses - compProject1.total_expenses <= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {compProject2.total_expenses - compProject1.total_expenses >= 0 ? "+" : ""}
                      {formatCur(compProject2.total_expenses - compProject1.total_expenses)}
                    </div>
                  </div>

                  {/* SECTION 4: FEASIBILITY SUMMARY */}
                  <div className="bg-blue-600 px-4 py-2 font-bold text-white uppercase font-mono tracking-wider text-2xs">Feasibility Verdict (Bottom Line)</div>

                  <div className="grid grid-cols-12 p-4 items-center hover:bg-gray-50/50 font-semibold bg-indigo-50/10">
                    <div className="col-span-4 text-indigo-900">Operating Profit (PBIT)</div>
                    <div className="col-span-3 text-right font-mono text-indigo-700">{formatCur(compProject1.pbit)}</div>
                    <div className="col-span-3 text-right font-mono text-indigo-700">{formatCur(compProject2.pbit)}</div>
                    <div className={`col-span-2 text-right font-mono font-bold ${compProject2.pbit - compProject1.pbit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {compProject2.pbit - compProject1.pbit >= 0 ? "+" : ""}
                      {formatCur(compProject2.pbit - compProject1.pbit)}
                    </div>
                  </div>

                  <div className="grid grid-cols-12 p-4 items-center hover:bg-gray-50/50 font-bold bg-blue-50/40 text-sm">
                    <div className="col-span-4 text-blue-900">Developer Net Profit (PBT)</div>
                    <div className="col-span-3 text-right font-mono text-blue-900">{formatCur(compProject1.pbt)}</div>
                    <div className="col-span-3 text-right font-mono text-blue-900">{formatCur(compProject2.pbt)}</div>
                    <div className={`col-span-2 text-right font-mono font-extrabold text-base ${compProject2.pbt - compProject1.pbt >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {compProject2.pbt - compProject1.pbt >= 0 ? "+" : ""}
                      {formatCur(compProject2.pbt - compProject1.pbt)}
                    </div>
                  </div>

                  <div className="grid grid-cols-12 p-4 items-center hover:bg-gray-50/50 font-bold bg-gray-50/50">
                    <div className="col-span-4 text-gray-700">Project Return Margin (%)</div>
                    <div className="col-span-3 text-right font-mono text-gray-800">
                      {compProject1.total_sales_value > 0 ? ((compProject1.pbt / compProject1.total_sales_value) * 100).toFixed(1) : "0.0"}%
                    </div>
                    <div className="col-span-3 text-right font-mono text-gray-800">
                      {compProject2.total_sales_value > 0 ? ((compProject2.pbt / compProject2.total_sales_value) * 100).toFixed(1) : "0.0"}%
                    </div>
                    <div className={`col-span-2 text-right font-mono font-bold ${
                      (compProject2.total_sales_value > 0 ? (compProject2.pbt / compProject2.total_sales_value) * 100 : 0) -
                      (compProject1.total_sales_value > 0 ? (compProject1.pbt / compProject1.total_sales_value) * 100 : 0) >= 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}>
                      {((compProject2.total_sales_value > 0 ? (compProject2.pbt / compProject2.total_sales_value) * 100 : 0) -
                        (compProject1.total_sales_value > 0 ? (compProject1.pbt / compProject1.total_sales_value) * 100 : 0)
                      ).toFixed(1)}% Variance
                    </div>
                  </div>

                </div>

                <div className="p-5 bg-gray-50 text-center border-t border-gray-100 flex items-center justify-center gap-3">
                  <div className="text-2xs text-gray-500 font-medium">
                    Green highlighted absolute variance means Scenario B outperforms Baseline Scenario A.
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* Chat / Ask About Project Tab */}
        {activeTab === "chat" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Sidebar with settings and suggestions */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Context Selector Card */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5 font-mono">
                  <Database className="w-3.5 h-3.5 text-blue-500" />
                  Select Project Context
                </h3>
                <p className="text-2xs text-gray-400 mb-4 leading-relaxed">
                  Choose which model data Gemini should reference when answering your questions.
                </p>
                
                <div className="space-y-1.5">
                  <label className="text-2xs font-semibold text-gray-600 block">Grounding Source:</label>
                  <select
                    value={chatProjectSource}
                    onChange={(e) => setChatProjectSource(e.target.value)}
                    className="w-full text-xs rounded-lg border border-gray-200 p-2.5 bg-gray-50 hover:bg-white text-gray-700 focus:ring-2 focus:ring-blue-100 transition"
                  >
                    <option value="current">
                      ✨ Active Form Inputs ({calculatedData.project_name || "Unsaved"})
                    </option>
                    {savedProjects.map((p) => (
                      <option key={p.id || p.project_name} value={p.id ? String(p.id) : p.project_name}>
                        📁 Database: {p.project_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-2xs text-blue-800 leading-relaxed">
                  <span className="font-semibold block mb-0.5">Grounding Scope:</span>
                  The chatbot is strictly grounded in actual project data. It will perform complex math on request.
                </div>
              </div>

              {/* Suggestions Card */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5 font-mono">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                  Suggested Prompts
                </h3>
                <div className="space-y-2">
                  {[
                    "What is the PBT for this project?",
                    "What happens to PBT if construction cost rises 10%?",
                    "What is the total sales value versus capital costs?",
                    "Show a detailed breakdown of deductions on this plot.",
                  ].map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendChatMessage(undefined, q)}
                      disabled={chatIsLoading}
                      className="w-full text-left p-2.5 rounded-lg border border-gray-100 hover:border-blue-100 hover:bg-blue-50/10 text-2xs text-gray-600 hover:text-blue-700 transition leading-relaxed block"
                    >
                      "{q}"
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat Conversation Box */}
            <div className="lg:col-span-3 flex flex-col h-[650px] bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Project AI Assistant</h2>
                    <p className="text-3xs text-gray-400 font-mono">Grounded on {chatProjectSource === "current" ? "Active Study State" : "Database Records"}</p>
                  </div>
                </div>
                {chatMessages.length > 1 && (
                  <button
                    onClick={() => setChatMessages([chatMessages[0]])}
                    className="text-2xs text-gray-400 hover:text-gray-600 font-semibold"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {/* Messages Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/15">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-3xs ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : msg.role === "error"
                          ? "bg-rose-50 border border-rose-100 text-rose-800 rounded-tl-none"
                          : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="space-y-1">
                          {renderMarkdown(msg.content)}
                        </div>
                      )}
                      <div
                        className={`text-3xs mt-1.5 text-right ${
                          msg.role === "user" ? "text-blue-200" : "text-gray-400"
                        }`}
                      >
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
                
                {chatIsLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-3xs flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendChatMessage} className="p-4 border-t border-gray-100 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type your question (e.g. 'explain how basic_fsi_percent impacts total_sales_value')"
                    disabled={chatIsLoading}
                    className="flex-1 text-xs border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition placeholder-gray-400"
                  />
                  <button
                    type="submit"
                    disabled={chatIsLoading || !chatInput.trim()}
                    className="px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 text-white disabled:text-gray-400 font-semibold text-xs flex items-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Market Research Tab */}
        {activeTab === "research" && (
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Input card */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Indicative Micro-Market Research</h2>
                  <p className="text-xs text-gray-500">Generate real-time local selling rates, demand feedback, and comparable project comps grounded in live Google search.</p>
                </div>
              </div>

              <form onSubmit={handleGenerateMarketResearch} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={researchLocation}
                    onChange={(e) => setResearchLocation(e.target.value)}
                    placeholder="Enter micro-market or location (e.g., Bandra West, Mumbai or Greenwood Heights, Brooklyn)"
                    disabled={researchIsLoading}
                    className="w-full text-xs pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={researchIsLoading || !researchLocation.trim()}
                  className="sm:w-auto w-full px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 text-white disabled:text-gray-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  {researchIsLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Generate Report
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Error state */}
            {researchError && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block mb-0.5">Research Request Failed</span>
                  {researchError}
                </div>
              </div>
            )}

            {/* Loading placeholder */}
            {researchIsLoading && (
              <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-2xs flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative">
                  <Globe className="w-12 h-12 text-blue-200 animate-pulse" />
                  <Sparkles className="w-5 h-5 text-blue-600 absolute -top-1 -right-1 animate-bounce" />
                </div>
                <div className="max-w-md">
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Gathering Real-Time Market Data...</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Gemini is searching the live web to fetch current local pricing rates, active comparable projects, and demand profiles for <span className="font-semibold text-gray-700 font-mono">"{researchLocation}"</span>. This may take up to 10 seconds.
                  </p>
                </div>
              </div>
            )}

            {/* Results */}
            {researchResult && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden animate-fade-in">
                
                {/* Grounding Disclaimer */}
                <div className="bg-amber-50/50 p-4 border-b border-amber-100 text-amber-950 flex items-start gap-3">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-2xs leading-relaxed">
                    <span className="font-bold uppercase tracking-wider text-amber-800 text-3xs font-mono block mb-0.5">Disclaimer</span>
                    This report is an AI-generated indicative micro-market research study utilizing live Google search indexes. All rates, notes, and dynamics are tentative indicators and should be verified against active local brokers or commercial valuation reports before final sanctioning.
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="p-6 space-y-6">
                  
                  {/* Title and metadata */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
                    <div>
                      <span className="text-3xs font-bold uppercase tracking-wider text-blue-600 font-mono">Indicative Comp Report</span>
                      <h3 className="text-base font-bold text-gray-900 mt-0.5">{researchLocation} Micro-Market</h3>
                    </div>
                    <div className="text-right text-3xs text-gray-400 font-mono">
                      Generated: {new Date().toLocaleDateString()} | Grounded Report
                    </div>
                  </div>

                  {/* Report Body */}
                  <div className="prose max-w-none text-gray-700">
                    {renderMarkdown(researchResult)}
                  </div>

                  {/* Search Sources list */}
                  {researchSources.length > 0 && (
                    <div className="border-t border-gray-100 pt-5 mt-6">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5 font-mono">
                        <Globe className="w-3.5 h-3.5 text-blue-500" />
                        Live Search Sources Referenced ({researchSources.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {researchSources.slice(0, 5).map((src, sIdx) => (
                          <a
                            key={sIdx}
                            href={src.uri}
                            target="_blank"
                            referrerPolicy="no-referrer"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 text-3xs font-medium text-gray-600 hover:text-blue-700 transition animate-fade-in"
                          >
                            <FileText className="w-3 h-3 text-gray-400" />
                            <span className="max-w-[180px] truncate">{src.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* Supabase Override Modal Overlay */}
      <AnimatePresence>
        {isSupabaseModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4" id="supabase-settings-modal">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSupabaseModalOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-xs"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-lg overflow-hidden rounded-xl bg-white p-6 shadow-xl border border-gray-100 z-10"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Supabase Connection Settings</h3>
                  <p className="text-2xs text-gray-500">Configure custom database keys to persist and sync your projects.</p>
                </div>
              </div>

              {/* Form fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-2xs font-semibold text-gray-600 mb-1">
                    SUPABASE_URL
                  </label>
                  <input
                    type="text"
                    value={customSupabaseUrl}
                    onChange={(e) => setCustomSupabaseUrl(e.target.value)}
                    placeholder="e.g. https://xyz.supabase.co"
                    className="w-full text-xs rounded-lg border border-gray-200 px-3 py-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-semibold text-gray-600 mb-1">
                    SUPABASE_ANON_KEY
                  </label>
                  <textarea
                    value={customSupabaseAnonKey}
                    onChange={(e) => setCustomSupabaseAnonKey(e.target.value)}
                    placeholder="Enter your public anon key..."
                    rows={3}
                    className="w-full text-xs rounded-lg border border-gray-200 px-3 py-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition font-mono"
                  />
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-3xs text-amber-800 leading-relaxed">
                  <span className="font-semibold block mb-0.5">Where do I find these?</span>
                  Log in to your <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-amber-950">Supabase Dashboard</a>, navigate to <strong>Project Settings</strong> &rarr; <strong>API</strong>, and copy the Project URL and <code>anon</code> public API key.
                </div>
              </div>

              {/* Footer buttons */}
              <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    // Reset / Clear localStorage override
                    localStorage.removeItem("supabase_custom_url");
                    localStorage.removeItem("supabase_custom_anon_key");
                    setCustomSupabaseUrl("");
                    setCustomSupabaseAnonKey("");
                    setIsSupabaseModalOpen(false);
                    setSuccessMessage("Cleared custom credentials. Using environment defaults.");
                    fetchProjects();
                  }}
                  className="px-3.5 py-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 font-semibold text-2xs transition"
                >
                  Clear Overrides
                </button>

                <button
                  type="button"
                  onClick={() => setIsSupabaseModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-transparent text-gray-500 hover:bg-gray-50 font-semibold text-2xs transition"
                  id="close-supabase-modal"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (customSupabaseUrl.trim()) {
                      localStorage.setItem("supabase_custom_url", customSupabaseUrl.trim());
                    } else {
                      localStorage.removeItem("supabase_custom_url");
                    }

                    if (customSupabaseAnonKey.trim()) {
                      localStorage.setItem("supabase_custom_anon_key", customSupabaseAnonKey.trim());
                    } else {
                      localStorage.removeItem("supabase_custom_anon_key");
                    }

                    setIsSupabaseModalOpen(false);
                    setSuccessMessage("Supabase credentials configured successfully! Testing connection...");
                    fetchProjects();
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-2xs shadow-3xs transition"
                  id="save-supabase-keys"
                >
                  Apply & Save Keys
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
