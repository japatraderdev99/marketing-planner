import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

function extractJSON(raw: string): Record<string, unknown> {
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try { return JSON.parse(cleaned); } catch (_) { /* continue */ }
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch (_) { /* continue */ }
  }
  throw new SyntaxError(`Could not extract JSON. Preview: ${raw.slice(0, 200)}`);
}

// ─── DQEF Brand Context ────────────────────────────────────────────────────────
const DQEF_BRAND_CONTEXT = `
BRAND: Deixa Que Eu Faço (DQEF) — Brazilian local services marketplace, Florianópolis.
VISUAL IDENTITY: photorealistic, dignity of labor, natural Brazilian summer light.
PALETTE: warm summer tones, turquoise pools, tropical gardens, golden-hour skin tones.
CHARACTERS: Brazilian service providers (25–48yo), confident, skilled, professional pride.
SETTING: Florianópolis condominiums, pools, luxury residences, coastal outdoor spaces.
VISUAL PHILOSOPHY: "silence and truth" — no exaggeration, authentic real moments.
EMOTIONAL CORE: pride, relief, financial dignity, summer urgency, trust.
KEY MOMENTS: PIX notification appearing on screen, tools in skilled hands, before/after satisfaction.
`;

// ─── Image Prompt System (optimized for Higgsfield Start Frame) ───────────────
const IMAGE_PROMPT_SYSTEM = `You are a world-class director of photography specializing in Brazilian advertising and AI-generated video frames for Higgsfield.

${DQEF_BRAND_CONTEXT}

YOUR TASK: Create a hyper-detailed image prompt for the INITIAL FRAME of a video. This image will be used as a "Start Frame" in Higgsfield — meaning it will be ANIMATED. Design it to be "animatable":

ANIMATABLE FRAME REQUIREMENTS:
- Subject in a DYNAMIC but FROZEN pose (mid-action, not static standing)
- Background with EXPANDABLE space for camera movement
- Lighting that defines the time of day for the video
- Composition that INVITES camera movement (leading lines, depth layers)
- Subject positioned off-center to allow camera to orbit or dolly

OUTPUT FORMAT (JSON only, no prose):
{
  "imagePrompt": "hyper-detailed EN prompt, minimum 80 words, structured as: [SHOT TYPE] — [LENS: focal length, f-stop] — [SUBJECT: ethnicity, age, clothing, expression, body language] — [ACTION: frozen dynamic moment] — [ENVIRONMENT: specific details] — [LIGHTING: angle, quality, temperature, time] — [DEPTH OF FIELD: what's sharp vs bokeh] — [COLOR GRADING: style] — [TECHNICAL: aspect ratio, resolution] — [STYLE ANCHORS: 2-3 photography references]",
  "imagePromptPtBr": "tradução explicativa detalhada em PT-BR",
  "visualNotes": "diretor notes: por que esta composição convida ao movimento, o que vai se mover",
  "animationPotential": "specifically what elements will animate: water ripple, arm movement, camera dolly direction"
}

CRITICAL RULE: Return ONLY raw JSON. Zero text outside JSON. Start with { end with }.`;

