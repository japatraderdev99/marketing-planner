import { useRef } from 'react';
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
const NARRATIVE_THEMES = {
  'editorial-dark': {
    bg: '#0F0F0F',
    text: '#FFFFFF',
    subtext: 'rgba(255,255,255,0.7)',
    accent: '#E8603C',
    gradient: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.15) 100%)',
    splitBg: '#1A1A1A',
  },
  'editorial-cream': {
    bg: '#F5F0E8',
    text: '#1A1A1A',
    subtext: 'rgba(26,26,26,0.65)',
    accent: '#E8603C',
    gradient: 'linear-gradient(to top, rgba(245,240,232,0.9) 0%, rgba(245,240,232,0.3) 50%, rgba(245,240,232,0.05) 100%)',
    splitBg: '#EDE8DF',
  },
  'brand-bold': {
    bg: '#E8603C',
    text: '#FFFFFF',
    subtext: 'rgba(255,255,255,0.75)',
    accent: '#FFFFFF',
    gradient: 'linear-gradient(to top, rgba(232,96,60,0.9) 0%, rgba(232,96,60,0.3) 50%, rgba(232,96,60,0.05) 100%)',
    splitBg: '#D4532F',
  },
};

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

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  slide: NarrativeSlide;
  imageUrl?: string;
  slideRef?: React.RefObject<HTMLDivElement>;
  format?: CreativeFormat;
  exportMode?: boolean;
  textScale?: number;
  imageOpacity?: number;
  themeId?: 'editorial-dark' | 'editorial-cream' | 'brand-bold';
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
}: Props) {
  const theme = NARRATIVE_THEMES[themeId] || NARRATIVE_THEMES['editorial-dark'];
  const fmt = format || { width: 1080, height: 1350, ratio: '4:5', safeZone: { top: 90, right: 90, bottom: 90, left: 90 } };
  const exportScale = exportMode ? fmt.width / PREVIEW_BASE_WIDTH : 1;

  const ts = (px: number) => `${px * textScale * exportScale}px`;

  const bgColor = slide.bgColor || theme.bg;
  const textColor = slide.textColor || theme.text;
  const accentColor = slide.accentColor || theme.accent;
  const subtextColor = theme.subtext;

  const aspectRatio = `${fmt.width}/${fmt.height}`;
  const sz = fmt.safeZone;
  const paddingStyle = exportMode
    ? { paddingTop: sz.top, paddingRight: sz.right, paddingBottom: sz.bottom, paddingLeft: sz.left }
    : {
        paddingTop: `${(sz.top / fmt.height) * 100}%`,
        paddingRight: `${(sz.right / fmt.width) * 100}%`,
        paddingBottom: `${(sz.bottom / fmt.height) * 100}%`,
        paddingLeft: `${(sz.left / fmt.width) * 100}%`,
      };

  const exportDimensions = exportMode ? { width: fmt.width, height: fmt.height } : {};

  // ── FULL-IMAGE layout ──────────────────────────────────────────────────────
  if (slide.layout === 'full-image') {
    return (
      <div
        ref={slideRef}
        style={{
          background: bgColor,
          aspectRatio: exportMode ? undefined : aspectRatio,
          ...exportDimensions,
          width: exportMode ? fmt.width : '100%',
          position: 'relative',
          borderRadius: exportMode ? 0 : 8,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          ...paddingStyle,
          boxSizing: 'border-box',
        }}
      >
        {imageUrl && (
          <>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: imageOpacity,
              zIndex: 0,
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: theme.gradient,
              zIndex: 1,
            }} />
          </>
        )}
        <div style={{ position: 'relative', zIndex: 10, width: '100%' }}>
          <div style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 900,
            fontSize: ts(24),
            lineHeight: 1.05,
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
              fontSize: ts(11),
              lineHeight: 1.5,
              color: subtextColor,
            }}>
              {renderBoldText(slide.bodyText, accentColor, subtextColor as string)}
            </div>
          )}
          {slide.sourceLabel && (
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: ts(8),
              color: accentColor,
              marginTop: 8 * exportScale,
              opacity: 0.8,
              letterSpacing: '0.05em',
            }}>
              ({slide.sourceLabel})
            </div>
          )}
        </div>
        <div style={{
          position: 'absolute',
          bottom: exportMode ? 10 * exportScale : 10,
          right: exportMode ? 10 * exportScale : 10,
          zIndex: 10, opacity: 0.4,
        }}>
          <img src={dqfIcon} alt="DQF" style={{
            width: exportMode ? 18 * exportScale : 18,
            height: exportMode ? 18 * exportScale : 18,
            filter: themeId === 'editorial-cream' ? 'none' : 'brightness(0) invert(1)',
          }} />
        </div>
      </div>
    );
  }

  // ── SPLIT layout ───────────────────────────────────────────────────────────
  if (slide.layout === 'split') {
    const imgSide = slide.imageSide || 'right';
    return (
      <div
        ref={slideRef}
        style={{
          background: bgColor,
          aspectRatio: exportMode ? undefined : aspectRatio,
          ...exportDimensions,
          width: exportMode ? fmt.width : '100%',
          position: 'relative',
          borderRadius: exportMode ? 0 : 8,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: imgSide === 'left' ? 'row-reverse' : 'row',
          boxSizing: 'border-box',
        }}
      >
        {/* Text half */}
        <div style={{
          width: '50%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: exportMode ? `${sz.top}px ${sz.right}px ${sz.bottom}px ${sz.left}px` : '8% 6%',
          boxSizing: 'border-box',
          background: theme.splitBg,
        }}>
          <div style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 900,
            fontSize: ts(18),
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            color: textColor,
            marginBottom: slide.bodyText ? 10 * exportScale : 0,
          }}>
            {slide.headline}
          </div>
          {slide.bodyText && (
            <div style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 500,
              fontSize: ts(10),
              lineHeight: 1.5,
              color: subtextColor,
            }}>
              {renderBoldText(slide.bodyText, accentColor, subtextColor as string)}
            </div>
          )}
          {slide.sourceLabel && (
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: ts(7),
              color: accentColor,
              marginTop: 6 * exportScale,
              opacity: 0.8,
            }}>
              ({slide.sourceLabel})
            </div>
          )}
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
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }} />
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(135deg, ${accentColor}33 0%, ${bgColor} 100%)`,
            }} />
          )}
        </div>
        <div style={{
          position: 'absolute',
          bottom: exportMode ? 10 * exportScale : 10,
          right: exportMode ? 10 * exportScale : 10,
          zIndex: 10, opacity: 0.4,
        }}>
          <img src={dqfIcon} alt="DQF" style={{
            width: exportMode ? 18 * exportScale : 18,
            height: exportMode ? 18 * exportScale : 18,
            filter: themeId === 'editorial-cream' ? 'none' : 'brightness(0) invert(1)',
          }} />
        </div>
      </div>
    );
  }

  // ── TEXT-HEAVY layout ──────────────────────────────────────────────────────
  if (slide.layout === 'text-heavy') {
    return (
      <div
        ref={slideRef}
        style={{
          background: bgColor,
          aspectRatio: exportMode ? undefined : aspectRatio,
          ...exportDimensions,
          width: exportMode ? fmt.width : '100%',
          position: 'relative',
          borderRadius: exportMode ? 0 : 8,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          ...paddingStyle,
          boxSizing: 'border-box',
        }}
      >
        {imageUrl && (
          <>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.15,
              zIndex: 0,
            }} />
          </>
        )}
        <div style={{ position: 'relative', zIndex: 10, width: '100%' }}>
          {slide.sourceLabel && (
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: ts(8),
              color: accentColor,
              marginBottom: 12 * exportScale,
              opacity: 0.8,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              {slide.sourceLabel}
            </div>
          )}
          <div style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 900,
            fontSize: ts(22),
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            color: textColor,
            marginBottom: slide.bodyText ? 16 * exportScale : 0,
          }}>
            {slide.headline}
          </div>
          {slide.bodyText && (
            <div style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 500,
              fontSize: ts(10),
              lineHeight: 1.55,
              color: subtextColor,
            }}>
              {renderBoldText(slide.bodyText, accentColor, subtextColor as string)}
            </div>
          )}
        </div>
        <div style={{
          position: 'absolute',
          bottom: exportMode ? 10 * exportScale : 10,
          right: exportMode ? 10 * exportScale : 10,
          zIndex: 10, opacity: 0.4,
        }}>
          <img src={dqfIcon} alt="DQF" style={{
            width: exportMode ? 18 * exportScale : 18,
            height: exportMode ? 18 * exportScale : 18,
            filter: themeId === 'editorial-cream' ? 'none' : 'brightness(0) invert(1)',
          }} />
        </div>
      </div>
    );
  }

  // ── QUOTE layout ───────────────────────────────────────────────────────────
  if (slide.layout === 'quote') {
    return (
      <div
        ref={slideRef}
        style={{
          background: bgColor,
          aspectRatio: exportMode ? undefined : aspectRatio,
          ...exportDimensions,
          width: exportMode ? fmt.width : '100%',
          position: 'relative',
          borderRadius: exportMode ? 0 : 8,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          ...paddingStyle,
          boxSizing: 'border-box',
        }}
      >
        {imageUrl && (
          <>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.2,
              zIndex: 0,
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: theme.gradient,
              zIndex: 1,
            }} />
          </>
        )}
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', width: '100%' }}>
          <div style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 300,
            fontStyle: 'italic',
            fontSize: ts(36),
            color: accentColor,
            lineHeight: 0.9,
            marginBottom: 16 * exportScale,
            opacity: 0.3,
          }}>
            "
          </div>
          <div style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: ts(16),
            lineHeight: 1.3,
            color: textColor,
            fontStyle: 'italic',
          }}>
            {slide.headline}
          </div>
          {slide.bodyText && (
            <div style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 500,
              fontSize: ts(10),
              lineHeight: 1.5,
              color: subtextColor,
              marginTop: 12 * exportScale,
            }}>
              {renderBoldText(slide.bodyText, accentColor, subtextColor as string)}
            </div>
          )}
          {slide.sourceLabel && (
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: ts(8),
              color: accentColor,
              marginTop: 10 * exportScale,
              letterSpacing: '0.05em',
            }}>
              — {slide.sourceLabel}
            </div>
          )}
        </div>
        <div style={{
          position: 'absolute',
          bottom: exportMode ? 10 * exportScale : 10,
          right: exportMode ? 10 * exportScale : 10,
          zIndex: 10, opacity: 0.4,
        }}>
          <img src={dqfIcon} alt="DQF" style={{
            width: exportMode ? 18 * exportScale : 18,
            height: exportMode ? 18 * exportScale : 18,
            filter: themeId === 'editorial-cream' ? 'none' : 'brightness(0) invert(1)',
          }} />
        </div>
      </div>
    );
  }

  // ── CTA layout ─────────────────────────────────────────────────────────────
  return (
    <div
      ref={slideRef}
      style={{
        background: bgColor,
        aspectRatio: exportMode ? undefined : aspectRatio,
        ...exportDimensions,
        width: exportMode ? fmt.width : '100%',
        position: 'relative',
        borderRadius: exportMode ? 0 : 8,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        ...paddingStyle,
        boxSizing: 'border-box',
      }}
    >
      {imageUrl && (
        <>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.3,
            zIndex: 0,
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: theme.gradient,
            zIndex: 1,
          }} />
        </>
      )}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', width: '100%' }}>
        <div style={{
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 900,
          fontSize: ts(20),
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          textTransform: 'uppercase',
          color: textColor,
          marginBottom: 12 * exportScale,
        }}>
          {slide.headline}
        </div>
        {slide.bodyText && (
          <div style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 500,
            fontSize: ts(11),
            lineHeight: 1.45,
            color: subtextColor,
          }}>
            {renderBoldText(slide.bodyText, accentColor, subtextColor as string)}
          </div>
        )}
        <div style={{
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 700,
          fontSize: ts(10),
          marginTop: 20 * exportScale,
          letterSpacing: '0.04em',
        }}>
          <span style={{ color: theme.subtext }}>pronto. </span>
          <span style={{ color: accentColor }}>resolvido.</span>
        </div>
      </div>
      <div style={{
        position: 'absolute',
        bottom: exportMode ? 14 * exportScale : 14,
        zIndex: 10, opacity: 0.6,
      }}>
        <img src={dqfIcon} alt="DQF" style={{
          width: exportMode ? 28 * exportScale : 28,
          height: exportMode ? 28 * exportScale : 28,
          filter: themeId === 'editorial-cream' ? 'none' : 'brightness(0) invert(1)',
        }} />
      </div>
    </div>
  );
}
