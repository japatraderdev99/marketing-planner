import { initialCampaigns } from '@/data/seedData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  FunnelChart, Funnel, LabelList, PieChart, Pie, Cell, Legend
} from 'recharts';

const ORANGE = 'hsl(33, 100%, 50%)';
const TEAL = 'hsl(185, 100%, 36%)';

const funnelData = [
  { name: 'Impressões', value: 473000, fill: '#8B5CF6' },
  { name: 'Cliques', value: 27100, fill: ORANGE },
  { name: 'Leads', value: 4550, fill: TEAL },
  { name: 'Conversões', value: 1342, fill: '#22C55E' },
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

const audienceData = [
  { name: 'Prestadores', value: 72, color: ORANGE },
  { name: 'Clientes', value: 28, color: TEAL },
];

const channelPerf = [
  { channel: 'Instagram', impressoes: 185000, cliques: 9200, leads: 1800, cpc: 2.40, status: 'Ativa' },
  { channel: 'TikTok', impressoes: 148000, cliques: 8900, leads: 1400, cpc: 1.80, status: 'Ativa' },
  { channel: 'Meta Ads', impressoes: 280000, cliques: 14000, leads: 2800, cpc: 3.20, status: 'Ativa' },
  { channel: 'LinkedIn', impressoes: 22000, cliques: 980, leads: 180, cpc: 8.50, status: 'Ativa' },
  { channel: 'Google Ads', impressoes: 45000, cliques: 2100, leads: 420, cpc: 4.10, status: 'Pausada' },
];

const healthItems = [
  { label: 'Campanhas no prazo', value: 85, color: TEAL },
  { label: 'Taxa de aprovação', value: 72, color: ORANGE },
  { label: 'Conteúdos publicados', value: 68, color: '#8B5CF6' },
  { label: 'Budget utilizado', value: 61, color: '#3B82F6' },
];

function RateBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

export default function Analytics() {
  const campaigns = initialCampaigns;
  const totalImpressions = funnelData[0].value;
  const totalLeads = funnelData[2].value;
  const totalConversions = funnelData[3].value;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Funnel + Audience */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="col-span-2 border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Funil de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funnelData.map((item, i) => {
                const pct = i === 0 ? 100 : Math.round((item.value / funnelData[0].value) * 100);
                return (
                  <div key={item.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{pct}%</span>
                        <span className="text-sm font-bold" style={{ color: item.fill }}>{item.value.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                    <div className="h-6 w-full rounded-lg bg-border overflow-hidden">
                      <div className="h-full rounded-lg transition-all duration-700 flex items-center px-2" style={{ width: `${pct}%`, background: item.fill }}>
                        {pct > 15 && <span className="text-[10px] font-bold text-white">{pct}%</span>}
                      </div>
                    </div>
                    {i < funnelData.length - 1 && (
                      <p className="mt-1 text-right text-[10px] text-muted-foreground">
                        Taxa: {Math.round((funnelData[i + 1].value / item.value) * 100)}% →
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* Audience Breakdown */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Breakdown por Público</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <PieChart width={160} height={120}>
                <Pie data={audienceData} cx={80} cy={60} innerRadius={35} outerRadius={55} dataKey="value">
                  {audienceData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: '11px' }} />
              </PieChart>
              <div className="space-y-1.5 w-full">
                {audienceData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-bold text-foreground">{d.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Health Score */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Health Score Analítico</CardTitle>
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

      {/* Weekly Planned vs Real */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Planejado vs Real — Publicações por Semana</CardTitle>
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

      {/* Channel Performance Table */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Performance por Canal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Canal', 'Status', 'Impressões', 'Cliques', 'Leads', 'CPC'].map(h => (
                    <th key={h} className="pb-2 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {channelPerf.map(row => (
                  <tr key={row.channel} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-3 font-medium text-foreground">{row.channel}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${row.status === 'Ativa' ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 text-foreground">{row.impressoes.toLocaleString('pt-BR')}</td>
                    <td className="py-3 text-foreground">{row.cliques.toLocaleString('pt-BR')}</td>
                    <td className="py-3 font-semibold text-teal">{row.leads.toLocaleString('pt-BR')}</td>
                    <td className="py-3 font-semibold text-primary">R${row.cpc.toFixed(2)}</td>
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
