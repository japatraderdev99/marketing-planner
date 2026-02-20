import { useState } from 'react';
import { initialEstrategias, initialCampaigns, initialContents } from '@/data/seedData';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Campaign, ContentItem } from '@/data/seedData';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles, Zap, DollarSign, Heart, Clock, Smile,
  Instagram, Youtube, Copy, Check, RefreshCw,
  ChevronDown, ChevronUp, BarChart3, TrendingUp, Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// ─── Constants ────────────────────────────────────────────────────────────────

const ANGLES = [
  { id: 'Raiva', label: 'Raiva', icon: Zap, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', desc: 'Expõe injustiças das plataformas' },
  { id: 'Dinheiro', label: 'Dinheiro', icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10 border-primary/30', desc: 'Números que doem e revelam' },
  { id: 'Orgulho', label: 'Orgulho', icon: Heart, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30', desc: 'Valoriza o ofício do prestador' },
  { id: 'Urgência', label: 'Urgência', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', desc: 'Janela de oportunidade agora' },
  { id: 'Alívio', label: 'Alívio', icon: Smile, color: 'text-teal', bg: 'bg-teal/10 border-teal/30', desc: 'PIX na hora, controle total' },
];

const CHANNELS = [
  { id: 'Instagram Feed', label: 'Instagram', sub: 'Feed', icon: Instagram },
  { id: 'Instagram Stories', label: 'Instagram', sub: 'Stories', icon: Instagram },
  { id: 'TikTok', label: 'TikTok', sub: '', icon: null },
  { id: 'YouTube', label: 'YouTube', sub: '', icon: Youtube },
  { id: 'WhatsApp', label: 'WhatsApp', sub: '', icon: null },
  { id: 'LinkedIn', label: 'LinkedIn', sub: '', icon: null },
];

const FORMATS = ['Carrossel Tipográfico', 'Carrossel Visual', 'Storytelling', 'Educativo / How-to', 'Comparativo', 'Dados / Infográfico'];

const OBJECTIVES = ['Awareness', 'Engajamento', 'Conversão', 'Retenção'];

const SLIDE_TYPE_COLORS: Record<string, string> = {
  hook: 'bg-red-500/20 text-red-400 border-red-500/30',
  content: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  data: 'bg-primary/20 text-primary border-primary/30',
  cta: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const SLIDE_TYPE_LABELS: Record<string, string> = {
  hook: 'Gancho',
  content: 'Conteúdo',
  data: 'Dado',
  cta: 'CTA',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Slide {
  number: number;
  type: 'hook' | 'content' | 'data' | 'cta';
  headline: string;
  body?: string;
  visual: string;
}

interface GeneratedCarousel {
  title: string;
  subtitle: string;
  viralLogic: string;
  slides: Slide[];
  caption: string;
  bestTime: string;
  engagementTip: string;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SlideCard({ slide, index }: { slide: Slide; index: number }) {
  const [showVisual, setShowVisual] = useState(false);
  return (
    <div className={cn(
      'rounded-xl border p-4 transition-all duration-200',
      slide.type === 'hook' ? 'border-red-500/20 bg-red-500/5' :
      slide.type === 'cta' ? 'border-green-500/20 bg-green-500/5' :
      slide.type === 'data' ? 'border-primary/20 bg-primary/5' :
      'border-border bg-card'
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black',
          slide.type === 'hook' ? 'bg-red-500/20 text-red-400' :
          slide.type === 'cta' ? 'bg-green-500/20 text-green-400' :
          'bg-primary/20 text-primary'
        )}>
          {slide.number}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', SLIDE_TYPE_COLORS[slide.type] ?? 'bg-muted text-muted-foreground')}>
              {SLIDE_TYPE_LABELS[slide.type] ?? slide.type}
            </span>
          </div>
          <p className="text-sm font-black text-foreground leading-snug">{slide.headline}</p>
          {slide.body && <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{slide.body}</p>}
          <button
            onClick={() => setShowVisual(v => !v)}
            className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
          >
            {showVisual ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Direção visual
          </button>
          {showVisual && (
            <p className="mt-1 text-[11px] text-muted-foreground italic border-l-2 border-primary/30 pl-2">{slide.visual}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PlatformInsights({ campaigns, contents }: { campaigns: Campaign[]; contents: ContentItem[] }) {
  const active = campaigns.filter(c => c.status === 'Ativa').length;
  const published = contents.filter(c => c.status === 'Publicado').length;
  const channelCount: Record<string, number> = {};
  campaigns.forEach(c => c.channel?.forEach(ch => { channelCount[ch] = (channelCount[ch] ?? 0) + 1; }));
  const topChannel = Object.entries(channelCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Instagram';

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-4 w-4 text-primary" />
        <span className="text-xs font-bold text-foreground uppercase tracking-wider">Dados da Plataforma</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-muted/40 p-2 text-center">
          <p className="text-lg font-black text-primary">{active}</p>
          <p className="text-[10px] text-muted-foreground">Campanhas ativas</p>
        </div>
        <div className="rounded-lg bg-muted/40 p-2 text-center">
          <p className="text-lg font-black text-primary">{published}</p>
          <p className="text-[10px] text-muted-foreground">Posts publicados</p>
        </div>
        <div className="rounded-lg bg-muted/40 p-2 text-center">
          <p className="text-xs font-black text-primary truncate">{topChannel}</p>
          <p className="text-[10px] text-muted-foreground">Top canal</p>
        </div>
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground italic">Esses dados são injetados automaticamente no prompt da IA para contextualizar o conteúdo gerado.</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Criativo() {
  const { toast } = useToast();
  const [campaigns] = useLocalStorage<Campaign[]>('dqef-campaigns', initialCampaigns);
  const [contents] = useLocalStorage<ContentItem[]>('dqef-contents', initialContents);

  const [selectedPersona, setSelectedPersona] = useState<string>(initialEstrategias[0].id);
  const [selectedAngle, setSelectedAngle] = useState<string>('Dinheiro');
  const [selectedChannel, setSelectedChannel] = useState<string>('Instagram Feed');
  const [selectedFormat, setSelectedFormat] = useState<string>('Carrossel Tipográfico');
  const [selectedObjective, setSelectedObjective] = useState<string>('Awareness');
  const [additionalContext, setAdditionalContext] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedCarousel | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);

  const persona = initialEstrategias.find(e => e.id === selectedPersona)!;
  const angle = ANGLES.find(a => a.id === selectedAngle)!;

  const activeCampaigns = campaigns.filter(c => c.status === 'Ativa').length;
  const publishedPosts = contents.filter(c => c.status === 'Publicado').length;
  const channelCount: Record<string, number> = {};
  campaigns.forEach(c => c.channel?.forEach(ch => { channelCount[ch] = (channelCount[ch] ?? 0) + 1; }));
  const topChannel = Object.entries(channelCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Instagram';

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-carousel', {
        body: {
          persona: persona.persona,
          angle: selectedAngle,
          channel: selectedChannel,
          format: selectedFormat,
          objective: selectedObjective,
          personaData: {
            profile: persona.profile,
            painPoints: persona.painPoints,
            hooks: persona.hooks,
            approach: persona.approach,
            ageRange: persona.ageRange,
            avgRate: persona.avgRate,
          },
          platformData: { activeCampaigns, publishedPosts, topChannel },
          additionalContext: additionalContext.trim() || undefined,
        },
      });
      if (error) throw error;
      if (data?.carousel) {
        setResult(data.carousel);
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (e: unknown) {
      toast({ title: 'Erro ao gerar conteúdo', description: String(e), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCaption = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.caption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
    toast({ title: 'Caption copiado!', description: 'Cole diretamente na sua rede social.' });
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-black text-foreground">AI Criativo</h2>
          <p className="text-xs text-muted-foreground">Gere roteiros de carrossel com IA + dados reais da plataforma</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.4fr]">
        {/* LEFT — Config Panel */}
        <div className="space-y-4">
          {/* Platform Insights */}
          <PlatformInsights campaigns={campaigns} contents={contents} />

          {/* Persona */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">Persona Alvo</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {initialEstrategias.map(est => (
                <button
                  key={est.id}
                  onClick={() => setSelectedPersona(est.id)}
                  className={cn(
                    'rounded-lg border p-2.5 text-left transition-all duration-200',
                    selectedPersona === est.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  <span className="text-lg">{est.icon}</span>
                  <p className="mt-1 text-xs font-bold text-foreground leading-tight">{est.persona}</p>
                  <p className="text-[10px] text-muted-foreground">{est.ageRange}</p>
                </button>
              ))}
            </div>

            {/* Persona detail */}
            <div className="mt-3 rounded-lg bg-muted/30 p-3 space-y-2">
              <p className="text-[11px] text-muted-foreground leading-relaxed">{persona.profile}</p>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Dores</p>
                {persona.painPoints.slice(0, 3).map((p, i) => (
                  <p key={i} className="text-[11px] text-foreground">• {p}</p>
                ))}
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-2">
                <p className="text-[10px] font-bold text-primary mb-1">Hook recomendado</p>
                <p className="text-[11px] italic text-foreground">"{persona.hooks[0]}"</p>
              </div>
            </div>
          </div>

          {/* Ângulo */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">Ângulo Emocional</span>
            </div>
            <div className="space-y-1.5">
              {ANGLES.map(a => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAngle(a.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all duration-200',
                      selectedAngle === a.id ? a.bg : 'border-border hover:border-primary/30'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', selectedAngle === a.id ? a.color : 'text-muted-foreground')} />
                    <div>
                      <p className={cn('text-xs font-bold', selectedAngle === a.id ? a.color : 'text-foreground')}>{a.label}</p>
                      <p className="text-[10px] text-muted-foreground">{a.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Canal, Formato, Objetivo */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <div>
              <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Canal</p>
              <div className="flex flex-wrap gap-1.5">
                {CHANNELS.map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChannel(ch.id)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                      selectedChannel === ch.id ? 'border-primary bg-primary/20 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'
                    )}
                  >
                    {ch.label}{ch.sub ? ` ${ch.sub}` : ''}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Formato</p>
              <div className="flex flex-wrap gap-1.5">
                {FORMATS.map(f => (
                  <button
                    key={f}
                    onClick={() => setSelectedFormat(f)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                      selectedFormat === f ? 'border-primary bg-primary/20 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Objetivo</p>
              <div className="flex flex-wrap gap-1.5">
                {OBJECTIVES.map(o => (
                  <button
                    key={o}
                    onClick={() => setSelectedObjective(o)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                      selectedObjective === o ? 'border-primary bg-primary/20 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'
                    )}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Context adicional */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Contexto Adicional (opcional)</p>
            <Textarea
              placeholder="Ex: mencionar o verão de Floripa, focar no nicho de piscineiros, incluir dado sobre GetNinjas..."
              value={additionalContext}
              onChange={e => setAdditionalContext(e.target.value)}
              className="min-h-[80px] bg-background border-border text-xs resize-none"
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full gap-2 font-bold"
            size="lg"
          >
            {loading ? (
              <><RefreshCw className="h-4 w-4 animate-spin" /> Gerando roteiro...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Gerar Roteiro com IA</>
            )}
          </Button>
        </div>

        {/* RIGHT — Result Panel */}
        <div className="space-y-4">
          {!result && !loading && (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border text-center p-8">
              <Sparkles className="h-10 w-10 text-muted-foreground/40 mb-4" />
              <p className="text-sm font-bold text-muted-foreground">Seu roteiro aparece aqui</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">Configure a persona, o ângulo e o canal à esquerda, depois clique em gerar.</p>
            </div>
          )}

          {loading && (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl border border-primary/20 bg-primary/5 text-center p-8">
              <RefreshCw className="h-10 w-10 text-primary animate-spin mb-4" />
              <p className="text-sm font-bold text-foreground">Criando roteiro...</p>
              <p className="text-xs text-muted-foreground mt-1">
                IA analisando {persona.persona} × {selectedAngle} × {selectedChannel}
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4 animate-fade-in">
              {/* Header result */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">{persona.icon} {persona.persona}</Badge>
                      <Badge variant="outline" className={cn('text-[10px] border', angle.bg.replace('bg-', 'bg-').replace('/10', '/20'))}>{angle.label}</Badge>
                      <Badge variant="outline" className="text-[10px]">{selectedChannel}</Badge>
                    </div>
                    <h3 className="text-base font-black text-foreground leading-tight">{result.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{result.subtitle}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleGenerate} disabled={loading} className="shrink-0 gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" /> Regerar
                  </Button>
                </div>

                {/* Viral logic */}
                <div className="mt-3 rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-400">Por que vai viralizar</span>
                  </div>
                  <p className="text-xs text-foreground">{result.viralLogic}</p>
                </div>
              </div>

              {/* Slides */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Slides ({result.slides.length})
                  </p>
                  <div className="flex gap-1">
                    {Object.entries(SLIDE_TYPE_LABELS).map(([k, v]) => (
                      <span key={k} className={cn('rounded-full border px-1.5 py-0.5 text-[9px] font-bold', SLIDE_TYPE_COLORS[k])}>
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {result.slides.map((slide, i) => (
                    <SlideCard key={i} slide={slide} index={i} />
                  ))}
                </div>
              </div>

              {/* Caption */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wider">Caption</p>
                  <Button size="sm" variant="ghost" onClick={handleCopyCaption} className={cn('h-7 gap-1.5 text-xs', copiedCaption ? 'text-green-400' : 'text-muted-foreground')}>
                    {copiedCaption ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedCaption ? 'Copiado!' : 'Copiar'}
                  </Button>
                </div>
                <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-sans leading-relaxed">{result.caption}</pre>
              </div>

              {/* Tips */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">⏰ Melhor horário</p>
                  <p className="text-xs text-foreground">{result.bestTime}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">💡 Dica de engajamento</p>
                  <p className="text-xs text-foreground">{result.engagementTip}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
