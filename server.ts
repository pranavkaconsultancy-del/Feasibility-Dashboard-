import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

// Load environment variables in development
dotenv.config();

const supabaseClientsCache: Record<string, any> = {};

function getSupabaseClient(req?: express.Request) {
  let url = req?.headers ? (req.headers["x-supabase-url"] as string) : null;
  let key = req?.headers ? (req.headers["x-supabase-anon-key"] as string) : null;

  if (!url || !key) {
    url = process.env.SUPABASE_URL;
    key = process.env.SUPABASE_ANON_KEY;
  }

  if (!url || !key) {
    throw new Error(
      "Supabase credentials (SUPABASE_URL and SUPABASE_ANON_KEY) are not configured. Please define them in the Secrets panel or enter them in the Supabase Keys Settings popup in the app."
    );
  }

  const cacheKey = `${url}:::${key}`;
  if (!supabaseClientsCache[cacheKey]) {
    supabaseClientsCache[cacheKey] = createClient(url, key);
  }
  return supabaseClientsCache[cacheKey];
}

let aiClient: GoogleGenAI | null = null;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Gemini API Key is not configured. Please define GEMINI_API_KEY in the Secrets panel."
    );
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Fetch all projects from Supabase
  app.get("/api/projects", async (req, res) => {
    try {
      const supabase = getSupabaseClient(req);
      const { data, error } = await supabase
        .from("feasibility_projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }
      res.json({ success: true, data: data || [] });
    } catch (error: any) {
      console.error("Error fetching projects from Supabase:", error);
      res.status(500).json({
        success: false,
        error: error.message || String(error),
        needsConfig: !process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY,
      });
    }
  });

  // Save a project (Insert or Update)
  app.post("/api/projects", async (req, res) => {
    try {
      const supabase = getSupabaseClient(req);
      const { id, ...data } = req.body;

      // Clean read-only/generated timestamps if empty
      if (data.created_at === null || data.created_at === undefined) delete data.created_at;
      if (data.updated_at === null || data.updated_at === undefined) delete data.updated_at;

      let result;
      if (id) {
        // Explicitly update by ID
        const { data: updated, error } = await supabase
          .from("feasibility_projects")
          .update(data)
          .eq("id", id)
          .select();

        if (error) throw error;
        result = updated;
      } else {
        // Fallback checks to prevent duplicate named projects and upsert seamlessly
        const { data: existing, error: findError } = await supabase
          .from("feasibility_projects")
          .select("*")
          .eq("project_name", data.project_name);

        if (!findError && existing && existing.length > 0) {
          const existingRow = existing[0];
          // Use ID if available in database, otherwise fall back to project_name
          const identifierKey = existingRow.id ? "id" : "project_name";
          const identifierVal = existingRow.id ? existingRow.id : data.project_name;

          const { data: updated, error: updateErr } = await supabase
            .from("feasibility_projects")
            .update(data)
            .eq(identifierKey, identifierVal)
            .select();

          if (updateErr) throw updateErr;
          result = updated;
        } else {
          // Plain insert
          const { data: inserted, error: insertErr } = await supabase
            .from("feasibility_projects")
            .insert([data])
            .select();

          if (insertErr) throw insertErr;
          result = inserted;
        }
      }

      res.json({ success: true, data: result ? result[0] : null });
    } catch (error: any) {
      console.error("Error saving project to Supabase:", error);
      res.status(500).json({
        success: false,
        error: error.message || String(error),
        needsConfig: !process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY,
      });
    }
  });

  // Delete a project from Supabase
  app.delete("/api/projects", async (req, res) => {
    try {
      const supabase = getSupabaseClient(req);
      const { id, project_name } = req.body;

      let query = supabase.from("feasibility_projects").delete();
      if (id) {
        query = query.eq("id", id);
      } else if (project_name) {
        query = query.eq("project_name", project_name);
      } else {
        return res.status(400).json({
          success: false,
          error: "Either project 'id' or 'project_name' is required to delete a project.",
        });
      }

      const { error } = await query;
      if (error) throw error;

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting project from Supabase:", error);
      res.status(500).json({
        success: false,
        error: error.message || String(error),
        needsConfig: !process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY,
      });
    }
  });

  // Chat with feasibility project endpoint
  app.post("/api/chat-project", async (req, res) => {
    try {
      const { projectId, projectData, message, history } = req.body;
      if (!message) {
        return res.status(400).json({ success: false, error: "Message is required" });
      }

      let project: any = null;

      if (projectId) {
        try {
          const supabase = getSupabaseClient(req);
          const { data, error } = await supabase
            .from("feasibility_projects")
            .select("*")
            .eq("id", projectId)
            .single();
          
          if (!error && data) {
            project = data;
          }
        } catch (supabaseErr) {
          console.warn("Supabase fetch error in chat endpoint:", supabaseErr);
        }
      }

      // Fallback to projectData if provided or if Supabase query yielded nothing
      if (!project && projectData) {
        project = projectData;
      }

      if (!project) {
        return res.status(400).json({
          success: false,
          error: "No active project data could be found. Please select or save a project first.",
        });
      }

      const ai = getGeminiClient();

      // Clean metadata out of the logged json for smaller/cleaner prompt context
      const cleanProject = { ...project };
      delete cleanProject.id;
      delete cleanProject.created_at;
      delete cleanProject.updated_at;

      const contextStr = JSON.stringify(cleanProject, null, 2);

      const systemInstruction = `You are a real estate financial analyst assistant.
You are helping a developer analyze a feasibility project called "${project.project_name || 'Untitled Project'}".

Here is the current project's actual data from the database:
${contextStr}

We use the following mathematical formulas to perform calculations on this data. If the user asks for scenario analysis (e.g. "what happens to PBT if construction cost rises 10%?"), calculate the changes step-by-step using these exact rules:
1. Balance Plot Area = plot_area - existing_road_widening_deduction - additional_road_widening_deduction
2. Balance Plot After Deductions = balance_plot_area - open_space_deduction - amenity_plot_deduction
3. Permissible FSI Areas:
   - Basic FSI Permissible = balance_plot_after_deductions * basic_fsi_ratio (default 1.1 or 1.5)
   - Premium FSI Permissible = balance_plot_after_deductions * premium_fsi_ratio (default 0.5 or 0.8)
   - TDR Permissible = balance_plot_after_deductions * tdr_ratio (default 1.4 or 1.7)
   - Total FSI Permissible = Basic + Premium + TDR Permissible FSI
   - Ancillary FSI Permissible = balance_plot_after_deductions * ancillary_fsi_ratio (default 0.8)
   - Total Permissible FSI = Total FSI Permissible + Ancillary FSI Permissible
4. Area & Saleable Workings:
   - Total Construction Area = Total Permissible FSI * loading_factor (default 1.18)
   - Total Saleable Area = Total Construction Area * saleable_factor (default 1.1)
   - Total Proposed Carpet = Total Saleable Area * carpet_factor (default 0.8)
   - Area Returned to Members = existing_commercial_carpet_area * (1 + extra_carpet_percent / 100)
   - Balance Area With Developer for Sale = Total Proposed Carpet - Area Returned to Members
   - Commercial Balance Sale Area to Developer = Total Saleable Area - Area Returned to Members
5. Sales Revenue (₹ Cr):
   - Typical Floor Sale Amount = (typical_floor_sale_area * typical_floor_sale_rate) / 10,000,000
   - Parking Amount = (parking_count * parking_rate) / 10,000,000
   - Total Sales Value = Typical Floor Sale Amount + Parking Amount
6. Expenses Cost Groups (₹ Cr):
   - Group A (Society Related) = land_cost + agent_brokerage + stamp_duty_dev_agreement + member_corpus_total + member_betterment_charges_total + movers_packers_total + residential_member_rent_total + commercial_member_rent_total + brokerage_res_member_total + brokerage_comm_member_total + additional_area_members_stamp_duty_res + additional_area_members_stamp_duty_comm + additional_area_members_gst_res + additional_area_members_gst_comm
   - Group B (Municipal Sanctions) = premium_fsi_cost + ancillary_fsi_cost + tdr_cost + tdr_gst + tdr_utilization_charges + development_charges_land + development_charges_building + scrutiny_charges + rada_roda_charges + labour_cess_cost + out_of_pocket_expenses + fire_premium_charges + construction_cost_total + land_development_cost + parking_slab_cost + stack_parking_charges + gst_on_construction_cost + architect_fee_total
   - Group C (Other Expenses) = overhead_direct (2% of sales) + overhead_indirect (2% of sales) + marketing_and_brokerage (3% of sales) + contingencies_cost (5% of Group A + Group B)
   - Total Expenses = Group A + Group B + Group C
7. Bottom-line Feasibility:
   - Operating Profit (PBIT) = Total Sales Value - Total Expenses
   - Total Interest (Debt Financing) = Interest on 25% of Construction Cost + Interest on Premium Costs + Interest on Member Rent & Stamp Duty + Interest on Balance 75% of Construction Cost
   - Net Developer Profit (PBT) = PBIT - Total Interest

CRITICAL INSTRUCTIONS:
- GROUND ANSWERS ONLY IN THIS PROJECT'S ACTUAL DATA. Do not invent other external figures.
- Be precise with numbers and financial terminology. Format monetary values in Indian Rupees with the rupees symbol (e.g., ₹1,23,456 or ₹12.34 Lakhs) and areas in sqft.
- Clearly present any calculations so the user can follow along.
- If the user asks a question unrelated to the project, politely remind them that your scope is limited to analyzing this specific feasibility project.
- Write your answers in clear, concise, professional English. Use bullet points and bold headers to make it scannable.`;

      const contents: any[] = [];
      if (history && Array.isArray(history)) {
        history.forEach((msg: any) => {
          contents.push({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }]
          });
        });
      }
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.2,
        }
      });

      res.json({ success: true, answer: response.text });
    } catch (error: any) {
      console.error("Chat project error:", error);
      res.status(500).json({ success: false, error: error.message || String(error) });
    }
  });

  // Live market research endpoint with search grounding
  app.post("/api/market-research", async (req, res) => {
    try {
      const { location } = req.body;
      if (!location || !location.trim()) {
        return res.status(400).json({ success: false, error: "Location is required" });
      }

      const ai = getGeminiClient();

      const systemInstruction = `You are a professional real estate market researcher.
Your task is to generate a short, structured summary for the location specified by the user.

You MUST cover these exact three sections in your response:
1. Typical Sale Rates: Typical current selling rates for residential, commercial, and retail in this micro-market.
2. General Demand Commentary: A summary of developer/buyer interest, supply-demand dynamics, and micro-market trends.
3. Comparable Project Notes: Notable active or upcoming redevelopment or new construction projects in this area.

Important guidelines:
- Clearly label the output as "AI-generated indicative research with a disclaimer to confirm rates against current local sources" at either the top or bottom of the response.
- Present realistic estimates grounded in search results.
- Structure with clean Markdown headers, bullet points, and high readability.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Please perform micro-market research for: ${location}`,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
          temperature: 0.3,
        }
      });

      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => {
        return {
          title: chunk.web?.title || "Search Source",
          uri: chunk.web?.uri || "",
        };
      }) || [];

      res.json({ success: true, report: response.text, sources });
    } catch (error: any) {
      console.error("Market research error:", error);
      res.status(500).json({ success: false, error: error.message || String(error) });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
