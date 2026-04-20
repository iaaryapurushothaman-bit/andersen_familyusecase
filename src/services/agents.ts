import { FunctionTool, LlmAgent } from './adk-web-patch';
import { z } from 'zod';
import businesses from '../data/businesses.json';

// ── Tool 1: Lookup a specific company/family/industry ──────────────────────
export const lookupBusinessDataTool = new FunctionTool({
    name: 'lookup_business_data',
    description: 'Searches the internal business database for information on specific family-owned groups by company name, family name, or industry sector.',
    parameters: z.object({
        companyName: z.string().optional().describe("The name of the company or group to search for."),
        familyName: z.string().optional().describe("The family name associated with the business."),
        industry: z.string().optional().describe("The industry sector (e.g., Construction, Retail, Diversified).")
    }),
    execute: (args: any) => {
        console.log("ADK Tool Call: lookup_business_data", args);
        const searchName = args.companyName?.toLowerCase().trim() || "";
        const searchFamily = args.familyName?.toLowerCase().trim() || "";
        const searchIndustry = args.industry?.toLowerCase().trim() || "";

        const results = (businesses as any[]).filter(b => {
            const nameMatch = searchName && b.name.toLowerCase().includes(searchName);
            const familyMatch = searchFamily && b.family.toLowerCase().includes(searchFamily);
            const industryMatch = searchIndustry && b.industry.toLowerCase().includes(searchIndustry);
            return nameMatch || familyMatch || industryMatch;
        });

        const data = results.slice(0, 10).map(b => ({
            ...b,
            contactPerson: b.contactPerson || "-"
        }));
        return { status: 'success', count: data.length, data };
    },
});

