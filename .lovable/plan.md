
# Arquitetura Completa: DQEF Hub como Sistema Operacional de Marketing Digital

## Visao Geral

Redesenhar a arquitetura da plataforma DQEF como um sistema operacional completo para gestao de marketing digital, pilotado por um C-Level, com tres camadas de inteligencia:

1. **Camada Estrategica** -- Knowledge Base, Playbook, Meta-Fields, Orcamento
2. **Camada Operacional** -- Campanhas, Kanban, Calendario, Forum, Criativos
3. **Camada de Inteligencia** -- Motor de IA multi-modelo, DAM inteligente, Analytics preditivo

A integracao com Google Drive funciona como DAM externo sincronizado, e o OpenRouter serve como hub multi-LLM com roteamento inteligente por tarefa.

---

## 1. Google Drive como DAM Externo

### Viabilidade Confirmada

A Google Drive API v3 suporta:
- `files.list` com query `q` para buscar por `mimeType`, pasta pai, nome, labels
- `files.get` com `alt=media` para download direto de arquivos
- Thumbnails via `thumbnailLink` no metadata de cada arquivo
- Service Account com domain-wide delegation para acesso sem OAuth do usuario

### Estrutura de Pastas Recomendada no Drive da DQF

```text
DQF-DAM/
  |-- 01-BRAND/
  |     |-- logos/
  |     |-- cores/
  |     |-- fontes/
  |     |-- guidelines/
  |
  |-- 02-FOTOS/
  |     |-- pessoas/
  |     |-- ambientes/
  |     |-- produtos/
  |     |-- acoes/
  |     |-- equipamentos/
  |
  |-- 03-VIDEOS/
  |     |-- reels/
  |     |-- stories/
  |     |-- brutos/
  |
  |-- 04-TEMPLATES/
  |     |-- carrosseis/
  |     |-- posts/
  |     |-- stories/
  |
  |-- 05-REFERENCIAS/
  |     |-- benchmarks/
  |     |-- moodboards/
  |
  |-- 06-APROVADOS/
        |-- para-publicar/
        |-- publicados/
```

### Implementacao Tecnica

**Secret necessario:** `GOOGLE_SERVICE_ACCOUNT_JSON` -- JSON completo da Service Account com acesso ao Drive da DQF.

**Nova Edge Function: `drive-dam/index.ts`**

Operacoes:
- `list`: Lista arquivos de uma pasta especifica, retorna thumbnails + metadata
- `search`: Busca por nome, mimeType, ou texto no conteudo
- `download`: Retorna URL temporaria ou base64 de um arquivo
- `sync`: Sincroniza catalogo do Drive com tabela `dam_assets` no banco

O fluxo usa autenticacao Service Account via JWT assinado manualmente (sem SDK do Google -- apenas fetch + crypto para assinar o JWT no Deno).

### Nova Tabela: `dam_assets`

Cache local dos metadados do Drive para buscas rapidas sem chamar a API toda vez:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | |
| user_id | uuid | |
| drive_file_id | text | ID do arquivo no Google Drive |
| filename | text | Nome do arquivo |
| mime_type | text | image/jpeg, video/mp4, etc |
| thumbnail_url | text | Link do thumbnail do Drive |
| download_url | text | URL publica ou assinada |
| folder_path | text | Ex: 02-FOTOS/pessoas |
| category | text | pessoa, ambiente, produto, etc |
| tags | text[] | Tags extraidas por IA |
| description | text | Descricao gerada por IA |
| file_size | integer | |
| synced_at | timestamptz | Ultima sincronizacao |
| created_at | timestamptz | |

RLS: Filtrado por `user_id` para multi-tenant.

---

## 2. Motor de IA Multi-Modelo via OpenRouter

### Secrets Necessarios

- `OPENROUTER_API_KEY` -- ja fornecida pelo usuario (sera armazenada como secret seguro)

### Matriz Final de Modelos (Atualizada para Sonnet 4.6 / Opus 4.6)

