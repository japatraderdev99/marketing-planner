import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { initialCopies, initialRoteiros, initialIdeias, initialEstrategias, CopyItem, Roteiro, IdeiaDisruptiva, EstrategiaPublico, Channel, ContentObjective } from '@/data/seedData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Copy, Check, BookOpen, Lightbulb, Users, Film, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import IdeacaoTab from '@/components/biblioteca/IdeacaoTab';

const OBJECTIVE_COLORS: Record<ContentObjective, string> = {
  Awareness: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  Engajamento: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Conversão: 'bg-primary/15 text-primary border-primary/30',
  Retenção: 'bg-teal/15 text-teal border-teal/30',
};
const IMPACT_COLORS: Record<string, string> = {
  Alto: 'bg-red-500/20 text-red-400',
  Médio: 'bg-primary/20 text-primary',
  Baixo: 'bg-muted text-muted-foreground',
};
const STATUS_COLORS: Record<string, string> = {
  Aprovada: 'bg-green-500/20 text-green-400',
  Pendente: 'bg-primary/20 text-primary',
  Descartada: 'bg-muted text-muted-foreground',
};

function CopyCard({ item }: { item: CopyItem }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(item.copy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Card className="border-border bg-card hover:border-primary/30 transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
          <Button size="sm" variant="ghost" onClick={handleCopy} className={cn('shrink-0 h-7 px-2 text-xs', copied ? 'text-green-400' : 'text-muted-foreground')}>
            {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </Button>
        </div>
        <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-sans leading-relaxed mb-3 line-clamp-5">{item.copy}</pre>
        <div className="flex flex-wrap gap-1">
          <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-medium', OBJECTIVE_COLORS[item.objective])}>{item.objective}</span>
          {item.channel.slice(0, 2).map(ch => (
            <span key={ch} className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{ch}</span>
          ))}
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{item.category}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function RoteiroCard({ item }: { item: Roteiro }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="border-border bg-card hover:border-primary/30 transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
            <p className="text-xs text-muted-foreground italic">{item.subtitle}</p>
          </div>
          <div className="flex gap-1 shrink-0">
            <span className="rounded-full bg-primary/15 text-primary border border-primary/30 px-2 py-0.5 text-[10px] font-medium">{item.format}</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{item.concept}</p>
        {open && (
          <div className="mt-3 space-y-2 animate-fade-in">
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cenas</p>
              {item.scenes.map((scene, i) => (
                <p key={i} className="text-xs text-foreground mb-1">• {scene}</p>
              ))}
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">Caption</p>
              <p className="text-xs text-foreground">{item.caption}</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Por que viraliza</p>
              <p className="text-xs text-foreground">{item.viralTrigger}</p>
            </div>
            <p className="text-xs text-muted-foreground">👤 {item.persona}</p>
          </div>
        )}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex gap-1">
            {item.channel.map(ch => <span key={ch} className="text-[10px] text-muted-foreground border border-border rounded-full px-1.5 py-0.5">{ch}</span>)}
          </div>
          <button onClick={() => setOpen(o => !o)} className="ml-auto text-[10px] text-primary hover:underline">{open ? 'Fechar ▲' : 'Ver roteiro ▼'}</button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Biblioteca() {
  const [search, setSearch] = useState('');
  const [filterObj, setFilterObj] = useState<string>('all');

  const filteredCopies = initialCopies.filter(c =>
    (filterObj === 'all' || c.objective === filterObj) &&
    (search === '' || c.title.toLowerCase().includes(search.toLowerCase()) || c.copy.toLowerCase().includes(search.toLowerCase()))
  );
  const filteredRoteiros = initialRoteiros.filter(r =>
    search === '' || r.title.toLowerCase().includes(search.toLowerCase()) || r.concept.toLowerCase().includes(search.toLowerCase())
  );
  const filteredIdeias = initialIdeias.filter(i =>
    search === '' || i.title.toLowerCase().includes(search.toLowerCase()) || i.concept.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar na biblioteca..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <div className="flex gap-1">
          {['all', 'Awareness', 'Engajamento', 'Conversão', 'Retenção'].map(obj => (
            <button key={obj} onClick={() => setFilterObj(obj)}
              className={cn('rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                filterObj === obj ? 'border-primary bg-primary/20 text-primary' : 'border-border text-muted-foreground hover:border-primary/40')}>
              {obj === 'all' ? 'Todos' : obj}
            </button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="ideacao">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="ideacao" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Ideação IA
          </TabsTrigger>
          <TabsTrigger value="copies" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <Copy className="mr-1.5 h-3.5 w-3.5" /> Copies ({filteredCopies.length})
          </TabsTrigger>
          <TabsTrigger value="roteiros" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <Film className="mr-1.5 h-3.5 w-3.5" /> Roteiros ({filteredRoteiros.length})
          </TabsTrigger>
          <TabsTrigger value="ideias" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <Lightbulb className="mr-1.5 h-3.5 w-3.5" /> Ideias ({filteredIdeias.length})
          </TabsTrigger>
          <TabsTrigger value="estrategia" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <Users className="mr-1.5 h-3.5 w-3.5" /> Estratégia
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ideacao" className="mt-4">
          <IdeacaoTab />
        </TabsContent>

        <TabsContent value="copies" className="mt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCopies.map(c => <CopyCard key={c.id} item={c} />)}
          </div>
        </TabsContent>

        <TabsContent value="roteiros" className="mt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredRoteiros.map(r => <RoteiroCard key={r.id} item={r} />)}
          </div>
        </TabsContent>

        <TabsContent value="ideias" className="mt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredIdeias.map(ideia => (
              <Card key={ideia.id} className="border-border bg-card hover:border-primary/30 transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-bold text-foreground">{ideia.title}</h3>
                    <div className="flex flex-col gap-1 items-end shrink-0">
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', STATUS_COLORS[ideia.status])}>{ideia.status}</span>
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', IMPACT_COLORS[ideia.impact])}>Impacto {ideia.impact}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-muted rounded px-2 py-0.5">{ideia.format}</span>
                  <p className="mt-2 text-xs text-muted-foreground">{ideia.concept}</p>
                  <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-2">
                    <p className="text-[10px] font-bold text-primary mb-1">Por que viraliza</p>
                    <p className="text-[11px] text-foreground">{ideia.whyViral}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {ideia.channel.map(ch => <span key={ch} className="text-[10px] border border-border rounded-full px-1.5 py-0.5 text-muted-foreground">{ch}</span>)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="estrategia" className="mt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {initialEstrategias.map(est => (
              <Card key={est.id} className="border-border bg-card hover:border-primary/30 transition-all duration-200">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{est.icon}</span>
                    <div>
                      <h3 className="text-base font-black text-foreground">{est.persona}</h3>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>{est.ageRange}</span>
                        <span>·</span>
                        <span>{est.avgRate}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{est.profile}</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Dores principais</p>
                      {est.painPoints.map((p, i) => (
                        <p key={i} className="text-xs text-foreground mb-0.5">• {p}</p>
                      ))}
                    </div>
                    <div className="rounded-lg bg-primary/5 border border-primary/20 p-2">
                      <p className="text-[10px] font-bold text-primary mb-1">Abordagem</p>
                      <p className="text-xs text-foreground">{est.approach}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Hooks</p>
                      {est.hooks.map((h, i) => (
                        <p key={i} className="text-xs italic text-foreground mb-0.5">"{h}"</p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
