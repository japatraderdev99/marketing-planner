import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { initialEstrategias, initialCampaigns, initialContents } from '@/data/seedData';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Campaign, ContentItem } from '@/data/seedData';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import CampaignKnowledgeSelector from '@/components/CampaignKnowledgeSelector';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Sparkles, Zap, DollarSign, Heart, Clock, Smile,
  Instagram, Youtube, Copy, Check, RefreshCw,
  ChevronDown, ChevronUp, BarChart3, TrendingUp, Users,
  Download, Image as ImageIcon, Upload, Palette, Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { toPng } from 'html-to-image';
import dqfIcon from '@/assets/dqf-icon.svg';
import { CREATIVE_FORMATS, CAROUSEL_THEMES, type CreativeFormat, type CarouselTheme, type CarouselThemeId } from '@/pages/AiCarrosseis';

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
  { id: 'LinkedIn', label: 'LinkedIn', sub: '', icon: null },
  { id: 'Facebook', label: 'Facebook', sub: '', icon: null },
  { id: 'Google Display', label: 'Google Ads', sub: '', icon: Monitor },
  { id: 'Pinterest', label: 'Pinterest', sub: '', icon: null },
];

const OBJECTIVES = ['Awareness', 'Engajamento', 'Conversão', 'Retenção'];

// ─── Inject Google Fonts ──────────────────────────────────────────────────────
if (typeof document !== 'undefined') {
  const fontStyle = document.createElement('style');
  fontStyle.textContent = `@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap');`;
  if (!document.head.querySelector('[data-dqef-fonts-criativo]')) {
    fontStyle.setAttribute('data-dqef-fonts-criativo', 'true');
    document.head.appendChild(fontStyle);
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface GeneratedPost {
  title: string;
  subtitle: string;
  headline: string;
  headlineHighlight?: string;
  subtext?: string;
  viralLogic: string;
  caption: string;
  bestTime: string;
  engagementTip: string;
  visualDirection: string;
}

// ─── StaticPostPreview ─────────────────────────────────────────────────────────

const PREVIEW_BASE_WIDTH = 340;

interface StaticPostPreviewProps {
  headline: string;
  headlineHighlight?: string;
  subtext?: string;
  imageUrl?: string;
  previewRef?: React.RefObject<HTMLDivElement>;
  format: CreativeFormat;
  exportMode?: boolean;
  textScale?: number;
  theme: CarouselTheme;
  imageOpacity?: number;
  headlineScale?: number;
  imageScale?: number;
  imageOffsetY?: number;
}

function StaticPostPreview({
  headline, headlineHighlight, subtext, imageUrl, previewRef, format, exportMode = false,
  textScale = 1, theme, imageOpacity = 0.52, headlineScale = 1, imageScale = 1, imageOffsetY = 0,
}: StaticPostPreviewProps) {
  const exportScale = exportMode ? format.width / PREVIEW_BASE_WIDTH : 1;

  const ts = (size: string) => {
    const scale = textScale * exportScale;
    const pxMatch = size.match(/^(\d+(?:\.\d+)?)px$/);
    if (pxMatch) return `${parseFloat(pxMatch[1]) * scale}px`;
    const clampMatch = size.match(/^clamp\((\d+(?:\.\d+)?)px,\s*([^,]+),\s*(\d+(?:\.\d+)?)px\)$/);
    if (clampMatch) {
      if (exportMode) return `${parseFloat(clampMatch[3]) * scale}px`;
      return `clamp(${parseFloat(clampMatch[1]) * textScale}px, ${clampMatch[2]}, ${parseFloat(clampMatch[3]) * textScale}px)`;
    }
    return size;
  };

  const sz = format.safeZone;
  const paddingStyle = exportMode
    ? { paddingTop: sz.top, paddingRight: sz.right, paddingBottom: sz.bottom, paddingLeft: sz.left }
    : {
        paddingTop: `${(sz.top / format.height) * 100}%`,
        paddingRight: `${(sz.right / format.width) * 100}%`,
        paddingBottom: `${(sz.bottom / format.height) * 100}%`,
        paddingLeft: `${(sz.left / format.width) * 100}%`,
      };

  const renderHeadline = (text: string, highlight?: string) => {
    if (!highlight || !text.toLowerCase().includes(highlight.toLowerCase())) {
      return <span style={{ color: theme.headlineColor }}>{text}</span>;
    }
    const idx = text.toLowerCase().indexOf(highlight.toLowerCase());
    const before = text.slice(0, idx);
    const word = text.slice(idx, idx + highlight.length);
    const after = text.slice(idx + highlight.length);
    const highlightStyle = imageUrl
      ? { color: theme.highlightColor }
      : { color: theme.headlineColor, backgroundColor: theme.highlightBgOnImage, borderRadius: '2px', padding: '0 3px' };
    return (
      <>
        {before && <span style={{ color: theme.headlineColor }}>{before}</span>}
        <span style={highlightStyle}>{word}</span>
        {after && <span style={{ color: theme.headlineColor }}>{after}</span>}
      </>
    );
  };

  const exportDimensions = exportMode ? { width: format.width, height: format.height } : {};

  return (
    <div
      ref={previewRef}
      style={{
        background: theme.bg,
        aspectRatio: exportMode ? undefined : `${format.width}/${format.height}`,
        ...exportDimensions,
        width: exportMode ? format.width : '100%',
        position: 'relative',
        borderRadius: exportMode ? '0' : '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
        ...paddingStyle,
        boxSizing: 'border-box',
      }}
    >
      {imageUrl && (
        <>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: imageScale === 1 ? 'cover' : `${imageScale * 100}%`,
            backgroundPosition: `center ${50 + imageOffsetY}%`,
            opacity: imageOpacity, zIndex: 0,
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: theme.overlayGradient, zIndex: 1,
          }} />
        </>
      )}

      <div style={{ width: '100%', position: 'relative', zIndex: 10 }}>
        <div style={{
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 900,
          fontSize: ts(`clamp(${14 * headlineScale}px, ${3.8 * headlineScale}vw, ${22 * headlineScale}px)`),
          lineHeight: 1.1,
          letterSpacing: '-0.01em',
          marginBottom: subtext ? '8px' : '0',
          whiteSpace: 'pre-line' as const,
          textTransform: 'uppercase',
        }}>
          {renderHeadline(headline, headlineHighlight)}
        </div>
        {subtext && (
          <div style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 600,
            fontSize: ts('10px'),
            color: theme.subtextColor,
            lineHeight: 1.45,
            letterSpacing: '0.03em',
          }}>{subtext}</div>
        )}
      </div>

      {/* Brand icon */}
      <div style={{
        position: 'absolute',
        bottom: exportMode ? `${10 * exportScale}px` : '10px',
        right: exportMode ? `${10 * exportScale}px` : '10px',
        zIndex: 10, opacity: 0.55,
      }}>
        <img src={dqfIcon} alt="DQF" style={{
          width: exportMode ? `${18 * exportScale}px` : '18px',
          height: exportMode ? `${18 * exportScale}px` : '18px',
          filter: theme.iconFilter,
        }} />
      </div>
    </div>
  );
}

