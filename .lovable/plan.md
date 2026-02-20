
# Nova Aba: AI Carrosséis — Output Visual HTML por Lâmina

## Visão do Produto

O objetivo é transformar a aba "AI Criativo" (atual) em uma ferramenta completa de geração de carrosséis onde o output **não é apenas texto**, mas sim um **artefato HTML visual interativo** — cada lâmina renderizada com tipografia real, paleta DQEF, hierarquia de texto e indicações de imagem/vídeo.

Inspirado diretamente nos HTMLs enviados (Roboto Condensed, JetBrains Mono, dark background `#0A0A0A`, laranja `#FF8A00`, estrutura editorial), o output deve se parecer com o que Claude Artifacts gerou: lâminas prontas para recortar, testar e copiar.

---

## O Que Será Criado

### 1. Nova Página: `/ai-carrosseis`

Uma experiência em duas colunas:
- **Esquerda**: Briefing estratégico (com opção de deixar em branco para a IA decidir)
- **Direita**: Output visual com as lâminas renderizadas em HTML

### 2. Novo Edge Function: `generate-carousel-visual`

Diferente do `generate-carousel` existente, este novo edge function retorna um schema muito mais rico:

```typescript
interface CarouselOutput {
  title: string;
  angle: string;               // ângulo escolhido pela IA
  angleRationale: string;      // por que esse ângulo agora
  targetProfile: string;
  channel: string;
  slides: SlideOutput[];
  caption: string;
  bestTime: string;
  viralLogic: string;
  designNotes: string;         // notas gerais de design
}

interface SlideOutput {
  number: number;
  type: 'hook' | 'setup' | 'data' | 'contrast' | 'validation' | 'cta';
  headline: string;            // texto principal (grande, impacto)
  headlineHighlight?: string;  // palavra em laranja dentro do headline
  subtext?: string;            // texto menor de suporte
  logic: string;               // "→ LÓGICA:" — o raciocínio da IA
  visualDirection: string;     // o que colocar visualmente
  needsMedia: boolean;         // precisa de foto/vídeo?
  mediaType?: 'photo' | 'video';
  mediaDescription?: string;   // descrição da imagem/vídeo
  veoPrompt?: string;          // prompt VEO 3.1 se for vídeo
  imagePrompt?: string;        // prompt Flux/Gemini se for imagem
  bgStyle: 'dark' | 'orange' | 'dark-red' | 'dark-green';
  layout: 'text-only' | 'text-photo-split' | 'number-dominant' | 'cta-clean';
}
```

### 3. Renderização Visual das Lâminas em React

Cada slide será renderizado como um componente React com estilos inline, imitando a estética dos HTMLs de referência:

- **Fundo**: `#0A0A0A` (padrão), `#0A2E1A` (verde para resolução), `#1A0000` (vermelho escuro para tensão)
- **Tipografia**: `Bebas Neue` (disponível via Google Fonts via CSS) para headlines; sans-serif regular para subtexto
- **Laranja**: `#FF8A00` para highlights, não como cor dominante
- **Proporção**: 4:5 (mobile-first, Instagram Feed) renderizado em miniatura responsiva

---

## Arquitetura das Mudanças

### Arquivos Novos

```
src/pages/AiCarrosseis.tsx          ← nova página principal
supabase/functions/generate-carousel-visual/index.ts   ← novo edge function
```

### Arquivos Modificados

```
src/App.tsx                         ← adicionar rota /ai-carrosseis
src/components/AppSidebar.tsx       ← adicionar item no nav
```

---

## Layout Detalhado da Página

### Cabeçalho
```
[ícone Layers] AI Carrosséis
Gere carrosséis completos com arte visual, copy e prompts de imagem por lâmina
```

### Coluna Esquerda — Briefing (colapsável)

**Seção: Contexto Estratégico** (opcional — se vazio, a IA decide)
- Textarea: "Descreva a ideia, ângulo ou deixe em branco para a IA criar do zero"
- Ângulo: 5 botões (Raiva / Dinheiro / Orgulho / Urgência / Alívio) + opção "IA Decide"
- Persona: grid igual ao Criativo atual
- Canal: chips (Instagram Feed / Stories / TikTok / LinkedIn)

**Seção: Estilo de Output**
- Formato: Tipográfico / Visual+Foto / Dados Dominantes
- Tom: Peer-to-peer / Editorial / Direto ao ponto

**Botão**: "Gerar Carrossel" — tamanho grande, laranja

### Coluna Direita — Output Visual

#### Header do Resultado
```
[TÍTULO DO CARROSSEL em Bebas Neue]
ÂNGULO: 🏆 ORGULHO · PERFIL: Piscineiro · CANAL: Instagram Feed
→ LÓGICA VIRAL: por que vai ser salvo/compartilhado
```

#### Grid de Lâminas (cada lâmina como card visual)

Cada lâmina será renderizada como um **mini-slide real**:

```
┌─────────────────────────────┐
│ 01 · GANCHO                 │  ← número + tipo em laranja
│                             │
│   Tu é bom no               │  ← headline Bebas Neue, branco
│   que faz.                  │     grande
│   O problema                │
│   não é TU.                 │  ← highlight em laranja
│                             │
│ [Fundo preto, só texto]     │
└─────────────────────────────┘
│ → LÓGICA: texto explicativo │  ← seção colapsável abaixo da lâmina
│ 📷 VISUAL: sem imagem       │
└─────────────────────────────┘
```

