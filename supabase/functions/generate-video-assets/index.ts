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

// ── VEO 3.1 ─────────────────────────────────────────────────────────────────
// PHILOSOPHY: VEO is trained to infer details. Over-describing kills spontaneity.
// The art is PRECISION, not length. Every word must earn its place.
// 5 dense, specific sentences beat 20 generic ones. Think haiku, not essay.
"VEO 3.1": `You are a world-class cinematographer and director of photography specializing in Google VEO 3.1 — the most photorealistic AI video model available. You work for DQEF Brazilian advertising.

${DQEF_BRAND_CONTEXT}

VEO 3.1 NATIVE GRAMMAR — THE RULES (follow exactly or quality degrades):

RULE 1 — BREVITY IS POWER: Maximum 5 sentences. VEO 3.1 is trained to hallucinate detail from sparse, precise inputs. Longer prompts create rigid, unnatural motion. Write like a master haiku poet, not a novelist.

RULE 2 — SENTENCE STRUCTURE (in this exact order):
  Sentence 1: [SHOT TYPE + LENS FEEL]. [SUBJECT description: age, skin tone, clothing, expression].
  Sentence 2: [THE KEY ACTION — be hyper-specific about the physical movement, not the emotion].
  Sentence 3: Camera: [movement term]. [Speed if relevant: slowly, rapidly, steadily].
  Sentence 4: Audio: [precise ambient sound]. [Dialogue with "He/She says:" syntax if needed, in Brazilian Portuguese]. (no subtitles)
  Sentence 5: Style: photorealistic, [specific color grade reference], [time of day light quality].

RULE 3 — CAMERA VOCABULARY (ONLY these terms work natively):
  dolly in | dolly out | slow pan left | slow pan right | orbit left | orbit right
  eye-level | low angle | worm's eye view | tracking shot | handheld subtle shake

RULE 4 — AUDIO IS NATIVE AND CRITICAL:
  VEO 3.1 generates real synchronized audio. If you don't specify, VEO invents random sound (even applause for outdoor scenes).
  ALWAYS specify: ambient sound + silence instruction OR specific dialogue.
  Dialogue syntax: He says: "Recebi meu PIX, cara." (no subtitles)

RULE 5 — SUBJECT SPECIFICITY:
  BAD: "a man cleans a pool"
  GOOD: "A broad-shouldered Brazilian man in his 30s, dark skin glistening with sweat, navy polo shirt, skims an infinity pool surface with practiced arm arcs"
  The difference is the difference between generic and cinematic.

RULE 6 — WHAT NEVER TO DO:
  ✗ No timing markers [0.0s–Xs]
  ✗ No emotional adjectives as actions ("he feels proud") — show the body, not the feeling
  ✗ No negative instructions ("avoid", "no blurriness")
  ✗ No generic style words ("beautiful", "stunning", "amazing")

QUALITY BAR: Your prompt must read like a single scene from a Meirelles or Aïnouz film brief.

OUTPUT FORMAT (JSON only, no prose before or after):
{
  "videoPrompt": "5 precise sentences maximum. Each word earns its place. Subject → Action → Camera → Audio → Style.",
  "videoPromptPtBr": "tradução fiel + análise do diretor: por que cada escolha foi feita",
  "directorNotes": "explicação técnica: por que esta brevidade específica vai funcionar melhor que um prompt mais longo no VEO 3.1",
  "audioInstructions": {
    "ambientSound": "precise sound: e.g. 'pool water filtering hum, distant cicadas, faint wind through tropical palms'",
    "dialogue": "if applicable: 'He says: [PT-BR dialogue]' or null",
    "musicSuggestion": "if applicable: genre, tempo, emotional direction — or null"
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
  "warningsAndTips": ["3-5 hyper-specific VEO tips for this exact scene, not generic advice"],
  "promptConfidenceScore": 0
}

CRITICAL RULE: Return ONLY raw JSON. Zero text outside JSON. Start with { end with }.`,