// ── Tool 2: Analytics / Aggregate queries on the full database ─────────────
export const queryBusinessDataTool = new FunctionTool({
    name: 'query_business_data',
    description: `Performs analytical and aggregate queries on the entire internal business database.
    Use this tool for questions like:
    - "How many companies are in Tier 2?"
    - "List all Tier 1 companies"
    - "Which companies have High governance?"
    - "How many companies are in the Construction industry?"
    - "Give me a breakdown/count by tier"
    - "Show all companies with Low governance"
    - "Which industries have the most companies?"
    - "Show me all companies with revenue above $1B"
    - "List all decision makers in Tier 3"
    - Any question that involves counting, grouping, filtering, or summarising across the database.`,
    parameters: z.object({
        action: z.enum(['count', 'list', 'group_by', 'summary'])
            .describe(`What to do:
            - 'count': Count companies matching the filters.
            - 'list': Return all companies matching the filters (up to 50).
            - 'group_by': Count companies grouped by a specific field.
            - 'summary': Return overall statistics for the entire database.`),
        filterTier: z.string().optional().describe("Filter by tier value, e.g. '1', '2', or '3'."),
        filterGovernance: z.string().optional().describe("Filter by governance level: 'High', 'Medium', or 'Low'."),
        filterIndustry: z.string().optional().describe("Filter by industry keyword, e.g. 'Construction', 'Retail'."),
        filterRevenue: z.string().optional().describe("Filter by revenue keyword, e.g. '$1B+', '$500M-$1B', '$50M-$500M'."),
        filterContactPerson: z.string().optional().describe("Filter by contact person name keyword."),
        filterDifferentContact: z.boolean().optional().describe("If true, only return companies where the Key Decision Maker and Contact Person are different."),
        groupByField: z.string().optional().describe("Field to group by for 'group_by' action: 'tier', 'governance', or 'industry'.")
    }),
    execute: (args: any) => {
        console.log("ADK Tool Call: query_business_data", args);
        const db = businesses as any[];

        // Apply filters
        let filtered = db.filter(b => {
            if (args.filterTier && b.tier !== args.filterTier) return false;
            if (args.filterGovernance && b.governance?.toLowerCase() !== args.filterGovernance.toLowerCase()) return false;
            if (args.filterIndustry && !b.industry?.toLowerCase().includes(args.filterIndustry.toLowerCase())) return false;
            if (args.filterRevenue && !b.revenue?.toLowerCase().includes(args.filterRevenue.toLowerCase())) return false;
            if (args.filterContactPerson && !b.contactPerson?.toLowerCase().includes(args.filterContactPerson.toLowerCase())) return false;

            if (args.filterDifferentContact === true) {
                // Return true only if they are different and none of them are "-" placeholder
                const dm = (b.decisionMaker || "").trim().toLowerCase();
                const cp = (b.contactPerson || "").trim().toLowerCase();
                if (dm === cp || cp === "-") return false;
            }

            return true;
        });

        if (args.action === 'count') {
            return {
                status: 'success',
                count: filtered.length,
                filters_applied: { tier: args.filterTier, governance: args.filterGovernance, industry: args.filterIndustry, revenue: args.filterRevenue }
            };
        }

        if (args.action === 'list') {
            return {
                status: 'success',
                count: filtered.length,
                companies: filtered.slice(0, 50).map(b => ({
                    name: b.name,
                    family: b.family,
                    industry: b.industry,
                    revenue: b.revenue,
                    tier: b.tier,
                    governance: b.governance,
                    decisionMaker: b.decisionMaker,
                    contactPerson: b.contactPerson,
                    position: b.position,
                    signals: b.signals
                }))
            };
        }

        if (args.action === 'group_by') {
            const field = (args.groupByField || 'tier') as string;
            const groups: Record<string, number> = {};
            filtered.forEach(b => {
                const key = b[field] ?? 'Unknown';
                groups[key] = (groups[key] || 0) + 1;
            });
            // Sort keys
            const sorted = Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
            return {
                status: 'success',
                total: filtered.length,
                group_by_field: field,
                breakdown: Object.fromEntries(sorted)
            };
        }

        if (args.action === 'summary') {
            const tierBreakdown: Record<string, number> = {};
            const governanceBreakdown: Record<string, number> = {};
            const industryBreakdown: Record<string, number> = {};
            db.forEach(b => {
                tierBreakdown[b.tier ?? 'Unknown'] = (tierBreakdown[b.tier ?? 'Unknown'] || 0) + 1;
                governanceBreakdown[b.governance ?? 'Unknown'] = (governanceBreakdown[b.governance ?? 'Unknown'] || 0) + 1;
                // Top-level industry (first word)
                const ind = (b.industry || 'Unknown').split('/')[0].split(',')[0].trim();
                industryBreakdown[ind] = (industryBreakdown[ind] || 0) + 1;
            });
            return {
                status: 'success',
                total_companies: db.length,
                by_tier: tierBreakdown,
                by_governance: governanceBreakdown,
                top_industries: Object.fromEntries(
                    Object.entries(industryBreakdown)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                )
            };
        }

        return { status: 'error', message: 'Unknown action.' };
    },
});

// Define the SerpApi Search Tool (Web Search)
// Routes through the backend proxy to avoid browser CORS restrictions
export const serpApiTool = new FunctionTool({
    name: 'web_search_serpapi',
    description: 'Performs a Google search using SerpApi to find latest information about family businesses in Saudi Arabia.',
    parameters: z.object({
        query: z.string().describe("The search query to look up.")
    }),
    execute: async (args: { query: string }) => {
        console.log("ADK Tool Call: web_search_serpapi", args);
        try {
            // Call via backend proxy (server/index.js) to avoid CORS issues
            const response = await fetch(`/api/vertex/serpapi?q=${encodeURIComponent(args.query)}`);
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(`SerpApi proxy error ${response.status}: ${errData.error || response.statusText}`);
            }
            const data = await response.json();
            return data; // Already formatted as { status, results }
        } catch (error: any) {
            console.error("SerpApi Tool Error:", error);
            return { status: 'error', message: error.message };
        }
    }
});

import { VertexProxyLlm } from './vertex-proxy-llm';

export const geminiModel = new VertexProxyLlm({
    model: 'gemini-2.0-flash-001'
});

