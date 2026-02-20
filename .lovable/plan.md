
## DQEF Hub — Plataforma Unificada de Marketing Operations + Analytics

Uma plataforma single-page que une o melhor dos dois projetos anteriores: a inteligência analítica do **dqf-marketing-dashboard** com a organização operacional do **dqf-marketing-planner** — tudo em React + Vite com identidade visual da marca, sem dependências de backend externo (dados via localStorage para MVP funcional imediato).

---

### Por que unificar em vez de separar?

Os dois projetos resolvem lados opostos do mesmo problema: o time de marketing da DQEF precisa **planejar** (planner) e **medir** (dashboard) no mesmo lugar. Alternar entre duas ferramentas quebra o fluxo. A plataforma unificada é o diferencial.

---

### Layout Global — Design System DQEF
- **Dark mode** como padrão: fundo `#0D0D0D` / `#111111` / `#1A1A1A`
- **Accent laranja** `#FF8A00` para ações primárias e destaques
- **Teal** `#00A7B5` para métricas e indicadores positivos
- Sidebar colapsável com logo DQEF, navegação por módulos e avatar de usuário
- Tipografia impactante nos dashboards, clean e funcional nos formulários
- Micro-animações suaves em transições e estados de hover

---

### Módulo 1 — Dashboard Executivo (inspirado no dqf-marketing-dashboard)
- **KPI Cards** principais: campanhas ativas, posts publicados no mês, taxa de conversão estimada, budget total alocado — tudo com variação percentual em relação à semana anterior
- **Health Score** da operação de marketing: score visual circular (0-100) calculado com base em campanhas no prazo, posts aprovados vs atrasados, e tarefas pendentes
- **Gráfico de tendência** de conteúdo publicado por canal (últimos 30 dias) usando Recharts
- **Timeline da semana**: próximas publicações programadas com status visual
- **Alertas inteligentes**: campanhas com prazo vencendo, conteúdos sem aprovador, posts sem copy finalizada
- **Quick actions**: criar campanha, adicionar conteúdo, ver kanban — acessível direto do dashboard

### Módulo 2 — Kanban de Campanhas (núcleo operacional)
- **5 colunas de fluxo**: Ideia → Em Desenvolvimento → Revisão → Aprovado → Publicado
- **Cards ricos**: nome da campanha, canal com ícone (Meta/Google/TikTok/LinkedIn/Orgânico), responsável com avatar, data limite com alerta de urgência, prioridade (Alta/Média/Baixa com cor), categoria (Awareness/Conversão/Retenção)
- **Drag-and-drop** entre colunas com animação suave
- **Criação rápida** de card via botão "+" em cada coluna — modal inline sem perder contexto
- **Filtros ativos**: por canal, por responsável, por prioridade — com chips removíveis
- **Contador por coluna**: número de itens + indicador de sobrecarga

### Módulo 3 — Calendário Editorial
- **Visão mensal** com grid de dias — cada dia mostra chips coloridos por tipo de conteúdo (Post, Reels, Stories, Carrossel, Ads)
- **Alternância de view**: Calendário ↔ Lista com toggle
- **Clique no dia** abre painel lateral com todos os conteúdos daquele dia e seus status
- **Criação de conteúdo** direto pelo calendário: clica no dia vazio e cria
- Legenda de cores por canal e por formato de conteúdo

### Módulo 4 — Linha Editorial e Biblioteca de Copies
- **4 abas navegáveis**:
  - **Copies Prontas** — cards com copy completa, canal-alvo, objetivo, botão "Copiar" e badge de categoria
  - **Roteiros de Carrossel** — os roteiros criados pelo Claude integrados, organizados por tema e público (prestadores, clientes)
  - **Ideias Disruptivas** — banco de ideias criativas com status (aprovada/pendente/descartada)
  - **Estratégia por Público** — personas e abordagens por segmento (prestador autônomo, MEI, empresa de serviços)
- **Busca global** dentro da biblioteca por palavra-chave
- **Filtro por canal** e por objetivo (Awareness/Engajamento/Conversão/Retenção)
- Todo o conteúdo dos 3 HTMLs fornecidos carregado como dado seed da aplicação

### Módulo 5 — Analytics de Performance (inspirado no dqf-marketing-dashboard)
- **Performance por canal**: tabela com campanhas ativas, status, impressões estimadas, cliques e CPC — dados mockados realistas com base nas metas do playbook
- **Funil de conversão visual**: Impressões → Cliques → Leads → Conversões com taxas entre etapas
- **Breakdown por público**: gráfico de pizza mostrando split entre prestadores vs clientes nas campanhas
- **Comparativo planejado vs real**: gráfico de barras com metas vs execução por semana
- **Health Score analítico**: percentual de campanhas no prazo, taxa de aprovação de conteúdos

### Módulo 6 — Gestão de Campanhas (CRUD Completo)
- **Lista de campanhas** com colunas: nome, canal, status, período, budget, fase do funil, responsável — ordenável e filtrável
- **Formulário de criação/edição**: nome, objetivo, público-alvo, canais, budget, período de início e fim, fase do funil (Topo/Meio/Fundo), status
- **Página de detalhe da campanha**: sub-tarefas vinculadas, copies associadas da biblioteca, links de assets, histórico de alterações
- **Status lifecycle**: Rascunho → Aprovada → Ativa → Pausada → Finalizada

---

### Dados e Persistência
- Todas as interações (criar campanha, mover kanban, agendar conteúdo) persistidas no **localStorage** — funciona 100% offline, sem backend
- Dados seed pré-carregados com as campanhas, copies e estratégias dos HTMLs fornecidos — a plataforma já nasce **populada com conteúdo real da DQEF**
- Estrutura preparada para futura integração com Supabase sem reescrita

### Identidade Visual
- Logo "Deixa que eu faço" na sidebar com gradiente laranja
- Paleta dark completa com variáveis CSS customizadas
- Ícones por canal: logos oficiais de Meta, Google, TikTok, LinkedIn como SVG inline
- Status badges com cores semânticas consistentes em toda a plataforma
- Empty states ilustrados com mensagens no tom cúmplice da marca
