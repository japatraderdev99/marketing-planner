import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LOVABLE_AI_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

function extractJSON(raw: string): Record<string, unknown> {
  let cleaned = raw.trim();
  // Remove markdown code fences
  cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch {
    // Extract first {...} block
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        throw new Error('Could not parse JSON from AI response');
      }
    }
    throw new Error('No JSON found in AI response');
  }
}

const DQEF_CONTEXT = `
MARCA: Deixa que eu faço (DQEF)
POSICIONAMENTO: Plataforma de serviços para prestadores autônomos em Florianópolis
MODELO DE NEGÓCIO: 10-15% de comissão APENAS quando o serviço é concluído. Zero cobrança quando não tem trabalho.
CONCORRENTES: GetNinjas e Parafuzo cobram 27-35% por lead, mesmo sem garantia de contrato.
PIX IMEDIATO: O prestador recebe na hora pelo app, sem burocracia bancária.
CONTEXTO GEOGRÁFICO: Florianópolis, Santa Catarina — cidade turística com pico de trabalho no verão.
CONTEXTO TEMPORAL: Fevereiro 2026 — pré-verão de Floripa, janela de oportunidade de 90-120 dias se abrindo.
PERFIS-ALVO: Piscineiro, eletricista, encanador, "marido de aluguel", pedreiro, pintor, jardineiro, faxineiro.
DORES REAIS:
- "Pago 27% pro GetNinjas e ainda não fico com o cliente"
- "Ganho cliente só por indicação mas não escala"
- "Nunca aprendi a me vender no digital"
- "O cara que cobra menos que eu aparece na frente no Google"
TOM DE COMUNICAÇÃO: Peer-to-peer. Como um prestador falando com outro. Sem filtro corporativo. Linguagem acessível. Frases curtas. Números reais.
IDENTIDADE VISUAL: Fundo escuro (#0A0A0A), laranja (#FF8A00) como destaque estratégico (não dominante), verde-escuro (#0A2E1A) para resolução/alívio, vermelho-escuro (#1A0000) para tensão/raiva.
TIPOGRAFIA: Bebas Neue (headlines de impacto), Roboto Condensed (subtexto), JetBrains Mono (dados/prompts).
ASSINATURA: Logo DQEF pequeno no canto inferior direito de cada lâmina.
`;