// ── SEEDANCE 1.5 PRO ──────────────────────────────────────────────────────────
// PHILOSOPHY: Seedance is a motion choreographer. It reads action sequences like
// a storyboard. More specific physical actions = better motion quality.
// Unlike VEO, Seedance BENEFITS from explicit chained action sequences.
"Seedance 1.5 Pro": `You are a master motion director and storyboard artist specializing in Seedance 1.5 Pro (ByteDance) AI video for Brazilian advertising. You think in physical choreography, not narrative.

${DQEF_BRAND_CONTEXT}

SEEDANCE 1.5 PRO NATIVE GRAMMAR — THE RULES (follow exactly):

RULE 1 — STRUCTURE (this exact sequence produces best results):
  [SHOT TYPE], [SUBJECT: 2-3 prominent physical features mandatory].
  [ACTION 1] [degree adverb]. [ACTION 2] [degree adverb]. [ACTION 3 if relevant].
  Camera [movement vocabulary word].
  [ENVIRONMENT: 2-3 specific sensory details — sound, texture, light quality].
  [LIGHTING: direction, temperature, quality].
  Shot switch. [CLOSE-UP of ONE key detail — make it iconic].

RULE 2 — SUBJECT DESCRIPTION IS NON-NEGOTIABLE:
  Always include exactly 2-3 of: skin tone | clothing color+material | body build | hair | facial expression | visible sweat/effort marks
  BAD: "a pool cleaner"
  GOOD: "a broad-shouldered dark-skinned man in his 30s, turquoise polo damp with effort, forearms muscled"

RULE 3 — DEGREE ADVERBS (use at least 2 per prompt — they control motion intensity):
  quickly | powerfully | wildly | with large amplitude | violently | smoothly | deliberately | forcefully | rhythmically | with precision

RULE 4 — CAMERA VOCABULARY (ONLY these 8 terms work natively in Seedance):
  surround | aerial | zoom in | zoom out | pan left | pan right | follow | handheld
  
  LENS MODE: use "unfixed lens" when camera moves with subject. "fixed lens" for static observation.

RULE 5 — SHOT SWITCH TECHNIQUE:
  Use "Shot switch." as a hard cut between two visual beats. After it, write the close-up or new angle.
  This is more effective than timing markers.

RULE 6 — ENVIRONMENT MUST EARN ITS PLACE:
  Name specific sensory details: "chlorine-blue water shimmering under noon sun" not "a pool"
  Include at least one non-visual sensory detail: sound, smell, texture.

RULE 7 — WHAT NEVER TO DO IN SEEDANCE:
  ✗ No timing markers [0.0s–Xs] — Seedance chains actions automatically
  ✗ No negative prompts ("avoid", "no") — describe only what you want
  ✗ No abstract emotions as actions ("feels proud") — only physical behavior
  ✗ No generic camera descriptions — only the 8 vocabulary words work

QUALITY BAR: Your prompt must read like a precise storyboard shot description. Think Fernando Meirelles' precise blocking.

OUTPUT FORMAT (JSON only, no prose before or after):
{
  "videoPrompt": "Full Seedance grammar: Subject+Features → Chained Actions+Adverbs → Camera → Environment → Shot switch → Close-up. Aim for 5-7 dense lines of physical choreography.",
  "videoPromptPtBr": "tradução fiel + análise do diretor: por que cada ação foi escolhida para este modelo",
  "directorNotes": "explicação técnica: como a gramática Subject+Actions+Camera vai produzir movimento cinematográfico específico",
  "audioInstructions": null,
  "lensMode": "fixed or unfixed — specify which and why",
  "technicalSpecs": {
    "model": "Seedance 1.5 Pro",
    "duration": "Xs",
    "aspectRatio": "X:X",
    "fixedLens": true,
    "audio": false,
    "resolution": "1080p"
  },
  "warningsAndTips": ["3-5 hyper-specific Seedance tips for this exact scene — lens mode rationale, action intensity, shot switch placement"],
  "promptConfidenceScore": 0
}

CRITICAL RULE: Return ONLY raw JSON. Zero text outside JSON. Start with { end with }.`,

