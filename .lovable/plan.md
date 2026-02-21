
# Analytics por Canal de Aquisicao + Alocacao de Verba do CMO

## Visao Geral

Duas grandes entregas na pagina de Analytics:

1. **Nova aba "Deep Dive por Canal"** -- Ao clicar num canal na tabela de Canais Unificados, abre uma visualizacao detalhada com funil completo, metricas de conversao, tendencia temporal e benchmarks daquele canal especifico.

2. **Nova aba "Alocacao de Verba"** -- Interface visual para o CMO distribuir o budget total entre os canais de aquisicao, com sliders interativos, barra de saldo restante em tempo real e comparativo de ROI por real investido.

---

## 1. Nova Aba: "Deep Dive por Canal"

### Dados por canal (dataset estatico, mesmo padrao existente)

Para cada canal (Meta Ads, TikTok, Instagram, Google Ads, LinkedIn, Organico), exibir:

**KPI Strip (4 cards):**
- Investimento total no canal
- CAC (Custo por Aquisicao)
- ROAS
- Cadastros gerados

**Funil do canal (vertical, mesmo componente visual dos funis existentes):**
- Impressoes -> Cliques -> Leads -> Cadastros -> Conversoes
- Taxa de conversao entre cada etapa
- Barras horizontais com porcentagem

**Grafico de tendencia (AreaChart):**
- Evolucao semanal de cadastros e spend do canal (6-8 semanas)
- Dupla linha: investimento vs resultado

**Tabela de campanhas do canal:**
- Listar campanhas associadas ao canal selecionado
- Colunas: Nome, Status, Budget, Leads, ROAS
- Ordenavel por ROAS

### Interacao
- Adicionar nova aba "Por Canal" no TabsList existente do Analytics
- Dropdown ou badges clicaveis para selecionar o canal
- Ao selecionar, o painel abaixo atualiza com dados do canal

---

## 2. Nova Aba: "Alocacao de Verba"

### Layout (inspirado em ferramentas de portfolio allocation como Betterment/Wealthfront)

**Header:**
- Budget total editavel (input numerico grande, estilo hero)
- Barra horizontal mostrando a distribuicao atual (stacked bar colorida por canal)
- Indicador de "Verba restante" que atualiza em tempo real

**Painel de canais (grid de cards, um por canal):**

Cada card contem:
- Nome do canal + icone + cor identificadora
- Slider horizontal (Radix Slider) para ajustar % ou valor absoluto
- Toggle para alternar entre % e R$
- Input numerico para ajuste fino
- Mini KPIs do canal: CAC, ROAS, Score (para informar a decisao)
- Barra de comparacao: "Investimento atual vs recomendado pela IA"

**Barra de resumo inferior (sticky):**
- Total alocado / Budget total
- Verba restante (destaque vermelho se negativo, verde se positivo)
- Botao "Salvar alocacao"
- Botao "Sugerir com IA" (futuro)

**Stacked bar visual no topo:**
- Barra horizontal dividida por cores dos canais
- Proporcao visual de cada canal
- Atualiza dinamicamente conforme os sliders mudam
- Tooltip ao hover mostrando canal + valor + %

### Persistencia
- Salvar alocacao em localStorage (chave `dqef-budget-allocation`)
- Estrutura: `{ totalBudget: number, channels: { [channel: string]: { amount: number, pct: number } } }`

---

## 3. Alteracoes

### Arquivo: `src/pages/Analytics.tsx`

**Adicionar duas novas abas ao TabsList:**
- "Por Canal" (value="por-canal")
- "Alocacao de Verba" (value="verba")

**Novos componentes internos:**
- `function ChannelDeepDive({ period })` -- Painel de deep dive por canal selecionado
- `function BudgetAllocation()` -- Interface de alocacao de verba com sliders

**Novos datasets estaticos:**
- `channelFunnelData` -- Funil por canal (6 canais x 5 etapas)
- `channelTrendData` -- Tendencia semanal por canal
- `defaultBudgetAllocation` -- Alocacao inicial padrao

**Novos subcomponentes:**
- `function ChannelSelector({ selected, onSelect })` -- Badges de selecao de canal
- `function ChannelFunnel({ channel })` -- Funil vertical do canal
- `function ChannelTrend({ channel })` -- Grafico de tendencia
- `function BudgetSliderCard({ channel, value, max, onChange, kpis })` -- Card com slider
- `function BudgetSummaryBar({ allocation, total })` -- Barra stacked de resumo
- `function RemainingBudget({ remaining, total })` -- Indicador de saldo

### Nenhuma nova tabela no banco de dados
- Todos os dados sao estaticos (mesmo padrao existente)
- Alocacao de verba persiste em localStorage

### Nenhum arquivo novo
- Tudo implementado dentro de `Analytics.tsx` seguindo o padrao existente

---

## Detalhes Tecnicos

- **Sliders**: Componente `Slider` do Radix ja disponivel em `src/components/ui/slider.tsx`
- **Graficos**: Recharts (AreaChart, BarChart) ja importados no Analytics
- **LocalStorage**: Hook `useLocalStorage` ja disponivel
- **Cores por canal**: Reutilizar mapeamento `CHANNEL_COLORS` do Campanhas
- **Stacked bar**: CSS puro com `flex` e `width` proporcional (sem biblioteca adicional)
- **Responsividade**: Grid adapta de 1 coluna (mobile) a 3 colunas (desktop) nos cards de alocacao
- **Interatividade**: `useState` para canal selecionado e alocacoes; debounce nos sliders via `onChange`
