import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { initialEstrategias } from '@/data/seedData';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Clapperboard, Image, Film, Copy, Check, RefreshCw,
  ChevronRight, Sparkles, AlertTriangle, Lightbulb,
  Camera, Clock, Monitor, Download, Zap, FileText,
  Upload, X, ChevronDown, ChevronUp, Music, Mic,
  Volume2, Eye, Aperture, Gauge
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const VIDEO_MODELS = [
  {
    id: 'VEO 3.1',
    label: 'VEO 3.1',
    badge: 'Google',
    badgeColor: 'bg-blue-500/20 text-blue-400',
    cost: '★★★',
    desc: 'Física realista + áudio nativo. Máx 5 frases = melhores resultados.',
    bestFor: ['Movimento de água', 'Áudio nativo gerado', 'Física realista'],
    color: 'blue',
  },
  {
    id: 'Sora 2 Pro Max',
    label: 'Sora 2 Pro Max',
    badge: 'OpenAI',
    badgeColor: 'bg-purple-500/20 text-purple-400',
    cost: '★★★★★',
    desc: 'Roteiro cinematográfico. Narrativas complexas e multi-beat.',
    bestFor: ['Narrativas com arco', 'Multi-personagens', 'Alta produção'],
    color: 'purple',
  },
  {
    id: 'Seedance 1.5 Pro',
    label: 'Seedance 1.5 Pro',
    badge: 'ByteDance',
    badgeColor: 'bg-green-500/20 text-green-400',
    cost: '★★',
    desc: 'Sujeito + Ações encadeadas. Iteração rápida e custo-benefício.',
    bestFor: ['Prototipação rápida', 'Ações físicas claras', 'Testes rápidos'],
    color: 'green',
  },
];

const ASPECT_RATIOS = ['9:16', '16:9', '1:1', '4:5'];
const DURATIONS = [5, 8, 10, 12, 15];

const CONTENT_ANGLES = [
  { id: 'Raiva', label: '🔴 Raiva', desc: 'Expõe injustiças, provoca indignação' },
  { id: 'Dinheiro', label: '💰 Dinheiro', desc: 'Números reais, ROI, comparativo de taxas' },
  { id: 'Orgulho', label: '🏆 Orgulho', desc: 'Dignidade do ofício, valorização' },
  { id: 'Urgência', label: '⏰ Urgência', desc: 'Verão em Floripa, janela de oportunidade' },
  { id: 'Alívio', label: '💚 Alívio', desc: 'PIX na hora, tranquilidade financeira' },
];

const SCENES = [
  'Piscineiro limpando piscina e recebendo PIX',
  'Eletricista resolvendo problema e cliente satisfeito',
  'Diarista em Airbnb de Floripa, verão',
  'Marido de aluguel diversificando agenda com app',
  'Prestador vendo quanto perdeu em plataforma concorrente',
  'Comparativo: antes DQEF vs depois DQEF',
];

