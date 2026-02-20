
# AI Carrosséis — Geração de Imagem por Lâmina + Export PNG

## O Problema Identificado na Screenshot

A tela atual mostra que os slides com `needsMedia: true` renderizam um placeholder escuro com ícone no topo da lâmina, criando um overlay que atrapalha a legibilidade do texto. O objetivo é:

1. **Gerar a imagem de fundo** via IA usando o `imagePrompt` já produzido pelo edge function
2. **Exibir como background real** da lâmina, com o texto DQEF sobreposto
3. **Exportar cada lâmina como PNG** em alta resolução

---

## Tecnologias Confirmadas na Pesquisa

### Geração de Imagem
A Lovable AI Gateway suporta nativamente:
- `google/gemini-2.5-flash-image` — mais rápido (bom para preview)
- `google/gemini-3-pro-image-preview` — maior qualidade

O retorno é um `data:image/png;base64,...` que pode ser usado diretamente como `background-image` no CSS.

### Export PNG por Slide
A biblioteca **`html-to-image`** (npm, MIT License) converte qualquer `div` React em PNG usando SVG + Canvas:
```ts
import { toPng } from 'html-to-image';
toPng(ref.current, { pixelRatio: 2 }) // 2x para alta resolução
  .then(dataUrl => { /* download */ });
```
É superior ao `html2canvas` para este caso porque lida melhor com fontes customizadas e CSS moderno.

---

## Arquitetura das Mudanças

```text
NOVO: supabase/functions/generate-slide-image/index.ts
   ↳ Recebe { imagePrompt: string, quality: 'fast' | 'high' }
   ↳ Chama gemini-2.5-flash-image (fast) ou gemini-3-pro-image-preview (high)
   ↳ Retorna { imageUrl: "data:image/png;base64,..." }

MODIFICADO: src/pages/AiCarrosseis.tsx
   ↳ Instala html-to-image (nova dependência npm)
   ↳ Estado por lâmina: slideImages: Record<number, string>
   ↳ Estado de loading por lâmina: generatingImage: Record<number, boolean>
   ↳ SlidePreview: aceita imageUrl? prop → renderiza como background-image com gradient overlay
   ↳ SlideCard: adiciona botões Gerar Imagem / Trocar / Baixar PNG
   ↳ Cada slide tem um ref para o elemento DOM → usado pelo toPng()
```

---

## Detalhes Técnicos

### 1. Novo Edge Function: `generate-slide-image`

Endpoint simples e focado. Recebe o `imagePrompt` da lâmina e retorna base64:

```ts
// Entrada
{ imagePrompt: string, quality: 'fast' | 'high' }

// Lógica
const model = quality === 'high'
  ? 'google/gemini-3-pro-image-preview'
  : 'google/gemini-2.5-flash-image';

// Resposta AI Gateway
const imageUrl = response.choices[0].message.images[0].image_url.url;
// → "data:image/png;base64,..."

// Saída
{ imageUrl: string }
```

### 2. Overlay da Imagem na Lâmina

Quando `imageUrl` existe, o `SlidePreview` renderiza:
```
[Div laranja #E8603C — fundo]
  └── [background-image: url(imageUrl), object-fit: cover, opacity: 0.55]
  └── [gradient: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 50%)]
  └── [Texto DQEF — z-index acima, sem mudança]
```

O fundo laranja permanece visível nos slides sem imagem — a identidade da marca não quebra. Quando há imagem, ela fica como background com opacity controlada para que o texto branco Montserrat 900 continue legível.

O usuário pode ajustar manualmente clicando "Trocar" para regenerar apenas aquela lâmina.

### 3. UX dos Botões por Lâmina

Cada `SlideCard` ganha uma barra de ações abaixo do slide:

```
┌─────────────────────────────────────┐
│ [SLIDE PREVIEW com imagem de fundo] │
└─────────────────────────────────────┘
│ [🖼 Gerar Imagem ↓]  [Trocar]  [⬇ PNG] │
└─────────────────────────────────────────┘
```