// Researcher Agent Definition
export const researcherAgent = new LlmAgent({
    name: 'researcher_agent',
    model: geminiModel,
    description: 'Specialized Family Business Intelligence Researcher.',
    instruction: `
    You are a specialized Family Business Intelligence Researcher focusing on the Middle East, especially Saudi Arabia.
    You have access to an internal database of family businesses and a Web Search tool.

    SCOPE RULE:
    Your domain is STRICTLY limited to "Family Businesses", "Family Offices", related corporate activity, and business figures (especially in the Middle East/Saudi Arabia).
    If a user asks a question completely unrelated to this domain (e.g., "who is the president of India?", "what is the capital of France?"), you MUST politely decline to answer and state that your expertise is limited to Family Businesses.

    TOOL SELECTION RULES — follow these strictly:

    1. Use 'query_business_data' for ANY analytical or aggregate question, including:
       - Counting: "How many companies are in Tier 2?", "How many have High governance?"
       - Listing all: "List all Tier 1 companies", "Show all companies in Construction"
       - Grouping/breakdown: "Give me a breakdown by tier", "How many companies per industry?"
       - Summaries: "Give me an overview of the database", "What is the distribution by governance?"
       - Differences: "Are there companies where the decision maker and contact person are different?" (Use filterDifferentContact=true)
       - Top N: "Which industry has the most companies?"
       → For count/list questions, use action='count' or action='list' with the appropriate filters.
       → For breakdown questions, use action='group_by' with groupByField='tier' / 'governance' / 'industry'.
       → For overall stats, use action='summary'.

    2. Use 'lookup_business_data' for questions about a SPECIFIC company, family, or industry name.
       - "Tell me about Al Muhaidib Group"
       - "What is the revenue of Zamil Group?"
       - "What companies are in the Jameel family?"

    3. Use 'web_search_serpapi' ONLY IF the question is related to Family Businesses, business figures, or corporate landscape AND the internal database does not have the answer.

    4. Synthesize results into a clear, professional response. Always present counts, lists and breakdowns in a readable format (tables or bullet points).

    5. DO NOT hallucinate answers. If you cannot find the answer in the database or via web search, state that you cannot find the requisite information.
  `,
    tools: [lookupBusinessDataTool, queryBusinessDataTool, serpApiTool],
});

// Analyst Agent Definition
export const analystAgent = new LlmAgent({
    name: 'analyst_agent',
    model: geminiModel,
    description: 'Expert Business Analyst Agent for strategic reports.',
    instruction: `
    You are an Expert Business Analyst Agent specializing in Middle Eastern enterprises.
    Your task is to ALWAYS generate a professional, strategic analysis report based on the "Business Data" provided in the prompt.
    
    Do NOT decline the analysis. If data is provided, synthesize it directly.
    
    STRICT REPORT FORMAT: You MUST generate a 3-part report with the following structure:
    
    ## Strategic Analysis Report
    
    ### 1. Executive Summary
    - Provide a high-level, strategic overview of the company's current standing, legacy, and significant recent movements based on the provided info.
    
    ### 2. SWOT Analysis
    - **Strengths**: Internal factors that give the company an advantage.
    - **Weaknesses**: Internal limitations or challenges.
    - **Opportunities**: External factors that could be leveraged for growth.
    - **Threats**: External challenges or risks to the business.
    
    ### 3. Market Outlook & Strategic Recommendations
    - Provide forward-looking strategic recommendations for the future of the company, focusing on governance, growth, and succession.
    
    ---
    Use professional markdown, bullet points, and headers. Do not include any conversational filler. Just the report.
  `,
});

// Root Agent for ADK CLI/Web tools
export const rootAgent = new LlmAgent({
    name: 'family_business_portal',
    description: 'Main entry point for Family Business Intelligence portal.',
    instruction: 'Route requests to the appropriate specialized agent or tool.',
    subAgents: [researcherAgent, analystAgent],
    tools: [lookupBusinessDataTool, queryBusinessDataTool, serpApiTool]
});
