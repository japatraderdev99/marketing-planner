// ===== DQEF Hub — Seed Data =====
// Dados reais extraídos dos documentos estratégicos da DQEF
// SEED VERSION: bump this to force localStorage reset when seed changes
export const SEED_VERSION = '2026-02-20-v4';

export type Channel = 'Instagram' | 'TikTok' | 'Meta Ads' | 'LinkedIn' | 'Google Ads' | 'Orgânico' | 'YouTube';
export type Priority = 'Alta' | 'Média' | 'Baixa';
export type KanbanStatus = 'ideia' | 'desenvolvimento' | 'revisao' | 'aprovado' | 'publicado';
export type CampaignStatus = 'Rascunho' | 'Aprovada' | 'Ativa' | 'Pausada' | 'Finalizada';
export type Funnel = 'Topo' | 'Meio' | 'Fundo';
export type ContentFormat = 'Post' | 'Reels' | 'Stories' | 'Carrossel' | 'Ads' | 'Shorts';
export type ContentObjective = 'Awareness' | 'Engajamento' | 'Conversão' | 'Retenção';
export type VideoFormat = 'Reels 9:16' | 'Shorts 9:16' | 'Feed 1:1' | 'Carrossel' | 'Stories 9:16' | 'Horizontal 16:9';
export type ViralMechanism = 'Choque financeiro' | 'Reconhecimento emocional' | 'POV imersivo' | 'ASMR sensorial' | 'Desafio/Challenge' | 'Humor cômica' | 'Indignação coletiva' | 'Prova social';
export type AITool = 'VEO 3.1' | 'Sora' | 'Seedance' | 'Midjourney' | 'Runway' | 'CapCut' | 'Manual';

export interface CampaignFrame {
  id: string;
  label: string; // ex: "Frame 01.A"
  title: string;
  subtitle: string;
  timing: string; // ex: "0s — 4s"
  purpose: string;
  prompt: string;
  type: 'setup' | 'disaster' | 'resolution' | 'hero' | 'cta';
}

export interface Campaign {
  id: string;
  name: string;
  channel: Channel[];
  status: CampaignStatus;
  kanbanStatus: KanbanStatus;
  priority: Priority;
  category: ContentObjective;
  responsible: string;
  avatar: string;
  startDate: string;
  endDate: string;
  budget: number;
  funnel: Funnel;
  objective: string;
  audience: string;
  description: string;
  // Campos criativos
  videoFormat?: VideoFormat;
  duration?: number; // segundos
  aiTool?: AITool[];
  viralMechanism?: ViralMechanism;
  cta?: string;
  hook?: string;
  caption?: string;
  frames?: CampaignFrame[];
  // Métricas
  impressions?: number;
  clicks?: number;
  leads?: number;
  conversions?: number;
  cpc?: number;
  cpl?: number;
  roas?: number;
  // Distribuição
  budgetPaid?: number;
  budgetOrganic?: number;
  targetReach?: number;
  // Gestão
  subtasks: { id: string; title: string; done: boolean }[];
  links: { label: string; url: string }[];
  history: { date: string; action: string; user: string }[];
}

export interface ContentItem {
  id: string;
  title: string;
  format: ContentFormat;
  channel: Channel;
  date: string;
  status: 'Rascunho' | 'Em produção' | 'Aprovado' | 'Publicado';
  copy?: string;
  responsible: string;
}

export interface CopyItem {
  id: string;
  title: string;
  copy: string;
  channel: Channel[];
  objective: ContentObjective;
  category: string;
  tags: string[];
}

export interface Roteiro {
  id: string;
  title: string;
  subtitle: string;
  format: ContentFormat;
  channel: Channel[];
  audience: string;
  concept: string;
  scenes: string[];
  caption: string;
  viralTrigger: string;
  persona: string;
}

export interface IdeiaDisruptiva {
  id: string;
  title: string;
  format: string;
  channel: Channel[];
  concept: string;
  whyViral: string;
  status: 'Aprovada' | 'Pendente' | 'Descartada';
  impact: 'Alto' | 'Médio' | 'Baixo';
}

export interface EstrategiaPublico {
  id: string;
  persona: string;
  icon: string;
  profile: string;
  ageRange: string;
  avgRate: string;
  painPoints: string[];
  approach: string;
  hooks: string[];
  channels: Channel[];
}

// Variação Ninja — série de frames para AI video generation
export interface NinjaVariacao {
  id: string;
  title: string;
  servico: string;
  descricao: string;
  duracao: string;
  color: string;
  frames: CampaignFrame[];
}