```text
+------------------------------------+-------------------------------+-------------+-------------------+
| Tarefa                             | Modelo                        | Custo/call  | Razao             |
+------------------------------------+-------------------------------+-------------+-------------------+
| COPY (carrossel, caption, CTA)     | anthropic/claude-sonnet-4.6   | ~$0.015     | Melhor copy PT-BR |
| ANALISE ESTRATEGICA (playbook, KB) | anthropic/claude-opus-4.6     | ~$0.08      | Raciocinio max    |
| GERACAO DE IMAGEM (slide)          | black-forest-labs/flux.2-pro  | ~$0.04/img  | Qualidade+custo   |
| GERACAO IMAGEM HQ                  | google/gemini-3-pro-image     | ~$0.15/img  | Via Lovable AI    |
| CATEGORIZACAO (tags, classe)       | deepseek/deepseek-v3.2        | ~$0.0003    | Ultra-barato      |
| SUGESTAO DE MIDIA (ranking)        | deepseek/deepseek-v3.2        | ~$0.0003    | Ultra-barato      |
| BUSCA NO DAM (semantica)           | deepseek/deepseek-v3.2        | ~$0.0005    | Busca+ranking     |
| FORUM AI                           | openrouter/auto               | ~$0.003     | Auto-otimizado    |
| PLANO DE CAMPANHA                  | openrouter/auto               | ~$0.008     | Auto-otimizado    |
| PROMPTS DE VIDEO                   | google/gemini-2.5-flash       | ~$0.004     | Via Lovable AI    |
| ANALISE DE BENCHMARK               | anthropic/claude-sonnet-4.6   | ~$0.02      | Visao+copy        |
| REMIX DE CRIATIVO                  | black-forest-labs/flux.2-pro  | ~$0.04      | Image-to-image    |
| COMPOSICAO FINAL (arte)            | google/gemini-3-pro-image     | ~$0.15/img  | Composicao visual |
+------------------------------------+-------------------------------+-------------+-------------------+
```

### Nova Edge Function Central: `ai-router/index.ts`

Roteador inteligente que:
1. Recebe `task_type` + `messages` + `options`
2. Seleciona modelo e provider (OpenRouter vs Lovable AI)
3. Tenta provider principal, faz fallback automatico
4. Registra uso em `ai_usage_log`
5. Retorna resposta padronizada

```text
task_type -> provider:
  "copy"        -> OpenRouter (Claude Sonnet 4.6)
  "strategy"    -> OpenRouter (Claude Opus 4.6)
  "classify"    -> OpenRouter (DeepSeek V3.2)
  "image"       -> OpenRouter (FLUX.2 Pro)
  "image_hq"    -> Lovable AI (Gemini 3 Pro Image)
  "image_edit"  -> Lovable AI (Gemini 2.5 Flash Image)
  "video"       -> Lovable AI (Gemini 2.5 Flash)
  "auto"        -> OpenRouter (Auto Router)
  fallback      -> Lovable AI (Gemini 3 Flash Preview)
```

---

## 3. Workflow do Diretor Criativo Automatizado

O fluxo completo que substitui uma equipe criativa tradicional:

```text
ETAPA 1: BRIEFING
  Input do C-Level (contexto, angulo, canal)
       |
       v
ETAPA 2: ESTRATEGIA
  ai-router (task: "strategy", Claude Opus 4.6)
  -> Analisa Knowledge Base + Playbook + Meta-Fields
  -> Gera roteiro estruturado (5 slides)
  -> Define direcao visual por slide
       |
       v
ETAPA 3: BUSCA DE ATIVOS (antes de gerar)
  Para CADA slide que precisa de imagem:
    3a. Busca na media_library local (DeepSeek -- $0.0003)
    3b. Busca no DAM do Google Drive (DeepSeek -- $0.0005)
    3c. Rankeia resultados por relevancia semantica
    3d. Se score >= 8: sugere ao usuario
    3e. Se score < 8: marca para geracao
       |
       v
ETAPA 4: GERACAO DE ATIVOS (so se necessario)
  4a. Imagens sem match: FLUX.2 Pro ($0.04/img)
  4b. Imagens com referencia para remix: FLUX.2 Pro ($0.04)
  4c. Composicao final com texto: Gemini 3 Pro Image ($0.15)
       |
       v
ETAPA 5: COPY FINAL
  ai-router (task: "copy", Claude Sonnet 4.6)
  -> Refina headlines, subtext, CTA
  -> Gera caption completa com hashtags
  -> Valida contra tom de voz e topicos proibidos
       |
       v
ETAPA 6: REVISAO E EXPORTACAO
  -> Preview no formato correto (4:5, 16:9, etc)
  -> Ajustes manuais (slider de texto, troca de imagem)
  -> Exportacao PNG em alta resolucao
  -> Salva como rascunho no banco
```

