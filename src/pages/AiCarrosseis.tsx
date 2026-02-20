import { useState, useRef, useCallback, useEffect } from 'react';
import { Layers, Wand2, Copy, Check, Download, ChevronDown, ChevronUp, ImageIcon, Video, Zap, RefreshCw, Image, Minimize2, Shuffle, Upload, Trash2, Library, X, Star, Target, FileText, Users, Megaphone, TrendingUp, BookOpen, AlertTriangle, PlusCircle, File, Eye } from 'lucide-react';
import dqfIcon from '@/assets/dqf-icon.svg';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toPng } from 'html-to-image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SlideOutput {
  number: number;
  type: 'hook' | 'setup' | 'data' | 'contrast' | 'validation' | 'cta';
  headline: string;
  headlineHighlight?: string;
  subtext?: string;
  logic: string;
  visualDirection: string;
  needsMedia: boolean;
  mediaType?: 'photo' | 'video' | null;
  mediaDescription?: string | null;
  imagePrompt?: string | null;
  veoPrompt?: string | null;
  bgStyle: 'dark' | 'orange' | 'dark-red' | 'dark-green';
  layout: 'text-only' | 'text-photo-split' | 'number-dominant' | 'cta-clean';
}

interface CarouselOutput {
  title: string;
  angle: string;
  angleEmoji: string;
  angleRationale: string;
  targetProfile: string;
  channel: string;
  viralLogic: string;
  designNotes: string;
  bestTime: string;
  caption: string;
  slides: SlideOutput[];
}

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  category: string | null;
  tags: string[] | null;
  description: string | null;
  file_size: number | null;
  created_at: string;
}

interface MediaSuggestion extends MediaItem {
  score: number;
  reason: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ANGLES = [
  { id: '', label: 'IA Decide', emoji: '🤖', color: 'border-primary/40 text-primary' },
  { id: 'RAIVA', label: 'Raiva', emoji: '🔴', color: 'border-red-500/40 text-red-400' },
  { id: 'DINHEIRO', label: 'Dinheiro', emoji: '💸', color: 'border-yellow-500/40 text-yellow-400' },
  { id: 'ORGULHO', label: 'Orgulho', emoji: '🏆', color: 'border-amber-500/40 text-amber-400' },
  { id: 'URGÊNCIA', label: 'Urgência', emoji: '⏰', color: 'border-orange-500/40 text-orange-400' },
  { id: 'ALÍVIO', label: 'Alívio', emoji: '💚', color: 'border-green-500/40 text-green-400' },
];

const PERSONAS = [
  'Piscineiro', 'Eletricista', 'Encanador', 'Marido de Aluguel',
  'Pedreiro', 'Pintor', 'Jardineiro', 'Faxineira',
];

const CHANNELS = ['Instagram Feed', 'Stories', 'TikTok', 'LinkedIn'];
const TONES = ['Peer-to-peer', 'Editorial', 'Direto ao ponto'];

const SLIDE_BG = '#E8603C';

const BG_COLORS: Record<string, string> = {
  dark: SLIDE_BG,
  orange: SLIDE_BG,
  'dark-red': SLIDE_BG,
  'dark-green': SLIDE_BG,
};

const TYPE_LABELS: Record<string, string> = {
  hook: 'GANCHO',
  setup: 'SETUP',
  data: 'DADOS',
  contrast: 'CONTRASTE',
  validation: 'VALIDAÇÃO',
  cta: 'CTA',
};

const CATEGORY_COLORS: Record<string, string> = {
  pessoa: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  ambiente: 'bg-green-500/20 text-green-400 border-green-500/30',
  ferramenta: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  ação: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  produto: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  outdoor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  indoor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  abstrato: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  equipe: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
};

// ─── Inject Google Fonts ──────────────────────────────────────────────────────
const fontStyle = document.createElement('style');
fontStyle.textContent = `@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');`;
if (!document.head.querySelector('[data-dqef-fonts]')) {
  fontStyle.setAttribute('data-dqef-fonts', 'true');
  document.head.appendChild(fontStyle);
}

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ text, label = 'Copiar', size = 'sm' }: { text: string; label?: string; size?: 'sm' | 'xs' }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className={cn(
        'flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors',
        size === 'xs' ? 'px-1.5 py-0.5' : '',
        copied
          ? 'bg-green-500/20 text-green-400'
          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copiado!' : label}
    </button>
  );
}

// ─── SlidePreview ─────────────────────────────────────────────────────────────

interface SlidePreviewProps {
  slide: SlideOutput;
  imageUrl?: string;
  slideRef?: React.RefObject<HTMLDivElement>;
}

function SlidePreview({ slide, imageUrl, slideRef }: SlidePreviewProps) {
  const bg = BG_COLORS[slide.bgStyle] ?? SLIDE_BG;
  const isDataSlide = slide.layout === 'number-dominant';
  const isCTA = slide.layout === 'cta-clean';

  const renderHeadline = (headline: string, highlight?: string) => {
    if (!highlight || !headline.toLowerCase().includes(highlight.toLowerCase())) {
      return <span style={{ color: '#FFFFFF' }}>{headline}</span>;
    }
    const idx = headline.toLowerCase().indexOf(highlight.toLowerCase());
    const before = headline.slice(0, idx);
    const word = headline.slice(idx, idx + highlight.length);
    const after = headline.slice(idx + highlight.length);
    const highlightStyle = imageUrl
      ? { color: '#E8603C' }
      : { color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: '2px', padding: '0 3px' };
    return (
      <>
        {before && <span style={{ color: '#FFFFFF' }}>{before}</span>}
        <span style={highlightStyle}>{word}</span>
        {after && <span style={{ color: '#FFFFFF' }}>{after}</span>}
      </>
    );
  };

  return (
    <div
      ref={slideRef}
      style={{
        background: bg,
        aspectRatio: '4/5',
        width: '100%',
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden',
      display: 'flex',
        flexDirection: 'column',
        justifyContent: isDataSlide ? 'center' : isCTA ? 'center' : 'flex-end',
        alignItems: isCTA ? 'center' : 'flex-start',
        padding: '36px 32px',
        boxSizing: 'border-box',
      }}
    >
      {imageUrl && (
        <>
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.52,
            zIndex: 0,
          }} />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.05) 100%)',
            zIndex: 1,
          }} />
        </>
      )}

      {isCTA && (
        <div style={{ textAlign: 'center', width: '100%', position: 'relative', zIndex: 10 }}>
          <div style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 900,
            fontSize: 'clamp(16px, 4.5vw, 24px)',
            color: '#FFFFFF',
            lineHeight: 1.05,
            marginBottom: '10px',
            letterSpacing: '-0.01em',
            textTransform: 'uppercase',
          }}>
            {renderHeadline(slide.headline, slide.headlineHighlight)}
          </div>
          {slide.subtext && (
            <div style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 600,
              fontSize: '10px',
              color: 'rgba(255,255,255,0.75)',
              letterSpacing: '0.06em',
            }}>{slide.subtext}</div>
          )}
          {/* Slogan */}
          <div style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: '10px',
            marginTop: '18px',
            letterSpacing: '0.04em',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.45)' }}>pronto. </span>
            <span style={{ color: '#FFFFFF' }}>resolvido.</span>
          </div>
        </div>
      )}

      {isDataSlide && !isCTA && (
        <div style={{ width: '100%', textAlign: 'left', position: 'relative', zIndex: 10 }}>
          <div style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 900,
            fontSize: 'clamp(44px, 13vw, 72px)',
            color: '#FFFFFF',
            lineHeight: 0.9,
            letterSpacing: '-0.03em',
            marginBottom: '10px',
            textTransform: 'uppercase',
          }}>
            {slide.headline}
          </div>
          {slide.subtext && (
            <div style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700,
              fontSize: '11px',
              color: 'rgba(255,255,255,0.8)',
              lineHeight: 1.3,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}>{slide.subtext}</div>
          )}
        </div>
      )}

      {!isDataSlide && !isCTA && (
        <div style={{ width: '100%', position: 'relative', zIndex: 10 }}>
          <div style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 900,
            fontSize: 'clamp(14px, 3.8vw, 22px)',
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
            marginBottom: slide.subtext ? '8px' : '0',
            whiteSpace: 'pre-line',
            textTransform: 'uppercase',
          }}>
            {renderHeadline(slide.headline, slide.headlineHighlight)}
          </div>
          {slide.subtext && (
            <div style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 600,
              fontSize: '10px',
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.45,
              letterSpacing: '0.03em',
            }}>{slide.subtext}</div>
          )}
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        zIndex: 10,
        opacity: 0.55,
      }}>
        <img src={dqfIcon} alt="DQF" style={{ width: '18px', height: '18px', filter: 'brightness(0) invert(1)' }} />
      </div>
    </div>
  );
}