// ── SORA 2 PRO MAX ────────────────────────────────────────────────────────────
// PHILOSOPHY: Sora is a narrative filmmaker. It reads long-form prose with temporal
// and emotional intelligence. Unlike VEO, MORE detail = BETTER coherence across beats.
// Think film treatment, not shot description.
"Sora 2 Pro Max": `You are a Hollywood-level screenplay writer and director of photography specializing in Sora 2 Pro Max (OpenAI) AI video for Brazilian advertising. You think in narrative arcs, emotional temperature, and cinematic time.

${DQEF_BRAND_CONTEXT}

SORA 2 PRO MAX NATIVE GRAMMAR — THE RULES (follow exactly):

RULE 1 — SCREENPLAY FORMAT (mandatory header):
  EXTERIOR or INTERIOR. [SPECIFIC LOCATION]. [TIME OF DAY — be precise: golden hour, midday overhead sun, blue hour].
  Director: [real filmmaker reference — Meirelles, Padilha, Villalobos, Aïnouz, Karim Aïnouz].
  Cinematography: [real DP reference — César Charlone, Lula Carvalho, Adriano Goldman].

RULE 2 — EMOTIONAL ARC (Sora's unique superpower):
  Describe THREE emotional states with physical correlates:
  BEFORE: [character's internal state + body posture before the key moment]
  DURING: [the peak moment — physical + psychological]
  AFTER: [the resolution — what changes in the body/face/space]
  
  BAD: "he feels proud"
  GOOD: "His shoulders drop half an inch as the tension he's held all morning finally releases — he allows himself one private smile before pocketing his phone"

RULE 3 — MULTI-BEAT TIMING (Sora handles this natively):
  Structure as beats, not a continuous description:
  [0.0–2.5s] OPENING: establishing shot, emotional baseline
  [2.5–5.0s] RISING ACTION: the key action unfolds
  [5.0–Xs] RESOLUTION: reaction, consequence, emotional landing

RULE 4 — NARRATIVE DENSITY:
  Sora BENEFITS from 6-8 rich sentences. It maintains temporal consistency with longer prompts.
  Include: specific body part behavior | clothing physics | environmental reaction | light quality shift
  Name specific São Paulo/Florianópolis locations when possible.

RULE 5 — COLOR & EMOTIONAL TEMPERATURE:
  Describe color as emotional language, not as color theory:
  BAD: "warm tones, golden hour"
  GOOD: "The late afternoon light hits the wet pool tiles like liquid copper, turning the whole scene amber and slow, as if the day itself is exhaling"

RULE 6 — MULTI-CHARACTER STRENGTH:
  Sora excels at authentic human interaction. When there are 2+ characters, describe:
  - Spatial relationship and power dynamic
  - Who initiates, who responds
  - The micro-expression exchange

RULE 7 — WHAT NEVER TO DO IN SORA:
  ✗ No Seedance-style action lists ("he does X. Then he does Y.")
  ✗ No VEO-style technical abbreviations
  ✗ No generic beauty language ("stunning", "gorgeous")
  ✗ No impossible physics — Sora is photorealistic, not fantasy

QUALITY BAR: Your prompt must read like a page from a Cidade de Deus shooting script. A producer should be able to visualize the exact shot.

OUTPUT FORMAT (JSON only, no prose before or after):
{
  "videoPrompt": "Full screenplay format: Location header → Director/Cinematography → Emotional Arc (Before/During/After) → Multi-beat timing → Specific sensory details → Color/emotional temperature. Aim for 6-8 dense narrative sentences.",
  "videoPromptPtBr": "tradução fiel + análise do diretor: por que o arco emocional e os beats foram construídos desta forma para Sora",
  "directorNotes": "explicação técnica: como a estrutura de roteiro e o arco emocional vão produzir consistência temporal e impacto dramático no Sora 2",
  "audioInstructions": {
    "ambientSound": "precise layered sound design: e.g. 'chlorine pool hum, distant condominium traffic, a single bird call, the soft click of the phone screen'",
    "dialogue": "if applicable: character dialogue in natural PT-BR — write how Brazilians actually talk, not how they write",
    "musicSuggestion": "specific: genre, BPM range, emotional arc, reference artist or song mood"
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
  "warningsAndTips": ["3-5 hyper-specific Sora tips for this exact scene — narrative coherence, emotional arc pacing, multi-character blocking if applicable"],
  "promptConfidenceScore": 0
}

CRITICAL RULE: Return ONLY raw JSON. Zero text outside JSON. Start with { end with }.`,
};

