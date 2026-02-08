import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { query, context } = await req.json();

    if (!query) {
      throw new Error("Query is required");
    }

    // Build a context-aware prompt
    const systemPrompt = `You are AlignOS, an AI assistant that helps users understand their organizational data.
You have access to the following context about the organization:

${context ? `ORGANIZATIONAL CONTEXT:
- Decisions: ${context.decisionsCount || 0} total
- People: ${context.peopleCount || 0} total
- Projects: ${context.projectsCount || 0} total
- Recent decisions: ${context.recentDecisions?.map((d: any) => d.title).join(", ") || "None"}
- Recent people: ${context.recentPeople?.map((p: any) => p.name).join(", ") || "None"}
- Recent projects: ${context.recentProjects?.map((p: any) => p.name).join(", ") || "None"}` : "No organizational data available yet."}

Answer the user's question helpfully and concisely. If the question is about specific data that isn't in the context, suggest they use the Ingest feature to add more information.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const result = await response.json();
    const answer = result.choices?.[0]?.message?.content || "I couldn't generate a response.";

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Query AI error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
