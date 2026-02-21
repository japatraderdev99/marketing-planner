
# Tutorial Interativo — Onboarding Guiado

## Objetivo
Criar um sistema de tutorial interativo em popup/modal que ensina os usuarios, passo a passo, como a plataforma funciona e como dados bem preenchidos nos lugares certos geram resultados de IA cada vez melhores. Sera um prototipo refinavel que combina storytelling visual com interatividade.

---

## Conceito: "Jornada do Resultado"

O tutorial guia o usuario por 5 etapas visuais dentro de um modal fullscreen, usando uma metafora de "pipeline de qualidade": dados entram, IA processa, resultado sai melhor. Cada etapa mostra ONDE colocar os dados, POR QUE isso importa, e o ANTES/DEPOIS do resultado.

---

## Arquitetura Tecnica

### 1. Novo componente: `src/components/OnboardingTutorial.tsx`
- Modal fullscreen com overlay escuro e conteudo centralizado
- Navegacao por steps (setas, dots, teclado)
- Animacoes CSS suaves entre etapas (slide + fade)
- Progresso visual no topo (barra + indicadores numerados)
- Botao "Pular tutorial" sempre acessivel
- Persistencia em localStorage (`dqef_tutorial_completed`) para nao mostrar novamente

### 2. Os 5 Steps do Tutorial

| Step | Titulo | Conteudo |
|------|--------|----------|
| 1 | "Bem-vindo ao DQEF Hub" | Visao geral da plataforma: "Sua central de marketing inteligente". Mostra o fluxo Estrategia -> Campanhas -> Criativos com icones animados |
| 2 | "Fundacao: Playbook Estrategico" | Explica que tudo comeca na aba Estrategia. Mostra os 5 pilares (Essencia, Posicionamento, Persona, Tom, System Prompt) e o Knowledge Base. Inclui um mini scorecard visual |
| 3 | "Campanhas com Diretrizes CMO" | Mostra como as diretrizes preenchidas alimentam o plano de IA. Diagrama visual: Campos CMO -> IA -> Plano personalizado. Destaque no "Preencher da estrategia" |
| 4 | "Criativos que entendem sua marca" | Mostra como a Fundacao Estrategica e a Revisao Estrategica garantem que os carrosseis falem a lingua da marca. Antes/Depois: criativo generico vs. criativo com contexto |
| 5 | "Quanto mais dados, melhor o resultado" | Scorecard de prontidao real do usuario (puxa dados reais do localStorage/Supabase). Mostra o que ja foi preenchido e o que falta. CTA para ir direto ao campo que precisa de atencao |

### 3. "Feature de milhoes": Scorecard de Prontidao em Tempo Real (Step 5)
- Puxa os metafields reais do localStorage (`dqef_strategy_metafields_v1`)
- Consulta `strategy_knowledge` para contar documentos KB
- Calcula um score de 0-100% de "prontidao da IA"
- Mostra uma barra de progresso animada com cor dinamica (vermelho -> amarelo -> verde)
- Lista cada pilar com status (preenchido/faltando) e botao "Ir preencher" que fecha o tutorial e navega direto para `/estrategia`

### 4. Integracao no AppLayout
- Botao "?" ou icone de livro no header do AppLayout para reabrir o tutorial a qualquer momento
- Na primeira vez que o usuario entra, o tutorial abre automaticamente
- Apos completar, salva `dqef_tutorial_completed = true` no localStorage

### 5. Animacoes e Visual
- Transicoes entre steps com CSS `transform` + `opacity` (sem dependencia extra)
- Icones Lucide animados com `animate-pulse` / `animate-bounce` nos momentos-chave
- Cores seguindo o design system existente (laranja DQEF, teal, dark cards)
- Ilustracoes feitas com composicoes de icones Lucide + gradientes (sem imagens externas)
- Efeito "glow" nos elementos-chave de cada step

---

## Arquivos Modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/components/OnboardingTutorial.tsx` | **NOVO** - Componente completo do tutorial |
| `src/components/AppLayout.tsx` | Adicionar botao "?" no header + logica de auto-abertura na primeira visita |

---

## Detalhes Tecnicos

- Zero dependencias novas: usa Dialog do Radix, Lucide icons, Tailwind animations, e localStorage
- O step 5 faz fetch real ao banco para contar documentos KB, dando ao tutorial um carater "vivo"
- Navegacao por teclado (setas esquerda/direita, Escape para fechar)
- Responsivo: em mobile os steps empilham verticalmente com scroll
- O tutorial funciona como prototipo: a estrutura de steps e facilmente extensivel (basta adicionar objetos ao array de steps)