// ===== CAMPANHAS =====
export const initialCampaigns: Campaign[] = [
  {
    id: 'camp-001',
    name: 'ASMR do Serviço Perfeito',
    channel: ['Instagram', 'TikTok'],
    status: 'Ativa',
    kanbanStatus: 'aprovado',
    priority: 'Alta',
    category: 'Awareness',
    responsible: 'Ana Lima',
    avatar: 'AL',
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    budget: 3500,
    funnel: 'Topo',
    objective: 'Gerar awareness entre prestadores de serviço em Florianópolis',
    audience: 'Prestadores autônomos 28-50 anos, Florianópolis',
    description: 'Série de vídeos ASMR mostrando serviços sendo executados com perfeição — som dos instrumentos, precisão das mãos, satisfação do trabalho bem feito.',
    videoFormat: 'Reels 9:16',
    duration: 8,
    aiTool: ['VEO 3.1'],
    viralMechanism: 'ASMR sensorial',
    hook: 'Zero rosto. Zero texto. Só o som do serviço perfeito.',
    cta: 'Link na bio → Cadastro grátis',
    caption: 'O som do trabalho bem feito. 🔧 Qual é o seu? Comenta abaixo.',
    impressions: 45000,
    clicks: 2800,
    leads: 340,
    conversions: 87,
    cpc: 1.25,
    cpl: 10.29,
    roas: 2.4,
    budgetPaid: 2800,
    budgetOrganic: 700,
    targetReach: 80000,
    subtasks: [
      { id: 'st-1', title: 'Roteiro do vídeo eletricista', done: true },
      { id: 'st-2', title: 'Gravação com piscineiro', done: true },
      { id: 'st-3', title: 'Edição e pós-produção', done: false },
      { id: 'st-4', title: 'Aprovação do cliente', done: false },
    ],
    links: [
      { label: 'Brief criativo', url: '#' },
      { label: 'Pasta de assets', url: '#' },
    ],
    history: [
      { date: '2026-02-01', action: 'Campanha criada', user: 'Ana Lima' },
      { date: '2026-02-05', action: 'Briefing aprovado', user: 'Carlos Mendes' },
      { date: '2026-02-10', action: 'Conteúdo em produção', user: 'Ana Lima' },
    ],
  },
  {
    id: 'camp-002',
    name: '#FazAContaTu — Viral Challenge',
    channel: ['TikTok', 'Instagram', 'YouTube'],
    status: 'Ativa',
    kanbanStatus: 'desenvolvimento',
    priority: 'Alta',
    category: 'Awareness',
    responsible: 'Carlos Mendes',
    avatar: 'CM',
    startDate: '2026-02-15',
    endDate: '2026-03-15',
    budget: 5000,
    funnel: 'Topo',
    objective: 'Desafio viral: prestador calcula quanto a plataforma concorrente tirou dele',
    audience: 'Prestadores que usam GetNinja, Triider, plataformas concorrentes',
    description: 'A DQEF lança um desafio viral simples e devastador: mostre quanto a plataforma tirou de você. Um único vídeo seed mostra o cálculo. O prestador faz a conta ao vivo.',
    videoFormat: 'Reels 9:16',
    duration: 30,
    aiTool: ['CapCut', 'Manual'],
    viralMechanism: 'Desafio/Challenge',
    hook: 'Faz a conta. Quanto ficou com você esse mês? 🔢',
    cta: 'Comenta o número e marca um amigo prestador',
    caption: 'Faz a conta. Quanto ficou com você esse mês? 🔢 Link na bio.',
    impressions: 120000,
    clicks: 8400,
    leads: 1200,
    conversions: 320,
    cpc: 0.60,
    cpl: 4.17,
    roas: 6.4,
    budgetPaid: 3500,
    budgetOrganic: 1500,
    targetReach: 250000,
    subtasks: [
      { id: 'st-5', title: 'Vídeo seed gravado', done: true },
      { id: 'st-6', title: 'Hashtag configurada', done: true },
      { id: 'st-7', title: 'Influenciadores contactados', done: false },
      { id: 'st-8', title: 'Métricas de acompanhamento', done: false },
    ],
    links: [],
    history: [
      { date: '2026-02-15', action: 'Campanha iniciada', user: 'Carlos Mendes' },
    ],
  },
  {
    id: 'camp-003',
    name: 'O Lead Que Sumiu',
    channel: ['TikTok', 'Instagram'],
    status: 'Ativa',
    kanbanStatus: 'revisao',
    priority: 'Média',
    category: 'Awareness',
    responsible: 'Juliana Costa',
    avatar: 'JC',
    startDate: '2026-02-10',
    endDate: '2026-03-10',
    budget: 2800,
    funnel: 'Topo',
    objective: 'Mostrar a frustração de pagar por lead que não converte',
    audience: 'Eletricistas e prestadores que usaram GetNinja ou Triider',
    description: 'WhatsApp em tela cheia. Conversa real com cliente fictício. Mensagem enviada, dois checks cinzas. Nunca respondeu. Contraste brutal com "pagou e não recebeu nada".',
    videoFormat: 'Reels 9:16',
    duration: 15,
    aiTool: ['Manual'],
    viralMechanism: 'Reconhecimento emocional',
    hook: 'Você pagou. Ele nunca respondeu.',
    cta: 'Comenta o número de leads que sumiram',
    caption: 'Quantas vezes isso aconteceu com você? 😤 Comenta o número de leads que sumiram.',
    impressions: 28000,
    clicks: 1900,
    leads: 210,
    conversions: 45,
    cpc: 1.47,
    cpl: 13.33,
    roas: 1.6,
    budgetPaid: 2000,
    budgetOrganic: 800,
    targetReach: 60000,
    subtasks: [
      { id: 'st-9', title: 'Script aprovado', done: true },
      { id: 'st-10', title: 'Gravação concluída', done: true },
      { id: 'st-11', title: 'Revisão de copy', done: false },
    ],
    links: [],
    history: [],
  },
  {
    id: 'camp-004',
    name: 'POV: Você É o Prestador',
    channel: ['TikTok', 'YouTube'],
    status: 'Aprovada',
    kanbanStatus: 'aprovado',
    priority: 'Alta',
    category: 'Awareness',
    responsible: 'Ana Lima',
    avatar: 'AL',
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    budget: 4200,
    funnel: 'Topo',
    objective: 'Câmera subjetiva 100%. Você é o prestador. Imersão total.',
    audience: 'Prestadores 25-45 anos, alta identificação com conteúdo POV',
    description: 'Câmera 100% POV — você é o prestador. Sem mostrar rosto. Sequência imersiva: acorda, olha celular (agenda vazia), vai ao serviço, faz o trabalho, PIX recebido.',
    videoFormat: 'Reels 9:16',
    duration: 45,
    aiTool: ['VEO 3.1', 'Seedance'],
    viralMechanism: 'POV imersivo',
    hook: 'POV: você é o prestador. Câmera subjetiva 100%.',
    cta: 'Cadastra grátis e começa a construir sua agenda',
    caption: 'POV: você construiu algo hoje. E recebeu pelo que vale. 💪',
    impressions: 0,
    clicks: 0,
    leads: 0,
    conversions: 0,
    budgetPaid: 3500,
    budgetOrganic: 700,
    targetReach: 150000,
    subtasks: [
      { id: 'st-12', title: 'Roteiro finalizado', done: true },
      { id: 'st-13', title: 'Equipamento reservado', done: false },
    ],
    links: [],
    history: [
      { date: '2026-02-18', action: 'Campanha aprovada', user: 'Carlos Mendes' },
    ],
  },
  {
    id: 'camp-005',
    name: 'As Mãos Que Constroem',
    channel: ['Instagram', 'YouTube'],
    status: 'Rascunho',
    kanbanStatus: 'ideia',
    priority: 'Média',
    category: 'Engajamento',
    responsible: 'Juliana Costa',
    avatar: 'JC',
    startDate: '2026-03-15',
    endDate: '2026-04-15',
    budget: 1800,
    funnel: 'Topo',
    objective: 'Valorização emocional do trabalho manual — identidade e orgulho',
    audience: 'Prestadores de todos os perfis, conteúdo de identidade',
    description: 'Puramente visual. Sem texto. Sem narração. Série de closes em câmera lenta: mãos de diferentes prestadores trabalhando. Música instrumental. Final: logo DQEF em laranja.',
    videoFormat: 'Reels 9:16',
    duration: 30,
    aiTool: ['Runway', 'VEO 3.1'],
    viralMechanism: 'Reconhecimento emocional',
    hook: 'Você faz com as mãos o que ninguém sabe fazer.',
    cta: 'Salva e marca outro prestador',
    caption: 'Cada serviço tem uma história. A sua começa aqui. 🧡 @deixaqueeufaco',
    impressions: 0,
    clicks: 0,
    leads: 0,
    conversions: 0,
    budgetPaid: 1200,
    budgetOrganic: 600,
    targetReach: 50000,
    subtasks: [],
    links: [],
    history: [],
  },
  {
    id: 'camp-006',
    name: 'Meta Ads — Captação Prestadores',
    channel: ['Meta Ads'],
    status: 'Ativa',
    kanbanStatus: 'publicado',
    priority: 'Alta',
    category: 'Conversão',
    responsible: 'Carlos Mendes',
    avatar: 'CM',
    startDate: '2026-01-15',
    endDate: '2026-03-31',
    budget: 8000,
    funnel: 'Meio',
    objective: 'Captação de prestadores via formulário de cadastro',
    audience: 'Prestadores autônomos Florianópolis, 28-55 anos',
    description: 'Campanha de tráfego pago no Meta direcionada para landing page de cadastro de prestadores.',
    videoFormat: 'Feed 1:1',
    duration: 15,
    aiTool: ['Midjourney', 'CapCut'],
    viralMechanism: 'Choque financeiro',
    hook: 'Prestador de serviço em Floripa? Chega de pagar para aparecer.',
    cta: 'Se inscreva agora →',
    caption: 'Prestador de serviço em Floripa? Cadastro grátis. Link na bio.',
    impressions: 280000,
    clicks: 14000,
    leads: 2800,
    conversions: 890,
    cpc: 0.57,
    cpl: 2.86,
    roas: 11.1,
    budgetPaid: 8000,
    budgetOrganic: 0,
    targetReach: 500000,
    subtasks: [
      { id: 'st-14', title: 'Criativos rodando', done: true },
      { id: 'st-15', title: 'A/B test configurado', done: true },
      { id: 'st-16', title: 'Relatório semanal', done: true },
    ],
    links: [
      { label: 'Meta Ads Manager', url: '#' },
    ],
    history: [
      { date: '2026-01-15', action: 'Campanha no ar', user: 'Carlos Mendes' },
    ],
  },
  {
    id: 'camp-007',
    name: 'LinkedIn — Institucional B2B',
    channel: ['LinkedIn'],
    status: 'Rascunho',
    kanbanStatus: 'ideia',
    priority: 'Baixa',
    category: 'Awareness',
    responsible: 'Juliana Costa',
    avatar: 'JC',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    budget: 1200,
    funnel: 'Topo',
    objective: 'Posicionamento institucional e atração de investidores/parceiros',
    audience: 'Empreendedores, investidores, gestores de RH — LinkedIn',
    description: 'Série de posts institucionais sobre o problema do mercado de serviços e a solução DQEF.',
    videoFormat: 'Horizontal 16:9',
    hook: 'O mercado de serviços residenciais no Brasil movimenta R$180 bilhões por ano.',
    cta: 'Se você trabalha com serviços residenciais, vem conversar.',
    impressions: 0,
    clicks: 0,
    leads: 0,
    conversions: 0,
    budgetPaid: 800,
    budgetOrganic: 400,
    targetReach: 20000,
    subtasks: [],
    links: [],
    history: [],
  },
  // ===== TASKS GUILHERME — LANÇAMENTO 15/03/2026 =====

  // ─── BLOCO 1: AWARENESS — 10 VÍDEOS VIRAIS (deadline URGENTE: 22/02) ──────────
  {
    id: 'gui-aw-001',
    name: '🔴 [AWARENESS] 10 Vídeos Virais — Prestadores',
    channel: ['TikTok', 'Instagram', 'YouTube'],
    status: 'Ativa',
    kanbanStatus: 'desenvolvimento',
    priority: 'Alta',
    category: 'Awareness',
    responsible: 'Guilherme',
    avatar: 'GU',
    startDate: '2026-02-20',
    endDate: '2026-02-22',
    budget: 0,
    funnel: 'Topo',
    objective: 'Produzir e entregar 10 vídeos virais para awareness de prestadores até 22/02 — pré-lançamento da plataforma em 15/03.',
    audience: 'Prestadores autônomos 25-50 anos, Florianópolis e Campinas',
    description: '⚠️ PRAZO CRÍTICO: 22/02/2026 — 2 dias. Guilherme é responsável por todos os criativos. Foco total em ganchos emocionais e virais para prestadores: comparativo de comissão, ASMR de trabalho, POV prestador, desafio viral, choque financeiro, reconhecimento de dor.',
    videoFormat: 'Reels 9:16',
    duration: 30,
    aiTool: ['VEO 3.1', 'CapCut', 'Runway'],
    viralMechanism: 'Choque financeiro',
    hook: 'Você sabe quanto a plataforma tirou de você esse mês?',
    cta: 'Link na bio → Cadastro grátis DQEF',
    targetReach: 500000,
    subtasks: [
      { id: 'aw-v01', title: '🎬 Vídeo 01 — Choque Financeiro: "Faz a conta"', done: false },
      { id: 'aw-v02', title: '🎬 Vídeo 02 — ASMR Serviço Perfeito (eletricista)', done: false },
      { id: 'aw-v03', title: '🎬 Vídeo 03 — POV Prestador: agenda vazia → PIX recebido', done: false },
      { id: 'aw-v04', title: '🎬 Vídeo 04 — Reconhecimento: "Você pagou e ele sumiu"', done: false },
      { id: 'aw-v05', title: '🎬 Vídeo 05 — Comparativo: 27% vs 15% (gráfico animado)', done: false },
      { id: 'aw-v06', title: '🎬 Vídeo 06 — ASMR Serviço Perfeito (piscineiro)', done: false },
      { id: 'aw-v07', title: '🎬 Vídeo 07 — Indignação: "Trabalho 10h e ainda não escalo"', done: false },
      { id: 'aw-v08', title: '🎬 Vídeo 08 — Desafio viral: "#FazAContaTu"', done: false },
      { id: 'aw-v09', title: '🎬 Vídeo 09 — POV imersivo: câmera subjetiva total', done: false },
      { id: 'aw-v10', title: '🎬 Vídeo 10 — Prova social: depoimento UGC prestador', done: false },
      { id: 'aw-rev', title: '✅ Revisão final e export de todos os 10 vídeos', done: false },
      { id: 'aw-pub', title: '🚀 Agendamento e publicação nos canais', done: false },
    ],
    links: [],
    history: [
      { date: '2026-02-20', action: '⚠️ Campanha criada — PRAZO: 22/02. Apenas 2 dias úteis.', user: 'Gabriel' },
    ],
  },

  // ─── BLOCO 2: FEED INSTAGRAM — 3 POSTS FIXADOS (deadline: 12/03) ────────────
  {
    id: 'gui-feed-pins',
    name: '📌 [FEED] 3 Posts Fixados — Inauguração 15/03',
    channel: ['Instagram'],
    status: 'Ativa',
    kanbanStatus: 'ideia',
    priority: 'Alta',
    category: 'Conversão',
    responsible: 'Guilherme',
    avatar: 'GU',
    startDate: '2026-02-23',
    endDate: '2026-03-12',
    budget: 0,
    funnel: 'Fundo',
    objective: 'Criar os 3 posts fixados do feed do Instagram da DQEF — âncora do perfil para novos visitantes chegando via campanha de awareness.',
    audience: 'Prestadores autônomos que visitam o perfil pela primeira vez',
    description: 'Os 3 pins são a vitrine da marca no Instagram. Quem clicar nos anúncios e chegar no perfil vai ver esses 3 conteúdos fixados no topo. Precisam ser impecáveis: qualidade institucional, clareza máxima e CTA irresistível.',
    videoFormat: 'Reels 9:16',
    aiTool: ['VEO 3.1', 'Midjourney', 'CapCut'],
    viralMechanism: 'Prova social',
    cta: 'Link na bio → Cadastro grátis',
    targetReach: 50000,
    subtasks: [
      // PIN 1 — Tutorial Cadastro
      { id: 'pin-1-roteiro', title: '📝 PIN 1 — Roteiro: Tutorial "Como se Cadastrar na Plataforma"', done: false },
      { id: 'pin-1-grav', title: '🎬 PIN 1 — Gravação/Animação do tutorial passo a passo', done: false },
      { id: 'pin-1-edit', title: '✂️ PIN 1 — Edição, legendas e motion (max 60s)', done: false },
      { id: 'pin-1-aprov', title: '✅ PIN 1 — Aprovação Gabriel/Leandro e publicação fixada', done: false },
      // PIN 2 — Institucional "Quem Somos"
      { id: 'pin-2-roteiro', title: '📝 PIN 2 — Roteiro: Vídeo Institucional "Quem Somos — DQEF"', done: false },
      { id: 'pin-2-grav', title: '🎬 PIN 2 — Produção: manifesto da marca + equipe + missão', done: false },
      { id: 'pin-2-edit', title: '✂️ PIN 2 — Edição cinematográfica + identidade visual', done: false },
      { id: 'pin-2-aprov', title: '✅ PIN 2 — Aprovação e publicação fixada', done: false },
      // PIN 3 — Tutorial Uso da Plataforma
      { id: 'pin-3-roteiro', title: '📝 PIN 3 — Roteiro: Tutorial "Como Usar a Plataforma"', done: false },
      { id: 'pin-3-screen', title: '🎬 PIN 3 — Screen recording + narração do fluxo do app', done: false },
      { id: 'pin-3-edit', title: '✂️ PIN 3 — Edição com animações de UI e CTA final', done: false },
      { id: 'pin-3-aprov', title: '✅ PIN 3 — Aprovação e publicação fixada', done: false },
    ],
    links: [],
    history: [
      { date: '2026-02-20', action: 'Posts fixados planejados — deadline 12/03 para estar no ar antes da inauguração.', user: 'Gabriel' },
    ],
  },

  // ─── BLOCO 3: FEED INSTAGRAM — GRID DE 9 POSTS (deadline: 14/03) ────────────
  {
    id: 'gui-feed-grid',
    name: '🟠 [FEED] Grid de Lançamento — 9 Posts (4 vídeos + 2 carrosséis + 3 posts)',
    channel: ['Instagram'],
    status: 'Ativa',
    kanbanStatus: 'ideia',
    priority: 'Alta',
    category: 'Awareness',
    responsible: 'Guilherme',
    avatar: 'GU',
    startDate: '2026-02-23',
    endDate: '2026-03-14',
    budget: 0,
    funnel: 'Topo',
    objective: 'Montar o grid visual do Instagram com 9 posts que compõem a vitrine da plataforma no lançamento — com cadência de publicação e identidade visual coesa.',
    audience: 'Prestadores autônomos de Florianópolis e Campinas, 25-50 anos',
    description: 'O grid de 9 posts após os fixados define a identidade visual do perfil. Devem ser publicados em cadência estratégica nos dias anteriores à inauguração (08/03 a 14/03), construindo antecipação. Identidade visual laranja DQEF, minimalista e impactante.',
    aiTool: ['VEO 3.1', 'Midjourney', 'CapCut', 'Runway'],
    viralMechanism: 'Reconhecimento emocional',
    cta: 'Cadastra grátis → link na bio',
    targetReach: 80000,
    subtasks: [
      // 4 VÍDEOS
      { id: 'grid-v1', title: '🎬 Vídeo 1 — "As Mãos Que Constroem" (manifesto visual, sem texto)', done: false },
      { id: 'grid-v2', title: '🎬 Vídeo 2 — Bastidores da plataforma (equipe, tech, missão)', done: false },
      { id: 'grid-v3', title: '🎬 Vídeo 3 — Depoimento real: prestador antes e depois da DQEF', done: false },
      { id: 'grid-v4', title: '🎬 Vídeo 4 — Comparativo live: GetNinja vs DQEF (dados reais)', done: false },
      // 2 CARROSSÉIS
      { id: 'grid-c1', title: '🎠 Carrossel 1 — "5 razões para trocar de plataforma" (5 lâminas)', done: false },
      { id: 'grid-c2', title: '🎠 Carrossel 2 — "Como a DQEF funciona?" (passo a passo visual)', done: false },
      // 3 POSTS ESTÁTICOS
      { id: 'grid-p1', title: '🖼️ Post 1 — Data reveal: "15/03 • Algo grande está chegando"', done: false },
      { id: 'grid-p2', title: '🖼️ Post 2 — Infográfico: "Quanto você perde por mês?" (dados impactantes)', done: false },
      { id: 'grid-p3', title: '🖼️ Post 3 — Manifesto da marca: frase + identidade visual', done: false },
      // CALENDÁRIO
      { id: 'grid-cal', title: '📅 Definir calendário de publicação (08/03 a 14/03, 1-2 por dia)', done: false },
      { id: 'grid-rev', title: '✅ Revisão coesão visual do grid completo com Gabriel', done: false },
    ],
    links: [],
    history: [
      { date: '2026-02-20', action: 'Grid planejado — publicação escalonada de 08/03 a 14/03. Inauguração 15/03.', user: 'Gabriel' },
    ],
  },

  // ─── BLOCO 4: CAMPANHA ENGAJAMENTO — PRESTADORES (deadline: 14/03) ──────────
  {
    id: 'gui-eng-prestadores',
    name: '🎯 [ENGAJAMENTO] Campanha Prestadores — Pré-Lançamento (2 carrosséis + 4 vídeos + 3 posts/canal)',
    channel: ['Instagram', 'TikTok'],
    status: 'Aprovada',
    kanbanStatus: 'ideia',
    priority: 'Alta',
    category: 'Engajamento',
    responsible: 'Guilherme',
    avatar: 'GU',
    startDate: '2026-02-28',
    endDate: '2026-03-14',
    budget: 0,
    funnel: 'Meio',
    objective: 'Gerar engajamento profundo com o público de prestadores: cadastros, salvamentos, compartilhamentos e comentários — para validar demanda e calibrar alocação de budget para campanhas de clientes.',
    audience: 'Prestadores autônomos já expostos à campanha de awareness — fase de decisão de cadastro',
    description: '⚡ LÓGICA ESTRATÉGICA: Sem prestadores não há plataforma. O engajamento de prestadores valida a demanda real. O volume de cadastros de prestadores determinará a alocação de budget para campanhas de clientes — quanto mais prestadores, maior o investimento em atrair clientes. Esta campanha mede e amplifica esse ciclo.',
    aiTool: ['VEO 3.1', 'CapCut', 'Midjourney'],
    viralMechanism: 'Prova social',
    cta: 'Salva, compartilha e se cadastra grátis',
    targetReach: 120000,
    subtasks: [
      // 2 CARROSSÉIS
      { id: 'eng-c1', title: '🎠 Carrossel 1 — "Quanto você vale? Descubra com a DQEF" (educacional + CTA)', done: false },
      { id: 'eng-c2', title: '🎠 Carrossel 2 — "Prestador DQEF vs sem plataforma" (comparativo visual)', done: false },
      // 4 VÍDEOS
      { id: 'eng-v1', title: '🎬 Vídeo 1 (Instagram) — Reels: Prestador usando o app ao vivo', done: false },
      { id: 'eng-v2', title: '🎬 Vídeo 2 (TikTok) — Dueto/resposta: "Qual é a sua profissão?"', done: false },
      { id: 'eng-v3', title: '🎬 Vídeo 3 (Instagram) — Stories: Enquete + swipe up cadastro', done: false },
      { id: 'eng-v4', title: '🎬 Vídeo 4 (TikTok) — POV: primeiro dia usando a DQEF', done: false },
      // 3 POSTS POR CANAL
      { id: 'eng-pi1', title: '🖼️ Post Instagram 1 — Depoimento UGC de prestador beta', done: false },
      { id: 'eng-pi2', title: '🖼️ Post Instagram 2 — "Você trabalha hoje e recebe hoje" (dado + visual)', done: false },
      { id: 'eng-pi3', title: '🖼️ Post Instagram 3 — CTA direto: "Vagas abertas para prestadores"', done: false },
      { id: 'eng-pt1', title: '🖼️ Post TikTok 1 — Stitch: "Minha comissão antes e depois"', done: false },
      { id: 'eng-pt2', title: '🖼️ Post TikTok 2 — Green screen: comparativo de comissões', done: false },
      { id: 'eng-pt3', title: '🖼️ Post TikTok 3 — Trend + produto: som viral + CTA cadastro', done: false },
      // INTELIGÊNCIA DE DADOS
      { id: 'eng-intel', title: '📊 Definir métricas de aferição: cadastros/dia por canal (base para alocação em clientes)', done: false },
      { id: 'eng-rev', title: '✅ Revisão final com Gabriel e aprovação da cadência de publicação', done: false },
    ],
    links: [],
    history: [
      { date: '2026-02-20', action: '🎯 Lógica definida: volume de cadastros de prestadores determina budget de campanhas de clientes.', user: 'Gabriel' },
    ],
  },

  // ===== SÉRIE O NINJA — 6 variações =====
  {
    id: 'camp-ninja-01',
    name: 'O Ninja na Piscina',
    channel: ['TikTok', 'Instagram', 'YouTube'],
    status: 'Aprovada',
    kanbanStatus: 'aprovado',
    priority: 'Alta',
    category: 'Awareness',
    responsible: 'Ana Lima',
    avatar: 'AL',
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    budget: 3000,
    funnel: 'Topo',
    objective: 'Humor viral — ninja destrói piscina, piscineiro DQEF resolve',
    audience: 'Prestadores piscineiros e proprietários com piscina — Florianópolis',
    description: 'Ninja é chamado pra tratar piscina verde. Analisa. Tira a espada. Corta o tubo do filtro em três pedaços. Água espirra pra todo lado. Piscineiro DQEF chega, olha o estrago, e diz a frase.',
    videoFormat: 'Reels 9:16',
    duration: 30,
    aiTool: ['VEO 3.1', 'Sora'],
    viralMechanism: 'Humor cômica',
    hook: '🏊 O ninja foi chamado pra tratar a piscina...',
    cta: 'Na DQEF você acha o piscineiro certo. Sem espada.',
    caption: 'Deixa que eu faço. 🧡 O ninja tentou. #DQEF #Piscineiro #Floripa',
    impressions: 0,
    clicks: 0,
    leads: 0,
    conversions: 0,
    budgetPaid: 2500,
    budgetOrganic: 500,
    targetReach: 200000,
    frames: [
      {
        id: 'frame-n01-a',
        label: 'Frame 01.A',
        title: 'A Piscina Verde',
        subtitle: 'Setup · Problema visível',
        timing: '0s — 4s',
        purpose: 'Estabelece o problema. Piscina completamente verde, equipamento de filtro visível ao lado. O prestador está esperando, chave na mão, ansioso.',
        prompt: 'Wide shot, 28mm lens, f/4.0. Small rectangular Brazilian residential backyard pool (5x3 meters) — water completely opaque dark green, thick algae bloom covering surface, waterline tiles stained dark brown-green. Pool deck: wet grey concrete, one plastic chair overturned. Beside the pool: a pool pump and filter unit visible against wall, plus a bucket of pool chemicals unopened, a long cleaning pole leaning. Standing at pool edge: Brazilian male pool technician (32 years, pardo skin, dark hair, work shorts and simple t-shirt, rubber sandals) — holding a water testing kit in both hands, staring at the green water with professional concern, brow furrowed. Lighting: midday sun, harsh overhead, green water reflecting strange light upward onto faces. Tropical vegetation over fence in background. Photorealistic, 4K. Still frame. No motion blur.',
        type: 'setup',
      },
      {
        id: 'frame-n01-b',
        label: 'Frame 01.B',
        title: 'A Espadada no Tubo',
        subtitle: 'O Desastre · Cena principal',
        timing: '12s — 18s',
        purpose: 'O ninja examina o filtro, não entende nada, tira a espada e corta o tubo. A cena mais engraçada da variação — precisa de impacto máximo.',
        prompt: 'Medium shot, 35mm lens, f/2.8. The ninja character — full black ninja costume, cloth mask, visible only eyes — crouching beside the pool pump and filter system against a white garden wall. He has pulled out his sword and is mid-swing, the blade connecting with the main PVC pipe that feeds the filter — the pipe is in the process of being severed, a jet of green water already spraying outward from the cut point in a dramatic arc. The ninja\'s expression (eyes only): focused and confident, as if this was the correct technical solution. His free hand holds a small notepad as if he was consulting it. Surrounding detail: the pool technician who was waiting is visible in background, hands raised in horror. FROZEN MOMENT: the split-second the pipe breaks. Water mid-air, crystallized. Photorealistic comedy, 4K. Still frame. No motion blur.',
        type: 'disaster',
      },
      {
        id: 'frame-n01-c',
        label: 'Frame 01.C',
        title: 'O Ninja Saindo Molhado',
        subtitle: 'Saída cômica · Dignidade mantida',
        timing: '20s — 24s',
        purpose: 'O ninja sai completamente encharcado mas em bico de pé, postura ereta, como se nada tivesse acontecido. A dignidade dele é o humor.',
        prompt: 'Wide shot from behind, 35mm lens, f/3.5. The ninja character walking away from the pool area toward a garden gate — completely soaking wet, ninja costume drenched and clinging to body, water dripping from every surface, a small puddle trail following his steps. Despite this, his posture is perfectly upright, head held high, shoulders back, arms swinging with purpose — he is walking on his tiptoes as if still being stealthy, completely unbothered. In his right hand: the sword in its scabbard, water dripping from the tip. Behind him: total chaos visible — broken pipe still spraying green water across the pool deck. FROZEN MOMENT: mid-stride. Still frame. Photorealistic comedy, 4K.',
        type: 'resolution',
      },
      {
        id: 'frame-n01-d',
        label: 'Frame 01.D',
        title: 'Piscineiro DQEF Chega',
        subtitle: 'Resolução · A frase final',
        timing: '25s — 30s',
        purpose: 'O piscineiro DQEF aparece no portão do jardim. Olha o estrago. Olha pro dono. Sem pressa. Sem susto. Já viu pior.',
        prompt: 'Eye-level medium shot, 35mm lens, f/2.5. Brazilian male pool technician (36 years, Black skin, athletic build, clean short hair, warm expression) standing at the open wooden gate of a residential garden. He wears a teal/turquoise work shirt (#00A7B5), dark shorts, rubber work sandals. He carries a professional pool chemical kit bag over one shoulder and a water testing kit in his hand. He has just arrived and is surveying the scene: the chaotic pool area — green water, broken pipe still dripping, wet concrete — with an expression of calm professional assessment. Not surprised. Not alarmed. The face of a man who has seen this before and knows exactly what to do. FROZEN MOMENT: he is taking his first breath before speaking. Photorealistic, 4K. Still frame. No motion blur.',
        type: 'hero',
      },
    ],
    subtasks: [
      { id: 'st-n01-1', title: 'Gerar frames no VEO 3.1', done: false },
      { id: 'st-n01-2', title: 'Edição e montagem', done: false },
      { id: 'st-n01-3', title: 'Aprovação criativa', done: false },
      { id: 'st-n01-4', title: 'Publicar em todos os canais', done: false },
    ],
    links: [],
    history: [
      { date: '2026-02-20', action: 'Variação criada — O Ninja na Piscina', user: 'Ana Lima' },
    ],
  },
  {
    id: 'camp-ninja-02',
    name: 'O Ninja na Encanação',
    channel: ['TikTok', 'Instagram'],
    status: 'Aprovada',
    kanbanStatus: 'desenvolvimento',
    priority: 'Alta',
    category: 'Awareness',
    responsible: 'Carlos Mendes',
    avatar: 'CM',
    startDate: '2026-03-05',
    endDate: '2026-04-05',
    budget: 2800,
    funnel: 'Topo',
    objective: 'Torneira pingando — ninja corta o cano, chafariz na cozinha',
    audience: 'Moradores de apartamento com problemas hidráulicos, Florianópolis',
    description: 'Torneira pingando há meses. Ninja analisa o cano sob a pia. Corta com a espada. Chafariz de água pela cozinha toda. Ninja sai pela janela com um parkour improvisado e sem graça. Marido de aluguel DQEF chega pela porta.',
    videoFormat: 'Reels 9:16',
    duration: 28,
    aiTool: ['VEO 3.1', 'Seedance'],
    viralMechanism: 'Humor cômica',
    hook: '🚿 A torneira estava pingando. O ninja foi resolver...',
    cta: 'Marido de aluguel DQEF: sem espada, sem chafariz.',
    caption: 'Deixa que eu faço. 🧡 #DQEF #MaridoDeAluguel #Encanador',
    impressions: 0,
    clicks: 0,
    leads: 0,
    conversions: 0,
    budgetPaid: 2200,
    budgetOrganic: 600,
    targetReach: 180000,
    frames: [
      {
        id: 'frame-n02-a',
        label: 'Frame 02.A',
        title: 'A Torneira Pingando',
        subtitle: 'Setup · A dor conhecida',
        timing: '0s — 4s',
        purpose: 'A torneira pingando. O dono olhando. Esse frame deve provocar identificação imediata — qualquer um já viveu isso.',
        prompt: 'Close-up shot, 50mm lens, f/2.2. Brazilian kitchen sink area — small apartment kitchen, beige ceramic tiles on wall, stainless steel single-basin sink, old chrome faucet with visible green mineral deposit buildup at base, slightly crooked handle. A single large water drop suspended in perfect mid-fall, 4cm below the faucet spout, crystallized in the air. Counter surface around sink: clean but with permanent water ring stains from months of dripping. Partially visible: apartment owner\'s crossed arms at frame bottom, posture of someone who has made peace with this situation. FROZEN MOMENT: the drop mid-fall. Still frame. No motion blur. Photorealistic, 4K. The drop must be crystal sharp.',
        type: 'setup',
      },
      {
        id: 'frame-n02-b',
        label: 'Frame 02.B',
        title: 'Chafariz na Cozinha',
        subtitle: 'O Desastre · Cena principal',
        timing: '13s — 18s',
        purpose: 'O resultado da espadada no cano sob a pia. Água em arco alto pela cozinha. O ninja está encharcado mas ainda em posição de análise.',
        prompt: 'Wide shot, 24mm lens, f/3.5. Small Brazilian apartment kitchen in chaos. A powerful jet of water shoots upward and outward from under the kitchen sink — the cut pipe is visible beneath the open cabinet doors, water erupting in a thick stream that hits the ceiling and cascades down across the entire kitchen. The ninja is standing directly beside the sink — completely soaked from head to toe, ninja costume drenched — but his posture is completely upright and his expression (eyes only) is one of calm academic interest. He holds the sword pointing downward, water dripping from the blade. FROZEN MOMENT: water stream at peak arc. Photorealistic comedy, 4K. Still frame. No motion blur.',
        type: 'disaster',
      },
      {
        id: 'frame-n02-c',
        label: 'Frame 02.C',
        title: 'O Parkour Sem Graça',
        subtitle: 'Saída cômica · Pela janela',
        timing: '19s — 23s',
        purpose: 'O ninja sai pela janela da cozinha com o que acha ser parkour elegante mas na verdade é uma saída de lado e desajeitada.',
        prompt: 'Medium shot from inside kitchen looking toward window, 35mm lens, f/3.2. Small Brazilian apartment kitchen window — white aluminum frame, partially open. The ninja character is in the process of exiting through the window: one leg already outside, body twisted at an awkward angle, arms gripping the window frame. His expression (eyes): intense focus, as if this is a highly skilled maneuver. In reality, his body position is graceless — one shoulder jammed against the frame, knee hitting the counter below the window, soaking wet clothes making everything harder. FROZEN MOMENT: mid-exit, peak awkwardness. Still frame. No motion blur. Photorealistic comedy, 4K.',
        type: 'resolution',
      },
      {
        id: 'frame-n02-d',
        label: 'Frame 02.D',
        title: 'Marido de Aluguel DQEF',
        subtitle: 'Resolução · A frase final',
        timing: '24s — 28s',
        purpose: 'O marido de aluguel DQEF entra pela porta da frente. Molha o pé no corredor. Olha para o dono. A expressão é de "já sei o que aconteceu".',
        prompt: 'Medium shot, eye-level, 35mm lens, f/2.5. Brazilian male handyman (38 years, mixed race, short beard, friendly face) standing in the front doorway of the apartment. He wears a teal/turquoise work shirt (#00A7B5), dark cargo pants, work boots. One foot is mid-step, about to enter the apartment — the water from the kitchen has flowed to the entrance hallway and is lapping at his boot. He is looking at the apartment owner with an expression of patient, knowing professionalism. His tool bag is over one shoulder, a pipe wrench visible at the top. FROZEN MOMENT: the exact second his boot touches the water. Photorealistic, 4K. Still frame.',
        type: 'hero',
      },
    ],
    subtasks: [
      { id: 'st-n02-1', title: 'Gerar frames no VEO 3.1', done: false },
      { id: 'st-n02-2', title: 'Edição e montagem', done: false },
    ],
    links: [],
    history: [
      { date: '2026-02-20', action: 'Variação criada — O Ninja na Encanação', user: 'Carlos Mendes' },
    ],
  },
  {
    id: 'camp-ninja-03',
    name: 'O Ninja na Pintura',
    channel: ['TikTok', 'Instagram'],
    status: 'Rascunho',
    kanbanStatus: 'ideia',
    priority: 'Média',
    category: 'Awareness',
    responsible: 'Juliana Costa',
    avatar: 'JC',
    startDate: '2026-03-10',
    endDate: '2026-04-10',
    budget: 2500,
    funnel: 'Topo',
    objective: 'Parede com mancha — ninja pinta tudo de preto, pintor DQEF corrige',
    audience: 'Proprietários com serviços de pintura e reforma — Florianópolis',
    description: 'Parede com uma única mancha pequena. Ninja analisa. Pinta a parede inteira de preto fosco. Com rolo rápido e determinado. Pintor DQEF chega, olha, suspira, e começa a trabalhar.',
    videoFormat: 'Reels 9:16',
    duration: 30,
    aiTool: ['VEO 3.1'],
    viralMechanism: 'Humor cômica',
    hook: '🎨 A parede tinha só uma manchinha...',
    cta: 'Pintor DQEF: a cor certa, do jeito certo.',
    caption: 'Deixa que eu faço. 🧡 #DQEF #Pintor #Reforma',
    impressions: 0,
    clicks: 0,
    leads: 0,
    conversions: 0,
    budgetPaid: 2000,
    budgetOrganic: 500,
    targetReach: 150000,
    subtasks: [
      { id: 'st-n03-1', title: 'Roteiro aprovado', done: false },
    ],
    links: [],
    history: [],
  },
  {
    id: 'camp-ninja-04',
    name: 'O Ninja na Tomada',
    channel: ['TikTok', 'Instagram', 'YouTube'],
    status: 'Rascunho',
    kanbanStatus: 'ideia',
    priority: 'Alta',
    category: 'Awareness',
    responsible: 'Ana Lima',
    avatar: 'AL',
    startDate: '2026-03-15',
    endDate: '2026-04-15',
    budget: 3200,
    funnel: 'Topo',
    objective: 'Tomada com faísca — ninja corta fio principal, apagão total',
    audience: 'Moradores com problemas elétricos — eletricistas como público alvo',
    description: 'Tomada fazendo faísca. Ninja analisa com atenção. Tira espada. Corta o fio principal da casa. Apagão total. Ninja sai andando no escuro, colidindo com tudo. Eletricista DQEF aparece com lanterna.',
    videoFormat: 'Reels 9:16',
    duration: 30,
    aiTool: ['VEO 3.1', 'Sora'],
    viralMechanism: 'Humor cômica',
    hook: '⚡ A tomada estava faiscando. O ninja foi dar uma olhada...',
    cta: 'Eletricista DQEF: sem apagão, sem espada.',
    caption: 'Deixa que eu faço. 🧡 #DQEF #Eletricista #Apagão',
    impressions: 0,
    clicks: 0,
    leads: 0,
    conversions: 0,
    budgetPaid: 2700,
    budgetOrganic: 500,
    targetReach: 250000,
    subtasks: [
      { id: 'st-n04-1', title: 'Roteiro aprovado', done: false },
      { id: 'st-n04-2', title: 'Frames gerados', done: false },
    ],
    links: [],
    history: [],
  },
];

