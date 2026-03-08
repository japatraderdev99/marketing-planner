import dqfIcon from '@/assets/dqf-icon.svg';
import type { CreativeFormat } from '@/pages/AiCarrosseis';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface NarrativeSlide {
  number: number;
  type: string;
  layout: 'full-image' | 'split' | 'text-heavy' | 'quote' | 'cta';
  headline: string;
  bodyText?: string | null;
  sourceLabel?: string | null;
  imagePrompt?: string | null;
  imageSide?: 'full' | 'left' | 'right';
  bgColor?: string;
  textColor?: string;
  accentColor?: string;
}

export interface NarrativeCarousel {
  title: string;
  theme: 'editorial-dark' | 'editorial-cream' | 'brand-bold';
  narrative_arc: string;
  target_connection: string;
  shareability_hook: string;
  caption: string;
  bestTime: string;
  slides: NarrativeSlide[];
}

// ─── Theme palettes ───────────────────────────────────────────────────────────
export const NARRATIVE_THEMES = {
  'editorial-dark': {
    label: 'Dark Editorial',
    bg: '#0A0A0A',
    text: '#FFFFFF',
    subtext: 'rgba(255,255,255,0.72)',
    accent: '#E8603C',
    accentSoft: 'rgba(232,96,60,0.15)',
    gradient: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.12) 100%)',
    splitBg: '#111111',
    quoteBg: '#0D0D0D',
    iconFilter: 'brightness(0) invert(1)',
    sourceColor: '#E8603C',
    divider: 'rgba(232,96,60,0.25)',
    badgeBg: 'rgba(232,96,60,0.12)',
  },
  'editorial-cream': {
    label: 'Cream Editorial',
    bg: '#F7F3EB',
    text: '#1A1510',
    subtext: 'rgba(26,21,16,0.62)',
    accent: '#D4522A',
    accentSoft: 'rgba(212,82,42,0.1)',
    gradient: 'linear-gradient(to top, rgba(247,243,235,0.95) 0%, rgba(247,243,235,0.45) 40%, rgba(247,243,235,0.05) 100%)',
    splitBg: '#EDE8DF',
    quoteBg: '#F2ECE2',
    iconFilter: 'none',
    sourceColor: '#D4522A',
    divider: 'rgba(212,82,42,0.2)',
    badgeBg: 'rgba(212,82,42,0.08)',
  },
  'brand-bold': {
    label: 'Brand Bold',
    bg: '#E8603C',
    text: '#FFFFFF',
    subtext: 'rgba(255,255,255,0.78)',
    accent: '#FFFFFF',
    accentSoft: 'rgba(255,255,255,0.15)',
    gradient: 'linear-gradient(to top, rgba(180,50,25,0.95) 0%, rgba(232,96,60,0.4) 40%, rgba(232,96,60,0.05) 100%)',
    splitBg: '#D4532F',
    quoteBg: '#CC4C2B',
    iconFilter: 'brightness(0) invert(1)',
    sourceColor: '#FFD7C9',
    divider: 'rgba(255,255,255,0.2)',
    badgeBg: 'rgba(255,255,255,0.12)',
  },
};

export type NarrativeThemeId = keyof typeof NARRATIVE_THEMES;

const PREVIEW_BASE_WIDTH = 340;

// ─── Render bold markdown ─────────────────────────────────────────────────────
function renderBoldText(text: string, accentColor: string, textColor: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <span key={i} style={{ fontWeight: 800, color: accentColor }}>
          {part.slice(2, -2)}
        </span>
      );
    }
    return <span key={i} style={{ color: textColor }}>{part}</span>;
  });
}

// ─── Slide type labels ────────────────────────────────────────────────────────
const TYPE_BADGE: Record<string, string> = {
  hook: 'GANCHO', context: 'CONTEXTO', data: 'DADOS', tension: 'TENSÃO',
  pivot: 'VIRADA', proof: 'PROVA', evidence: 'EVIDÊNCIA', insight: 'INSIGHT', cta: 'CTA',
};

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  slide: NarrativeSlide;
  imageUrl?: string;
  slideRef?: React.RefObject<HTMLDivElement>;
  format?: CreativeFormat;
  exportMode?: boolean;
  textScale?: number;
  imageOpacity?: number;
  themeId?: NarrativeThemeId;
  headlineScale?: number;
  imageScale?: number;
  imageOffsetY?: number;
}

