import { useState, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { initialCampaigns, Campaign, KanbanStatus, Channel, Priority, ContentObjective } from '@/data/seedData';
import {
  DndContext, DragEndEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors, DragOverlay, closestCorners
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Plus, GripVertical, X, Edit2, Trash2, MessageSquare, Calendar,
  AlertCircle, CheckSquare, Square, Clock, Send, ChevronRight,
  Target, Flame, BarChart2, Filter, Users, ExternalLink, Link2, FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Team ─────────────────────────────────────────────────────────────────────

const TEAM = [
  {
    id: 'gabriel',
    name: 'Gabriel',
    role: 'Estrategista · Head Comunicação',
    initials: 'GA',
    color: 'bg-blue-500',
    ring: 'ring-blue-500',
    text: 'text-blue-400',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/30',
  },
  {
    id: 'guilherme',
    name: 'Guilherme',
    role: 'Diretor Criativo',
    initials: 'GU',
    color: 'bg-primary',
    ring: 'ring-primary',
    text: 'text-primary',
    bg: 'bg-primary/15',
    border: 'border-primary/30',
  },
] as const;

type TeamMemberId = typeof TEAM[number]['id'];

function getTeamMember(responsible: string) {
  const lower = responsible.toLowerCase();
  if (lower.includes('gabriel')) return TEAM[0];
  if (lower.includes('guilherme')) return TEAM[1];
  return null;
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const COLUMNS: { id: KanbanStatus; label: string; accent: string; dot: string }[] = [
  { id: 'ideia',         label: 'Ideias',           accent: 'border-t-muted-foreground/40', dot: 'bg-muted-foreground' },
  { id: 'desenvolvimento', label: 'Em Produção',    accent: 'border-t-blue-500',            dot: 'bg-blue-500' },
  { id: 'revisao',       label: 'Revisão',           accent: 'border-t-amber-500',           dot: 'bg-amber-500' },
  { id: 'aprovado',      label: 'Aprovado',          accent: 'border-t-teal',                dot: 'bg-teal' },
  { id: 'publicado',     label: 'Publicado ✓',       accent: 'border-t-green-500',           dot: 'bg-green-500' },
];

const PRIORITY_STYLE: Record<Priority, { badge: string; icon: string }> = {
  Alta:  { badge: 'bg-red-500/15 text-red-400 border-red-500/25',     icon: '🔴' },
  Média: { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/25', icon: '🟡' },
  Baixa: { badge: 'bg-muted/50 text-muted-foreground border-border',   icon: '🟢' },
};

const CHANNEL_ICON: Record<string, string> = {
  Instagram: '📸', TikTok: '🎵', 'Meta Ads': '📊',
  LinkedIn: '💼', 'Google Ads': '🔍', Orgânico: '🌱', YouTube: '▶️',
};

// ─── Deadline helpers ─────────────────────────────────────────────────────────

function getDaysLeft(dateStr?: string): number | null {
  if (!dateStr) return null;
  return Math.round((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function DeadlineBadge({ dateStr }: { dateStr?: string }) {
  const days = getDaysLeft(dateStr);
  if (days === null) return null;
  const overdue = days < 0;
  const urgent = days >= 0 && days <= 3;
  return (
    <div className={cn(
      'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
      overdue ? 'bg-red-500/20 text-red-400' :
      urgent  ? 'bg-amber-500/20 text-amber-400' :
                'bg-muted/50 text-muted-foreground'
    )}>
      {overdue ? <AlertCircle className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
      {overdue ? `${Math.abs(days)}d atrasado` : days === 0 ? 'Hoje' : `${days}d`}
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function TeamAvatar({ responsible, size = 'sm' }: { responsible: string; size?: 'sm' | 'md' }) {
  const member = getTeamMember(responsible);
  const sz = size === 'sm' ? 'h-5 w-5 text-[9px]' : 'h-7 w-7 text-[11px]';
  if (member) {
    return (
      <div className={cn('flex items-center justify-center rounded-full font-bold text-white ring-1 ring-offset-1 ring-offset-card shrink-0', sz, member.color, member.ring)}>
        {member.initials}
      </div>
    );
  }
  const initials = responsible.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';
  return (
    <div className={cn('flex items-center justify-center rounded-full bg-muted text-muted-foreground font-bold shrink-0', sz)}>
      {initials}
    </div>
  );
}

// ─── Comment type ─────────────────────────────────────────────────────────────

interface Comment {
  id: string;
  author: string;
  text: string;
  date: string;
}

// We store comments in the history array with a "💬" prefix to distinguish them
function parseComment(h: { date: string; action: string; user: string }): Comment | null {
  if (!h.action.startsWith('💬')) return null;
  return { id: h.date, author: h.user, text: h.action.slice(2).trim(), date: h.date };
}

// ─── Kanban Card ──────────────────────────────────────────────────────────────

function KanbanCard({
  campaign, isDragging, onClick, onDelete,
}: {
  campaign: Campaign;
  isDragging?: boolean;
  onClick?: () => void;
  onDelete?: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSorting } = useSortable({ id: campaign.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isSorting ? 0.4 : 1 };
  const member = getTeamMember(campaign.responsible);
  const daysLeft = getDaysLeft(campaign.endDate);
  const isOverdue = daysLeft !== null && daysLeft < 0;
  const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;
  const commentCount = campaign.history.filter(h => h.action.startsWith('💬')).length;
  const doneSubtasks = campaign.subtasks.filter(s => s.done).length;
  const totalSubtasks = campaign.subtasks.length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={cn(
        'group relative rounded-xl border border-border bg-card p-3 shadow-sm cursor-pointer',
        'transition-all duration-150 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5',
        isDragging && 'shadow-xl border-primary/50 rotate-1 scale-105',
        isOverdue && 'border-red-500/30',
        isUrgent && !isOverdue && 'border-amber-500/25',
      )}
    >
      {/* Grip + title row */}
      <div className="flex items-start gap-2">
        <button
          {...attributes} {...listeners}
          onClick={e => e.stopPropagation()}
          className="mt-0.5 cursor-grab touch-none text-muted-foreground opacity-0 transition-opacity group-hover:opacity-60 active:cursor-grabbing shrink-0"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold leading-snug text-foreground line-clamp-2">{campaign.name}</p>

          {/* Channels */}
          {campaign.channel.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {campaign.channel.slice(0, 2).map(ch => (
                <span key={ch} className="text-[10px] text-muted-foreground/70">{CHANNEL_ICON[ch]} {ch}</span>
              ))}
              {campaign.channel.length > 2 && <span className="text-[10px] text-muted-foreground/50">+{campaign.channel.length - 2}</span>}
            </div>
          )}

          {/* Badges */}
          <div className="mt-2 flex flex-wrap gap-1">
            <span className={cn('rounded-full border px-1.5 py-0.5 text-[9px] font-bold', PRIORITY_STYLE[campaign.priority].badge)}>
              {PRIORITY_STYLE[campaign.priority].icon} {campaign.priority}
            </span>
            <DeadlineBadge dateStr={campaign.endDate} />
          </div>

          {/* Footer: avatar + meta */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <TeamAvatar responsible={campaign.responsible} size="sm" />
              <span className={cn('text-[9px] font-semibold', member ? member.text : 'text-muted-foreground')}>
                {campaign.responsible.split(' ')[0]}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground/50">
              {totalSubtasks > 0 && (
                <span className="flex items-center gap-0.5 text-[9px]">
                  <CheckSquare className="h-2.5 w-2.5" /> {doneSubtasks}/{totalSubtasks}
                </span>
              )}
              {commentCount > 0 && (
                <span className="flex items-center gap-0.5 text-[9px]">
                  <MessageSquare className="h-2.5 w-2.5" /> {commentCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Delete on hover */}
        <button
          onClick={e => { e.stopPropagation(); onDelete?.(campaign.id); }}
          className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Detail Side Panel ────────────────────────────────────────────────────────

function DetailPanel({
  campaign,
  onClose,
  onSave,
}: {
  campaign: Campaign;
  onClose: () => void;
  onSave: (c: Campaign) => void;
}) {
  const [localCampaign, setLocalCampaign] = useState<Campaign>(campaign);
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState<TeamMemberId>('gabriel');
  const [editingSubtask, setEditingSubtask] = useState('');
  const [driveLink, setDriveLink] = useState(campaign.links?.find(l => l.label === 'drive')?.url || '');
  const [editingDrive, setEditingDrive] = useState(false);

  const member = getTeamMember(localCampaign.responsible);
  const comments = localCampaign.history.filter(h => h.action.startsWith('💬'));
  const activity = localCampaign.history.filter(h => !h.action.startsWith('💬'));
  const doneSubtasks = localCampaign.subtasks.filter(s => s.done).length;

  const addComment = () => {
    if (!commentText.trim()) return;
    const entry = { date: new Date().toISOString(), action: `💬 ${commentText.trim()}`, user: TEAM.find(t => t.id === commentAuthor)?.name || commentAuthor };
    const updated = { ...localCampaign, history: [...localCampaign.history, entry] };
    setLocalCampaign(updated);
    onSave(updated);
    setCommentText('');
  };

  const toggleSubtask = (id: string) => {
    const updated = {
      ...localCampaign,
      subtasks: localCampaign.subtasks.map(s => s.id === id ? { ...s, done: !s.done } : s),
    };
    setLocalCampaign(updated);
    onSave(updated);
  };

  const addSubtask = () => {
    if (!editingSubtask.trim()) return;
    const updated = {
      ...localCampaign,
      subtasks: [...localCampaign.subtasks, { id: `st-${Date.now()}`, title: editingSubtask.trim(), done: false }],
    };
    setLocalCampaign(updated);
    onSave(updated);
    setEditingSubtask('');
  };

  const moveToColumn = (col: KanbanStatus) => {
    const entry = { date: new Date().toISOString(), action: `Movido para "${COLUMNS.find(c => c.id === col)?.label}"`, user: 'Sistema' };
    const updated = { ...localCampaign, kanbanStatus: col, history: [...localCampaign.history, entry] };
    setLocalCampaign(updated);
    onSave(updated);
  };

  const saveDriveLink = (url: string) => {
    const otherLinks = (localCampaign.links || []).filter(l => l.label !== 'drive');
    const newLinks = url.trim() ? [...otherLinks, { label: 'drive', url: url.trim() }] : otherLinks;
    const updated = { ...localCampaign, links: newLinks };
    setLocalCampaign(updated);
    onSave(updated);
    setEditingDrive(false);
  };

  const assignTo = (name: string) => {
    const updated = { ...localCampaign, responsible: name };
    setLocalCampaign(updated);
    onSave(updated);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex flex-col w-[420px] max-w-full bg-card border-l border-border shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 border-b border-border">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('h-2 w-2 rounded-full', COLUMNS.find(c => c.id === localCampaign.kanbanStatus)?.dot || 'bg-muted-foreground')} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {COLUMNS.find(c => c.id === localCampaign.kanbanStatus)?.label}
            </span>
          </div>
          <h2 className="text-sm font-black text-foreground leading-snug">{localCampaign.name}</h2>
          {localCampaign.objective && (
            <p className="text-[11px] text-muted-foreground mt-1 leading-snug line-clamp-2">{localCampaign.objective}</p>
          )}
        </div>
        <button onClick={onClose} className="shrink-0 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Meta row */}
        <div className="p-4 space-y-4 border-b border-border">
          {/* Assign */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">Responsável</p>
            <div className="flex gap-2">
              {TEAM.map(t => (
                <button
                  key={t.id}
                  onClick={() => assignTo(t.name)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all flex-1',
                    localCampaign.responsible.toLowerCase().includes(t.id)
                      ? `${t.bg} ${t.border} ${t.text} ring-1 ${t.ring}`
                      : 'border-border text-muted-foreground hover:border-primary/30'
                  )}
                >
                  <div className={cn('h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black text-white', t.color)}>{t.initials}</div>
                  <div className="text-left">
                    <p className="font-bold leading-none">{t.name}</p>
                    <p className="text-[9px] opacity-60 mt-0.5">{t.role.split('·')[0].trim()}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Move column */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">Mover para</p>
            <div className="flex flex-wrap gap-1.5">
              {COLUMNS.map(col => (
                <button
                  key={col.id}
                  onClick={() => moveToColumn(col.id)}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-all',
                    localCampaign.kanbanStatus === col.id
                      ? 'bg-primary/20 text-primary border-primary/40'
                      : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  )}
                >
                  {col.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority + Deadline */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1.5">Prioridade</p>
              <span className={cn('inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-bold gap-1', PRIORITY_STYLE[localCampaign.priority].badge)}>
                {PRIORITY_STYLE[localCampaign.priority].icon} {localCampaign.priority}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1.5">Prazo</p>
              {localCampaign.endDate ? (
                <div className="flex items-center gap-1.5">
                  <DeadlineBadge dateStr={localCampaign.endDate} />
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(localCampaign.endDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              ) : <span className="text-[11px] text-muted-foreground/40">Sem prazo</span>}
            </div>
          </div>

          {/* Channels */}
          {localCampaign.channel.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1.5">Canais</p>
              <div className="flex flex-wrap gap-1">
                {localCampaign.channel.map(ch => (
                  <span key={ch} className="rounded-lg bg-muted/50 border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{CHANNEL_ICON[ch]} {ch}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Google Drive link ── */}
        <div className="px-4 py-3 border-b border-border">
          {driveLink && !editingDrive ? (
            <a
              href={driveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-xl border border-border bg-gradient-to-r from-muted/40 to-muted/20 px-4 py-3 hover:border-primary/30 hover:from-primary/8 hover:to-transparent transition-all duration-200"
              onClick={e => e.stopPropagation()}
            >
              {/* Google Drive icon */}
              <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-card border border-border shadow-sm">
                <svg viewBox="0 0 87.3 78" className="h-5 w-5">
                  <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53.5H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                  <path d="M43.65 25L29.9 1.4C28.55.6 27 .2 25.45.2c-1.55 0-3.1.4-4.45 1.2L6.6 25H43.65z" fill="#00ac47"/>
                  <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H60.2l5.5 9.9z" fill="#ea4335"/>
                  <path d="M43.65 25L57.4 1.4C56.05.6 54.5.2 52.95.2H34.35c-1.55 0-3.1.4-4.45 1.2z" fill="#00832d"/>
                  <path d="M60.2 53.5H27.5L13.75 76.8c1.35.8 2.9 1.2 4.45 1.2h50.9c1.55 0 3.1-.4 4.45-1.2z" fill="#2684fc"/>
                  <path d="M73.4 26.5l-14.45-25c-1.35-.8-2.9-1.3-4.45-1.3H34.35c-1.55 0-3.1.4-4.45 1.2L43.65 25h26.6l3.15-1.5z" fill="#ffba00"/>
                  <path d="M43.65 25H17.05L6.6 25l17.25 28.5H60.2L43.65 25z" fill="#fff" opacity=".1"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-0.5">Criativo · Google Drive</p>
                <p className="text-xs font-semibold text-foreground/80 truncate group-hover:text-primary transition-colors">
                  {driveLink.replace(/^https?:\/\/(drive\.google\.com)?/, '').slice(0, 40) || driveLink}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={e => { e.preventDefault(); e.stopPropagation(); setEditingDrive(true); }}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
              </div>
            </a>
          ) : editingDrive ? (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Link do criativo (Google Drive)</p>
              <div className="flex gap-2">
                <Input
                  autoFocus
                  placeholder="https://drive.google.com/..."
                  value={driveLink}
                  onChange={e => setDriveLink(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveDriveLink(driveLink); if (e.key === 'Escape') setEditingDrive(false); }}
                  className="h-8 text-xs bg-muted/20 border-border/60 flex-1"
                />
                <Button size="sm" onClick={() => saveDriveLink(driveLink)} className="h-8 px-3 bg-primary/90 text-primary-foreground border-0 text-xs">Salvar</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingDrive(false)} className="h-8 px-2"><X className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setEditingDrive(true)}
              className="group flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-border/50 px-4 py-3 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/40 border border-border group-hover:bg-primary/10 group-hover:border-primary/30 transition-all">
                <FolderOpen className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Adicionar link do criativo</p>
                <p className="text-[10px] text-muted-foreground/50">Google Drive · Pasta ou arquivo</p>
              </div>
              <Link2 className="ml-auto h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary/60 transition-colors" />
            </button>
          )}
        </div>

        {/* Subtasks */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Tarefas {localCampaign.subtasks.length > 0 && `(${doneSubtasks}/${localCampaign.subtasks.length})`}
            </p>
          </div>
          {localCampaign.subtasks.length > 0 && (
            <div className="mb-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${localCampaign.subtasks.length ? (doneSubtasks / localCampaign.subtasks.length) * 100 : 0}%` }}
              />
            </div>
          )}
          <div className="space-y-1">
            {localCampaign.subtasks.map(st => (
              <button
                key={st.id}
                onClick={() => toggleSubtask(st.id)}
                className="flex items-center gap-2 w-full text-left rounded-lg px-2 py-1.5 hover:bg-muted/40 transition-colors group"
              >
                {st.done
                  ? <CheckSquare className="h-3.5 w-3.5 text-primary shrink-0" />
                  : <Square className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0" />
                }
                <span className={cn('text-xs', st.done ? 'line-through text-muted-foreground/40' : 'text-foreground/85')}>{st.title}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 mt-2">
            <Input
              placeholder="+ Nova subtarefa"
              value={editingSubtask}
              onChange={e => setEditingSubtask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSubtask()}
              className="h-7 text-xs bg-muted/20 border-border/60"
            />
            <Button size="sm" variant="ghost" onClick={addSubtask} className="h-7 px-2 text-xs">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Comments */}
        <div className="p-4 border-b border-border">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-3">
            Comentários {comments.length > 0 && `(${comments.length})`}
          </p>
          <div className="space-y-3 mb-3">
            {comments.length === 0 && (
              <p className="text-[11px] text-muted-foreground/40 text-center py-2">Nenhum comentário ainda</p>
            )}
            {comments.map(c => {
              const cMember = getTeamMember(c.user);
              return (
                <div key={c.date} className="flex gap-2">
                  <TeamAvatar responsible={c.user} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className={cn('text-[10px] font-bold', cMember ? cMember.text : 'text-foreground')}>{c.user}</span>
                      <span className="text-[9px] text-muted-foreground/40">
                        {new Date(c.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} {new Date(c.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-foreground/80 leading-snug mt-0.5 bg-muted/30 rounded-lg px-2.5 py-1.5">
                      {c.action.slice(2).trim()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comment input */}
          <div className="space-y-2">
            <div className="flex gap-1">
              {TEAM.map(t => (
                <button
                  key={t.id}
                  onClick={() => setCommentAuthor(t.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold transition-all',
                    commentAuthor === t.id ? `${t.bg} ${t.border} ${t.text}` : 'border-border text-muted-foreground hover:border-primary/30'
                  )}
                >
                  <div className={cn('h-3.5 w-3.5 rounded-full flex items-center justify-center text-[7px] font-black text-white', t.color)}>{t.initials[0]}</div>
                  {t.name}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <Textarea
                placeholder="Adicionar comentário..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                rows={2}
                className="text-xs bg-muted/20 border-border/60 resize-none"
                onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) addComment(); }}
              />
              <Button size="sm" onClick={addComment} className="self-end bg-primary/90 text-primary-foreground border-0 px-2">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Activity log */}
        {activity.length > 0 && (
          <div className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-3">Histórico</p>
            <div className="space-y-2">
              {[...activity].reverse().slice(0, 8).map((h, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
                  <div>
                    <span className="text-[10px] text-foreground/60">{h.action}</span>
                    <span className="ml-1 text-[9px] text-muted-foreground/40">
                      · {h.user} · {new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── New Card Modal ───────────────────────────────────────────────────────────

function NewCardModal({ open, onClose, columnId, onSave }: {
  open: boolean; onClose: () => void; columnId: KanbanStatus;
  onSave: (data: Partial<Campaign>) => void;
}) {
  const [name, setName] = useState('');
  const [responsible, setResponsible] = useState<TeamMemberId>('gabriel');
  const [priority, setPriority] = useState<Priority>('Média');
  const [endDate, setEndDate] = useState('');
  const [channel, setChannel] = useState('Instagram');

  const handleSave = () => {
    if (!name.trim()) return;
    const member = TEAM.find(t => t.id === responsible)!;
    onSave({ name, channel: [channel as Channel], priority, responsible: member.name, avatar: member.initials, endDate });
    setName(''); setEndDate('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Nova tarefa — <span className="text-primary">{COLUMNS.find(c => c.id === columnId)?.label}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Nome da tarefa *" value={name} onChange={e => setName(e.target.value)} className="bg-muted/20 border-border/60" autoFocus />

          <div>
            <p className="text-[10px] font-bold text-muted-foreground/60 mb-1.5">Responsável</p>
            <div className="flex gap-2">
              {TEAM.map(t => (
                <button
                  key={t.id}
                  onClick={() => setResponsible(t.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl border px-3 py-2 flex-1 text-xs font-semibold transition-all',
                    responsible === t.id ? `${t.bg} ${t.border} ${t.text}` : 'border-border text-muted-foreground hover:border-primary/20'
                  )}
                >
                  <div className={cn('h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-black text-white', t.color)}>{t.initials}</div>
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground/60 mb-1.5">Canal</p>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger className="bg-muted/20 border-border/60 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {Object.keys(CHANNEL_ICON).map(c => <SelectItem key={c} value={c} className="text-xs">{CHANNEL_ICON[c]} {c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground/60 mb-1.5">Prioridade</p>
              <Select value={priority} onValueChange={v => setPriority(v as Priority)}>
                <SelectTrigger className="bg-muted/20 border-border/60 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {(['Alta', 'Média', 'Baixa'] as Priority[]).map(p => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-muted-foreground/60 mb-1.5">Prazo</p>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-muted/20 border-border/60 h-8 text-xs" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={handleSave} className="bg-primary text-primary-foreground border-0">Criar tarefa</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Kanban ─────────────────────────────────────────────────────────────

export default function Kanban() {
  const [campaigns, setCampaigns] = useLocalStorage<Campaign[]>('dqef-campaigns', initialCampaigns);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newCardColumn, setNewCardColumn] = useState<KanbanStatus | null>(null);
  const [filterMember, setFilterMember] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const filtered = useMemo(() => campaigns.filter(c => {
    if (filterMember !== 'all' && !c.responsible.toLowerCase().includes(filterMember)) return false;
    if (filterPriority !== 'all' && c.priority !== filterPriority) return false;
    return true;
  }), [campaigns, filterMember, filterPriority]);

  const byColumn = (col: KanbanStatus) => filtered.filter(c => c.kanbanStatus === col);

  // Team stats
  const teamStats = useMemo(() => TEAM.map(t => {
    const tasks = campaigns.filter(c => c.responsible.toLowerCase().includes(t.id));
    const overdue = tasks.filter(c => getDaysLeft(c.endDate) !== null && getDaysLeft(c.endDate)! < 0).length;
    const done = tasks.filter(c => c.kanbanStatus === 'publicado').length;
    return { ...t, total: tasks.length, overdue, done };
  }), [campaigns]);

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const overId = over.id as string;
    const colMatch = COLUMNS.find(c => c.id === overId);
    const targetColumn = colMatch ? colMatch.id : campaigns.find(c => c.id === overId)?.kanbanStatus;
    if (targetColumn) {
      setCampaigns(prev => prev.map(c =>
        c.id === active.id ? {
          ...c, kanbanStatus: targetColumn,
          history: [...(c.history || []), { date: new Date().toISOString(), action: `Movido para "${COLUMNS.find(col => col.id === targetColumn)?.label}"`, user: c.responsible }]
        } : c
      ));
    }
  };

  const handleAddCard = (data: Partial<Campaign>) => {
    const newCard: Campaign = {
      id: `camp-${Date.now()}`,
      name: data.name ?? 'Nova tarefa',
      channel: data.channel ?? ['Instagram'],
      status: 'Rascunho',
      kanbanStatus: newCardColumn ?? 'ideia',
      priority: data.priority ?? 'Média',
      category: 'Awareness' as ContentObjective,
      responsible: data.responsible ?? 'Gabriel',
      avatar: data.avatar ?? 'GA',
      startDate: new Date().toISOString().split('T')[0],
      endDate: data.endDate ?? '',
      budget: 0, funnel: 'Topo',
      objective: '', audience: '', description: '',
      subtasks: [], links: [],
      history: [{ date: new Date().toISOString(), action: 'Tarefa criada', user: data.responsible ?? 'Gabriel' }],
    };
    setCampaigns(prev => [...prev, newCard]);
  };

  const handleSaveCard = (updated: Campaign) => {
    setCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleDelete = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const activeCampaign = campaigns.find(c => c.id === activeId);
  const selectedCampaign = campaigns.find(c => c.id === selectedId);

  // Total stats
  const totalOverdue = campaigns.filter(c => getDaysLeft(c.endDate) !== null && getDaysLeft(c.endDate)! < 0 && c.kanbanStatus !== 'publicado').length;
  const totalUrgent  = campaigns.filter(c => { const d = getDaysLeft(c.endDate); return d !== null && d >= 0 && d <= 3 && c.kanbanStatus !== 'publicado'; }).length;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300 h-full">

      {/* ── Team header ────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 flex-wrap">
        {teamStats.map(t => (
          <div
            key={t.id}
            onClick={() => setFilterMember(filterMember === t.id ? 'all' : t.id)}
            className={cn(
              'flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all',
              filterMember === t.id ? `${t.bg} ${t.border}` : 'border-border bg-card hover:border-primary/20'
            )}
          >
            <div className={cn('h-9 w-9 rounded-full flex items-center justify-center font-black text-sm text-white ring-2 ring-offset-2 ring-offset-card', t.color, filterMember === t.id ? t.ring : 'ring-transparent')}>
              {t.initials}
            </div>
            <div>
              <p className={cn('text-sm font-black', filterMember === t.id ? t.text : 'text-foreground')}>{t.name}</p>
              <p className="text-[10px] text-muted-foreground">{t.role}</p>
            </div>
            <div className="ml-2 flex gap-2 text-center">
              <div>
                <p className="text-lg font-black text-foreground leading-none">{t.total}</p>
                <p className="text-[9px] text-muted-foreground/60">tarefas</p>
              </div>
              {t.overdue > 0 && (
                <div>
                  <p className="text-lg font-black text-red-400 leading-none">{t.overdue}</p>
                  <p className="text-[9px] text-muted-foreground/60">atrasadas</p>
                </div>
              )}
              <div>
                <p className="text-lg font-black text-green-400 leading-none">{t.done}</p>
                <p className="text-[9px] text-muted-foreground/60">feitas</p>
              </div>
            </div>
          </div>
        ))}

        {/* Urgency alerts */}
        <div className="ml-auto flex flex-col gap-1.5">
          {totalOverdue > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-400">
              <AlertCircle className="h-3.5 w-3.5" /> {totalOverdue} atrasada{totalOverdue > 1 ? 's' : ''}
            </div>
          )}
          {totalUrgent > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-400">
              <Clock className="h-3.5 w-3.5" /> {totalUrgent} urgente{totalUrgent > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-muted-foreground/60" />
        {(['all', 'Alta', 'Média', 'Baixa'] as const).map(p => (
          <button
            key={p}
            onClick={() => setFilterPriority(p)}
            className={cn(
              'rounded-full border px-3 py-1 text-[11px] font-semibold transition-all',
              filterPriority === p
                ? 'bg-primary/20 text-primary border-primary/30'
                : 'border-border text-muted-foreground hover:border-primary/30'
            )}
          >
            {p === 'all' ? 'Todas' : `${PRIORITY_STYLE[p].icon} ${p}`}
          </button>
        ))}
        {(filterPriority !== 'all' || filterMember !== 'all') && (
          <button
            onClick={() => { setFilterPriority('all'); setFilterMember('all'); }}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" /> Limpar
          </button>
        )}
        <span className="ml-auto text-[11px] text-muted-foreground/50">
          {filtered.length} tarefa{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Board ─────────────────────────────────────────────────────────── */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {COLUMNS.map(col => {
            const cards = byColumn(col.id);
            const overloaded = cards.length >= 5;
            const overdueInCol = cards.filter(c => getDaysLeft(c.endDate) !== null && getDaysLeft(c.endDate)! < 0).length;

            return (
              <div key={col.id} className="flex w-64 shrink-0 flex-col gap-2">
                {/* Column header */}
                <div className={cn('rounded-xl border-t-2 border border-border bg-card/60 px-3 py-2.5', col.accent)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-black text-foreground">{col.label}</h3>
                      {overdueInCol > 0 && (
                        <span className="rounded-full bg-red-500/15 px-1.5 py-0.5 text-[9px] font-bold text-red-400">
                          {overdueInCol}⚠
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                        overloaded ? 'bg-amber-500/20 text-amber-400' : 'bg-muted text-muted-foreground'
                      )}>
                        {cards.length}
                      </span>
                      <button
                        onClick={() => setNewCardColumn(col.id)}
                        className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Column progress bar */}
                  {col.id !== 'ideia' && (
                    <div className="mt-2 h-0.5 rounded-full bg-muted/50 overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', col.dot)} style={{
                        width: campaigns.length ? `${(campaigns.filter(c => {
                          const idx = COLUMNS.findIndex(cl => cl.id === col.id);
                          return COLUMNS.findIndex(cl => cl.id === c.kanbanStatus) >= idx;
                        }).length / campaigns.length) * 100}%` : '0%'
                      }} />
                    </div>
                  )}
                </div>

                {/* Drop zone */}
                <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-2 min-h-[120px] rounded-xl border-2 border-dashed border-transparent transition-colors">
                    {cards.map(card => (
                      <KanbanCard
                        key={card.id}
                        campaign={card}
                        onClick={() => setSelectedId(card.id)}
                        onDelete={handleDelete}
                      />
                    ))}
                    {cards.length === 0 && (
                      <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-border/40 text-[10px] text-muted-foreground/30">
                        Solte aqui
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

      {/* ── New card modal ─────────────────────────────────────────────────── */}
      {newCardColumn && (
        <NewCardModal
          open={!!newCardColumn}
          onClose={() => setNewCardColumn(null)}
          columnId={newCardColumn}
          onSave={handleAddCard}
        />
      )}

      {/* ── Detail panel overlay ───────────────────────────────────────────── */}
      {selectedCampaign && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelectedId(null)}
          />
          <DetailPanel
            campaign={selectedCampaign}
            onClose={() => setSelectedId(null)}
            onSave={handleSaveCard}
          />
        </>
      )}
    </div>
  );
}