- **"Gerar Imagem"** — aparece quando `needsMedia: true` e ainda não há imagem gerada. Mostra spinner individual por slide enquanto gera.
- **"Trocar"** (com ícone de refresh) — aparece quando imagem já foi gerada. Envia o mesmo prompt e substitui a imagem.
- **"⬇ PNG"** — disponível para TODOS os slides (com ou sem imagem). Usa `html-to-image` com `pixelRatio: 2` para gerar PNG em alta resolução (equivalente a ~800x1000px para um slide 4:5).

### 4. Fluxo de Geração de Imagem (UX)

```
Usuário clica "Gerar Imagem" no Slide 2
    ↓
Spinner aparece no botão do Slide 2 (só nele)
    ↓
supabase.functions.invoke('generate-slide-image', { imagePrompt, quality: 'fast' })
    ↓
base64 recebido → slideImages[2] = "data:image/png;base64,..."
    ↓
SlidePreview re-renderiza com a imagem de fundo real
    ↓
Botão muda para "Trocar" + ícone refresh
```

### 5. Export PNG por Lâmina

```ts
// Cada SlidePreview tem um ref
const slideRef = useRef<HTMLDivElement>(null);

// Ao clicar "⬇ PNG"
const handleExportPng = async () => {
  if (!slideRef.current) return;
  const dataUrl = await toPng(slideRef.current, {
    pixelRatio: 2,          // 2x resolução
    cacheBust: true,
  });
  const link = document.createElement('a');
  link.download = `dqef-slide-${slide.number}.png`;
  link.href = dataUrl;
  link.click();
};
```

O PNG gerado reflete exatamente o que está na tela — com ou sem imagem de fundo, com o texto Montserrat 900 e o watermark DQEF.

---

## O Que Não Muda

- O fluxo de geração do carrossel (briefing + edge function principal)
- A identidade visual laranja #E8603C nos slides sem imagem
- O botão "Exportar HTML" (mantido para exportar todos os slides com prompts)
- A tipografia Montserrat 900 e o watermark DQEF
- O sistema de copy dos prompts imagePrompt / veoPrompt

---

## Arquivos Modificados / Criados

| Arquivo | Ação |
|---|---|
| `supabase/functions/generate-slide-image/index.ts` | NOVO — edge function de geração de imagem |
| `src/pages/AiCarrosseis.tsx` | MODIFICADO — estado de imagens, botões, SlidePreview com background, export PNG |
| `package.json` | MODIFICADO — adicionar `html-to-image` |

---

## Exemplo Visual do Resultado Esperado

```
Slide sem imagem gerada:          Slide com imagem gerada:
┌──────────────────────┐          ┌──────────────────────┐
│ 01 · GANCHO          │          │ 02 · SETUP           │
│                      │          │ [foto real de mãos   │
│                      │          │  com ferramentas,    │
│  TU É BOM NO         │          │  escurecida com      │
│  QUE FAZI.           │          │  gradient]           │
│  O PROBLEMA          │          │  15 ANOS DE          │
│  NÃO É TU.           │          │  PROFISSÃO.          │
│               DQEF   │          │  NINGUÉM TE          │
└──────────────────────┘          │  ENSINOU.     DQEF   │
[Gerar Imagem] [⬇ PNG]           └──────────────────────┘
                                  [Trocar 🔄] [⬇ PNG]
```

---

## Impacto Esperado

- Slides com `needsMedia: true` passam a ter imagem real gerada via IA em vez de placeholder
- Cada lâmina pode ser exportada como PNG pronto para uso em templates ou Canva
- O fluxo "Gerar → Trocar se não gostar → Baixar PNG" resolve a dor do designer de forma direta
- A combinação texto branco Montserrat 900 + imagem com opacity + fundo laranja cria a identidade DQEF mesmo com foto