export default function NarrativeSlidePreview({
  slide,
  imageUrl,
  slideRef,
  format,
  exportMode = false,
  textScale = 1,
  imageOpacity = 0.85,
  themeId = 'editorial-dark',
  headlineScale = 1,
  imageScale = 1,
  imageOffsetY = 0,
}: Props) {
  const theme = NARRATIVE_THEMES[themeId] || NARRATIVE_THEMES['editorial-dark'];
  const fmt = format || { width: 1080, height: 1350, ratio: '4:5', safeZone: { top: 90, right: 90, bottom: 90, left: 90 } };
  const exportScale = exportMode ? fmt.width / PREVIEW_BASE_WIDTH : 1;

  const ts = (px: number) => `${px * textScale * exportScale}px`;
  const hs = (px: number) => `${px * textScale * headlineScale * exportScale}px`;

  const bgColor = slide.bgColor || theme.bg;
  const textColor = slide.textColor || theme.text;
  const accentColor = slide.accentColor || theme.accent;
  const subtextColor = theme.subtext;

  const aspectRatio = `${fmt.width}/${fmt.height}`;
  const sz = fmt.safeZone;
  const safePad = exportMode
    ? { paddingTop: sz.top, paddingRight: sz.right, paddingBottom: sz.bottom, paddingLeft: sz.left }
    : {
        paddingTop: `${(sz.top / fmt.height) * 100}%`,
        paddingRight: `${(sz.right / fmt.width) * 100}%`,
        paddingBottom: `${(sz.bottom / fmt.height) * 100}%`,
        paddingLeft: `${(sz.left / fmt.width) * 100}%`,
      };

  const exportDims = exportMode ? { width: fmt.width, height: fmt.height } : {};

  // Shared image layer
  const ImageLayer = ({ opacity = imageOpacity }: { opacity?: number }) => imageUrl ? (
    <>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: `${100 * imageScale}%`,
        backgroundPosition: `center ${50 + imageOffsetY}%`,
        opacity,
        zIndex: 0,
        transition: 'opacity 0.2s',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: theme.gradient,
        zIndex: 1,
      }} />
    </>
  ) : null;

  // Brand badge
  const BrandBadge = ({ size = 18 }: { size?: number }) => (
    <div style={{
      position: 'absolute',
      bottom: exportMode ? 14 * exportScale : 14,
      right: exportMode ? 14 * exportScale : 14,
      zIndex: 20, opacity: 0.5,
    }}>
      <img src={dqfIcon} alt="DQF" style={{
        width: (exportMode ? size * exportScale : size),
        height: (exportMode ? size * exportScale : size),
        filter: theme.iconFilter,
      }} />
    </div>
  );

  // Slide number badge
  const SlideBadge = () => (
    <div style={{
      position: 'absolute',
      top: exportMode ? 16 * exportScale : 16,
      left: exportMode ? 16 * exportScale : 16,
      zIndex: 20,
      display: 'flex',
      alignItems: 'center',
      gap: 6 * exportScale,
    }}>
      <div style={{
        background: theme.badgeBg,
        backdropFilter: 'blur(8px)',
        borderRadius: 999,
        padding: `${3 * exportScale}px ${8 * exportScale}px`,
        display: 'flex',
        alignItems: 'center',
        gap: 4 * exportScale,
      }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: ts(7),
          fontWeight: 700,
          color: accentColor,
          letterSpacing: '0.08em',
        }}>
          {String(slide.number).padStart(2, '0')}
        </span>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: ts(6),
          fontWeight: 600,
          color: subtextColor,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          {TYPE_BADGE[slide.type] || slide.type.toUpperCase()}
        </span>
      </div>
    </div>
  );

  // Accent divider line
  const AccentLine = ({ width = 40 }: { width?: number }) => (
    <div style={{
      width: width * exportScale,
      height: 3 * exportScale,
      background: accentColor,
      borderRadius: 999,
      marginBottom: 12 * exportScale,
    }} />
  );

  // Source label
  const SourceLabel = ({ align = 'left' }: { align?: 'left' | 'center' }) => slide.sourceLabel ? (
    <div style={{
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: ts(7),
      color: theme.sourceColor,
      marginTop: 10 * exportScale,
      opacity: 0.85,
      letterSpacing: '0.06em',
      textAlign: align,
    }}>
      ({slide.sourceLabel})
    </div>
  ) : null;

  const containerBase = {
    background: bgColor,
    aspectRatio: exportMode ? undefined : aspectRatio,
    ...exportDims,
    width: exportMode ? fmt.width : '100%',
    position: 'relative' as const,
    borderRadius: exportMode ? 0 : 8,
    overflow: 'hidden' as const,
    boxSizing: 'border-box' as const,
  };

  // ── FULL-IMAGE layout ──────────────────────────────────────────────────────
  if (slide.layout === 'full-image') {
    return (
      <div ref={slideRef} style={{
        ...containerBase,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        ...safePad,
      }}>
        <ImageLayer />
        {!imageUrl && (
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse at 30% 70%, ${accentColor}18 0%, transparent 60%)`,
            zIndex: 0,
          }} />
        )}
        <SlideBadge />
        <div style={{ position: 'relative', zIndex: 10, width: '100%' }}>
          <AccentLine />
          <div style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 900,
            fontSize: hs(26),
            lineHeight: 1.02,
            letterSpacing: '-0.03em',
            textTransform: 'uppercase',
            color: textColor,
            marginBottom: slide.bodyText ? 14 * exportScale : 0,
            textShadow: imageUrl ? '0 2px 20px rgba(0,0,0,0.5)' : 'none',
          }}>
            {slide.headline}
          </div>
          {slide.bodyText && (
            <div style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 500,
              fontSize: ts(11),
              lineHeight: 1.55,
              color: subtextColor,
            }}>
              {renderBoldText(slide.bodyText, accentColor, subtextColor as string)}
            </div>
          )}
          <SourceLabel />
        </div>
        <BrandBadge />
      </div>
    );
  }

  // ── SPLIT layout ───────────────────────────────────────────────────────────
  if (slide.layout === 'split') {
    const imgSide = slide.imageSide || 'right';
    return (
      <div ref={slideRef} style={{
        ...containerBase,
        display: 'flex',
        flexDirection: imgSide === 'left' ? 'row-reverse' : 'row',
      }}>
        <SlideBadge />
        {/* Text half */}
        <div style={{
          width: '50%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: exportMode ? `${sz.top}px ${sz.right}px ${sz.bottom}px ${sz.left}px` : '8% 7%',
          boxSizing: 'border-box',
          background: theme.splitBg,
          position: 'relative',
        }}>
          <AccentLine width={32} />
          <div style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 900,
            fontSize: hs(19),
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            color: textColor,
            marginBottom: slide.bodyText ? 12 * exportScale : 0,
          }}>
            {slide.headline}
          </div>
          {slide.bodyText && (
            <div style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 500,
              fontSize: ts(9.5),
              lineHeight: 1.55,
              color: subtextColor,
            }}>
              {renderBoldText(slide.bodyText, accentColor, subtextColor as string)}
            </div>
          )}
          <SourceLabel />
        </div>
        {/* Image half */}
        <div style={{
          width: '50%',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {imageUrl ? (
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: `${100 * imageScale}%`,
              backgroundPosition: `center ${50 + imageOffsetY}%`,
            }} />
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(145deg, ${accentColor}22 0%, ${bgColor} 70%)`,
            }}>
              {/* Geometric accent */}
              <div style={{
                position: 'absolute',
                bottom: '15%', right: '10%',
                width: '60%', height: '40%',
                border: `2px solid ${accentColor}20`,
                borderRadius: 8,
              }} />
            </div>
          )}
        </div>
        <BrandBadge />
      </div>
    );
  }

  // ── TEXT-HEAVY layout ──────────────────────────────────────────────────────
  if (slide.layout === 'text-heavy') {
    return (
      <div ref={slideRef} style={{
        ...containerBase,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        ...safePad,
      }}>
        <ImageLayer opacity={0.12} />
        {!imageUrl && (
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(160deg, ${bgColor} 0%, ${accentColor}08 100%)`,
            zIndex: 0,
          }} />
        )}
        <SlideBadge />
        <div style={{ position: 'relative', zIndex: 10, width: '100%' }}>
          {slide.sourceLabel && (
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: ts(7.5),
              color: theme.sourceColor,
              marginBottom: 10 * exportScale,
              opacity: 0.85,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}>
              {slide.sourceLabel}
            </div>
          )}
          <AccentLine width={36} />
          <div style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 900,
            fontSize: hs(22),
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
            textTransform: 'uppercase',
            color: textColor,
            marginBottom: slide.bodyText ? 18 * exportScale : 0,
          }}>
            {slide.headline}
          </div>
          {slide.bodyText && (
            <div style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 500,
              fontSize: ts(10),
              lineHeight: 1.6,
              color: subtextColor,
              borderLeft: `3px solid ${accentColor}40`,
              paddingLeft: 12 * exportScale,
            }}>
              {renderBoldText(slide.bodyText, accentColor, subtextColor as string)}
            </div>
          )}
        </div>
        <BrandBadge />
      </div>
    );
  }

  // ── QUOTE layout ───────────────────────────────────────────────────────────
  if (slide.layout === 'quote') {
    return (
      <div ref={slideRef} style={{
        ...containerBase,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: theme.quoteBg,
        ...safePad,
      }}>
        <ImageLayer opacity={0.15} />
        <SlideBadge />
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', width: '85%' }}>
          {/* Large quote mark */}
          <div style={{
            fontFamily: 'Georgia, serif',
            fontWeight: 400,
            fontSize: ts(52),
            color: accentColor,
            lineHeight: 0.6,
            marginBottom: 12 * exportScale,
            opacity: 0.25,
          }}>
            //
          </div>
          <div style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: hs(15),
            lineHeight: 1.35,
            color: textColor,
            fontStyle: 'italic',
            letterSpacing: '-0.01em',
          }}>
            "{slide.headline}"
          </div>
          {slide.bodyText && (
            <div style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 500,
              fontSize: ts(10),
              lineHeight: 1.5,
              color: subtextColor,
              marginTop: 14 * exportScale,
            }}>
              {renderBoldText(slide.bodyText, accentColor, subtextColor as string)}
            </div>
          )}
          {slide.sourceLabel && (
            <div style={{
              marginTop: 16 * exportScale,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8 * exportScale,
            }}>
              <div style={{
                width: 20 * exportScale,
                height: 1.5 * exportScale,
                background: accentColor,
                opacity: 0.5,
              }} />
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: ts(8),
                color: theme.sourceColor,
                letterSpacing: '0.05em',
                fontWeight: 600,
              }}>
                {slide.sourceLabel}
              </span>
            </div>
          )}
        </div>
        <BrandBadge />
      </div>
    );
  }

  // ── CTA layout ─────────────────────────────────────────────────────────────
  return (
    <div ref={slideRef} style={{
      ...containerBase,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      ...safePad,
    }}>
      <ImageLayer opacity={0.25} />
      {!imageUrl && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 50% 50%, ${accentColor}12 0%, transparent 65%)`,
          zIndex: 0,
        }} />
      )}
      <SlideBadge />
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', width: '85%' }}>
        <AccentLine width={48} />
        <div style={{
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 900,
          fontSize: hs(22),
          lineHeight: 1.08,
          letterSpacing: '-0.025em',
          textTransform: 'uppercase',
          color: textColor,
          marginBottom: 14 * exportScale,
        }}>
          {slide.headline}
        </div>
        {slide.bodyText && (
          <div style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 500,
            fontSize: ts(11),
            lineHeight: 1.5,
            color: subtextColor,
            marginBottom: 20 * exportScale,
          }}>
            {renderBoldText(slide.bodyText, accentColor, subtextColor as string)}
          </div>
        )}
        {/* CTA tagline */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6 * exportScale,
          background: theme.badgeBg,
          borderRadius: 999,
          padding: `${6 * exportScale}px ${16 * exportScale}px`,
        }}>
          <span style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: ts(10),
            color: theme.subtext,
            letterSpacing: '0.04em',
          }}>
            pronto.
          </span>
          <span style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 800,
            fontSize: ts(10),
            color: accentColor,
            letterSpacing: '0.04em',
          }}>
            resolvido.
          </span>
        </div>
      </div>
      <div style={{
        position: 'absolute',
        bottom: exportMode ? 14 * exportScale : 14,
        zIndex: 20, opacity: 0.6,
      }}>
        <img src={dqfIcon} alt="DQF" style={{
          width: exportMode ? 28 * exportScale : 28,
          height: exportMode ? 28 * exportScale : 28,
          filter: theme.iconFilter,
        }} />
      </div>
    </div>
  );
}
