import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { initialCampaigns, Campaign, CampaignStatus, Channel, ContentFormat, Priority, Funnel, KanbanStatus } from '@/data/seedData';
import { initialContents, ContentItem } from '@/data/seedData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Megaphone, Plus, Sparkles, Target, Users, TrendingUp, Calendar,
  DollarSign, AlertTriangle, CheckCircle2, Loader2, ChevronRight,
  LayoutGrid, List, Brain, Zap, Copy, Eye, Trash2, PenLine,
  ArrowRight, X, Info, RefreshCw,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface MetaFields {
  brandEssence?: string;
  uniqueValueProp?: string;
  targetPersona?: { profile?: string; biggestPain?: string; dream?: string; demographics?: string };
  toneRules?: { use?: string[]; avoid?: string[] };
  keyMessages?: string[];
  contentAngles?: string[];
  currentCampaignFocus?: string;
  ctaStyle?: string;
  kpiPriorities?: string[];
  forbiddenTopics?: string[];
  promptContext?: string;
  completenessScore?: number;
}

interface AiPlan {
  campaignSummary: string;
  angle: string;
  hooks: string[];
  keyMessage: string;
  ctaMain: string;
  viralLogic: string;
  estimatedResults?: { reach?: string; engagement?: string; conversions?: string };
  warnings?: string[];
  kanbanTasks?: Array<{
    title: string; description: string; format: ContentFormat; channel: Channel;
    priority: Priority; status: KanbanStatus; daysFromStart: number;
  }>;
  calendarEntries?: Array<{
    title: string; format: ContentFormat; channel: Channel;
    daysFromStart: number; copy: string; responsible: string;
  }>;
}

// ─── Status / color helpers ───────────────────────────────────────────────────

