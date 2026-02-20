import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { initialCampaigns, Campaign, CampaignStatus, Channel, Priority, ContentObjective, Funnel } from '@/data/seedData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Search, Edit2, Trash2, ArrowUpDown, Calendar, DollarSign, User } from 'lucide-react';
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

const EMPTY_FORM: Partial<Campaign> = {
  name: '', channel: ['Instagram'], status: 'Rascunho', priority: 'Média',
  category: 'Awareness', funnel: 'Topo', objective: '', audience: '',
  description: '', budget: 0, responsible: '',
  startDate: '', endDate: '', kanbanStatus: 'ideia',
  subtasks: [], links: [], history: [],
};

export default function Campanhas() {
  const [campaigns, setCampaigns] = useLocalStorage<Campaign[]>('dqef-campaigns', initialCampaigns);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Campaign>>(EMPTY_FORM);
  const [detailId, setDetailId] = useState<string | null>(null);

  const filtered = campaigns.filter(c => {
    const matchSearch = search === '' || c.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openNew = () => { setForm(EMPTY_FORM); setEditingId(null); setShowModal(true); };
  const openEdit = (c: Campaign) => { setForm({ ...c }); setEditingId(c.id); setShowModal(true); };

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
                    {['Nome', 'Canal', 'Status', 'Prioridade', 'Budget', 'Período', 'Responsável', ''].map(h => (
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
                      <td className="px-4 py-3 font-semibold text-foreground max-w-[180px] truncate">{c.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {c.channel.slice(0, 2).map(ch => <span key={ch} className="text-xs">{CHANNEL_ICON[ch]}</span>)}
                        </div>
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
              <CardTitle className="text-sm font-bold">{detailCampaign.name}</CardTitle>
              <div className="flex flex-wrap gap-1 mt-1">
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', STATUS_COLORS[detailCampaign.status])}>{detailCampaign.status}</span>
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', PRIORITY_COLORS[detailCampaign.priority])}>{detailCampaign.priority}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{detailCampaign.funnel}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <p className="font-bold text-muted-foreground uppercase tracking-wider mb-1">Objetivo</p>
                <p className="text-foreground">{detailCampaign.objective || '—'}</p>
              </div>
              <div>
                <p className="font-bold text-muted-foreground uppercase tracking-wider mb-1">Público</p>
                <p className="text-foreground">{detailCampaign.audience || '—'}</p>
              </div>
              <div>
                <p className="font-bold text-muted-foreground uppercase tracking-wider mb-1">Descrição</p>
                <p className="text-foreground">{detailCampaign.description || '—'}</p>
              </div>
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
        <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Campanha' : 'Nova Campanha'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome da campanha*" value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-background" />
            <Textarea placeholder="Objetivo" value={form.objective ?? ''} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))} className="bg-background" rows={2} />
            <Textarea placeholder="Público-alvo" value={form.audience ?? ''} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))} className="bg-background" rows={2} />
            <Textarea placeholder="Descrição" value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-background" rows={2} />
            <div className="grid grid-cols-2 gap-2">
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as CampaignStatus }))}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {['Rascunho', 'Aprovada', 'Ativa', 'Pausada', 'Finalizada'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as Priority }))}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Prioridade" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {['Alta', 'Média', 'Baixa'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={form.funnel} onValueChange={v => setForm(f => ({ ...f, funnel: v as Funnel }))}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Funil" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {['Topo', 'Meio', 'Fundo'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as ContentObjective }))}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {['Awareness', 'Engajamento', 'Conversão', 'Retenção'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Início</label>
                <Input type="date" value={form.startDate ?? ''} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="bg-background mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Fim</label>
                <Input type="date" value={form.endDate ?? ''} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="bg-background mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Budget (R$)</label>
                <Input type="number" value={form.budget ?? 0} onChange={e => setForm(f => ({ ...f, budget: Number(e.target.value) }))} className="bg-background mt-1" />
              </div>
              <Input placeholder="Responsável" value={form.responsible ?? ''} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} className="bg-background" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="gradient-orange text-white border-0">
              {editingId ? 'Salvar' : 'Criar Campanha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
