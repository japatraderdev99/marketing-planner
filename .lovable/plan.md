
# Reengenharia Total: Sistema de Prompt Engineering para Vídeo IA

## O Problema Identificado

Após estudar os guides oficiais do **VEO 3 (Google DeepMind)**, **Sora 2** e **Seedance 1.5 Pro**, e analisar o código atual, foram identificados os seguintes problemas críticos no sistema de prompts:

**Problema 1 — Prompts longos demais para VEO 3.1**
A literatura oficial confirma: VEO 3.x funciona MELHOR com prompts de **3–5 frases** (não 300–500 palavras como está no código atual). Over-prompting causa saídas rígidas e sem vida.

**Problema 2 — Estrutura de timing errada para Seedance**
O Seedance 1.5 Pro não usa timing markers `[0.0s–Xs]` como VEO. Ele responde a uma gramática específica: `Sujeito + Ação 1 + Ação 2 + Movimento de câmera`. A instrução atual mistura as gramáticas dos modelos.

**Problema 3 — Falta de gramática de câmera por modelo**
- VEO 3.1: aceita termos técnicos de câmera (dolly, orbit, pan, eye-level, worm's eye)
- Seedance: "surround, aerial, zoom, pan, follow, handheld" são os termos corretos
- Sora 2: aceita linguagem de roteiro cinematográfico estilo Hollywood

**Problema 4 — Áudio não é considerado nos prompts VEO**
VEO 3.1 gera ÁUDIO nativo. O prompt precisa incluir: diálogos (se houver), som ambiente, música de fundo, efeitos sonoros. Sem isso, VEO pode gerar áudio aleatório indesejado (ex: "live studio audience laughter").

**Problema 5 — Image prompt é genérico demais**
O prompt de imagem não está aproveitando as especificidades do modelo receptor. Para Higgsfield (que usa o frame como Start Frame), a imagem precisa ser otimizada para ser "animável" — pose congelada, fundo limpo, composição que convida ao movimento.

**Problema 6 — UI Express sem feedback de qualidade**
O usuário não sabe o que está sendo gerado enquanto espera, nem tem indicação de qualidade/confiança nos prompts.

---

## Pesquisa Consolidada: Gramáticas por Modelo

### VEO 3.1 — "Mostre o que acontece, deixe o modelo respirar"
```text
[SHOT TYPE] — [AMBIENTE] — [SUJEITO: aparência concisa] — [AÇÃO com intensidade]
Camera: [dolly/pan/orbit] [direção] [velocidade]
Lighting: [hora do dia, qualidade da luz, temperatura de cor]
Audio: [som ambiente] + [diálogo se houver, entre aspas]
Style: photorealistic, cinematic color grading, natural Brazilian light
(no subtitles)
```
- **3–5 frases** no total, não parágrafos longos
- Diálogos explícitos com dois-pontos: `He says: Recebi meu PIX.`
- Incluir `(no subtitles)` se tiver diálogo

### Seedance 1.5 Pro — "Sujeito + Ações encadeadas + Câmera"
```text
[SHOT TYPE], [DESCRIÇÃO SUJEITO com features prominentes]. 
[AÇÃO 1] [adverb of degree]. [AÇÃO 2]. 
Camera [movimento específico]: surround/aerial/zoom/pan/follow/handheld.
[AMBIENTE com detalhes sensoriais]. [ILUMINAÇÃO]. 
Shot switch. [CLOSE-UP de detalhe chave].
```
- Ações sequenciais sem timing markers
- Adjetivos de intensidade: "quickly", "powerfully", "with large amplitude"
- Lens mode: explícito na instrução ("unfixed lens" para câmera em movimento)

### Sora 2 Pro Max — "Linguagem de roteiro + subtexto emocional"
```text
EXTERIOR/INTERIOR. [PERÍODO DO DIA/LOCAL].
[Director: estilo]. [Cinematography: estilo].
[DESCRIÇÃO DA CENA como um bloco narrativo — pode ser 5–8 frases]
[EMOTIONAL STATE antes → durante → depois]
[SEQUÊNCIA de beats: 0.0–2.5s | 2.5–5.0s | 5.0–8.0s]
[ÁUDIO: ambiência, música se houver]
```

---

## O Que Será Implementado

### 1. Reescrita Completa do Edge Function `generate-video-assets`

#### Novos Prompts de Sistema (em inglês) por operação

**Para `image_prompt` — Frame Inicial Otimizado para Animação:**
A IA gerará a imagem pensando no que vai ser "animado". O frame precisa ter:
- Sujeito em pose dinâmica mas "congelada" (não estática)
- Fundo que permita expansão de cena
- Iluminação que define a hora do dia para o vídeo
- Composição que convida movimento de câmera

**Para `video_prompt` — Gramática Nativa por Modelo:**
Cada modelo receberá um system prompt completamente diferente:

- **VEO 3.1**: Prompt estruturado em blocos curtos: Shot > Action > Camera > Audio > Technical. Máximo 5 frases.
- **Seedance 1.5 Pro**: Sujeito + features + ações encadeadas com adverbs of degree + camera movement natural language + shot switch para detalhes.
- **Sora 2 Pro Max**: Roteiro cinematográfico com screenplay format, emotional arcs, multi-beat timing.

**Para `express_prompts` — Pipeline Dual Otimizado:**
Gemini 2.5 Pro receberá instrução para:
1. Extrair a ESSÊNCIA visual (cena, personagem, ação, emoção)
2. Gerar image prompt otimizado para animação
3. Gerar video prompt na gramática nativa do modelo selecionado
4. Identificar o áudio correto para VEO 3.1

#### Novo Campo de Output: `audioInstructions`
Para VEO 3.1, retornar separado: som ambiente sugerido, diálogo opcional, música.

#### Novo Campo: `promptConfidenceScore`
De 0–100, baseado em: clareza da cena input, compatibilidade com o modelo, richness dos detalhes DQEF.

---

### 2. Melhorias na UI (`src/pages/VideoIA.tsx`)

#### A. Novo painel de "Prompt Quality Score" no resultado Express
Mostrar visualmente a pontuação de confiança com indicador colorido e sugestões de melhoria.

#### B. Separação visual de seções no prompt de vídeo
O output do prompt deixará de ser um bloco de texto monolítico. Será parseado e exibido em seções coloridas:
- `SHOT` — em azul
- `ACTION` — em laranja  
- `CAMERA` — em roxo
- `AUDIO` — em verde (apenas VEO)
- `TECHNICAL` — em cinza

#### C. Novo campo: "Instrução de Áudio" (apenas VEO 3.1)
Card separado com: som ambiente, diálogo (se houver), música sugerida.

#### D. Indicador visual do modelo no cabeçalho do resultado
Badge colorido e dica rápida de "por que este modelo foi escolhido para esta cena".

#### E. Campo "Modo de Lens" visível no resultado Seedance
Indicar claramente: `Fixed Lens` vs `Unfixed Lens` com explicação do impacto.

---

## Arquitetura das Mudanças

```text
supabase/functions/generate-video-assets/index.ts
├── BRAND_CONTEXT (expandido com mais cenários DQEF)
├── IMAGE_PROMPT_SYSTEM (novo — otimizado para frames animáveis)
├── VIDEO_PROMPT_SYSTEMS {
│   ├── "VEO 3.1"      → gramática Shot+Audio nativa VEO
│   ├── "Sora 2 Pro Max" → gramática Screenplay format
│   └── "Seedance 1.5 Pro" → gramática Subject+Actions+Camera
│   }
├── express_prompts → Gemini 2.5 Pro com dual output otimizado
├── image_prompt    → Gemini 2.5 Flash com focus em "animabilidade"
├── video_prompt    → Gemini 2.5 Pro com system prompt nativo do modelo
└── NEW: audioInstructions field no output VEO 3.1

src/pages/VideoIA.tsx
├── ExpressResult type: +audioInstructions, +promptConfidenceScore
├── VideoPromptResult type: +audioInstructions, +lensMode
├── Novo componente PromptQualityScore
├── Novo componente AudioInstructionsCard (VEO 3.1 only)
├── Novo componente PromptSections (parser visual do prompt)
└── UI refinements nos resultados Express e Step 3
```

---

## Detalhes Técnicos do Edge Function Reescrito

### System Prompt VEO 3.1 (novo):
```
You are a cinematographer specializing in photorealistic AI video for Google VEO 3.1.
VEO 3.1 RULES:
- Max 5 sentences. Less is more. The model fills in details.
- Structure: [SHOT TYPE]. [SUBJECT+ACTION]. Camera: [movement]. Audio: [ambient]+"[dialogue]" if any. Style: photorealistic, [color grade].
- Always include: (no subtitles) when there is dialogue
- Audio is native: describe ambient sound, any dialogue with colon syntax, music genre if needed
- DO NOT use timing markers [0.0s–Xs] — VEO handles timing internally
- Camera vocabulary: dolly in/out, slow pan, orbit, eye-level, low angle, worm's eye, tracking shot
```

### System Prompt Seedance 1.5 Pro (novo):
```
You are a motion director specializing in Seedance 1.5 Pro video generation (ByteDance).
SEEDANCE RULES:
- Structure: [SHOT TYPE], [SUBJECT with prominent features]. [ACTION 1] [adverb of degree]. [ACTION 2]. Camera [movement type]. [ENVIRONMENT]. [LIGHTING]. Shot switch. [CLOSE-UP of key detail].
- Camera vocabulary: surround, aerial, zoom, pan, follow, handheld
- Use degree adverbs: quickly, powerfully, wildly, with large amplitude, violently
- Multiple sequential actions WITHOUT timing markers — list them in order
- When camera moves: specify "unfixed lens" in technicalSpecs.lensMode
- Negative prompts do NOT work in Seedance — only describe what you WANT
- Shot switch technique: connect beats with "Shot switch." then new description
```

### System Prompt Sora 2 Pro Max (novo):
```
You are a Hollywood screenplay writer and director of photography for Sora 2 Pro Max (OpenAI).
SORA 2 RULES:
- Format: EXTERIOR/INTERIOR. [TIME/LOCATION].
- Can handle 5–8 sentences — Sora maintains consistency with longer prompts
- Multi-beat timing: structure as [0.0–2.5s] OPENING | [2.5–5.0s] ACTION | [5.0–8.0s] RESOLUTION
- Include: Director: [style], Cinematography: [style]
- Describe emotional state arc: before → during → after
- Strong with multi-character scenes and complex narrative
```

---

## Novo JSON Output Schema

```typescript
// image_prompt
{
  imagePrompt: string,          // EN, otimizado para animação
  imagePromptPtBr: string,      // Tradução PT
  visualNotes: string,          // Notas do diretor sobre composição
  animationPotential: string,   // Novo: "O que vai se mover nessa imagem"
}

// video_prompt  
{
  videoPrompt: string,          // EN, gramática nativa do modelo
  videoPromptPtBr: string,      // Tradução PT
  directorNotes: string,
  audioInstructions: {          // Novo (VEO 3.1)
    ambientSound: string,
    dialogue?: string,
    musicSuggestion?: string,
  } | null,
  lensMode: "fixed" | "unfixed", // Novo (Seedance)
  technicalSpecs: { ... },
  warningsAndTips: string[],
  promptConfidenceScore: number, // Novo: 0–100
}

// express_prompts (inclui tudo acima mais:)
{
  extractedScene: string,
  suggestedAngle: string,
  audioInstructions: { ... } | null,
  promptConfidenceScore: number,
}
```

---

## Arquivos Modificados

1. **`supabase/functions/generate-video-assets/index.ts`** — Reescrita dos system prompts para cada modelo, novos campos no output, lógica de áudio para VEO 3.1.

2. **`src/pages/VideoIA.tsx`** — Atualização dos tipos `VideoPromptResult` e `ExpressResult`, novo componente `AudioInstructionsCard` (VEO 3.1), novo `PromptQualityScore`, melhoria visual no display do prompt.

---

## O Que NÃO Muda

- O workflow em 4 passos (Config → Frame → Vídeo → Export)
- O painel Express e sua lógica de upload de arquivo
- A integração com Higgsfield (copy & paste instructions)
- A rota `/video-ia` e o sidebar
- Os modelos de IA usados (Gemini 2.5 Pro/Flash)
- O sistema de toast e erros

---

## Impacto Esperado

- Prompts VEO 3.1 mais curtos e eficazes = **menos tokens gastos, melhor resultado**
- Prompts Seedance com gramática nativa = **movimento mais natural e fluído**
- Prompts Sora com estrutura de roteiro = **consistência narrativa entre beats**
- Áudio nativo VEO especificado = **elimina o problema do "live studio audience" aleatório**
- Confidence score = **feedback imediato para o time sobre qualidade do input**
