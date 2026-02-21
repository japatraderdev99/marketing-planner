import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, Wrench, Activity,
  DollarSign, Target, BarChart3, Zap, Globe, ArrowUpRight,
  ArrowDownRight, CheckCircle2, AlertCircle, RefreshCw,
  ShoppingBag, Repeat, Search, Save, Sparkles, Percent
} from 'lucide-react';
import { toast } from 'sonner';

const ORANGE = 'hsl(33, 100%, 50%)';
const TEAL = 'hsl(185, 100%, 36%)';
const PURPLE = 'hsl(262, 83%, 58%)';
const BLUE = 'hsl(217, 91%, 60%)';
const GREEN = 'hsl(142, 71%, 45%)';
const RED = 'hsl(0, 72%, 51%)';
const PINK = 'hsl(330, 80%, 60%)';

// ── Channel colors map
const CHANNEL_COLORS: Record<string, string> = {
  'Meta Ads': BLUE,
  'TikTok': PINK,
  'Instagram': PURPLE,
  'Google Ads': GREEN,
  'LinkedIn': TEAL,
  'Orgânico': ORANGE,
};

// ── Tab 1: Unified Channels data
const unifiedChannels = [
  { canal: 'Meta Ads', tipo: 'Pago', investimento: 12000, impressoes: 280000, cliques: 14000, ctr: 5.0, cadastros: 2800, cac: 4.29, roas: 8.4, score: 88 },
  { canal: 'TikTok', tipo: 'Pago', investimento: 8500, impressoes: 148000, cliques: 8900, ctr: 6.01, cadastros: 1400, cac: 6.07, roas: 6.2, score: 76 },
  { canal: 'Instagram', tipo: 'Orgânico', investimento: 3200, impressoes: 185000, cliques: 9200, ctr: 4.97, cadastros: 1800, cac: 1.78, roas: 11.1, score: 91 },
  { canal: 'Google Ads', tipo: 'Pago', investimento: 6800, impressoes: 45000, cliques: 2100, ctr: 4.67, cadastros: 420, cac: 16.19, roas: 3.8, score: 62 },
  { canal: 'LinkedIn', tipo: 'Pago', investimento: 4200, impressoes: 22000, cliques: 980, ctr: 4.45, cadastros: 180, cac: 23.33, roas: 8.2, score: 71 },
  { canal: 'Orgânico', tipo: 'Orgânico', investimento: 0, impressoes: 95000, cliques: 4800, ctr: 5.05, cadastros: 960, cac: 0, roas: 0, score: 84 },
];

// ── Tab 2: Marketplace Health data
const churnData = { clientes: 5.5, prestadores: 6.7 };
const retencaoData = [
  { periodo: '30d', clientes: 78, prestadores: 82 },
  { periodo: '60d', clientes: 65, prestadores: 71 },
  { periodo: '90d', clientes: 54, prestadores: 63 },
];
const liquidezSpark = [
  { mes: 'Set', ratio: 0.62 }, { mes: 'Out', ratio: 0.71 }, { mes: 'Nov', ratio: 0.78 },
  { mes: 'Dez', ratio: 0.85 }, { mes: 'Jan', ratio: 0.79 }, { mes: 'Fev', ratio: 0.83 },
];
const ofertaDemandaCat = [
  { categoria: 'Limpeza', oferta: 85, demanda: 142 }, { categoria: 'Elétrica', oferta: 62, demanda: 118 },
  { categoria: 'Hidráulica', oferta: 78, demanda: 95 }, { categoria: 'Jardinagem', oferta: 95, demanda: 72 },
  { categoria: 'Pintura', oferta: 110, demanda: 88 }, { categoria: 'Reforma', oferta: 54, demanda: 104 },
];
const gmvPorCategoria = [
  { categoria: 'Limpeza', gmv: 18400, color: ORANGE }, { categoria: 'Elétrica', gmv: 14200, color: TEAL },
  { categoria: 'Reforma', gmv: 11800, color: PURPLE }, { categoria: 'Hidráulica', gmv: 8600, color: BLUE },
  { categoria: 'Pintura', gmv: 6100, color: GREEN }, { categoria: 'Jardinagem', gmv: 2900, color: RED },
];

// ── Tab 3: Detailed Funnels data
const clienteFunnel = [
  { etapa: 'Visitantes', valor: 15420, pct: 100, color: PURPLE },
  { etapa: 'Cadastros', valor: 3855, pct: 25, color: BLUE },
  { etapa: 'Busca Serviço', valor: 2313, pct: 15, color: ORANGE },
  { etapa: 'Solicitação', valor: 925, pct: 6, color: TEAL },
  { etapa: 'Contratação', valor: 463, pct: 3, color: GREEN },
];
const prestadorFunnel = [
  { etapa: 'Visitantes', valor: 8750, pct: 100, color: PURPLE },
  { etapa: 'Cadastros', valor: 1750, pct: 20, color: BLUE },
  { etapa: 'Perfil Completo', valor: 1050, pct: 12, color: ORANGE },
  { etapa: 'Proposta Enviada', valor: 420, pct: 4.8, color: TEAL },
  { etapa: 'Serviço Realizado', valor: 294, pct: 3.4, color: GREEN },
];
const weeklyData = [
  { week: 'Sem 1', planejado: 12, real: 10 }, { week: 'Sem 2', planejado: 15, real: 14 },
  { week: 'Sem 3', planejado: 18, real: 20 }, { week: 'Sem 4', planejado: 20, real: 17 },
  { week: 'Sem 5', planejado: 22, real: 19 }, { week: 'Sem 6', planejado: 25, real: 26 },
  { week: 'Sem 7', planejado: 28, real: 24 }, { week: 'Sem 8', planejado: 30, real: 31 },
];
const healthItems = [
  { label: 'Campanhas no prazo', value: 85, color: TEAL },
  { label: 'Taxa de aprovação', value: 72, color: ORANGE },
  { label: 'Conteúdos publicados', value: 68, color: PURPLE },
  { label: 'Budget utilizado', value: 61, color: BLUE },
];

