import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, rectSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toPng } from 'html-to-image';
import {
  Plus, Download, Trash2, Image as ImageIcon, Upload, Grid3x3, User, Heart, MessageCircle, Send, Bookmark,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GridItem {
  id: string;
  file_url: string | null;
  thumbnail_url: string | null;
  title: string;
  grid_position: number | null;
}

function SortableCell({ item, onClick }: { item: GridItem; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="aspect-square cursor-grab overflow-hidden bg-muted active:cursor-grabbing"
      onClick={onClick}
    >
      {item.file_url || item.thumbnail_url ? (
        <img src={item.thumbnail_url || item.file_url || ''} alt={item.title} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center"><ImageIcon className="h-6 w-6 text-muted-foreground/30" /></div>
      )}
    </div>
  );
}

export default function GridInstagram() {
  const { user } = useAuth();
  const { toast } = useToast();
  const gridRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<GridItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleRows, setVisibleRows] = useState(3);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [profileName, setProfileName] = useState('@seuperfil');
  const [selectedItem, setSelectedItem] = useState<GridItem | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { if (user) fetchItems(); }, [user]);

  async function fetchItems() {
    const { data } = await supabase
      .from('active_creatives')
      .select('id, file_url, thumbnail_url, title, grid_position')
      .not('grid_position', 'is', null)
      .order('grid_position', { ascending: true });
    if (data) setItems(data as GridItem[]);
    setLoading(false);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIdx = prev.findIndex((i) => i.id === active.id);
      const newIdx = prev.findIndex((i) => i.id === over.id);
      const updated = arrayMove(prev, oldIdx, newIdx);
      // Persist positions
      updated.forEach((item, idx) => {
        supabase.from('active_creatives').update({ grid_position: idx }).eq('id', item.id).then(() => {});
      });
      return updated;
    });
  }

  async function handleUploadToGrid() {
    if (!user || !newFile) return;
    setUploading(true);
    const ext = newFile.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('brand-assets').upload(path, newFile);
    if (upErr) { toast({ title: 'Erro', description: upErr.message, variant: 'destructive' }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('brand-assets').getPublicUrl(path);
    const { error: insErr } = await supabase.from('active_creatives').insert({
      user_id: user.id,
      title: newTitle || 'Post',
      file_url: urlData.publicUrl,
      thumbnail_url: urlData.publicUrl,
      platform: 'Instagram',
      format_type: 'Feed',
      status: 'active',
      grid_position: items.length,
    });
    if (!insErr) {
      toast({ title: 'Post adicionado ao grid!' });
      setShowUpload(false);
      setNewFile(null);
      setNewTitle('');
      fetchItems();
    }
    setUploading(false);
  }

  async function handleRemoveFromGrid(id: string) {
    await supabase.from('active_creatives').update({ grid_position: null }).eq('id', id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelectedItem(null);
    toast({ title: 'Removido do grid' });
  }

  async function handleExportPNG() {
    if (!gridRef.current) return;
    const dataUrl = await toPng(gridRef.current, { pixelRatio: 3, backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    link.download = `grid-instagram-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    toast({ title: 'Grid exportado como PNG!' });
  }

  const visibleItems = items.slice(0, visibleRows * 3);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setShowUpload(true)}><Plus className="mr-1 h-3.5 w-3.5" /> Adicionar post</Button>
        <Button size="sm" variant="outline" onClick={handleExportPNG}><Download className="mr-1 h-3.5 w-3.5" /> Exportar PNG</Button>
        <div className="ml-auto flex gap-1">
          {[3, 6, 9].map((n) => (
            <Button key={n} size="sm" variant={visibleRows === n ? 'default' : 'ghost'} onClick={() => setVisibleRows(n)}>{n}</Button>
          ))}
        </div>
      </div>

      {/* Instagram Mockup */}
      <Card className="overflow-hidden border-border bg-white text-black">
        <div ref={gridRef} className="bg-white">
          {/* Profile Header */}
          <div className="flex items-center gap-4 p-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-amber-500">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white">
                <User className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-black">{profileName}</p>
              <div className="mt-1 flex gap-4 text-xs text-gray-600">
                <span><strong className="text-black">{items.length}</strong> posts</span>
                <span><strong className="text-black">10.2k</strong> seguidores</span>
                <span><strong className="text-black">482</strong> seguindo</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">Bio do perfil · Edite o nome acima</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-t border-gray-200">
            <div className="flex flex-1 items-center justify-center gap-1 border-b-2 border-black py-2">
              <Grid3x3 className="h-4 w-4" />
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="p-10 text-center text-gray-400">Carregando...</div>
          ) : visibleItems.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-gray-400">
              <ImageIcon className="h-10 w-10 opacity-30" />
              <p className="text-sm">Adicione posts ao grid</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={visibleItems.map((i) => i.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-3 gap-[3px]">
                  {visibleItems.map((item, idx) => (
                    <div key={item.id}>
                      <SortableCell item={item} onClick={() => setSelectedItem(item)} />
                      {/* Row cut line every 3 posts */}
                      {(idx + 1) % 3 === 0 && idx < visibleItems.length - 1 && (
                        <div className="h-0" />
                      )}
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </Card>

      {/* Profile name edit */}
      <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="@seuperfil" className="text-sm" />

      {/* Item dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{selectedItem?.title}</DialogTitle>
            <DialogDescription>Opções do post</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-3">
              {selectedItem.file_url && <img src={selectedItem.file_url} alt="" className="w-full rounded-lg" />}
              <Button variant="destructive" size="sm" className="w-full" onClick={() => handleRemoveFromGrid(selectedItem.id)}>
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Remover do grid
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar ao Grid</DialogTitle>
            <DialogDescription>Upload de uma nova imagem para o feed</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Título do post" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <div className="rounded-lg border border-dashed border-border p-4 text-center">
              <input type="file" accept="image/*" onChange={(e) => setNewFile(e.target.files?.[0] || null)} className="hidden" id="grid-upload" />
              <label htmlFor="grid-upload" className="cursor-pointer text-sm text-muted-foreground hover:text-primary">
                <Upload className="mx-auto mb-1 h-6 w-6" />
                {newFile ? newFile.name : 'Selecionar imagem'}
              </label>
            </div>
            <Button className="w-full" onClick={handleUploadToGrid} disabled={!newFile || uploading}>
              {uploading ? 'Enviando...' : 'Adicionar ao Grid'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