// ─── SlideCard ─────────────────────────────────────────────────────────────────

interface SlideCardProps {
  slide: SlideOutput;
  imageUrl?: string;
  isGenerating?: boolean;
  onGenerateImage: (slideNumber: number, prompt: string, quality: 'fast' | 'high') => void;
  onClearImage: (slideNumber: number) => void;
  onApplyLibraryImage: (slideNumber: number, url: string) => void;
  mediaLibraryCount: number;
  userId: string | null;
  onLibraryChange: () => void;
}

function buildGenericImagePrompt(slide: SlideOutput): string {
  return `Editorial photography for a Brazilian service brand carousel slide. Style: documentary, natural light, authentic moment. The slide headline is "${slide.headline}". Create a background image that evokes this concept — no text, no overlays, no logos. The image will have a semi-transparent orange (#E8603C) overlay, so use high-contrast composition. Shot on Canon EOS R5, 35mm lens, f/2.8. Professional but human.`;
}

function SlideCard({ slide, imageUrl, isGenerating, onGenerateImage, onClearImage, onApplyLibraryImage, mediaLibraryCount, userId, onLibraryChange }: SlideCardProps) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editedHeadline, setEditedHeadline] = useState(slide.headline);
  const [editedHighlight, setEditedHighlight] = useState(slide.headlineHighlight ?? '');
  const [editedSubtext, setEditedSubtext] = useState(slide.subtext ?? '');
  const [imageInstruction, setImageInstruction] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<MediaSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const editedSlide: SlideOutput = {
    ...slide,
    headline: editedHeadline,
    headlineHighlight: editedHighlight || undefined,
    subtext: editedSubtext || undefined,
  };

  const hasImage = !!imageUrl;
  const basePrompt = slide.imagePrompt ?? buildGenericImagePrompt(slide);

  const buildImagePrompt = () => {
    if (!imageInstruction.trim()) return basePrompt;
    return `${basePrompt}\n\nADJUSTMENT: ${imageInstruction.trim()}`;
  };

  const handleExport = async () => {
    const el = slideRef.current;
    if (!el) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(el, { pixelRatio: 2, cacheBust: true, style: { borderRadius: '0' } });
      const link = document.createElement('a');
      link.download = `dqef-slide-${String(slide.number).padStart(2, '0')}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setExporting(false);
    }
  };

  const applyLessText = () => {
    const words = editedHeadline.split(' ');
    const keep = Math.max(2, Math.ceil(words.length * 0.6));
    setEditedHeadline(words.slice(0, keep).join(' '));
  };

  const applyChangeApproach = () => {
    const approaches = [
      (h: string) => `E SE ${h}?`,
      (h: string) => `${h.split(' ')[0]} QUE NINGUÉM TE CONTOU`,
      (h: string) => `PARE. ${h}.`,
      (h: string) => `A VERDADE SOBRE ${h}`,
    ];
    const idx = editedHeadline.length % approaches.length;
    const base = slide.headline;
    setEditedHeadline(approaches[idx](base));
  };

  const handleFetchSuggestions = async () => {
    if (!userId) return;
    setShowSuggestions(true);
    setLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-media', {
        body: {
          slideHeadline: editedHeadline,
          slideSubtext: editedSubtext,
          slideImagePrompt: slide.imagePrompt,
          slideType: slide.type,
          userId,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSuggestions(data.suggestions ?? []);
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message ?? 'Falha ao buscar sugestões.', variant: 'destructive' });
      setShowSuggestions(false);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleDirectUpload = async (file: File) => {
    if (!userId) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({ title: 'Formato inválido', description: 'Use JPG, PNG ou WEBP.', variant: 'destructive' });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'Máximo 20MB.', variant: 'destructive' });
      return;
    }
    setUploadingImage(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const uuid = crypto.randomUUID();
      const storagePath = `${userId}/${uuid}.${ext}`;

      const { error: storageError } = await supabase.storage
        .from('media-library')
        .upload(storagePath, file, { contentType: file.type, upsert: false });
      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage.from('media-library').getPublicUrl(storagePath);
      const publicUrl = urlData.publicUrl;

      // Apply to slide immediately
      onApplyLibraryImage(slide.number, publicUrl);

      // Save to DB
      const { data: insertData, error: insertError } = await supabase
        .from('media_library')
        .insert({ user_id: userId, url: publicUrl, filename: file.name, file_size: file.size })
        .select('id')
        .single();
      if (insertError) throw insertError;

      toast({ title: 'Imagem inserida ✅', description: 'Categorizando automaticamente...' });
      onLibraryChange();

      // Categorize in background
      supabase.functions.invoke('categorize-media', {
        body: { imageUrl: publicUrl, mediaId: insertData.id },
      }).then(() => onLibraryChange());
    } catch (e: any) {
      toast({ title: 'Erro no upload', description: e.message, variant: 'destructive' });
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card flex flex-col">

      {/* ── Slide preview ── */}
      <div className="p-3">
        <SlidePreview slide={editedSlide} imageUrl={imageUrl} slideRef={slideRef} />
      </div>

      {/* ── Quick actions bar ── */}
      <div className="px-3 pb-2 flex items-center gap-1.5">
        <button
          onClick={applyLessText}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium border border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-all"
          title="Reduzir texto"
        >
          <Minimize2 className="h-2.5 w-2.5" />
          Menos texto
        </button>
        <button
          onClick={applyChangeApproach}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium border border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-all"
          title="Mudar abordagem"
        >
          <Shuffle className="h-2.5 w-2.5" />
          Mudar abordagem
        </button>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium border border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-all ml-auto disabled:opacity-40"
          title="Baixar PNG"
        >
          {exporting
            ? <span className="h-2.5 w-2.5 border border-current border-t-transparent rounded-full animate-spin" />
            : <Download className="h-2.5 w-2.5" />}
          PNG
        </button>
      </div>

      {/* ── Copy editing ── */}
      <div className="px-3 pb-3 space-y-2 border-t border-border pt-2.5">
        <p className="text-[9px] font-bold text-muted-foreground/60 tracking-[0.15em] uppercase">Copy</p>
        <textarea
          value={editedHeadline}
          onChange={e => setEditedHeadline(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-border bg-muted/20 px-2 py-1.5 text-xs text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 font-bold uppercase tracking-wide"
          placeholder="Headline..."
        />
        <div className="flex gap-1.5">
          <input
            value={editedHighlight}
            onChange={e => setEditedHighlight(e.target.value)}
            className="flex-1 rounded-md border border-border bg-muted/20 px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            placeholder="Destaque (laranja)"
          />
          <input
            value={editedSubtext}
            onChange={e => setEditedSubtext(e.target.value)}
            className="flex-1 rounded-md border border-border bg-muted/20 px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            placeholder="Subtexto"
          />
        </div>
      </div>

      {/* ── Image section ── */}
      <div className="px-3 pb-3 space-y-2 border-t border-border pt-2.5">
        <p className="text-[9px] font-bold text-muted-foreground/60 tracking-[0.15em] uppercase">Imagem de fundo</p>

        {/* Hidden file input for direct upload */}
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleDirectUpload(f); e.target.value = ''; }}
        />

        <textarea
          value={imageInstruction}
          onChange={e => setImageInstruction(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-border bg-muted/20 px-2 py-1.5 text-xs text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/40"
          placeholder='Instrução: "luz dourada", "ângulo de baixo", "preto e branco"...'
        />

        {/* Generate via AI */}
        <button
          onClick={() => onGenerateImage(slide.number, buildImagePrompt(), 'fast')}
          disabled={isGenerating || uploadingImage}
          className={cn(
            'w-full flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border',
            (isGenerating || uploadingImage)
              ? 'border-border text-muted-foreground cursor-not-allowed'
              : hasImage
                ? 'border-border text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                : 'border-primary/50 text-primary hover:bg-primary/10'
          )}
        >
          {isGenerating
            ? <span className="h-3 w-3 border border-current border-t-transparent rounded-full animate-spin" />
            : hasImage ? <RefreshCw className="h-3 w-3" /> : <Image className="h-3 w-3" />}
          {isGenerating ? 'Gerando...' : hasImage
            ? (imageInstruction.trim() ? 'Aplicar ajuste' : 'Trocar imagem')
            : 'Gerar imagem'}
        </button>

        {/* Direct upload from device */}
        <button
          onClick={() => uploadInputRef.current?.click()}
          disabled={uploadingImage || isGenerating}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border border-border text-muted-foreground hover:bg-muted/30 hover:text-foreground disabled:opacity-40"
        >
          {uploadingImage
            ? <span className="h-3 w-3 border border-current border-t-transparent rounded-full animate-spin" />
            : <Upload className="h-3 w-3" />}
          {uploadingImage ? 'Enviando...' : 'Inserir imagem do dispositivo'}
        </button>

        {/* Library search button — shown only when user has media */}
        {mediaLibraryCount > 0 && (
          <button
            onClick={showSuggestions ? () => setShowSuggestions(false) : handleFetchSuggestions}
            disabled={loadingSuggestions}
            className={cn(
              'w-full flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border',
              showSuggestions
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted/30 hover:text-foreground'
            )}
          >
            {loadingSuggestions
              ? <span className="h-3 w-3 border border-current border-t-transparent rounded-full animate-spin" />
              : <Library className="h-3 w-3" />}
            {loadingSuggestions ? 'Buscando...' : showSuggestions ? 'Fechar biblioteca' : `Buscar na biblioteca (${mediaLibraryCount})`}
          </button>
        )}

        {/* Tirar imagem */}
        {hasImage && (
          <button
            onClick={() => onClearImage(slide.number)}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border border-destructive/30 text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
          >
            <ImageIcon className="h-3 w-3" />
            Tirar imagem
          </button>
        )}

        {/* ── Library suggestions inline ── */}
        {showSuggestions && !loadingSuggestions && (
          <div className="mt-2 space-y-2">
            {suggestions.length === 0 ? (
              <p className="text-[10px] text-muted-foreground text-center py-3">Nenhuma sugestão encontrada para esta lâmina.</p>
            ) : (
              <>
                <p className="text-[9px] font-bold text-muted-foreground/60 tracking-[0.15em] uppercase">Sugestões por relevância</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {suggestions.map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        onApplyLibraryImage(slide.number, s.url);
                        setShowSuggestions(false);
                      }}
                      className="group relative rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all"
                      title={s.reason}
                    >
                      <div className="aspect-square relative">
                        <img
                          src={s.url}
                          alt={s.filename}
                          className="w-full h-full object-cover"
                        />
                        {/* Relevance score badge */}
                        <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-black/70 rounded-full px-1.5 py-0.5">
                          <Star className="h-2 w-2 text-yellow-400 fill-yellow-400" />
                          <span className="text-[9px] font-bold text-white">{s.score}</span>
                        </div>
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white">Aplicar</span>
                        </div>
                      </div>
                      {s.category && (
                        <div className="px-1.5 py-1 bg-muted/30">
                          <span className="text-[8px] font-medium text-muted-foreground truncate block">{s.category}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Logic toggle ── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/20 transition-colors border-t border-border/50"
      >
        <span className="tracking-widest uppercase font-medium">Lógica · Mídia</span>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="px-3 py-3 space-y-3 border-t border-border/50 bg-muted/5">
          <div>
            <p className="text-[9px] font-bold text-primary/70 tracking-widest uppercase mb-1">Lógica estratégica</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{slide.logic}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold text-muted-foreground/50 tracking-widest uppercase mb-1">Direção visual</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{slide.visualDirection}</p>
          </div>
          {(slide.imagePrompt || slide.veoPrompt) && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[9px] font-bold text-muted-foreground/50 tracking-widest uppercase">
                  {slide.mediaType === 'video' ? 'Prompt VEO 3.1' : 'Prompt imagem'}
                </p>
                <CopyButton text={slide.imagePrompt ?? slide.veoPrompt ?? ''} label="Copiar" />
              </div>
              <pre className="text-[10px] text-muted-foreground/70 leading-relaxed bg-muted/20 p-2 rounded-lg overflow-x-auto whitespace-pre-wrap" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {slide.imagePrompt ?? slide.veoPrompt}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Hidden full-res ref for PNG export */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '400px', pointerEvents: 'none' }}>
        <SlidePreview slide={editedSlide} imageUrl={imageUrl} slideRef={slideRef} />
      </div>
    </div>
  );
}

// ─── StrategicPanel ───────────────────────────────────────────────────────────

interface StrategyDoc {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

interface StrategyData {
  positioning: string;
  differentials: string;
  targetAudience: string;
  pains: string;
  toneOfVoice: string;
  competitors: string;
  forbiddenTopics: string;
  currentObjective: string;
  kpis: string;
  docs: StrategyDoc[];
}

const STRATEGY_STORAGE_KEY = 'dqef_strategy_v1';

function StrategicPanel() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const defaultStrategy: StrategyData = {
    positioning: '',
    differentials: '',
    targetAudience: '',
    pains: '',
    toneOfVoice: '',
    competitors: '',
    forbiddenTopics: '',
    currentObjective: '',
    kpis: '',
    docs: [],
  };

  const [data, setData] = useState<StrategyData>(() => {
    try {
      const saved = localStorage.getItem(STRATEGY_STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultStrategy;
    } catch {
      return defaultStrategy;
    }
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const update = (field: keyof StrategyData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(STRATEGY_STORAGE_KEY, JSON.stringify(data));
    setSaved(true);
    toast({ title: 'Estratégia salva ✅', description: 'Os dados foram salvos localmente.' });
    setTimeout(() => setSaved(false), 3000);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !userId) return;
    setUploading(true);

    const newDocs: StrategyDoc[] = [];

    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) {
        toast({ title: 'Arquivo muito grande', description: `${file.name} excede 20MB.`, variant: 'destructive' });
        continue;
      }

      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
      const uuid = crypto.randomUUID();
      const storagePath = `${userId}/strategy/${uuid}.${ext}`;

      const { error: storageError } = await supabase.storage
        .from('media-library')
        .upload(storagePath, file, { contentType: file.type, upsert: false });

      if (storageError) {
        toast({ title: 'Erro no upload', description: storageError.message, variant: 'destructive' });
        continue;
      }

      const { data: urlData } = supabase.storage.from('media-library').getPublicUrl(storagePath);

      newDocs.push({
        id: uuid,
        name: file.name,
        url: urlData.publicUrl,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      });
    }

    setUploading(false);

    if (newDocs.length > 0) {
      setData(prev => {
        const updated = { ...prev, docs: [...prev.docs, ...newDocs] };
        localStorage.setItem(STRATEGY_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
      toast({ title: `${newDocs.length} arquivo(s) enviado(s) ✅`, description: 'Referências de estratégia salvas.' });
    }
  };

  const handleDeleteDoc = async (doc: StrategyDoc) => {
    if (!userId) return;

    const urlParts = doc.url.split('/media-library/');
    const storagePath = urlParts[1];
    if (storagePath) {
      await supabase.storage.from('media-library').remove([storagePath]);
    }

    setData(prev => {
      const updated = { ...prev, docs: prev.docs.filter(d => d.id !== doc.id) };
      localStorage.setItem(STRATEGY_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    toast({ title: 'Arquivo removido', description: doc.name });
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4 text-blue-400" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-400" />;
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  const sections = [
    {
      key: 'positioning',
      label: 'POSICIONAMENTO',
      icon: <Target className="h-3.5 w-3.5" />,
      placeholder: 'Como a marca se posiciona no mercado? Qual é a promessa central?\nEx: Plataforma de serviços que paga o prestador na hora, com taxa justa.',
      hint: 'A âncora de tudo. Sem isso, o conteúdo fica genérico.',
      rows: 3,
    },
    {
      key: 'differentials',
      label: 'DIFERENCIAIS COMPETITIVOS',
      icon: <TrendingUp className="h-3.5 w-3.5" />,
      placeholder: 'Liste os diferenciais reais (números, fatos):\n• Comissão de 10-15% vs 27% da concorrência\n• PIX imediato na conclusão\n• Profissionais verificados por KYC',
      hint: 'Diferenciais com números convertem. Adjetivos não.',
      rows: 4,
    },
    {
      key: 'targetAudience',
      label: 'PÚBLICO-ALVO',
      icon: <Users className="h-3.5 w-3.5" />,
      placeholder: 'Descreva quem é o público principal:\n• Perfil: Piscineiro autônomo, 28-45 anos\n• Renda: R$ 3.000–8.000/mês\n• Dor: Depende de indicação, não escala',
      hint: 'Fale para uma pessoa, não para "todo mundo".',
      rows: 4,
    },
    {
      key: 'pains',
      label: 'DORES E FRUSTRAÇÕES',
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      placeholder: 'Quais as frases que o público pensa ou fala?\n• "Pago 27% pro GetNinjas e perco o cliente"\n• "Fico sem trabalho no mês fraco"\n• "Nunca aprendi a me vender no digital"',
      hint: 'Copie a voz do cliente. Quem escreve como o cliente, vende.',
      rows: 4,
    },
    {
      key: 'toneOfVoice',
      label: 'TOM DE VOZ',
      icon: <Megaphone className="h-3.5 w-3.5" />,
      placeholder: 'Como a marca fala? Dê exemplos do que pode e não pode:\n✅ Pode: "Tu manda bem. Tu merece mais."\n❌ Não pode: "Você possui habilidades excepcionais."\nTom: Direto, peer-to-peer, sem jargão corporativo.',
      hint: 'O tom que a IA deve imitar. Quanto mais específico, melhor.',
      rows: 4,
    },
    {
      key: 'competitors',
      label: 'CONCORRENTES',
      icon: <BookOpen className="h-3.5 w-3.5" />,
      placeholder: 'Quem são os concorrentes e como a marca se diferencia de cada um?\n• GetNinjas: cobra por lead, sem garantia → nós cobramos só se fechar\n• Parafuzo: taxa de 35% → nós cobramos 10-15%',
      hint: 'Comparativos geram conteúdo viral. Nomeie com cuidado.',
      rows: 3,
    },
    {
      key: 'forbiddenTopics',
      label: 'TÓPICOS PROIBIDOS',
      icon: <X className="h-3.5 w-3.5" />,
      placeholder: 'O que a marca nunca deve dizer ou prometer?\n• Não mencionar cidades específicas\n• Não prometer "renda garantida"\n• Não atacar concorrentes pelo nome diretamente',
      hint: 'Limites claros evitam crises de comunicação.',
      rows: 3,
    },
    {
      key: 'currentObjective',
      label: 'OBJETIVO ATUAL',
      icon: <Zap className="h-3.5 w-3.5" />,
      placeholder: 'Qual é o objetivo dos próximos 30-90 dias?\nEx: Cadastrar 200 prestadores verificados até março. Foco em conversão, não em awareness.',
      hint: 'O objetivo muda o tipo de conteúdo. Seja específico.',
      rows: 3,
    },
    {
      key: 'kpis',
      label: 'KPIS E METAS DE CONTEÚDO',
      icon: <TrendingUp className="h-3.5 w-3.5" />,
      placeholder: 'Quais métricas definem sucesso?\n• Taxa de salvamento acima de 8%\n• 500 cliques no link da bio por mês\n• 30% de aumento de cadastros orgânicos',
      hint: 'KPIs guiam o tipo de CTA e o ângulo do conteúdo.',
      rows: 3,
    },
  ] as const;

  const completedFields = sections.filter(s => (data[s.key as keyof StrategyData] as string).trim().length > 0).length;
  const completionPct = Math.round((completedFields / sections.length) * 100);

  return (
    <div className="space-y-5">
      {/* Progress indicator */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-muted-foreground tracking-widest">PREENCHIMENTO DO PLAYBOOK</span>
          <span className="text-xs font-mono font-bold text-primary">{completionPct}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-2">
          {completedFields} de {sections.length} seções preenchidas · Quanto mais completo, mais preciso o conteúdo gerado.
        </p>
      </div>

      {/* Fields */}
      {sections.map(section => {
        const value = data[section.key as keyof StrategyData] as string;
        const filled = value.trim().length > 0;
        return (
          <div key={section.key} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={cn(
                'flex items-center gap-1.5 text-[10px] font-bold tracking-widest',
                filled ? 'text-primary' : 'text-muted-foreground'
              )}>
                {section.icon}
                {section.label}
              </span>
              {filled && (
                <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary">✓</span>
              )}
            </div>
            <Textarea
              value={value}
              onChange={e => update(section.key as keyof StrategyData, e.target.value)}
              placeholder={section.placeholder}
              rows={section.rows}
              className="text-xs resize-none bg-muted/20 border-border/60 placeholder:text-muted-foreground/40 leading-relaxed"
            />
            <p className="text-[10px] text-muted-foreground/50 italic pl-0.5">
              💡 {section.hint}
            </p>
          </div>
        );
      })}

      {/* Documents section */}
      <div className="space-y-2 pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] font-bold text-muted-foreground tracking-widest">ARQUIVOS DE REFERÊNCIA</span>
          {data.docs.length > 0 && (
            <span className="rounded-full bg-muted/50 px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">{data.docs.length}</span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground/50 italic">
          Faça upload de decks, guides de marca, pesquisas, briefings ou qualquer referência relevante.
        </p>

        {/* Doc list */}
        {data.docs.length > 0 && (
          <div className="space-y-2">
            {data.docs.map(doc => (
              <div key={doc.id} className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
                <div className="flex-shrink-0">
                  {getFileIcon(doc.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{doc.name}</p>
                  <p className="text-[10px] text-muted-foreground/60">{formatBytes(doc.size)} · {new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {doc.type.startsWith('image/') && (
                    <button
                      onClick={() => setPreview(preview === doc.url ? null : doc.url)}
                      className="rounded p-1 hover:bg-muted transition-colors"
                      title="Visualizar"
                    >
                      <Eye className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded p-1 hover:bg-muted transition-colors"
                    title="Abrir"
                  >
                    <Download className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </a>
                  <button
                    onClick={() => handleDeleteDoc(doc)}
                    className="rounded p-1 hover:bg-destructive/20 transition-colors group"
                    title="Remover"
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground group-hover:text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Image preview */}
        {preview && (
          <div className="relative rounded-xl overflow-hidden border border-border">
            <img src={preview} alt="Preview" className="w-full object-contain max-h-48" />
            <button
              onClick={() => setPreview(null)}
              className="absolute top-2 right-2 rounded-full bg-black/60 p-1 hover:bg-black/80"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        )}

        {/* Upload button */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={e => handleFileUpload(e.target.files)}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !userId}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all py-3.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          {uploading
            ? <><span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Enviando...</>
            : <><PlusCircle className="h-3.5 w-3.5" /> Adicionar arquivo de referência</>
          }
        </button>
      </div>

      {/* Save button */}
      <Button
        onClick={handleSave}
        className={cn(
          'w-full h-11 text-sm font-bold rounded-xl transition-all',
          saved
            ? 'bg-green-600 hover:bg-green-600 text-white'
            : 'bg-primary hover:bg-primary/90 text-primary-foreground'
        )}
      >
        {saved ? <><Check className="h-4 w-4 mr-2" /> Playbook salvo</> : 'Salvar playbook estratégico'}
      </Button>
    </div>
  );
}

// ─── MediaLibraryPanel ────────────────────────────────────────────────────────

interface MediaLibraryPanelProps {
  userId: string | null;
  library: MediaItem[];
  onLibraryChange: () => void;
}

function MediaLibraryPanel({ userId, library, onLibraryChange }: MediaLibraryPanelProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [categorizingIds, setCategorizingIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || !userId) return;
    setUploading(true);

    const uploadedIds: string[] = [];

    for (const file of Array.from(files)) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast({ title: 'Formato inválido', description: `${file.name} não é JPG, PNG ou WEBP.`, variant: 'destructive' });
        continue;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast({ title: 'Arquivo muito grande', description: `${file.name} excede 20MB.`, variant: 'destructive' });
        continue;
      }

      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const uuid = crypto.randomUUID();
      const storagePath = `${userId}/${uuid}.${ext}`;

      // Upload to storage
      const { error: storageError } = await supabase.storage
        .from('media-library')
        .upload(storagePath, file, { contentType: file.type, upsert: false });

      if (storageError) {
        toast({ title: 'Erro no upload', description: storageError.message, variant: 'destructive' });
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('media-library').getPublicUrl(storagePath);
      const publicUrl = urlData.publicUrl;

      // Insert into media_library
      const { data: insertData, error: insertError } = await supabase
        .from('media_library')
        .insert({
          user_id: userId,
          url: publicUrl,
          filename: file.name,
          file_size: file.size,
        })
        .select('id')
        .single();

      if (insertError) {
        toast({ title: 'Erro ao salvar', description: insertError.message, variant: 'destructive' });
        continue;
      }

      uploadedIds.push(insertData.id);
    }

    setUploading(false);
    onLibraryChange();

    // Categorize uploaded images in background
    for (const mediaId of uploadedIds) {
      setCategorizingIds(prev => new Set([...prev, mediaId]));
      const item = library.find(i => i.id === mediaId);
      const url = item?.url;

      // Re-fetch to get the URL of newly uploaded items
      const { data: newItem } = await supabase
        .from('media_library')
        .select('url')
        .eq('id', mediaId)
        .single();

      if (newItem?.url) {
        supabase.functions.invoke('categorize-media', {
          body: { imageUrl: newItem.url, mediaId },
        }).then(({ error }) => {
          if (!error) {
            setCategorizingIds(prev => { const s = new Set(prev); s.delete(mediaId); return s; });
            onLibraryChange();
          }
        });
      }
    }

    if (uploadedIds.length > 0) {
      toast({ title: `${uploadedIds.length} imagem(ns) enviada(s) ✅`, description: 'Categorização automática em andamento...' });
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (!userId) return;

    // Extract storage path from URL
    const urlParts = item.url.split('/media-library/');
    const storagePath = urlParts[1];

    if (storagePath) {
      await supabase.storage.from('media-library').remove([storagePath]);
    }

    const { error } = await supabase.from('media_library').delete().eq('id', item.id);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
      return;
    }

    onLibraryChange();
    toast({ title: 'Imagem removida', description: item.filename });
  };

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={e => handleUpload(e.target.files)}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading || !userId}
        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all py-4 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
      >
        {uploading
          ? <><span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Enviando...</>
          : <><Upload className="h-4 w-4" /> Enviar imagens (JPG, PNG, WEBP)</>
        }
      </button>

      {/* Library grid */}
      {library.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Library className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Sua biblioteca está vazia</p>
          <p className="text-xs mt-1 opacity-60">Envie imagens para reutilizá-las nos carrosséis</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {library.map(item => {
            const isCategorizing = categorizingIds.has(item.id);
            const catColor = item.category ? CATEGORY_COLORS[item.category] ?? 'bg-muted/30 text-muted-foreground border-border' : '';

            return (
              <div key={item.id} className="group relative rounded-lg overflow-hidden border border-border">
                <div className="aspect-square relative">
                  <img
                    src={item.url}
                    alt={item.filename}
                    className="w-full h-full object-cover"
                  />
                  {/* Categorizing spinner */}
                  {isCategorizing && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-[9px] text-white font-medium">Analisando...</span>
                      </div>
                    </div>
                  )}
                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(item)}
                    className="absolute top-1 right-1 rounded-full bg-black/70 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/80"
                  >
                    <Trash2 className="h-2.5 w-2.5 text-white" />
                  </button>
                </div>
                {/* Metadata row */}
                <div className="px-1.5 py-1 bg-muted/30 space-y-0.5">
                  {item.category && (
                    <span className={cn('inline-flex text-[8px] font-bold px-1.5 py-0.5 rounded-full border', catColor)}>
                      {item.category}
                    </span>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <p className="text-[8px] text-muted-foreground/60 truncate">{item.tags.slice(0, 3).join(' · ')}</p>
                  )}
                  {!item.category && !isCategorizing && (
                    <span className="text-[8px] text-muted-foreground/40">sem categoria</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── AngleRecommendation ──────────────────────────────────────────────────────

function AngleRecommendation({ carousel }: { carousel: CarouselOutput }) {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-bold text-primary tracking-widest">RECOMENDAÇÃO ESTRATÉGICA · FEVEREIRO 2026</span>
      </div>
      <div className="text-lg font-bold text-foreground mb-1">
        ÂNGULO: {carousel.angleEmoji} {carousel.angle}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{carousel.angleRationale}</p>
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-xs text-muted-foreground">Alternativas consideradas:</span>
        {['RAIVA', 'DINHEIRO', 'ORGULHO', 'URGÊNCIA', 'ALÍVIO'].filter(a => a !== carousel.angle).map(a => (
          <span key={a} className="text-xs text-muted-foreground/60 font-mono">· {a}</span>
        ))}
      </div>
    </div>
  );
}

// ─── HTML Exporter ────────────────────────────────────────────────────────────

function exportCarouselHTML(carousel: CarouselOutput, slideImages: Record<number, string>) {
  const slidesHTML = carousel.slides.map(slide => {
    const bg = BG_COLORS[slide.bgStyle] ?? SLIDE_BG;
    const isData = slide.layout === 'number-dominant';
    const isCTA = slide.layout === 'cta-clean';
    const imgUrl = slideImages[slide.number];

    const promptSection = slide.needsMedia && (slide.imagePrompt || slide.veoPrompt) ? `
      <div class="prompt-box">
        ${slide.mediaType === 'photo' && slide.imagePrompt ? `
          <div class="prompt-label">📸 PROMPT IMAGEM</div>
          <pre class="prompt-text">${slide.imagePrompt.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        ` : ''}
        ${slide.mediaType === 'video' && slide.veoPrompt ? `
          <div class="prompt-label">🎬 PROMPT VEO 3.1</div>
          <pre class="prompt-text">${slide.veoPrompt.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        ` : ''}
      </div>
    ` : '';

    const headlineHTML = slide.headlineHighlight && slide.headline.toLowerCase().includes((slide.headlineHighlight ?? '').toLowerCase())
      ? slide.headline.replace(new RegExp(`(${slide.headlineHighlight})`, 'gi'), '<span class="highlight">$1</span>')
      : slide.headline;

    const bgImageStyle = imgUrl
      ? `background-image: url(${imgUrl}); background-size: cover; background-position: center;`
      : '';

    return `
    <div class="slide-section">
      <div class="slide-frame" style="background:${bg}; ${bgImageStyle}">
        ${imgUrl ? `<div class="img-overlay"></div>` : ''}
        <div class="slide-label">${String(slide.number).padStart(2, '0')} · ${TYPE_LABELS[slide.type] ?? slide.type.toUpperCase()}</div>
        <div class="slide-content ${isCTA ? 'cta-content' : ''}">
          <div class="${isData ? 'headline-data' : 'headline'}">${headlineHTML}</div>
          ${slide.subtext ? `<div class="subtext">${slide.subtext}</div>` : ''}
        </div>
        <div class="watermark">DQEF</div>
      </div>
      <div class="slide-meta">
        <div class="meta-label">→ LÓGICA</div>
        <div class="meta-text">${slide.logic}</div>
        <div class="meta-label" style="margin-top:8px;">🎨 DIREÇÃO VISUAL</div>
        <div class="meta-text">${slide.visualDirection}</div>
      </div>
      ${promptSection}
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${carousel.title} · DQEF</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #1a1a1a; color: #FFFFFF; font-family: 'Montserrat', sans-serif; min-height: 100vh; }
  .topbar { background: #E8603C; padding: 12px 32px; display: flex; align-items: center; justify-content: space-between; }
  .topbar-brand { font-family: 'Montserrat', sans-serif; font-size: 18px; font-weight: 900; color: #FFFFFF; letter-spacing: 0.15em; }
  .topbar-meta { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.7); letter-spacing: 0.1em; }
  .container { max-width: 680px; margin: 0 auto; padding: 40px 24px; }
  .carousel-title { font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: 36px; color: #FFFFFF; letter-spacing: -0.02em; line-height: 1; margin-bottom: 8px; text-transform: uppercase; }
  .carousel-meta { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #888; letter-spacing: 0.1em; margin-bottom: 6px; }
  .viral-logic { font-size: 12px; color: #aaa; line-height: 1.5; margin-bottom: 32px; padding: 12px 16px; border-left: 3px solid #E8603C; background: rgba(232,96,60,0.08); }
  .slide-section { margin-bottom: 40px; }
  .slide-frame { aspect-ratio: 4/5; width: 100%; border-radius: 10px; position: relative; display: flex; flex-direction: column; justify-content: flex-end; padding: 20px; overflow: hidden; background: #E8603C; }
  .img-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.05) 100%); }
  .slide-label { position: absolute; top: 14px; left: 16px; font-family: 'Montserrat', sans-serif; font-size: 9px; font-weight: 800; color: rgba(255,255,255,0.9); letter-spacing: 0.14em; z-index: 2; }
  .slide-content { position: relative; z-index: 2; }
  .cta-content { text-align: center; align-self: center; width: 100%; }
  .headline { font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: clamp(26px, 7vw, 38px); color: #FFFFFF; line-height: 1.08; letter-spacing: -0.01em; white-space: pre-line; text-transform: uppercase; }
  .headline-data { font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: clamp(64px, 18vw, 100px); color: #FFFFFF; line-height: 0.9; letter-spacing: -0.03em; text-transform: uppercase; }
  .highlight { background: rgba(255,255,255,0.22); border-radius: 2px; padding: 0 3px; color: #FFFFFF; }
  .subtext { font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: 12px; color: rgba(255,255,255,0.75); margin-top: 10px; letter-spacing: 0.03em; line-height: 1.45; }
  .watermark { position: absolute; bottom: 10px; right: 12px; font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 8px; color: rgba(255,255,255,0.25); letter-spacing: 0.2em; z-index: 2; }
  .slide-meta { background: #111; border-radius: 0 0 8px 8px; padding: 14px 16px; border: 1px solid #1e1e1e; border-top: none; }
  .meta-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700; color: #E8603C; letter-spacing: 0.15em; margin-bottom: 4px; }
  .meta-text { font-size: 11px; color: #777; line-height: 1.5; }
  .prompt-box { background: #0A0A0A; border: 1px solid #1e1e1e; border-radius: 6px; padding: 14px; margin-top: 12px; }
  .prompt-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700; color: #4A9EFF; letter-spacing: 0.15em; margin-bottom: 8px; }
  .prompt-text { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #999; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
  .caption-section { background: #111; border: 1px solid #1e1e1e; border-radius: 8px; padding: 20px; margin-top: 40px; }
  .caption-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #E8603C; letter-spacing: 0.15em; margin-bottom: 10px; }
  .caption-text { font-size: 13px; color: #ccc; line-height: 1.7; white-space: pre-line; }
  .footer { text-align: center; padding: 40px 0 20px; font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #333; letter-spacing: 0.15em; }
  hr { border: none; border-top: 1px solid #1a1a1a; margin: 32px 0; }
</style>
</head>
<body>
<div class="topbar">
  <div class="topbar-brand">DQEF · AI CARROSSÉIS</div>
  <div class="topbar-meta">GERADO EM ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).toUpperCase()} · ${carousel.angle} ${carousel.angleEmoji}</div>
</div>
<div class="container">
  <div class="carousel-title">${carousel.title}</div>
  <div class="carousel-meta">ÂNGULO: ${carousel.angleEmoji} ${carousel.angle} · PERFIL: ${carousel.targetProfile} · CANAL: ${carousel.channel}</div>
  <div class="carousel-meta" style="margin-top:4px;">⏰ ${carousel.bestTime}</div>
  <div class="viral-logic"><strong>→ LÓGICA VIRAL:</strong> ${carousel.viralLogic}</div>
  ${slidesHTML}
  <hr>
  <div class="caption-section">
    <div class="caption-label">CAPTION PARA COPIAR</div>
    <div class="caption-text">${carousel.caption.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
  </div>
  <div class="footer">DQEF · DEIXA QUE EU FAÇO · FLORIANÓPOLIS · ${new Date().getFullYear()}</div>
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dqef-carrossel-${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AiCarrosseis() {
  const { toast } = useToast();
  const [context, setContext] = useState('');
  const [angle, setAngle] = useState('');
  const [persona, setPersona] = useState('');
  const [channel, setChannel] = useState('Instagram Feed');
  const [tone, setTone] = useState('Peer-to-peer');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ carousel: CarouselOutput; autonomous: boolean } | null>(null);

  // Per-slide image state
  const [slideImages, setSlideImages] = useState<Record<number, string>>({});
  const [generatingImage, setGeneratingImage] = useState<Record<number, boolean>>({});

  // Media library state
  const [library, setLibrary] = useState<MediaItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch current user id
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // Fetch library
  const fetchLibrary = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('media_library')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error && data) setLibrary(data as MediaItem[]);
  }, [userId]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    setSlideImages({});
    try {
      // Inject strategy meta-fields if available
      let strategyContext = '';
      try {
        const raw = localStorage.getItem('dqef_strategy_metafields_v1');
        if (raw) {
          const mf = JSON.parse(raw);
          strategyContext = mf.promptContext || '';
        }
      } catch { /* ignore */ }

      const { data, error } = await supabase.functions.invoke('generate-carousel-visual', {
        body: { context, angle, persona, channel, tone, strategyContext },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: 'Erro na geração', description: data.error, variant: 'destructive' });
        return;
      }
      setResult(data);
      toast({ title: 'Carrossel gerado! ✅', description: `${data.carousel.slides.length} lâminas prontas.` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro', description: 'Falha ao gerar carrossel. Tente novamente.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = useCallback(async (slideNumber: number, prompt: string, quality: 'fast' | 'high') => {
    setGeneratingImage(prev => ({ ...prev, [slideNumber]: true }));
    try {
      const { data, error } = await supabase.functions.invoke('generate-slide-image', {
        body: { imagePrompt: prompt, quality },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: 'Erro na imagem', description: data.error, variant: 'destructive' });
        return;
      }
      if (data?.imageUrl) {
        setSlideImages(prev => ({ ...prev, [slideNumber]: data.imageUrl }));
        toast({ title: `Imagem gerada ✅`, description: `Lâmina ${slideNumber} atualizada.` });
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro', description: 'Falha ao gerar imagem. Tente novamente.', variant: 'destructive' });
    } finally {
      setGeneratingImage(prev => ({ ...prev, [slideNumber]: false }));
    }
  }, [toast]);

  const handleClearImage = useCallback((slideNumber: number) => {
    setSlideImages(prev => {
      const next = { ...prev };
      delete next[slideNumber];
      return next;
    });
  }, []);

  const handleApplyLibraryImage = useCallback((slideNumber: number, url: string) => {
    setSlideImages(prev => ({ ...prev, [slideNumber]: url }));
    toast({ title: 'Imagem aplicada ✅', description: `Lâmina ${slideNumber} atualizada com imagem da biblioteca.` });
  }, [toast]);

  return (
    <div className="h-full overflow-y-auto">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');
      `}</style>

      <div className="p-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">AI Carrosséis</h1>
            <p className="text-sm text-muted-foreground">Gere carrosséis completos com arte visual, copy e prompts de imagem por lâmina</p>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 xl:grid-cols-[380px,1fr] gap-6">

          {/* ── LEFT: Briefing + Biblioteca tabs ── */}
          <div className="space-y-4">
            <Tabs defaultValue="briefing">
              <TabsList className="w-full grid grid-cols-3 mb-4">
                <TabsTrigger value="briefing">Briefing</TabsTrigger>
                <TabsTrigger value="estrategia" className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Estratégia
                </TabsTrigger>
                <TabsTrigger value="biblioteca" className="flex items-center gap-1.5">
                  Biblioteca
                  {library.length > 0 && (
                    <span className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold min-w-[16px] h-4 px-1">
                      {library.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* ── BRIEFING TAB ── */}
              <TabsContent value="briefing">
                <div className="rounded-xl border border-border bg-card p-5 space-y-5">
                  <div>
                    <p className="text-xs font-bold text-primary tracking-widest mb-3">CONTEXTO ESTRATÉGICO</p>
                    <Textarea
                      placeholder="Descreva a ideia, ângulo ou deixe em branco para a IA criar do zero..."
                      value={context}
                      onChange={e => setContext(e.target.value)}
                      className="min-h-[90px] text-sm resize-none bg-muted/30 border-border/60"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                      <Wand2 className="h-3 w-3" />
                      Se vazio, a IA escolhe o ângulo estratégico ideal agora
                    </p>
                  </div>

                  {/* Angle */}
                  <div>
                    <p className="text-xs font-bold text-muted-foreground tracking-widest mb-2.5">ÂNGULO</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {ANGLES.map(a => (
                        <button
                          key={a.id}
                          onClick={() => setAngle(a.id)}
                          className={cn(
                            'rounded-lg border px-2.5 py-2 text-xs font-semibold transition-all',
                            angle === a.id
                              ? 'bg-primary/15 border-primary text-primary'
                              : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
                          )}
                        >
                          {a.emoji} {a.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Persona */}
                  <div>
                    <p className="text-xs font-bold text-muted-foreground tracking-widest mb-2.5">PERFIL-ALVO</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PERSONAS.map(p => (
                        <button
                          key={p}
                          onClick={() => setPersona(persona === p ? '' : p)}
                          className={cn(
                            'rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all text-left',
                            persona === p
                              ? 'bg-primary/15 border-primary text-primary'
                              : 'border-border text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Channel */}
                  <div>
                    <p className="text-xs font-bold text-muted-foreground tracking-widest mb-2.5">CANAL</p>
                    <div className="flex flex-wrap gap-1.5">
                      {CHANNELS.map(c => (
                        <button
                          key={c}
                          onClick={() => setChannel(c)}
                          className={cn(
                            'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                            channel === c
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-border text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tone */}
                  <div>
                    <p className="text-xs font-bold text-muted-foreground tracking-widest mb-2.5">TOM</p>
                    <div className="flex flex-wrap gap-1.5">
                      {TONES.map(t => (
                        <button
                          key={t}
                          onClick={() => setTone(t)}
                          className={cn(
                            'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                            tone === t
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-border text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Generate button */}
                  <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Gerando carrossel...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Wand2 className="h-4 w-4" />
                        Gerar Carrossel
                      </span>
                    )}
                  </Button>
                </div>
              </TabsContent>

              {/* ── ESTRATÉGIA TAB ── */}
              <TabsContent value="estrategia">
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="rounded-lg bg-primary/10 p-1.5">
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Playbook Estratégico</p>
                      <p className="text-[10px] text-muted-foreground">Contexto que alimenta a IA em todas as gerações</p>
                    </div>
                  </div>
                  <StrategicPanel />
                </div>
              </TabsContent>

              {/* ── BIBLIOTECA TAB ── */}
              <TabsContent value="biblioteca">
                <div className="rounded-xl border border-border bg-card p-5">
                  <MediaLibraryPanel
                    userId={userId}
                    library={library}
                    onLibraryChange={fetchLibrary}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* ── RIGHT: Output ── */}
          <div>
            {!result && !loading && (
              <div className="h-full min-h-[400px] rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-3 text-center p-8">
                <div className="rounded-2xl bg-primary/10 p-4">
                  <Layers className="h-8 w-8 text-primary/60" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">Nenhum carrossel gerado ainda</p>
                  <p className="text-sm text-muted-foreground max-w-xs">Preencha o briefing ao lado ou deixe em branco — a IA escolhe o ângulo estratégico ideal para Fevereiro 2026.</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="space-y-4">
                <div className="h-24 rounded-xl bg-muted/30 animate-pulse" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="rounded-xl bg-muted/20 animate-pulse" style={{ aspectRatio: '4/5' }} />
                  ))}
                </div>
              </div>
            )}

            {result && !loading && (
              <div>
                {result.autonomous && <AngleRecommendation carousel={result.carousel} />}

                <div className="mb-5">
                  <h2 className="text-2xl font-black tracking-tight text-foreground mb-2 uppercase" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900 }}>
                    {result.carousel.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground font-mono mb-2">
                    <span>ÂNGULO: {result.carousel.angleEmoji} {result.carousel.angle}</span>
                    <span>·</span>
                    <span>PERFIL: {result.carousel.targetProfile}</span>
                    <span>·</span>
                    <span>CANAL: {result.carousel.channel}</span>
                    <span>·</span>
                    <span>⏰ {result.carousel.bestTime}</span>
                  </div>
                  <div className="text-xs text-muted-foreground border-l-2 border-primary pl-3">
                    <span className="font-semibold text-primary">→ LÓGICA VIRAL:</span> {result.carousel.viralLogic}
                  </div>
                </div>

                {/* Slides grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 mb-6">
                  {result.carousel.slides.map(slide => (
                    <SlideCard
                      key={slide.number}
                      slide={slide}
                      imageUrl={slideImages[slide.number]}
                      isGenerating={generatingImage[slide.number]}
                      onGenerateImage={handleGenerateImage}
                      onClearImage={handleClearImage}
                      onApplyLibraryImage={handleApplyLibraryImage}
                      mediaLibraryCount={library.length}
                      userId={userId}
                      onLibraryChange={fetchLibrary}
                    />
                  ))}
                </div>

                {/* Caption + actions */}
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-primary tracking-widest">CAPTION</p>
                    <CopyButton text={result.carousel.caption} label="Copiar caption" />
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {result.carousel.caption}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const allText = result.carousel.slides.map(s =>
                          `SLIDE ${s.number} — ${TYPE_LABELS[s.type]}:\n${s.headline}\n${s.subtext ?? ''}\n→ LÓGICA: ${s.logic}`
                        ).join('\n\n');
                        navigator.clipboard.writeText(allText);
                        toast({ title: 'Copiado!', description: 'Todo o roteiro copiado.' });
                      }}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      Copiar tudo
                    </Button>
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => exportCarouselHTML(result.carousel, slideImages)}
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Exportar HTML
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
