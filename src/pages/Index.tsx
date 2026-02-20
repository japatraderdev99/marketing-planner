import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { initialCampaigns, initialContents, Campaign, ContentItem } from '@/data/seedData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Megaphone, FileText, TrendingUp, DollarSign,
  AlertTriangle, ArrowRight, Plus, Calendar,
  Clock, CheckCircle2, AlertCircle, Zap
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const ORANGE = 'hsl(33, 100%, 50%)';
const TEAL = 'hsl(185, 100%, 36%)';

const trendData = [
  { day: '01/02', instagram: 3, tiktok: 2, meta: 1 },
  { day: '03/02', instagram: 4, tiktok: 3, meta: 2 },
  { day: '05/02', instagram: 2, tiktok: 4, meta: 1 },
  { day: '07/02', instagram: 5, tiktok: 3, meta: 3 },
  { day: '10/02', instagram: 6, tiktok: 5, meta: 2 },
  { day: '13/02', instagram: 4, tiktok: 6, meta: 4 },
  { day: '16/02', instagram: 7, tiktok: 4, meta: 3 },
  { day: '19/02', instagram: 5, tiktok: 7, meta: 5 },
];

const channelData = [
  { name: 'Instagram', value: 38, color: ORANGE },
  { name: 'TikTok', value: 28, color: TEAL },
  { name: 'Meta Ads', value: 22, color: '#8B5CF6' },
  { name: 'LinkedIn', value: 12, color: '#3B82F6' },
];

const KANBAN_STATUS_ORDER = ['ideia', 'desenvolvimento', 'revisao', 'aprovado', 'publicado'];
const STATUS_LABEL: Record<string, string> = {
  ideia: 'Ideia',
  desenvolvimento: 'Em Desenvolvimento',
  revisao: 'Revisão',
  aprovado: 'Aprovado',
  publicado: 'Publicado',
};
const PRIORITY_COLOR: Record<string, string> = {
  Alta: 'bg-red-500/20 text-red-400 border-red-500/30',
  Média: 'bg-primary/20 text-primary border-primary/30',
  Baixa: 'bg-green-500/20 text-green-400 border-green-500/30',
};
const CONTENT_STATUS_COLOR: Record<string, string> = {
  Rascunho: 'bg-muted text-muted-foreground',
  'Em produção': 'bg-primary/20 text-primary',
  Aprovado: 'bg-teal/20 text-teal',
  Publicado: 'bg-green-500/20 text-green-400',
};

function HealthScoreCircle({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? TEAL : score >= 50 ? ORANGE : '#EF4444';

  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <svg className="-rotate-90" width="112" height="112">
        <circle cx="56" cy="56" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
        <circle
          cx="56" cy="56" r={radius} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-2xl font-black" style={{ color }}>{score}</span>
        <p className="text-[10px] font-medium text-muted-foreground">SCORE</p>
      </div>
    </div>
  );
}