// ===== CONTEÚDOS EDITORIAIS =====
export const initialContents: ContentItem[] = [
  { id: 'cont-001', title: 'ASMR Eletricista — Teaser', format: 'Reels', channel: 'Instagram', date: '2026-02-20', status: 'Aprovado', copy: 'Zero rosto. Zero texto. Só o som do serviço perfeito. 🔧', responsible: 'Ana Lima' },
  { id: 'cont-002', title: '#FazAContaTu — Vídeo Seed', format: 'Reels', channel: 'TikTok', date: '2026-02-21', status: 'Em produção', copy: 'Faz a conta. Quanto ficou com você esse mês? 🔢', responsible: 'Carlos Mendes' },
  { id: 'cont-003', title: 'Carrossel: Perfis de Prestadores', format: 'Carrossel', channel: 'Instagram', date: '2026-02-22', status: 'Rascunho', responsible: 'Juliana Costa' },
  { id: 'cont-004', title: 'Stories: Enquete — Você cobra o certo?', format: 'Stories', channel: 'Instagram', date: '2026-02-22', status: 'Aprovado', responsible: 'Ana Lima' },
  { id: 'cont-005', title: 'Post: Dados do mercado informal', format: 'Post', channel: 'LinkedIn', date: '2026-02-24', status: 'Rascunho', responsible: 'Carlos Mendes' },
  { id: 'cont-006', title: 'Reels: POV Prestador - dia a dia', format: 'Reels', channel: 'TikTok', date: '2026-02-25', status: 'Em produção', responsible: 'Ana Lima' },
  { id: 'cont-007', title: 'Carrossel: 5 sinais que você precisa de gestão', format: 'Carrossel', channel: 'Instagram', date: '2026-02-26', status: 'Aprovado', responsible: 'Juliana Costa' },
  { id: 'cont-008', title: 'Ads: Captação prestadores Floripa', format: 'Ads', channel: 'Meta Ads', date: '2026-02-28', status: 'Publicado', responsible: 'Carlos Mendes' },
  { id: 'cont-009', title: 'Shorts: O Bilhão do Bolso', format: 'Shorts', channel: 'YouTube', date: '2026-03-01', status: 'Rascunho', responsible: 'Ana Lima' },
  { id: 'cont-010', title: 'Post: Depoimento prestador (UGC)', format: 'Post', channel: 'Instagram', date: '2026-03-03', status: 'Rascunho', responsible: 'Juliana Costa' },
  { id: 'cont-011', title: 'Stories: Tutorial cadastro DQEF', format: 'Stories', channel: 'Instagram', date: '2026-03-05', status: 'Rascunho', responsible: 'Carlos Mendes' },
  { id: 'cont-012', title: 'Reels: As Mãos Que Constroem', format: 'Reels', channel: 'Instagram', date: '2026-03-08', status: 'Rascunho', responsible: 'Ana Lima' },
];

