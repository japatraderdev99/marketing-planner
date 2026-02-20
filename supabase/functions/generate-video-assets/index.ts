import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const DQEF_BRAND_CONTEXT = `
MARCA: Deixa Que Eu Faço (DQEF)
Marketplace de serviços locais em Florianópolis
Tom visual: fotorrealista, dignidade do trabalho, luz natural brasileira
Paleta: tons quentes de verão, piscinas turquesas, jardins tropicais
Personagens: prestadores de serviço brasileiros (25–48 anos), confiantes, profissionais
Ambientação: residências e condomínios de Florianópolis, piscinas, espaços externos
Filosofia visual: "silêncio e verdade" — sem exageros, momentos reais e autênticos
`;

const MODEL_INSTRUCTIONS: Record<string, string> = {
  "VEO 3.1": `
VEO 3.1 (Google) — DIRETRIZES ESPECÍFICAS:
- Excelente em movimento natural e física realista
- Funciona melhor com descrições de câmera técnicas (focal, f-stop)
- Use timing markers precisos [0.0s–Xs] para cada beat de ação
- Inclua "photorealistic", "4K", "cinematic color grading"
- Descreva o MOVIMENTO da câmera com vetores claros (ex: "slow dolly-in 2cm/s")
- Mencione microdetalhes físicos: reflexos na água, movimento de folhas, sombras projetadas
- Evite múltiplos personagens complexos — focar em 1 personagem principal
- Formato de prompt: [SHOT TYPE] + [ENVIRONMENT] + [CHARACTER ACTION] + [CAMERA MOVEMENT] + [LIGHTING] + [TECHNICAL]
`,
  "Sora 2 Pro Max": `
SORA 2 PRO MAX (OpenAI) — DIRETRIZES ESPECÍFICAS:
- Melhor para narrativa cinemática complexa e transições dramáticas
- Aceita prompts mais longos e descritivos (300–500 palavras)
- Use linguagem de roteiro de cinema: "EXTERIOR. DIA." / "INTERIOR. MANHÃ."
- Descreva emoções e subtexto do personagem explicitamente
- Inclua "Director: [estilo]", "Cinematography: [estilo]"
- Funciona bem com sequências de múltiplos beats [0.0–2.5s], [2.5–5.0s], [5.0–8.0s]
- Descreva o estado emocional antes e depois da cena
- Adicione instruções de som/ambiência para guiar o tom
`,
  "Seedance 1.5 Pro": `
SEEDANCE 1.5 PRO — DIRETRIZES ESPECÍFICAS:
- Modelo mais acessível, ideal para testes e iterações rápidas
- Prompts concisos e diretos (150–250 palavras) funcionam melhor
- Foco em ações físicas claras e específicas (não abstratas)
- Use adjetivos visuais concretos: cores, texturas, luz
- Inclua "steady cam", "natural light", "documentary style"
- Evite prompts muito filosóficos — descreva o que a câmera VÊ
- Bom para loops e movimentos repetitivos (trabalho manual)
- Use: "Wide shot:", "Medium shot:", "Close-up:" no início do prompt
`,
};

