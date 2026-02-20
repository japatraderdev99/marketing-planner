import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { initialCampaigns, Campaign, KanbanStatus, Channel, Priority, ContentObjective } from '@/data/seedData';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  DndContext, DragEndEvent, DragOverEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors, DragOverlay, closestCorners
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Calendar, User, AlertCircle, GripVertical, X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLUMNS: { id: KanbanStatus; label: string; color: string }[] = [
  { id: 'ideia', label: 'Ideia', color: 'border-t-muted-foreground' },
  { id: 'desenvolvimento', label: 'Em Desenvolvimento', color: 'border-t-blue-500' },
  { id: 'revisao', label: 'Revisão', color: 'border-t-yellow-500' },
  { id: 'aprovado', label: 'Aprovado', color: 'border-t-teal' },
  { id: 'publicado', label: 'Publicado', color: 'border-t-green-500' },
];

const PRIORITY_BADGE: Record<Priority, string> = {
  Alta: 'bg-red-500/20 text-red-400 border-red-500/30',
  Média: 'bg-primary/20 text-primary border-primary/30',
  Baixa: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const CATEGORY_BADGE: Record<string, string> = {
  Awareness: 'bg-purple-500/15 text-purple-400',
  Engajamento: 'bg-blue-500/15 text-blue-400',
  Conversão: 'bg-primary/15 text-primary',
  Retenção: 'bg-teal/15 text-teal',
};

const CHANNEL_ICON: Record<string, string> = {
  Instagram: '📸',
  TikTok: '🎵',
  'Meta Ads': '📊',
  LinkedIn: '💼',
  'Google Ads': '🔍',
  Orgânico: '🌱',
  YouTube: '▶️',
};

function isUrgent(dateStr: string) {
  const diff = (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff <= 3 && diff >= 0;
}

function KanbanCard({ campaign, isDragging }: { campaign: Campaign; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSorting } = useSortable({
    id: campaign.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSorting ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group rounded-xl border border-border bg-card p-3 shadow-sm transition-all duration-200',
        'hover:border-primary/30 hover:shadow-md hover:shadow-primary/5',
        isDragging && 'shadow-xl border-primary/50 rotate-1'
      )}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab touch-none text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-snug text-foreground">{campaign.name}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {campaign.channel.slice(0, 2).map(ch => (
              <span key={ch} className="text-xs text-muted-foreground">
                {CHANNEL_ICON[ch]} {ch}
              </span>
            ))}
            {campaign.channel.length > 2 && (
              <span className="text-xs text-muted-foreground">+{campaign.channel.length - 2}</span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold', PRIORITY_BADGE[campaign.priority])}>
              {campaign.priority}
            </span>
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', CATEGORY_BADGE[campaign.category])}>
              {campaign.category}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                {campaign.avatar}
              </div>
              <span className="text-[10px] text-muted-foreground">{campaign.responsible.split(' ')[0]}</span>
            </div>
            {campaign.endDate && (
              <div className={cn('flex items-center gap-1 text-[10px]', isUrgent(campaign.endDate) ? 'text-red-400' : 'text-muted-foreground')}>
                {isUrgent(campaign.endDate) && <AlertCircle className="h-3 w-3" />}
                <Calendar className="h-3 w-3" />
                {new Date(campaign.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NewCardModal({
  open, onClose, columnId, onSave
}: {
  open: boolean;
  onClose: () => void;
  columnId: KanbanStatus;
  onSave: (card: Partial<Campaign>) => void;
}) {
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<Channel>('Instagram');
  const [priority, setPriority] = useState<Priority>('Média');
  const [category, setCategory] = useState<ContentObjective>('Awareness');
  const [responsible, setResponsible] = useState('');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name,
      channel: [channel],
      priority,
      category,
      responsible: responsible || 'Time Marketing',
      avatar: (responsible || 'TM').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
    });
    setName('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>Nova Campanha — {COLUMNS.find(c => c.id === columnId)?.label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Nome da campanha*" value={name} onChange={e => setName(e.target.value)} className="bg-background" />
          <Select value={channel} onValueChange={v => setChannel(v as Channel)}>
            <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-card border-border">
              {['Instagram', 'TikTok', 'Meta Ads', 'LinkedIn', 'Google Ads', 'Orgânico', 'YouTube'].map(c => (
                <SelectItem key={c} value={c}>{CHANNEL_ICON[c]} {c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Select value={priority} onValueChange={v => setPriority(v as Priority)}>
              <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                {['Alta', 'Média', 'Baixa'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={v => setCategory(v as ContentObjective)}>
              <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                {['Awareness', 'Engajamento', 'Conversão', 'Retenção'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Input placeholder="Responsável" value={responsible} onChange={e => setResponsible(e.target.value)} className="bg-background" />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} className="gradient-orange text-white border-0">Criar Card</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Kanban() {
  const [campaigns, setCampaigns] = useLocalStorage<Campaign[]>('dqef-campaigns', initialCampaigns);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newCardColumn, setNewCardColumn] = useState<KanbanStatus | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterChannel, setFilterChannel] = useState<string>('all');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const filtered = campaigns.filter(c => {
    if (filterPriority !== 'all' && c.priority !== filterPriority) return false;
    if (filterChannel !== 'all' && !c.channel.includes(filterChannel as Channel)) return false;
    return true;
  });

  const byColumn = (col: KanbanStatus) => filtered.filter(c => c.kanbanStatus === col);

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) { setActiveId(null); return; }

    const overId = over.id as string;
    const colMatch = COLUMNS.find(c => c.id === overId);
    const targetColumn = colMatch ? colMatch.id : campaigns.find(c => c.id === overId)?.kanbanStatus;

    if (targetColumn) {
      setCampaigns(prev => prev.map(c =>
        c.id === active.id ? { ...c, kanbanStatus: targetColumn } : c
      ));
    }
    setActiveId(null);
  };

  const handleAddCard = (data: Partial<Campaign>) => {
    const newCard: Campaign = {
      id: `camp-${Date.now()}`,
      name: data.name ?? 'Nova campanha',
      channel: data.channel ?? ['Instagram'],
      status: 'Rascunho',
      kanbanStatus: newCardColumn ?? 'ideia',
      priority: data.priority ?? 'Média',
      category: data.category ?? 'Awareness',
      responsible: data.responsible ?? 'Time Marketing',
      avatar: data.avatar ?? 'TM',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      budget: 0,
      funnel: 'Topo',
      objective: '',
      audience: '',
      description: '',
      subtasks: [],
      links: [],
      history: [{ date: new Date().toISOString(), action: 'Card criado', user: data.responsible ?? 'Time Marketing' }],
    };
    setCampaigns(prev => [...prev, newCard]);
  };

  const activeCampaign = campaigns.find(c => c.id === activeId);

  return (
    <div className="flex flex-col gap-4 animate-fade-in h-full">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Filtrar:</span>
        {['all', 'Alta', 'Média', 'Baixa'].map(p => (
          <button
            key={p}
            onClick={() => setFilterPriority(p)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-all',
              filterPriority === p
                ? 'border-primary bg-primary/20 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/40'
            )}
          >
            {p === 'all' ? 'Todas prioridades' : p}
          </button>
        ))}
        <span className="text-muted-foreground">|</span>
        {['all', 'Instagram', 'TikTok', 'Meta Ads', 'LinkedIn'].map(ch => (
          <button
            key={ch}
            onClick={() => setFilterChannel(ch)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-all',
              filterChannel === ch
                ? 'border-primary bg-primary/20 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/40'
            )}
          >
            {ch === 'all' ? 'Todos canais' : `${CHANNEL_ICON[ch]} ${ch}`}
          </button>
        ))}
        {(filterPriority !== 'all' || filterChannel !== 'all') && (
          <button onClick={() => { setFilterPriority('all'); setFilterChannel('all'); }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <X className="h-3 w-3" /> Limpar
          </button>
        )}
      </div>

      {/* Board */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
          {COLUMNS.map(col => {
            const cards = byColumn(col.id);
            const overloaded = cards.length >= 5;
            return (
              <div key={col.id} className="flex w-72 shrink-0 flex-col gap-2">
                {/* Column header */}
                <div className={cn('rounded-xl border-t-2 border border-border bg-card/50 p-3', col.color)}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground">{col.label}</h3>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-bold',
                        overloaded ? 'bg-red-500/20 text-red-400' : 'bg-muted text-muted-foreground'
                      )}>
                        {cards.length}
                      </span>
                      <button
                        onClick={() => setNewCardColumn(col.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/20 hover:text-primary"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Drop zone */}
                <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                  <div
                    className="flex flex-col gap-2 min-h-[200px] rounded-xl border-2 border-dashed border-transparent transition-colors"
                    data-column={col.id}
                  >
                    {cards.map(card => (
                      <KanbanCard key={card.id} campaign={card} />
                    ))}
                    {cards.length === 0 && (
                      <div className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-border text-xs text-muted-foreground">
                        Arraste aqui
                      </div>
                    )}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeCampaign && <KanbanCard campaign={activeCampaign} isDragging />}
        </DragOverlay>
      </DndContext>

      {newCardColumn && (
        <NewCardModal
          open={!!newCardColumn}
          onClose={() => setNewCardColumn(null)}
          columnId={newCardColumn}
          onSave={handleAddCard}
        />
      )}
    </div>
  );
}