// ===== COPIES PRONTAS =====
export const initialCopies: CopyItem[] = [
  {
    id: 'copy-001',
    title: 'CTA Cadastro Prestador — Urgência',
    copy: 'Florianópolis tem mais de 50.000 prestadores autônomos. A maioria ainda paga comissão absurda para plataforma que não te conhece.\n\nNa DQEF, você é nome. Não é número.\n\nCadastro gratuito. Sem taxa de entrada. Você paga só quando recebe. ↓',
    channel: ['Instagram', 'TikTok'],
    objective: 'Conversão',
    category: 'Prestadores',
    tags: ['cadastro', 'urgência', 'gratuito', 'prestador'],
  },
  {
    id: 'copy-002',
    title: 'Hook Financeiro — Quanto Você Perdeu',
    copy: 'Faz a conta:\nSe você fatura R$5.000/mês e paga 27% de comissão...\n\nVocê deu R$1.350 para a plataforma.\nEm 12 meses: R$16.200.\nEm 5 anos: R$81.000.\n\nSe fosse seu, o que você faria com esse dinheiro?',
    channel: ['Instagram', 'TikTok', 'LinkedIn'],
    objective: 'Awareness',
    category: 'Choque Financeiro',
    tags: ['comissão', 'dinheiro', 'cálculo', 'impacto'],
  },
  {
    id: 'copy-003',
    title: 'Posicionamento Anti-Plataforma',
    copy: 'A plataforma te prometeu cliente.\nTe deu lead frio que não responde.\nTe cobrou mesmo assim.\n\nNa DQEF é diferente:\n✅ Você só paga quando o trabalho acontece\n✅ Sem mensalidade\n✅ Sem pegadinha\n\nSimples assim.',
    channel: ['Instagram', 'Meta Ads'],
    objective: 'Conversão',
    category: 'Diferencial',
    tags: ['anti-concorrência', 'diferencial', 'simples'],
  },
  {
    id: 'copy-004',
    title: 'Identidade — As Mãos Que Constroem',
    copy: 'Você faz com as mãos o que ninguém sabe fazer.\n\nInstala. Repara. Limpa. Cuida.\nToda casa tem uma história escrita pelo seu trabalho.\n\nVocê merece uma plataforma que trabalha tanto quanto você.',
    channel: ['Instagram', 'YouTube'],
    objective: 'Engajamento',
    category: 'Identidade',
    tags: ['emoção', 'identidade', 'orgulho', 'prestador'],
  },
  {
    id: 'copy-005',
    title: 'Stories — Enquete Engajamento',
    copy: 'Pergunta rápida 👇\n\nVocê já teve lead que sumiu depois que você pagou pela indicação?\n\n🔴 Sim, várias vezes\n🟢 Não, nunca aconteceu\n\n[Stories com enquete]',
    channel: ['Instagram'],
    objective: 'Engajamento',
    category: 'Enquete',
    tags: ['enquete', 'stories', 'engajamento', 'interação'],
  },
  {
    id: 'copy-006',
    title: 'LinkedIn — Institucional Mercado',
    copy: 'O mercado de serviços residenciais no Brasil movimenta R$180 bilhões por ano.\n\nMas o prestador autônomo ainda depende de:\n• Indicação boca a boca\n• Plataformas com comissões absurdas\n• Grupos de WhatsApp desorganizados\n\nA DQEF chegou para resolver isso em Florianópolis.\n\nSe você trabalha com serviços residenciais, vem conversar.',
    channel: ['LinkedIn'],
    objective: 'Awareness',
    category: 'Institucional',
    tags: ['linkedin', 'mercado', 'dados', 'institucional'],
  },
  {
    id: 'copy-007',
    title: 'UGC Caption — Depoimento Estilo',
    copy: '"Trabalhei 3 anos pagando R$600/mês de mensalidade para aparecer em plataforma. Em 2 meses na DQEF recebi 8 clientes novos e não paguei nada antes de fechar o serviço."\n\n— Marcos, eletricista, Florianópolis\n\nSua história pode ser a próxima. 🔧',
    channel: ['Instagram', 'TikTok'],
    objective: 'Conversão',
    category: 'Prova Social',
    tags: ['depoimento', 'ugc', 'prova social', 'eletricista'],
  },
  {
    id: 'copy-008',
    title: 'Meta Ads — Copy Direta',
    copy: 'Prestador de serviço em Floripa?\n\nChega de pagar para aparecer.\nNa DQEF você cadastra grátis e só paga quando fechar serviço.\n\nSe inscreva agora →',
    channel: ['Meta Ads'],
    objective: 'Conversão',
    category: 'Anúncio Direto',
    tags: ['ads', 'direto', 'cadastro', 'gratuito'],
  },
];