export default function Index() {
  const navigate = useNavigate();
  const [campaigns] = useLocalStorage<Campaign[]>('dqef-campaigns', initialCampaigns);
  const [contents] = useLocalStorage<ContentItem[]>('dqef-contents', initialContents);

  const activeCampaigns = campaigns.filter(c => c.status === 'Ativa').length;
  const publishedPosts = contents.filter(c => c.status === 'Publicado').length;
  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalLeads = campaigns.reduce((sum, c) => sum + (c.leads ?? 0), 0);

  const urgentCampaigns = campaigns.filter(c => {
    const end = new Date(c.endDate);
    const diff = (end.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff <= 7 && c.status === 'Ativa';
  });

  const draftContent = contents.filter(c => c.status === 'Rascunho');
  const upcomingContent = contents
    .filter(c => new Date(c.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const healthScore = Math.round(
    ((activeCampaigns / Math.max(campaigns.length, 1)) * 40) +
    ((publishedPosts / Math.max(contents.length, 1)) * 40) +
    (urgentCampaigns.length === 0 ? 20 : 10)
  );

  const kpis = [
    {
      label: 'Campanhas Ativas',
      value: activeCampaigns,
      icon: Megaphone,
      delta: '+2 esta semana',
      positive: true,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Posts Publicados',
      value: publishedPosts,
      icon: FileText,
      delta: '+5 este mês',
      positive: true,
      color: 'text-teal',
      bg: 'bg-teal/10',
    },
    {
      label: 'Leads Gerados',
      value: totalLeads.toLocaleString('pt-BR'),
      icon: TrendingUp,
      delta: '+18% vs semana ant.',
      positive: true,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
    },
    {
      label: 'Budget Total',
      value: `R$${(totalBudget / 1000).toFixed(1)}k`,
      icon: DollarSign,
      delta: 'Alocado Q1 2026',
      positive: true,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
  ];

  const FORMAT_COLORS: Record<string, string> = {
    Post: 'bg-blue-500/20 text-blue-400',
    Reels: 'bg-primary/20 text-primary',
    Stories: 'bg-purple-500/20 text-purple-400',
    Carrossel: 'bg-teal/20 text-teal',
    Ads: 'bg-red-500/20 text-red-400',
    Shorts: 'bg-green-500/20 text-green-400',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-border bg-card hover:border-primary/30 transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className={`rounded-lg p-2 ${kpi.bg}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <span className="text-xs text-green-400">{kpi.delta}</span>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-black text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Trend Chart */}
        <Card className="col-span-2 border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span>Publicações por Canal — Últimos 30 dias</span>
              <span className="text-xs font-normal text-muted-foreground">posts/dia</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gradIG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ORANGE} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={ORANGE} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradTK" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={TEAL} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="instagram" stroke={ORANGE} strokeWidth={2} fill="url(#gradIG)" name="Instagram" />
                <Area type="monotone" dataKey="tiktok" stroke={TEAL} strokeWidth={2} fill="url(#gradTK)" name="TikTok" />
                <Area type="monotone" dataKey="meta" stroke="#8B5CF6" strokeWidth={2} fill="none" name="Meta Ads" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Health Score */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Health Score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <HealthScoreCircle score={healthScore} />
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Campanhas ativas</span>
                <span className="font-semibold text-green-400">{activeCampaigns}/{campaigns.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Posts publicados</span>
                <span className="font-semibold text-primary">{publishedPosts}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Urgências</span>
                <span className={`font-semibold ${urgentCampaigns.length > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {urgentCampaigns.length}
                </span>
              </div>
            </div>
            {/* Channel pie */}
            <PieChart width={150} height={100}>
              <Pie data={channelData} cx={75} cy={50} innerRadius={25} outerRadius={45} dataKey="value">
                {channelData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: '11px' }} />
            </PieChart>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Timeline */}
        <Card className="col-span-2 border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Próximas Publicações
              </span>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/calendario')}>
                Ver calendário <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingContent.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3 hover:border-primary/30 transition-colors">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-card text-xs font-bold text-primary">
                  {new Date(item.date).getDate()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.responsible} · {item.channel}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${FORMAT_COLORS[item.format] ?? 'bg-muted text-muted-foreground'}`}>
                    {item.format}
                  </span>
                  <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${CONTENT_STATUS_COLOR[item.status]}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Alerts + Quick Actions */}
        <div className="space-y-4">
          {/* Alerts */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-primary" />
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {urgentCampaigns.length > 0 ? urgentCampaigns.slice(0, 3).map(c => (
                <div key={c.id} className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-2.5">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                  <div>
                    <p className="text-xs font-medium text-red-400">Prazo próximo</p>
                    <p className="text-xs text-muted-foreground">{c.name}</p>
                  </div>
                </div>
              )) : (
                <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 p-2.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                  <p className="text-xs text-green-400">Tudo em dia!</p>
                </div>
              )}
              {draftContent.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-2.5">
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs font-medium text-primary">{draftContent.length} rascunhos</p>
                    <p className="text-xs text-muted-foreground">Conteúdos pendentes</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4 text-primary" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'Nova campanha', icon: Plus, path: '/campanhas' },
                { label: 'Ver Kanban', icon: ArrowRight, path: '/kanban' },
                { label: 'Agendar conteúdo', icon: Calendar, path: '/calendario' },
              ].map(({ label, icon: Icon, path }) => (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  className="flex w-full items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
