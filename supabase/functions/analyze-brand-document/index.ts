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

    // Auth: validate user JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization header ausente");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Usuário não autenticado");

    const { knowledgeId, documentUrl, documentName } = await req.json();
    if (!knowledgeId || !documentUrl) throw new Error("knowledgeId e documentUrl são obrigatórios");

    // Mark as analyzing
    await supabase
      .from("strategy_knowledge")
      .update({ status: "analyzing" })
      .eq("id", knowledgeId)
      .eq("user_id", user.id);

    // Fetch document as base64
    const fileRes = await fetch(documentUrl);
    if (!fileRes.ok) throw new Error(`Erro ao buscar documento: ${fileRes.status}`);

    const mimeType = fileRes.headers.get("content-type") || "application/pdf";
    const buffer = await fileRes.arrayBuffer();
    const uint8 = new Uint8Array(buffer);

    // Convert to base64
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < uint8.length; i += chunkSize) {
      binary += String.fromCharCode(...uint8.slice(i, i + chunkSize));
    }
    const base64 = btoa(binary);

    const systemPrompt = `Você é um estrategista de marca senior especializado em brand strategy.
Analise o documento (brand book, playbook ou guia de marca) e extraia os meta-fields estruturados abaixo.
Seja preciso, use dados concretos quando disponíveis. Retorne apenas JSON válido.`;

    const userPrompt = `Analise este documento e extraia TODOS os seguintes campos estratégicos da marca:

{
  "brandName": "nome da marca/empresa",
  "brandEssence": "essência da marca em 1 frase",
  "mission": "missão da empresa",
  "vision": "visão da empresa",
  "values": ["valor 1", "valor 2", "valor 3"],
  "uniqueValueProp": "proposta de valor única em 1-2 frases",
  "positioning": "posicionamento de mercado detalhado",
  "targetAudience": {
    "primaryPersona": "perfil da persona principal",
    "demographics": "dados demográficos (idade, renda, localização)",
    "psychographics": "comportamentos e motivações",
    "biggestPain": "maior dor/frustração",
    "dream": "o que deseja conquistar",
    "digitalBehavior": "comportamento digital"
  },
  "toneOfVoice": {
    "personality": "personalidade da marca",
    "use": ["como deve comunicar 1", "como deve comunicar 2"],
    "avoid": ["o que evitar 1", "o que evitar 2"]
  },
  "keyMessages": ["mensagem central 1", "mensagem central 2", "mensagem central 3"],
  "differentials": ["diferencial 1 com dado", "diferencial 2 com dado"],
  "competitors": ["concorrente 1", "concorrente 2"],
  "competitiveEdge": ["vantagem vs concorrente 1", "vantagem vs concorrente 2"],
  "forbiddenTopics": ["proibido 1", "proibido 2"],
  "visualIdentity": {
    "colors": "paleta de cores mencionada",
    "typography": "tipografia mencionada",
    "style": "estilo visual"
  },
  "contentAngles": ["ângulo de conteúdo 1", "ângulo de conteúdo 2", "ângulo de conteúdo 3"],
  "ctaStyle": "estilo de CTA recomendado",
  "promptContext": "parágrafo completo de contexto de marca para usar como system prompt em qualquer geração de IA",
  "documentSummary": "resumo executivo do documento em 3-4 frases",
  "keyInsights": ["insight estratégico 1", "insight estratégico 2", "insight estratégico 3"],
  "completenessScore": 0
}

Para completenessScore: calcule 0-100 baseado na riqueza e completude das informações encontradas.
Se um campo não for encontrado no documento, use null ou array vazio.`;

    const aiPayload: Record<string, unknown> = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
          ],
        },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    };

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(aiPayload),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      if (aiRes.status === 429) {
        await supabase.from("strategy_knowledge").update({ status: "error", error_message: "Rate limit da IA atingido. Tente novamente em instantes." }).eq("id", knowledgeId);
        return new Response(JSON.stringify({ error: "Rate limit atingido. Tente novamente." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiRes.status === 402) {
        await supabase.from("strategy_knowledge").update({ status: "error", error_message: "Créditos de IA esgotados." }).eq("id", knowledgeId);
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI gateway error ${aiRes.status}: ${errText}`);
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error("Resposta vazia da IA");

    let extractedKnowledge: Record<string, unknown>;
    try {
      extractedKnowledge = JSON.parse(content);
    } catch {
      throw new Error("IA retornou JSON inválido");
    }

    // Save to DB
    const { error: updateError } = await supabase
      .from("strategy_knowledge")
      .update({
        status: "done",
        extracted_knowledge: extractedKnowledge,
        error_message: null,
      })
      .eq("id", knowledgeId)
      .eq("user_id", user.id);

    if (updateError) throw new Error(`Erro ao salvar: ${updateError.message}`);

    return new Response(
      JSON.stringify({ success: true, knowledge: extractedKnowledge }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("analyze-brand-document error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
