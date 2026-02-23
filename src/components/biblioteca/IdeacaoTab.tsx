import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Sparkles, Loader2, Check, X, Send, Image, Film, Type, Layout,
  ThumbsUp, ThumbsDown, ArrowRight, RefreshCw, Trash2
} from 'lucide-react';

interface CreativeSuggestion {
  id: string;
  input_text: string;
  input_type: string;
  suggestion_type: string;
  title: string;
  description: string | null;
  copy_text: string | null;
  visual_direction: string | null;
  channel: string | null;
  format: string | null;
  status: string;
  ai_reasoning: string | null;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { icon: typeof Image; label: string; color: string }> = {
  post: { icon: Image, label: 'Post Estático', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  carousel: { icon: Layout, label: 'Carrossel', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  video: { icon: Film, label: 'Vídeo', color: 'bg-red-500/15 text-red-400 border-red-500/30' },
  copy: { icon: Type, label: 'Copy', color: 'bg-primary/15 text-primary border-primary/30' },
  reels: { icon: Film, label: 'Reels', color: 'bg-pink-500/15 text-pink-400 border-pink-500/30' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-muted text-muted-foreground' },
  approved: { label: 'Aprovada', color: 'bg-green-500/20 text-green-400' },
  rejected: { label: 'Descartada', color: 'bg-red-500/20 text-red-400' },
  sent_to_production: { label: 'Em Produção', color: 'bg-primary/20 text-primary' },
};

function SuggestionCard({
  item,
  onApprove,
  onReject,
  onSendToProduction,
  onDelete,
}: {
  item: CreativeSuggestion;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onSendToProduction: (item: CreativeSuggestion) => void;
  onDelete: (id: string) => void;
}) {
  const typeConfig = TYPE_CONFIG[item.suggestion_type] || TYPE_CONFIG.post;
  const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
  const Icon = typeConfig.icon;
  const canSendToProduction = item.status === 'approved' &&
    (item.suggestion_type === 'carousel' || item.suggestion_type === 'post');

  return (
    <Card className="border-border bg-card hover:border-primary/30 transition-all duration-200 group">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <h3 className="text-sm font-bold text-foreground truncate">{item.title}</h3>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', statusConfig.color)}>
              {statusConfig.label}
            </span>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100" onClick={() => onDelete(item.id)}>
              <Trash2 className="h-3 w-3 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Type + Channel badges */}
        <div className="flex flex-wrap gap-1 mb-2">
          <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-medium', typeConfig.color)}>
            {typeConfig.label}
          </span>
          {item.channel && (
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
              {item.channel}
            </span>
          )}
          {item.format && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              {item.format}
            </span>
          )}
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-3">{item.description}</p>
        )}

        {/* Copy text */}
        {item.copy_text && (
          <div className="rounded-lg bg-muted/30 p-2 mb-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Copy</p>
            <p className="text-xs text-foreground line-clamp-4 whitespace-pre-wrap">{item.copy_text}</p>
          </div>
        )}

        {/* Visual direction */}
        {item.visual_direction && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-2 mb-2">
            <p className="text-[10px] font-bold text-primary mb-1">Direção Visual</p>
            <p className="text-xs text-foreground">{item.visual_direction}</p>
          </div>
        )}

        {/* AI reasoning */}
        {item.ai_reasoning && (
          <p className="text-[10px] text-muted-foreground italic mb-3">💡 {item.ai_reasoning}</p>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 mt-2">
          {item.status === 'pending' && (
            <>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-green-400 hover:text-green-300 hover:bg-green-500/10"
                onClick={() => onApprove(item.id)}>
                <ThumbsUp className="h-3 w-3 mr-1" /> Aprovar
              </Button>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={() => onReject(item.id)}>
                <ThumbsDown className="h-3 w-3 mr-1" /> Descartar
              </Button>
            </>
          )}
          {canSendToProduction && (
            <Button size="sm" className="h-7 px-3 text-xs bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30"
              onClick={() => onSendToProduction(item)}>
              <Send className="h-3 w-3 mr-1" /> Enviar p/ Produção
            </Button>
          )}
          {item.status === 'rejected' && (
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground"
              onClick={() => onApprove(item.id)}>
              <RefreshCw className="h-3 w-3 mr-1" /> Reaprovar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function IdeacaoTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inputText, setInputText] = useState('');
  const [inputType, setInputType] = useState('mixed');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<CreativeSuggestion[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Load existing suggestions
  useEffect(() => {
    if (!user) return;
    loadSuggestions();
  }, [user]);

  const loadSuggestions = async () => {
    const { data, error } = await supabase
      .from('creative_suggestions')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setSuggestions(data as CreativeSuggestion[]);
    if (error) console.error('Error loading suggestions:', error);
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() || !user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-creative-input', {
        body: { input_text: inputText, input_type: inputType, user_id: user.id },
      });
      if (error) throw error;
      if (data?.suggestions) {
        setSuggestions(prev => [...data.suggestions, ...prev]);
        setInputText('');
        toast({ title: `${data.suggestions.length} sugestões geradas!`, description: 'Revise e aprove as que mais interessam.' });
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Erro na análise', description: err.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('creative_suggestions')
      .update({ status })
      .eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('creative_suggestions').delete().eq('id', id);
    if (!error) setSuggestions(prev => prev.filter(s => s.id !== id));
  };

  const handleSendToProduction = (item: CreativeSuggestion) => {
    // Update status to sent_to_production
    handleUpdateStatus(item.id, 'sent_to_production');

    // Navigate based on type
    const targetPath = item.suggestion_type === 'carousel' ? '/ai-carrosseis' : '/criativo';
    toast({
      title: 'Enviado para produção!',
      description: `Acesse a aba de ${item.suggestion_type === 'carousel' ? 'Carrosséis' : 'Criativos'} para produzir.`,
    });

    // Copy context to clipboard for easy paste
    const context = [item.title, item.description, item.copy_text, item.visual_direction].filter(Boolean).join('\n\n');
    navigator.clipboard.writeText(context);
  };

  const filtered = suggestions.filter(s =>
    filterStatus === 'all' || s.status === filterStatus
  );

  const counts = {
    all: suggestions.length,
    pending: suggestions.filter(s => s.status === 'pending').length,
    approved: suggestions.filter(s => s.status === 'approved').length,
    sent_to_production: suggestions.filter(s => s.status === 'sent_to_production').length,
  };

  return (
    <div className="space-y-4">
      {/* Input area */}
      <Card className="border-border bg-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Input Criativo</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Cole referências, ideias, prompts de vídeo, copies ou qualquer material criativo. A IA vai analisar e gerar sugestões acionáveis.
          </p>
          <Textarea
            placeholder="Cole aqui suas referências, ideias, prompts, copies, conceitos visuais...&#10;&#10;Exemplo: 'Quero um carrossel mostrando os 5 maiores erros de eletricistas ao precificar, com tom provocativo e dados reais'"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            className="min-h-[120px] bg-background border-border text-sm"
          />
          <div className="flex items-center gap-3">
            <Select value={inputType} onValueChange={setInputType}>
              <SelectTrigger className="w-[180px] h-8 text-xs bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mixed">Misto / Geral</SelectItem>
                <SelectItem value="static">Estático (Posts)</SelectItem>
                <SelectItem value="video">Vídeo / Reels</SelectItem>
                <SelectItem value="copy">Copies / Textos</SelectItem>
                <SelectItem value="prompt">Prompts de IA</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAnalyze} disabled={loading || !inputText.trim()} className="h-8 px-4 text-xs">
              {loading ? (
                <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Analisando...</>
              ) : (
                <><Sparkles className="h-3 w-3 mr-1.5" /> Analisar com IA</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter bar */}
      {suggestions.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {[
            { key: 'all', label: `Todas (${counts.all})` },
            { key: 'pending', label: `Pendentes (${counts.pending})` },
            { key: 'approved', label: `Aprovadas (${counts.approved})` },
            { key: 'sent_to_production', label: `Produção (${counts.sent_to_production})` },
          ].map(f => (
            <button key={f.key} onClick={() => setFilterStatus(f.key)}
              className={cn('rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                filterStatus === f.key
                  ? 'border-primary bg-primary/20 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              )}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Suggestions grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(item => (
            <SuggestionCard
              key={item.id}
              item={item}
              onApprove={id => handleUpdateStatus(id, 'approved')}
              onReject={id => handleUpdateStatus(id, 'rejected')}
              onSendToProduction={handleSendToProduction}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : suggestions.length > 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Nenhuma sugestão com esse filtro.</p>
        </div>
      ) : (
        <div className="text-center py-12">
          <Sparkles className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Insira materiais criativos acima para gerar sugestões com IA.</p>
        </div>
      )}
    </div>
  );
}