// ===== ROTEIROS DE CARROSSEL =====
export const initialRoteiros: Roteiro[] = [
  {
    id: 'rot-001',
    title: 'A Conta que Ele Nunca Fez',
    subtitle: 'Quanto você perdeu esse mês sem perceber?',
    format: 'Reels',
    channel: ['Instagram', 'TikTok'],
    audience: 'Qualquer prestador que usa plataforma concorrente',
    concept: 'Tela de celular em close extremo. Calculadora aberta. Uma mão calejada digita os números devagar. Sem fala. Sem narração. Só o som dos dedos na tela e o resultado aparecendo. O número final congela. Câmera sobe lentamente para o rosto. A expressão diz tudo — choque silencioso.',
    scenes: [
      '0s–2s: Close na mão calejada digitando na calculadora. Som seco dos dedos. Câmera locked.',
      '2s–5s: Tela da calculadora em detalhe: aparece o faturamento bruto. Então: × 0,27 = R$ [valor alto]. Pausa longa no resultado.',
      '5s–8s: Câmera sobe devagar para o rosto — homem 40 anos, mão na testa, olhando o número. Silêncio total.',
      'Fade para preto. Texto aparece: "Isso vai para a plataforma. Todo mês."',
    ],
    caption: 'Faz a conta. Quanto ficou com você esse mês? 🔢 Link na bio.',
    viralTrigger: 'Choque financeiro — ele vai fazer a conta dele logo depois',
    persona: 'Eletricista, marido de aluguel, piscineiro',
  },
  {
    id: 'rot-002',
    title: 'O Lead Que Sumiu',
    subtitle: 'Você pagou. Ele nunca respondeu.',
    format: 'Reels',
    channel: ['TikTok', 'Instagram'],
    audience: 'Eletricista, marido de aluguel, piscineiro que usou GetNinja ou similar',
    concept: 'WhatsApp em tela cheia. Conversa real com um cliente fictício. Mensagem enviada: "Olá! Vi seu pedido de orçamento. Posso te atender amanhã!" — dois checks cinzas. Nunca virou azul. Nunca respondeu.',
    scenes: [
      '0s–3s: Tela do WhatsApp em close. Mensagem enviada com dois checks cinzas. Scroll lento revelando que faz 3 dias. Sem resposta.',
      '3s–6s: Notificação aparece: "Crédito debitado: R$45,00 — lead adquirido." O contraste é brutal.',
      '6s–10s: Câmera abre: eletricista com uniforme, olhando o telefone no carro. Expressão: raiva contida.',
      'Tela preta. Texto: "Chega de pagar por promessa. Conheça a DQEF."',
    ],
    caption: 'Quantas vezes isso aconteceu com você? 😤 Comenta o número de leads que sumiram.',
    viralTrigger: 'Reconhecimento imediato — ele já viveu essa cena exata',
    persona: 'Prestadores que já foram prejudicados por plataformas concorrentes',
  },
  {
    id: 'rot-003',
    title: 'As Mãos Que Constroem',
    subtitle: 'Você faz com as mãos o que ninguém sabe fazer.',
    format: 'Reels',
    channel: ['Instagram', 'YouTube'],
    audience: 'Todos os prestadores — conteúdo de identidade e valorização',
    concept: 'Puramente visual. Sem texto. Sem narração. Série de closes em câmera lenta elegante: mãos de diferentes prestadores trabalhando. Música instrumental tensa e bonita.',
    scenes: [
      'Mão do eletricista passando cabo com precisão',
      'Mão do piscineiro ajustando produto químico',
      'Mão da diarista organizando cama Airbnb com perfeição',
      'Mão do marido de aluguel aparafusando com detalhe',
      'Fade para laranja com logo DQEF. Nada mais.',
    ],
    caption: 'Cada serviço tem uma história. A sua começa aqui. 🧡 @deixaqueeufaco',
    viralTrigger: 'Identificação emocional profunda — o prestador se vê no vídeo',
    persona: 'Todos os perfis — conteúdo universalmente identificável',
  },
  {
    id: 'rot-004',
    title: 'ASMR do Serviço Perfeito',
    subtitle: '8 segundos de satisfação sensorial pura.',
    format: 'Reels',
    channel: ['Instagram', 'TikTok'],
    audience: 'Todos os públicos — conteúdo de satisfação sensorial',
    concept: 'Zero rosto. Zero texto. Zero narração. Só sons em câmera lenta extrema: chave de fenda encaixando perfeitamente. Nível de bolha centralizando. Tinta lisa cobrindo imperfeição.',
    scenes: [
      'Chave de fenda encaixando com clique satisfatório',
      'Nível de bolha centralizando com o "click" final',
      'Tinta lisa cobrindo uma imperfeição — câmera lenta',
      'Água cristalina entrando em piscina limpa',
      'No segundo 8: som do PIX. Tela preta. "Esse é o fim do dia perfeito."',
    ],
    caption: 'O som do trabalho bem feito. 🔧 Qual é o seu? Comenta abaixo.',
    viralTrigger: 'ASMR de serviços está zerado no mercado BR. Alta taxa de conclusão.',
    persona: 'Todos os públicos — satisfação sensorial é universal',
  },
  {
    id: 'rot-005',
    title: 'POV: Você É o Prestador',
    subtitle: 'Câmera subjetiva 100%. Você vive o dia.',
    format: 'Reels',
    channel: ['TikTok', 'YouTube'],
    audience: 'Prestadores 25-45 anos — alta identificação com POV',
    concept: 'Câmera 100% POV — você é o prestador. Sem mostrar rosto. Sem narração. Sequência imersiva do dia de trabalho.',
    scenes: [
      'Acorda, olha o celular: agenda vazia.',
      'Dirige até o serviço — mãos no volante, cidade passando.',
      'Suas mãos trabalham com precisão no serviço.',
      'Cliente entrega as chaves. Você guarda a ferramenta.',
      'Telefone vibra. PIX recebido. Tela: "Esse é o seu dia. Todo dia."',
    ],
    caption: 'POV: você construiu algo hoje. E recebeu pelo que vale. 💪',
    viralTrigger: 'POV imersivo tem taxa de conclusão 40% maior. O prestador sente que é ELE no vídeo.',
    persona: 'Prestadores que buscam autonomia e controle da própria agenda',
  },
  {
    id: 'rot-006',
    title: 'Carrossel: 5 Tipos de Prestador em Floripa',
    subtitle: 'Qual é o seu perfil?',
    format: 'Carrossel',
    channel: ['Instagram'],
    audience: 'Todos os prestadores de Florianópolis',
    concept: 'Carrossel com 6 slides. Cada slide apresenta um perfil de prestador com dados reais do mercado. Tom empático e de reconhecimento.',
    scenes: [
      'Slide 1 (Capa): "Qual tipo de prestador é você? 👇" — fundo laranja DQEF',
      'Slide 2: ⚡ O Eletricista — Alta demanda, agenda irregular, cobra menos do que deveria',
      'Slide 3: 🏊 O Piscineiro — Sazonal crítico, outubro a março, carteira fiel',
      'Slide 4: 🔧 O Marido de Aluguel — Alta conversão, faz tudo, subestimado',
      'Slide 5: 🧹 A Diarista Airbnb — Recorrência alta, 3-5 clientes fixos, cresce no orgânico',
      'Slide 6 (CTA): "Qualquer que seja o seu perfil, a DQEF foi feita para você. Link na bio."',
    ],
    caption: 'Comenta com ⚡🏊🔧🧹 o que você é! E salva esse post — você vai usar depois.',
    viralTrigger: 'Identificação com personas específicas gera compartilhamento e salvar',
    persona: 'Todos os prestadores de Florianópolis',
  },
  {
    id: 'rot-007',
    title: 'O Bilhão do Seu Bolso',
    subtitle: 'O contador não para.',
    format: 'Shorts',
    channel: ['TikTok', 'YouTube'],
    audience: 'Prestadores indignados com o mercado — conteúdo de injustiça coletiva',
    concept: 'Tela preta. Um número começa a subir em tempo real. Enquanto você assiste, alguém está perdendo. Câmera fecha no contador que não para.',
    scenes: [
      'Tela preta com contador: R$ 1.247.832.000,00 e crescendo...',
      'Texto aparece: "Valor pago em comissões por prestadores brasileiros este ano"',
      'Contador acelera. Número fica enorme.',
      'Câmera fecha. Texto final: "Uma parte desse dinheiro é seu. E você pode parar de pagar."',
    ],
    caption: 'Esse dinheiro saiu do bolso de quem faz o trabalho pesado. Chega. 💪',
    viralTrigger: 'Dado em escala nacional cria senso de injustiça coletiva — propaga por solidariedade de classe',
    persona: 'Prestadores indignados, LinkedIn, todos os canais',
  },
  {
    id: 'rot-008',
    title: 'Carrossel: Por Que a DQEF É Diferente',
    subtitle: '3 razões simples e diretas.',
    format: 'Carrossel',
    channel: ['Instagram', 'LinkedIn'],
    audience: 'Prestadores que já conhecem o problema mas não a solução',
    concept: 'Carrossel clean e direto. Sem rodeios. 3 diferenciais reais da plataforma. Tom de clareza e confiança.',
    scenes: [
      'Slide 1 (Capa): "Por que a DQEF é diferente?" — fundo escuro, texto laranja',
      'Slide 2: ✅ Você só paga quando fecha — sem mensalidade, sem surpresa',
      'Slide 3: ✅ Clientes verificados — não é lead frio comprado em lista',
      'Slide 4: ✅ Você controla a agenda — sem algoritmo decidindo quem aparece',
      'Slide 5 (CTA): "Simples assim. Cadastro gratuito. Link na bio."',
    ],
    caption: 'Três razões. Uma decisão. Salva para lembrar. 🔖',
    viralTrigger: 'Clareza extrema gera confiança — o prestador que está em dúvida decide',
    persona: 'Prestadores em fase de consideração — meio do funil',
  },
];

