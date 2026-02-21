// ===== DQEF Hub — Seed Data =====
// Dados reais extraídos dos documentos estratégicos da DQEF
// SEED VERSION: bump this to force localStorage reset when seed changes
export const SEED_VERSION = '2026-02-21-v5';

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
    id: 'camp-exemplo',
    name: 'Campanha Exemplo — Marca Pessoal',
    channel: ['Instagram', 'TikTok'],
    status: 'Ativa',
    kanbanStatus: 'desenvolvimento',
    priority: 'Alta',
    category: 'Awareness',
    responsible: 'CMO',
    avatar: 'CM',
    startDate: '2026-02-20',
    endDate: '2026-03-20',
    budget: 5000,
    funnel: 'Topo',
    objective: 'Posicionar a marca pessoal como referência no segmento através de conteúdo estratégico',
    audience: 'Empreendedores e prestadores de serviço 25-45 anos',
    description: 'Campanha de exemplo para demonstrar o fluxo completo: briefing → IA → Kanban → Calendário. Edite ou exclua este card e crie o seu.',
    hook: 'Você já parou para pensar quanto dinheiro está deixando na mesa?',
    cta: 'Comece agora — link na bio',
    impressions: 45000,
    clicks: 1800,
    leads: 320,
    conversions: 48,
    cpc: 1.20,
    cpl: 5.80,
    roas: 4.2,
    budgetPaid: 1860,
    budgetOrganic: 0,
    subtasks: [
      { id: 'st-ex-1', title: 'Definir briefing da campanha', done: true },
      { id: 'st-ex-2', title: 'Gerar plano com IA', done: true },
      { id: 'st-ex-3', title: 'Criar peças visuais', done: false },
      { id: 'st-ex-4', title: 'Agendar publicações', done: false },
    ],
    links: [],
    history: [
      { date: '2026-02-20T10:00:00Z', action: 'Campanha criada como exemplo', user: 'CMO' },
    ],
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
