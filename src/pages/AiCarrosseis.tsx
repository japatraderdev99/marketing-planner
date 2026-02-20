import { useState, useRef, useCallback } from 'react';
import { Layers, Wand2, Copy, Check, Download, ChevronDown, ChevronUp, ImageIcon, Video, Zap, RefreshCw, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toPng } from 'html-to-image';

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

const SLIDE_BG = '#E8603C'; // Laranja DQEF — caixa de texto recortável

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

  // Render headline with highlight
  const renderHeadline = (headline: string, highlight?: string) => {
    if (!highlight || !headline.toLowerCase().includes(highlight.toLowerCase())) {
      return <span style={{ color: '#FFFFFF' }}>{headline}</span>;
    }
    const idx = headline.toLowerCase().indexOf(highlight.toLowerCase());
    const before = headline.slice(0, idx);
    const word = headline.slice(idx, idx + highlight.length);
    const after = headline.slice(idx + highlight.length);
    return (
      <>
        {before && <span style={{ color: '#FFFFFF' }}>{before}</span>}
        <span style={{ color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: '2px', padding: '0 3px' }}>{word}</span>
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
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Background image overlay when image is generated */}
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
          {/* Gradient for text legibility */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.05) 100%)',
            zIndex: 1,
          }} />
        </>
      )}

      {/* Slide number + type */}
      <div style={{
        position: 'absolute',
        top: '14px',
        left: '16px',
        fontFamily: 'Montserrat, sans-serif',
        fontSize: '10px',
        fontWeight: 800,
        color: '#FFFFFF',
        letterSpacing: '0.12em',
        lineHeight: 1,
        opacity: 0.9,
        zIndex: 10,
      }}>
        {String(slide.number).padStart(2, '0')} · {TYPE_LABELS[slide.type] ?? slide.type.toUpperCase()}
      </div>

      {/* CTA Layout */}
      {isCTA && (
        <div style={{ textAlign: 'center', width: '100%', position: 'relative', zIndex: 10 }}>
          <div style={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '11px',
            fontWeight: 900,
            color: '#FFFFFF',
            letterSpacing: '0.3em',
            marginBottom: '12px',
            opacity: 0.7,
          }}>DQEF</div>
          <div style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 900,
            fontSize: 'clamp(22px, 6vw, 32px)',
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
              fontSize: '11px',
              color: 'rgba(255,255,255,0.75)',
              letterSpacing: '0.06em',
            }}>{slide.subtext}</div>
          )}
        </div>
      )}

      {/* Data/Number dominant layout */}
      {isDataSlide && !isCTA && (
        <div style={{ width: '100%', textAlign: 'left', position: 'relative', zIndex: 10 }}>
          <div style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 900,
            fontSize: 'clamp(64px, 18vw, 96px)',
            color: '#FFFFFF',
            lineHeight: 0.9,
            letterSpacing: '-0.03em',
            marginBottom: '12px',
            textTransform: 'uppercase',
          }}>
            {slide.headline}
          </div>
          {slide.subtext && (
            <div style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700,
              fontSize: '13px',
              color: 'rgba(255,255,255,0.8)',
              lineHeight: 1.3,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}>{slide.subtext}</div>
          )}
        </div>
      )}

      {/* Standard text layout */}
      {!isDataSlide && !isCTA && (
        <div style={{ width: '100%', position: 'relative', zIndex: 10 }}>
          <div style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 900,
            fontSize: 'clamp(20px, 5.5vw, 30px)',
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
            marginBottom: slide.subtext ? '10px' : '0',
            whiteSpace: 'pre-line',
            textTransform: 'uppercase',
          }}>
            {renderHeadline(slide.headline, slide.headlineHighlight)}
          </div>
          {slide.subtext && (
            <div style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 600,
              fontSize: '11px',
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.45,
              letterSpacing: '0.03em',
            }}>{slide.subtext}</div>
          )}
        </div>
      )}

      {/* DQEF watermark */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '12px',
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 800,
        fontSize: '8px',
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: '0.2em',
        zIndex: 10,
      }}>DQEF</div>
    </div>
  );
}

// ─── SlideCard (preview + image generation + PNG export) ──────────────────────

interface SlideCardProps {
  slide: SlideOutput;
  imageUrl?: string;
  isGenerating?: boolean;
  onGenerateImage: (slideNumber: number, prompt: string, quality: 'fast' | 'high') => void;
  onExportPng: (slideNumber: number) => void;
}

