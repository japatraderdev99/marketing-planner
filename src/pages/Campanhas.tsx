import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  initialCampaigns, Campaign, CampaignStatus, Channel, Priority,
  ContentObjective, Funnel, VideoFormat, ViralMechanism, AITool, CampaignFrame
} from '@/data/seedData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Plus, Search, Edit2, Trash2, Film, Zap, BarChart2, Layers,
  Copy, ChevronRight, X, Target, Users, Clock, DollarSign, TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<CampaignStatus, string> = {
  Rascunho: 'bg-muted text-muted-foreground',
  Aprovada: 'bg-blue-500/20 text-blue-400',
  Ativa: 'bg-green-500/20 text-green-400',
  Pausada: 'bg-primary/20 text-primary',
  Finalizada: 'bg-muted text-muted-foreground',
};
const PRIORITY_COLORS: Record<Priority, string> = {
  Alta: 'bg-red-500/20 text-red-400',
  Média: 'bg-primary/20 text-primary',
  Baixa: 'bg-green-500/20 text-green-400',
};
const CHANNEL_ICON: Record<string, string> = {
  Instagram: '📸', TikTok: '🎵', 'Meta Ads': '📊', LinkedIn: '💼',
  'Google Ads': '🔍', Orgânico: '🌱', YouTube: '▶️',
};
const FRAME_TYPE_COLORS: Record<string, string> = {
  setup: 'border-l-teal-500',
  disaster: 'border-l-red-500',
  resolution: 'border-l-muted-foreground',
  hero: 'border-l-primary',
  cta: 'border-l-green-500',
};

const CHANNELS: Channel[] = ['Instagram', 'TikTok', 'Meta Ads', 'LinkedIn', 'Google Ads', 'Orgânico', 'YouTube'];
const AI_TOOLS: AITool[] = ['VEO 3.1', 'Sora', 'Seedance', 'Midjourney', 'Runway', 'CapCut', 'Manual'];
const VIDEO_FORMATS: VideoFormat[] = ['Reels 9:16', 'Shorts 9:16', 'Feed 1:1', 'Carrossel', 'Stories 9:16', 'Horizontal 16:9'];
const VIRAL_MECHANISMS: ViralMechanism[] = [
  'Choque financeiro', 'Reconhecimento emocional', 'POV imersivo',
  'ASMR sensorial', 'Desafio/Challenge', 'Humor cômica',
  'Indignação coletiva', 'Prova social',
];

const EMPTY_FORM: Partial<Campaign> = {
  name: '', channel: ['Instagram'], status: 'Rascunho', priority: 'Média',
  category: 'Awareness', funnel: 'Topo', objective: '', audience: '',
  description: '', budget: 0, responsible: '',
  startDate: '', endDate: '', kanbanStatus: 'ideia',
  videoFormat: 'Reels 9:16', duration: 30, aiTool: [],
  viralMechanism: undefined, hook: '', cta: '', caption: '',
  impressions: 0, clicks: 0, leads: 0, conversions: 0,
  cpc: 0, cpl: 0, roas: 0,
  budgetPaid: 0, budgetOrganic: 0, targetReach: 0,
  frames: [],
  subtasks: [], links: [], history: [],
};

type ModalTab = 'info' | 'criativo' | 'metricas' | 'frames';

const MODAL_TABS: { id: ModalTab; label: string; icon: React.ReactNode }[] = [
  { id: 'info', label: 'Info Básica', icon: <Target className="h-3.5 w-3.5" /> },
  { id: 'criativo', label: 'Criativo', icon: <Film className="h-3.5 w-3.5" /> },
  { id: 'metricas', label: 'Métricas', icon: <BarChart2 className="h-3.5 w-3.5" /> },
  { id: 'frames', label: 'Frames AI', icon: <Layers className="h-3.5 w-3.5" /> },
];

function MultiSelect<T extends string>({
  options, selected, onChange, renderLabel,
}: {
  options: T[];
  selected: T[];
  onChange: (v: T[]) => void;
  renderLabel?: (v: T) => string;
}) {
  const toggle = (v: T) => {
    if (selected.includes(v)) onChange(selected.filter(x => x !== v));
    else onChange([...selected, v]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={cn(
            'rounded-full px-2.5 py-1 text-[10px] font-semibold border transition-all',
            selected.includes(opt)
              ? 'border-primary bg-primary/20 text-primary'
              : 'border-border text-muted-foreground hover:border-primary/40'
          )}>
          {renderLabel ? renderLabel(opt) : opt}
        </button>
      ))}
    </div>
  );
}

