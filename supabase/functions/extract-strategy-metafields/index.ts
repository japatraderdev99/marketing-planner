import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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

    const { strategyData } = await req.json();

    const prompt = `Você é um estrategista de marketing sênior especializado em brand strategy e comunicação persuasiva.

Analise o playbook estratégico abaixo e extraia os META-FIELDS estruturados que devem nortear TODAS as campanhas, copies e comunicações da marca.

PLAYBOOK ESTRATÉGICO:
---
POSICIONAMENTO: ${strategyData.positioning || "(não preenchido)"}
DIFERENCIAIS COMPETITIVOS: ${strategyData.differentials || "(não preenchido)"}
PÚBLICO-ALVO: ${strategyData.targetAudience || "(não preenchido)"}
DORES E FRUSTRAÇÕES: ${strategyData.pains || "(não preenchido)"}
TOM DE VOZ: ${strategyData.toneOfVoice || "(não preenchido)"}
CONCORRENTES: ${strategyData.competitors || "(não preenchido)"}
TÓPICOS PROIBIDOS: ${strategyData.forbiddenTopics || "(não preenchido)"}
OBJETIVO ATUAL (30-90 dias): ${strategyData.currentObjective || "(não preenchido)"}
KPIs E METAS: ${strategyData.kpis || "(não preenchido)"}
---

Retorne um JSON com a seguinte estrutura exata:
{
  "brandEssence": "frase de 1 linha que captura a essência da marca",
  "uniqueValueProp": "proposta de valor única em 1-2 frases diretas",
  "targetPersona": {
    "profile": "perfil em 1 linha",
    "demographics": "idade, renda, localização, ocupação",
    "digitalBehavior": "como usa digital, quais plataformas",
    "biggestPain": "dor principal em 1 frase",
    "dream": "o que sonha conquistar"
  },
  "toneRules": {
    "use": ["regra 1", "regra 2", "regra 3"],
    "avoid": ["regra 1", "regra 2", "regra 3"]
  },
  "keyMessages": ["mensagem central 1", "mensagem central 2", "mensagem central 3"],
  "painPoints": ["dor 1", "dor 2", "dor 3", "dor 4"],
  "competitiveEdge": ["diferencial vs concorrente 1", "diferencial vs concorrente 2"],
  "forbiddenTopics": ["proibido 1", "proibido 2", "proibido 3"],
  "currentCampaignFocus": "foco atual em 1-2 frases com prazo e número",
  "contentAngles": ["ângulo de conteúdo 1", "ângulo de conteúdo 2", "ângulo de conteúdo 3", "ângulo de conteúdo 4"],
  "ctaStyle": "estilo de CTA recomendado baseado no objetivo",
  "kpiPriorities": ["kpi 1", "kpi 2", "kpi 3"],
  "promptContext": "parágrafo resumido de contexto para usar como system prompt em qualquer geração de IA para essa marca",
  "completenessScore": 0,
  "missingCritical": ["campo faltante 1", "campo faltante 2"]
}

Para completenessScore: calcule 0-100 baseado na qualidade e completude do playbook.
Para missingCritical: liste apenas campos críticos faltando ou muito vagos.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um estrategista de marketing sênior. Retorne apenas JSON puro, sem markdown." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
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
    const metafields = JSON.parse(content);

    return new Response(JSON.stringify({ metafields }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
