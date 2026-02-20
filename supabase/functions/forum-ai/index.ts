import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000001";

const SYSTEM_PROMPT = `Você é o DQEF Assistant — IA estratégica do hub de marketing "Deixa que eu faço".
Sua função é auxiliar o time (Gabriel CMO, Guilherme Diretor Criativo, Marcelo CFO, Leandro CEO, Gustavo Dev) nas decisões de campanhas, tarefas e estratégias de lançamento da plataforma para o dia 15/03/2026.

**Contexto do projeto:**
- Campanha Awareness: 10 vídeos virais — prazo 22/02/2026 (URGENTE)
- Feed Instagram: 3 posts fixados (tutorial cadastro, institucional, tutorial uso) + 9 posts (4 vídeos, 2 carrosséis, 3 posts)
- Campanha Engajamento: 2 carrosséis, 4 vídeos, 3 posts por canal — foco em PRESTADORES primeiro
- Gabriel aprova todos os criativos feitos por Guilherme

**Você pode executar ações quando autorizado:**
- Comentar em tasks (action: "task_comment")
- Sugerir mudanças de estratégia (action: "strategy_change")
- Atualizar metas/OKRs (action: "goal_update")
- Fixar mensagens importantes (action: "pin")

**Formato de resposta:**
Responda de forma direta, objetiva e profissional. Use bullet points quando listar itens.
Se identificar uma ação necessária, indique claramente no formato:
[AÇÃO: tipo_da_acao | tarefa: nome | detalhe: informação]

Exemplos de comandos que você interpreta:
- "@DQEF comente na task X que Y"
- "@DQEF mude a estratégia para..."
- "@DQEF atualize a meta de..."
- "@DQEF fixe essa mensagem"
- "@DQEF qual o status da campanha?"
- "@DQEF priorize..."`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message, conversationHistory, authorName, authorRole } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Build message history for context
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(conversationHistory || []).slice(-10).map((m: { is_ai: boolean; content: string }) => ({
        role: m.is_ai ? "assistant" : "user",
        content: m.is_ai ? m.content : `[${authorName || "Usuário"}]: ${m.content}`,
      })),
      {
        role: "user",
        content: `[${authorName} - ${authorRole}]: ${message}`,
      },
    ];

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 1024,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit atingido. Aguarde e tente novamente." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos no workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "Não consegui processar sua solicitação.";

    // Detect actions in AI response
    const actionMatch = aiContent.match(/\[AÇÃO:\s*([^\|]+)\s*\|\s*tarefa:\s*([^\|]+)\s*\|\s*detalhe:\s*([^\]]+)\]/i);
    let metadata = null;
    let messageType = "message";

    if (actionMatch) {
      const actionType = actionMatch[1].trim();
      const taskTitle = actionMatch[2].trim();
      const detail = actionMatch[3].trim();

      messageType = actionType === "task_comment" ? "task_comment"
        : actionType === "strategy_change" ? "strategy_change"
        : actionType === "goal_update" ? "goal_update"
        : "system";

      metadata = {
        action: actionType,
        taskTitle,
        detail,
        timestamp: new Date().toISOString(),
      };
    }

    // Save AI message to forum
    const { data: savedMsg, error: saveError } = await supabase
      .from("forum_messages")
      .insert({
        user_id: SYSTEM_USER_ID,
        author_name: "DQEF Assistant",
        author_initials: "AI",
        author_role: "IA Estratégica",
        content: aiContent,
        is_ai: true,
        message_type: messageType,
        metadata,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving AI message:", saveError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: aiContent,
        messageType,
        metadata,
        savedMessage: savedMsg,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("forum-ai error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
