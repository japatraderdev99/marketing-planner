import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LOVABLE_AI_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

function extractJSON(raw: string): Record<string, unknown> {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { throw new Error('Could not parse JSON from AI response'); }
    }
    throw new Error('No JSON found in AI response');
  }
}

// Fetch strategy context from knowledge base + meta-fields
async function getStrategyContext(req: Request, strategyContext?: string): Promise<string> {
  const base = strategyContext ? `\nCONTEXTO ESTRATÉGICO DA MARCA (extraído do playbook):\n${strategyContext}\n` : '';

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return base;

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return base;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: knowledgeDocs } = await supabase
      .from("strategy_knowledge")
      .select("document_name, extracted_knowledge")
      .eq("user_id", user.id)
      .eq("status", "done")
      .limit(3);

    if (!knowledgeDocs || knowledgeDocs.length === 0) return base;

    const knowledgeContext = knowledgeDocs.map((doc: { document_name: string; extracted_knowledge: Record<string, unknown> | null }) => {
      const k = doc.extracted_knowledge as Record<string, unknown>;
      if (!k) return "";
      const parts: string[] = [];
      if (k.brandName) parts.push(`MARCA: ${k.brandName}`);
      if (k.brandEssence) parts.push(`ESSÊNCIA: ${k.brandEssence}`);
      if (k.positioning) parts.push(`POSICIONAMENTO: ${k.positioning}`);
      if (k.uniqueValueProp) parts.push(`PROPOSTA DE VALOR: ${k.uniqueValueProp}`);
      if (k.toneOfVoice) parts.push(`TOM DE VOZ: ${JSON.stringify(k.toneOfVoice)}`);
      if (Array.isArray(k.keyMessages) && k.keyMessages.length) parts.push(`MENSAGENS-CHAVE: ${k.keyMessages.join(" | ")}`);
      if (Array.isArray(k.forbiddenTopics) && k.forbiddenTopics.length) parts.push(`PROIBIDO: ${k.forbiddenTopics.join(", ")}`);
      if (k.ctaStyle) parts.push(`ESTILO DE CTA: ${k.ctaStyle}`);
      if (k.promptContext) parts.push(`SYSTEM PROMPT DA MARCA: ${k.promptContext}`);
      return parts.join("\n");
    }).filter(Boolean).join("\n\n");

    if (!knowledgeContext) return base;
    return `\nKNOWLEDGE BASE DA MARCA (dos documentos analisados — prioridade máxima):\n---\n${knowledgeContext}\n---\n${base}`;
  } catch {
    return base;
  }
}

