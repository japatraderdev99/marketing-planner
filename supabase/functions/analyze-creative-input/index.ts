import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { input_text, input_type = "mixed", user_id } = await req.json();

    if (!input_text || !user_id) {
      return new Response(
        JSON.stringify({ error: "input_text and user_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const systemPrompt = `Você é um diretor criativo sênior de marketing digital. O usuário vai enviar materiais de referência (ideias, textos, prompts, copies, conceitos visuais, referências de vídeo).

Sua tarefa é analisar o input e gerar de 3 a 6 sugestões criativas CONCRETAS e ACIONÁVEIS. Cada sugestão deve ser de um tipo diferente quando possível.

TIPOS de sugestão permitidos:
- "carousel" — Carrossel para Instagram/LinkedIn
- "post" — Post estático (imagem única)
- "video" — Vídeo curto (Reels/TikTok/Shorts)
- "copy" — Copy para legenda ou anúncio
- "reels" — Reels específico com roteiro

Para CADA sugestão, retorne:
- suggestion_type: um dos tipos acima
- title: título curto e impactante (max 60 chars)
- description: descrição do conceito criativo (2-3 frases)
- copy_text: copy pronta para uso (se aplicável), ou null
- visual_direction: direção visual/estética (1-2 frases)
- channel: canal principal (Instagram, TikTok, LinkedIn, YouTube)
- format: formato específico (ex: "Carrossel 5 lâminas", "Reels 30s", "Post 1:1")
- ai_reasoning: por que esta ideia tem potencial (1 frase)

Responda APENAS com um JSON válido no formato:
{ "suggestions": [ { ... }, { ... } ] }

Não inclua markdown, apenas JSON puro.`;

    // Call ai-router
    const aiResponse = await fetch(`${SUPABASE_URL}/functions/v1/ai-router`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        task_type: "copy",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `TIPO DE INPUT: ${input_type}\n\nMATERIAL:\n${input_text}` },
        ],
        user_id,
        function_name: "analyze-creative-input",
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI router error:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: `AI error: ${aiResponse.status}` }),
        { status: aiResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let suggestions;
    try {
      const cleaned = content.replace(/```json?\s*/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      suggestions = parsed.suggestions || parsed;
    } catch (parseErr) {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI suggestions", raw: content }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save suggestions to database
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const rows = suggestions.map((s: any) => ({
      user_id,
      input_text,
      input_type,
      suggestion_type: s.suggestion_type || "post",
      title: s.title || "Sem título",
      description: s.description || null,
      copy_text: s.copy_text || null,
      visual_direction: s.visual_direction || null,
      channel: s.channel || null,
      format: s.format || null,
      ai_reasoning: s.ai_reasoning || null,
      status: "pending",
    }));

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("creative_suggestions")
      .insert(rows)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save suggestions", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ suggestions: inserted, _meta: aiData._meta }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-creative-input error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
