
# Workflow de Campanha para Tarefas Criativas -- Pipeline CMO-para-Diretor-Criativo

## Problema

Hoje, quando Gabriel (CMO) cria uma campanha, as tarefas geradas pela IA sao genericas: nao tem formato em pixels, nao linkam para a ferramenta criativa correta, nao carregam o contexto da campanha, e nao tem gate de aprovacao formal entre Gabriel e Guilherme. O Kanban e o Calendario tambem usam o mesmo modelo `Campaign` para tudo, dificultando a distincao entre campanha-mae e tarefa criativa.

## Visao da Solucao

Quando Gabriel aprovar uma campanha (ou aplicar um plano de IA), o sistema gera **tarefas criativas estruturadas** no banco de dados, cada uma com:
- Vinculo a campanha-mae (campaign_id)
- Formato exato em pixels (ex: 1080x1350 para Vertical Feed Instagram)
- Tipo criativo que determina qual ferramenta usar (Carrossel -> /criativo, Video -> /video-ia, Post -> /criativo)
- Responsavel (Guilherme por padrao) e aprovador (Gabriel por padrao)
- Deadline que aparece automaticamente no Calendario
- Status de aprovacao (pendente / aprovado / rejeitado com nota)

## Mudancas no Banco de Dados

### Nova tabela: `campaign_tasks`

```sql
CREATE TABLE campaign_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  campaign_id TEXT NOT NULL,          -- ID da campanha (localStorage)
  campaign_name TEXT NOT NULL,        -- Nome da campanha para exibicao
  
  -- Tarefa
  title TEXT NOT NULL,
  description TEXT,
  creative_type TEXT NOT NULL,        -- 'carrossel' | 'reels' | 'stories' | 'post' | 'video' | 'ads'
  channel TEXT NOT NULL,              -- 'Instagram' | 'TikTok' etc.
  format_width INTEGER,              -- ex: 1080
  format_height INTEGER,             -- ex: 1350
  format_ratio TEXT,                 -- ex: '4:5'
  format_name TEXT,                  -- ex: 'Vertical Feed (Portrait)'
  
  -- Workflow
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'in_progress' | 'in_review' | 'approved' | 'rejected' | 'published'
  priority TEXT NOT NULL DEFAULT 'Media',
  assigned_to TEXT NOT NULL DEFAULT 'Guilherme',
  approved_by TEXT,
  approval_note TEXT,
  
  -- Datas
  deadline DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Contexto criativo (da campanha)
  campaign_context JSONB DEFAULT '{}',  -- objetivo, CTA, hook, angulo, publico, meta-fields
  creative_output JSONB DEFAULT '{}',   -- resultado do criativo gerado (slides, prompts etc.)
  
  -- Meta
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

RLS: usuario pode CRUD nos proprios registros. Politicas padrao `auth.uid() = user_id`.

### Motivacao para banco de dados (nao localStorage)

- Tarefas precisam ser compartilhadas entre Gabriel e Guilherme (mesma organizacao)
- Historico de aprovacao persistente
- Possibilita futuramente notificacoes e dashboards de accountability
- Evita perda de dados criticos de producao

## Mudancas na UI

### 1. Campanhas.tsx -- Geracao automatica de tarefas

Quando o CMO clica "Aplicar Plano" (handleApplyPlan) ou cria uma campanha manualmente:

- O sistema analisa os canais e formatos selecionados
- Para cada combinacao canal+formato, cria uma `campaign_task` no banco
- Cada tarefa recebe automaticamente:
  - O formato em pixels correto (consultando o mapa de formatos do Formatos.tsx)
  - O `creative_type` que determina a rota da ferramenta (`/criativo` para Carrossel/Post, `/video-ia` para Reels/Shorts/Video)
  - O contexto da campanha (objetivo, CTA, hook, angulo emocional, publico-alvo)
  - Deadline calculada a partir da data de inicio da campanha
  - Guilherme como responsavel e Gabriel como aprovador

Apos a criacao, mostra um toast com link para o Kanban: "X tarefas criadas para Guilherme"

### 2. Kanban.tsx -- Leitura hibrida (localStorage + banco)

O Kanban passa a exibir dois tipos de cards:
- **Cards de campanha** (localStorage, como hoje) -- mantidos para compatibilidade
- **Cards de tarefa criativa** (banco `campaign_tasks`) -- novos, com visual diferenciado

Os cards de tarefa criativa exibem:
- Badge com nome da campanha-mae
- Canal + formato em pixels (ex: "Instagram -- 1080x1350 -- 4:5")
- Botao "Abrir Ferramenta" que navega para a rota correta com query params do contexto
- Status de aprovacao com avatar do aprovador
- Responsavel (Guilherme) e deadline

Mapeamento de colunas:
- `pending` -> coluna "Ideias"
- `in_progress` -> coluna "Em Producao"
- `in_review` -> coluna "Revisao"
- `approved` -> coluna "Aprovado"
- `published` -> coluna "Publicado"

### 3. Calendario.tsx -- Exibicao de deadlines de tarefas

O Calendario passa a tambem mostrar as tarefas criativas do banco, alem dos ContentItems do localStorage. As tarefas aparecem com icone diferenciado (ex: paleta para criativo, camera para video) e badge da campanha.

### 4. Deep-linking para ferramentas criativas

Quando Guilherme clica "Abrir Ferramenta" no card da tarefa:
- O sistema navega para `/criativo?taskId=UUID` ou `/video-ia?taskId=UUID`
- A pagina de destino carrega o contexto da tarefa via query param
- Pre-preenche: canal, formato, dimensoes, objetivo, angulo, CTA, publico
- Guilherme trabalha no criativo com todo o direcionamento da campanha

### 5. Aprovacao no Kanban

Quando a tarefa chega na coluna "Revisao":
- O card mostra botoes "Aprovar" e "Rejeitar" (visiveis para Gabriel)
- Aprovar move para "Aprovado" e registra `approved_by` + timestamp
- Rejeitar pede uma nota de feedback e volta para "Em Producao"

## Mapa de Formatos Automatico

O sistema usa um mapa interno para determinar dimensoes a partir de canal+formato:

```text
Instagram + Carrossel -> 1080x1080 (1:1) ou 1080x1350 (4:5)
Instagram + Reels     -> 1080x1920 (9:16)
Instagram + Stories   -> 1080x1920 (9:16)
Instagram + Post      -> 1080x1350 (4:5)
TikTok + Video        -> 1080x1920 (9:16)
YouTube + Shorts      -> 1080x1920 (9:16)
LinkedIn + Post       -> 1200x627 (1.91:1)
Meta Ads + Ads        -> 1080x1080 (1:1)
```

Este mapa e extraido dos dados ja existentes em Formatos.tsx e embutido como constante compartilhada.

## Arquivos a Modificar/Criar

1. **Nova migracao SQL** -- Tabela `campaign_tasks` com RLS e trigger de `updated_at`
2. **`src/data/formatSpecs.ts`** (novo) -- Mapa de canal+formato -> dimensoes em pixels (extraido de Formatos.tsx)
3. **`src/pages/Campanhas.tsx`** -- Adicionar geracao de tarefas no `handleApplyPlan` e `handleSave`, inserindo no banco via Supabase
4. **`src/pages/Kanban.tsx`** -- Adicionar leitura de `campaign_tasks` do banco, cards de tarefa criativa com botao de ferramenta e aprovacao
5. **`src/pages/Calendario.tsx`** -- Adicionar leitura de `campaign_tasks` para exibir deadlines
6. **`src/pages/Criativo.tsx`** -- Aceitar `?taskId=` query param para pre-carregar contexto da tarefa
7. **`src/pages/VideoIA.tsx`** -- Aceitar `?taskId=` query param para pre-carregar contexto da tarefa no briefing

## Fluxo Completo

```text
Gabriel (CMO)                          Guilherme (Dir. Criativo)
     |                                        |
     |-- Cria campanha em /campanhas           |
     |-- Preenche: canal, formato,             |
     |   objetivo, CTA, publico                |
     |-- Gera plano com IA (opcional)          |
     |-- Clica "Aplicar Plano"                 |
     |                                         |
     |-- Sistema cria N tarefas criativas ---->|
     |   no banco com formato em pixels,       |
     |   contexto da campanha e deadline       |
     |                                         |
     |                                         |-- Ve tarefas no Kanban
     |                                         |-- Clica "Abrir Ferramenta"
     |                                         |-- Cria o criativo com contexto
     |                                         |   pre-carregado da campanha
     |                                         |-- Move para "Revisao"
     |                                         |
     |<-- Card aparece em "Revisao" -----------|
     |-- Revisa o criativo                     |
     |-- Aprova ou rejeita com nota            |
     |                                         |
     |                                         |-- Se rejeitado: ajusta e reenvia
     |                                         |-- Se aprovado: move para publicacao
