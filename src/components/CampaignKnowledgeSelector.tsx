import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { initialCampaigns, Campaign } from '@/data/seedData';
import { Megaphone, ChevronDown, X, Target, Users, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  onContextChange: (context: string) => void;
  className?: string;
}

export default function CampaignKnowledgeSelector({ onContextChange, className }: Props) {
  const [campaigns] = useLocalStorage<Campaign[]>('dqef-campaigns', initialCampaigns);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const activeCampaigns = campaigns.filter(c => c.status === 'Ativa' || c.status === 'Aprovada');
  const selected = campaigns.find(c => c.id === selectedId);

  useEffect(() => {
    if (!selected) {
      onContextChange('');
      return;
    }
    const parts = [
      `🎯 CAMPANHA BASE: ${selected.name}`,
      selected.objective && `📋 OBJETIVO: ${selected.objective}`,
      selected.audience && `👥 PÚBLICO: ${selected.audience}`,
      selected.description && `📝 DESCRIÇÃO: ${selected.description}`,
      selected.funnel && `🔄 FUNIL: ${selected.funnel}`,
      selected.channel?.length && `📢 CANAIS: ${selected.channel.join(', ')}`,
      selected.cta && `🔗 CTA: ${selected.cta}`,
      selected.hook && `🪝 HOOK: ${selected.hook}`,
      selected.caption && `💬 CAPTION: ${selected.caption}`,
      selected.priority && `⚡ PRIORIDADE: ${selected.priority}`,
    ].filter(Boolean).join('\n');
    onContextChange(parts);
  }, [selectedId]);

  return (
    <div className={cn('rounded-xl border border-border bg-card', className)}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-muted/30 transition-colors rounded-xl"
      >
        <Megaphone className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground uppercase tracking-wider">
            Campanha como Base
          </p>
          {selected ? (
            <p className="text-[11px] text-primary truncate">{selected.name}</p>
          ) : (
            <p className="text-[10px] text-muted-foreground">Selecionar campanha para enriquecer o prompt</p>
          )}
        </div>
        {selected ? (
          <button
            onClick={e => { e.stopPropagation(); setSelectedId(null); }}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        ) : (
          <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
        )}
      </button>

      {open && (
        <div className="border-t border-border px-3 py-2 space-y-1 max-h-48 overflow-y-auto">
          {activeCampaigns.length === 0 && (
            <p className="text-[11px] text-muted-foreground/50 text-center py-3">Nenhuma campanha ativa/aprovada</p>
          )}
          {activeCampaigns.map(c => (
            <button
              key={c.id}
              onClick={() => { setSelectedId(c.id); setOpen(false); }}
              className={cn(
                'flex items-start gap-2 w-full rounded-lg border px-3 py-2 text-left transition-all',
                selectedId === c.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border/50 hover:border-primary/30 hover:bg-muted/30'
              )}
            >
              <Target className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{c.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {c.channel?.slice(0, 2).map(ch => (
                    <span key={ch} className="text-[9px] text-muted-foreground">{ch}</span>
                  ))}
                  {c.funnel && <span className="text-[9px] text-muted-foreground/50">· {c.funnel}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