Para slides com `needsMedia: true`:
```
┌─────────────────────────────┐
│ 02 · SETUP                  │
│                             │
│ [Área de imagem]            │  ← placeholder visual
│                             │
│ 15 anos de profissão.       │
│ Ninguém te ensinou          │
│ a APARECER.                 │
└─────────────────────────────┘
│ → LÓGICA: ...               │
│ 📸 PROMPT IMAGEM:           │
│   [caixa copiável do        │
│    prompt em inglês]        │
│ 🎬 PROMPT VEO 3.1:         │  ← se for vídeo
│   [caixa copiável]          │
└─────────────────────────────┘
```

#### Footer do Resultado
```
[Caption para copiar]          [Melhor horário]
[Copiar tudo]  [Exportar HTML]
```

#### Botão "Exportar HTML"
Gera um arquivo HTML standalone no estilo dos documentos de referência enviados pelo usuário — com todas as lâminas formatadas, tipografia Google Fonts, cores DQEF, pronto para abrir no browser e recortar.

---

## Lógica do Edge Function `generate-carousel-visual`

### System Prompt (em português, estruturado)

O system prompt injeta:
1. **DNA DQEF**: posicionamento, comissão 10-15% vs 27%, PIX na hora, Florianópolis, verão
2. **Contexto de data**: Fevereiro 2026, pré-verão Floripa
3. **Diretrizes de tom**: peer-to-peer, números reais, frases curtas
4. **Regras de design por tipo de slide**:
   - `hook`: só texto, impacto máximo, sem imagem
   - `data`: número dominante em tipografia gigante (ex: "27%")
   - `contrast`: dois blocos visuais (problema vs solução)
   - `validation`: texto clean, emocional
   - `cta`: logo + ação clara + link na bio
5. **Instruções de imagem**: descrever a foto em inglês para Flux 1.1 Dev Pro ou Gemini Image
6. **Instruções de vídeo**: quando um slide for melhor como vídeo, gerar prompt VEO 3.1 com gramática nativa

### Lógica de IA Autônoma

Se o usuário deixar o briefing em branco, a IA:
1. Analisa o contexto (Fevereiro 2026, Floripa, pré-verão)
2. Escolhe o ângulo mais estratégico para o momento
3. Justifica a escolha no campo `angleRationale`
4. Gera o carrossel completo

Isso replica exatamente o comportamento do Perplexity mostrado pelo usuário.

---

## Componentes React

### `SlidePreview` — Renderização Visual
Componente que recebe um `SlideOutput` e renderiza:
- Background color baseado em `bgStyle`
- Headline com `Bebas Neue` via `@import` no CSS
- Highlight da palavra-chave em `#FF8A00`
- Número do slide + tipo em laranja pequeno
- Watermark DQEF no canto inferior direito

### `SlideMediaCard` — Prompts de Mídia
Exibido abaixo de cada slide quando `needsMedia: true`:
- Tipo de mídia (foto/vídeo)
- Prompt em inglês em caixa copiável (estilo `JetBrains Mono`)
- Botão copiar individual

### `CarouselExporter` — Exportação HTML
Função que serializa todos os slides num HTML standalone usando template string, com estilos inline, Google Fonts, e identidade visual DQEF. Download via `Blob` + `URL.createObjectURL`.

### `AngleRecommendation` — Card de Recomendação
Quando a IA escolheu o ângulo autonomamente, exibe um card no topo do resultado:
```
RECOMENDAÇÃO ESTRATÉGICA · FEVEREIRO 2026
ÂNGULO: 💸 DINHEIRO + ⏰ URGÊNCIA
Por que: [raciocínio da IA]
Alternativas consideradas: RAIVA · ORGULHO · ALÍVIO
```

---

## Detalhes Técnicos

### Tipografia nas Lâminas

Para renderizar `Bebas Neue` dentro dos slides React sem instalar fontes, usamos um `<style>` tag injetado:
```html
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Roboto+Condensed:wght@900&display=swap');
```

### Exportação HTML

O HTML exportado terá o mesmo estilo dos arquivos de referência enviados — topbar laranja, seções por slide, prompt boxes com `JetBrains Mono`, cores DQEF, pronto para screenshots e recorte.

### JSON Parsing Robusto

O edge function usará o mesmo `extractJSON()` helper já implementado em `generate-video-assets` para garantir que respostas com texto conversacional não quebrem o parse.

---

## Integração com a Página Existente

A página `Criativo.tsx` atual **não será alterada** — continua em `/criativo`. A nova página vai para `/ai-carrosseis` com entrada no sidebar como:

```
[ícone Layers] AI Carrosséis
```

---

## O Que Não Muda

- Página `Criativo.tsx` e rota `/criativo`
- Edge function `generate-carousel`
- Sidebar: apenas adiciona um novo item
- Design system geral do app (dark mode, laranja primário)
- Autenticação e proteção de rotas

---

## Resultado Final Esperado

1. **Usuário abre** `/ai-carrosseis`
2. **Pode deixar em branco** ou preencher o briefing
3. **Clica "Gerar"** — IA analisa o contexto, escolhe ângulo, justifica
4. **Vê o carrossel renderizado** — cada lâmina como arte real com fundo, tipografia, highlights em laranja
5. **Para slides com foto**: vê o prompt em inglês para Flux 1.1 Dev Pro em caixa copiável
6. **Para slides com vídeo**: vê o prompt VEO 3.1 com gramática nativa
7. **Clica "Exportar HTML"** — baixa o documento completo no estilo dos HTMLs de referência, pronto para abrir no browser e usar