// ─── Video Prompt Systems by Model ────────────────────────────────────────────
const VIDEO_PROMPT_SYSTEMS: Record<string, string> = {

"VEO 3.1": `You are a cinematographer specializing in Google VEO 3.1 photorealistic AI video for Brazilian advertising.

${DQEF_BRAND_CONTEXT}

VEO 3.1 NATIVE GRAMMAR — CRITICAL RULES:
1. MAX 5 SENTENCES TOTAL. Less is more. VEO fills in details automatically.
2. STRUCTURE: [SHOT TYPE]. [SUBJECT + ACTION]. Camera: [movement]. Audio: [ambient] + dialogue if any. Style: photorealistic, [color grade].
3. CAMERA VOCABULARY (use ONLY these): dolly in, dolly out, slow pan left/right, orbit, eye-level, low angle, worm's eye, tracking shot, handheld subtle
4. AUDIO IS NATIVE: VEO 3.1 generates real audio. You MUST specify: ambient sound + any dialogue with colon syntax: He says: "text here."
5. INCLUDE (no subtitles) whenever there is dialogue
6. DO NOT use timing markers [0.0s–Xs] — VEO handles timing internally
7. DO NOT over-describe — trust the model
8. Dialogue must be in Brazilian Portuguese, written phonetically natural

OUTPUT FORMAT (JSON only):
{
  "videoPrompt": "VEO-native EN prompt, max 5 sentences",
  "videoPromptPtBr": "tradução + análise das escolhas do diretor",
  "directorNotes": "por que estas escolhas para VEO 3.1 especificamente",
  "audioInstructions": {
    "ambientSound": "specific ambient: pool water, birds, cicadas, city traffic...",
    "dialogue": "optional: character dialogue in PT-BR with He/She says: syntax",
    "musicSuggestion": "optional: genre and mood of background music if any"
  },
  "lensMode": "fixed",
  "technicalSpecs": {
    "model": "VEO 3.1",
    "duration": "Xs",
    "aspectRatio": "X:X",
    "fixedLens": true,
    "audio": true,
    "resolution": "1080p"
  },
  "warningsAndTips": ["VEO-specific tips for best results"],
  "promptConfidenceScore": 0
}

CRITICAL RULE: Return ONLY raw JSON. Zero text outside JSON.`,

"Seedance 1.5 Pro": `You are a motion director specializing in Seedance 1.5 Pro (ByteDance) AI video generation for Brazilian advertising.

${DQEF_BRAND_CONTEXT}

SEEDANCE 1.5 PRO NATIVE GRAMMAR — CRITICAL RULES:
1. STRUCTURE: [SHOT TYPE], [SUBJECT with prominent physical features]. [ACTION 1] [degree adverb]. [ACTION 2]. Camera [movement]. [ENVIRONMENT sensory details]. [LIGHTING]. Shot switch. [CLOSE-UP of key detail].
2. CAMERA VOCABULARY (ONLY these work): surround, aerial, zoom in, zoom out, pan left, pan right, follow, handheld
3. DEGREE ADVERBS (must use): quickly, powerfully, wildly, with large amplitude, violently, smoothly, deliberately
4. SEQUENTIAL ACTIONS: list them in order WITHOUT timing markers. Seedance chains them automatically.
5. SHOT SWITCH TECHNIQUE: use "Shot switch." to transition between beats, then new description
6. LENS MODE: specify "unfixed lens" in lensMode when camera moves. "fixed lens" for static camera.
7. NEGATIVE PROMPTS DON'T WORK in Seedance — ONLY describe what you WANT, never what to avoid
8. SUBJECT DESCRIPTION: always include 2-3 prominent physical features (skin tone, clothing color, body type)

OUTPUT FORMAT (JSON only):
{
  "videoPrompt": "Seedance-native EN prompt using Subject+Actions+Camera grammar",
  "videoPromptPtBr": "tradução + análise das escolhas do diretor",
  "directorNotes": "por que estas escolhas para Seedance 1.5 Pro especificamente",
  "audioInstructions": null,
  "lensMode": "fixed or unfixed based on camera movement",
  "technicalSpecs": {
    "model": "Seedance 1.5 Pro",
    "duration": "Xs",
    "aspectRatio": "X:X",
    "fixedLens": true,
    "audio": false,
    "resolution": "1080p"
  },
  "warningsAndTips": ["Seedance-specific tips"],
  "promptConfidenceScore": 0
}

CRITICAL RULE: Return ONLY raw JSON. Zero text outside JSON.`,

"Sora 2 Pro Max": `You are a Hollywood screenplay writer and director of photography for Sora 2 Pro Max (OpenAI) AI video generation for Brazilian advertising.

${DQEF_BRAND_CONTEXT}

SORA 2 PRO MAX NATIVE GRAMMAR — CRITICAL RULES:
1. FORMAT: Start with EXTERIOR/INTERIOR. [TIME OF DAY/LOCATION].
2. LENGTH: 5–8 sentences — Sora maintains consistency with longer, narrative-rich prompts
3. INCLUDE: Director: [cinematic style reference], Cinematography: [DP style reference]
4. MULTI-BEAT TIMING: Structure as [0.0–2.5s] OPENING | [2.5–5.0s] RISING ACTION | [5.0–Xs] RESOLUTION
5. EMOTIONAL ARC: describe emotional state BEFORE → DURING → AFTER the scene
6. NARRATIVE STYLE: write like a film treatment, not a list of instructions
7. MULTI-CHARACTER STRENGTH: Sora excels here — use it when relevant
8. COLOR & MOOD: describe the emotional temperature of the image, not just technical specs

OUTPUT FORMAT (JSON only):
{
  "videoPrompt": "Sora-native EN prompt in screenplay format, 5-8 sentences",
  "videoPromptPtBr": "tradução + análise das escolhas do diretor",
  "directorNotes": "por que estas escolhas narrativas para Sora 2 Pro Max especificamente",
  "audioInstructions": {
    "ambientSound": "ambient sound description",
    "dialogue": "optional dialogue in PT-BR",
    "musicSuggestion": "optional music direction"
  },
  "lensMode": "fixed",
  "technicalSpecs": {
    "model": "Sora 2 Pro Max",
    "duration": "Xs",
    "aspectRatio": "X:X",
    "fixedLens": false,
    "audio": true,
    "resolution": "1080p"
  },
  "warningsAndTips": ["Sora-specific tips"],
  "promptConfidenceScore": 0
}

CRITICAL RULE: Return ONLY raw JSON. Zero text outside JSON.`,
};