const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string; dot: string }> = {
  Rascunho:   { label: 'Rascunho',   color: 'bg-muted/60 text-muted-foreground border-border',             dot: 'bg-muted-foreground' },
  Aprovada:   { label: 'Aprovada',   color: 'bg-blue-500/15 text-blue-400 border-blue-500/25',             dot: 'bg-blue-400' },
  Ativa:      { label: 'Ativa',      color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',   dot: 'bg-emerald-400' },
  Pausada:    { label: 'Pausada',    color: 'bg-amber-500/15 text-amber-400 border-amber-500/25',          dot: 'bg-amber-400' },
  Finalizada: { label: 'Finalizada', color: 'bg-muted/40 text-muted-foreground/70 border-border/50',       dot: 'bg-muted-foreground/50' },
};

const PRIORITY_COLORS: Record<Priority, string> = {
  Alta:  'bg-red-500/15 text-red-400 border-red-500/25',
  Média: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  Baixa: 'bg-muted/50 text-muted-foreground border-border',
};

const ANGLE_EMOJI: Record<string, string> = {
  Orgulho: '🏆', Dinheiro: '💸', Urgência: '⏰', Raiva: '🔴', Alívio: '💚',
};

const EMPTY_FORM = (): Partial<Campaign> => ({
  name: '', objective: '', channel: 'Instagram' as Channel,
  format: 'Carrossel' as ContentFormat, targetAudience: '', budget: '',
  startDate: new Date().toISOString().split('T')[0], endDate: '',
  priority: 'Alta' as Priority, status: 'Rascunho' as CampaignStatus,
  funnel: 'Topo' as Funnel, responsible: '', description: '',
  kpis: [], channels: [], formats: [], frames: [],
});

// ─── Strategy Pill (shows meta-field context) ─────────────────────────────────

function StrategyPill({ label, value }: { label: string; value: string }) {
  const { toast } = useToast();
  return (
    <div
      onClick={() => { navigator.clipboard.writeText(value); toast({ title: 'Copiado ✅', description: label }); }}
      className="flex items-start gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 cursor-pointer hover:bg-primary/10 transition-colors group"
      title="Clique para copiar"
    >
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-wider text-primary/60 mb-0.5">{label}</p>
        <p className="text-[11px] text-foreground/85 leading-snug line-clamp-2">{value}</p>
      </div>
      <Copy className="h-3 w-3 text-primary/30 group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
    </div>
  );
}

// ─── Campaign Card ────────────────────────────────────────────────────────────

function CampaignCard({
  campaign,
  onEdit,
  onDelete,
  onView,
}: {
  campaign: Campaign;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}) {
  const st = STATUS_CONFIG[campaign.status];
  return (
    <div
      className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-all duration-200 group cursor-pointer"
      onClick={onView}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-foreground truncate">{campaign.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{campaign.objective}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn('flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold', st.color)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />
            {st.label}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-medium', PRIORITY_COLORS[campaign.priority])}>{campaign.priority}</span>
        {campaign.channel && <span className="rounded-full border border-border bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground">{campaign.channel}</span>}
        {campaign.format && <span className="rounded-full border border-border bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground">{campaign.format}</span>}
        {campaign.funnel && <span className="rounded-full border border-border bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground">{campaign.funnel}</span>}
      </div>

      {campaign.budget && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <DollarSign className="h-3 w-3" />
          <span>R$ {campaign.budget}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <span className="text-[10px] text-muted-foreground/60">
          {campaign.startDate ? new Date(campaign.startDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '—'}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button onClick={onEdit} className="rounded p-1 hover:bg-muted transition-colors">
            <PenLine className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </button>
          <button onClick={onDelete} className="rounded p-1 hover:bg-destructive/15 transition-colors group/del">
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground group-hover/del:text-destructive" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Campanhas() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useLocalStorage<Campaign[]>('dqef-campaigns', initialCampaigns);
  const [, setKanbanCampaigns] = useLocalStorage<Campaign[]>('dqef-campaigns', initialCampaigns);
  const [contents, setContents] = useLocalStorage<ContentItem[]>('dqef-contents', initialContents);

  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Campaign>>(EMPTY_FORM());

  // AI state
  const [generating, setGenerating] = useState(false);
  const [aiPlan, setAiPlan] = useState<AiPlan | null>(null);
  const [extraInstructions, setExtraInstructions] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);

  // Meta-fields from strategy
  const [metafields, setMetafields] = useState<MetaFields | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('dqef_strategy_metafields_v1');
      if (raw) setMetafields(JSON.parse(raw));
    } catch { /* noop */ }
  }, []);

  // Auto-fill form from meta-fields
  const autofillFromStrategy = () => {
    if (!metafields) return;
    setForm(prev => ({
      ...prev,
      targetAudience: prev.targetAudience || metafields.targetPersona?.profile || '',
      objective: prev.objective || metafields.currentCampaignFocus || '',
    }));
    toast({ title: 'Campos preenchidos ✅', description: 'Usamos os meta-fields da estratégia como base.' });
  };

  const detailCampaign = campaigns.find(c => c.id === detailId);

  const openCreate = () => {
    setEditingId(null);
    setAiPlan(null);
    setExtraInstructions('');
    setForm(EMPTY_FORM());
    setShowAiPanel(false);
    setShowModal(true);
  };

  const openEdit = (c: Campaign) => {
    setEditingId(c.id);
    setAiPlan(null);
    setExtraInstructions('');
    setForm({ ...c });
    setShowAiPanel(false);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
    toast({ title: 'Campanha removida' });
  };

  const handleSave = () => {
    if (!form.name?.trim()) {
      toast({ title: 'Nome obrigatório', variant: 'destructive' });
      return;
    }
    if (editingId) {
      setCampaigns(prev => prev.map(c => c.id === editingId ? { ...c, ...form } as Campaign : c));
      toast({ title: 'Campanha atualizada ✅' });
    } else {
      const newCampaign: Campaign = {
        id: `camp-${Date.now()}`,
        name: form.name!, objective: form.objective || '',
        channel: form.channel || 'Instagram',
        format: form.format || 'Carrossel',
        targetAudience: form.targetAudience || '',
        budget: form.budget || '', startDate: form.startDate || '',
        endDate: form.endDate || '', priority: form.priority || 'Alta',
        status: form.status || 'Rascunho', funnel: form.funnel || 'Topo',
        responsible: form.responsible || 'Time Marketing',
        description: form.description || '',
        kpis: [], channels: [form.channel || 'Instagram'],
        formats: [form.format || 'Carrossel'], frames: [],
      };
      setCampaigns(prev => [...prev, newCampaign]);
      toast({ title: 'Campanha criada ✅' });
    }
    setShowModal(false);
  };

  // ── AI generation ──────────────────────────────────────────────────────────

  const handleGenerateAI = async () => {
    if (!form.name?.trim()) {
      toast({ title: 'Dê um nome para a campanha', description: 'Pelo menos o nome é necessário para a IA gerar o plano.', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    setAiPlan(null);
    try {
      const { data: result, error } = await supabase.functions.invoke('generate-campaign-plan', {
        body: { campaignForm: form, strategyMetafields: metafields, extraInstructions },
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      setAiPlan(result.plan as AiPlan);
      setShowAiPanel(true);
      toast({ title: 'Plano de campanha gerado ✅', description: 'Revise e aplique as sugestões ao Kanban e Calendário.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({ title: 'Erro ao gerar plano', description: msg, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  // Apply AI plan → Kanban + Calendar
  const handleApplyPlan = () => {
    if (!aiPlan) return;

    const startMs = form.startDate ? new Date(form.startDate + 'T12:00:00').getTime() : Date.now();

    // First save the campaign
    const savedId = editingId || `camp-${Date.now()}`;
    const campaignName = form.name!;
    if (editingId) {
      setCampaigns(prev => prev.map(c => c.id === editingId ? { ...c, ...form, description: aiPlan.campaignSummary } as Campaign : c));
    } else {
      const newC: Campaign = {
        id: savedId, name: campaignName,
        objective: form.objective || aiPlan.keyMessage,
        channel: form.channel || 'Instagram', format: form.format || 'Carrossel',
        targetAudience: form.targetAudience || '', budget: form.budget || '',
        startDate: form.startDate || '', endDate: form.endDate || '',
        priority: form.priority || 'Alta', status: 'Aprovada',
        funnel: form.funnel || 'Topo',
        responsible: form.responsible || 'Time Marketing',
        description: aiPlan.campaignSummary,
        kpis: [], channels: [form.channel || 'Instagram'],
        formats: [form.format || 'Carrossel'], frames: [],
      };
      setCampaigns(prev => [...prev, newC]);
    }

    // Add kanban tasks
    const kanbanItems: Campaign[] = (aiPlan.kanbanTasks || []).map((t, i) => ({
      id: `camp-${Date.now()}-k${i}`,
      name: `[${campaignName}] ${t.title}`,
      objective: t.description,
      channel: t.channel, format: t.format,
      targetAudience: '', budget: '',
      startDate: new Date(startMs + t.daysFromStart * 86400000).toISOString().split('T')[0],
      endDate: '', priority: t.priority,
      status: t.status as CampaignStatus,
      funnel: form.funnel || 'Topo',
      responsible: form.responsible || 'Time Marketing',
      description: t.description,
      kpis: [], channels: [t.channel], formats: [t.format], frames: [],
    }));
    setKanbanCampaigns(prev => [...prev, ...kanbanItems]);

    // Add calendar entries
    const calItems: ContentItem[] = (aiPlan.calendarEntries || []).map((e, i) => ({
      id: `cont-${Date.now()}-c${i}`,
      title: e.title, format: e.format, channel: e.channel,
      date: new Date(startMs + e.daysFromStart * 86400000).toISOString().split('T')[0],
      status: 'Rascunho' as ContentItem['status'],
      responsible: e.responsible || 'Time Marketing',
      copy: e.copy || '',
    }));
    setContents(prev => [...prev, ...calItems]);

    toast({
      title: '🚀 Campanha aplicada!',
      description: `${kanbanItems.length} tarefas no Kanban · ${calItems.length} entradas no Calendário`,
    });
    setShowModal(false);
  };

  // ── Filters ────────────────────────────────────────────────────────────────

  const filtered = campaigns.filter(c =>
    filterStatus === 'all' || c.status === filterStatus
  );

  const grouped = (Object.keys(STATUS_CONFIG) as CampaignStatus[]).reduce<Record<CampaignStatus, Campaign[]>>(
    (acc, st) => { acc[st] = filtered.filter(c => c.status === st); return acc; },
    {} as Record<CampaignStatus, Campaign[]>
  );

  const hasStrategy = !!metafields && (metafields.completenessScore ?? 0) > 0;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-primary/15 p-3 border border-primary/20">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-black text-foreground tracking-tight">Campanhas</h1>
            <p className="text-sm text-muted-foreground">
              {hasStrategy
                ? `Estratégia ativa · Score ${metafields.completenessScore}% · IA vai usar esses dados na geração`
                : 'Preencha a aba Estratégia para a IA gerar campanhas mais precisas'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button onClick={() => setView('grid')} className={cn('p-2 transition-colors', view === 'grid' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground')}>
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button onClick={() => setView('list')} className={cn('p-2 transition-colors', view === 'list' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground')}>
                <List className="h-4 w-4" />
              </button>
            </div>
            <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              <Plus className="h-4 w-4" /> Nova campanha
            </Button>
          </div>
        </div>

        {/* ── Strategy context banner ────────────────────────────────────── */}
        {hasStrategy && metafields && (
          <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/8 to-transparent p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-4 w-4 text-primary" />
              <p className="text-sm font-bold text-foreground">Meta-Fields Ativos da Estratégia</p>
              <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                Score {metafields.completenessScore}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {metafields.brandEssence && <StrategyPill label="Essência" value={metafields.brandEssence} />}
              {metafields.targetPersona?.profile && <StrategyPill label="Persona" value={metafields.targetPersona.profile} />}
              {metafields.currentCampaignFocus && <StrategyPill label="Foco Atual" value={metafields.currentCampaignFocus} />}
              {metafields.targetPersona?.biggestPain && <StrategyPill label="Maior Dor" value={metafields.targetPersona.biggestPain} />}
              {metafields.ctaStyle && <StrategyPill label="CTA Style" value={metafields.ctaStyle} />}
              {metafields.keyMessages?.[0] && <StrategyPill label="Mensagem Central" value={metafields.keyMessages[0]} />}
            </div>
          </div>
        )}

        {/* ── Filter bar ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          {['all', ...Object.keys(STATUS_CONFIG)].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                filterStatus === st
                  ? 'bg-primary/20 text-primary border-primary/30'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {st === 'all' ? `Todas (${campaigns.length})` : `${st} (${grouped[st as CampaignStatus]?.length ?? 0})`}
            </button>
          ))}
        </div>

        {/* ── Campaign grid / list ───────────────────────────────────────── */}
        {view === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(c => (
              <CampaignCard
                key={c.id}
                campaign={c}
                onEdit={() => openEdit(c)}
                onDelete={() => handleDelete(c.id)}
                onView={() => setDetailId(c.id)}
              />
            ))}
            <button
              onClick={openCreate}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all min-h-[140px] text-sm text-muted-foreground hover:text-primary"
            >
              <Plus className="h-5 w-5" />
              Nova campanha
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(c => {
              const st = STATUS_CONFIG[c.status];
              return (
                <div key={c.id} className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 hover:border-primary/30 transition-colors group cursor-pointer" onClick={() => setDetailId(c.id)}>
                  <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border', c.priority === 'Alta' ? 'border-red-500/30 bg-red-500/10' : 'border-border bg-muted/30')}>
                    <Megaphone className={cn('h-4 w-4', c.priority === 'Alta' ? 'text-red-400' : 'text-muted-foreground')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.objective}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold', st.color)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />{st.label}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEdit(c)} className="rounded p-1 hover:bg-muted transition-colors"><PenLine className="h-3.5 w-3.5 text-muted-foreground" /></button>
                      <button onClick={() => handleDelete(c.id)} className="rounded p-1 hover:bg-destructive/15 transition-colors group/del"><Trash2 className="h-3.5 w-3.5 text-muted-foreground group-hover/del:text-destructive" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Create / Edit Modal ────────────────────────────────────────── */}
        <Dialog open={showModal} onOpenChange={v => { if (!v) setShowModal(false); }}>
          <DialogContent className="max-w-2xl bg-card border-border overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                {editingId ? 'Editar campanha' : 'Nova campanha'}
                {hasStrategy && (
                  <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary flex items-center gap-1">
                    <Brain className="h-3 w-3" /> Estratégia ativa
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5">

              {/* Strategy auto-fill hint */}
              {hasStrategy && (
                <div className="flex items-center justify-between rounded-lg bg-primary/8 border border-primary/20 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <p className="text-xs text-foreground/80">Quer pré-preencher com a estratégia ativa?</p>
                  </div>
                  <button onClick={autofillFromStrategy} className="text-xs font-bold text-primary hover:underline">
                    Preencher →
                  </button>
                </div>
              )}

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Nome da campanha *</label>
                  <Input
                    placeholder="Ex: Campanha Prestadores — Fevereiro 2026"
                    value={form.name || ''}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="bg-muted/20 border-border/60"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1">
                    Objetivo
                    {metafields?.currentCampaignFocus && (
                      <span className="text-[9px] text-primary/70 font-normal ml-1">(sugestão: {metafields.currentCampaignFocus.slice(0, 40)}...)</span>
                    )}
                  </label>
                  <Textarea
                    placeholder="O que essa campanha precisa alcançar? Seja específico com números e prazo."
                    value={form.objective || ''}
                    onChange={e => setForm(f => ({ ...f, objective: e.target.value }))}
                    rows={2}
                    className="bg-muted/20 border-border/60 resize-none text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Canal principal</label>
                    <Select value={form.channel || 'Instagram'} onValueChange={v => setForm(f => ({ ...f, channel: v as Channel }))}>
                      <SelectTrigger className="bg-muted/20 border-border/60"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {['Instagram', 'TikTok', 'Meta Ads', 'LinkedIn', 'YouTube', 'Orgânico'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Formato</label>
                    <Select value={form.format || 'Carrossel'} onValueChange={v => setForm(f => ({ ...f, format: v as ContentFormat }))}>
                      <SelectTrigger className="bg-muted/20 border-border/60"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {['Post', 'Reels', 'Stories', 'Carrossel', 'Ads', 'Shorts'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Prioridade</label>
                    <Select value={form.priority || 'Alta'} onValueChange={v => setForm(f => ({ ...f, priority: v as Priority }))}>
                      <SelectTrigger className="bg-muted/20 border-border/60"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {['Alta', 'Média', 'Baixa'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Funil</label>
                    <Select value={form.funnel || 'Topo'} onValueChange={v => setForm(f => ({ ...f, funnel: v as Funnel }))}>
                      <SelectTrigger className="bg-muted/20 border-border/60"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {['Topo', 'Meio', 'Fundo'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Status</label>
                    <Select value={form.status || 'Rascunho'} onValueChange={v => setForm(f => ({ ...f, status: v as CampaignStatus }))}>
                      <SelectTrigger className="bg-muted/20 border-border/60"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {Object.keys(STATUS_CONFIG).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Início</label>
                    <Input type="date" value={form.startDate || ''} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="bg-muted/20 border-border/60" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Término</label>
                    <Input type="date" value={form.endDate || ''} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="bg-muted/20 border-border/60" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Orçamento (R$)</label>
                    <Input placeholder="Ex: 5000" value={form.budget || ''} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} className="bg-muted/20 border-border/60" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Responsável</label>
                    <Input placeholder="Ex: Guilherme" value={form.responsible || ''} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} className="bg-muted/20 border-border/60" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Público-alvo</label>
                  <Input
                    placeholder={metafields?.targetPersona?.profile || 'Descreva quem é o público desta campanha'}
                    value={form.targetAudience || ''}
                    onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))}
                    className="bg-muted/20 border-border/60"
                  />
                </div>
              </div>

              {/* ── AI Generation section ─────────────────────────────── */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/15 p-1.5 border border-primary/20">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Gerar plano de campanha com IA</p>
                    <p className="text-[11px] text-muted-foreground">
                      {hasStrategy ? 'Usa os meta-fields da estratégia + knowledge base' : 'Preencha os campos acima e deixe a IA sugerir tarefas e conteúdos'}
                    </p>
                  </div>
                </div>

                <Textarea
                  placeholder="Instruções adicionais (opcional) — Ex: 'Foco em vídeos curtos no TikTok, tom mais urgente, usar dado da comissão de 10%'"
                  value={extraInstructions}
                  onChange={e => setExtraInstructions(e.target.value)}
                  rows={2}
                  className="bg-muted/20 border-border/60 resize-none text-sm placeholder:text-muted-foreground/40"
                />

                <Button
                  onClick={handleGenerateAI}
                  disabled={generating}
                  variant="outline"
                  className="w-full border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60 gap-2 font-bold"
                >
                  {generating
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando plano com IA...</>
                    : <><Sparkles className="h-4 w-4" /> Gerar plano com IA</>
                  }
                </Button>
              </div>

              {/* ── AI Plan result ────────────────────────────────────── */}
              {aiPlan && showAiPanel && (
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <p className="text-sm font-bold text-foreground">Plano gerado pela IA</p>
                      {aiPlan.angle && (
                        <span className="rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          {ANGLE_EMOJI[aiPlan.angle] || '🎯'} {aiPlan.angle}
                        </span>
                      )}
                    </div>
                    <button onClick={() => setShowAiPanel(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-xs text-foreground/80 leading-relaxed bg-muted/30 rounded-lg px-3 py-2">
                    {aiPlan.campaignSummary}
                  </p>

                  {aiPlan.keyMessage && (
                    <div className="rounded-lg bg-muted/30 px-3 py-2">
                      <p className="text-[10px] font-bold text-muted-foreground/60 mb-0.5 uppercase tracking-wider">Mensagem Central</p>
                      <p className="text-xs font-semibold text-foreground">{aiPlan.keyMessage}</p>
                    </div>
                  )}

                  {aiPlan.hooks && aiPlan.hooks.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-1.5">Hooks sugeridos</p>
                      <div className="space-y-1">
                        {aiPlan.hooks.map((h, i) => (
                          <div key={i} className="flex items-start gap-2 rounded-lg bg-muted/20 px-3 py-2">
                            <span className="text-primary text-xs font-bold mt-0.5">{i + 1}</span>
                            <p className="text-xs text-foreground/85">{h}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-center">
                    {aiPlan.kanbanTasks && (
                      <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2">
                        <p className="text-lg font-black text-blue-400">{aiPlan.kanbanTasks.length}</p>
                        <p className="text-[10px] text-muted-foreground">tarefas no Kanban</p>
                      </div>
                    )}
                    {aiPlan.calendarEntries && (
                      <div className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-2">
                        <p className="text-lg font-black text-primary">{aiPlan.calendarEntries.length}</p>
                        <p className="text-[10px] text-muted-foreground">entradas no Calendário</p>
                      </div>
                    )}
                  </div>

                  {aiPlan.warnings && aiPlan.warnings.length > 0 && (
                    <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        {aiPlan.warnings.map((w, i) => (
                          <p key={i} className="text-[11px] text-amber-400">{w}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleApplyPlan}
                    className="w-full bg-emerald-600 hover:bg-emerald-600/90 text-white font-bold gap-2"
                  >
                    <Zap className="h-4 w-4" />
                    Aplicar plano → Kanban + Calendário
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {editingId ? 'Salvar alterações' : 'Criar campanha'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Detail drawer ─────────────────────────────────────────────── */}
        {detailCampaign && (
          <Dialog open={!!detailId} onOpenChange={v => { if (!v) setDetailId(null); }}>
            <DialogContent className="max-w-lg bg-card border-border">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-primary" />
                  {detailCampaign.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className={cn('flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold', STATUS_CONFIG[detailCampaign.status].color)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_CONFIG[detailCampaign.status].dot)} />
                    {detailCampaign.status}
                  </span>
                  <span className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', PRIORITY_COLORS[detailCampaign.priority])}>{detailCampaign.priority}</span>
                  {detailCampaign.funnel && <span className="rounded-full border border-border bg-muted/30 px-2 py-0.5 text-xs">{detailCampaign.funnel}</span>}
                </div>
                {detailCampaign.objective && <p className="text-sm text-foreground/85 leading-relaxed">{detailCampaign.objective}</p>}
                {detailCampaign.description && detailCampaign.description !== detailCampaign.objective && (
                  <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">{detailCampaign.description}</p>
                )}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {detailCampaign.channel && <div><p className="text-muted-foreground/60 mb-0.5">Canal</p><p className="font-medium">{detailCampaign.channel}</p></div>}
                  {detailCampaign.format && <div><p className="text-muted-foreground/60 mb-0.5">Formato</p><p className="font-medium">{detailCampaign.format}</p></div>}
                  {detailCampaign.budget && <div><p className="text-muted-foreground/60 mb-0.5">Orçamento</p><p className="font-medium">R$ {detailCampaign.budget}</p></div>}
                  {detailCampaign.responsible && <div><p className="text-muted-foreground/60 mb-0.5">Responsável</p><p className="font-medium">{detailCampaign.responsible}</p></div>}
                  {detailCampaign.startDate && <div><p className="text-muted-foreground/60 mb-0.5">Início</p><p className="font-medium">{new Date(detailCampaign.startDate + 'T12:00:00').toLocaleDateString('pt-BR')}</p></div>}
                  {detailCampaign.endDate && <div><p className="text-muted-foreground/60 mb-0.5">Término</p><p className="font-medium">{new Date(detailCampaign.endDate + 'T12:00:00').toLocaleDateString('pt-BR')}</p></div>}
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setDetailId(null)}>Fechar</Button>
                <Button onClick={() => { setDetailId(null); openEdit(detailCampaign); }} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <PenLine className="mr-1.5 h-4 w-4" /> Editar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

      </div>
    </div>
  );
}
