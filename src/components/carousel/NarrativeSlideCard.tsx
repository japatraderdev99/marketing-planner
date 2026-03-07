import { useState, useRef, useCallback } from 'react';
import { Wand2, Download, Upload, Trash2, ChevronDown, ChevronUp, Image, Copy, Check, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toPng } from 'html-to-image';
import NarrativeSlidePreview, { type NarrativeSlide } from './NarrativeSlidePreview';
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
  themeId?: 'editorial-dark' | 'editorial-cream' | 'brand-bold';
}

export default function NarrativeSlideCard({
  slide, imageUrl, isGenerating, onGenerateImage, onClearImage, onApplyImage,
  userId, format, textScale = 1, imageOpacity = 0.85, themeId = 'editorial-dark',
}: NarrativeSlideCardProps) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [editableHeadline, setEditableHeadline] = useState(slide.headline);
  const [editableBody, setEditableBody] = useState(slide.bodyText || '');
  const [customPrompt, setCustomPrompt] = useState('');
  const exportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync editable with props
  const displaySlide: NarrativeSlide = {
    ...slide,
    headline: editableHeadline,
    bodyText: editableBody || null,
  };

  const handleExport = async () => {
    const fmt = format || { width: 1080, height: 1350, ratio: '4:5', id: 'ig-feed-4x5', label: 'Feed 4:5', platform: 'Instagram', safeZone: { top: 90, right: 90, bottom: 90, left: 90 } };
    // Render off-screen at full resolution
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;z-index:-1;';
    document.body.appendChild(container);

    const { createRoot } = await import('react-dom/client');
    const root = createRoot(container);

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
          slideRef={exportRef}
        />
      );
      setTimeout(resolve, 300);
    });

    try {
      const node = container.firstElementChild as HTMLElement;
      if (!node) throw new Error('No render');
      const png = await toPng(node, { width: fmt.width, height: fmt.height, pixelRatio: 1 });
      const a = document.createElement('a');
      a.href = png;
      a.download = `narrativa-slide-${slide.number}-${fmt.width}x${fmt.height}.png`;
      a.click();
      toast({ title: `Slide ${slide.number} exportado ✅` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro no export', variant: 'destructive' });
    } finally {
      root.unmount();
      document.body.removeChild(container);
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

  const prompt = customPrompt || slide.imagePrompt || '';

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Preview */}
      <NarrativeSlidePreview
        slide={displaySlide}
        imageUrl={imageUrl}
        format={format}
        textScale={textScale}
        imageOpacity={imageOpacity}
        themeId={themeId}
      />

      {/* Controls */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground">#{slide.number}</span>
            <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', TYPE_COLORS[slide.type] || 'bg-muted text-muted-foreground')}>
              {TYPE_LABELS[slide.type] || slide.type.toUpperCase()}
            </span>
            <span className="text-[9px] text-muted-foreground/60">{slide.layout}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleExport} className="p-1 rounded hover:bg-muted transition-colors" title="Exportar PNG">
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button onClick={() => setExpanded(!expanded)} className="p-1 rounded hover:bg-muted transition-colors">
              {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
          </div>
        </div>

        {/* Image actions */}
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-7 text-[10px]"
            disabled={isGenerating || !prompt}
            onClick={() => onGenerateImage(slide.number, prompt, 'fast')}
          >
            {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
            <span className="ml-1">{isGenerating ? 'Gerando...' : 'Gerar'}</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[10px]"
            disabled={isGenerating || !prompt}
            onClick={() => onGenerateImage(slide.number, prompt, 'high')}
            title="Alta qualidade"
          >
            HQ
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-3 w-3" />
          </Button>
          {imageUrl && (
            <Button size="sm" variant="outline" className="h-7 text-[10px] text-red-400 border-red-500/30" onClick={() => onClearImage(slide.number)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

        {/* Expanded edit section */}
        {expanded && (
          <div className="space-y-2 pt-2 border-t border-border">
            <div>
              <label className="text-[9px] font-bold text-muted-foreground/60 tracking-widest uppercase">Headline</label>
              <textarea
                value={editableHeadline}
                onChange={e => setEditableHeadline(e.target.value)}
                className="w-full mt-1 rounded border border-border bg-muted/30 px-2 py-1.5 text-xs resize-none"
                rows={2}
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-muted-foreground/60 tracking-widest uppercase">Body Text</label>
              <textarea
                value={editableBody}
                onChange={e => setEditableBody(e.target.value)}
                className="w-full mt-1 rounded border border-border bg-muted/30 px-2 py-1.5 text-xs resize-none"
                rows={3}
                placeholder="Use **negrito** para destaques"
              />
            </div>
            {slide.imagePrompt && (
              <div>
                <label className="text-[9px] font-bold text-muted-foreground/60 tracking-widest uppercase">Prompt de Imagem</label>
                <textarea
                  value={customPrompt || slide.imagePrompt}
                  onChange={e => setCustomPrompt(e.target.value)}
                  className="w-full mt-1 rounded border border-border bg-muted/30 px-2 py-1.5 text-[10px] font-mono resize-none"
                  rows={3}
                />
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
    </div>
  );
}