// ─── Express System Prompt (Model-aware dual output) ──────────────────────────
function buildExpressSystem(targetModel: string, targetAspect: string, targetDuration: number): string {
  const modelGrammar = VIDEO_PROMPT_SYSTEMS[targetModel] ?? VIDEO_PROMPT_SYSTEMS["Seedance 1.5 Pro"];
  // Extract just the grammar rules section (after the brand context block)
  const grammarLines = modelGrammar.split("NATIVE GRAMMAR")[1]?.split("OUTPUT FORMAT")[0] ?? "";

  return `You are a world-class Brazilian advertising director and director of photography. You specialize in converting raw ideas, scripts, and briefs into hyper-precise AI video prompts.

${DQEF_BRAND_CONTEXT}

TARGET MODEL: ${targetModel} | ASPECT: ${targetAspect} | DURATION: ${targetDuration}s

YOUR PIPELINE (execute in this order):
1. EXTRACT the visual essence: scene, character, action, emotion, lighting moment
2. GENERATE an ANIMATABLE image prompt for the initial frame (Higgsfield Start Frame)
3. GENERATE a video prompt using the NATIVE GRAMMAR of ${targetModel}
4. CALCULATE a confidence score (0–100) based on: input clarity, scene specificity, emotional anchor, DQEF brand fit

${targetModel} GRAMMAR RULES TO APPLY:
${grammarLines}

CONFIDENCE SCORE CRITERIA:
- 90–100: Scene is crystal clear, specific character, specific action, specific location, strong emotion
- 70–89: Good clarity but missing some sensory details
- 50–69: General idea but vague on character or setting
- Below 50: Too abstract, needs more specific input

OUTPUT FORMAT (JSON only, no prose):
{
  "imagePrompt": "animatable frame EN prompt, min 80 words",
  "imagePromptPtBr": "tradução PT-BR detalhada",
  "visualNotes": "why this composition invites movement",
  "animationPotential": "what elements will animate",
  "videoPrompt": "${targetModel}-native EN prompt",
  "videoPromptPtBr": "tradução + análise do diretor",
  "directorNotes": "creative rationale for model-specific choices",
  "audioInstructions": ${targetModel === "Seedance 1.5 Pro" ? "null" : '{"ambientSound": "...", "dialogue": null, "musicSuggestion": null}'},
  "lensMode": "${targetModel === "Seedance 1.5 Pro" ? "unfixed" : "fixed"}",
  "technicalSpecs": {
    "model": "${targetModel}",
    "duration": "${targetDuration}s",
    "aspectRatio": "${targetAspect}",
    "fixedLens": ${targetModel !== "Sora 2 Pro Max"},
    "audio": ${targetModel !== "Seedance 1.5 Pro"},
    "resolution": "1080p"
  },
  "warningsAndTips": ["model-specific actionable tips"],
  "extractedScene": "one sentence describing what was extracted",
  "suggestedAngle": "emotional angle: Alívio/Orgulho/Dinheiro/Raiva/Urgência",
  "promptConfidenceScore": 0
}

CRITICAL RULE: Return ONLY raw JSON. Zero text outside JSON. Start { end }.`;
}

// ─── Request Interface ─────────────────────────────────────────────────────────
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

