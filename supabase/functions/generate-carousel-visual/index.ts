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
POSICIONAMENTO: Plataforma de serviços para prestadores autônomos em todo o Brasil.
MODELO DE NEGÓCIO: 10-15% de comissão APENAS quando o serviço é concluído. Zero cobrança quando não tem trabalho.
CONCORRENTES: GetNinjas e Parafuzo cobram 27-35% por lead, mesmo sem garantia de contrato.
PIX IMEDIATO: O prestador recebe na hora pelo app, sem burocracia bancária.
CONTEXTO TEMPORAL: Fevereiro 2026 — início de um novo ciclo, janela de oportunidade de 90-120 dias se abrindo.
PERFIS-ALVO: Piscineiro, eletricista, encanador, "marido de aluguel", pedreiro, pintor, jardineiro, faxineiro.
DORES REAIS:
- "Pago 27% pro GetNinjas e ainda não fico com o cliente"
- "Ganho cliente só por indicação mas não escala"
- "Nunca aprendi a me vender no digital"
- "O cara que cobra menos que eu aparece na frente no Google"
TOM DE COMUNICAÇÃO: Peer-to-peer. Como um prestador falando com outro. Sem filtro corporativo. Linguagem acessível. Frases curtas. Números reais.
IDENTIDADE VISUAL: Fundo laranja coral (#E8603C) em TODAS as lâminas — funciona como caixa de texto recortável. Texto sempre branco (#FFFFFF). Peso de fonte alto (Montserrat 900).
TIPOGRAFIA: Montserrat 900 (headlines em caixa alta, impacto), Montserrat 600 (subtexto), JetBrains Mono (dados/prompts técnicos).
ASSINATURA: Watermark "DQEF" discreto no canto inferior direito de cada lâmina.
SLOGAN OBRIGATÓRIO: O último slide (CTA) DEVE sempre terminar com o slogan da marca "pronto. resolvido." — "pronto." em estilo apagado/discreto e "resolvido." em destaque laranja/branco.
LIMITE ABSOLUTO: Máximo 5 lâminas por carrossel. Não gere mais que isso.
PROIBIDO: Nunca mencione cidades, estados ou regiões específicas nos textos dos slides.
`;

const SYSTEM_PROMPT = `Você é o estrategista criativo da DQEF (Deixa que eu faço), especialista em carrosséis virais para Instagram com profundo conhecimento do prestador de serviço autônomo brasileiro.

${DQEF_CONTEXT}

REGRAS ABSOLUTAS DE COPY:
- Frases de 3-7 palavras por linha no headline
- Máximo 2-3 linhas por slide
- SEMPRE em CAIXA ALTA (uppercase) — combina com Montserrat 900
- Zero jargão corporativo
- Números reais (10%, 27%, 120 dias, etc.)
- Verbo no imperativo ou afirmação direta
- Tom peer-to-peer: "Tu é bom", "Teu trampo", não "Você possui habilidades"
- PROIBIDO mencionar cidades, estados ou regiões geográficas nos textos dos slides

IDENTIDADE VISUAL (OBRIGATÓRIA):
- Fundo: #E8603C (laranja coral) em TODAS as lâminas — sem exceção. bgStyle sempre 'dark' (o sistema renderiza tudo em laranja).
- Texto: BRANCO puro #FFFFFF
- Destaque (headlineHighlight): palavra que terá fundo semi-transparente branco, criando contraste visual
- Fonte: Montserrat 900 — caixa alta, peso máximo
- A lâmina funciona como caixa de texto recortável sobre qualquer fundo

REGRAS DE DESIGN POR TIPO DE SLIDE:
- hook: APENAS TEXTO em caixa alta. Headline de impacto máximo. layout: 'text-only'
- setup: Texto + indicação de foto real. layout: 'text-photo-split'  
- data: Número GIGANTE (ex: "27%") em Montserrat 900 ocupa 60% do slide. layout: 'number-dominant'
- contrast: Headline contrastante, subtext explicativo. layout: 'text-only'
- validation: Texto emocional, direto. layout: 'text-only'
- cta: Ação clara + link na bio. layout: 'cta-clean'. O subtext do CTA DEVE terminar com o slogan da marca.

SLOGAN OBRIGATÓRIO NO CTA:
- O último slide (type: 'cta') DEVE ter no subtext o slogan "pronto. resolvido." ao final.
- Exemplo de subtext: "Entre agora. pronto. resolvido."

QUANDO USAR MÍDIA:
- Foto (needsMedia: true, mediaType: 'photo'): slides setup e contrast
- Vídeo (needsMedia: true, mediaType: 'video'): slides de abertura emocional
- Sem mídia (needsMedia: false): hook, data, validation, cta

PROMPTS DE IMAGEM (imagePrompt):
- Em inglês, ultra-detalhados para Flux 1.1 Dev Pro
- Incluir: sujeito físico, textura real (pele, ferramentas), iluminação, enquadramento close-up 4:5
- Estilo: documentary truth, not stock photo, desaturated, authentic
- Mínimo 80 palavras

PROMPTS DE VÍDEO (veoPrompt):
- Em inglês, formato VEO 3.1 nativo (haiku denso)
- 5 sentenças: [sujeito+ação] [câmera+movimento] [detalhe físico] [áudio em camadas] [color+luz]
- Paleta: warm cream base, copper-orange accents

LÓGICA AUTÔNOMA (quando briefing vazio):
1. Analise: Fevereiro 2026, janela de oportunidade de 90 dias se abrindo no Brasil
2. Escolha o ângulo mais estratégico para conversão agora
3. Justifique no campo angleRationale
4. Gere o carrossel com EXATAMENTE 5 slides (não mais, não menos)

LIMITE CRÍTICO: Gere SEMPRE exatamente 5 slides. Nunca mais que 5.

VOCÊ DEVE RETORNAR EXATAMENTE ESTE JSON (sem texto antes ou depois):

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
      ? `Briefing em branco. Ative o modo autônomo: analise o contexto (Fevereiro 2026, pré-verão Florianópolis, janela de 90 dias se abrindo), escolha o ângulo mais estratégico para conversão agora, justifique sua escolha no angleRationale, e gere o carrossel com EXATAMENTE 5 slides seguindo todas as regras de design e copy. Todos os slides com bgStyle: 'dark'.`
      : `Gere um carrossel com EXATAMENTE 5 slides e estas especificações:
${context ? `IDEIA/CONTEXTO: ${context}` : ''}
${angle ? `ÂNGULO: ${angle}` : ''}
${persona ? `PERFIL-ALVO: ${persona}` : ''}
${channel ? `CANAL: ${channel}` : ''}
${format ? `FORMATO: ${format}` : ''}
${tone ? `TOM: ${tone}` : ''}

Siga todas as regras de copy, design e mídia do sistema. EXATAMENTE 5 slides. bgStyle sempre 'dark'. Retorne o JSON completo.`;

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