// ===== IDEIAS DISRUPTIVAS =====
export const initialIdeias: IdeiaDisruptiva[] = [
  {
    id: 'ideia-001',
    title: 'ASMR do Serviço — Formato Inédito',
    format: 'Reels / TikTok',
    channel: ['TikTok', 'Instagram'],
    concept: 'Zero rosto. Zero texto. Zero narração. Só sons em câmera lenta: chave encaixando, bolha centralizando, tinta cobrindo imperfeição, água cristalina. No segundo 8: som do PIX. Tela preta.',
    whyViral: 'ASMR de serviços está zerado no mercado BR. O algoritmo ama conteúdo com alta taxa de conclusão — e ASMR prende até o fim.',
    status: 'Aprovada',
    impact: 'Alto',
  },
  {
    id: 'ideia-002',
    title: '#FazAContaTu — Desafio Viral',
    format: 'Challenge Viral',
    channel: ['TikTok', 'Instagram', 'YouTube'],
    concept: 'A DQEF lança desafio devastador: mostre quanto a plataforma tirou de você. Vídeo seed mostra o cálculo ao vivo. Prestador olha o número, olha para câmera: "Quanto?" Tela preta.',
    whyViral: 'Todo prestador que já usou plataforma concorrente vai compartilhar. "Olha o que fizeram" é o gatilho de compartilhamento mais poderoso que existe.',
    status: 'Aprovada',
    impact: 'Alto',
  },
  {
    id: 'ideia-003',
    title: 'POV Subjetivo — Você É o Prestador',
    format: 'Reels / POV',
    channel: ['TikTok', 'YouTube'],
    concept: 'Câmera 100% POV. Sem ator. Sem rosto. O espectador VIVE a experiência completa — acorda, trabalha, recebe o PIX.',
    whyViral: 'POV imersivo tem taxa de conclusão 40% maior. O prestador sente que é ELE no vídeo. Identificação máxima. Custo baixo.',
    status: 'Aprovada',
    impact: 'Alto',
  },
  {
    id: 'ideia-004',
    title: 'O Contrato Que Você Assinou Sem Ler',
    format: 'Texto / Impacto',
    channel: ['TikTok', 'Instagram'],
    concept: 'Close lento em termos de serviço de plataforma concorrente. Câmera vai passando pelas cláusulas abusivas. Narração lê os pontos mais chocantes. Prestador ouve, expressão vai de neutro a raiva fria.',
    whyViral: 'Todo prestador que já assinou algo sem ler vai sentir a pancada. Raiva compartilhável.',
    status: 'Pendente',
    impact: 'Alto',
  },
  {
    id: 'ideia-005',
    title: 'O Bilhão do Seu Bolso — Dado em Tempo Real',
    format: 'Contador Live',
    channel: ['TikTok', 'LinkedIn', 'YouTube'],
    concept: 'Tela preta. Um número começa a subir em tempo real: valor total pago em comissões por prestadores brasileiros. Câmera fecha no contador. Texto final: "Uma parte desse dinheiro é seu."',
    whyViral: 'Dado em escala nacional cria senso de injustiça coletiva. Propaga por solidariedade de classe.',
    status: 'Aprovada',
    impact: 'Alto',
  },
  {
    id: 'ideia-006',
    title: 'Ativação Presencial — QR Code nas Ferramentas',
    format: 'Ativação Física',
    channel: ['Orgânico'],
    concept: 'Adesivos com QR Code nos principais pontos de venda de materiais elétricos, hidráulicos e de limpeza de Florianópolis. Prestador vê no ponto de venda, escaneia, já cadastra.',
    whyViral: 'Contexto perfeito — o prestador está comprando para trabalhar. Momento de maior receptividade.',
    status: 'Pendente',
    impact: 'Médio',
  },
  {
    id: 'ideia-007',
    title: 'Live de Comparação — Ao Vivo',
    format: 'Live',
    channel: ['Instagram', 'YouTube'],
    concept: 'Live mostrando ao vivo quanto um prestador pagaria em cada plataforma vs. DQEF para o mesmo serviço. Interativo: espectadores mandam seus números e calculam junto.',
    whyViral: 'Transparência radical. Números reais. Difícil de refutar. Geração de conteúdo orgânico pelos participantes.',
    status: 'Pendente',
    impact: 'Médio',
  },
  {
    id: 'ideia-008',
    title: 'Série Documental — Uma Semana na Vida',
    format: 'Série / Mini-doc',
    channel: ['YouTube', 'Instagram'],
    concept: 'Mini-documentário acompanhando um prestador real por uma semana — com e sem a DQEF. Mostra a diferença concreta na organização, captação e faturamento.',
    whyViral: 'Formato de longa duração cria conexão profunda. Prestador vira personagem identificável.',
    status: 'Descartada',
    impact: 'Médio',
  },
  {
    id: 'ideia-009',
    title: 'Série "O Ninja" — 6 Variações AI Video',
    format: 'AI Video Series / VEO 3.1',
    channel: ['TikTok', 'Instagram', 'YouTube'],
    concept: 'Série humorística: Ninja incompetente destrói serviço (piscina, encanação, pintura, tomada, gesso, portão). Prestador DQEF entra e resolve. Cada episódio 28-30s gerado no VEO 3.1/Sora.',
    whyViral: 'Humor + AI video generation = custo baixo, escala alta. Personagem recorrente cria expectativa de série.',
    status: 'Aprovada',
    impact: 'Alto',
  },
];