const STEPS = [
  { id: 1, label: 'Configuração', icon: Clapperboard },
  { id: 2, label: 'Frame Inicial', icon: Image },
  { id: 3, label: 'Prompt de Vídeo', icon: Film },
  { id: 4, label: 'Exportar', icon: Download },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface AudioInstructions {
  ambientSound: string;
  dialogue?: string | null;
  musicSuggestion?: string | null;
}

interface ImagePromptResult {
  imagePrompt: string;
  imagePromptPtBr: string;
  visualNotes: string;
  animationPotential?: string;
}

interface VideoPromptResult {
  videoPrompt: string;
  videoPromptPtBr: string;
  directorNotes: string;
  audioInstructions: AudioInstructions | null;
  lensMode: 'fixed' | 'unfixed';
  technicalSpecs: {
    model: string;
    duration: string;
    aspectRatio: string;
    fixedLens: boolean;
    audio: boolean;
    resolution: string;
  };
  warningsAndTips: string[];
  promptConfidenceScore: number;
}

interface ExpressResult extends ImagePromptResult, VideoPromptResult {
  extractedScene: string;
  suggestedAngle: string;
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={cn(
        'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
        copied ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-primary'
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copiado!' : label}
    </button>
  );
}

// ─── Spec Tag ─────────────────────────────────────────────────────────────────

function SpecTag({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
      <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
      <div>
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-xs font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

// ─── Prompt Quality Score ─────────────────────────────────────────────────────

function PromptQualityScore({ score }: { score: number }) {
  const color = score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-orange-400';
  const bgColor = score >= 80 ? 'bg-green-500/10 border-green-500/20' : score >= 60 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-orange-500/10 border-orange-500/20';
  const label = score >= 80 ? 'Alta confiança' : score >= 60 ? 'Confiança média' : 'Baixa confiança — adicione mais detalhes';
  const progressColor = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-orange-500';

  return (
    <div className={cn('rounded-xl border p-3', bgColor)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Qualidade do Prompt</p>
        </div>
        <span className={cn('text-lg font-black', color)}>{score}<span className="text-xs font-normal text-muted-foreground">/100</span></span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden mb-1.5">
        <div className={cn('h-full rounded-full transition-all', progressColor)} style={{ width: `${score}%` }} />
      </div>
      <p className={cn('text-[10px]', color)}>{label}</p>
    </div>
  );
}

// ─── Audio Instructions Card (VEO 3.1 / Sora) ────────────────────────────────

function AudioInstructionsCard({ audio }: { audio: AudioInstructions }) {
  return (
    <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Volume2 className="h-4 w-4 text-green-400" />
        <p className="text-xs font-bold text-green-400 uppercase tracking-wider">Instruções de Áudio Nativo</p>
      </div>
      <div className="space-y-2">
        {audio.ambientSound && (
          <div className="flex items-start gap-2 rounded-lg bg-green-500/10 px-3 py-2">
            <Eye className="h-3.5 w-3.5 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[9px] uppercase tracking-wider text-green-400/70 mb-0.5">Som Ambiente</p>
              <p className="text-[11px] text-foreground">{audio.ambientSound}</p>
            </div>
          </div>
        )}
        {audio.dialogue && (
          <div className="flex items-start gap-2 rounded-lg bg-green-500/10 px-3 py-2">
            <Mic className="h-3.5 w-3.5 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[9px] uppercase tracking-wider text-green-400/70 mb-0.5">Diálogo</p>
              <p className="text-[11px] text-foreground font-mono">"{audio.dialogue}"</p>
            </div>
          </div>
        )}
        {audio.musicSuggestion && (
          <div className="flex items-start gap-2 rounded-lg bg-green-500/10 px-3 py-2">
            <Music className="h-3.5 w-3.5 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[9px] uppercase tracking-wider text-green-400/70 mb-0.5">Música</p>
              <p className="text-[11px] text-foreground">{audio.musicSuggestion}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Prompt Sections (visual parser) ─────────────────────────────────────────

function PromptSections({ prompt, model }: { prompt: string; model: string }) {
  // Define section patterns per model
  const sections: { key: string; color: string; bgColor: string }[] = model === 'VEO 3.1'
    ? [
        { key: 'Camera:', color: 'text-purple-400', bgColor: 'bg-purple-500/10 border-purple-500/20' },
        { key: 'Audio:', color: 'text-green-400', bgColor: 'bg-green-500/10 border-green-500/20' },
        { key: 'Style:', color: 'text-muted-foreground', bgColor: 'bg-muted/30 border-border' },
      ]
    : model === 'Seedance 1.5 Pro'
    ? [
        { key: 'Camera', color: 'text-purple-400', bgColor: 'bg-purple-500/10 border-purple-500/20' },
        { key: 'Shot switch.', color: 'text-orange-400', bgColor: 'bg-orange-500/10 border-orange-500/20' },
      ]
    : [
        { key: 'Director:', color: 'text-purple-400', bgColor: 'bg-purple-500/10 border-purple-500/20' },
        { key: 'Cinematography:', color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/20' },
        { key: '[0.', color: 'text-orange-400', bgColor: 'bg-orange-500/10 border-orange-500/20' },
      ];

  // Split prompt into lines and highlight sections
  const lines = prompt.split(/\n|(?<=\.) (?=[A-Z\[])/);

  return (
    <div className="space-y-1.5">
      {lines.filter(l => l.trim()).map((line, i) => {
        const matchedSection = sections.find(s => line.includes(s.key));
        if (matchedSection) {
          return (
            <div key={i} className={cn('rounded-lg border px-3 py-2', matchedSection.bgColor)}>
              <p className={cn('text-[11px] font-mono leading-relaxed', matchedSection.color)}>{line}</p>
            </div>
          );
        }
        return (
          <div key={i} className="rounded-lg bg-muted/20 px-3 py-2">
            <p className="text-[11px] font-mono text-foreground leading-relaxed">{line}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Model Badge ──────────────────────────────────────────────────────────────

function ModelBadge({ modelId }: { modelId: string }) {
  const m = VIDEO_MODELS.find(x => x.id === modelId);
  if (!m) return null;
  return (
    <div className="flex items-center gap-2">
      <span className={cn('rounded-full border px-2.5 py-0.5 text-[10px] font-bold', m.badgeColor)}>{m.badge}</span>
      <span className="text-xs font-bold text-foreground">{m.label}</span>
    </div>
  );
}

// ─── Lens Mode Badge ──────────────────────────────────────────────────────────

function LensModeBadge({ lensMode }: { lensMode: 'fixed' | 'unfixed' }) {
  return (
    <div className={cn(
      'flex items-center gap-1.5 rounded-lg border px-3 py-2',
      lensMode === 'unfixed' ? 'border-blue-500/20 bg-blue-500/10' : 'border-muted bg-muted/30'
    )}>
      <Aperture className={cn('h-3.5 w-3.5', lensMode === 'unfixed' ? 'text-blue-400' : 'text-muted-foreground')} />
      <div>
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Lens Mode</p>
        <p className={cn('text-xs font-bold', lensMode === 'unfixed' ? 'text-blue-400' : 'text-muted-foreground')}>
          {lensMode === 'unfixed' ? 'Unfixed (Câmera em Movimento)' : 'Fixed (Câmera Estática)'}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VideoIA() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Express mode
  const [expressOpen, setExpressOpen] = useState(true);
  const [expressText, setExpressText] = useState('');
  const [expressModel, setExpressModel] = useState('Seedance 1.5 Pro');
  const [expressAspect, setExpressAspect] = useState('9:16');
  const [expressDuration, setExpressDuration] = useState(10);
  const [expressResult, setExpressResult] = useState<ExpressResult | null>(null);
  const [loadingExpress, setLoadingExpress] = useState(false);
  const [expressAngle, setExpressAngle] = useState('');

  // Config
  const [persona, setPersona] = useState(initialEstrategias[0].id);
  const [sceneInput, setSceneInput] = useState('');
  const [selectedScene, setSelectedScene] = useState('');
  const [contentAngle, setContentAngle] = useState('Alívio');
  const [videoModel, setVideoModel] = useState('Seedance 1.5 Pro');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [duration, setDuration] = useState(12);
  const [additionalContext, setAdditionalContext] = useState('');

  // Results
  const [imagePromptResult, setImagePromptResult] = useState<ImagePromptResult | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [videoPromptResult, setVideoPromptResult] = useState<VideoPromptResult | null>(null);

  // Loading states
  const [loadingImagePrompt, setLoadingImagePrompt] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [loadingVideoPrompt, setLoadingVideoPrompt] = useState(false);

  const personaData = initialEstrategias.find(e => e.id === persona)!;
  const model = VIDEO_MODELS.find(m => m.id === videoModel)!;
  const scene = sceneInput.trim() || selectedScene;

  const invoke = async (operation: string, extra?: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('generate-video-assets', {
      body: {
        operation,
        persona: personaData.persona,
        scene,
        contentAngle,
        videoModel,
        aspectRatio,
        duration,
        additionalContext: additionalContext.trim() || undefined,
        ...extra,
      },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const handleGenerateImagePrompt = async () => {
    if (!scene) { toast({ title: 'Defina a cena', description: 'Selecione ou descreva a cena do vídeo.', variant: 'destructive' }); return; }
    setLoadingImagePrompt(true);
    try {
      const result = await invoke('image_prompt');
      setImagePromptResult(result);
    } catch (e: unknown) {
      toast({ title: 'Erro', description: String(e), variant: 'destructive' });
    } finally {
      setLoadingImagePrompt(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePromptResult) return;
    setLoadingImage(true);
    try {
      const result = await invoke('generate_image', { imagePrompt: imagePromptResult.imagePrompt });
      setGeneratedImage(result.imageUrl);
    } catch (e: unknown) {
      toast({ title: 'Erro ao gerar imagem', description: String(e), variant: 'destructive' });
    } finally {
      setLoadingImage(false);
    }
  };

  const handleGenerateVideoPrompt = async () => {
    setLoadingVideoPrompt(true);
    try {
      const result = await invoke('video_prompt', { imagePrompt: imagePromptResult?.imagePrompt });
      setVideoPromptResult(result);
      setStep(3);
    } catch (e: unknown) {
      toast({ title: 'Erro ao gerar prompt', description: String(e), variant: 'destructive' });
    } finally {
      setLoadingVideoPrompt(false);
    }
  };

  const canProceedToStep2 = scene.length > 0;
  const canProceedToStep3 = imagePromptResult !== null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const stripped = file.name.endsWith('.html')
        ? text.replace(/<style[\s\S]*?<\/style>/gi, '')
             .replace(/<script[\s\S]*?<\/script>/gi, '')
             .replace(/<[^>]+>/g, ' ')
             .replace(/\s{2,}/g, ' ')
             .trim()
             .slice(0, 8000)
        : text.slice(0, 8000);
      setExpressText(stripped);
      toast({ title: 'Arquivo carregado', description: `${file.name} — conteúdo extraído com sucesso.` });
    };
    reader.readAsText(file);
  };

  const handleExpress = async () => {
    if (!expressText.trim()) {
      toast({ title: 'Insira uma ideia ou texto', description: 'Cole ou carregue algum conteúdo para gerar os prompts.', variant: 'destructive' });
      return;
    }
    setLoadingExpress(true);
    setExpressResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-video-assets', {
        body: {
          operation: 'express_prompts',
          freeText: expressText.trim(),
          videoModel: expressModel,
          aspectRatio: expressAspect,
          duration: expressDuration,
          contentAngle: expressAngle || undefined,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setExpressResult(data);
    } catch (e: unknown) {
      toast({ title: 'Erro ao gerar prompts', description: String(e), variant: 'destructive' });
    } finally {
      setLoadingExpress(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ─── EXPRESS PANEL ───────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-primary/40 bg-primary/5 overflow-hidden">
        <button
          onClick={() => setExpressOpen(o => !o)}
          className="flex w-full items-center gap-3 p-4 text-left hover:bg-primary/10 transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 shrink-0">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-foreground">⚡ Geração Express — Cole uma ideia, receba os prompts</p>
            <p className="text-[11px] text-muted-foreground">Cole texto, roteiro ou carrossel e gere prompt de imagem + vídeo de uma vez</p>
          </div>
          <Badge variant="outline" className="border-primary/40 text-primary text-[10px] shrink-0">Modo Rápido</Badge>
          {expressOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
        </button>

        {expressOpen && (
          <div className="border-t border-primary/20 p-4 space-y-4">
            {/* Input area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">📝 Ideia / Referência / Roteiro</p>
                <div className="flex gap-2">
                  <input ref={fileInputRef} type="file" accept=".txt,.html,.md" className="hidden" onChange={handleFileUpload} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
                  >
                    <Upload className="h-3.5 w-3.5" /> Carregar arquivo
                  </button>
                  {expressText && (
                    <button onClick={() => setExpressText('')} className="flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs text-muted-foreground hover:border-destructive/40 hover:text-destructive transition-all">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <Textarea
                placeholder={`Cole aqui qualquer referência:\n• Roteiro de carrossel ("Slide 1: Você trabalhou R$2.000 este mês...")\n• Ideia de campanha ("Piscineiro recebendo PIX no momento que cliente aprova...")\n• Conceito visual ("Eletricista confiante, contraluz do sol de tarde em condomínio de Floripa...")\n• Arquivo de briefing (.html, .txt, .md)`}
                value={expressText}
                onChange={e => setExpressText(e.target.value)}
                className="min-h-[120px] resize-none text-xs bg-background border-border font-mono"
              />
              {expressText && (
                <p className="text-[10px] text-muted-foreground">{expressText.length.toLocaleString()} caracteres carregados</p>
              )}
            </div>

            {/* Quick settings */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">Modelo de Vídeo</p>
                <div className="flex flex-col gap-1">
                  {VIDEO_MODELS.map(m => (
                    <button key={m.id} onClick={() => setExpressModel(m.id)}
                      className={cn('rounded-lg border px-2.5 py-1.5 text-left text-[11px] font-medium transition-all',
                        expressModel === m.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/30')}>
                      {m.label}
                      <span className={cn('ml-1.5 text-[9px]', m.badgeColor.split(' ')[1])}>{m.cost}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">Aspecto</p>
                <div className="flex flex-wrap gap-1.5">
                  {ASPECT_RATIOS.map(ar => (
                    <button key={ar} onClick={() => setExpressAspect(ar)}
                      className={cn('rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all',
                        expressAspect === ar ? 'border-primary bg-primary/20 text-primary' : 'border-border text-muted-foreground hover:border-primary/40')}>
                      {ar}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-3 mb-1.5 uppercase tracking-wider">Duração</p>
                <div className="flex flex-wrap gap-1.5">
                  {DURATIONS.map(d => (
                    <button key={d} onClick={() => setExpressDuration(d)}
                      className={cn('rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all',
                        expressDuration === d ? 'border-primary bg-primary/20 text-primary' : 'border-border text-muted-foreground hover:border-primary/40')}>
                      {d}s
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">Ângulo (opcional)</p>
                <div className="flex flex-col gap-1">
                  {['', ...CONTENT_ANGLES.map(a => a.id)].map(a => (
                    <button key={a} onClick={() => setExpressAngle(a)}
                      className={cn('rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition-all',
                        expressAngle === a ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/30')}>
                      {a === '' ? '🤖 Detectar automaticamente' : CONTENT_ANGLES.find(x => x.id === a)?.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button onClick={handleExpress} disabled={loadingExpress || !expressText.trim()} size="lg" className="w-full gap-2 font-bold">
              {loadingExpress
                ? <><RefreshCw className="h-4 w-4 animate-spin" /> Gerando prompts com IA ({expressModel})...</>
                : <><Zap className="h-4 w-4" /> Gerar Prompt de Imagem + Vídeo</>}
            </Button>

            {/* Express Results */}
            {expressResult && (
              <div className="space-y-4 animate-fade-in pt-2 border-t border-primary/20">
                {/* Header: model badge + scene + confidence */}
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <ModelBadge modelId={expressModel} />
                      {expressResult.suggestedAngle && (
                        <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">
                          {expressResult.suggestedAngle}
                        </Badge>
                      )}
                    </div>
                    {expressResult.extractedScene && (
                      <p className="text-[11px] text-muted-foreground">
                        <span className="text-muted-foreground/60">Cena detectada: </span>
                        {expressResult.extractedScene}
                      </p>
                    )}
                  </div>
                  {expressResult.promptConfidenceScore > 0 && (
                    <div className="w-full sm:w-56">
                      <PromptQualityScore score={expressResult.promptConfidenceScore} />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {/* Image Prompt */}
                  <div className="space-y-3">
                    <div className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Camera className="h-4 w-4 text-primary" />
                          <p className="text-xs font-black text-foreground uppercase tracking-wider">Frame Inicial (Start Frame)</p>
                        </div>
                        <CopyButton text={expressResult.imagePrompt} label="Copiar EN" />
                      </div>
                      <div className="rounded-lg bg-muted/30 p-3 mb-2">
                        <p className="text-[11px] font-mono text-foreground leading-relaxed">{expressResult.imagePrompt}</p>
                      </div>
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 mb-2">
                        <p className="text-[10px] font-bold text-primary mb-1">Tradução</p>
                        <p className="text-[11px] text-foreground leading-relaxed">{expressResult.imagePromptPtBr}</p>
                      </div>
                      {expressResult.visualNotes && (
                        <p className="text-[10px] text-muted-foreground italic">{expressResult.visualNotes}</p>
                      )}
                      {expressResult.animationPotential && (
                        <div className="mt-2 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2">
                          <p className="text-[9px] uppercase tracking-wider text-blue-400 mb-0.5">Potencial de Animação</p>
                          <p className="text-[11px] text-foreground">{expressResult.animationPotential}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Video Prompt */}
                  <div className="space-y-3">
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Film className="h-4 w-4 text-primary" />
                          <p className="text-xs font-black text-foreground uppercase tracking-wider">Prompt de Vídeo</p>
                        </div>
                        <CopyButton text={expressResult.videoPrompt} label="Copiar EN" />
                      </div>
                      {/* Sectioned prompt display */}
                      <div className="mb-3">
                        <PromptSections prompt={expressResult.videoPrompt} model={expressModel} />
                      </div>
                      <div className="rounded-lg bg-muted/30 p-2.5">
                        <p className="text-[10px] font-bold text-muted-foreground mb-1">Análise do Diretor</p>
                        <p className="text-[11px] text-foreground leading-relaxed">{expressResult.videoPromptPtBr}</p>
                      </div>
                    </div>

                    {/* Lens mode (Seedance) */}
                    {expressResult.lensMode && (
                      <LensModeBadge lensMode={expressResult.lensMode} />
                    )}

                    {/* Audio (VEO/Sora) */}
                    {expressResult.audioInstructions && (
                      <AudioInstructionsCard audio={expressResult.audioInstructions} />
                    )}

                    {/* Tech specs */}
                    <div className="grid grid-cols-2 gap-2">
                      <SpecTag icon={Camera} label="Modelo" value={expressResult.technicalSpecs?.model || expressModel} />
                      <SpecTag icon={Clock} label="Duração" value={expressResult.technicalSpecs?.duration || `${expressDuration}s`} />
                      <SpecTag icon={Monitor} label="Aspecto" value={expressResult.technicalSpecs?.aspectRatio || expressAspect} />
                      <SpecTag icon={Monitor} label="Resolução" value={expressResult.technicalSpecs?.resolution || '1080p'} />
                    </div>

                    {/* Director notes */}
                    {expressResult.directorNotes && (
                      <div className="rounded-xl border border-border bg-card p-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Clapperboard className="h-3.5 w-3.5 text-primary" />
                          <p className="text-[10px] font-bold text-foreground uppercase tracking-wider">Notas do Diretor</p>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{expressResult.directorNotes}</p>
                      </div>
                    )}

                    {/* Tips */}
                    {expressResult.warningsAndTips?.length > 0 && (
                      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />
                          <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">Dicas & Atenção</p>
                        </div>
                        <ul className="space-y-1">
                          {expressResult.warningsAndTips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-[11px] text-foreground">
                              <Lightbulb className="h-3.5 w-3.5 text-yellow-400 shrink-0 mt-0.5" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Use in workflow hint */}
                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3">
                  <p className="text-xs font-bold text-green-400 mb-1">✅ Próximos passos no Higgsfield</p>
                  <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-2 text-[11px] text-foreground">
                    <p>1. Copie o <strong>Frame Inicial</strong> → gere a imagem (Higgsfield ou outro gerador)</p>
                    <p>2. Faça upload como <strong>Start Frame</strong> no Higgsfield</p>
                    <p>3. Cole o <strong>Prompt de Vídeo</strong> no campo de prompt</p>
                    <p>4. Configure: <strong>{expressResult.technicalSpecs?.model || expressModel}</strong> · {expressResult.technicalSpecs?.aspectRatio || expressAspect} · {expressResult.technicalSpecs?.duration || `${expressDuration}s`}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── STEP-BY-STEP HEADER ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20">
          <Clapperboard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-black text-foreground">Video IA — Higgsfield</h2>
          <p className="text-xs text-muted-foreground">Workflow de diretor para criar vídeos com IA de alta conversão</p>
        </div>
        <Badge variant="outline" className="ml-auto border-primary/30 text-primary text-[10px]">
          Higgsfield Compatible
        </Badge>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = step === s.id;
          const done = step > s.id;
          return (
            <div key={s.id} className="flex items-center">
              <button
                onClick={() => done && setStep(s.id)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all',
                  active ? 'bg-primary/20 text-primary' :
                  done ? 'text-muted-foreground hover:text-foreground cursor-pointer' :
                  'text-muted-foreground/40 cursor-default'
                )}
              >
                <div className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black',
                  active ? 'bg-primary text-primary-foreground' :
                  done ? 'bg-green-500/20 text-green-400' :
                  'bg-muted text-muted-foreground'
                )}>
                  {done ? '✓' : s.id}
                </div>
                <span className="hidden sm:block">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight className={cn('h-4 w-4 shrink-0', step > s.id ? 'text-primary/40' : 'text-border')} />
              )}
            </div>
          );
        })}
      </div>

      {/* ─── STEP 1: CONFIG ───────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {/* Left */}
          <div className="space-y-4">
            {/* Persona */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">🎭 Persona do Prestador</p>
              <div className="grid grid-cols-2 gap-2">
                {initialEstrategias.map(est => (
                  <button key={est.id} onClick={() => setPersona(est.id)}
                    className={cn('rounded-lg border p-2.5 text-left transition-all', persona === est.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40')}>
                    <span className="text-lg">{est.icon}</span>
                    <p className={cn('mt-1 text-xs font-bold leading-tight', persona === est.id ? 'text-primary' : 'text-foreground')}>{est.persona}</p>
                    <p className="text-[10px] text-muted-foreground">{est.ageRange}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Scene */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">🎬 Cena / Contexto</p>
              <div className="space-y-1.5 mb-3">
                {SCENES.map(s => (
                  <button key={s} onClick={() => { setSelectedScene(s); setSceneInput(''); }}
                    className={cn('w-full rounded-lg border px-3 py-2 text-left text-xs transition-all',
                      selectedScene === s && !sceneInput ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground')}>
                    {s}
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Ou descreva sua própria cena em detalhes..."
                value={sceneInput}
                onChange={e => { setSceneInput(e.target.value); setSelectedScene(''); }}
                className="min-h-[70px] resize-none text-xs bg-background border-border"
              />
            </div>

            {/* Content Angle */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">🎯 Ângulo de Conteúdo</p>
              <div className="space-y-1.5">
                {CONTENT_ANGLES.map(a => (
                  <button key={a.id} onClick={() => setContentAngle(a.id)}
                    className={cn('flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left transition-all',
                      contentAngle === a.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30')}>
                    <span className="text-xs font-bold shrink-0">{a.label}</span>
                    <span className="text-[11px] text-muted-foreground">{a.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-4">
            {/* Video Model */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">🤖 Modelo de Vídeo</p>
              <div className="space-y-2">
                {VIDEO_MODELS.map(m => (
                  <button key={m.id} onClick={() => setVideoModel(m.id)}
                    className={cn('w-full rounded-xl border p-3 text-left transition-all',
                      videoModel === m.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30')}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <p className={cn('text-sm font-black', videoModel === m.id ? 'text-primary' : 'text-foreground')}>{m.label}</p>
                        <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-bold', m.badgeColor)}>{m.badge}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{m.cost}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-2">{m.desc}</p>
                    <div className="flex flex-wrap gap-1">
                      {m.bestFor.map(b => (
                        <span key={b} className="rounded-full bg-muted px-2 py-0.5 text-[9px] text-muted-foreground">{b}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Technical */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">⚙️ Especificações Técnicas</p>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1.5">Aspect Ratio</p>
                  <div className="flex gap-1.5">
                    {ASPECT_RATIOS.map(ar => (
                      <button key={ar} onClick={() => setAspectRatio(ar)}
                        className={cn('rounded-lg border px-3 py-1.5 text-xs font-bold transition-all',
                          aspectRatio === ar ? 'border-primary bg-primary/20 text-primary' : 'border-border text-muted-foreground hover:border-primary/40')}>
                        {ar}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1.5">Duração (segundos)</p>
                  <div className="flex gap-1.5">
                    {DURATIONS.map(d => (
                      <button key={d} onClick={() => setDuration(d)}
                        className={cn('rounded-lg border px-3 py-1.5 text-xs font-bold transition-all',
                          duration === d ? 'border-primary bg-primary/20 text-primary' : 'border-border text-muted-foreground hover:border-primary/40')}>
                        {d}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Context adicional */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">📝 Contexto Adicional</p>
              <Textarea
                placeholder="Detalhes específicos, referências visuais, restrições, tom desejado..."
                value={additionalContext}
                onChange={e => setAdditionalContext(e.target.value)}
                className="min-h-[80px] resize-none text-xs bg-background border-border"
              />
            </div>

            <Button onClick={() => setStep(2)} disabled={!canProceedToStep2} size="lg" className="w-full gap-2 font-bold">
              <ChevronRight className="h-4 w-4" /> Ir para Frame Inicial
            </Button>
          </div>
        </div>
      )}

      {/* ─── STEP 2: IMAGE FRAME ──────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1fr]">
          {/* Left: image prompt */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">📸 Prompt do Frame Inicial</p>
                <Button size="sm" onClick={handleGenerateImagePrompt} disabled={loadingImagePrompt} variant="outline" className="gap-1.5 text-xs h-7">
                  {loadingImagePrompt ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {imagePromptResult ? 'Regenerar' : 'Gerar Prompt'}
                </Button>
              </div>

              {!imagePromptResult && !loadingImagePrompt && (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-10 text-center">
                  <Camera className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground">Gere o prompt para o frame inicial</p>
                  <p className="text-[10px] text-muted-foreground mt-1">IA criará um prompt fotográfico otimizado para animação</p>
                </div>
              )}

              {loadingImagePrompt && (
                <div className="flex flex-col items-center justify-center rounded-lg border border-primary/20 bg-primary/5 py-10">
                  <RefreshCw className="h-8 w-8 text-primary animate-spin mb-2" />
                  <p className="text-xs text-foreground">Criando prompt fotográfico...</p>
                </div>
              )}

              {imagePromptResult && (
                <div className="space-y-3 animate-fade-in">
                  <div className="rounded-lg bg-muted/30 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Prompt (EN — para Higgsfield)</span>
                      <CopyButton text={imagePromptResult.imagePrompt} label="Copiar" />
                    </div>
                    <p className="text-[11px] text-foreground leading-relaxed font-mono">{imagePromptResult.imagePrompt}</p>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <p className="text-[10px] font-bold text-primary mb-1">Tradução Explicativa</p>
                    <p className="text-xs text-foreground leading-relaxed">{imagePromptResult.imagePromptPtBr}</p>
                  </div>
                  {imagePromptResult.animationPotential && (
                    <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
                      <p className="text-[9px] uppercase tracking-wider text-blue-400 mb-1">Potencial de Animação</p>
                      <p className="text-xs text-foreground">{imagePromptResult.animationPotential}</p>
                    </div>
                  )}
                  {imagePromptResult.visualNotes && (
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">🎨 Notas Visuais do Diretor</p>
                      <p className="text-xs text-muted-foreground">{imagePromptResult.visualNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button
              onClick={handleGenerateVideoPrompt}
              disabled={!canProceedToStep3 || loadingVideoPrompt}
              size="lg"
              className="w-full gap-2 font-bold"
            >
              {loadingVideoPrompt ? <><RefreshCw className="h-4 w-4 animate-spin" /> Criando prompt de vídeo...</> : <><Film className="h-4 w-4" /> Gerar Prompt de Vídeo</>}
            </Button>
          </div>

          {/* Right: generated image */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">🖼️ Imagem Gerada</p>
                {imagePromptResult && (
                  <Button size="sm" onClick={handleGenerateImage} disabled={loadingImage} variant="outline" className="gap-1.5 text-xs h-7">
                    {loadingImage ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {generatedImage ? 'Regenerar Imagem' : 'Gerar Imagem'}
                  </Button>
                )}
              </div>

              {!generatedImage && !loadingImage && (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
                  <Image className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-xs text-muted-foreground">
                    {imagePromptResult ? 'Clique em "Gerar Imagem" para criar o frame' : 'Primeiro gere o prompt acima'}
                  </p>
                  {imagePromptResult && <p className="text-[10px] text-muted-foreground mt-1">Powered by Gemini Image Pro</p>}
                </div>
              )}

              {loadingImage && (
                <div className="flex flex-col items-center justify-center rounded-lg border border-primary/20 bg-primary/5 py-16">
                  <RefreshCw className="h-10 w-10 text-primary animate-spin mb-3" />
                  <p className="text-xs text-foreground">Gerando imagem com IA...</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Isso pode levar 15–30 segundos</p>
                </div>
              )}

              {generatedImage && (
                <div className="space-y-3 animate-fade-in">
                  <div className={cn('overflow-hidden rounded-lg border border-primary/20', aspectRatio === '9:16' ? 'max-w-[240px] mx-auto' : aspectRatio === '1:1' ? 'max-w-[300px] mx-auto' : '')}>
                    <img src={generatedImage} alt="Frame inicial gerado" className="w-full h-auto" />
                  </div>
                  <div className="flex gap-2">
                    <a href={generatedImage} download="frame-inicial-dqef.png" className="flex-1">
                      <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
                        <Download className="h-3.5 w-3.5" /> Baixar Frame
                      </Button>
                    </a>
                    <Button size="sm" variant="outline" onClick={handleGenerateImage} disabled={loadingImage} className="gap-1.5 text-xs">
                      <RefreshCw className="h-3.5 w-3.5" /> Nova versão
                    </Button>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-2">
                    <p className="text-[10px] font-bold text-primary mb-1">📌 Como usar no Higgsfield</p>
                    <p className="text-[11px] text-foreground">Baixe esta imagem e faça o upload como <strong>Start Frame</strong> no painel de criação do Higgsfield Video.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 3: VIDEO PROMPT ──────────────────────────────────────────────── */}
      {step === 3 && videoPromptResult && (
        <div className="space-y-4 animate-fade-in">
          {/* Model header with badge */}
          <div className="flex flex-wrap items-center gap-2">
            <ModelBadge modelId={videoModel} />
            <Badge variant="outline">{aspectRatio}</Badge>
            <Badge variant="outline">{duration}s</Badge>
            <Badge variant="outline">{personaData.persona}</Badge>
            {videoPromptResult.promptConfidenceScore > 0 && (
              <div className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5">
                <Gauge className="h-3 w-3 text-muted-foreground" />
                <span className={cn('text-[10px] font-bold',
                  videoPromptResult.promptConfidenceScore >= 80 ? 'text-green-400' :
                  videoPromptResult.promptConfidenceScore >= 60 ? 'text-yellow-400' : 'text-orange-400'
                )}>{videoPromptResult.promptConfidenceScore}/100</span>
              </div>
            )}
            <div className="ml-auto">
              <Button size="sm" onClick={handleGenerateVideoPrompt} disabled={loadingVideoPrompt} variant="outline" className="gap-1.5 text-xs">
                {loadingVideoPrompt ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Regenerar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]">
            {/* Left: Main prompt */}
            <div className="space-y-4">
              {/* EN Prompt — sectioned display */}
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-black text-foreground uppercase tracking-wider">🎬 Prompt Higgsfield (EN)</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Cole este prompt diretamente no Higgsfield</p>
                  </div>
                  <CopyButton text={videoPromptResult.videoPrompt} label="Copiar tudo" />
                </div>
                {/* Sectioned visual display */}
                <div className="mb-3">
                  <PromptSections prompt={videoPromptResult.videoPrompt} model={videoModel} />
                </div>
              </div>

              {/* PT Translation */}
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">📖 Tradução & Análise</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{videoPromptResult.videoPromptPtBr}</p>
              </div>

              {/* Audio (VEO/Sora) */}
              {videoPromptResult.audioInstructions && (
                <AudioInstructionsCard audio={videoPromptResult.audioInstructions} />
              )}
            </div>

            {/* Right: Specs + notes */}
            <div className="space-y-4">
              {/* Confidence score */}
              {videoPromptResult.promptConfidenceScore > 0 && (
                <PromptQualityScore score={videoPromptResult.promptConfidenceScore} />
              )}

              {/* Technical specs */}
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">⚙️ Config no Higgsfield</p>
                <div className="grid grid-cols-2 gap-2">
                  <SpecTag icon={Camera} label="Modelo" value={videoPromptResult.technicalSpecs.model || videoModel} />
                  <SpecTag icon={Clock} label="Duração" value={videoPromptResult.technicalSpecs.duration || `${duration}s`} />
                  <SpecTag icon={Monitor} label="Aspect Ratio" value={videoPromptResult.technicalSpecs.aspectRatio || aspectRatio} />
                  <SpecTag icon={Monitor} label="Resolução" value={videoPromptResult.technicalSpecs.resolution || '1080p'} />
                </div>
                <div className="mt-3 space-y-2">
                  {/* Lens mode */}
                  <LensModeBadge lensMode={videoPromptResult.lensMode || (videoPromptResult.technicalSpecs.fixedLens ? 'fixed' : 'unfixed')} />
                  <div className={cn('flex items-center gap-2 rounded-lg border px-3 py-2',
                    videoPromptResult.technicalSpecs.audio ? 'border-green-500/20 bg-green-500/10' : 'border-muted bg-muted/30')}>
                    <Volume2 className={cn('h-3.5 w-3.5', videoPromptResult.technicalSpecs.audio ? 'text-green-400' : 'text-muted-foreground')} />
                    <p className={cn('text-xs font-bold', videoPromptResult.technicalSpecs.audio ? 'text-green-400' : 'text-muted-foreground')}>
                      Áudio Nativo: {videoPromptResult.technicalSpecs.audio ? 'ON' : 'OFF'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Director notes */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clapperboard className="h-3.5 w-3.5 text-primary" />
                  <p className="text-xs font-bold text-foreground uppercase tracking-wider">Notas do Diretor</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{videoPromptResult.directorNotes}</p>
              </div>

              {/* Tips & Warnings */}
              {videoPromptResult.warningsAndTips?.length > 0 && (
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />
                    <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Dicas & Atenção</p>
                  </div>
                  <ul className="space-y-1">
                    {videoPromptResult.warningsAndTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                        <Lightbulb className="h-3.5 w-3.5 text-yellow-400 shrink-0 mt-0.5" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Frame image summary */}
              {generatedImage && (
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Frame Inicial</p>
                  <div className="flex items-center gap-3">
                    <img src={generatedImage} alt="Frame" className="h-16 w-auto rounded-lg border border-border object-cover" />
                    <div>
                      <p className="text-xs text-foreground font-bold">Start Frame gerado</p>
                      <p className="text-[10px] text-muted-foreground">Faça upload no Higgsfield</p>
                      <a href={generatedImage} download="frame-dqef.png">
                        <button className="mt-1 text-[10px] text-primary hover:underline">Baixar</button>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Final export checklist */}
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
            <p className="text-xs font-bold text-green-400 mb-2">✅ Checklist para o Higgsfield</p>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {[
                generatedImage ? '✓ Frame inicial gerado e pronto para upload' : '⚠ Gere o frame inicial na etapa anterior',
                '✓ Prompt copiado — cole no campo de prompt',
                `✓ Modelo: ${videoModel}`,
                `✓ Aspecto: ${aspectRatio} | Duração: ${duration}s`,
                `✓ Lens Mode: ${videoPromptResult.lensMode === 'unfixed' ? 'Unfixed (câmera em movimento)' : 'Fixed (câmera estática)'}`,
                `✓ Áudio Nativo: ${videoPromptResult.technicalSpecs.audio ? 'ON' : 'OFF'}`,
              ].map((item, i) => (
                <p key={i} className="text-xs text-foreground">{item}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
