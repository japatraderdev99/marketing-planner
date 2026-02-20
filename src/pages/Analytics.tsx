import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, Wrench, Activity,
  DollarSign, Target, BarChart3, Zap, Globe, ArrowUpRight,
  ArrowDownRight, CheckCircle2, AlertCircle, RefreshCw,
  ShoppingBag, Repeat
} from 'lucide-react';

const ORANGE = 'hsl(33, 100%, 50%)';
const TEAL = 'hsl(185, 100%, 36%)';
const PURPLE = 'hsl(262, 83%, 58%)';
const BLUE = 'hsl(217, 91%, 60%)';
const GREEN = 'hsl(142, 71%, 45%)';
const RED = 'hsl(0, 72%, 51%)';

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
const churnData = {
  clientes: 5.5,
  prestadores: 6.7,
};

const retencaoData = [
  { periodo: '30d', clientes: 78, prestadores: 82 },
  { periodo: '60d', clientes: 65, prestadores: 71 },
  { periodo: '90d', clientes: 54, prestadores: 63 },
];

const liquidezSpark = [
  { mes: 'Set', ratio: 0.62 },
  { mes: 'Out', ratio: 0.71 },
  { mes: 'Nov', ratio: 0.78 },
  { mes: 'Dez', ratio: 0.85 },
  { mes: 'Jan', ratio: 0.79 },
  { mes: 'Fev', ratio: 0.83 },
];

const ofertaDemandaCat = [
  { categoria: 'Limpeza', oferta: 85, demanda: 142 },
  { categoria: 'Elétrica', oferta: 62, demanda: 118 },
  { categoria: 'Hidráulica', oferta: 78, demanda: 95 },
  { categoria: 'Jardinagem', oferta: 95, demanda: 72 },
  { categoria: 'Pintura', oferta: 110, demanda: 88 },
  { categoria: 'Reforma', oferta: 54, demanda: 104 },
];

const gmvPorCategoria = [
  { categoria: 'Limpeza', gmv: 18400, color: ORANGE },
  { categoria: 'Elétrica', gmv: 14200, color: TEAL },
  { categoria: 'Reforma', gmv: 11800, color: PURPLE },
  { categoria: 'Hidráulica', gmv: 8600, color: BLUE },
  { categoria: 'Pintura', gmv: 6100, color: GREEN },
  { categoria: 'Jardinagem', gmv: 2900, color: RED },
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
  { week: 'Sem 1', planejado: 12, real: 10 },
  { week: 'Sem 2', planejado: 15, real: 14 },
  { week: 'Sem 3', planejado: 18, real: 20 },
  { week: 'Sem 4', planejado: 20, real: 17 },
  { week: 'Sem 5', planejado: 22, real: 19 },
  { week: 'Sem 6', planejado: 25, real: 26 },
  { week: 'Sem 7', planejado: 28, real: 24 },
  { week: 'Sem 8', planejado: 30, real: 31 },
];

const healthItems = [
  { label: 'Campanhas no prazo', value: 85, color: TEAL },
  { label: 'Taxa de aprovação', value: 72, color: ORANGE },
  { label: 'Conteúdos publicados', value: 68, color: PURPLE },
  { label: 'Budget utilizado', value: 61, color: BLUE },
];

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
      {/* KPI header */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiStat label="Canais Ativos" value={String(canaisAtivos)} icon={Globe} />
        <KpiStat label="Investimento Total" value={`R$${(totalInvestimento / 1000).toFixed(1)}k`} delta="+12% vs mês" positive={true} icon={DollarSign} />
        <KpiStat label="Total Cadastros" value={totalCadastros.toLocaleString('pt-BR')} delta="+18% vs mês" positive={true} icon={Users} />
        <KpiStat label="ROAS Médio" value={`${avgRoas.toFixed(1)}x`} delta="+0.4x vs mês" positive={true} icon={TrendingUp} />
      </div>

      {/* Filter + Table */}
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
                    <td className="py-3">
                      <ScoreBadge score={row.score} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Score legend */}
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
      {/* KPI header */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiStat label="Churn Clientes" value={`${churnData.clientes}%`} delta="+0.3pp mês" positive={false} icon={TrendingDown} />
        <KpiStat label="Churn Prestadores" value={`${churnData.prestadores}%`} delta="-0.2pp mês" positive={true} icon={TrendingUp} />
        <KpiStat label="Taxa de Repetição" value="42%" delta="+5pp mês" positive={true} icon={Repeat} />
        <KpiStat label="GMV Total" value={`R$${(totalGmv / 1000).toFixed(0)}k`} delta="+18% mês" positive={true} icon={ShoppingBag} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Liquidity sparkline */}
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
                {/* Ideal line at 1.0 */}
                <Line type="monotone" dataKey={() => 1.0} stroke={GREEN} strokeDasharray="4 3" dot={false} name="Ideal" />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">Ratio ideal: 1.0 (oferta = demanda)</p>
          </CardContent>
        </Card>

        {/* Churn & Retention */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-amber-400" />
              Churn & Retenção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Churn bars */}
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

            {/* Retention 30/60/90 */}
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
        {/* Supply vs Demand by Category */}
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

        {/* GMV by Category */}
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
      {/* Dual funnel */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Cliente Funnel */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="h-4 w-4" style={{ color: TEAL }} />
              Funil de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {clienteFunnel.map((stage, i) => (
              <div key={stage.etapa}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground w-4">{i + 1}.</span>
                    <span className="text-xs font-medium text-foreground">{stage.etapa}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {i > 0 && (
                      <span className="text-[9px] text-muted-foreground">
                        {Math.round((stage.valor / clienteFunnel[i - 1].valor) * 100)}% conv.
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
              <span className="font-bold text-green-400">
                {((clienteFunnel[clienteFunnel.length - 1].valor / clienteFunnel[0].valor) * 100).toFixed(2)}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Prestador Funnel */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Wrench className="h-4 w-4" style={{ color: ORANGE }} />
              Funil de Prestadores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {prestadorFunnel.map((stage, i) => (
              <div key={stage.etapa}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground w-4">{i + 1}.</span>
                    <span className="text-xs font-medium text-foreground">{stage.etapa}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {i > 0 && (
                      <span className="text-[9px] text-muted-foreground">
                        {Math.round((stage.valor / prestadorFunnel[i - 1].valor) * 100)}% conv.
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
              <span className="font-bold text-orange-400">
                {((prestadorFunnel[prestadorFunnel.length - 1].valor / prestadorFunnel[0].valor) * 100).toFixed(2)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Planned vs Real + Health Score */}
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

export default function Analytics() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const periodLabel = { '7d': '7 dias', '30d': '30 dias', '90d': '90 dias' }[period];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Period selector */}
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

      {/* Tabs */}
      <Tabs defaultValue="canais">
        <TabsList className="bg-card border border-border h-auto p-1 gap-1">
          <TabsTrigger value="canais" className="text-xs px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Canais Unificados
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="text-xs px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Marketplace Health
          </TabsTrigger>
          <TabsTrigger value="funis" className="text-xs px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Funis Detalhados
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
      </Tabs>
    </div>
  );
}
