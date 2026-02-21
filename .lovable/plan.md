
# Nova Aba: Criativos Ativos, Grid Instagram e Brand Kit

## Visao Geral

Criar 3 novas abas na navegacao principal que cobrem o ciclo completo de gestao visual:

1. **Criativos Ativos** -- Galeria dos criativos em producao/publicados com metricas de performance
2. **Grid Instagram** -- Mockup visual do feed 3x3 do Instagram para planejamento estetico
3. **Brand Kit** -- Central de identidade visual com upload de logos, paletas, fontes e templates

---

## 1. Estrutura de Banco de Dados

### Tabela `active_creatives`
Armazena os criativos publicados/ativos com metricas de performance.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | |
| user_id | uuid | Dono do criativo |
| title | text | Nome da peca |
| file_url | text | URL do arquivo (imagem/video) |
| thumbnail_url | text | Thumbnail para preview rapido |
| platform | text | Instagram, TikTok, LinkedIn, etc. |
| format_type | text | Feed, Stories, Reels, Carrossel |
| dimensions | text | Ex: 1080x1350 |
| campaign_id | text | Referencia a campanha (opcional) |
| status | text | draft, active, paused, archived |
| published_at | timestamptz | Data de publicacao |
| impressions | integer | |
| clicks | integer | |
| engagement_rate | numeric | |
| conversions | integer | |
| spend | numeric | Investimento na peca |
| tags | text[] | |
| notes | text | |
| grid_position | integer | Posicao no grid do Instagram |
| created_at / updated_at | timestamptz | |

### Tabela `brand_assets`
Armazena logos, icones, patterns e variacoes da identidade visual.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | |
| user_id | uuid | |
| asset_type | text | logo, logo_variation, icon, pattern, photo, illustration |
| name | text | Nome descritivo |
| file_url | text | URL no storage |
| thumbnail_url | text | |
| category | text | primary, secondary, monochrome, dark, light, horizontal, vertical |
| file_format | text | svg, png, jpg, ai, eps |
| width | integer | Largura em px |
| height | integer | Altura em px |
| file_size | integer | |
| tags | text[] | |
| usage_notes | text | Onde usar / nao usar |
| is_favorite | boolean | Marcado para acesso rapido |
| sort_order | integer | Ordem de exibicao |
| created_at | timestamptz | |

### Tabela `brand_colors`
Paleta de cores oficial da marca.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | |
| user_id | uuid | |
| name | text | Ex: "Laranja Principal" |
| hex_value | text | #FF8C00 |
| rgb_value | text | 255, 140, 0 |
| category | text | primary, secondary, accent, neutral, gradient |
| sort_order | integer | |
| created_at | timestamptz | |

### Tabela `brand_fonts`
Tipografia oficial.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | |
| user_id | uuid | |
| font_name | text | Ex: Montserrat |
| font_weight | text | Bold, Regular, Light |
| usage | text | headlines, body, caption, accent |
| font_url | text | URL do arquivo .woff2 (opcional) |
| sample_text | text | Texto de exemplo |
| sort_order | integer | |
| created_at | timestamptz | |

### Storage Bucket
- Criar bucket `brand-assets` (publico) para armazenar os arquivos de identidade visual

### RLS
- Todas as tabelas com politicas por `user_id = auth.uid()` para CRUD completo

---

## 2. Aba "Criativos Ativos" (`/criativos-ativos`)

### Layout e UX (Inspirado em Meta Ads Manager + Canva)

**Barra de filtros superior:**
- Filtro por plataforma (badges clicaveis: Instagram, TikTok, LinkedIn, etc.)
- Filtro por status (Ativo, Pausado, Arquivado)
- Filtro por formato (Feed, Stories, Reels, Carrossel)
- Toggle de visualizacao: Grid / Lista

**Grid principal (padrao):**
- Cards com preview visual do criativo (aspect-ratio real do formato)
- Abaixo do preview, mini-dashboard com 4 metricas em linha:
  - Impressoes | Cliques | Eng. Rate | Conversoes
- Badge de plataforma no canto superior esquerdo
- Badge de status no canto superior direito
- Nome da campanha associada como subtitulo
- Hover: overlay com acoes rapidas (ver detalhes, editar metricas, arquivar)

**Detalhes (dialog ao clicar):**
- Preview grande do criativo
- Metricas completas com mini-graficos de tendencia
- Dados da campanha vinculada
- Botao de duplicar como template

**KPI strip no topo:**
- Total de criativos ativos
- Engagement rate medio
- Melhor criativo (por conversao)
- Investimento total

