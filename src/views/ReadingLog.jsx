import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, History, Search, Filter, User, Globe, HelpCircle, Edit3, Trash2, Link as LinkIcon, Image as ImageIcon, CalendarDays, CheckSquare, Square, X } from 'lucide-react';
import { EntryForm } from './EntryForm';
import { useLorekeeperState } from '../hooks/useLorekeeperState';
import { useNotification } from '../hooks/useNotification';
import { resolvePanels } from '../utils/imageStore';
import { ConfirmModal } from '../components/ConfirmModal';

let _nextId = 0;
function uid() { return `entry-${Date.now()}-${_nextId++}-${Math.random().toString(36).slice(2, 7)}`; }

export function ReadingLog() {
  const { entries, setEntries, books } = useLorekeeperState();
  const notify = useNotification();
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [pendingSave, setPendingSave] = useState(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [searchTerm, setSearchTermRaw] = useState('');
  const [bookFilter, setBookFilterRaw] = useState('todos');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const PAGE_SIZE = 20;

  const setSearchTerm = useCallback((v) => { setSearchTermRaw(v); setVisibleCount(PAGE_SIZE); }, []);
  const setBookFilter = useCallback((v) => { setBookFilterRaw(v); setVisibleCount(PAGE_SIZE); }, []);

  const filteredEntries = useMemo(() => {
    let result = entries;
    if (bookFilter !== 'todos') {
      result = result.filter(e => e.book === bookFilter);
    }
    if (dateFrom) {
      result = result.filter(e => e.date >= dateFrom);
    }
    if (dateTo) {
      result = result.filter(e => e.date <= dateTo);
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(e =>
        e.book?.toLowerCase().includes(q) ||
        e.chapter?.toLowerCase().includes(q) ||
        e.reingreso?.toLowerCase().includes(q) ||
        e.characters?.some(c => c.name.toLowerCase().includes(q)) ||
        e.places?.some(p => p.name.toLowerCase().includes(q))
      );
    }
    return result;
  }, [entries, searchTerm, bookFilter, dateFrom, dateTo]);

  const visibleEntries = filteredEntries.slice(0, visibleCount);
  const hasMore = visibleCount < filteredEntries.length;

  const checkDuplicate = (newEntry) => {
    return entries.some(e =>
      e.id !== newEntry.id &&
      e.book === newEntry.book &&
      e.date === newEntry.date &&
      e.chapter === newEntry.chapter
    );
  };

  const commitSave = (newEntry) => {
    if (editingId) {
      setEntries(entries.map(e => e.id === editingId ? newEntry : e));
    } else {
      setEntries([{ ...newEntry, id: uid() }, ...entries]);
    }
    setIsAdding(false);
    setEditingId(null);
    setPendingSave(null);
  };

  const saveEntry = (newEntry) => {
    if (!editingId && checkDuplicate(newEntry)) {
      setPendingSave(newEntry);
      return;
    }
    commitSave(newEntry);
  };

  const deleteEntry = (id, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setDeleteConfirm(id);
  };

  const confirmDelete = () => {
    setEntries(prev => prev.filter(ent => ent.id !== deleteConfirm));
    setDeleteConfirm(null);
  };

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setIsAdding(true);
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const bulkDelete = () => {
    if (selected.size === 0) return;
    setBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = () => {
    setEntries(prev => prev.filter(e => !selected.has(e.id)));
    notify(`${selected.size} crónicas desvanecidas.`, 'success');
    setSelected(new Set());
    setBulkMode(false);
    setBulkDeleteConfirm(false);
  };

  const exitBulk = () => {
    setBulkMode(false);
    setSelected(new Set());
  };

  if (isAdding) {
    const initialData = editingId ? entries.find(e => e.id === editingId) : null;
    return <EntryForm books={books} onSave={saveEntry} onCancel={() => { setIsAdding(false); setEditingId(null); }} initialData={initialData} />;
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-24">
      {deleteConfirm && (
        <ConfirmModal
          title="Desvanecer Crónica"
          message="¿Deseas desvanecer esta crónica para siempre? Esta acción no se puede deshacer."
          confirmLabel="Desvanecer"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
      {pendingSave && (
        <ConfirmModal
          title="Crónica duplicada"
          message="Ya existe una crónica para este libro, fecha y ubicación. ¿Guardar de todas formas?"
          confirmLabel="Guardar"
          onConfirm={() => commitSave(pendingSave)}
          onCancel={() => setPendingSave(null)}
        />
      )}
      {bulkDeleteConfirm && (
        <ConfirmModal
          title="Desvanecer crónicas"
          message={`¿Desvanecer ${selected.size} crónica${selected.size !== 1 ? 's' : ''} seleccionada${selected.size !== 1 ? 's' : ''}? Esta acción no se puede deshacer.`}
          confirmLabel="Desvanecer"
          danger
          onConfirm={confirmBulkDelete}
          onCancel={() => setBulkDeleteConfirm(false)}
        />
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-serif text-heading">Bitácora</h2>
        {bulkMode && (
          <div className="flex items-center gap-2">
            <button onClick={bulkDelete} disabled={selected.size === 0} className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-danger-deep hover:bg-danger-deep/80 text-white rounded-lg transition-colors disabled:opacity-40">
              Eliminar ({selected.size})
            </button>
            <button onClick={exitBulk} aria-label="Salir de selección" className="p-2 text-zinc-500 hover:text-zinc-300">
              <X size={20} />
            </button>
          </div>
        )}
        {!bulkMode && entries.length > 1 && (
          <button onClick={() => setBulkMode(true)} aria-label="Selección múltiple" className="p-2 text-zinc-500 hover:text-amber-500 transition-colors">
            <CheckSquare size={20} />
          </button>
        )}
      </div>

      {/* FLOATING FAB — always accessible */}
      {!bulkMode && (
        <button
          onClick={() => setIsAdding(true)}
          aria-label="Nueva crónica"
          className="fixed bottom-20 right-4 z-[110] bg-amber-600 hover:bg-amber-500 text-zinc-950 p-4 rounded-full shadow-2xl transition-all active:scale-95"
        >
          <Plus size={24} />
        </button>
      )}

      {/* SEARCH & FILTER */}
      {entries.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
            <input
              type="text" placeholder="Buscar en tus crónicas..."
              aria-label="Buscar en tus crónicas"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-amber-500/50 transition-all font-serif italic"
            />
          </div>
          {/* DATE RANGE */}
          <div className="flex items-center gap-2">
            <CalendarDays size={14} className="text-zinc-600 flex-shrink-0" />
            <input
              type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setVisibleCount(PAGE_SIZE); }}
              aria-label="Fecha desde"
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-zinc-400 outline-none focus:border-amber-500/50 font-serif"
            />
            <span className="text-zinc-600 text-xs">—</span>
            <input
              type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setVisibleCount(PAGE_SIZE); }}
              aria-label="Fecha hasta"
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-zinc-400 outline-none focus:border-amber-500/50 font-serif"
            />
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(''); setDateTo(''); }} aria-label="Limpiar fechas" className="p-1.5 text-zinc-600 hover:text-amber-500">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter size={14} className="text-zinc-600 flex-shrink-0" />
            <button
              onClick={() => setBookFilter('todos')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex-shrink-0 ${bookFilter === 'todos' ? 'bg-amber-500 text-zinc-950 border-amber-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
            >
              Todos
            </button>
            {books.map(b => (
              <button
                key={b.id || b.title}
                onClick={() => setBookFilter(b.title)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex-shrink-0 ${bookFilter === b.title ? 'bg-amber-600/20 border-amber-500/50 text-amber-400' : 'bg-zinc-950 border-zinc-800 text-zinc-600'}`}
              >
                {b.emoji} {b.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-24 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
            <History size={48} className="mx-auto text-zinc-600 mb-4" />
            <p className="text-zinc-600 font-serif italic text-sm">
              {(searchTerm || dateFrom || dateTo || bookFilter !== 'todos')
                ? 'No se encontraron crónicas con estos filtros.'
                : 'El archivo está en silencio. Toca + para registrar tu primera crónica.'}
            </p>
          </div>
        ) : (
          <>
            {visibleEntries.map((entry) => (
              <LogCard
                key={entry.id}
                entry={entry}
                onEdit={() => startEdit(entry)}
                onDelete={(e) => deleteEntry(entry.id, e)}
                bulkMode={bulkMode}
                isSelected={selected.has(entry.id)}
                onToggleSelect={() => toggleSelect(entry.id)}
              />
            ))}
            {hasMore && (
              <button
                onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                className="py-4 text-sm text-amber-500 font-serif italic border border-zinc-800 rounded-xl hover:bg-zinc-900 transition-colors"
              >
                Mostrar más crónicas ({filteredEntries.length - visibleCount} restantes)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const LogCard = React.memo(function LogCard({ entry, onEdit, onDelete, bulkMode, isSelected, onToggleSelect }) {
  return (
    <div
      onClick={bulkMode ? onToggleSelect : undefined}
      className={`group bg-zinc-900 border rounded-2xl overflow-hidden transition-all flex flex-col shadow-xl ${
        bulkMode ? 'cursor-pointer' : ''
      } ${isSelected ? 'border-amber-500 ring-1 ring-amber-500/30' : 'border-zinc-800 hover:border-amber-500/30'}`}
    >
      <div className="bg-zinc-950/40 p-4 flex justify-between items-center border-b border-zinc-800/50">
        <div className="flex items-center gap-3">
          {bulkMode && (
            <div className="text-amber-500">
              {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
            </div>
          )}
          <div>
            <h3 className="font-serif text-heading text-lg">{entry.book}</h3>
            <p className="text-xs text-zinc-500 uppercase tracking-[0.2em] font-bold">{entry.date} • {entry.chapter || 'S/N'}</p>
          </div>
        </div>
        {!bulkMode && (
          <div className="flex items-center gap-1">
            <span className="bg-zinc-950 text-amber-500 px-3 py-1 rounded-full text-xs border border-amber-500/20 font-bold shadow-inner">
              {entry.mood}
            </span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity">
              <button onClick={onEdit} aria-label="Editar crónica" className="p-3 text-zinc-500 hover:text-amber-500 active:text-amber-500"><Edit3 size={16}/></button>
              <button onClick={onDelete} aria-label="Eliminar crónica" className="p-3 text-zinc-500 hover:text-danger-deep active:text-danger-deep"><Trash2 size={16}/></button>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col gap-4">
        {entry.reingreso && (
          <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/50 italic font-serif text-sm text-zinc-300 leading-relaxed relative">
             <span className="absolute -top-3 left-3 bg-zinc-900 px-2 text-xs text-amber-600 uppercase tracking-widest font-bold">Reingreso</span>
            &ldquo;{entry.reingreso}&rdquo;
          </div>
        )}

        {entry.quotes?.length > 0 && (
          <div className="flex flex-col gap-3 px-1">
            {entry.quotes.map((q, i) => (
              <div key={i} className="relative pl-6 py-1">
                <span className="absolute left-0 top-0 text-amber-500/30 text-2xl font-serif">&ldquo;</span>
                <p className="text-sm italic font-serif text-heading leading-relaxed">
                  {q}
                </p>
                <div className="absolute left-0 bottom-0 w-1 h-full bg-amber-500/10 rounded-full" />
              </div>
            ))}
          </div>
        )}

        {/* MULTI-ENTRY PREVIEWS */}
        <div className="grid grid-cols-1 gap-3">
          {entry.characters?.length > 0 && <EntrySection icon={<User size={12}/>} label="Personajes" list={entry.characters.map(c => c.name)} color="purple" />}
          {entry.places?.length > 0 && <EntrySection icon={<Globe size={12}/>} label="Lugares" list={entry.places.map(p => p.name)} color="cyan" />}
          {entry.glossary?.length > 0 && <EntrySection icon={<HelpCircle size={12}/>} label="Glosario" list={entry.glossary.map(g => g.name)} color="red" />}
          {entry.connections?.length > 0 && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2 text-amber-500/60 ml-1">
                <LinkIcon size={12}/>
                <span className="text-xs uppercase font-bold tracking-widest">Conexiones</span>
              </div>
              <div className="space-y-2">
                {entry.connections.map((conn, idx) => (
                  <div key={idx} className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {conn.bookTitles?.map(t => (
                        <span key={t} className="text-xs bg-black/40 text-amber-400 px-2 py-0.5 rounded border border-amber-900/30 font-bold">{t}</span>
                      ))}
                    </div>
                    {conn.description && <p className="text-xs text-zinc-400 italic font-serif leading-relaxed line-clamp-2">&ldquo;{conn.description}&rdquo;</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* MANGA PANELS PREVIEW */}
        {entry.mangaPanels?.length > 0 && (
          <MangaPanelsPreview panels={entry.mangaPanels} />
        )}
      </div>
    </div>
  );
});

function MangaPanelsPreview({ panels }) {
  const [resolved, setResolved] = useState([]);

  useEffect(() => {
    let cancelled = false;
    resolvePanels(panels).then(imgs => {
      if (!cancelled) setResolved(imgs);
    }).catch(() => {
      if (!cancelled) setResolved(panels.filter(p => p.startsWith('data:')));
    });
    return () => { cancelled = true; };
  }, [panels]);

  if (resolved.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 pt-2">
      {resolved.map((img, i) => (
        <div key={i} className="flex-shrink-0 w-24 aspect-video bg-black rounded-lg border border-zinc-800 overflow-hidden relative group/img">
          <img src={img} loading="lazy" className="w-full h-full object-cover opacity-60 group-hover/img:opacity-100 transition-opacity" alt={`Panel de manga ${i + 1}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-1">
            <ImageIcon size={10} className="text-zinc-500" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EntrySection({ icon, label, list, color }) {
  const colors = {
    purple: 'text-purple-400 border-purple-500/20 bg-purple-500/5',
    cyan: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5',
    red: 'text-danger-deep border-danger-deep/20 bg-danger-deep/5',
    amber: 'text-amber-500 border-amber-500/20 bg-amber-500/5',
  };

  return (
    <div className={`p-2 rounded-lg border flex items-center justify-between gap-3 ${colors[color]}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex flex-wrap gap-1 justify-end">
        {list.map(item => <span key={item} className="text-xs bg-black/40 px-2 py-0.5 rounded border border-zinc-800 text-zinc-300">{item}</span>)}
      </div>
    </div>
  );
}