// ===== ESTRATÉGIAS POR PÚBLICO =====
export const initialEstrategias: EstrategiaPublico[] = [
  {
    id: 'est-001',
    persona: 'O Eletricista',
    icon: '⚡',
    profile: 'Aprendeu o ofício na prática ou com familiar. Sabe que seu serviço é essencial mas tem medo de cobrar o que vale. Agenda irregular — ou atolado ou parado.',
    ageRange: '35–50 anos',
    avgRate: 'R$80–120/hora',
    painPoints: [
      'Agenda irregular — ou atolado ou parado',
      'Medo de cobrar o valor justo',
      'Dependência de indicação boca a boca',
      'Plataformas que cobram antes de garantir o serviço',
      'Concorrência com preço baixo desqualificado',
    ],
    approach: 'Alta demanda — abordagem de valorização financeira e profissional. Mostrar que ele pode cobrar mais e ter agenda cheia sem pagar taxa absurda.',
    hooks: [
      'Faz a conta: quanto a plataforma tirou de você esse mês?',
      'Você instala o Brasil. Merece cobrar o que vale.',
      'Agenda cheia sem pagar por lead frio.',
    ],
    channels: ['TikTok', 'Instagram', 'Meta Ads'],
  },
  {
    id: 'est-002',
    persona: 'O Piscineiro',
    icon: '🏊',
    profile: 'Em Floripa, vive de outubro a março. Nos outros meses, busca bicos ou fica parado. Tem carteira fiel de clientes mas não sabe escalar. Altamente local.',
    ageRange: '28–45 anos',
    avgRate: '6 meses de alta temporada',
    painPoints: [
      'Sazonalidade crítica — 6 meses bons, 6 meses difíceis',
      'Não sabe como ampliar a carteira de clientes',
      'Alta dependência do boca a boca de temporada',
      'Falta de ferramentas de gestão de agenda',
    ],
    approach: 'Sazonal crítico — abordagem de estabilidade e escala. Mostrar como a DQEF pode garantir renda nos meses de baixa temporada.',
    hooks: [
      'Outubro a março é só o começo. A DQEF funciona o ano todo.',
      'Sua carteira de clientes pode crescer mesmo na baixa temporada.',
    ],
    channels: ['Instagram', 'Meta Ads', 'Orgânico'],
  },
  {
    id: 'est-003',
    persona: 'O Marido de Aluguel',
    icon: '🔧',
    profile: 'Faz tudo um pouco. Instalações, reparos, pequenas obras. Problema: cliente subestima o serviço porque "é coisa simples". Dificuldade de dependência de 2–3 clientes fixos.',
    ageRange: '30–48 anos',
    avgRate: 'R$60–100/hora',
    painPoints: [
      'Clientes subestimam e querem pagar menos',
      'Dependência de 2-3 clientes fixos — perder um desestabiliza tudo',
      'Dificuldade de precificação de serviços variados',
      'Alta versatilidade não reconhecida como diferencial',
    ],
    approach: 'Alta conversão — abordagem de valorização da versatilidade e diversificação de clientes. A DQEF como base para construir agenda diversa.',
    hooks: [
      'Você resolve tudo. A DQEF resolve o resto.',
      'De 3 clientes para 30 — sem depender de um só.',
    ],
    channels: ['TikTok', 'Instagram', 'Meta Ads'],
  },
  {
    id: 'est-004',
    persona: 'A Diarista / Limpeza Airbnb',
    icon: '🧹',
    profile: 'Recorrência altíssima. 3-5 clientes fixos que representam 80% da renda. Cresce no orgânico — indicações são sua força. Airbnb Floripa é nicho premium com alta demanda.',
    ageRange: '25–45 anos',
    avgRate: 'R$150–300/diária',
    painPoints: [
      'Concentração de renda em poucos clientes fixos',
      'Falta de sistema para gerenciar múltiplos Airbnbs',
      'Comunicação manual e descoordenada com proprietários',
      'Sazonalidade do turismo afetando a demanda',
    ],
    approach: 'Recorrência alta — abordagem de organização, escala e premium. A DQEF como ferramenta profissional para crescer no mercado Airbnb de Floripa.',
    hooks: [
      'Floripa tem 12.000 Airbnbs. Só quem é organizado fica com todos.',
      'De 3 para 10 Airbnbs — com a agenda na mão.',
    ],
    channels: ['Instagram', 'Meta Ads', 'Orgânico'],
  },
];