// ── Tab 4: Channel Deep Dive data
const channelFunnelData: Record<string, { etapa: string; valor: number; pct: number }[]> = {
  'Meta Ads': [
    { etapa: 'Impressões', valor: 280000, pct: 100 },
    { etapa: 'Cliques', valor: 14000, pct: 5 },
    { etapa: 'Leads', valor: 5600, pct: 2 },
    { etapa: 'Cadastros', valor: 2800, pct: 1 },
    { etapa: 'Conversões', valor: 840, pct: 0.3 },
  ],
  'TikTok': [
    { etapa: 'Impressões', valor: 148000, pct: 100 },
    { etapa: 'Cliques', valor: 8900, pct: 6.01 },
    { etapa: 'Leads', valor: 3200, pct: 2.16 },
    { etapa: 'Cadastros', valor: 1400, pct: 0.95 },
    { etapa: 'Conversões', valor: 420, pct: 0.28 },
  ],
  'Instagram': [
    { etapa: 'Impressões', valor: 185000, pct: 100 },
    { etapa: 'Cliques', valor: 9200, pct: 4.97 },
    { etapa: 'Leads', valor: 4100, pct: 2.22 },
    { etapa: 'Cadastros', valor: 1800, pct: 0.97 },
    { etapa: 'Conversões', valor: 630, pct: 0.34 },
  ],
  'Google Ads': [
    { etapa: 'Impressões', valor: 45000, pct: 100 },
    { etapa: 'Cliques', valor: 2100, pct: 4.67 },
    { etapa: 'Leads', valor: 840, pct: 1.87 },
    { etapa: 'Cadastros', valor: 420, pct: 0.93 },
    { etapa: 'Conversões', valor: 126, pct: 0.28 },
  ],
  'LinkedIn': [
    { etapa: 'Impressões', valor: 22000, pct: 100 },
    { etapa: 'Cliques', valor: 980, pct: 4.45 },
    { etapa: 'Leads', valor: 390, pct: 1.77 },
    { etapa: 'Cadastros', valor: 180, pct: 0.82 },
    { etapa: 'Conversões', valor: 54, pct: 0.25 },
  ],
  'Orgânico': [
    { etapa: 'Impressões', valor: 95000, pct: 100 },
    { etapa: 'Cliques', valor: 4800, pct: 5.05 },
    { etapa: 'Leads', valor: 2200, pct: 2.32 },
    { etapa: 'Cadastros', valor: 960, pct: 1.01 },
    { etapa: 'Conversões', valor: 336, pct: 0.35 },
  ],
};

const channelTrendData: Record<string, { week: string; spend: number; cadastros: number }[]> = {
  'Meta Ads': [
    { week: 'Sem 1', spend: 1400, cadastros: 320 }, { week: 'Sem 2', spend: 1500, cadastros: 350 },
    { week: 'Sem 3', spend: 1600, cadastros: 380 }, { week: 'Sem 4', spend: 1450, cadastros: 340 },
    { week: 'Sem 5', spend: 1550, cadastros: 360 }, { week: 'Sem 6', spend: 1700, cadastros: 410 },
    { week: 'Sem 7', spend: 1400, cadastros: 300 }, { week: 'Sem 8', spend: 1400, cadastros: 340 },
  ],
  'TikTok': [
    { week: 'Sem 1', spend: 900, cadastros: 140 }, { week: 'Sem 2', spend: 1000, cadastros: 160 },
    { week: 'Sem 3', spend: 1100, cadastros: 190 }, { week: 'Sem 4', spend: 1050, cadastros: 175 },
    { week: 'Sem 5', spend: 1150, cadastros: 200 }, { week: 'Sem 6', spend: 1200, cadastros: 210 },
    { week: 'Sem 7', spend: 1000, cadastros: 165 }, { week: 'Sem 8', spend: 1100, cadastros: 160 },
  ],
  'Instagram': [
    { week: 'Sem 1', spend: 380, cadastros: 200 }, { week: 'Sem 2', spend: 400, cadastros: 220 },
    { week: 'Sem 3', spend: 420, cadastros: 240 }, { week: 'Sem 4', spend: 390, cadastros: 215 },
    { week: 'Sem 5', spend: 410, cadastros: 230 }, { week: 'Sem 6', spend: 430, cadastros: 250 },
    { week: 'Sem 7', spend: 380, cadastros: 210 }, { week: 'Sem 8', spend: 390, cadastros: 235 },
  ],
  'Google Ads': [
    { week: 'Sem 1', spend: 800, cadastros: 48 }, { week: 'Sem 2', spend: 850, cadastros: 52 },
    { week: 'Sem 3', spend: 900, cadastros: 56 }, { week: 'Sem 4', spend: 820, cadastros: 50 },
    { week: 'Sem 5', spend: 870, cadastros: 54 }, { week: 'Sem 6', spend: 930, cadastros: 60 },
    { week: 'Sem 7', spend: 810, cadastros: 48 }, { week: 'Sem 8', spend: 820, cadastros: 52 },
  ],
  'LinkedIn': [
    { week: 'Sem 1', spend: 500, cadastros: 20 }, { week: 'Sem 2', spend: 520, cadastros: 22 },
    { week: 'Sem 3', spend: 540, cadastros: 24 }, { week: 'Sem 4', spend: 510, cadastros: 21 },
    { week: 'Sem 5', spend: 530, cadastros: 23 }, { week: 'Sem 6', spend: 560, cadastros: 26 },
    { week: 'Sem 7', spend: 500, cadastros: 20 }, { week: 'Sem 8', spend: 540, cadastros: 24 },
  ],
  'Orgânico': [
    { week: 'Sem 1', spend: 0, cadastros: 100 }, { week: 'Sem 2', spend: 0, cadastros: 115 },
    { week: 'Sem 3', spend: 0, cadastros: 130 }, { week: 'Sem 4', spend: 0, cadastros: 120 },
    { week: 'Sem 5', spend: 0, cadastros: 125 }, { week: 'Sem 6', spend: 0, cadastros: 140 },
    { week: 'Sem 7', spend: 0, cadastros: 110 }, { week: 'Sem 8', spend: 0, cadastros: 120 },
  ],
};

