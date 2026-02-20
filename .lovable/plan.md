
# Upgrade Analytics & Dashboard — Incorporando o Melhor da AutoForge

## Diagnóstico Comparativo Senior

Após análise minuciosa dos screenshots da AutoForge vs nosso DQEF Hub, identifico **5 gaps críticos de inteligência** que precisam ser incorporados imediatamente:

**O que a AutoForge tem que NÃO temos (e que é core do negócio DQF):**

1. **Funil duplo Prestadores × Clientes** — A AutoForge trata os dois públicos como funis separados com métricas independentes. Isso é a lógica central do marketplace DQF: sem prestadores, não há app.

2. **Marketplace Health** — Uma página inteira dedicada a Liquidez (oferta/demanda por categoria), Churn de Clientes (5.5%), Churn de Prestadores (6.7%), Retenção em 30/60/90 dias, Taxa de Repetição. Isso é a inteligência operacional real do negócio.

3. **Unified Channels** — Tabela unificada com todos os canais lado a lado (TikTok, Meta, Instagram, Google, LinkedIn, Orgânico) com Score por canal (0-100), CAC, CTR, 1º Serviço e ROAS — com mini progress bars dentro da tabela.

4. **AI Insights acionáveis** — Painel de "Top 3 prioridades" com classificação de impacto (Alto/Médio/Oportunidade) gerado por IA, não apenas alertas de prazo.

5. **Prestadores Ativos + Clientes Ativos como KPIs de primeira linha** — Hoje o dashboard não exibe esse dado que é o coração da operação DQF.

**O que NÃO devemos copiar da AutoForge:** sidebar com muitos itens separados por seção (gera fragmentação). Nossa sidebar atual é mais clean e funcional.

---

## Arquitetura da Solução

Dois arquivos principais serão completamente reformulados:

**`src/pages/Index.tsx` (Dashboard)** — Incorporar 3 seções ausentes:
- KPIs: Prestadores Ativos + Clientes Ativos + GMV + CAC Médio (linha de topo junto com os existentes)
- Funis de Conversão duplos (Prestadores e Clientes, lado a lado)
- Insights com IA (painel de 3 prioridades com severidade)
- Liquidez do Marketplace (gauge de Oferta vs Demanda)
- Ações Rápidas (CTAs no rodapé como a AutoForge tem)

**`src/pages/Analytics.tsx`** — Transformar de página simples em hub multi-tab com 3 abas:
- **Canais Unificados**: tabela comparativa com todos os canais, Score, filtros Pago/Orgânico, mini bars inline, período selecionável
- **Marketplace Health**: Liquidez, Churn, Retenção 30/60/90d, Engajamento, Oferta vs Demanda por Categoria, GMV por Categoria
- **Funis de Conversão**: Funil Clientes vs Funil Prestadores com etapas detalhadas, taxas de conversão por etapa, comparativo

---

## Mudanças Técnicas Detalhadas

### 1. Dashboard (Index.tsx) — Adições

**Linha de KPIs expandida** (de 8 para 10 KPIs, scroll horizontal em mobile):
- Manter: Impressões, Leads, Conversões, Budget, Campanhas, ROAS, Posts, Cliques
- Adicionar: **Prestadores Ativos** (com delta semanal, ícone Users) e **Clientes Ativos** (com delta semanal)

**Funis Duplos** — substituir o funil único atual (que fica na col-1 do grid Row 2) por um card com duas colunas:
```
┌─ Funis de Conversão ──────────────────────────────────┐
│  👥 Clientes              🔧 Prestadores               │
│  Visitantes: 15.420       Visitantes: 8.750           │
│  Cadastros:  3.855 (25%)  Cadastros: 1.750 (20%)      │
│  Busca:      2.313 (60%)  Perfil:    1.050 (60%)      │
│  Solicitação: 925 (40%)   Proposta:   420 (40%)       │
│  Contratação: 463         Realizado:  294             │
└───────────────────────────────────────────────────────┘
```

**Insights com IA** — novo card `col-span-1`:
- 3 insights gerados estaticamente (podem ser dinâmicos futuramente)
- Cada insight tem: badge de impacto (Alto/Médio/Oportunidade), título, seta para expandir
- Baseados nos dados reais do dashboard: CAC, ROAS, leads

**Liquidez do Marketplace** — novo card `col-span-1`:
- Gauge linear horizontal: Falta Oferta — Equilibrado — Sobra Oferta
- Oferta: número de prestadores ativos
- Demanda: solicitações ativas
- Taxa de Match: barra de progresso

