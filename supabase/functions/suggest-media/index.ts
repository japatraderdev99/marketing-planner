import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SLIDE_TYPE_CATEGORIES: Record<string, string[]> = {
  hook: ["pessoa", "ação"],
  setup: ["ambiente", "indoor", "outdoor"],
  data: ["abstrato", "produto"],
  contrast: ["pessoa", "ação"],
  validation: ["equipe", "pessoa"],
  cta: [],
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

    // Fetch user's media from DB
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

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

    // Build prompt for AI ranking (text-only)
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

    // Route through ai-router (suggest -> DeepSeek, text-only)
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const aiResponse = await fetch(`${SUPABASE_URL}/functions/v1/ai-router`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({
        task_type: "suggest",
        messages: [{ role: "user", content: prompt }],
        user_id: userId,
        function_name: "suggest-media",
      }),
    });

    if (!aiResponse.ok) {
      const errData = await aiResponse.json().catch(() => ({ error: "AI error" }));
      return new Response(JSON.stringify(errData), {
        status: aiResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const rawText = aiData.choices?.[0]?.message?.content ?? "";

    let rankings: Array<{ id: string; score: number; reason: string }> = [];
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
      rankings = parsed.rankings ?? [];
    } catch {
      rankings = items.slice(0, 4).map((img, i) => ({ id: img.id, score: 8 - i, reason: "Sugestão automática" }));
    }

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
