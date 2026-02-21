import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Eye, TrendingUp, MousePointerClick, Target, DollarSign,
  Plus, LayoutGrid, List, Upload, Trash2, Edit3, Archive,
  Instagram, Linkedin, Image as ImageIcon, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PLATFORMS = ['Instagram', 'TikTok', 'LinkedIn', 'Facebook', 'YouTube'];
const STATUSES = ['active', 'paused', 'archived'];
const FORMATS = ['Feed', 'Stories', 'Reels', 'Carrossel'];

const platformColors: Record<string, string> = {
  Instagram: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  TikTok: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  LinkedIn: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Facebook: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  YouTube: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  paused: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  archived: 'bg-muted text-muted-foreground border-border',
  draft: 'bg-muted text-muted-foreground border-border',
};

interface Creative {
  id: string;
  title: string;
  file_url: string | null;
  thumbnail_url: string | null;
  platform: string | null;
  format_type: string | null;
  dimensions: string | null;
  campaign_id: string | null;
  status: string;
  published_at: string | null;
  impressions: number;
  clicks: number;
  engagement_rate: number;
  conversions: number;
  spend: number;
  tags: string[];
  notes: string | null;
  grid_position: number | null;
  created_at: string;
}

export default function CriativosAtivos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterPlatform, setFilterPlatform] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterFormat, setFilterFormat] = useState<string | null>(null);
  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Add form state
  const [newTitle, setNewTitle] = useState('');
  const [newPlatform, setNewPlatform] = useState('Instagram');
  const [newFormat, setNewFormat] = useState('Feed');
  const [newFile, setNewFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) fetchCreatives();
  }, [user]);

  async function fetchCreatives() {
    const { data, error } = await supabase
      .from('active_creatives')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setCreatives(data as Creative[]);
    setLoading(false);
  }

  async function handleUpload() {
    if (!user || !newTitle || !newFile) return;
    setUploading(true);
    const ext = newFile.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from('brand-assets')
      .upload(path, newFile);
    if (uploadErr) {
      toast({ title: 'Erro no upload', description: uploadErr.message, variant: 'destructive' });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('brand-assets').getPublicUrl(path);
    const { error: insertErr } = await supabase.from('active_creatives').insert({
      user_id: user.id,
      title: newTitle,
      file_url: urlData.publicUrl,
      thumbnail_url: urlData.publicUrl,
      platform: newPlatform,
      format_type: newFormat,
      status: 'active',
    });
    if (insertErr) {
      toast({ title: 'Erro', description: insertErr.message, variant: 'destructive' });
    } else {
      toast({ title: 'Criativo adicionado!' });
      setShowAddDialog(false);
      setNewTitle('');
      setNewFile(null);
      fetchCreatives();
    }
    setUploading(false);
  }

  async function handleDelete(id: string) {
    await supabase.from('active_creatives').delete().eq('id', id);
    setCreatives((prev) => prev.filter((c) => c.id !== id));
    setSelectedCreative(null);
    toast({ title: 'Criativo removido' });
  }

  const filtered = creatives.filter((c) => {
    if (filterPlatform && c.platform !== filterPlatform) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterFormat && c.format_type !== filterFormat) return false;
    return true;
  });

  const activeCount = creatives.filter((c) => c.status === 'active').length;
  const avgEngagement = creatives.length
    ? (creatives.reduce((s, c) => s + (c.engagement_rate || 0), 0) / creatives.length).toFixed(2)
    : '0';
  const totalSpend = creatives.reduce((s, c) => s + (c.spend || 0), 0);
  const bestCreative = creatives.reduce((best, c) => ((c.conversions || 0) > (best?.conversions || 0) ? c : best), creatives[0]);

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Criativos Ativos', value: activeCount, icon: ImageIcon, color: 'text-primary' },
          { label: 'Eng. Rate Médio', value: `${avgEngagement}%`, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Melhor Criativo', value: bestCreative?.title?.slice(0, 16) || '—', icon: Target, color: 'text-amber-400' },
          { label: 'Investimento Total', value: `R$ ${totalSpend.toLocaleString('pt-BR')}`, icon: DollarSign, color: 'text-teal-400' },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-border bg-card">
            <CardContent className="flex items-center gap-3 p-4">
              <kpi.icon className={cn('h-5 w-5 shrink-0', kpi.color)} />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="truncate text-lg font-bold text-foreground">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar
        </Button>
        <div className="h-4 w-px bg-border" />
        {PLATFORMS.map((p) => (
          <Badge
            key={p}
            className={cn('cursor-pointer transition-all', filterPlatform === p ? platformColors[p] : 'bg-muted/50 text-muted-foreground hover:bg-muted')}
            onClick={() => setFilterPlatform(filterPlatform === p ? null : p)}
          >
            {p}
          </Badge>
        ))}
        <div className="h-4 w-px bg-border" />
        {STATUSES.map((s) => (
          <Badge
            key={s}
            className={cn('cursor-pointer capitalize transition-all', filterStatus === s ? statusColors[s] : 'bg-muted/50 text-muted-foreground hover:bg-muted')}
            onClick={() => setFilterStatus(filterStatus === s ? null : s)}
          >
            {s === 'active' ? 'Ativo' : s === 'paused' ? 'Pausado' : 'Arquivado'}
          </Badge>
        ))}
        <div className="ml-auto flex gap-1">
          <Button size="icon" variant={viewMode === 'grid' ? 'default' : 'ghost'} className="h-8 w-8" onClick={() => setViewMode('grid')}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button size="icon" variant={viewMode === 'list' ? 'default' : 'ghost'} className="h-8 w-8" onClick={() => setViewMode('list')}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <ImageIcon className="h-12 w-12 opacity-30" />
          <p className="text-sm">Nenhum criativo encontrado</p>
          <Button size="sm" onClick={() => setShowAddDialog(true)}><Plus className="mr-1 h-3.5 w-3.5" /> Adicionar primeiro criativo</Button>
        </div>
      ) : (
        <div className={cn(viewMode === 'grid' ? 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'space-y-3')}>
          {filtered.map((c) => (
            <Card
              key={c.id}
              className="group cursor-pointer border-border bg-card transition-all hover:border-primary/40 hover:shadow-md"
              onClick={() => setSelectedCreative(c)}
            >
              {/* Preview */}
              <div className="relative aspect-[4/5] overflow-hidden rounded-t-lg bg-muted">
                {c.thumbnail_url || c.file_url ? (
                  <img src={c.thumbnail_url || c.file_url || ''} alt={c.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center"><ImageIcon className="h-10 w-10 text-muted-foreground/30" /></div>
                )}
                {c.platform && <Badge className={cn('absolute left-2 top-2 text-[10px]', platformColors[c.platform] || 'bg-muted')}>{c.platform}</Badge>}
                <Badge className={cn('absolute right-2 top-2 text-[10px] capitalize', statusColors[c.status] || 'bg-muted')}>
                  {c.status === 'active' ? 'Ativo' : c.status === 'paused' ? 'Pausado' : c.status}
                </Badge>
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20"><Eye className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              {/* Info */}
              <CardContent className="space-y-2 p-3">
                <p className="truncate text-sm font-semibold text-foreground">{c.title}</p>
                {c.format_type && <p className="text-xs text-muted-foreground">{c.format_type} {c.dimensions && `· ${c.dimensions}`}</p>}
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { label: 'Imp', value: c.impressions || 0 },
                    { label: 'Cliq', value: c.clicks || 0 },
                    { label: 'Eng%', value: `${c.engagement_rate || 0}` },
                    { label: 'Conv', value: c.conversions || 0 },
                  ].map((m) => (
                    <div key={m.label} className="text-center">
                      <p className="text-[10px] text-muted-foreground">{m.label}</p>
                      <p className="text-xs font-bold text-foreground">{typeof m.value === 'number' ? m.value.toLocaleString('pt-BR') : m.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedCreative} onOpenChange={() => setSelectedCreative(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedCreative?.title}</DialogTitle>
            <DialogDescription>{selectedCreative?.platform} · {selectedCreative?.format_type}</DialogDescription>
          </DialogHeader>
          {selectedCreative && (
            <div className="space-y-4">
              {(selectedCreative.file_url || selectedCreative.thumbnail_url) && (
                <img src={selectedCreative.file_url || selectedCreative.thumbnail_url || ''} alt="" className="w-full rounded-lg" />
              )}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Impressões', value: selectedCreative.impressions },
                  { label: 'Cliques', value: selectedCreative.clicks },
                  { label: 'Eng. Rate', value: `${selectedCreative.engagement_rate}%` },
                  { label: 'Conversões', value: selectedCreative.conversions },
                  { label: 'Investimento', value: `R$ ${selectedCreative.spend}` },
                  { label: 'Status', value: selectedCreative.status },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="text-sm font-bold text-foreground">{m.value}</p>
                  </div>
                ))}
              </div>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedCreative.id)}>
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Remover
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo Criativo</DialogTitle>
            <DialogDescription>Adicione um criativo ativo com preview e métricas</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome do criativo" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <div className="flex gap-2">
              <select value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)} className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm">
                {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
              </select>
              <select value={newFormat} onChange={(e) => setNewFormat(e.target.value)} className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm">
                {FORMATS.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div className="rounded-lg border border-dashed border-border p-4 text-center">
              <input type="file" accept="image/*,video/*" onChange={(e) => setNewFile(e.target.files?.[0] || null)} className="hidden" id="creative-upload" />
              <label htmlFor="creative-upload" className="cursor-pointer text-sm text-muted-foreground hover:text-primary">
                <Upload className="mx-auto mb-1 h-6 w-6" />
                {newFile ? newFile.name : 'Clique para selecionar arquivo'}
              </label>
            </div>
            <Button className="w-full" onClick={handleUpload} disabled={!newTitle || !newFile || uploading}>
              {uploading ? 'Enviando...' : 'Adicionar Criativo'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