const VISUAL_RULES = `
IDENTIDADE VISUAL (OBRIGATÓRIA):
- Fundo: #E8603C (laranja coral) em TODAS as lâminas — sem exceção. bgStyle sempre 'dark'.
- Texto: BRANCO puro #FFFFFF
- Destaque (headlineHighlight): palavra que terá fundo semi-transparente branco, criando contraste visual
- Fonte: Montserrat 900 — caixa alta, peso máximo
- Watermark "DQEF" discreto no canto inferior direito de cada lâmina
- LIMITE ABSOLUTO: Máximo 5 lâminas por carrossel. Nunca gere mais que isso.

REGRAS ABSOLUTAS DE COPY:
- Frases de 3-7 palavras por linha no headline
- Máximo 2-3 linhas por slide
- SEMPRE em CAIXA ALTA (uppercase) — combina com Montserrat 900
- Zero jargão corporativo
- Números reais (%, R$, dias) quando disponíveis no contexto da marca
- Verbo no imperativo ou afirmação direta
- Tom peer-to-peer de acordo com o tom de voz da marca
- PROIBIDO mencionar cidades, estados ou regiões geográficas nos textos dos slides

SLOGAN OBRIGATÓRIO NO CTA:
- O último slide (type: 'cta') DEVE ter no subtext o slogan "pronto. resolvido." ao final.

REGRAS DE DESIGN POR TIPO DE SLIDE:
- hook: APENAS TEXTO em caixa alta. Headline de impacto máximo. layout: 'text-only'
- setup: Texto + indicação de foto real. layout: 'text-photo-split'
- data: Número GIGANTE ocupa 60% do slide. layout: 'number-dominant'
- contrast: Headline contrastante, subtext explicativo. layout: 'text-only'
- validation: Texto emocional, direto. layout: 'text-only'
- cta: Ação clara + link na bio. layout: 'cta-clean'

PROMPTS DE IMAGEM (imagePrompt):
- Em inglês, ultra-detalhados para geração de imagem
- Incluir: sujeito físico, textura real, iluminação, enquadramento close-up 4:5
- Estilo: documentary truth, not stock photo, desaturated, authentic
- Mínimo 80 palavras

LÓGICA AUTÔNOMA (quando briefing vazio):
1. Analise o contexto e estratégia da marca disponíveis
2. Escolha o ângulo mais estratégico para conversão agora
3. Justifique no campo angleRationale
4. Gere o carrossel com EXATAMENTE 5 slides

LIMITE CRÍTICO: Gere SEMPRE exatamente 5 slides. Nunca mais que 5.

RETORNE EXATAMENTE ESTE JSON (sem texto antes ou depois):
{
  "title": "TÍTULO EM CAIXA ALTA",
  "angle": "ORGULHO|DINHEIRO|URGÊNCIA|RAIVA|ALÍVIO",
  "angleEmoji": "🏆|💸|⏰|🔴|💚",
  "angleRationale": "Por que esse ângulo agora — raciocínio estratégico detalhado",
  "targetProfile": "Perfil-alvo principal",
  "channel": "Instagram Feed|Stories|TikTok|LinkedIn",
  "viralLogic": "Por que esse carrossel vai ser salvo/compartilhado",
  "designNotes": "Notas de design para o conjunto",
  "bestTime": "Melhor horário e dia para postar",
  "caption": "Caption completa com emojis, quebras de linha e hashtags",
  "slides": [
    {
      "number": 1,
      "type": "hook",
      "headline": "TEXTO EM CAIXA ALTA",
      "headlineHighlight": "PALAVRA para destaque visual (opcional)",
      "subtext": "Texto menor de suporte (opcional, sem caixa alta)",
      "logic": "Raciocínio estratégico do slide",
      "visualDirection": "O que o designer deve fazer",
      "needsMedia": false,
      "mediaType": null,
      "mediaDescription": null,
      "imagePrompt": null,
      "veoPrompt": null,
      "bgStyle": "dark",
      "layout": "text-only"
    }
  ]
}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { context = '', angle = '', persona = '', channel = '', tone = '', strategyContext = '' } = body;

    // Get dynamic brand strategy context (knowledge base + meta-fields from frontend)
    const brandContext = await getStrategyContext(req, strategyContext);

    const systemPrompt = `Você é o estrategista criativo especialista em carrosséis virais para Instagram com profundo conhecimento do prestador de serviço autônomo brasileiro.
${brandContext}
${VISUAL_RULES}`;

    const isAutonomous = !context && !angle && !persona;

    const userPrompt = isAutonomous
      ? `Briefing em branco. Ative o modo autônomo: analise o contexto e a estratégia da marca disponíveis, escolha o ângulo mais estratégico para conversão agora, justifique no angleRationale, e gere o carrossel com EXATAMENTE 5 slides seguindo todas as regras. Todos os slides com bgStyle: 'dark'.`
      : `Gere um carrossel com EXATAMENTE 5 slides e estas especificações:
${context ? `IDEIA/CONTEXTO: ${context}` : ''}
${angle ? `ÂNGULO: ${angle}` : ''}
${persona ? `PERFIL-ALVO: ${persona}` : ''}
${channel ? `CANAL: ${channel}` : ''}
${tone ? `TOM: ${tone}` : ''}

Siga todas as regras de copy, design e mídia. EXATAMENTE 5 slides. bgStyle sempre 'dark'. As copies devem estar 100% alinhadas com a estratégia e tom de voz da marca. Retorne o JSON completo.`;

    const response = await fetch(LOVABLE_AI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.85,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: 'Rate limit atingido. Aguarde alguns segundos e tente novamente.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 402) return new Response(JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos na sua conta Lovable.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const errText = await response.text();
      console.error('AI gateway error:', response.status, errText);
      return new Response(JSON.stringify({ error: 'Erro na API de IA. Tente novamente.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const aiResponse = await response.json();
    const rawContent = aiResponse.choices?.[0]?.message?.content ?? '';

    let carousel;
    try {
      carousel = extractJSON(rawContent);
    } catch (e) {
      console.error('JSON parse error:', e, 'Raw:', rawContent.slice(0, 500));
      return new Response(JSON.stringify({ error: 'Erro ao processar resposta da IA. Tente novamente.' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ carousel, autonomous: isAutonomous, usedStrategyContext: !!brandContext }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
