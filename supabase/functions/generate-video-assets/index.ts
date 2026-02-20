import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

// Robustly extracts JSON from model response even when there's prose before/after
function extractJSON(raw: string): Record<string, unknown> {
  // 1. Strip markdown code fences
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  // 2. Try direct parse
  try { return JSON.parse(cleaned); } catch (_) { /* continue */ }
  // 3. Extract first {...} block (handles "Sure! Here is..." prefix)
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch (_) { /* continue */ }
  }
  throw new SyntaxError(`Could not extract JSON from model response. Preview: ${raw.slice(0, 200)}`);
}

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

    // Helper to call AI gateway
    const callAI = async (model: string, messages: { role: string; content: string }[], temperature = 0.75) => {
      const res = await fetch(AI_GATEWAY, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, temperature }),
      });
      if (!res.ok) {
        const status = res.status;
        if (status === 429) throw Object.assign(new Error("Rate limit atingido. Aguarde e tente novamente."), { status: 429 });
        if (status === 402) throw Object.assign(new Error("Créditos insuficientes. Adicione créditos ao workspace."), { status: 402 });
        throw new Error("Erro no serviço de IA");
      }
      const data = await res.json();
      const content: string = data.choices?.[0]?.message?.content ?? "";
      return content;
    };

    // ─── 0. EXPRESS MODE ─────────────────────────────────────────────────────
    if (operation === "express_prompts") {
      const targetModel = videoModel ?? "Seedance 1.5 Pro";
      const targetAspect = aspectRatio ?? "9:16";
      const targetDuration = duration ?? 10;
      const modelInstructions = MODEL_INSTRUCTIONS[targetModel] ?? MODEL_INSTRUCTIONS["Seedance 1.5 Pro"];

      const systemPrompt = `Você é um diretor de cinema e diretor de fotografia com 20 anos de experiência em publicidade brasileira, especialista em geração de conteúdo para IA (Higgsfield, VEO, Sora).

${DQEF_BRAND_CONTEXT}

${modelInstructions}

O usuário vai te dar uma IDEIA, REFERÊNCIA ou TEXTO BRUTO. Sua tarefa:
1. Extrair a essência visual e narrativa desse conteúdo
2. Gerar um prompt de IMAGEM hiperdetalhado para o frame inicial (em inglês, estilo fotografia profissional)
3. Gerar um prompt de VÍDEO hiperdetalhado no estilo de diretor de cinema (em inglês)

ESTRUTURA DO PROMPT DE IMAGEM:
[SHOT TYPE]: [lens/focal] | [Subject] | [Action/pose] | [Environment] | [Lighting] | [Depth of field] | [Color grading] | [Technical specs] | [Style]

ESTRUTURA DO PROMPT DE VÍDEO:
OPENING FRAME → SEQUENCE BEATS [0.0s–Xs] → CAMERA movement → CHARACTER actions → ENVIRONMENT → LIGHTING → TECHNICAL → AUDIO/MOOD → STYLE references

REGRA CRÍTICA: Responda APENAS com JSON puro. Zero texto fora do JSON. Nenhuma explicação. Nenhum prefácio. Apenas o objeto JSON começando com { e terminando com }.

JSON esperado:
{"imagePrompt":"...","imagePromptPtBr":"...","visualNotes":"...","videoPrompt":"...","videoPromptPtBr":"...","directorNotes":"...","technicalSpecs":{"model":"${targetModel}","duration":"${targetDuration}s","aspectRatio":"${targetAspect}","fixedLens":false,"audio":true,"resolution":"1080p"},"warningsAndTips":["..."],"extractedScene":"...","suggestedAngle":"..."}`;

      const userContent = `IDEIA / REFERÊNCIA / TEXTO DO USUÁRIO:
---
${freeText}
---

Modelo: ${targetModel} | Aspecto: ${targetAspect} | Duração: ${targetDuration}s
${persona ? `Persona: ${persona}` : ""}
${contentAngle ? `Ângulo: ${contentAngle}` : ""}

Responda SOMENTE com JSON.`;

      try {
        const raw = await callAI("google/gemini-2.5-pro", [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ], 0.75);
        const parsed = extractJSON(raw);
        return new Response(JSON.stringify(parsed), { headers: CORS });
      } catch (e: unknown) {
        const err = e as { status?: number; message?: string };
        return new Response(JSON.stringify({ error: err.message ?? String(e) }), { status: err.status ?? 500, headers: CORS });
      }
    }

    // ─── 1. GENERATE IMAGE PROMPT ────────────────────────────────────────────
    if (operation === "image_prompt") {
      const systemPrompt = `Você é um diretor de fotografia e diretor de arte especialista em campanhas publicitárias brasileiras fotorrealistas.
${DQEF_BRAND_CONTEXT}

Sua tarefa: criar um prompt de imagem HIPERDETALHADO em inglês para o frame inicial de um vídeo no Higgsfield.

ESTRUTURA OBRIGATÓRIA:
[SHOT TYPE]: [lens/focal] | [Subject description] | [Action/pose — frozen moment] | [Environment details] | [Lighting — angle, quality, time of day] | [Depth of field] | [Color grading] | [Technical specs] | [Style notes]

REGRA CRÍTICA: Responda APENAS com JSON puro. Nenhum texto fora do JSON.
Formato: {"imagePrompt":"...","imagePromptPtBr":"...","visualNotes":"..."}`;

      const userMsg = `Persona: ${persona}
Cena: ${scene}
Ângulo: ${contentAngle}
Modelo: ${videoModel} | Aspecto: ${aspectRatio} | Duração: ${duration}s
${additionalContext ? `Contexto: ${additionalContext}` : ""}

Responda SOMENTE com JSON.`;

      try {
        const raw = await callAI("google/gemini-2.5-flash", [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg },
        ], 0.7);
        const parsed = extractJSON(raw);
        return new Response(JSON.stringify(parsed), { headers: CORS });
      } catch (e: unknown) {
        const err = e as { status?: number; message?: string };
        return new Response(JSON.stringify({ error: err.message ?? String(e) }), { status: err.status ?? 500, headers: CORS });
      }
    }

    // ─── 2. GENERATE ACTUAL IMAGE ─────────────────────────────────────────────
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
      const imageUrl = images[0].image_url.url;
      return new Response(JSON.stringify({ imageUrl }), { headers: CORS });
    }

    // ─── 3. GENERATE VIDEO PROMPT ─────────────────────────────────────────────
    if (operation === "video_prompt") {
      const modelInstructions = MODEL_INSTRUCTIONS[videoModel ?? "Seedance 1.5 Pro"] ?? MODEL_INSTRUCTIONS["Seedance 1.5 Pro"];

      const systemPrompt = `Você é um diretor de cinema com 20 anos de experiência em publicidade brasileira, especialista em prompts para geração de vídeo com IA.

${DQEF_BRAND_CONTEXT}

${modelInstructions}

ESTRUTURA OBRIGATÓRIA do prompt de vídeo:
1. OPENING FRAME
2. SEQUENCE BEATS: timing markers [0.0s–Xs]
3. CAMERA: movimento preciso
4. CHARACTER: ações físicas, expressões, postura
5. ENVIRONMENT: ambiente detalhado
6. LIGHTING: qualidade, ângulo, cor
7. TECHNICAL: focal, f-stop, color grade
8. AUDIO/MOOD: ambiência sonora
9. STYLE: referências cinemáticas

REGRA CRÍTICA: Responda APENAS com JSON puro. Nenhum texto fora do JSON.
Formato: {"videoPrompt":"...","videoPromptPtBr":"...","directorNotes":"...","technicalSpecs":{"model":"","duration":"","aspectRatio":"","fixedLens":false,"audio":true,"resolution":"1080p"},"warningsAndTips":["..."]}`;

      const userMsg = `Persona: ${persona}
Cena: ${scene}
Ângulo: ${contentAngle}
Modelo: ${videoModel} | Aspecto: ${aspectRatio} | Duração: ${duration}s
${additionalContext ? `Contexto: ${additionalContext}` : ""}
${imagePrompt ? `Frame inicial gerado com: ${imagePrompt}` : ""}

Responda SOMENTE com JSON.`;

      try {
        const raw = await callAI("google/gemini-2.5-pro", [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg },
        ], 0.75);
        const parsed = extractJSON(raw);
        return new Response(JSON.stringify(parsed), { headers: CORS });
      } catch (e: unknown) {
        const err = e as { status?: number; message?: string };
        return new Response(JSON.stringify({ error: err.message ?? String(e) }), { status: err.status ?? 500, headers: CORS });
      }
    }

    return new Response(JSON.stringify({ error: "Invalid operation" }), { status: 400, headers: CORS });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } });
  }
});