**Ações Rápidas** — rodapé do dashboard (como a AutoForge):
- 3 botões: "Ver Gargalos" (laranja), "Ver Canais" (laranja), "Gerar Relatório" (neutro)

### 2. Analytics.tsx — Refatoração Completa em 3 Abas

**Tab 1: Canais Unificados** (baseado no screenshot Unified Channels da AutoForge)
- Header com 4 KPIs globais: Canais Ativos, Investimento Total, Total de Cadastros, ROAS Médio
- Filtro: Todos / Pago / Orgânico
- Tabela comparativa com colunas: Canal, Tipo (badge Pago/Orgânico), Investimento, Impressões, Cliques, CTR, Cadastros, CAC, ROAS, Score
- Score colorido: verde (80-100), amarelo (60-79), vermelho (<60)
- Mini progress bars dentro das células de Investimento e Impressões
- Legenda do Channel Score no rodapé

**Tab 2: Marketplace Health** (baseado nos screenshots Marketplace Health)
- Seção Liquidez: Taxa de Liquidez com sparkline
- Seção Churn e Retenção: Churn de Clientes, Churn de Prestadores, Retenção 30/60/90d
- Seção Engajamento: Taxa de Repetição
- Oferta vs Demanda por Categoria: gráfico de barras agrupadas (azul=oferta, laranja=demanda)
- GMV por Categoria: lista horizontal com barras e valores

**Tab 3: Funis Detalhados** (evolução do funil atual, com dados duplos)
- Funil Clientes: todas as etapas com taxas
- Funil Prestadores: todas as etapas com taxas
- Comparativo Planejado vs Real (existente, mantido)
- Health Score Analítico (existente, mantido)

### 3. Seletor de Período Global

Ambas as páginas ganham um seletor de período no header (7 dias / 30 dias / 90 dias) — estético, não funcional ainda (preparando para integração futura com dados reais do banco), mas UI completa como a AutoForge tem.

---

## Dados Estáticos Realistas para os Novos Widgets

Os dados seguirão a lógica de negócio DQF (pré-inauguração 15/03/2026):

```typescript
// Marketplace data
const prestadoresAtivos = 470;
const clientesAtivos = 1450;
const solicitacoesAtivas = 980;
const taxaMatch = 70; // %
const gmv = 62000; // R$
const cac = 40.50; // R$

// Dual funnel — Clientes
const clienteFunnel = [
  { etapa: 'Visitantes', valor: 15420, pct: 100 },
  { etapa: 'Cadastros', valor: 3855, pct: 25 },
  { etapa: 'Busca Serviço', valor: 2313, pct: 60 },
  { etapa: 'Solicitação', valor: 925, pct: 40 },
  { etapa: 'Contratação', valor: 463, pct: 50 },
];

// Dual funnel — Prestadores
const prestadorFunnel = [
  { etapa: 'Visitantes', valor: 8750, pct: 100 },
  { etapa: 'Cadastros', valor: 1750, pct: 20 },
  { etapa: 'Perfil Completo', valor: 1050, pct: 60 },
  { etapa: 'Proposta Enviada', valor: 420, pct: 40 },
  { etapa: 'Serviço Realizado', valor: 294, pct: 70 },
];

// AI Insights
const aiInsights = [
  { impact: 'Alto', title: 'CAC do Meta Ads aumentou 23%', detail: 'Revisar segmentação...' },
  { impact: 'Médio', title: 'Taxa de conversão de cadastro caiu', detail: 'Onboarding com fricção...' },
  { impact: 'Oportunidade', title: 'LinkedIn Ads com ROAS acima da média', detail: 'Aumentar budget...' },
];
```

---

## Arquivos a Modificar

| Arquivo | Tipo de mudança |
|---|---|
| `src/pages/Index.tsx` | Adicionar 5 novos widgets, expandir KPI grid |
| `src/pages/Analytics.tsx` | Refatoração completa em 3 abas |

Nenhuma migração de banco necessária — todos os dados novos serão estáticos realistas, prontos para conectar ao banco quando a migração de campanhas for executada.

---

## O que NÃO será alterado

- AppSidebar — nossa navegação flat é superior à navegação por seções da AutoForge
- Kanban, Campanhas, Calendário, Fórum, Estratégia — não são escopo desta entrega
- Identidade visual — dark mode + laranja (#FF8A00) + teal permanece exatamente como está