interface GenerateRequest {
  operation: "image_prompt" | "video_prompt" | "generate_image" | "express_prompts";
  persona?: string;
  scene?: string;
  contentAngle?: string;
  videoModel?: string;
  aspectRatio?: string;
  duration?: number;
  additionalContext?: string;
  imagePrompt?: string;
  // express mode
  freeText?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const CORS = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  try {
    const body: GenerateRequest = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), { status: 500, headers: CORS });
    }

    const { operation, persona, scene, contentAngle, videoModel, aspectRatio, duration, additionalContext, imagePrompt, freeText } = body;

    // ─── 0. EXPRESS MODE ─────────────────────────────────────────────────────
    if (operation === "express_prompts") {
      const targetModel = videoModel ?? "Seedance 1.5 Pro";
      const targetAspect = aspectRatio ?? "9:16";
      const targetDuration = duration ?? 10;
      const modelInstructions = MODEL_INSTRUCTIONS[targetModel] ?? MODEL_INSTRUCTIONS["Seedance 1.5 Pro"];

      const systemPrompt = `Você é um diretor de cinema e diretor de fotografia com 20 anos de experiência em publicidade brasileira, especialista em geração de conteúdo para IA (Higgsfield, VEO, Sora).

${DQEF_BRAND_CONTEXT}

${modelInstructions}

O usuário vai te dar uma IDEIA, REFERÊNCIA ou TEXTO BRUTO (pode ser um roteiro de carrossel, uma ideia de campanha, um conceito visual). Você deve:
1. Extrair a essência visual e narrativa desse conteúdo
2. Gerar um prompt de IMAGEM hiperdetalhado para o frame inicial (em inglês, estilo fotografia profissional)
3. Gerar um prompt de VÍDEO hiperdetalhado no estilo de diretor de cinema (em inglês)

ESTRUTURA DO PROMPT DE IMAGEM:
[SHOT TYPE]: [lens/focal] | [Subject] | [Action/pose — frozen moment] | [Environment] | [Lighting] | [Depth of field] | [Color grading] | [Technical specs] | [Style]

ESTRUTURA DO PROMPT DE VÍDEO:
OPENING FRAME → SEQUENCE BEATS [0.0s–Xs] → CAMERA movement → CHARACTER actions → ENVIRONMENT → LIGHTING → TECHNICAL → AUDIO/MOOD → STYLE references

Retorne JSON exatamente neste formato:
{
  "imagePrompt": "prompt EN hiperdetalhado para frame inicial no Higgsfield",
  "imagePromptPtBr": "tradução explicativa do prompt de imagem",
  "visualNotes": "notas do diretor de arte sobre as escolhas visuais",
  "videoPrompt": "prompt EN completo de diretor de cinema para o vídeo",
  "videoPromptPtBr": "tradução + análise das escolhas cinematográficas",
  "directorNotes": "raciocínio por trás de cada decisão técnica e narrativa",
  "technicalSpecs": {
    "model": "${targetModel}",
    "duration": "${targetDuration}s",
    "aspectRatio": "${targetAspect}",
    "fixedLens": false,
    "audio": true,
    "resolution": "1080p"
  },
  "warningsAndTips": ["dica 1", "dica 2", "dica 3"],
  "extractedScene": "resumo da cena/ideia extraída do input do usuário",
  "suggestedAngle": "ângulo emocional detectado (Raiva/Dinheiro/Orgulho/Urgência/Alívio)"
}`;

      const userContent = `IDEIA / REFERÊNCIA / TEXTO DO USUÁRIO:
---
${freeText}
---

Modelo de vídeo alvo: ${targetModel}
Aspecto: ${targetAspect}
Duração: ${targetDuration}s
${persona ? `Persona do prestador: ${persona}` : ""}
${contentAngle ? `Ângulo emocional preferido: ${contentAngle}` : ""}

Analise o conteúdo acima e gere ambos os prompts (imagem + vídeo) em inglês, no estilo de diretor de cinema.`;

      const res = await fetch(AI_GATEWAY, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userContent }],
          temperature: 0.75,
        }),
      });

      if (!res.ok) {
        const status = res.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limit atingido. Aguarde e tente novamente." }), { status: 429, headers: CORS });
        if (status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), { status: 402, headers: CORS });
        return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), { status: 500, headers: CORS });
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content ?? "";
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return new Response(JSON.stringify(parsed), { headers: CORS });
    }


    // ─── 1. GENERATE IMAGE PROMPT ────────────────────────────────────────────
    if (operation === "image_prompt") {
      const systemPrompt = `Você é um diretor de fotografia e diretor de arte especialista em campanhas publicitárias brasileiras fotorrealistas.
${DQEF_BRAND_CONTEXT}

Sua tarefa: criar um prompt de imagem HIPERDETALHADO em inglês para gerar o frame inicial de um vídeo no Higgsfield.
O prompt deve ser a CENA ESTÁTICA PERFEITA que serve como ponto de partida para o vídeo — como uma fotografia de alto nível que congela o momento antes do movimento.

ESTRUTURA OBRIGATÓRIA do prompt de imagem:
[SHOT TYPE]: [lens/focal] | [Subject description] | [Action/pose — frozen moment] | [Environment details] | [Lighting — angle, quality, time of day] | [Depth of field] | [Color grading] | [Technical specs] | [Style notes]

Retorne JSON: { "imagePrompt": "...", "imagePromptPtBr": "...", "visualNotes": "..." }`;

      const userMsg = `Persona: ${persona}
Cena/Contexto: ${scene}
Ângulo de conteúdo DQEF: ${contentAngle}
Modelo de vídeo alvo: ${videoModel}
Aspecto: ${aspectRatio}
Duração do vídeo: ${duration}s
${additionalContext ? `Contexto adicional: ${additionalContext}` : ""}

Gere o prompt de imagem para o frame inicial desta cena.`;

      const res = await fetch(AI_GATEWAY, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMsg }],
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        const status = res.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limit atingido. Aguarde e tente novamente." }), { status: 429, headers: CORS });
        if (status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), { status: 402, headers: CORS });
        return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), { status: 500, headers: CORS });
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content ?? "";
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return new Response(JSON.stringify(parsed), { headers: CORS });
    }

    // ─── 2. GENERATE ACTUAL IMAGE (Nano Banana) ───────────────────────────────
    if (operation === "generate_image") {
      if (!imagePrompt) return new Response(JSON.stringify({ error: "imagePrompt required" }), { status: 400, headers: CORS });

      const res = await fetch(AI_GATEWAY, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image-preview",
          messages: [{ role: "user", content: imagePrompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!res.ok) {
        const status = res.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limit atingido. Aguarde e tente novamente." }), { status: 429, headers: CORS });
        if (status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), { status: 402, headers: CORS });
        const errText = await res.text();
        return new Response(JSON.stringify({ error: `Erro na geração de imagem: ${errText}` }), { status: 500, headers: CORS });
      }

      const data = await res.json();
      const images = data.choices?.[0]?.message?.images;
      if (!images || images.length === 0) {
        return new Response(JSON.stringify({ error: "Nenhuma imagem foi gerada" }), { status: 500, headers: CORS });
      }
      const imageUrl = images[0].image_url.url; // data:image/png;base64,...
      return new Response(JSON.stringify({ imageUrl }), { headers: CORS });
    }

    // ─── 3. GENERATE VIDEO PROMPT ─────────────────────────────────────────────
    if (operation === "video_prompt") {
      const modelInstructions = MODEL_INSTRUCTIONS[videoModel] ?? MODEL_INSTRUCTIONS["Seedance 1.5 Pro"];

      const systemPrompt = `Você é um diretor de cinema com 20 anos de experiência em publicidade, especialista em direção de vídeos publicitários brasileiros e em prompts para geração de vídeo com IA.

${DQEF_BRAND_CONTEXT}

${modelInstructions}

ESTRUTURA OBRIGATÓRIA do prompt de vídeo:
1. OPENING FRAME: descrição exata do primeiro quadro
2. SEQUENCE BEATS: timing markers [0.0s–Xs] para cada beat de ação
3. CAMERA: movimento preciso e progressão
4. CHARACTER: ações físicas específicas, expressões, postura
5. ENVIRONMENT: ambiente detalhado com contexto sensorial
6. LIGHTING: qualidade, ângulo, cor da luz em cada beat
7. TECHNICAL: focal, f-stop, color grade, "Fixed lens: OFF/ON"
8. AUDIO/MOOD: ambiência sonora que guia o modelo
9. STYLE: referências cinemáticas específicas

Retorne JSON:
{
  "videoPrompt": "prompt em inglês completo e hiperdetalhado",
  "videoPromptPtBr": "tradução explicativa do prompt",
  "directorNotes": "notas do diretor: por que cada escolha foi feita",
  "technicalSpecs": { "model": "", "duration": "", "aspectRatio": "", "fixedLens": boolean, "audio": boolean, "resolution": "1080p" },
  "warningsAndTips": ["dica 1", "dica 2"]
}`;

      const userMsg = `Persona: ${persona}
Cena/Contexto: ${scene}
Ângulo DQEF: ${contentAngle}
Modelo: ${videoModel}
Aspecto: ${aspectRatio}
Duração: ${duration}s
${additionalContext ? `Contexto adicional: ${additionalContext}` : ""}
${imagePrompt ? `O frame inicial foi gerado com este prompt de imagem: ${imagePrompt}` : ""}

Gere o prompt de vídeo hiperdetalhado no estilo de diretor de cinema para este conteúdo.`;

      const res = await fetch(AI_GATEWAY, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMsg }],
          temperature: 0.75,
        }),
      });

      if (!res.ok) {
        const status = res.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limit atingido. Aguarde e tente novamente." }), { status: 429, headers: CORS });
        if (status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), { status: 402, headers: CORS });
        return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), { status: 500, headers: CORS });
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content ?? "";
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return new Response(JSON.stringify(parsed), { headers: CORS });
    }

    return new Response(JSON.stringify({ error: "Invalid operation" }), { status: 400, headers: CORS });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } });
  }
});