function MetricInput({ label, value, onChange, prefix = '', suffix = '' }: {
  label: string; value: number | undefined; onChange: (v: number) => void; prefix?: string; suffix?: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="relative mt-1">
        {prefix && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{prefix}</span>}
        <Input
          type="number"
          value={value ?? 0}
          onChange={e => onChange(Number(e.target.value))}
          className={cn('bg-background h-8 text-sm', prefix && 'pl-6', suffix && 'pr-8')}
        />
        {suffix && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function FrameCard({ frame, onCopy }: { frame: CampaignFrame; onCopy: (text: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const borderClass = FRAME_TYPE_COLORS[frame.type] || 'border-l-border';
  return (
    <div className={cn('border border-border border-l-2 rounded-md bg-background/50 overflow-hidden', borderClass)}>
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-muted/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-wider">{frame.label}</span>
          <ChevronRight className={cn('h-3 w-3 text-muted-foreground transition-transform', expanded && 'rotate-90')} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">{frame.title}</span>
          <span className="text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{frame.timing}</span>
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          <p className="text-[11px] text-muted-foreground italic">{frame.purpose}</p>
          <div className="relative">
            <div className="bg-muted/30 border border-border rounded p-2 font-mono text-[10px] text-foreground/70 leading-relaxed max-h-28 overflow-y-auto">
              {frame.prompt}
            </div>
            <button
              type="button"
              onClick={() => onCopy(frame.prompt)}
              className="absolute top-1.5 right-1.5 flex items-center gap-1 text-[9px] font-mono text-teal-400 hover:text-teal-300 transition-colors"
            >
              <Copy className="h-2.5 w-2.5" /> COPY
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Campanhas() {
  const [campaigns, setCampaigns] = useLocalStorage<Campaign[]>('dqef-campaigns', initialCampaigns);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Campaign>>(EMPTY_FORM);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<ModalTab>('info');
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = campaigns.filter(c => {
    const matchSearch = search === '' || c.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openNew = () => { setForm(EMPTY_FORM); setEditingId(null); setModalTab('info'); setShowModal(true); };
  const openEdit = (c: Campaign) => { setForm({ ...c }); setEditingId(c.id); setModalTab('info'); setShowModal(true); };

  const handleSave = () => {
    if (!form.name?.trim()) return;
    if (editingId) {
      setCampaigns(prev => prev.map(c => c.id === editingId ? { ...c, ...form } as Campaign : c));
    } else {
      const newCamp: Campaign = {
        ...EMPTY_FORM, ...form,
        id: `camp-${Date.now()}`,
        avatar: (form.responsible || 'TM').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2),
        history: [{ date: new Date().toISOString(), action: 'Campanha criada', user: form.responsible || 'Time Marketing' }],
      } as Campaign;
      setCampaigns(prev => [...prev, newCamp]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
    if (detailId === id) setDetailId(null);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(text.slice(0, 20));
    setTimeout(() => setCopied(null), 2000);
  };

  const setF = (patch: Partial<Campaign>) => setForm(f => ({ ...f, ...patch }));

  const detailCampaign = campaigns.find(c => c.id === detailId);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar campanhas..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'Rascunho', 'Aprovada', 'Ativa', 'Pausada', 'Finalizada'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={cn('rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                filterStatus === s ? 'border-primary bg-primary/20 text-primary' : 'border-border text-muted-foreground hover:border-primary/40')}>
              {s === 'all' ? 'Todas' : s}
            </button>
          ))}
        </div>
        <Button onClick={openNew} className="gradient-orange text-white border-0 shrink-0">
          <Plus className="mr-1.5 h-4 w-4" /> Nova Campanha
        </Button>
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <Card className={cn('border-border bg-card transition-all', detailId ? 'flex-1' : 'w-full')}>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Nome', 'Canal', 'Formato', 'Status', 'Prioridade', 'Budget', 'Período', 'Responsável', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id}
                      onClick={() => setDetailId(d => d === c.id ? null : c.id)}
                      className={cn('border-b border-border/50 cursor-pointer hover:bg-muted/20 transition-colors',
                        detailId === c.id && 'bg-primary/5 border-primary/20')}>
                      <td className="px-4 py-3 font-semibold text-foreground max-w-[160px] truncate">
                        <div className="flex items-center gap-1.5">
                          {c.frames && c.frames.length > 0 && <Film className="h-3 w-3 text-teal-400 shrink-0" />}
                          {c.name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {c.channel.slice(0, 2).map(ch => <span key={ch} className="text-xs">{CHANNEL_ICON[ch]}</span>)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {c.videoFormat && (
                          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{c.videoFormat}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', STATUS_COLORS[c.status])}>{c.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', PRIORITY_COLORS[c.priority])}>{c.priority}</span>
                      </td>
                      <td className="px-4 py-3 text-foreground font-medium">R${(c.budget / 1000).toFixed(1)}k</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {c.startDate && `${new Date(c.startDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}${c.endDate ? ` – ${new Date(c.endDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}` : ''}`}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary">{c.avatar}</div>
                          <span className="text-xs text-muted-foreground hidden xl:block">{c.responsible.split(' ')[0]}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openEdit(c)} className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(c.id)} className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-red-500/20 hover:text-red-400 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="text-sm">Nenhuma campanha encontrada</p>
                  <Button variant="ghost" onClick={openNew} className="mt-2 text-primary"><Plus className="mr-1 h-3 w-3" /> Criar campanha</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detail Panel */}
        {detailCampaign && (
          <Card className="w-80 shrink-0 border-border bg-card animate-slide-in overflow-auto max-h-[70vh]">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm font-bold flex-1 pr-2">{detailCampaign.name}</CardTitle>
                <button onClick={() => setDetailId(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', STATUS_COLORS[detailCampaign.status])}>{detailCampaign.status}</span>
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', PRIORITY_COLORS[detailCampaign.priority])}>{detailCampaign.priority}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{detailCampaign.funnel}</span>
                {detailCampaign.videoFormat && (
                  <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] text-teal-400 font-mono">{detailCampaign.videoFormat}</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {/* Hook */}
              {detailCampaign.hook && (
                <div className="rounded-md bg-primary/5 border border-primary/20 p-2">
                  <p className="font-bold text-primary uppercase tracking-wider text-[9px] mb-1">Hook</p>
                  <p className="text-foreground italic">"{detailCampaign.hook}"</p>
                </div>
              )}
              {/* Viral Mechanism */}
              {detailCampaign.viralMechanism && (
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-primary shrink-0" />
                  <span className="text-muted-foreground">Gatilho viral:</span>
                  <span className="text-foreground font-medium">{detailCampaign.viralMechanism}</span>
                </div>
              )}
              {/* Duração e AI */}
              <div className="flex gap-3">
                {detailCampaign.duration && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{detailCampaign.duration}s</span>
                  </div>
                )}
                {detailCampaign.aiTool && detailCampaign.aiTool.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <Film className="h-3 w-3 text-teal-400" />
                    {detailCampaign.aiTool.map(t => (
                      <span key={t} className="text-[9px] font-mono text-teal-400 bg-teal-500/10 px-1.5 rounded">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              {/* Métricas */}
              {(detailCampaign.impressions || 0) > 0 && (
                <div>
                  <p className="font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Performance</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: 'Impressões', value: ((detailCampaign.impressions || 0) / 1000).toFixed(0) + 'k' },
                      { label: 'Clicks', value: ((detailCampaign.clicks || 0) / 1000).toFixed(1) + 'k' },
                      { label: 'Leads', value: String(detailCampaign.leads || 0) },
                      { label: 'ROAS', value: (detailCampaign.roas || 0) + 'x' },
                    ].map(m => (
                      <div key={m.label} className="rounded bg-muted/30 px-2 py-1.5 text-center">
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
                        <p className="text-sm font-bold text-foreground">{m.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* CTA e Caption */}
              {detailCampaign.cta && (
                <div>
                  <p className="font-bold text-muted-foreground uppercase tracking-wider mb-1">CTA</p>
                  <p className="text-foreground">{detailCampaign.cta}</p>
                </div>
              )}
              {detailCampaign.caption && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-muted-foreground uppercase tracking-wider">Caption</p>
                    <button onClick={() => handleCopy(detailCampaign.caption || '')}
                      className="flex items-center gap-1 text-[9px] text-teal-400 hover:text-teal-300">
                      <Copy className="h-2.5 w-2.5" />
                      {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                  <p className="text-foreground bg-muted/20 rounded p-1.5">{detailCampaign.caption}</p>
                </div>
              )}
              {/* Frames */}
              {detailCampaign.frames && detailCampaign.frames.length > 0 && (
                <div>
                  <p className="font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Frames AI ({detailCampaign.frames.length})</p>
                  <div className="space-y-1.5">
                    {detailCampaign.frames.map(f => (
                      <FrameCard key={f.id} frame={f} onCopy={handleCopy} />
                    ))}
                  </div>
                </div>
              )}
              {/* Objetivo e Público */}
              <div>
                <p className="font-bold text-muted-foreground uppercase tracking-wider mb-1">Objetivo</p>
                <p className="text-foreground">{detailCampaign.objective || '—'}</p>
              </div>
              <div>
                <p className="font-bold text-muted-foreground uppercase tracking-wider mb-1">Público</p>
                <p className="text-foreground">{detailCampaign.audience || '—'}</p>
              </div>
              {/* Subtasks */}
              {detailCampaign.subtasks.length > 0 && (
                <div>
                  <p className="font-bold text-muted-foreground uppercase tracking-wider mb-1">Subtarefas</p>
                  {detailCampaign.subtasks.map(st => (
                    <div key={st.id} className="flex items-center gap-2 mb-1">
                      <div className={cn('h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0', st.done ? 'bg-primary border-primary' : 'border-border')}>
                        {st.done && <span className="text-[8px] text-white font-bold">✓</span>}
                      </div>
                      <span className={cn(st.done && 'line-through text-muted-foreground')}>{st.title}</span>
                    </div>
                  ))}
                </div>
              )}
              {/* Histórico */}
              {detailCampaign.history.length > 0 && (
                <div>
                  <p className="font-bold text-muted-foreground uppercase tracking-wider mb-1">Histórico</p>
                  {detailCampaign.history.map((h, i) => (
                    <p key={i} className="text-muted-foreground mb-0.5">{h.date.split('T')[0]} — {h.action}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[92vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-5 pb-0 shrink-0">
            <DialogTitle className="text-base">{editingId ? 'Editar Campanha' : 'Nova Campanha'}</DialogTitle>
          </DialogHeader>

          {/* Tab navigation */}
          <div className="flex gap-0 px-6 pt-3 border-b border-border shrink-0">
            {MODAL_TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setModalTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 -mb-px transition-all',
                  modalTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}>
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">

            {/* ── TAB: Info Básica ── */}
            {modalTab === 'info' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome da Campanha *</label>
                  <Input
                    placeholder="ex: O Ninja na Piscina"
                    value={form.name ?? ''}
                    onChange={e => setF({ name: e.target.value })}
                    className="bg-background mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
                    <Select value={form.status} onValueChange={v => setF({ status: v as CampaignStatus })}>
                      <SelectTrigger className="bg-background mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {(['Rascunho', 'Aprovada', 'Ativa', 'Pausada', 'Finalizada'] as CampaignStatus[]).map(s =>
                          <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prioridade</label>
                    <Select value={form.priority} onValueChange={v => setF({ priority: v as Priority })}>
                      <SelectTrigger className="bg-background mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {(['Alta', 'Média', 'Baixa'] as Priority[]).map(p =>
                          <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Funil</label>
                    <Select value={form.funnel} onValueChange={v => setF({ funnel: v as Funnel })}>
                      <SelectTrigger className="bg-background mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {(['Topo', 'Meio', 'Fundo'] as Funnel[]).map(f =>
                          <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categoria</label>
                    <Select value={form.category} onValueChange={v => setF({ category: v as ContentObjective })}>
                      <SelectTrigger className="bg-background mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {(['Awareness', 'Engajamento', 'Conversão', 'Retenção'] as ContentObjective[]).map(c =>
                          <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Canais</label>
                  <MultiSelect<Channel>
                    options={CHANNELS}
                    selected={form.channel || []}
                    onChange={v => setF({ channel: v })}
                    renderLabel={v => `${CHANNEL_ICON[v]} ${v}`}
                  />
                </div>

                <Textarea
                  placeholder="Objetivo da campanha"
                  value={form.objective ?? ''}
                  onChange={e => setF({ objective: e.target.value })}
                  className="bg-background" rows={2}
                />
                <Textarea
                  placeholder="Público-alvo"
                  value={form.audience ?? ''}
                  onChange={e => setF({ audience: e.target.value })}
                  className="bg-background" rows={2}
                />
                <Textarea
                  placeholder="Descrição"
                  value={form.description ?? ''}
                  onChange={e => setF({ description: e.target.value })}
                  className="bg-background" rows={2}
                />

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Início</label>
                    <Input type="date" value={form.startDate ?? ''} onChange={e => setF({ startDate: e.target.value })} className="bg-background mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fim</label>
                    <Input type="date" value={form.endDate ?? ''} onChange={e => setF({ endDate: e.target.value })} className="bg-background mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Responsável</label>
                    <Input placeholder="Nome" value={form.responsible ?? ''} onChange={e => setF({ responsible: e.target.value })} className="bg-background mt-1" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Budget Total (R$)</label>
                  <Input type="number" value={form.budget ?? 0} onChange={e => setF({ budget: Number(e.target.value) })} className="bg-background mt-1" />
                </div>
              </div>
            )}

            {/* ── TAB: Criativo ── */}
            {modalTab === 'criativo' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Formato de Vídeo</label>
                    <Select value={form.videoFormat} onValueChange={v => setF({ videoFormat: v as VideoFormat })}>
                      <SelectTrigger className="bg-background mt-1"><SelectValue placeholder="Formato" /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {VIDEO_FORMATS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duração (segundos)</label>
                    <Input
                      type="number"
                      value={form.duration ?? 30}
                      onChange={e => setF({ duration: Number(e.target.value) })}
                      className="bg-background mt-1"
                      placeholder="30"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Ferramentas AI</label>
                  <MultiSelect<AITool>
                    options={AI_TOOLS}
                    selected={form.aiTool || []}
                    onChange={v => setF({ aiTool: v })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                    <Zap className="h-3 w-3 inline mr-1 text-primary" />
                    Mecanismo Viral
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {VIRAL_MECHANISMS.map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setF({ viralMechanism: form.viralMechanism === m ? undefined : m as ViralMechanism })}
                        className={cn(
                          'rounded-full px-2.5 py-1 text-[10px] font-semibold border transition-all',
                          form.viralMechanism === m
                            ? 'border-primary bg-primary/20 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/40'
                        )}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hook de Abertura</label>
                  <Input
                    placeholder="A frase que prende nos primeiros 3 segundos..."
                    value={form.hook ?? ''}
                    onChange={e => setF({ hook: e.target.value })}
                    className="bg-background mt-1"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Decisivo nos primeiros 3s para não rolar o feed</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">CTA (Call-to-Action)</label>
                  <Input
                    placeholder="ex: Cadastra grátis. Link na bio."
                    value={form.cta ?? ''}
                    onChange={e => setF({ cta: e.target.value })}
                    className="bg-background mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Caption / Legenda</label>
                  <Textarea
                    placeholder="Texto da legenda do post — emoji, hashtags, engajamento..."
                    value={form.caption ?? ''}
                    onChange={e => setF({ caption: e.target.value })}
                    className="bg-background mt-1"
                    rows={3}
                  />
                  {form.caption && (
                    <p className="text-[10px] text-muted-foreground mt-1">{form.caption.length} caracteres</p>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB: Métricas ── */}
            {modalTab === 'metricas' && (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-teal-400" />
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">Performance Real</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <MetricInput label="Impressões" value={form.impressions} onChange={v => setF({ impressions: v })} />
                    <MetricInput label="Cliques" value={form.clicks} onChange={v => setF({ clicks: v })} />
                    <MetricInput label="Leads Gerados" value={form.leads} onChange={v => setF({ leads: v })} />
                    <MetricInput label="Conversões" value={form.conversions} onChange={v => setF({ conversions: v })} />
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">Eficiência de Custo</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <MetricInput label="CPC (R$)" value={form.cpc} onChange={v => setF({ cpc: v })} prefix="R$" />
                    <MetricInput label="CPL (R$)" value={form.cpl} onChange={v => setF({ cpl: v })} prefix="R$" />
                    <MetricInput label="ROAS" value={form.roas} onChange={v => setF({ roas: v })} suffix="x" />
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-blue-400" />
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">Distribuição de Budget</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <MetricInput label="Pago (R$)" value={form.budgetPaid} onChange={v => setF({ budgetPaid: v })} prefix="R$" />
                    <MetricInput label="Orgânico (R$)" value={form.budgetOrganic} onChange={v => setF({ budgetOrganic: v })} prefix="R$" />
                    <MetricInput label="Alcance Alvo" value={form.targetReach} onChange={v => setF({ targetReach: v })} />
                  </div>
                  {/* Visual budget split */}
                  {((form.budgetPaid || 0) + (form.budgetOrganic || 0)) > 0 && (
                    <div className="mt-3">
                      <div className="flex h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-primary transition-all"
                          style={{ width: `${((form.budgetPaid || 0) / ((form.budgetPaid || 0) + (form.budgetOrganic || 0))) * 100}%` }}
                        />
                        <div className="bg-teal-500 flex-1" />
                      </div>
                      <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                        <span>🔶 Pago {Math.round(((form.budgetPaid || 0) / ((form.budgetPaid || 0) + (form.budgetOrganic || 0))) * 100)}%</span>
                        <span>🌱 Orgânico {Math.round(((form.budgetOrganic || 0) / ((form.budgetPaid || 0) + (form.budgetOrganic || 0))) * 100)}%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Calculated KPIs */}
                {(form.impressions || 0) > 0 && (form.clicks || 0) > 0 && (
                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">KPIs Calculados</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'CTR', value: `${(((form.clicks || 0) / (form.impressions || 1)) * 100).toFixed(2)}%` },
                        { label: 'Conv. Rate', value: `${(((form.conversions || 0) / (form.leads || 1)) * 100).toFixed(1)}%` },
                        { label: 'Lead Rate', value: `${(((form.leads || 0) / (form.clicks || 1)) * 100).toFixed(1)}%` },
                      ].map(k => (
                        <div key={k.label} className="rounded-md bg-muted/30 border border-border p-2 text-center">
                          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{k.label}</p>
                          <p className="text-sm font-bold text-teal-400">{k.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: Frames AI ── */}
            {modalTab === 'frames' && (
              <div className="space-y-3">
                <div className="rounded-md bg-primary/5 border border-primary/20 p-3">
                  <p className="text-[10px] font-mono text-primary uppercase tracking-wider mb-1">Série de Frames para AI Video Generation</p>
                  <p className="text-xs text-muted-foreground">Cada frame é um prompt para VEO 3.1, Sora ou Seedance. Clique para expandir e copiar o prompt completo.</p>
                </div>

                {(form.frames || []).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Layers className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhum frame definido</p>
                    <p className="text-xs mt-1">Frames são adicionados automaticamente nas campanhas da Série O Ninja</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(form.frames || []).map(f => (
                      <FrameCard key={f.id} frame={f} onCopy={handleCopy} />
                    ))}
                  </div>
                )}

                {copied && (
                  <div className="fixed bottom-6 right-6 bg-teal-500 text-white text-xs px-3 py-2 rounded-full font-mono animate-fade-in z-50">
                    ✓ Prompt copiado!
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border shrink-0">
            <div className="flex items-center gap-2 w-full">
              <div className="flex gap-1 mr-auto">
                {MODAL_TABS.map((tab, i) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setModalTab(tab.id)}
                    className={cn('h-1.5 rounded-full transition-all', modalTab === tab.id ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30')}
                  />
                ))}
              </div>
              <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button onClick={handleSave} className="gradient-orange text-white border-0">
                {editingId ? 'Salvar' : 'Criar Campanha'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Copy toast */}
      {copied && (
        <div className="fixed bottom-6 right-6 bg-teal-500 text-white text-xs px-3 py-2 rounded-full font-mono z-50">
          ✓ Copiado!
        </div>
      )}
    </div>
  );
}