const SYSTEM_PROMPT = `Você é o estrategista criativo da DQEF (Deixa que eu faço), especialista em carrosséis virais para Instagram com profundo conhecimento do prestador de serviço autônomo brasileiro.

${DQEF_CONTEXT}

REGRAS ABSOLUTAS DE COPY:
- Frases de 3-7 palavras por linha no headline
- Máximo 2-3 linhas por slide
- Zero jargão corporativo
- Números reais (10%, 27%, 120 dias, etc.)
- Verbo no imperativo ou afirmação direta
- Tom peer-to-peer: "Tu é bom", "Teu trampo", não "Você possui habilidades"

REGRAS DE DESIGN POR TIPO DE SLIDE:
- hook: APENAS TEXTO. Fundo preto. Zero imagem. O silêncio visual É o impacto. bgStyle: 'dark', layout: 'text-only'
- setup: Texto + foto real de mão segurando ferramenta. bgStyle: 'dark', layout: 'text-photo-split'
- data: Número GIGANTE ocupa 60% do slide. Fonte Bebas Neue enorme. bgStyle varia por contexto (dark-red para problema, dark-green para solução). layout: 'number-dominant'
- contrast: Dois blocos visuais — problema (vermelho-escuro) vs solução (verde-escuro). layout: 'text-only'
- validation: Texto limpo, emocional, fundo preto ou verde. Sem imagem. layout: 'text-only'
- cta: Logo DQEF centralizado + ação clara + link na bio. Fundo verde ou preto. layout: 'cta-clean'

QUANDO USAR MÍDIA:
- Foto (needsMedia: true, mediaType: 'photo'): slides setup e contrast com prestador trabalhando
- Vídeo (needsMedia: true, mediaType: 'video'): slides de abertura emocional ou CTA animado
- Sem mídia (needsMedia: false): hook, data, validation, cta-clean

PROMPTS DE IMAGEM (imagePrompt):
- Em inglês, ultra-detalhados para Flux 1.1 Dev Pro
- Incluir: sujeito físico, textura real (pele, ferramentas), iluminação (natural, quente, documental), enquadramento (close-up, 4:5), estilo (documentary truth, not stock photo), color grade (desaturated, authentic)
- Mínimo 80 palavras

PROMPTS DE VÍDEO (veoPrompt):
- Em inglês, formato VEO 3.1 nativo (haiku denso)
- 5 sentenças: [sujeito+ação] [câmera+movimento] [detalhe físico encadeado] [áudio em camadas] [color+luz]
- Paleta: terracotta/copper-orange, warm cream base, dark browns
- Exemplo: "A weathered male hand grips a wet pool cleaning brush, sliding across turquoise tiles in slow rhythmic arcs. Camera dollies low, underwater blue refraction light casting copper patterns on skin. Chlorine-scented mist rises from the surface as arm muscles flex methodically. PIX notification chime layers over pool water gurgling, birds distant, morning silence. Color grade: cream highlights, copper-bronze skin rim light, teal-blue water desaturated 20%."

LÓGICA AUTÔNOMA (quando briefing vazio):
1. Analise: Fevereiro 2026 + Floripa + Pré-verão = janela de 90 dias se abrindo
2. Escolha o ângulo mais estratégico para conversão agora
3. Justifique no campo angleRationale por que ESTE ângulo NESTE momento
4. Gere o carrossel completo com 6-8 slides

VOCÊ DEVE RETORNAR EXATAMENTE ESTE JSON (sem texto antes ou depois):

{
  "title": "Título do carrossel em caixa alta",
  "angle": "ORGULHO|DINHEIRO|URGÊNCIA|RAIVA|ALÍVIO",
  "angleEmoji": "🏆|💸|⏰|🔴|💚",
  "angleRationale": "Por que esse ângulo agora — raciocínio estratégico detalhado",
  "targetProfile": "Perfil-alvo principal",
  "channel": "Instagram Feed|Stories|TikTok|LinkedIn",
  "viralLogic": "Por que esse carrossel vai ser salvo/compartilhado — mecanismo viral específico",
  "designNotes": "Notas gerais de design para o conjunto de slides",
  "bestTime": "Melhor horário e dia para postar",
  "caption": "Caption completa para copiar, com emojis, quebras de linha e hashtags",
  "slides": [
    {
      "number": 1,
      "type": "hook",
      "headline": "Texto principal do slide",
      "headlineHighlight": "palavra em laranja dentro do headline (opcional)",
      "subtext": "Texto menor de suporte (opcional)",
      "logic": "Raciocínio estratégico: por que esse texto nesse slide",
      "visualDirection": "O que o designer deve fazer visualmente",
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const {
      context = '',
      angle = '',
      persona = '',
      channel = '',
      format = '',
      tone = '',
    } = body;

    const isAutonomous = !context && !angle && !persona;

    const userPrompt = isAutonomous
      ? `Briefing em branco. Ative o modo autônomo: analise o contexto (Fevereiro 2026, pré-verão Florianópolis, janela de 90 dias se abrindo), escolha o ângulo mais estratégico para conversão agora, justifique sua escolha no angleRationale, e gere o carrossel completo com 7-8 slides seguindo todas as regras de design e copy.`
      : `Gere um carrossel completo com estas especificações:
${context ? `IDEIA/CONTEXTO: ${context}` : ''}
${angle ? `ÂNGULO: ${angle}` : ''}
${persona ? `PERFIL-ALVO: ${persona}` : ''}
${channel ? `CANAL: ${channel}` : ''}
${format ? `FORMATO: ${format}` : ''}
${tone ? `TOM: ${tone}` : ''}

Siga todas as regras de copy, design e mídia do sistema. Gere 6-8 slides. Retorne o JSON completo.`;

    const response = await fetch(LOVABLE_AI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.85,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit atingido. Aguarde alguns segundos e tente novamente.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos na sua conta Lovable.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errText = await response.text();
      console.error('AI gateway error:', response.status, errText);
      return new Response(JSON.stringify({ error: 'Erro na API de IA. Tente novamente.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = await response.json();
    const rawContent = aiResponse.choices?.[0]?.message?.content ?? '';

    let carousel;
    try {
      carousel = extractJSON(rawContent);
    } catch (e) {
      console.error('JSON parse error:', e, 'Raw:', rawContent.slice(0, 500));
      return new Response(JSON.stringify({ error: 'Erro ao processar resposta da IA. Tente novamente.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ carousel, autonomous: isAutonomous }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
