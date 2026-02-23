import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LOVABLE_AI_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

// Load generative playbook knowledge from database
async function loadImagePlaybook(): Promise<string> {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data } = await supabase
      .from("generative_playbooks")
      .select("knowledge_json")
      .eq("playbook_type", "image")
      .limit(1)
      .single();

    if (!data?.knowledge_json) return "";

    const k = data.knowledge_json as Record<string, unknown>;
    const brand = k.dqef_brand_visual as Record<string, string> || {};
    const formula = k.universal_formula || "";
    const elements = k.formula_elements as Record<string, Record<string, string>> || {};
    const rules = k.photorealism_rules as Record<string, string[]> || {};

    return `
PLAYBOOK DE IMAGEM GENERATIVA (conhecimento extraído de pesquisa profunda):

FÓRMULA UNIVERSAL DE PROMPT: ${formula}

ELEMENTOS OBRIGATÓRIOS DO PROMPT:
- CÂMERA: ${elements.camera?.vocabulary || ""}
- SUJEITO DQEF: ${brand.target_audience || ""}. Cor da marca: ${brand.brand_color || ""}. ${brand.must_have || ""}
- AMBIENTE: ${elements.environment?.dqef_contexts ? JSON.stringify((elements.environment as Record<string, unknown>).dqef_contexts) : ""}
- ILUMINAÇÃO: ${elements.lighting?.dqef_default || ""}
- ESTILO: ${elements.style?.dqef_default || ""}

REGRAS DE FOTORREALISMO:
DO: ${(rules.do || []).join(" | ")}
DON'T: ${(rules.dont || []).join(" | ")}

PROIBIDO: ${brand.forbidden || ""}
OBRIGATÓRIO: ${brand.must_have || ""}`;
  } catch (e) {
    console.error("Failed to load image playbook:", e);
    return "";
  }
}

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

    const { imagePrompt, quality = 'fast' } = await req.json();

    if (!imagePrompt) {
      return new Response(JSON.stringify({ error: 'imagePrompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use fast model for preview, high quality for final
    const model = quality === 'high'
      ? 'google/gemini-3-pro-image-preview'
      : 'google/gemini-2.5-flash-image';

    console.log(`Generating image with model: ${model}`);
    console.log(`Prompt: ${imagePrompt.slice(0, 100)}...`);

    // Load playbook knowledge from database
    const playbookKnowledge = await loadImagePlaybook();
    
    const brandGuidelines = `CRITICAL VISUAL RULES — FROM GENERATIVE PLAYBOOK RESEARCH:
The subject MUST be a Brazilian autonomous service provider (prestador de serviço), aged 35-50, with real worker appearance — calloused hands, work clothes or uniform (turquoise #00A7B5 polo/t-shirt), visible tools, real job site environment. 

PROMPT FORMULA: [Camera/Composition] + [Subject] + [Action/Pose] + [Environment] + [Lighting] + [Technical Style]

PHOTOREALISM REQUIREMENTS:
- Use camera language: "shot on 85mm lens, f/2.8, eye-level medium shot"
- Add imperfections for authenticity: "visible skin pores, slight sweat, dust particles in light"
- Environment must be Brazilian middle-class: ceramic tile floor, white walls, aluminum doors, tropical plants
- Lighting: Natural, warm (5500-6000K), golden hour or diffused window light. NEVER studio cold light.
- Style: "Photorealistic digital photography, 4K resolution. Cinematic with subtle orange-teal color grade. Minimal film grain for authenticity."

FORBIDDEN: young models, corporate environments, formal clothes, studio settings, American/European aesthetics, mansions
MANDATORY: weathered hands, work uniform, real tools, Brazilian residential architecture (60-90m² apartments), ethnic diversity

${playbookKnowledge}`;
    
    const enhancedPrompt = `${brandGuidelines}\n\n${imagePrompt}`;

    const response = await fetch(LOVABLE_AI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: enhancedPrompt,
          },
        ],
        modalities: ['image', 'text'],
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
    console.log('AI response keys:', Object.keys(aiResponse));

    // Extract image URL from response
    const message = aiResponse.choices?.[0]?.message;
    const imageUrl = message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error('No image in response:', JSON.stringify(aiResponse).slice(0, 500));
      return new Response(JSON.stringify({ error: 'Nenhuma imagem gerada. Tente novamente.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ imageUrl }), {
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