---

## 4. Nova Tabela: `ai_usage_log`

Para controle de custos e analytics de uso:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | |
| user_id | uuid | |
| function_name | text | Edge function que chamou |
| task_type | text | copy, strategy, classify, image, etc |
| model_used | text | anthropic/claude-sonnet-4.6, etc |
| provider | text | openrouter, lovable |
| tokens_input | integer | |
| tokens_output | integer | |
| cost_estimate | numeric | Custo estimado em USD |
| latency_ms | integer | |
| success | boolean | |
| created_at | timestamptz | |

RLS: Cada usuario ve apenas seu proprio uso.

---

## 5. Estimativa de Custos Mensal (Revisada)

### Cenario "Time Enxuto" (3-5 pessoas, producao diaria)

```text
+-------------------------------+--------+--------------+---------------+
| Acao                          | Qtd/mes| Custo unit.  | Total/mes     |
+-------------------------------+--------+--------------+---------------+
| Roteiro carrossel (Sonnet)    | 80     | $0.015       | $1.20         |
| Analise estrategica (Opus)    | 10     | $0.080       | $0.80         |
| Busca DAM + biblioteca (DS)   | 300    | $0.0004      | $0.12         |
| Categorizacao media (DS)      | 150    | $0.0003      | $0.05         |
| Imagens FLUX.2 Pro            | 200    | $0.040       | $8.00         |
| Imagens HQ composicao final   | 30     | $0.150       | $4.50         |
| Analise benchmark (Sonnet)    | 15     | $0.020       | $0.30         |
| Analise docs KB (Opus)        | 8      | $0.080       | $0.64         |
| Plano campanha (Auto Router)  | 15     | $0.008       | $0.12         |
| Prompts video (Flash)         | 20     | $0.004       | $0.08         |
| Forum AI (Auto Router)        | 60     | $0.003       | $0.18         |
| Copy refinamento (Sonnet)     | 40     | $0.015       | $0.60         |
| Remix criativos (FLUX.2)      | 20     | $0.040       | $0.80         |
+-------------------------------+--------+--------------+---------------+
| TOTAL IA (OpenRouter + Lovable)|       |              | ~$17.39/mes   |
+-------------------------------+--------+--------------+---------------+
| Storage (Small instance)      |        |              | ~$0-25/mes    |
| Lovable Pro                   |        |              | $25/mes       |
+-------------------------------+--------+--------------+---------------+
| TOTAL PLATAFORMA              |        |              | ~$42-67/mes   |
+-------------------------------+--------+--------------+---------------+
```

Economia vs contratar equipe criativa: Uma equipe de designer + copywriter + estrategista custaria R$15.000-25.000/mes. A plataforma entrega resultado comparavel por ~R$350/mes.

---

## 6. Mapa Completo de Modulos e Integracao

```text
+------------------+     +------------------+     +------------------+
|   ESTRATEGIA     |     |   CAMPANHAS      |     |   ANALYTICS      |
|  - Playbook      |---->|  - Plano IA      |---->|  - KPIs          |
|  - Knowledge Base|     |  - Orcamento     |     |  - Funis         |
|  - Meta-Fields   |     |  - Tasks         |     |  - Deep Dive     |
|  - Benchmarks    |     |  - Calendario    |     |  - Alocacao $    |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         v                        v                        v
+------------------+     +------------------+     +------------------+
|   AI ROUTER      |<----|   CRIATIVO       |     |   DAM            |
|  - OpenRouter    |     |  - Carrosseis    |---->|  - Media Library  |
|  - Lovable AI    |     |  - Video IA      |     |  - Google Drive  |
|  - Usage Log     |     |  - Criativos     |     |  - Categorizacao |
|  - Fallback      |     |  - Grid IG       |     |  - Sugestao IA   |
+------------------+     +--------+---------+     +------------------+
                                  |
                                  v
                         +------------------+
                         |   BRAND KIT      |
                         |  - Cores         |
                         |  - Fontes        |
                         |  - Assets        |
                         |  - Guidelines    |
                         +------------------+
```