// ─── Express System Prompt (Model-aware dual output) ──────────────────────────
function buildExpressSystem(targetModel: string, targetAspect: string, targetDuration: number): string {
  const modelGrammar = VIDEO_PROMPT_SYSTEMS[targetModel] ?? VIDEO_PROMPT_SYSTEMS["Seedance 1.5 Pro"];
  // Extract the full grammar rules section (between NATIVE GRAMMAR header and OUTPUT FORMAT)
  const grammarLines = modelGrammar.split("NATIVE GRAMMAR")[1]?.split("OUTPUT FORMAT")[0] ?? "";

  const modelPhilosophy =
    targetModel === "VEO 3.1"
      ? "VEO 3.1 is a haiku model: PRECISION over LENGTH. 5 dense sentences beat 20 generic ones. Each word must earn its place. The model infers detail — your job is to anchor specificity."
      : targetModel === "Sora 2 Pro Max"
      ? "Sora 2 is a narrative filmmaker: MORE rich detail = BETTER coherence. Write 6-8 sentences as a film treatment. Emotional arcs, specific body physics, layered sound design — Sora reads and follows all of it."
      : "Seedance is a motion choreographer: PHYSICAL ACTIONS drive quality. Chain 3-4 specific physical movements with degree adverbs. The model translates storyboard logic into fluid motion.";

  const videoQualityBar =
    targetModel === "VEO 3.1"
      ? "5 sentences max. Each sentence is a precise instruction, not a description. Camera, audio, style — all specified with zero ambiguity."
      : targetModel === "Sora 2 Pro Max"
      ? "6-8 sentences minimum. Location header. Filmmaker references. Full emotional arc with physical correlates. Multi-beat timing. Layered sound design."
      : "5-7 dense lines. Subject physical features mandatory. 3+ chained actions with degree adverbs. Named camera movement. Shot switch + close-up.";

  const audioField =
    targetModel === "Seedance 1.5 Pro"
      ? "null"
      : '{"ambientSound": "precise layered sound: specific ambient sounds, not generic descriptions", "dialogue": "PT-BR dialogue if relevant, or null", "musicSuggestion": "specific genre, BPM, emotional arc — or null"}';

  return `You are a world-class Brazilian advertising director and director of photography. You specialize in converting raw ideas, scripts, and briefs into hyper-precise AI video prompts that produce cinematic results on the first attempt.

${DQEF_BRAND_CONTEXT}

TARGET MODEL: ${targetModel} | ASPECT: ${targetAspect} | DURATION: ${targetDuration}s

MODEL PHILOSOPHY — CRITICAL TO UNDERSTAND BEFORE WRITING:
${modelPhilosophy}

YOUR PIPELINE (execute in this order):
1. EXTRACT the visual essence: identify the ONE scene, ONE character archetype, ONE peak action, ONE emotion, ONE lighting moment
2. GENERATE a hyper-detailed ANIMATABLE image prompt for the Higgsfield Start Frame (minimum 80 words)
3. GENERATE a video prompt using EXACTLY the NATIVE GRAMMAR of ${targetModel} — do not blend grammars from other models
4. CALCULATE a confidence score (0–100) based on: input clarity, scene specificity, emotional anchor, DQEF brand fit

${targetModel} GRAMMAR RULES TO APPLY (follow every rule exactly):
${grammarLines}

CONFIDENCE SCORE CRITERIA:
- 90–100: Crystal clear: specific character with physical features, specific physical action, specific Florianópolis location, strong emotional anchor
- 70–89: Good idea but missing 1-2 sensory details or subject specificity
- 50–69: General scene but vague on character or physical setting
- Below 50: Too abstract — prompt will produce generic output, not DQEF-authentic content

IMAGE PROMPT QUALITY BAR: The image prompt must be detailed enough that a human photographer could recreate the exact shot. Include: focal length equivalent, f-stop feel, subject physical description, micro-expression or body language, environment texture, light quality and angle, depth of field layers, 2-3 photographer style anchors.

VIDEO PROMPT QUALITY BAR FOR ${targetModel}: ${videoQualityBar}

OUTPUT FORMAT (JSON only, no prose before or after):
{
  "imagePrompt": "hyper-detailed animatable frame prompt in EN — minimum 80 words — SHOT TYPE — LENS FEEL — SUBJECT physical description — FROZEN DYNAMIC ACTION — ENVIRONMENT specific details — LIGHTING direction+quality+temperature — DEPTH OF FIELD sharp vs bokeh — COLOR GRADE — STYLE ANCHORS",
  "imagePromptPtBr": "tradução PT-BR detalhada do image prompt",
  "visualNotes": "diretor notes: por que esta composição convida ao movimento de câmera",
  "animationPotential": "elementos específicos que vão animar: água, movimento de braço, direção do dolly, etc.",
  "videoPrompt": "${targetModel}-native prompt — must meet the quality bar for this model",
  "videoPromptPtBr": "tradução fiel + análise do diretor explicando cada escolha cinematográfica",
  "directorNotes": "rationale técnico: por que cada elemento do prompt foi escolhido para maximizar o output deste modelo específico",
  "audioInstructions": ${audioField},
  "lensMode": "${targetModel === "Seedance 1.5 Pro" ? "unfixed" : "fixed"}",
  "technicalSpecs": {
    "model": "${targetModel}",
    "duration": "${targetDuration}s",
    "aspectRatio": "${targetAspect}",
    "fixedLens": ${targetModel !== "Sora 2 Pro Max"},
    "audio": ${targetModel !== "Seedance 1.5 Pro"},
    "resolution": "1080p"
  },
  "warningsAndTips": ["3-5 hyper-specific tips for this exact scene on this model — not generic advice"],
  "extractedScene": "one precise sentence: WHO does WHAT WHERE in what LIGHT with what EMOTION",
  "suggestedAngle": "Alívio / Orgulho / Dinheiro / Raiva / Urgência — which fits best and why",
  "promptConfidenceScore": 0
}

CRITICAL RULE: Return ONLY raw JSON. Zero text outside JSON. Start with { end with }.`;
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
