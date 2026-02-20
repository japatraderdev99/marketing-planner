import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const { campaignForm, strategyMetafields, extraInstructions } = await req.json();

    // Load knowledge base if auth header present
    let knowledgeContext = "";
    try {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user } } = await userClient.auth.getUser();
        if (user) {
          const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
          const { data: docs } = await supabase
            .from("strategy_knowledge")
            .select("document_name, extracted_knowledge")
            .eq("user_id", user.id)
            .eq("status", "done")
            .limit(2);

          if (docs && docs.length > 0) {
            knowledgeContext = docs.map((d: { document_name: string; extracted_knowledge: Record<string, unknown> | null }) => {
              const k = d.extracted_knowledge as Record<string, unknown>;
              if (!k) return "";
              return [
                k.promptContext ? `Brand context: ${k.promptContext}` : "",
                k.positioning ? `Positioning: ${k.positioning}` : "",
                Array.isArray(k.keyMessages) ? `Key messages: ${(k.keyMessages as string[]).join(" | ")}` : "",
                Array.isArray(k.contentAngles) ? `Content angles: ${(k.contentAngles as string[]).join(", ")}` : "",
              ].filter(Boolean).join("\n");
            }).filter(Boolean).join("\n\n");
          }
        }
      }
    } catch (_) { /* optional */ }

    // Build meta-fields context
    const mf = strategyMetafields ?? {};
    const metaContext = [
      mf.brandEssence ? `ESSÊNCIA: ${mf.brandEssence}` : "",
      mf.uniqueValueProp ? `PROPOSTA DE VALOR: ${mf.uniqueValueProp}` : "",
      mf.promptContext ? `CONTEXTO DA MARCA: ${mf.promptContext}` : "",
      mf.currentCampaignFocus ? `FOCO ATUAL: ${mf.currentCampaignFocus}` : "",
      mf.targetPersona?.profile ? `PERSONA: ${mf.targetPersona.profile}` : "",
      mf.targetPersona?.biggestPain ? `DOR PRINCIPAL: ${mf.targetPersona.biggestPain}` : "",
      Array.isArray(mf.toneRules?.use) ? `TOM (pode): ${mf.toneRules.use.join(", ")}` : "",
      Array.isArray(mf.toneRules?.avoid) ? `TOM (evitar): ${mf.toneRules.avoid.join(", ")}` : "",
      Array.isArray(mf.keyMessages) ? `MENSAGENS: ${mf.keyMessages.join(" | ")}` : "",
      Array.isArray(mf.contentAngles) ? `ÂNGULOS: ${mf.contentAngles.join(", ")}` : "",
      Array.isArray(mf.forbiddenTopics) ? `PROIBIDO: ${mf.forbiddenTopics.join(", ")}` : "",
      Array.isArray(mf.kpiPriorities) ? `KPIs: ${mf.kpiPriorities.join(", ")}` : "",
    ].filter(Boolean).join("\n");

    const today = new Date();
    const startDate = campaignForm.startDate || today.toISOString().split("T")[0];

    const prompt = `Você é um estrategista de marketing sênior e CMO experiente. Crie um plano completo de campanha baseado nas informações abaixo.

${knowledgeContext ? `KNOWLEDGE BASE DA MARCA:\n${knowledgeContext}\n\n` : ""}${metaContext ? `META-FIELDS ESTRATÉGICOS:\n${metaContext}\n\n` : ""}BRIEFING DA CAMPANHA:
- Nome: ${campaignForm.name || "(a definir)"}
- Objetivo: ${campaignForm.objective || "(não informado)"}
- Canal principal: ${campaignForm.channel || "Instagram"}
- Formato: ${campaignForm.format || "Carrossel"}
- Público-alvo: ${campaignForm.targetAudience || mf.targetPersona?.profile || "(a definir)"}
- Orçamento: ${campaignForm.budget ? `R$ ${campaignForm.budget}` : "(não informado)"}
- Início: ${startDate}
- Duração estimada: ${campaignForm.duration || "30 dias"}
- Funil: ${campaignForm.funnel || "Topo"}
- Prioridade: ${campaignForm.priority || "Alta"}
${extraInstructions ? `\nINSTRUÇÕES ADICIONAIS DO CMO:\n${extraInstructions}` : ""}

Gere um plano COMPLETO e ACIONÁVEL. Retorne APENAS este JSON:
{
  "campaignSummary": "resumo executivo da campanha em 2-3 frases",
  "angle": "ângulo emocional principal (Orgulho|Dinheiro|Urgência|Raiva|Alívio)",
  "hooks": ["hook 1 pronto para usar", "hook 2", "hook 3"],
  "keyMessage": "mensagem central da campanha em 1 frase",
  "ctaMain": "CTA principal",
  "viralLogic": "por que esse conteúdo vai ser salvo/compartilhado",
  "kanbanTasks": [
    {
      "title": "nome da tarefa",
      "description": "descrição clara do que fazer",
      "format": "Post|Reels|Stories|Carrossel|Ads|Shorts",
      "channel": "Instagram|TikTok|Meta Ads|LinkedIn|YouTube|Orgânico",
      "priority": "Alta|Média|Baixa",
      "status": "ideia",
      "daysFromStart": 0
    }
  ],
  "calendarEntries": [
    {
      "title": "título do conteúdo",
      "format": "Post|Reels|Stories|Carrossel|Ads|Shorts",
      "channel": "Instagram|TikTok|Meta Ads|LinkedIn|YouTube|Orgânico",
      "daysFromStart": 0,
      "copy": "copy pronta para usar neste conteúdo",
      "responsible": "Time Marketing"
    }
  ],
  "estimatedResults": {
    "reach": "alcance estimado",
    "engagement": "engajamento estimado",
    "conversions": "conversões estimadas"
  },
  "warnings": ["alerta estratégico 1 se houver", "alerta 2"]
}

REGRAS:
- Gere entre 5 e 8 kanbanTasks cobrindo briefing, criação, revisão, publicação e análise
- Gere entre 6 e 12 calendarEntries distribuídos ao longo da duração da campanha
- daysFromStart deve ser um número inteiro (dias após o início da campanha)
- Todas as copies devem refletir o tom de voz da marca
- NUNCA mencione cidades, estados ou regiões específicas
- Se a duração for 30 dias, distribua bem os conteúdos
- warnings: apenas se houver lacunas críticas no briefing`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um CMO e estrategista de marketing sênior. Retorne apenas JSON puro e válido, sem markdown." },
          { role: "user", content: prompt },
        ],
        temperature: 0.6,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit atingido. Tente novamente." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${await response.text()}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0].message.content;
    const plan = JSON.parse(content);

    return new Response(JSON.stringify({ plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("generate-campaign-plan error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
