
# Biblioteca de Mídias + Sugestão Inteligente por Lâmina

## O Problema

O fluxo atual gera imagens via IA a cada uso, consumindo tokens e créditos desnecessariamente. O usuário já possui uma coleção de imagens criadas por modelos de IA que poderiam ser reutilizadas nos carrosséis, com curadoria inteligente por categoria e relevância de copy.

## Arquitetura da Solução

### Banco de Dados — 1 nova tabela

```text
media_library
├── id            uuid PK
├── user_id       uuid (auth)
├── url           text          ← URL pública no Storage bucket
├── filename      text          ← nome original do arquivo
├── category      text          ← gerada pela IA ao fazer upload
├── tags          text[]        ← array de tags geradas pela IA
├── description   text          ← descrição em português gerada pela IA
├── created_at    timestamptz
└── file_size     integer
```

- RLS: cada usuário vê e gerencia apenas as próprias imagens
- Storage bucket: `media-library` (público para leitura de URLs, privado para listagem)

### Fluxo de Upload com Categorização Automática

```
Usuário sobe imagem (JPG/PNG/WEBP)
        ↓
Upload → Storage bucket media-library/{user_id}/{uuid}.jpg
        ↓
Edge function "categorize-media" chamada automaticamente
        ↓
Gemini 2.5 Flash analisa a imagem:
  - Detecta categoria: pessoas, ambiente, ferramenta, produto, ação, abstrato, outdoor, indoor
  - Gera tags relevantes: ["mãos", "ferramenta", "trabalho braçal", "luz natural"]
  - Escreve descrição concisa em português
        ↓
Salva category + tags + description na tabela media_library
```

### Fluxo de Sugestão por Lâmina

```
Usuário clica "Buscar na biblioteca" no SlideCard
        ↓
Edge function "suggest-media" recebe:
  - headline + subtext + imagePrompt da lâmina
  - user_id para filtrar mídia do usuário
        ↓
1. Filtro rápido por categoria (baseado no tipo do slide: hook→pessoa, setup→ambiente, cta→marca)
2. Gemini analisa o subconjunto filtrado e ranqueia por relevância textual com a copy
        ↓
Retorna top 3-4 imagens ranqueadas com score de relevância
        ↓
Modal mostra as sugestões com thumbnail → usuário clica para aplicar
```

## Nova Edge Function: `categorize-media`

Recebe a URL pública da imagem e usa Gemini Vision (multimodal) para:
1. Classificar em categoria principal
2. Gerar array de tags descritivas
3. Escrever descrição resumida em português

Retorna `{ category, tags, description }` e salva no banco.

## Nova Edge Function: `suggest-media`

Recebe `{ slideHeadline, slideSubtext, slideImagePrompt, userId }` e:
1. Busca imagens do usuário no banco filtrando por categoria compatível com o tipo do slide
2. Envia a copy da lâmina + as descrições/tags das imagens para o Gemini
3. Pede ao modelo que ranqueie de 1 a 10 cada imagem por relevância
4. Retorna as top 4 ordenadas por score

## Mudanças na UI

### Aba "Biblioteca" no painel esquerdo

O painel de briefing ganha uma segunda aba: "Briefing" | "Biblioteca"

Na aba Biblioteca:
- Botão de upload de imagens (múltiplas por vez, aceita JPG, PNG, WEBP)
- Grid de thumbnails com badge de categoria e tags
- Indicador de loading durante categorização automática
- Opção de excluir imagem da biblioteca

### Botão "Buscar na biblioteca" em cada SlideCard

Abaixo das opções "Gerar imagem" e "Tirar imagem", um novo botão aparece quando o usuário tem imagens na biblioteca.

Ao clicar, abre um modal compacto inline (dentro do próprio card) com:
- 3-4 thumbnails sugeridos com barra de relevância
- 1 clique para aplicar como background da lâmina
- Link "Ver mais" para abrir a biblioteca completa em modal

## Diagrama de Fluxo de Dados

```text
UPLOAD                         USO NO CARROSSEL
─────────────────────          ─────────────────────────────────
1. Usuário sobe imagem         1. SlideCard mostra "Buscar na biblioteca"
2. → Storage bucket            2. → suggest-media edge fn
3. → categorize-media edge fn  3. → Gemini ranqueia por relevância
4. → salva na media_library    4. → modal mostra top 4 sugestões
5. → grid atualiza             5. → usuário aplica com 1 clique
```

## Detalhes Técnicos

### Modelo IA para categorização
`google/gemini-2.5-flash` com input multimodal (imagem + texto) para categorização. Rápido, barato, preciso para visão computacional simples.

### Modelo IA para sugestão
`google/gemini-2.5-flash-lite` para o ranqueio de relevância (só texto — descrições + copy da lâmina). Mais barato porque não precisa processar a imagem novamente, apenas comparar strings.

### Categorias predefinidas
`pessoa`, `ambiente`, `ferramenta`, `ação`, `produto`, `outdoor`, `indoor`, `abstrato`, `equipe`

Mapeamento por tipo de slide:
- `hook` → pessoa, ação
- `setup` → ambiente, indoor, outdoor
- `data` → abstrato, produto
- `contrast` → pessoa, ação
- `validation` → equipe, pessoa
- `cta` → marca (sem filtro específico)

### Storage
Bucket `media-library` com política RLS:
- Upload permitido apenas para o próprio `user_id`
- Leitura pública via URL (para carregar nos `<img>`)
- Delete permitido apenas para o próprio usuário

## Arquivos Modificados / Criados

| Arquivo | Ação |
|---|---|
| `supabase/migrations/[timestamp]_media_library.sql` | NOVA tabela + storage bucket + RLS |
| `supabase/functions/categorize-media/index.ts` | NOVA — categorização automática via Gemini Vision |
| `supabase/functions/suggest-media/index.ts` | NOVA — sugestão por relevância textual |
| `src/pages/AiCarrosseis.tsx` | MODIFICADO — aba Biblioteca, botão upload, botão buscar, modal de sugestões |

## Resultado Esperado

```
PAINEL ESQUERDO (tabs):
┌──────────────────────────────────┐
│  [Briefing]  [Biblioteca 12]     │
├──────────────────────────────────┤
│  ╔════════╗ ╔════════╗           │
│  ║ img01  ║ ║ img02  ║           │
│  ║ pessoa ║ ║ outdoor║           │
│  ╚════════╝ ╚════════╝           │
│  [+ Upload imagens]              │
└──────────────────────────────────┘

CARD DA LÂMINA:
┌──────────────────────────┐
│ [preview com imagem]     │
├──────────────────────────┤
│ [Trocar imagem] [PNG]    │
│ [Buscar na biblioteca ↓] │  ← novo
├──────────────────────────┤
│ ╔══╗ ╔══╗ ╔══╗           │  ← sugestões inline
│ ║  ║ ║  ║ ║  ║  relevância│
│ ╚══╝ ╚══╝ ╚══╝           │
└──────────────────────────┘
```

## Por que essa arquitetura é eficiente

1. **Zero tokens desperdicados**: categorização acontece 1 única vez no upload, não a cada uso
2. **Filtro por categoria antes do ranqueio**: o Gemini só analisa 5-10 imagens pré-filtradas, não toda a biblioteca
3. **Reutilização máxima**: a mesma foto pode ser usada em múltiplos carrosséis sem custo adicional de geração
4. **Escala bem**: mesmo com 200 imagens na biblioteca, o suggest-media filtra para ~10-15 antes de chamar a IA