const channelCampaigns: Record<string, { nome: string; status: string; budget: number; leads: number; roas: number }[]> = {
  'Meta Ads': [
    { nome: 'Aquisição Q1', status: 'Ativo', budget: 4500, leads: 1200, roas: 9.1 },
    { nome: 'Retargeting Fev', status: 'Ativo', budget: 3200, leads: 850, roas: 8.8 },
    { nome: 'Lookalike Clientes', status: 'Pausado', budget: 2800, leads: 520, roas: 7.2 },
    { nome: 'Branding Video', status: 'Ativo', budget: 1500, leads: 230, roas: 6.4 },
  ],
  'TikTok': [
    { nome: 'UGC Challenge', status: 'Ativo', budget: 3500, leads: 680, roas: 7.1 },
    { nome: 'Spark Ads', status: 'Ativo', budget: 2800, leads: 480, roas: 5.8 },
    { nome: 'In-Feed Conversion', status: 'Pausado', budget: 2200, leads: 240, roas: 4.9 },
  ],
  'Instagram': [
    { nome: 'Reels Orgânico', status: 'Ativo', budget: 1200, leads: 620, roas: 12.4 },
    { nome: 'Stories Engagement', status: 'Ativo', budget: 1000, leads: 540, roas: 11.2 },
    { nome: 'Collab Influencers', status: 'Ativo', budget: 1000, leads: 640, roas: 9.8 },
  ],
  'Google Ads': [
    { nome: 'Search Brand', status: 'Ativo', budget: 2800, leads: 210, roas: 4.5 },
    { nome: 'Performance Max', status: 'Ativo', budget: 2500, leads: 140, roas: 3.2 },
    { nome: 'Display Remarketing', status: 'Pausado', budget: 1500, leads: 70, roas: 2.8 },
  ],
  'LinkedIn': [
    { nome: 'Lead Gen B2B', status: 'Ativo', budget: 2200, leads: 95, roas: 9.4 },
    { nome: 'InMail Decisores', status: 'Pausado', budget: 2000, leads: 85, roas: 7.1 },
  ],
  'Orgânico': [
    { nome: 'Blog SEO', status: 'Ativo', budget: 0, leads: 420, roas: 0 },
    { nome: 'Newsletter', status: 'Ativo', budget: 0, leads: 310, roas: 0 },
    { nome: 'Referral Program', status: 'Ativo', budget: 0, leads: 230, roas: 0 },
  ],
};

// ── Tab 5: Budget Allocation defaults
interface BudgetAllocationState {
  totalBudget: number;
  channels: Record<string, { amount: number; pct: number }>;
}

const defaultBudgetAllocation: BudgetAllocationState = {
  totalBudget: 35000,
  channels: {
    'Meta Ads': { amount: 12000, pct: 34.3 },
    'TikTok': { amount: 8500, pct: 24.3 },
    'Instagram': { amount: 3200, pct: 9.1 },
    'Google Ads': { amount: 6800, pct: 19.4 },
    'LinkedIn': { amount: 4200, pct: 12.0 },
    'Orgânico': { amount: 300, pct: 0.9 },
  },
};

const channelKpis: Record<string, { cac: number; roas: number; score: number; aiRecommended: number }> = {
  'Meta Ads': { cac: 4.29, roas: 8.4, score: 88, aiRecommended: 13500 },
  'TikTok': { cac: 6.07, roas: 6.2, score: 76, aiRecommended: 9000 },
  'Instagram': { cac: 1.78, roas: 11.1, score: 91, aiRecommended: 4500 },
  'Google Ads': { cac: 16.19, roas: 3.8, score: 62, aiRecommended: 5000 },
  'LinkedIn': { cac: 23.33, roas: 8.2, score: 71, aiRecommended: 2500 },
  'Orgânico': { cac: 0, roas: 0, score: 84, aiRecommended: 500 },
};