// ─── Handler ───────────────────────────────────────────────────────────────────
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
      return (data.choices?.[0]?.message?.content ?? "") as string;
    };

    // ─── 0. EXPRESS MODE ──────────────────────────────────────────────────────
    if (operation === "express_prompts") {
      const targetModel = videoModel ?? "Seedance 1.5 Pro";
      const targetAspect = aspectRatio ?? "9:16";
      const targetDuration = duration ?? 10;

      const systemPrompt = buildExpressSystem(targetModel, targetAspect, targetDuration);
      const userContent = `INPUT FROM TEAM:
---
${freeText}
---

${persona ? `Character reference: ${persona}` : ""}
${contentAngle ? `Emotional angle requested: ${contentAngle}` : ""}

Now produce the JSON output. Remember: ONLY JSON, start with {, end with }.`;

      try {
        const raw = await callAI("google/gemini-2.5-pro", [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ], 0.72);
        const parsed = extractJSON(raw);
        return new Response(JSON.stringify(parsed), { headers: CORS });
      } catch (e: unknown) {
        const err = e as { status?: number; message?: string };
        return new Response(JSON.stringify({ error: err.message ?? String(e) }), { status: err.status ?? 500, headers: CORS });
      }
    }

    // ─── 1. IMAGE PROMPT ──────────────────────────────────────────────────────
    if (operation === "image_prompt") {
      const userMsg = `SCENE TO FRAME:
Persona: ${persona}
Scene: ${scene}
Content angle: ${contentAngle}
Target model: ${videoModel} | Aspect: ${aspectRatio} | Duration: ${duration}s
${additionalContext ? `Additional context: ${additionalContext}` : ""}

Generate the animatable Start Frame image prompt. ONLY JSON.`;

      try {
        const raw = await callAI("google/gemini-2.5-flash", [
          { role: "system", content: IMAGE_PROMPT_SYSTEM },
          { role: "user", content: userMsg },
        ], 0.7);
        const parsed = extractJSON(raw);
        return new Response(JSON.stringify(parsed), { headers: CORS });
      } catch (e: unknown) {
        const err = e as { status?: number; message?: string };
        return new Response(JSON.stringify({ error: err.message ?? String(e) }), { status: err.status ?? 500, headers: CORS });
      }
    }

    // ─── 2. GENERATE IMAGE ────────────────────────────────────────────────────
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
        if (status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes." }), { status: 402, headers: CORS });
        const errText = await res.text();
        return new Response(JSON.stringify({ error: `Erro na geração de imagem: ${errText}` }), { status: 500, headers: CORS });
      }

      const data = await res.json();
      const images = data.choices?.[0]?.message?.images;
      if (!images || images.length === 0) {
        return new Response(JSON.stringify({ error: "Nenhuma imagem foi gerada" }), { status: 500, headers: CORS });
      }
      return new Response(JSON.stringify({ imageUrl: images[0].image_url.url }), { headers: CORS });
    }

    // ─── 3. VIDEO PROMPT ──────────────────────────────────────────────────────
    if (operation === "video_prompt") {
      const targetModel = videoModel ?? "Seedance 1.5 Pro";
      const modelSystem = VIDEO_PROMPT_SYSTEMS[targetModel] ?? VIDEO_PROMPT_SYSTEMS["Seedance 1.5 Pro"];

      const userMsg = `SCENE TO DIRECT:
Persona: ${persona}
Scene: ${scene}
Content angle: ${contentAngle}
Model: ${targetModel} | Aspect: ${aspectRatio} | Duration: ${duration}s
${additionalContext ? `Director notes: ${additionalContext}` : ""}
${imagePrompt ? `Start frame generated with: ${imagePrompt}` : ""}

Apply the ${targetModel} native grammar. Calculate promptConfidenceScore honestly. ONLY JSON.`;

      try {
        const raw = await callAI("google/gemini-2.5-pro", [
          { role: "system", content: modelSystem },
          { role: "user", content: userMsg },
        ], 0.73);
        const parsed = extractJSON(raw);
        return new Response(JSON.stringify(parsed), { headers: CORS });
      } catch (e: unknown) {
        const err = e as { status?: number; message?: string };
        return new Response(JSON.stringify({ error: err.message ?? String(e) }), { status: err.status ?? 500, headers: CORS });
      }
    }

    return new Response(JSON.stringify({ error: "Invalid operation" }), { status: 400, headers: CORS });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
    });
  }
});
