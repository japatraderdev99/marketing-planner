import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map slide type to preferred categories for pre-filtering
const SLIDE_TYPE_CATEGORIES: Record<string, string[]> = {
  hook: ["pessoa", "ação"],
  setup: ["ambiente", "indoor", "outdoor"],
  data: ["abstrato", "produto"],
  contrast: ["pessoa", "ação"],
  validation: ["equipe", "pessoa"],
  cta: [], // no filter — show all
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { slideHeadline, slideSubtext, slideImagePrompt, slideType, userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch user's media from DB
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Build query — optionally pre-filter by category
    const preferredCategories = SLIDE_TYPE_CATEGORIES[slideType ?? ""] ?? [];
    let query = supabaseAdmin
      .from("media_library")
      .select("id, url, filename, category, tags, description")
      .eq("user_id", userId)
      .not("category", "is", null);

    if (preferredCategories.length > 0) {
      query = query.in("category", preferredCategories);
    }

    query = query.limit(20);

    const { data: mediaItems, error: dbError } = await query;
    if (dbError) throw dbError;

    // If filtered result is too small, fall back to all user media (up to 20)
    let items = mediaItems ?? [];
    if (items.length < 2 && preferredCategories.length > 0) {
      const { data: allItems } = await supabaseAdmin
        .from("media_library")
        .select("id, url, filename, category, tags, description")
        .eq("user_id", userId)
        .not("category", "is", null)
        .limit(20);
      items = allItems ?? [];
    }

    if (items.length === 0) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build prompt for AI ranking (text-only, fast + cheap)
    const slideContext = [
      slideHeadline && `HEADLINE: "${slideHeadline}"`,
      slideSubtext && `SUBTEXTO: "${slideSubtext}"`,
      slideImagePrompt && `DIREÇÃO VISUAL: "${slideImagePrompt}"`,
    ].filter(Boolean).join("\n");

    const candidatesText = items.map((img, i) =>
      `${i + 1}. ID: ${img.id} | Categoria: ${img.category} | Tags: ${(img.tags ?? []).join(", ")} | Descrição: ${img.description ?? "sem descrição"}`
    ).join("\n");

    const prompt = `Você é um diretor de arte que seleciona imagens de arquivo para lâminas de carrossel.

LÂMINA:
${slideContext}

IMAGENS DISPONÍVEIS:
${candidatesText}

Ranqueie as imagens de 1 a 10 por relevância visual e semântica com a lâmina.
Retorne APENAS um JSON válido com este formato:
{"rankings": [{"id": "<uuid>", "score": <1-10>, "reason": "<uma frase em pt-BR>"}]}

Inclua apenas as top 4 imagens com maior score. Sem explicações adicionais.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit atingido." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawText = aiData.choices?.[0]?.message?.content ?? "";

    let rankings: Array<{ id: string; score: number; reason: string }> = [];
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
      rankings = parsed.rankings ?? [];
    } catch {
      // If parsing fails, return top 4 by insertion order
      rankings = items.slice(0, 4).map((img, i) => ({ id: img.id, score: 8 - i, reason: "Sugestão automática" }));
    }

    // Sort by score descending and attach full item data
    const sorted = rankings
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(r => {
        const item = items.find(img => img.id === r.id);
        return item ? { ...item, score: r.score, reason: r.reason } : null;
      })
      .filter(Boolean);

    return new Response(JSON.stringify({ suggestions: sorted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-media error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