function SlideCard({ slide, imageUrl, isGenerating, onGenerateImage, onExportPng }: SlideCardProps) {
  const [expanded, setExpanded] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);

  // Expose ref via callback for parent to access
  const handleExport = () => onExportPng(slide.number);

  const hasImage = !!imageUrl;
  const hasImagePrompt = slide.needsMedia && slide.mediaType !== 'video' && !!slide.imagePrompt;

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      <div className="p-3">
        <SlidePreview slide={slide} imageUrl={imageUrl} slideRef={slideRef} />
      </div>

      {/* Action bar */}
      <div className="px-3 pb-3 flex items-center gap-1.5 flex-wrap">
        {/* Generate / Retake image button — only for photo slides */}
        {hasImagePrompt && (
          <>
            {!hasImage ? (
              <button
                onClick={() => onGenerateImage(slide.number, slide.imagePrompt!, 'fast')}
                disabled={isGenerating}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all border flex-1',
                  isGenerating
                    ? 'border-border text-muted-foreground cursor-not-allowed'
                    : 'border-blue-500/40 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/60'
                )}
              >
                {isGenerating ? (
                  <span className="h-3 w-3 border border-blue-400/40 border-t-blue-400 rounded-full animate-spin" />
                ) : (
                  <Image className="h-3 w-3" />
                )}
                {isGenerating ? 'Gerando...' : 'Gerar Imagem'}
              </button>
            ) : (
              <button
                onClick={() => onGenerateImage(slide.number, slide.imagePrompt!, 'fast')}
                disabled={isGenerating}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all border',
                  isGenerating
                    ? 'border-border text-muted-foreground cursor-not-allowed'
                    : 'border-border text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                )}
              >
                {isGenerating ? (
                  <span className="h-3 w-3 border border-muted-foreground/40 border-t-muted-foreground rounded-full animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                {isGenerating ? 'Trocando...' : 'Trocar'}
              </button>
            )}
          </>
        )}

        {/* PNG export — always visible */}
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold border border-border text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-all ml-auto"
          title="Exportar lâmina como PNG"
        >
          <Download className="h-3 w-3" />
          PNG
        </button>
      </div>

      {/* Logic toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors border-t border-border"
      >
        <span className="font-medium">→ LÓGICA + MÍDIA</span>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="px-4 py-3 space-y-3 border-t border-border bg-muted/10">
          {/* Logic */}
          <div>
            <p className="text-xs font-semibold text-primary mb-1">→ LÓGICA ESTRATÉGICA</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{slide.logic}</p>
          </div>

          {/* Visual direction */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">🎨 DIREÇÃO VISUAL</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{slide.visualDirection}</p>
          </div>

          {/* Media info */}
          {!slide.needsMedia && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
              Sem imagem — impacto tipográfico puro
            </div>
          )}

          {/* Image prompt */}
          {slide.needsMedia && slide.mediaType === 'photo' && slide.imagePrompt && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400">
                  <ImageIcon className="h-3 w-3" />
                  PROMPT IMAGEM
                </div>
                <CopyButton text={slide.imagePrompt} label="Copiar prompt" />
              </div>
              <pre className="text-xs text-muted-foreground leading-relaxed bg-muted/20 p-2.5 rounded-lg overflow-x-auto whitespace-pre-wrap" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {slide.imagePrompt}
              </pre>
            </div>
          )}

          {/* VEO prompt */}
          {slide.needsMedia && slide.mediaType === 'video' && slide.veoPrompt && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-400">
                  <Video className="h-3 w-3" />
                  PROMPT VEO 3.1
                </div>
                <CopyButton text={slide.veoPrompt} label="Copiar prompt" />
              </div>
              <pre className="text-xs text-muted-foreground leading-relaxed bg-muted/20 p-2.5 rounded-lg overflow-x-auto whitespace-pre-wrap" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {slide.veoPrompt}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Hidden ref holder for PNG export — must be rendered at full size */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '400px', pointerEvents: 'none' }}>
        <SlidePreview slide={slide} imageUrl={imageUrl} slideRef={slideRef} />
      </div>
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

  // Refs per slide for PNG export
  const slideRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    setSlideImages({});
    try {
      const { data, error } = await supabase.functions.invoke('generate-carousel-visual', {
        body: { context, angle, persona, channel, tone },
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

  const handleExportPng = useCallback(async (slideNumber: number) => {
    const el = slideRefs.current[slideNumber];
    if (!el) {
      toast({ title: 'Erro', description: 'Referência da lâmina não encontrada.', variant: 'destructive' });
      return;
    }
    try {
      toast({ title: 'Exportando...', description: `Gerando PNG da lâmina ${slideNumber}` });
      const dataUrl = await toPng(el, {
        pixelRatio: 2,
        cacheBust: true,
        style: { borderRadius: '0' },
      });
      const link = document.createElement('a');
      link.download = `dqef-slide-${String(slideNumber).padStart(2, '0')}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: `PNG exportado ✅`, description: `dqef-slide-${String(slideNumber).padStart(2, '0')}.png` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro ao exportar', description: 'Falha ao gerar PNG. Tente novamente.', variant: 'destructive' });
    }
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

          {/* ── LEFT: Briefing ── */}
          <div className="space-y-4">
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
          </div>

          {/* ── RIGHT: Output ── */}
          <div>
            {/* Empty state */}
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

            {/* Loading skeleton */}
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

            {/* Result */}
            {result && !loading && (
              <div>
                {/* Autonomous recommendation card */}
                {result.autonomous && <AngleRecommendation carousel={result.carousel} />}

                {/* Carousel header */}
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

                {/* Slides grid — with hidden full-res refs for PNG export */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 mb-6">
                  {result.carousel.slides.map(slide => (
                    <SlideCardWithRef
                      key={slide.number}
                      slide={slide}
                      imageUrl={slideImages[slide.number]}
                      isGenerating={generatingImage[slide.number]}
                      onGenerateImage={handleGenerateImage}
                      onExportPng={handleExportPng}
                      onRefReady={(num, el) => { slideRefs.current[num] = el; }}
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

// ─── SlideCardWithRef — bridges parent ref collection ─────────────────────────

interface SlideCardWithRefProps extends SlideCardProps {
  onRefReady: (slideNumber: number, el: HTMLDivElement | null) => void;
}

function SlideCardWithRef({ slide, imageUrl, isGenerating, onGenerateImage, onExportPng, onRefReady }: SlideCardWithRefProps) {
  const slideRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  // Register ref with parent on mount/unmount
  const refCallback = useCallback((el: HTMLDivElement | null) => {
    (slideRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    onRefReady(slide.number, el);
  }, [slide.number, onRefReady]);

  const hasImage = !!imageUrl;
  const hasImagePrompt = slide.needsMedia && slide.mediaType !== 'video' && !!slide.imagePrompt;

  const handleExport = async () => {
    const el = slideRef.current;
    if (!el) { onExportPng(slide.number); return; }
    onExportPng(slide.number);
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      <div className="p-3">
        {/* The actual slide preview with ref for PNG export */}
        <div ref={refCallback} style={{ aspectRatio: '4/5', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
          <SlidePreview slide={slide} imageUrl={imageUrl} />
        </div>
      </div>

      {/* Action bar */}
      <div className="px-3 pb-3 flex items-center gap-1.5 flex-wrap">
        {hasImagePrompt && (
          <>
            {!hasImage ? (
              <button
                onClick={() => onGenerateImage(slide.number, slide.imagePrompt!, 'fast')}
                disabled={isGenerating}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all border flex-1',
                  isGenerating
                    ? 'border-border text-muted-foreground cursor-not-allowed'
                    : 'border-blue-500/40 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/60'
                )}
              >
                {isGenerating ? (
                  <span className="h-3 w-3 border border-blue-400/40 border-t-blue-400 rounded-full animate-spin" />
                ) : (
                  <Image className="h-3 w-3" />
                )}
                {isGenerating ? 'Gerando...' : 'Gerar Imagem'}
              </button>
            ) : (
              <button
                onClick={() => onGenerateImage(slide.number, slide.imagePrompt!, 'fast')}
                disabled={isGenerating}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all border',
                  isGenerating
                    ? 'border-border text-muted-foreground cursor-not-allowed'
                    : 'border-border text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                )}
              >
                {isGenerating ? (
                  <span className="h-3 w-3 border border-muted-foreground/40 border-t-muted-foreground rounded-full animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                {isGenerating ? 'Trocando...' : 'Trocar'}
              </button>
            )}
          </>
        )}

        {/* PNG export */}
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold border border-border text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-all ml-auto"
          title="Exportar lâmina como PNG"
        >
          <Download className="h-3 w-3" />
          PNG
        </button>
      </div>

      {/* Logic toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors border-t border-border"
      >
        <span className="font-medium">→ LÓGICA + MÍDIA</span>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="px-4 py-3 space-y-3 border-t border-border bg-muted/10">
          <div>
            <p className="text-xs font-semibold text-primary mb-1">→ LÓGICA ESTRATÉGICA</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{slide.logic}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">🎨 DIREÇÃO VISUAL</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{slide.visualDirection}</p>
          </div>
          {!slide.needsMedia && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
              Sem imagem — impacto tipográfico puro
            </div>
          )}
          {slide.needsMedia && slide.mediaType === 'photo' && slide.imagePrompt && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400">
                  <ImageIcon className="h-3 w-3" />
                  PROMPT IMAGEM
                </div>
                <CopyButton text={slide.imagePrompt} label="Copiar prompt" />
              </div>
              <pre className="text-xs text-muted-foreground leading-relaxed bg-muted/20 p-2.5 rounded-lg overflow-x-auto whitespace-pre-wrap" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {slide.imagePrompt}
              </pre>
            </div>
          )}
          {slide.needsMedia && slide.mediaType === 'video' && slide.veoPrompt && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-400">
                  <Video className="h-3 w-3" />
                  PROMPT VEO 3.1
                </div>
                <CopyButton text={slide.veoPrompt} label="Copiar prompt" />
              </div>
              <pre className="text-xs text-muted-foreground leading-relaxed bg-muted/20 p-2.5 rounded-lg overflow-x-auto whitespace-pre-wrap" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {slide.veoPrompt}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