---

## 3. Aba "Grid Instagram" (`/grid-instagram`)

### Layout e UX (Inspirado em Later, Planoly, Preview App)

**Mockup fiel do perfil Instagram:**
- Header com avatar circular, nome do perfil, bio simulada
- Contadores (posts, seguidores, seguindo)
- Grid 3 colunas com proporcao quadrada (1:1), gap de 3px como no Instagram real
- Fundo branco do card para simular a UI do Instagram

**Funcionalidades:**
- Drag-and-drop para reordenar as posicoes no grid (usando @dnd-kit ja instalado)
- Upload de novas imagens direto no grid
- Ao clicar numa posicao vazia: dialog para selecionar da `media_library` ou `active_creatives`
- Ao clicar numa imagem existente: preview com opcao de trocar, remover ou ver detalhes
- Indicador visual de "linha de corte" a cada 3 posts para ver como fica o feed completo

**Controles:**
- Toggle entre "Grid real" (1:1) e "Grid expandido" (aspect-ratio original)
- Numero de linhas visiveis (3, 6, 9 posts)
- Botao "Exportar Grid como PNG" para aprovacao

---

## 4. Aba "Brand Kit" (`/brand-kit`)

### Layout e UX (Inspirado em Canva Brand Kit + Frontify + Microsoft Brand Kit)

**Organizacao em secoes verticais com cards:**

### Secao 1: Logos e Variacoes
- Grid de cards com preview do logo
- Badge indicando tipo: Principal, Secundario, Monocromatico, Icone
- Upload com drag-and-drop
- Cada logo mostra: nome, formato do arquivo, dimensoes, tag de uso
- Botao "Copiar URL" para uso rapido nos criativos
- Favoritar com estrela para acesso rapido

### Secao 2: Paleta de Cores
- Circulos de cor grandes com hex/rgb abaixo
- Organizados por categoria (Primarias, Secundarias, Neutras, Gradientes)
- Click para copiar o hex code
- Botao para adicionar nova cor com color picker
- Preview de combinacoes (cor sobre cor para contraste)

### Secao 3: Tipografia
- Cards mostrando o nome da fonte renderizado no proprio estilo
- Indicacao de uso: Titulos, Corpo, Legenda, Destaque
- Peso da fonte (Bold, Regular, Light)
- Texto de exemplo editavel

### Secao 4: Templates Rapidos (futuro)
- Espaco reservado para pre-definicoes de layouts
- Combinacoes salvas de logo + cor + fonte para diferentes contextos

---

## 5. Navegacao

Adicionar 3 novos itens no `AppSidebar.tsx`:

| Titulo | Rota | Icone |
|--------|------|-------|
| Criativos Ativos | /criativos-ativos | Image (lucide) |
| Grid Instagram | /grid-instagram | Grid3X3 (lucide) |
| Brand Kit | /brand-kit | Palette (lucide) |

Registrar as 3 rotas no `App.tsx` e adicionar titulos no `AppLayout.tsx`.

---

## 6. Arquivos a Criar/Editar

### Novos arquivos:
- `src/pages/CriativosAtivos.tsx` -- Pagina da galeria de criativos ativos
- `src/pages/GridInstagram.tsx` -- Mockup do grid Instagram com drag-and-drop
- `src/pages/BrandKit.tsx` -- Central de identidade visual

### Arquivos a editar:
- `src/App.tsx` -- Adicionar 3 novas rotas
- `src/components/AppSidebar.tsx` -- Adicionar 3 itens de navegacao
- `src/components/AppLayout.tsx` -- Adicionar titulos/subtitulos das novas paginas

### Migracoes:
- Criar tabelas `active_creatives`, `brand_assets`, `brand_colors`, `brand_fonts`
- Criar bucket `brand-assets`
- RLS policies para todas as tabelas

---

## Detalhes Tecnicos

- **Drag-and-drop**: `@dnd-kit/core` + `@dnd-kit/sortable` (ja instalados)
- **Exportacao PNG**: `html-to-image` (ja instalado)
- **Upload de arquivos**: Lovable Cloud Storage (bucket `brand-assets`)
- **Preview de imagens**: Aspect-ratio real usando CSS `aspect-ratio` + `object-fit: cover`
- **Responsividade**: Grid adapta de 2 colunas (mobile) a 4-5 colunas (desktop)
- **Color picker**: Input nativo `type="color"` com display customizado
- **Copiar hex/URL**: `navigator.clipboard.writeText()` com toast de feedback
