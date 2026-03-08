import { useState, useRef, useCallback } from 'react';
import { Wand2, Download, Upload, Trash2, ChevronDown, ChevronUp, Image, Loader2, RefreshCw, Minimize2, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toPng } from 'html-to-image';
import NarrativeSlidePreview, { type NarrativeSlide, type NarrativeThemeId } from './NarrativeSlidePreview';
import type { CreativeFormat } from '@/pages/AiCarrosseis';

const TYPE_LABELS: Record<string, string> = {
  hook: 'GANCHO', context: 'CONTEXTO', data: 'DADOS', tension: 'TENSÃO',
  pivot: 'VIRADA', proof: 'PROVA', evidence: 'EVIDÊNCIA', insight: 'INSIGHT', cta: 'CTA',
};

const TYPE_COLORS: Record<string, string> = {
  hook: 'bg-red-500/20 text-red-400',
  context: 'bg-blue-500/20 text-blue-400',
  data: 'bg-yellow-500/20 text-yellow-400',
  tension: 'bg-orange-500/20 text-orange-400',
  pivot: 'bg-purple-500/20 text-purple-400',
  proof: 'bg-green-500/20 text-green-400',
  evidence: 'bg-cyan-500/20 text-cyan-400',
  insight: 'bg-indigo-500/20 text-indigo-400',
  cta: 'bg-primary/20 text-primary',
};

interface NarrativeSlideCardProps {
  slide: NarrativeSlide;
  imageUrl?: string;
  isGenerating?: boolean;
  onGenerateImage: (slideNumber: number, prompt: string, quality: 'fast' | 'high') => void;
  onClearImage: (slideNumber: number) => void;
  onApplyImage: (slideNumber: number, url: string) => void;
  userId: string | null;
  format?: CreativeFormat;
  textScale?: number;
  imageOpacity?: number;
  themeId?: NarrativeThemeId;
  headlineScale?: number;
  imageScale?: number;
  imageOffsetY?: number;
}