// ─── ThemePicker ──────────────────────────────────────────────────────────────

function ThemePicker({ selected, onChange }: { selected: CarouselThemeId; onChange: (id: CarouselThemeId) => void }) {
  return (
    <div>
      <p className="text-xs font-bold text-muted-foreground tracking-widest mb-2">TEMA VISUAL</p>
      <div className="grid grid-cols-3 gap-2">
        {CAROUSEL_THEMES.map(theme => (
          <button
            key={theme.id}
            onClick={() => onChange(theme.id)}
            className={cn(
              'group relative rounded-xl border-2 p-2.5 transition-all text-left',
              selected === theme.id
                ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                : 'border-border hover:border-border/70 bg-card/50'
            )}
          >
            <div className="flex gap-1 mb-2">
              {theme.previewSwatch.map((c, i) => (
                <div key={i} className="h-3 flex-1 rounded-sm"
                  style={{ background: c, border: c === '#FFFFFF' || c === '#F5F5F0' ? '1px solid rgba(0,0,0,0.1)' : 'none' }} />
              ))}
            </div>
            <p className="text-[10px] font-bold text-foreground leading-none">{theme.label}</p>
            <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">{theme.description}</p>
            {selected === theme.id && (
              <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-2.5 w-2.5 text-primary-foreground" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── FormatPicker ─────────────────────────────────────────────────────────────

function FormatPicker({ selected, onChange }: { selected: string; onChange: (id: string) => void }) {
  const platforms = [...new Set(CREATIVE_FORMATS.map(f => f.platform))];
  
  return (
    <div>
      <p className="text-xs font-bold text-muted-foreground tracking-widest mb-2">FORMATO DE SAÍDA</p>
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {platforms.map(platform => {
          const formats = CREATIVE_FORMATS.filter(f => f.platform === platform);
          return (
            <div key={platform}>
              <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{platform}</p>
              <div className="grid grid-cols-2 gap-1">
                {formats.map(fmt => (
                  <button
                    key={fmt.id}
                    onClick={() => onChange(fmt.id)}
                    className={cn(
                      'rounded-lg border px-2.5 py-1.5 text-left transition-all text-[10px]',
                      selected === fmt.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    )}
                  >
                    <span className="font-bold">{fmt.label}</span>
                    <span className="block text-[9px] font-mono opacity-70">{fmt.width}×{fmt.height}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Criativo() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get('taskId');
  const [campaigns] = useLocalStorage<Campaign[]>('dqef-campaigns', initialCampaigns);
  const [contents] = useLocalStorage<ContentItem[]>('dqef-contents', initialContents);

  // Config state
  const [selectedPersona, setSelectedPersona] = useState<string>(initialEstrategias[0].id);
  const [selectedAngle, setSelectedAngle] = useState<string>('Dinheiro');
  const [selectedChannel, setSelectedChannel] = useState<string>('Instagram Feed');
  const [selectedObjective, setSelectedObjective] = useState<string>('Awareness');
  const [additionalContext, setAdditionalContext] = useState('');
  const [campaignContext, setCampaignContext] = useState('');

  // Canvas state
  const [selectedFormatId, setSelectedFormatId] = useState<string>('ig-feed-4x5');
  const [selectedThemeId, setSelectedThemeId] = useState<CarouselThemeId>('brand-orange');
  const [textScale, setTextScale] = useState(1);
  const [headlineScale, setHeadlineScale] = useState(1);
  const [imageOpacity, setImageOpacity] = useState(0.52);
  const [imageScale, setImageScale] = useState(1);
  const [imageOffsetY, setImageOffsetY] = useState(0);
  const [postImageUrl, setPostImageUrl] = useState<string | null>(null);
  const [editableHeadline, setEditableHeadline] = useState('SEU HEADLINE AQUI');
  const [editableSubtext, setEditableSubtext] = useState('Subtexto da arte');
  const [headlineHighlight, setHeadlineHighlight] = useState('');

  // Generation state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedPost | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const selectedFormat = CREATIVE_FORMATS.find(f => f.id === selectedFormatId) || CREATIVE_FORMATS[0];
  const selectedTheme = CAROUSEL_THEMES.find(t => t.id === selectedThemeId) || CAROUSEL_THEMES[0];
  const persona = initialEstrategias.find(e => e.id === selectedPersona)!;
  const angle = ANGLES.find(a => a.id === selectedAngle)!;

  // Load briefing from Biblioteca (ideacao_to_criativo)
  useEffect(() => {
    const raw = localStorage.getItem('ideacao_to_criativo');
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (data.context) setAdditionalContext(data.context);
      if (data.title) setEditableHeadline(data.title.toUpperCase());
      if (data.copy_text) setEditableSubtext(data.copy_text);
      if (data.visual_direction) {
        // Use visual direction as additional context
        setAdditionalContext(prev => prev + (prev ? '\n\n' : '') + `Direção visual: ${data.visual_direction}`);
      }
      if (data.format) {
        // Find matching format
        const match = CREATIVE_FORMATS.find(f =>
          f.width === data.format.width && f.height === data.format.height
        );
        if (match) setSelectedFormatId(match.id);
      }
      setShowCanvas(true);
      toast({ title: '📋 Briefing da Biblioteca carregado', description: `Formato: ${data.format?.label || 'Auto'}` });
      localStorage.removeItem('ideacao_to_criativo');
    } catch {}
  }, []);

  // Load task context from DB
  useEffect(() => {
    if (!taskId) return;
    (async () => {
      const { data } = await (supabase as any).from('campaign_tasks').select('*').eq('id', taskId).single();
      if (data) {
        const ctx = data.campaign_context || {};
        if (ctx.emotionalAngle) {
          const a = ANGLES.find(a => a.id === ctx.emotionalAngle);
          if (a) setSelectedAngle(a.id);
        }
        if (data.channel) {
          const ch = CHANNELS.find(c => c.id.startsWith(data.channel));
          if (ch) setSelectedChannel(ch.id);
        }
        const briefingParts = [
          ctx.objective && `📋 OBJETIVO: ${ctx.objective}`,
          ctx.campaignSummary && `📝 RESUMO: ${ctx.campaignSummary}`,
          ctx.keyMessage && `💡 MENSAGEM CENTRAL: ${ctx.keyMessage}`,
        ].filter(Boolean).join('\n');
        if (briefingParts) setAdditionalContext(briefingParts);
        toast({ title: '📋 Briefing carregado', description: `Tarefa: ${data.title}` });
      }
    })();
  }, [taskId]);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-carousel', {
        body: {
          persona: persona.persona,
          angle: selectedAngle,
          channel: selectedChannel,
          format: 'Post Estático',
          objective: selectedObjective,
          personaData: {
            profile: persona.profile,
            painPoints: persona.painPoints,
            hooks: persona.hooks,
            approach: persona.approach,
            ageRange: persona.ageRange,
            avgRate: persona.avgRate,
          },
          platformData: {
            activeCampaigns: campaigns.filter(c => c.status === 'Ativa').length,
            publishedPosts: contents.filter(c => c.status === 'Publicado').length,
            topChannel: 'Instagram',
          },
          additionalContext: [campaignContext, additionalContext, `FORMATO: ${selectedFormat.label} (${selectedFormat.width}×${selectedFormat.height})`].filter(Boolean).join('\n\n').trim(),
        },
      });
      if (error) throw error;
      if (data?.carousel) {
        const c = data.carousel;
        const post: GeneratedPost = {
          title: c.title,
          subtitle: c.subtitle,
          headline: c.slides?.[0]?.headline || c.title,
          headlineHighlight: c.slides?.[0]?.headline?.split(' ').pop() || '',
          subtext: c.slides?.[0]?.body || c.subtitle,
          viralLogic: c.viralLogic,
          caption: c.caption,
          bestTime: c.bestTime,
          engagementTip: c.engagementTip,
          visualDirection: c.slides?.[0]?.visual || '',
        };
        setResult(post);
        setEditableHeadline(post.headline.toUpperCase());
        setEditableSubtext(post.subtext || '');
        setHeadlineHighlight(post.headlineHighlight || '');
        setShowCanvas(true);
      }
    } catch (e) {
      toast({ title: 'Erro ao gerar', description: String(e), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCaption = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.caption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
    toast({ title: 'Caption copiado!' });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPostImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleExportPNG = async () => {
    if (!exportRef.current) return;
    try {
      exportRef.current.style.display = 'block';
      await new Promise(r => setTimeout(r, 100));
      const dataUrl = await toPng(exportRef.current, {
        pixelRatio: 1,
        width: selectedFormat.width,
        height: selectedFormat.height,
      });
      exportRef.current.style.display = 'none';
      const link = document.createElement('a');
      link.download = `DQEF-${selectedFormat.label.replace(/\s/g, '-')}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: 'PNG exportado!', description: `${selectedFormat.width}×${selectedFormat.height}` });
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao exportar', variant: 'destructive' });
      if (exportRef.current) exportRef.current.style.display = 'none';
    }
  };

  const handleGenerateImage = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const prompt = `Professional marketing social media post image. ${result?.visualDirection || editableSubtext}. Clean, modern, high quality. Aspect ratio ${selectedFormat.ratio}.`;
      const response = await supabase.functions.invoke('generate-video-assets', {
        body: {
          operation: 'generate_image',
          prompt,
          aspect_ratio: selectedFormat.ratio,
          user_id: user.id,
        },
      });
      if (response.data?.imageUrl) {
        setPostImageUrl(response.data.imageUrl);
        toast({ title: 'Imagem gerada!' });
      }
    } catch (err) {
      toast({ title: 'Erro ao gerar imagem', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
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
          <p className="text-xs text-muted-foreground">Gere artes estáticas + roteiros com IA e canvas visual</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant={showCanvas ? 'default' : 'outline'} onClick={() => setShowCanvas(c => !c)} className="h-8 text-xs gap-1.5">
            <Palette className="h-3.5 w-3.5" /> {showCanvas ? 'Canvas Ativo' : 'Abrir Canvas'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.4fr]">
        {/* LEFT — Config Panel */}
        <div className="space-y-4">
          <CampaignKnowledgeSelector onContextChange={setCampaignContext} />

          {/* Persona */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">Persona Alvo</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {initialEstrategias.map(est => (
                <button key={est.id} onClick={() => setSelectedPersona(est.id)}
                  className={cn('rounded-lg border p-2.5 text-left transition-all duration-200',
                    selectedPersona === est.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40')}>
                  <span className="text-lg">{est.icon}</span>
                  <p className="mt-1 text-xs font-bold text-foreground leading-tight">{est.persona}</p>
                  <p className="text-[10px] text-muted-foreground">{est.ageRange}</p>
                </button>
              ))}
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
                  <button key={a.id} onClick={() => setSelectedAngle(a.id)}
                    className={cn('flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all duration-200',
                      selectedAngle === a.id ? a.bg : 'border-border hover:border-primary/30')}>
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

          {/* Canal + Objetivo */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <div>
              <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Canal</p>
              <div className="flex flex-wrap gap-1.5">
                {CHANNELS.map(ch => (
                  <button key={ch.id} onClick={() => setSelectedChannel(ch.id)}
                    className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-all',
                      selectedChannel === ch.id ? 'border-primary bg-primary/20 text-primary' : 'border-border text-muted-foreground hover:border-primary/40')}>
                    {ch.label}{ch.sub ? ` ${ch.sub}` : ''}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Objetivo</p>
              <div className="flex flex-wrap gap-1.5">
                {OBJECTIVES.map(o => (
                  <button key={o} onClick={() => setSelectedObjective(o)}
                    className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-all',
                      selectedObjective === o ? 'border-primary bg-primary/20 text-primary' : 'border-border text-muted-foreground hover:border-primary/40')}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Context */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Contexto Adicional</p>
            <Textarea placeholder="Ex: focar no nicho de piscineiros, incluir dado sobre GetNinjas..."
              value={additionalContext} onChange={e => setAdditionalContext(e.target.value)}
              className="min-h-[80px] bg-background border-border text-xs resize-none" />
          </div>

          {/* Generate */}
          <Button onClick={handleGenerate} disabled={loading} className="w-full gap-2 font-bold" size="lg">
            {loading ? <><RefreshCw className="h-4 w-4 animate-spin" /> Gerando...</> : <><Sparkles className="h-4 w-4" /> Gerar com IA</>}
          </Button>
        </div>

        {/* RIGHT — Canvas + Result */}
        <div className="space-y-4">
          {showCanvas ? (
            <div className="space-y-4 animate-fade-in">
              {/* Canvas controls */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
                {/* Preview */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Preview · {selectedFormat.label} ({selectedFormat.width}×{selectedFormat.height})
                    </p>
                    <div className="flex gap-1.5">
                      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => imageInputRef.current?.click()}>
                        <Upload className="h-3 w-3 mr-1" /> Upload
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={handleGenerateImage} disabled={loading}>
                        <ImageIcon className="h-3 w-3 mr-1" /> Gerar IA
                      </Button>
                      <Button size="sm" className="h-7 text-[10px]" onClick={handleExportPNG}>
                        <Download className="h-3 w-3 mr-1" /> PNG
                      </Button>
                    </div>
                  </div>

                  <div className="max-w-[400px] mx-auto">
                    <StaticPostPreview
                      headline={editableHeadline}
                      headlineHighlight={headlineHighlight}
                      subtext={editableSubtext}
                      imageUrl={postImageUrl || undefined}
                      format={selectedFormat}
                      theme={selectedTheme}
                      textScale={textScale}
                      headlineScale={headlineScale}
                      imageOpacity={imageOpacity}
                      imageScale={imageScale}
                      imageOffsetY={imageOffsetY}
                    />
                  </div>

                  {/* Editable text fields */}
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Headline</p>
                      <Textarea value={editableHeadline} onChange={e => setEditableHeadline(e.target.value)}
                        className="min-h-[50px] text-xs bg-background border-border" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Subtexto</p>
                        <Textarea value={editableSubtext} onChange={e => setEditableSubtext(e.target.value)}
                          className="min-h-[40px] text-xs bg-background border-border" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Highlight</p>
                        <Textarea value={headlineHighlight} onChange={e => setHeadlineHighlight(e.target.value)}
                          className="min-h-[40px] text-xs bg-background border-border"
                          placeholder="Palavra em destaque" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Canvas sidebar controls */}
                <div className="w-full lg:w-[240px] space-y-4">
                  <ThemePicker selected={selectedThemeId} onChange={setSelectedThemeId} />
                  <FormatPicker selected={selectedFormatId} onChange={setSelectedFormatId} />

                  {/* Sliders */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-muted-foreground tracking-widest">AJUSTES</p>
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">Escala do texto ({textScale.toFixed(1)}×)</p>
                      <Slider value={[textScale]} onValueChange={([v]) => setTextScale(v)} min={0.5} max={2} step={0.1} />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">Headline ({headlineScale.toFixed(1)}×)</p>
                      <Slider value={[headlineScale]} onValueChange={([v]) => setHeadlineScale(v)} min={0.5} max={3} step={0.1} />
                    </div>
                    {postImageUrl && (
                      <>
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1">Opacidade ({Math.round(imageOpacity * 100)}%)</p>
                          <Slider value={[imageOpacity]} onValueChange={([v]) => setImageOpacity(v)} min={0.1} max={1} step={0.05} />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1">Zoom ({imageScale.toFixed(1)}×)</p>
                          <Slider value={[imageScale]} onValueChange={([v]) => setImageScale(v)} min={0.5} max={3} step={0.1} />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1">Offset Y ({imageOffsetY}%)</p>
                          <Slider value={[imageOffsetY]} onValueChange={([v]) => setImageOffsetY(v)} min={-50} max={50} step={1} />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Export hidden div */}
              <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <div ref={exportRef} style={{ display: 'none' }}>
                  <StaticPostPreview
                    headline={editableHeadline}
                    headlineHighlight={headlineHighlight}
                    subtext={editableSubtext}
                    imageUrl={postImageUrl || undefined}
                    format={selectedFormat}
                    exportMode
                    theme={selectedTheme}
                    textScale={textScale}
                    headlineScale={headlineScale}
                    imageOpacity={imageOpacity}
                    imageScale={imageScale}
                    imageOffsetY={imageOffsetY}
                  />
                </div>
              </div>

              {/* Result metadata */}
              {result && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">{persona.icon} {persona.persona}</Badge>
                          <Badge variant="outline" className="text-[10px]">{selectedChannel}</Badge>
                          <Badge variant="outline" className="text-[10px] font-mono">{selectedFormat.width}×{selectedFormat.height}</Badge>
                        </div>
                        <h3 className="text-base font-black text-foreground leading-tight">{result.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{result.subtitle}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={handleGenerate} disabled={loading} className="shrink-0 gap-1.5">
                        <RefreshCw className="h-3.5 w-3.5" /> Regerar
                      </Button>
                    </div>
                    <div className="mt-3 rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-green-400">Por que vai viralizar</span>
                      </div>
                      <p className="text-xs text-foreground">{result.viralLogic}</p>
                    </div>
                  </div>

                  {/* Caption */}
                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-foreground uppercase tracking-wider">Caption</p>
                      <Button size="sm" variant="ghost" onClick={handleCopyCaption}
                        className={cn('h-7 gap-1.5 text-xs', copiedCaption ? 'text-green-400' : 'text-muted-foreground')}>
                        {copiedCaption ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedCaption ? 'Copiado!' : 'Copiar'}
                      </Button>
                    </div>
                    <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-sans leading-relaxed">{result.caption}</pre>
                  </div>

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
          ) : (
            /* Non-canvas mode — original placeholder */
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border text-center p-8">
              <Palette className="h-10 w-10 text-muted-foreground/40 mb-4" />
              <p className="text-sm font-bold text-muted-foreground">Canvas de Arte Estática</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Clique em "Abrir Canvas" para ver o preview visual, ou gere com IA primeiro.
              </p>
            </div>
          )}

          {loading && !showCanvas && (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl border border-primary/20 bg-primary/5 text-center p-8">
              <RefreshCw className="h-10 w-10 text-primary animate-spin mb-4" />
              <p className="text-sm font-bold text-foreground">Criando arte...</p>
              <p className="text-xs text-muted-foreground mt-1">
                IA analisando {persona.persona} × {selectedAngle} × {selectedChannel}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