// ── Shared UI helpers
function ScoreBadge({ score }: { score: number }) {
  const style =
    score >= 80
      ? 'bg-green-500/15 text-green-400 border-green-500/30'
      : score >= 60
      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
      : 'bg-red-500/15 text-red-400 border-red-500/30';
  return (
    <span className={`inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[10px] font-bold min-w-[36px] ${style}`}>
      {score}
    </span>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-foreground tabular-nums min-w-[60px] text-right">
        {value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
      </span>
      <div className="h-1.5 w-16 rounded-full bg-border overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function RateBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

function KpiStat({ label, value, delta, positive, icon: Icon }: {
  label: string; value: string; delta?: string; positive?: boolean; icon: React.ElementType;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <p className="text-xl font-black text-foreground">{value}</p>
      {delta && (
        <div className={`flex items-center gap-1 text-[10px] font-semibold mt-0.5 ${positive ? 'text-green-400' : 'text-red-400'}`}>
          {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {delta}
        </div>
      )}
    </div>
  );
}

// ── Tab 1: Unified Channels
function UnifiedChannels({ period }: { period: string }) {
  const [filter, setFilter] = useState<'Todos' | 'Pago' | 'Orgânico'>('Todos');
  const filtered = filter === 'Todos' ? unifiedChannels : unifiedChannels.filter(c => c.tipo === filter);

  const totalInvestimento = unifiedChannels.filter(c => c.tipo === 'Pago').reduce((s, c) => s + c.investimento, 0);
  const totalCadastros = unifiedChannels.reduce((s, c) => s + c.cadastros, 0);
  const avgRoas = unifiedChannels.filter(c => c.roas > 0).reduce((s, c, _, a) => s + c.roas / a.length, 0);
  const canaisAtivos = unifiedChannels.length;
  const maxImpressoes = Math.max(...filtered.map(c => c.impressoes));
  const maxInvestimento = Math.max(...filtered.map(c => c.investimento));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiStat label="Canais Ativos" value={String(canaisAtivos)} icon={Globe} />
        <KpiStat label="Investimento Total" value={`R$${(totalInvestimento / 1000).toFixed(1)}k`} delta="+12% vs mês" positive={true} icon={DollarSign} />
        <KpiStat label="Total Cadastros" value={totalCadastros.toLocaleString('pt-BR')} delta="+18% vs mês" positive={true} icon={Users} />
        <KpiStat label="ROAS Médio" value={`${avgRoas.toFixed(1)}x`} delta="+0.4x vs mês" positive={true} icon={TrendingUp} />
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold">Performance por Canal — {period}</CardTitle>
          <div className="flex rounded-lg border border-border bg-muted/30 p-0.5 gap-0.5">
            {(['Todos', 'Pago', 'Orgânico'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  filter === f ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Canal', 'Tipo', 'Investimento', 'Impressões', 'Cliques', 'CTR', 'Cadastros', 'CAC', 'ROAS', 'Score'].map(h => (
                    <th key={h} className="pb-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.canal} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                    <td className="py-3 pr-3 font-semibold text-foreground whitespace-nowrap">{row.canal}</td>
                    <td className="py-3 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                        row.tipo === 'Pago'
                          ? 'bg-primary/15 text-primary border border-primary/30'
                          : 'bg-teal/15 text-teal border border-teal/30'
                      }`}>
                        {row.tipo}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      {row.investimento > 0
                        ? <MiniBar value={row.investimento} max={maxInvestimento} color={ORANGE} />
                        : <span className="text-xs text-muted-foreground">—</span>
                      }
                    </td>
                    <td className="py-3 pr-3">
                      <MiniBar value={row.impressoes} max={maxImpressoes} color={PURPLE} />
                    </td>
                    <td className="py-3 pr-3 text-foreground text-xs">{row.cliques.toLocaleString('pt-BR')}</td>
                    <td className="py-3 pr-3 text-xs font-medium text-foreground">{row.ctr.toFixed(2)}%</td>
                    <td className="py-3 pr-3 text-xs font-semibold" style={{ color: TEAL }}>{row.cadastros.toLocaleString('pt-BR')}</td>
                    <td className="py-3 pr-3 text-xs font-semibold text-foreground">
                      {row.cac > 0 ? `R$${row.cac.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3 pr-3">
                      {row.roas > 0
                        ? <span className="text-xs font-bold" style={{ color: row.roas >= 5 ? GREEN : row.roas >= 3 ? ORANGE : RED }}>{row.roas.toFixed(1)}x</span>
                        : <span className="text-xs text-muted-foreground">—</span>
                      }
                    </td>
                    <td className="py-3"><ScoreBadge score={row.score} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center gap-4 border-t border-border pt-3">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Channel Score:</span>
            {[
              { range: '80-100', label: 'Excelente', color: 'bg-green-500/15 text-green-400 border-green-500/30' },
              { range: '60-79', label: 'Bom', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
              { range: '<60', label: 'Atenção', color: 'bg-red-500/15 text-red-400 border-red-500/30' },
            ].map(({ range, label, color }) => (
              <div key={range} className="flex items-center gap-1.5">
                <span className={`inline-flex rounded-full border px-1.5 py-0 text-[9px] font-bold ${color}`}>{range}</span>
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab 2: Marketplace Health
function MarketplaceHealth({ period }: { period: string }) {
  const totalGmv = gmvPorCategoria.reduce((s, c) => s + c.gmv, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiStat label="Churn Clientes" value={`${churnData.clientes}%`} delta="+0.3pp mês" positive={false} icon={TrendingDown} />
        <KpiStat label="Churn Prestadores" value={`${churnData.prestadores}%`} delta="-0.2pp mês" positive={true} icon={TrendingUp} />
        <KpiStat label="Taxa de Repetição" value="42%" delta="+5pp mês" positive={true} icon={Repeat} />
        <KpiStat label="GMV Total" value={`R$${(totalGmv / 1000).toFixed(0)}k`} delta="+18% mês" positive={true} icon={ShoppingBag} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Taxa de Liquidez — Evolução
            </CardTitle>
            <div className="text-right">
              <p className="text-lg font-black text-green-400">0.83</p>
              <p className="text-[10px] text-muted-foreground">ratio atual</p>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={liquidezSpark}>
                <defs>
                  <linearGradient id="gLiq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={TEAL} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis domain={[0.5, 1.2]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: '11px' }}
                  formatter={(v: number) => [v.toFixed(2), 'Ratio']}
                />
                <Area type="monotone" dataKey="ratio" stroke={TEAL} strokeWidth={2} fill="url(#gLiq)" dot={{ fill: TEAL, r: 3 }} />
                <Line type="monotone" dataKey={() => 1.0} stroke={GREEN} strokeDasharray="4 3" dot={false} name="Ideal" />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">Ratio ideal: 1.0 (oferta = demanda)</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-amber-400" />
              Churn & Retenção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { label: 'Churn de Clientes', value: churnData.clientes, color: RED, meta: 4.0 },
                { label: 'Churn de Prestadores', value: churnData.prestadores, color: ORANGE, meta: 5.0 },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">Meta: {item.meta}%</span>
                      <span className="font-bold" style={{ color: item.value > item.meta ? RED : GREEN }}>{item.value}%</span>
                    </div>
                  </div>
                  <RateBar value={item.value * 10} color={item.value > item.meta ? RED : GREEN} />
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Retenção por Período</p>
              <div className="space-y-2">
                {retencaoData.map(r => (
                  <div key={r.periodo} className="grid grid-cols-3 gap-2 text-xs items-center">
                    <span className="text-muted-foreground font-medium">{r.periodo}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 flex-1 rounded-full bg-border overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${r.clientes}%`, background: TEAL }} />
                      </div>
                      <span className="font-semibold text-teal text-[10px]">{r.clientes}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 flex-1 rounded-full bg-border overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${r.prestadores}%`, background: ORANGE }} />
                      </div>
                      <span className="font-semibold text-primary text-[10px]">{r.prestadores}%</span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-full inline-block" style={{ background: TEAL }} /> Clientes</span>
                  <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-full inline-block" style={{ background: ORANGE }} /> Prestadores</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Oferta vs Demanda por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ofertaDemandaCat} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="categoria" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: '11px' }} />
                <Bar dataKey="oferta" fill={BLUE} radius={[3, 3, 0, 0]} name="Oferta (Prestadores)" />
                <Bar dataKey="demanda" fill={ORANGE} radius={[3, 3, 0, 0]} name="Demanda (Solicitações)" />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-3 rounded inline-block" style={{ background: BLUE }} /> Oferta</span>
              <span className="flex items-center gap-1"><span className="h-2 w-3 rounded inline-block" style={{ background: ORANGE }} /> Demanda</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-400" />
              GMV por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {gmvPorCategoria.map(cat => {
              const pct = Math.round((cat.gmv / gmvPorCategoria[0].gmv) * 100);
              return (
                <div key={cat.categoria}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{cat.categoria}</span>
                    <span className="font-bold text-foreground">R${cat.gmv.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cat.color }} />
                  </div>
                </div>
              );
            })}
            <div className="pt-2 border-t border-border flex justify-between text-xs">
              <span className="text-muted-foreground">Total GMV</span>
              <span className="font-black text-foreground">R${totalGmv.toLocaleString('pt-BR')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Tab 3: Detailed Funnels
function DetailedFunnels() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[
          { title: 'Funil de Clientes', data: clienteFunnel, icon: Users, iconColor: TEAL, convColor: 'text-green-400' },
          { title: 'Funil de Prestadores', data: prestadorFunnel, icon: Wrench, iconColor: ORANGE, convColor: 'text-orange-400' },
        ].map(funnel => (
          <Card key={funnel.title} className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <funnel.icon className="h-4 w-4" style={{ color: funnel.iconColor }} />
                {funnel.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {funnel.data.map((stage, i) => (
                <div key={stage.etapa}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground w-4">{i + 1}.</span>
                      <span className="text-xs font-medium text-foreground">{stage.etapa}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {i > 0 && (
                        <span className="text-[9px] text-muted-foreground">
                          {Math.round((stage.valor / funnel.data[i - 1].valor) * 100)}% conv.
                        </span>
                      )}
                      <span className="text-xs font-bold" style={{ color: stage.color }}>
                        {stage.valor.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <div className="h-5 w-full rounded-md bg-border overflow-hidden">
                    <div
                      className="h-full rounded-md flex items-center px-2 transition-all duration-700"
                      style={{ width: `${stage.pct}%`, background: stage.color, minWidth: stage.pct > 0 ? '5%' : '0' }}
                    >
                      {stage.pct > 10 && <span className="text-[9px] font-bold text-white">{stage.pct}%</span>}
                    </div>
                  </div>
                </div>
              ))}
              <div className="border-t border-border pt-2 flex justify-between text-xs">
                <span className="text-muted-foreground">Taxa geral de conversão</span>
                <span className={`font-bold ${funnel.convColor}`}>
                  {((funnel.data[funnel.data.length - 1].valor / funnel.data[0].valor) * 100).toFixed(2)}%
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="col-span-2 border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold">Planejado vs Real — Publicações por Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="planejado" fill="hsl(var(--border))" radius={[4, 4, 0, 0]} name="Planejado" />
                <Bar dataKey="real" fill={ORANGE} radius={[4, 4, 0, 0]} name="Real" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Health Score Analítico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {healthItems.map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold text-foreground">{item.value}%</span>
                </div>
                <RateBar value={item.value} color={item.color} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Tab 4: Channel Deep Dive
function ChannelDeepDive({ period }: { period: string }) {
  const channels = Object.keys(channelFunnelData);
  const [selected, setSelected] = useState(channels[0]);
  const ch = unifiedChannels.find(c => c.canal === selected)!;
  const funnel = channelFunnelData[selected];
  const trend = channelTrendData[selected];
  const campaigns = channelCampaigns[selected];
  const color = CHANNEL_COLORS[selected] || BLUE;
  const [sortBy, setSortBy] = useState<'roas' | 'leads'>('roas');

  const sortedCampaigns = [...campaigns].sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="space-y-4">
      {/* Channel selector badges */}
      <div className="flex flex-wrap gap-2">
        {channels.map(ch => (
          <button
            key={ch}
            onClick={() => setSelected(ch)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all ${
              selected === ch
                ? 'text-white shadow-md scale-105'
                : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/30'
            }`}
            style={selected === ch ? { background: CHANNEL_COLORS[ch], borderColor: CHANNEL_COLORS[ch] } : {}}
          >
            {ch}
          </button>
        ))}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiStat label="Investimento" value={ch.investimento > 0 ? `R$${(ch.investimento / 1000).toFixed(1)}k` : 'R$0'} icon={DollarSign} />
        <KpiStat label="CAC" value={ch.cac > 0 ? `R$${ch.cac.toFixed(2)}` : '—'} icon={Target} />
        <KpiStat label="ROAS" value={ch.roas > 0 ? `${ch.roas.toFixed(1)}x` : '—'} icon={TrendingUp} />
        <KpiStat label="Cadastros" value={ch.cadastros.toLocaleString('pt-BR')} icon={Users} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Funnel */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Search className="h-4 w-4" style={{ color }} />
              Funil de Conversão — {selected}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {funnel.map((stage, i) => {
              const convRate = i > 0 ? ((stage.valor / funnel[i - 1].valor) * 100).toFixed(1) : null;
              return (
                <div key={stage.etapa}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground w-4">{i + 1}.</span>
                      <span className="text-xs font-medium text-foreground">{stage.etapa}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {convRate && (
                        <span className="text-[9px] text-muted-foreground">{convRate}% conv.</span>
                      )}
                      <span className="text-xs font-bold" style={{ color }}>
                        {stage.valor >= 1000 ? `${(stage.valor / 1000).toFixed(1)}k` : stage.valor}
                      </span>
                    </div>
                  </div>
                  <div className="h-5 w-full rounded-md bg-border overflow-hidden">
                    <div
                      className="h-full rounded-md flex items-center px-2 transition-all duration-700"
                      style={{
                        width: `${Math.max(stage.pct, 3)}%`,
                        background: color,
                        opacity: 1 - i * 0.12,
                      }}
                    >
                      {stage.pct > 8 && <span className="text-[9px] font-bold text-white">{stage.pct}%</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="border-t border-border pt-2 flex justify-between text-xs">
              <span className="text-muted-foreground">Taxa geral (impressão → conversão)</span>
              <span className="font-bold" style={{ color }}>
                {((funnel[funnel.length - 1].valor / funnel[0].valor) * 100).toFixed(3)}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Trend chart */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Activity className="h-4 w-4" style={{ color }} />
              Tendência Semanal — {selected}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="gTrendSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={RED} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={RED} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gTrendCad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: '11px' }} />
                <Area yAxisId="left" type="monotone" dataKey="spend" stroke={RED} strokeWidth={2} fill="url(#gTrendSpend)" name="Investimento (R$)" />
                <Area yAxisId="right" type="monotone" dataKey="cadastros" stroke={color} strokeWidth={2} fill="url(#gTrendCad)" name="Cadastros" dot={{ fill: color, r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-full inline-block" style={{ background: RED }} /> Investimento</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-full inline-block" style={{ background: color }} /> Cadastros</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns table */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold">Campanhas — {selected}</CardTitle>
          <div className="flex rounded-lg border border-border bg-muted/30 p-0.5 gap-0.5">
            {(['roas', 'leads'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  sortBy === s ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Ordenar: {s === 'roas' ? 'ROAS' : 'Leads'}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Nome', 'Status', 'Budget', 'Leads', 'ROAS'].map(h => (
                    <th key={h} className="pb-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedCampaigns.map(c => (
                  <tr key={c.nome} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                    <td className="py-3 pr-3 font-semibold text-foreground whitespace-nowrap">{c.nome}</td>
                    <td className="py-3 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                        c.status === 'Ativo'
                          ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-xs text-foreground">
                      {c.budget > 0 ? `R$${c.budget.toLocaleString('pt-BR')}` : '—'}
                    </td>
                    <td className="py-3 pr-3 text-xs font-semibold" style={{ color: TEAL }}>{c.leads}</td>
                    <td className="py-3 pr-3">
                      {c.roas > 0
                        ? <span className="text-xs font-bold" style={{ color: c.roas >= 5 ? GREEN : c.roas >= 3 ? ORANGE : RED }}>{c.roas.toFixed(1)}x</span>
                        : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab 5: Budget Allocation
function BudgetAllocation() {
  const [allocation, setAllocation] = useLocalStorage<BudgetAllocationState>('dqef-budget-allocation', defaultBudgetAllocation);
  const [mode, setMode] = useState<'pct' | 'abs'>('pct');

  const totalAllocated = Object.values(allocation.channels).reduce((s, c) => s + c.amount, 0);
  const remaining = allocation.totalBudget - totalAllocated;
  const channels = Object.keys(allocation.channels);

  const updateChannel = (channel: string, newAmount: number) => {
    const clamped = Math.max(0, Math.min(newAmount, allocation.totalBudget));
    setAllocation(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: {
          amount: Math.round(clamped),
          pct: prev.totalBudget > 0 ? Math.round((clamped / prev.totalBudget) * 1000) / 10 : 0,
        },
      },
    }));
  };

  const handleSave = () => {
    toast.success('Alocação de verba salva com sucesso!');
  };

  return (
    <div className="space-y-4">
      {/* Hero budget input */}
      <Card className="border-border bg-card">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1 block">Budget Total Mensal</label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-muted-foreground">R$</span>
                <Input
                  type="number"
                  value={allocation.totalBudget}
                  onChange={e => setAllocation(prev => ({ ...prev, totalBudget: Number(e.target.value) || 0 }))}
                  className="text-3xl font-black h-12 w-48 border-border bg-muted/20"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`text-center px-4 py-2 rounded-lg border ${
                remaining >= 0
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5">
                  {remaining >= 0 ? 'Verba Restante' : 'Excedido'}
                </p>
                <p className="text-xl font-black">R${Math.abs(remaining).toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </div>

          {/* Stacked bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              <span>Distribuição Atual</span>
              <span>R${totalAllocated.toLocaleString('pt-BR')} / R${allocation.totalBudget.toLocaleString('pt-BR')}</span>
            </div>
            <div className="h-6 w-full rounded-full bg-border overflow-hidden flex">
              {channels.map(ch => {
                const pct = allocation.totalBudget > 0 ? (allocation.channels[ch].amount / allocation.totalBudget) * 100 : 0;
                if (pct <= 0) return null;
                return (
                  <div
                    key={ch}
                    className="h-full transition-all duration-300 relative group first:rounded-l-full last:rounded-r-full"
                    style={{ width: `${pct}%`, background: CHANNEL_COLORS[ch] }}
                    title={`${ch}: R$${allocation.channels[ch].amount.toLocaleString('pt-BR')} (${pct.toFixed(1)}%)`}
                  >
                    {pct > 8 && (
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">
                        {pct.toFixed(0)}%
                      </span>
                    )}
                  </div>
                );
              })}
              {remaining > 0 && allocation.totalBudget > 0 && (
                <div
                  className="h-full bg-border/50 last:rounded-r-full"
                  style={{ width: `${(remaining / allocation.totalBudget) * 100}%` }}
                />
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-1">
              {channels.map(ch => (
                <div key={ch} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ background: CHANNEL_COLORS[ch] }} />
                  {ch}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border border-border bg-card p-0.5 gap-0.5">
          {([{ key: 'pct', label: 'Percentual (%)' }, { key: 'abs', label: 'Valor (R$)' }] as const).map(m => (
            <button
              key={m.key}
              onClick={() => setMode(m.key as 'pct' | 'abs')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                mode === m.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Channel cards grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {channels.map(ch => {
          const chData = allocation.channels[ch];
          const kpi = channelKpis[ch];
          const color = CHANNEL_COLORS[ch];
          const aiDiff = chData.amount - kpi.aiRecommended;

          return (
            <Card key={ch} className="border-border bg-card overflow-hidden">
              <div className="h-1" style={{ background: color }} />
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ background: color }} />
                    <span className="text-sm font-bold text-foreground">{ch}</span>
                  </div>
                  <ScoreBadge score={kpi.score} />
                </div>

                {/* Slider */}
                <div className="space-y-2">
                  <Slider
                    value={[mode === 'pct' ? chData.pct : chData.amount]}
                    max={mode === 'pct' ? 100 : allocation.totalBudget}
                    step={mode === 'pct' ? 0.5 : 100}
                    onValueChange={([val]) => {
                      if (mode === 'pct') {
                        updateChannel(ch, (val / 100) * allocation.totalBudget);
                      } else {
                        updateChannel(ch, val);
                      }
                    }}
                    className="cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={mode === 'pct' ? chData.pct : chData.amount}
                      onChange={e => {
                        const val = Number(e.target.value) || 0;
                        if (mode === 'pct') {
                          updateChannel(ch, (val / 100) * allocation.totalBudget);
                        } else {
                          updateChannel(ch, val);
                        }
                      }}
                      className="h-8 w-24 text-xs border-border bg-muted/20"
                    />
                    <span className="text-xs text-muted-foreground">{mode === 'pct' ? '%' : 'R$'}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {mode === 'pct'
                        ? `R$${chData.amount.toLocaleString('pt-BR')}`
                        : `${chData.pct.toFixed(1)}%`
                      }
                    </span>
                  </div>
                </div>

                {/* Mini KPIs */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'CAC', value: kpi.cac > 0 ? `R$${kpi.cac.toFixed(0)}` : '—' },
                    { label: 'ROAS', value: kpi.roas > 0 ? `${kpi.roas.toFixed(1)}x` : '—' },
                    { label: 'Score', value: String(kpi.score) },
                  ].map(k => (
                    <div key={k.label} className="rounded-md bg-muted/20 p-1.5">
                      <p className="text-[9px] text-muted-foreground uppercase">{k.label}</p>
                      <p className="text-xs font-bold text-foreground">{k.value}</p>
                    </div>
                  ))}
                </div>

                {/* AI recommendation comparison */}
                <div className="border-t border-border pt-2">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> IA Recomenda
                    </span>
                    <span className="font-semibold text-foreground">R${kpi.aiRecommended.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-border overflow-hidden relative">
                    <div
                      className="h-full rounded-full absolute"
                      style={{ width: `${Math.min((kpi.aiRecommended / allocation.totalBudget) * 100, 100)}%`, background: color, opacity: 0.3 }}
                    />
                    <div
                      className="h-full rounded-full absolute"
                      style={{ width: `${Math.min((chData.amount / allocation.totalBudget) * 100, 100)}%`, background: color }}
                    />
                  </div>
                  <p className={`text-[9px] mt-1 font-semibold ${aiDiff > 0 ? 'text-amber-400' : aiDiff < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {aiDiff > 0 ? `+R$${aiDiff.toLocaleString('pt-BR')} acima` : aiDiff < 0 ? `R$${Math.abs(aiDiff).toLocaleString('pt-BR')} abaixo` : 'Alinhado'}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sticky summary bar */}
      <div className="sticky bottom-0 z-10">
        <Card className={`border-2 ${remaining >= 0 ? 'border-green-500/30' : 'border-red-500/30'} bg-card shadow-xl`}>
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase">Alocado</p>
                <p className="text-lg font-black text-foreground">R${totalAllocated.toLocaleString('pt-BR')}</p>
              </div>
              <div className="text-muted-foreground text-lg font-bold">/</div>
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase">Budget</p>
                <p className="text-lg font-black text-foreground">R${allocation.totalBudget.toLocaleString('pt-BR')}</p>
              </div>
              <div className={`px-3 py-1.5 rounded-lg border font-bold text-sm ${
                remaining >= 0
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                {remaining >= 0 ? `R$${remaining.toLocaleString('pt-BR')} restante` : `R$${Math.abs(remaining).toLocaleString('pt-BR')} excedido`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-1.5 rounded-lg bg-muted/30 border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                disabled
              >
                <Sparkles className="h-3.5 w-3.5" />
                Sugerir com IA
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Save className="h-3.5 w-3.5" />
                Salvar Alocação
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Page wrapper
export default function Analytics() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const periodLabel = { '7d': '7 dias', '30d': '30 dias', '90d': '90 dias' }[period];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Inteligência de Marketing — DQEF Hub</p>
        <div className="flex items-center rounded-lg border border-border bg-card p-0.5 gap-0.5">
          {(['7d', '30d', '90d'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                period === p
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
            </button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="canais">
        <TabsList className="bg-card border border-border h-auto p-1 gap-1 flex-wrap">
          <TabsTrigger value="canais" className="text-xs px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Canais Unificados
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="text-xs px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Marketplace Health
          </TabsTrigger>
          <TabsTrigger value="funis" className="text-xs px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Funis Detalhados
          </TabsTrigger>
          <TabsTrigger value="por-canal" className="text-xs px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Deep Dive por Canal
          </TabsTrigger>
          <TabsTrigger value="verba" className="text-xs px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Alocação de Verba
          </TabsTrigger>
        </TabsList>

        <TabsContent value="canais" className="mt-4">
          <UnifiedChannels period={periodLabel} />
        </TabsContent>
        <TabsContent value="marketplace" className="mt-4">
          <MarketplaceHealth period={periodLabel} />
        </TabsContent>
        <TabsContent value="funis" className="mt-4">
          <DetailedFunnels />
        </TabsContent>
        <TabsContent value="por-canal" className="mt-4">
          <ChannelDeepDive period={periodLabel} />
        </TabsContent>
        <TabsContent value="verba" className="mt-4">
          <BudgetAllocation />
        </TabsContent>
      </Tabs>
    </div>
  );
}