export default function NarrativeSlideCard({
  slide, imageUrl, isGenerating, onGenerateImage, onClearImage, onApplyImage,
  userId, format, textScale = 1, imageOpacity = 0.85, themeId = 'editorial-dark',
  headlineScale = 1, imageScale = 1, imageOffsetY = 0,
}: NarrativeSlideCardProps) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [editableHeadline, setEditableHeadline] = useState(slide.headline);
  const [editableBody, setEditableBody] = useState(slide.bodyText || '');
  const [customPrompt, setCustomPrompt] = useState('');
  const [translatedPrompt, setTranslatedPrompt] = useState('');
  const [translating, setTranslating] = useState(false);
  const [imageInstruction, setImageInstruction] = useState('');
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displaySlide: NarrativeSlide = {
    ...slide,
    headline: editableHeadline,
    bodyText: editableBody || null,
  };

  const hasImage = !!imageUrl;
  const basePrompt = slide.imagePrompt || `Editorial photography for storytelling carousel. Slide headline: "${slide.headline}". Documentary style, natural light, high contrast. No text, no overlays. Shot on Canon R5, 35mm f/2.8.`;

  const buildImagePrompt = () => {
    if (translatedPrompt.trim()) return translatedPrompt.trim();
    if (!imageInstruction.trim()) return basePrompt;
    return `${basePrompt}\n\nADJUSTMENT: ${imageInstruction.trim()}`;
  };

  const handleTranslateAndGenerate = async () => {
    if (!customPrompt.trim()) return;
    setTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-router', {
        body: {
          task_type: 'classify',
          messages: [
            { role: 'system', content: 'You are a translator. Translate the following text to English. Output ONLY the translated text. The text is an image generation prompt for AI art.' },
            { role: 'user', content: customPrompt.trim() },
          ],
        },
      });
      if (error) throw error;
      const translated = data?.choices?.[0]?.message?.content?.trim() || customPrompt.trim();
      setTranslatedPrompt(translated);
      onGenerateImage(slide.number, translated, 'fast');
    } catch {
      setTranslatedPrompt(customPrompt.trim());
      onGenerateImage(slide.number, customPrompt.trim(), 'fast');
    } finally {
      setTranslating(false);
    }
  };

  const handleExport = async () => {
    const fmt = format || { width: 1080, height: 1350, ratio: '4:5', id: 'ig-feed-4x5', label: 'Feed 4:5', platform: 'Instagram', safeZone: { top: 90, right: 90, bottom: 90, left: 90 } };
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;z-index:-1;';
    document.body.appendChild(container);

    const { createRoot } = await import('react-dom/client');
    const root = createRoot(container);
    setExporting(true);

    await new Promise<void>(resolve => {
      root.render(
        <NarrativeSlidePreview
          slide={displaySlide}
          imageUrl={imageUrl}
          format={fmt as CreativeFormat}
          exportMode
          textScale={textScale}
          imageOpacity={imageOpacity}
          themeId={themeId}
          headlineScale={headlineScale}
          imageScale={imageScale}
          imageOffsetY={imageOffsetY}
          slideRef={exportRef}
        />
      );
      setTimeout(resolve, 400);
    });

    try {
      const node = container.firstElementChild as HTMLElement;
      if (!node) throw new Error('No render');
      const png = await toPng(node, { width: fmt.width, height: fmt.height, pixelRatio: 1 });
      const a = document.createElement('a');
      a.href = png;
      a.download = `narrativa-slide-${String(slide.number).padStart(2, '0')}-${fmt.width}x${fmt.height}.png`;
      a.click();
      toast({ title: `PNG ${fmt.width}×${fmt.height}px exportado ✅` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro no export', variant: 'destructive' });
    } finally {
      root.unmount();
      document.body.removeChild(container);
      setExporting(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    const path = `${userId}/narrative-${Date.now()}-${slide.number}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('media-library').upload(path, file, { contentType: file.type });
    if (!error) {
      const { data } = supabase.storage.from('media-library').getPublicUrl(path);
      onApplyImage(slide.number, data.publicUrl);
    } else {
      toast({ title: 'Erro no upload', description: error.message, variant: 'destructive' });
    }
    e.target.value = '';
  };

  const applyLessText = () => {
    const words = editableHeadline.split(' ');
    const keep = Math.max(2, Math.ceil(words.length * 0.6));
    setEditableHeadline(words.slice(0, keep).join(' '));
  };

  const applyChangeApproach = () => {
    const approaches = [
      (h: string) => `E SE ${h}?`,
      (h: string) => `${h.split(' ')[0]} QUE NINGUÉM TE CONTOU`,
      (h: string) => `PARE. ${h}.`,
      (h: string) => `A VERDADE SOBRE ${h}`,
    ];
    const idx = editableHeadline.length % approaches.length;
    setEditableHeadline(approaches[idx](slide.headline));
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card flex flex-col">

      {/* ── Slide preview ── */}
      <div className="p-3">
        <NarrativeSlidePreview
          slide={displaySlide}
          imageUrl={imageUrl}
          format={format}
          textScale={textScale}
          imageOpacity={imageOpacity}
          themeId={themeId}
          headlineScale={headlineScale}
          imageScale={imageScale}
          imageOffsetY={imageOffsetY}
        />
      </div>

      {/* ── Quick actions bar ── */}
      <div className="px-3 pb-2 flex items-center gap-1.5">
        <button onClick={applyLessText}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium border border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-all"
          title="Reduzir texto">
          <Minimize2 className="h-2.5 w-2.5" /> Menos
        </button>
        <button onClick={applyChangeApproach}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium border border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-all"
          title="Mudar abordagem">
          <Shuffle className="h-2.5 w-2.5" /> Mudar
        </button>
        <div className="flex items-center gap-1 ml-auto">
          <span className={cn('text-[8px] font-bold px-1.5 py-0.5 rounded', TYPE_COLORS[slide.type] || 'bg-muted text-muted-foreground')}>
            {TYPE_LABELS[slide.type] || slide.type.toUpperCase()}
          </span>
          <span className="text-[9px] text-muted-foreground/50 font-mono">{slide.layout}</span>
        </div>
        <button onClick={handleExport} disabled={exporting}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium border border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-all disabled:opacity-40"
          title="Baixar PNG">
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
          value={editableHeadline}
          onChange={e => setEditableHeadline(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-border bg-muted/20 px-2 py-1.5 text-xs text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 font-bold uppercase tracking-wide"
          placeholder="Headline..."
        />
        <textarea
          value={editableBody}
          onChange={e => setEditableBody(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-border bg-muted/20 px-2 py-1.5 text-xs text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/40"
          placeholder="Body text — use **negrito** para destaques"
        />
      </div>

      {/* ── Image section ── */}
      <div className="px-3 pb-3 space-y-2 border-t border-border pt-2.5">
        <p className="text-[9px] font-bold text-muted-foreground/60 tracking-[0.15em] uppercase">Imagem de fundo</p>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

        {/* Custom prompt PT→EN */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 space-y-2">
          <p className="text-[9px] font-bold text-primary tracking-[0.15em] uppercase flex items-center gap-1">
            <Wand2 className="h-3 w-3" /> Prompt personalizado (PT→EN)
          </p>
          <textarea
            value={customPrompt}
            onChange={e => { setCustomPrompt(e.target.value); setTranslatedPrompt(''); }}
            rows={2}
            className="w-full rounded-md border border-primary/20 bg-card px-2 py-1.5 text-xs text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/40"
            placeholder='Ex: "Pessoa trabalhando com celular, luz natural dourada, estilo documental"'
          />
          {translatedPrompt && (
            <div className="rounded-md bg-muted/30 px-2 py-1.5">
              <p className="text-[8px] font-bold text-muted-foreground/50 uppercase mb-0.5">Tradução:</p>
              <p className="text-[10px] text-muted-foreground leading-snug italic">{translatedPrompt}</p>
            </div>
          )}
          <button onClick={handleTranslateAndGenerate}
            disabled={isGenerating || translating || !customPrompt.trim()}
            className={cn(
              'w-full flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all border',
              (isGenerating || translating || !customPrompt.trim())
                ? 'border-border text-muted-foreground cursor-not-allowed'
                : 'border-primary bg-primary/15 text-primary hover:bg-primary/25'
            )}>
            {translating
              ? <><span className="h-3 w-3 border border-current border-t-transparent rounded-full animate-spin" /> Traduzindo...</>
              : isGenerating
                ? <><span className="h-3 w-3 border border-current border-t-transparent rounded-full animate-spin" /> Gerando...</>
                : <><Wand2 className="h-3 w-3" /> Traduzir e Gerar</>}
          </button>
        </div>

        {/* Quick instruction */}
        <textarea
          value={imageInstruction}
          onChange={e => setImageInstruction(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-border bg-muted/20 px-2 py-1.5 text-xs text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/40"
          placeholder='Ajuste rápido: "luz dourada", "ângulo de baixo"...'
        />

        {/* Generate buttons */}
        <div className="flex gap-1.5">
          <button onClick={() => onGenerateImage(slide.number, buildImagePrompt(), 'fast')}
            disabled={isGenerating || translating}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border',
              (isGenerating || translating)
                ? 'border-border text-muted-foreground cursor-not-allowed'
                : hasImage ? 'border-border text-muted-foreground hover:bg-muted/30' : 'border-primary/50 text-primary hover:bg-primary/10'
            )}>
            {isGenerating
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : hasImage ? <RefreshCw className="h-3 w-3" /> : <Image className="h-3 w-3" />}
            {isGenerating ? 'Gerando...' : hasImage ? 'Trocar' : 'Gerar'}
          </button>
          <button onClick={() => onGenerateImage(slide.number, buildImagePrompt(), 'high')}
            disabled={isGenerating || translating}
            className="rounded-lg px-3 py-1.5 text-xs font-bold border border-border text-muted-foreground hover:bg-muted/30 disabled:opacity-40"
            title="Alta qualidade">
            HQ
          </button>
        </div>

        {/* Upload */}
        <button onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border border-border text-muted-foreground hover:bg-muted/30 hover:text-foreground">
          <Upload className="h-3 w-3" /> Inserir imagem
        </button>

        {hasImage && (
          <button onClick={() => onClearImage(slide.number)}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border border-destructive/30 text-destructive/70 hover:bg-destructive/10">
            <Trash2 className="h-3 w-3" /> Tirar imagem
          </button>
        )}
      </div>

      {/* ── Expanded: image prompt + source ── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/20 transition-colors border-t border-border/50"
      >
        <span className="tracking-widest uppercase font-medium">Prompt IA · Fonte</span>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {slide.imagePrompt && (
            <div>
              <label className="text-[9px] font-bold text-muted-foreground/60 tracking-widest uppercase">Prompt IA (original)</label>
              <p className="mt-1 text-[10px] font-mono text-muted-foreground/70 bg-muted/20 rounded px-2 py-1.5 leading-snug">
                {slide.imagePrompt}
              </p>
            </div>
          )}
          {slide.sourceLabel && (
            <div className="text-[10px] text-muted-foreground">
              <span className="font-bold text-primary">Fonte:</span> {slide.sourceLabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
