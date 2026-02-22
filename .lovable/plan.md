
# Plano Final: Migração Completa de 9 Edge Functions + Weekly Strategy Review com Opus 4.6

## Resumo

Execução de 10 steps para migrar todas as edge functions para a arquitetura multi-LLM otimizada, adicionar análise estratégica semanal com Claude Opus 4.6, e resetar o Knowledge Base para reprocessamento.

---

## Step 1: Atualizar ai-router

Adicionar dois novos task_types ao TASK_CONFIG:
- `frame` -> `google/gemini-2.5-flash-image` (Lovable AI) para frames I2V
- `weekly_strategy` -> `anthropic/claude-opus-4` (OpenRouter) para análise semanal completa da operação

Sem outras alterações nos modelos existentes — os slugs `anthropic/claude-sonnet-4` e `anthropic/claude-opus-4` estão corretos para o OpenRouter.

## Step 2: Migrar generate-carousel-visual para ai-router (Claude Sonnet 4)

Trocar a chamada direta ao Lovable AI (`google/gemini-2.5-pro`, $10/1M output) por uma chamada interna ao ai-router com `task_type: "copy"` que roteia para Claude Sonnet 4 via OpenRouter.

A função `getStrategyContext()` continua intacta. O ai-router recebe os messages e retorna a resposta.

Padrão de migração:
```text
ANTES: fetch(LOVABLE_AI_URL, { model: "google/gemini-2.5-pro" })
DEPOIS: fetch(`${SUPABASE_URL}/functions/v1/ai-router`, { task_type: "copy", messages, user_id })
```

## Step 3: Migrar generate-carousel para ai-router (Claude Sonnet 4)

Mesmo padrão do Step 2. Trocar `google/gemini-2.5-flash` por ai-router `task_type: "copy"`.

## Step 4: Migrar categorize-media para ai-router

**NOTA IMPORTANTE**: `categorize-media` envia `image_url` inline no content (multimodal). DeepSeek V3 não suporta visão. A chamada será roteada via ai-router com `task_type: "classify"`, mas o ai-router tentará DeepSeek primeiro e, ao falhar por não suportar visão, fará fallback automático para Gemini 2.5 Flash Lite (Lovable AI). O tracking de custos fica centralizado de qualquer forma.

Alternativa: Manter Lovable AI direto para esta função específica, mas perder o tracking centralizado. Decisão: usar ai-router para centralizar o tracking, aceitando que o fallback será ativado para tarefas multimodais.

## Step 5: Migrar suggest-media para ai-router (DeepSeek)

Tarefa text-only (não envia imagem, apenas metadados). DeepSeek V3 funciona perfeitamente. Trocar Gemini Flash Lite por ai-router `task_type: "suggest"`.

## Step 6: Migrar analyze-benchmark para ai-router (Claude Sonnet 4)

Envia imagem base64. Claude Sonnet 4 suporta visão via OpenRouter. Análise de benchmark melhora significativamente com Claude. `task_type: "analyze"`.

## Step 7: Migrar analyze-brand-document para ai-router (Claude Sonnet 4)

Envia documento PDF como base64. Claude Sonnet 4 extrai metafields com maior precisão. `task_type: "analyze"`.

## Step 8: Otimizar fill-metafields-from-knowledge (Pro -> Flash)

Trocar modelo de `google/gemini-2.5-pro` ($10/1M output) para `google/gemini-2.5-flash` ($0.6/1M output). Chamada continua via Lovable AI direto (sem ai-router). Economia de 94%.

## Step 9: Migrar forum-ai e generate-campaign-plan para ai-router (Auto Router)

Ambas usam Gemini Flash direto. Migrar para ai-router `task_type: "auto"`, que roteia para `openrouter/auto` (NotDiamond seleciona o modelo ideal automaticamente).

## Step 10: Criar weekly-strategy-review + resetar Knowledge Base

**Nova Edge Function**: `weekly-strategy-review/index.ts`

Função que utiliza Claude Opus 4.6 via ai-router (`task_type: "weekly_strategy"`) para gerar uma análise estratégica completa da operação. Ela:
1. Carrega todo o Knowledge Base do usuário
2. Carrega metafields atuais
3. Carrega dados de campanhas, criativos, e uso de IA (ai_usage_log)
4. Gera insights acionáveis: o que está funcionando, o que ajustar, oportunidades, riscos
5. Retorna um JSON estruturado com recomendações priorizadas

**Reset do Knowledge Base**: Deletar os 4 registros da tabela `strategy_knowledge` para que os documentos sejam re-analisados pelo novo modelo (Claude Sonnet 4 ao invés de Gemini Flash).

**Registrar** a nova função no `supabase/config.toml`.

---

## Secao Tecnica

### Arquivos a editar (10):
| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/ai-router/index.ts` | +frame, +weekly_strategy task_types |
| `supabase/functions/generate-carousel-visual/index.ts` | Lovable AI -> ai-router (copy) |
| `supabase/functions/generate-carousel/index.ts` | Lovable AI -> ai-router (copy) |
| `supabase/functions/categorize-media/index.ts` | Lovable AI -> ai-router (classify) |
| `supabase/functions/suggest-media/index.ts` | Lovable AI -> ai-router (suggest) |
| `supabase/functions/analyze-benchmark/index.ts` | Lovable AI -> ai-router (analyze) |
| `supabase/functions/analyze-brand-document/index.ts` | Lovable AI -> ai-router (analyze) |
| `supabase/functions/fill-metafields-from-knowledge/index.ts` | gemini-2.5-pro -> gemini-2.5-flash |
| `supabase/functions/forum-ai/index.ts` | Lovable AI -> ai-router (auto) |
| `supabase/functions/generate-campaign-plan/index.ts` | Lovable AI -> ai-router (auto) |

### Arquivo a criar (1):
| Arquivo | Descricao |
|---------|-----------|
| `supabase/functions/weekly-strategy-review/index.ts` | Analise semanal Opus 4.6 |

### Config a editar (1):
| Arquivo | Mudanca |
|---------|---------|
| `supabase/config.toml` | +weekly-strategy-review |

### Dados a deletar:
```sql
DELETE FROM strategy_knowledge;
```

### Arquivos que NAO mudam (ja otimos):
- `generate-slide-image/index.ts` — usa modalities exclusivas Lovable AI
- `generate-video-assets/index.ts` — ja excelente com prompts por modelo
- `fill-playbook-from-knowledge/index.ts` — ja otimo com Flash
- `extract-strategy-metafields/index.ts` — ja otimo com Flash