```

## Detalhes Tecnicos

### Queries Supabase no frontend

- `Kanban.tsx`: `supabase.from('campaign_tasks').select('*').eq('user_id', user.id).order('created_at')`
- `Calendario.tsx`: `supabase.from('campaign_tasks').select('id, title, channel, creative_type, deadline, status, campaign_name').eq('user_id', user.id)`
- `Campanhas.tsx` (insert): `supabase.from('campaign_tasks').insert([...tasks])`
- Aprovacao: `supabase.from('campaign_tasks').update({ status, approved_by, approval_note }).eq('id', taskId)`

### Pre-carregamento de contexto nas ferramentas

O `campaign_context` JSONB armazena:
```json
{
  "objective": "Gerar awareness sobre servicos de eletricista",
  "cta": "Baixe o app DQEF",
  "hook": "Voce sabe quanto um eletricista perde por mes?",
  "emotionalAngle": "Dinheiro",
  "targetAudience": "Prestadores de servico 30-50 anos",
  "keyMessage": "A DQEF valoriza seu trabalho",
  "funnel": "Topo",
  "metafields": { ... }
}
```

### Prioridade de implementacao

1. Criar tabela `campaign_tasks` (migracao)
2. Criar `src/data/formatSpecs.ts` com mapa de dimensoes
3. Atualizar `Campanhas.tsx` para gerar tarefas no banco
4. Atualizar `Kanban.tsx` para exibir tarefas do banco com cards diferenciados
5. Atualizar `Calendario.tsx` para exibir deadlines
6. Adicionar deep-linking em `Criativo.tsx` e `VideoIA.tsx`
