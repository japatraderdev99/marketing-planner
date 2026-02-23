
# Redesign Completo da Aba Video IA -- Workflow Cinematografico com Integracao Estrategica

## Problema Atual

A aba Video IA funciona de forma isolada: aceita apenas texto livre ou cenas pre-definidas como input. Nao tem acesso a estrategia do playbook, campanhas ativas, biblioteca de ideias aprovadas, nem dados de performance dos criativos. O resultado e que os videos gerados podem nao estar alinhados com a estrategia vigente ou com os formatos que mais performam.

## Visao da Solucao

Transformar a aba em um hub de producao de video que puxa contexto automaticamente de todas as fontes estrategicas do sistema, apresentando-as como opcoes de input alem do texto livre.

## Arquitetura de Inputs Estrategicos

O briefing do video podera ser alimentado por 5 fontes de contexto:

```text
+-------------------+    +-------------------+    +-------------------+    +-------------------+    +-------------------+
|  TEXTO LIVRE      |    |  ESTRATEGIA       |    |  CAMPANHAS        |    |  BIBLIOTECA       |    |  PERFORMANCE      |
|  (atual)          |    |  Playbook +        |    |  Campanhas ativas |    |  Ideias aprovadas |    |  Top criativos    |
|  Cole/upload      |    |  Meta-fields +     |    |  com briefing,    |    |  status           |    |  por canal,       |
|  qualquer texto   |    |  Knowledge Base    |    |  objetivo, CTA    |    |  "para producao"  |    |  formato, copy    |
+-------------------+    +-------------------+    +-------------------+    +-------------------+    +-------------------+
```

## Mudancas Planejadas

### 1. Novo Layout da Pagina VideoIA.tsx

Substituir o layout atual (Express + Stepper separados) por um design com 3 abas:

**Aba "Express"** -- Manter o modo rapido atual, mas adicionar um painel colapsavel "Carregar Contexto Estrategico" que injeta automaticamente:
- Playbook salvo (localStorage `dqef-strategy-*`)
- Meta-fields do banco (`strategy_knowledge`)
- Append no campo de texto como contexto enriquecido

**Aba "Projeto de Video"** -- Workflow de 5 passos (conforme plano anterior aprovado):
- Passo 1 (Briefing): Reformulado com selecao de fonte de contexto
- Passos 2-5: Storyboard, Frames, Motion, Pipeline

**Aba "Meus Projetos"** -- Lista de projetos salvos (tabela `video_projects`)

### 2. Painel de Contexto Estrategico no Briefing (Passo 1)

Nova secao com cards clicaveis que carregam dados do sistema:

**Card "Estrategia"** (toggle):
- Busca playbook salvo em localStorage (`dqef-strategy-positioning`, `dqef-strategy-targetAudience`, etc.)
- Busca meta-fields do banco via `strategy_knowledge`
- Injeta posicionamento, publico-alvo, tom de voz e diferenciais como contexto

**Card "Campanhas"** (selector):
- Busca campanhas ativas do localStorage
- Lista campanhas com nome, objetivo, CTA, hook e angulo
- Ao selecionar uma campanha, injeta seu briefing como contexto do video

**Card "Biblioteca de Ideias"** (selector):
- Busca sugestoes com status `approved` ou `sent_to_production` do banco (`creative_suggestions`)
- Lista titulo, copy e direcao visual
- Ao selecionar, injeta como contexto

**Card "Performance" (futuro -- placeholder com badge "Em breve")**:
- Mostra que futuramente puxara dados de `active_creatives` (top CTR, top engajamento)
- Analisara formatos e copys que mais performam por canal
- Por enquanto, exibe badge "Em breve" e nao carrega dados

### 3. Integracao no Backend (generate-video-assets)

Atualizar a edge function para aceitar um campo `strategyContext` opcional no body:
- Se presente, injeta no system prompt antes da geracao
- Combina com o playbook ja carregado do banco (`generative_playbooks`)
- Garante que frame prompts e motion prompts reflitam o objetivo estrategico

Adicionar operacoes para o workflow de projeto:
- `storyboard`: gera estrutura multi-shot a partir do briefing enriquecido
- `shot_frame_prompt`: gera frame prompt por shot individual
- `shot_motion_prompt`: gera motion prompt por shot individual

### 4. Tabela video_projects (migracao)

Criar tabela para persistir projetos de video com RLS por usuario:
- `id`, `user_id`, `title`, `concept`, `briefing_data` (JSONB com todas as fontes de contexto selecionadas)
- `storyboard` (JSONB array de shots), `shot_frames`, `shot_motions` (JSONB)
- `status` (draft/in_production/done), `created_at`, `updated_at`

## Detalhes Tecnicos

### Fontes de dados e como acessar cada uma:

| Fonte | Armazenamento | Acesso |
|-------|--------------|--------|
| Playbook | localStorage `dqef-strategy-*` | `useLocalStorage` hook |
| Meta-fields | `strategy_knowledge` table | `supabase.from('strategy_knowledge')` |
| Campanhas | localStorage `dqef-campaigns` | `useLocalStorage` hook |
| Ideias aprovadas | `creative_suggestions` table | `supabase.from('creative_suggestions').eq('status', 'approved')` |
| Performance (futuro) | `active_creatives` table | Query com aggregacao por canal |

### Componentes novos a criar:

- `StrategyContextPanel` -- painel com toggles/selectors para cada fonte
- `VideoProjectWorkflow` -- stepper de 5 passos
- `ShotCard` -- card visual por shot no storyboard
- `VideoProjectsList` -- lista de projetos salvos

### Arquivos a modificar:

1. **`src/pages/VideoIA.tsx`** -- Reescrever com 3 abas e painel de contexto estrategico
2. **`supabase/functions/generate-video-assets/index.ts`** -- Adicionar operacoes `storyboard`, `shot_frame_prompt`, `shot_motion_prompt` + aceitar `strategyContext`
3. **Nova migracao SQL** -- Tabela `video_projects` com RLS

### Fluxo principal (Projeto de Video):

1. Usuario abre aba "Projeto de Video"
2. No Passo 1 (Briefing), ativa toggles de contexto: Estrategia ON, seleciona Campanha X, seleciona Ideia Y
3. O sistema monta um briefing enriquecido combinando todas as fontes
4. Clica "Gerar Storyboard" -- IA recebe todo o contexto e gera 3-5 shots
5. Para cada shot: gera frame prompt (com playbook de imagem injetado) e motion prompt (com playbook de video injetado)
6. Gate de aprovacao por shot antes de avancar
7. Pipeline final com checklist de exportacao para Higgsfield

## Prioridade de Implementacao

1. Criar tabela `video_projects` (migracao)
2. Reescrever `VideoIA.tsx` com 3 abas + painel de contexto estrategico no briefing
3. Atualizar `generate-video-assets` com novas operacoes e `strategyContext`
4. Card de Performance como placeholder "Em breve"