---

## 7. Implementacao: Ordem e Arquivos

### Fase 1 -- Infraestrutura (esta implementacao)

| # | Acao | Arquivo |
|---|------|---------|
| 1 | Armazenar `OPENROUTER_API_KEY` como secret | Secret Manager |
| 2 | Criar tabela `ai_usage_log` | Migration SQL |
| 3 | Criar tabela `dam_assets` | Migration SQL |
| 4 | Criar edge function `ai-router` | `supabase/functions/ai-router/index.ts` |
| 5 | Atualizar `supabase/config.toml` | Registrar ai-router |

### Fase 2 -- Otimizacao de Edge Functions Existentes

| # | Acao | Arquivo |
|---|------|---------|
| 6 | `generate-carousel-visual` usar ai-router (Sonnet para copy) | Editar index.ts |
| 7 | `categorize-media` usar ai-router (DeepSeek) | Editar index.ts |
| 8 | `suggest-media` usar ai-router (DeepSeek) | Editar index.ts |
| 9 | `analyze-benchmark` usar ai-router (Sonnet) | Editar index.ts |
| 10 | `analyze-brand-document` usar ai-router (Sonnet) | Editar index.ts |
| 11 | `fill-metafields-from-knowledge` trocar Pro por Flash | Editar index.ts |
| 12 | `forum-ai` usar ai-router (Auto) | Editar index.ts |

### Fase 3 -- Google Drive DAM

| # | Acao | Arquivo |
|---|------|---------|
| 13 | Solicitar `GOOGLE_SERVICE_ACCOUNT_JSON` | Secret Manager |
| 14 | Criar edge function `drive-dam` | `supabase/functions/drive-dam/index.ts` |
| 15 | Integrar busca DAM no `AiCarrosseis.tsx` | Editar pagina |

### Fase 4 -- Workflow Criativo Completo

| # | Acao | Arquivo |
|---|------|---------|
| 16 | Logica "buscar antes de gerar" no SlideCard | Editar `AiCarrosseis.tsx` |
| 17 | Painel de sugestoes unificado (biblioteca + DAM) | Editar `AiCarrosseis.tsx` |
| 18 | Badge de modelo usado em cada geracao | Editar `AiCarrosseis.tsx` |

---

## 8. O que NAO implementar agora

| Item | Razao |
|------|-------|
| Figma API | Read-only, nao cria designs |
| Google Calendar | Pode ser fase 5, nao e critico para o workflow criativo |
| Claude Code | E uma ferramenta de desenvolvimento, nao uma API de producao |
| Midjourney API | Nao tem API publica oficial |

---

## 9. Resumo Executivo

A arquitetura proposta transforma a DQEF de uma ferramenta de criacao de conteudo em um **sistema operacional de marketing digital** que:

- **Reduz custo operacional** de R$15-25k/mes (equipe) para ~R$350/mes (plataforma)
- **Usa o modelo certo para cada tarefa** -- Opus para estrategia, Sonnet para copy, DeepSeek para classificacao, FLUX para imagens
- **Economiza storage e tokens** buscando ativos existentes (Drive + biblioteca) antes de gerar novos
- **Mantem controle total de custos** via `ai_usage_log` com dashboard de analytics
- **Escala sem fricao** -- adicionar mais usuarios ou volume nao muda a arquitetura

A implementacao comeca pela Fase 1 (infraestrutura: ai-router + tabelas) e pode ser feita incrementalmente sem quebrar nada que ja existe.
