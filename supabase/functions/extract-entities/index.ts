import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();
    
    if (!content || typeof content !== "string") {
      return new Response(
        JSON.stringify({ error: "Content is required and must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert at analyzing organizational documents, meeting notes, and transcripts. 
Your job is to extract structured information about decisions, people, projects, and stakeholders.
Be thorough but only extract information that is explicitly stated or strongly implied in the text.
If you cannot find certain types of information, return empty arrays for those fields.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze the following text and extract organizational information:\n\n${content}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_entities",
              description: "Extract decisions, people, projects, and stakeholders from organizational text",
              parameters: {
                type: "object",
                properties: {
                  decisions: {
                    type: "array",
                    description: "Key decisions or agreements found in the text",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "A concise title for the decision (under 100 chars)" },
                        description: { type: "string", description: "A detailed description of the decision" },
                        rationale: { type: "string", description: "Why this decision was made, if mentioned" },
                      },
                      required: ["title", "description"],
                    },
                  },
                  people: {
                    type: "array",
                    description: "People mentioned in the text",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Person's full name" },
                        role: { type: "string", description: "Their role or title if mentioned, or 'Unknown' if not specified" },
                      },
                      required: ["name", "role"],
                    },
                  },
                  projects: {
                    type: "array",
                    description: "Projects or initiatives mentioned",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Project name" },
                        description: { type: "string", description: "Brief description of the project" },
                      },
                      required: ["name", "description"],
                    },
                  },
                  suggested_stakeholders: {
                    type: "array",
                    description: "Teams or groups that should be informed about these decisions",
                    items: { type: "string" },
                  },
                  summary: {
                    type: "string",
                    description: "A 1-2 sentence summary of the main topics covered in the text",
                  },
                },
                required: ["decisions", "people", "projects", "suggested_stakeholders", "summary"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_entities" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "extract_entities") {
      throw new Error("Unexpected response format from AI");
    }

    const extractedData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(extractedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Extract entities error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
