import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrl, mediaId } = await req.json();

    if (!imageUrl || !mediaId) {
      return new Response(JSON.stringify({ error: "imageUrl and mediaId are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an image categorization assistant for a Brazilian marketing platform.
Analyze the image and return ONLY a valid JSON object with these fields:
- category: one of: pessoa, ambiente, ferramenta, ação, produto, outdoor, indoor, abstrato, equipe
- tags: array of 3-6 descriptive tags in Portuguese (e.g., ["mãos", "trabalho", "luz natural"])
- description: one sentence in Portuguese describing the image content (max 80 chars)

Respond ONLY with valid JSON, no markdown, no explanation.`;

    // Route through ai-router (classify -> DeepSeek fallback to Flash Lite for vision)
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-router`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({
        task_type: "classify",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: imageUrl } },
              { type: "text", text: "Categorize esta imagem conforme as instruções." },
            ],
          },
        ],
        function_name: "categorize-media",
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: "AI error" }));
      return new Response(JSON.stringify(errData), {
        status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const rawText = aiData.choices?.[0]?.message?.content ?? "";

    // Parse JSON from AI response
    let parsed: { category: string; tags: string[]; description: string };
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch {
      throw new Error("Failed to parse AI response as JSON");
    }

    // Update media_library record
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error: updateError } = await supabaseAdmin
      .from("media_library")
      .update({
        category: parsed.category,
        tags: parsed.tags,
        description: parsed.description,
      })
      .eq("id", mediaId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ category: parsed.category, tags: parsed.tags, description: parsed.description }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("categorize-media error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
