import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Plus, Search, User, Globe, HelpCircle, Edit3, Trash2, Link as LinkIcon, Image as ImageIcon, CalendarDays, CheckSquare, Square, X, Share2, ChevronDown, Shield, ScrollText, Sparkles } from 'lucide-react';
import { ShareQuote } from '../components/ShareQuote';
import { EntryForm } from './EntryForm';
import { useLorekeeperState } from '../hooks/useLorekeeperState';
import { useNotification } from '../hooks/useNotification';
import { resolvePanels } from '../utils/imageStore';
import { ConfirmModal } from '../components/ConfirmModal';

let _nextId = 0;
function uid() { return `entry-${Date.now()}-${_nextId++}-${Math.random().toString(36).slice(2, 7)}`; }

export function ReadingLog({ onNavigateToEntity, onConsultOracle, prefilledData, onClearPrefilled }) {
  const { entries, setEntries, books, archive } = useLorekeeperState();
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
  const [shareQuote, setShareQuote] = useState(null);
  const [showDateRange, setShowDateRange] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState(new Set());
  const hasInitializedExpansion = useRef(false);
  const savedScrollY = useRef(0);
  const isAddingRef = useRef(false);
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

  // Handle prefilled data from ReadingPlan
  useEffect(() => {
    if (prefilledData) {
      setIsAdding(true);
      setEditingId(null);
      // We keep the prefilledData as it's passed below to EntryForm
    }
  }, [prefilledData]);

  // Initial expansion: open the first entry only once on load
  useEffect(() => {
    if (filteredEntries.length > 0 && !hasInitializedExpansion.current) {
      setExpandedEntries(new Set([filteredEntries[0].id]));
      hasInitializedExpansion.current = true;
    }
  }, [filteredEntries]);

  const toggleEntry = useCallback((id) => {
    setExpandedEntries(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

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

  const restoreScroll = () => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: savedScrollY.current, behavior: 'instant' });
    });
  };

  // Sync ref so popstate handler always sees the latest value
  useEffect(() => { isAddingRef.current = isAdding; }, [isAdding]);

  // Push a history entry when form opens so Android back closes it instead of leaving the tab
  useEffect(() => {
    if (isAdding) {
      history.pushState({ lk: 'form' }, '', location.href);
    }
  }, [isAdding]);

  // Handle Android back gesture while form is open
  useEffect(() => {
    const handler = () => {
      if (isAddingRef.current) {
        setIsAdding(false);
        setEditingId(null);
        if (onClearPrefilled) onClearPrefilled();
        restoreScroll();
      }
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [onClearPrefilled]); // eslint-disable-line react-hooks/exhaustive-deps

  const commitSave = (newEntry) => {
    if (editingId) {
      setEntries(entries.map(e => e.id === editingId ? newEntry : e));
    } else {
      setEntries([{ ...newEntry, id: uid() }, ...entries]);
    }
    setIsAdding(false);
    setEditingId(null);
    setPendingSave(null);
    if (onClearPrefilled) onClearPrefilled();
    restoreScroll();
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
    savedScrollY.current = window.scrollY;
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
    const initialData = editingId ? entries.find(e => e.id === editingId) : prefilledData;
    return (
      <EntryForm 
        books={books} 
        onSave={saveEntry} 
        onCancel={() => {
          setIsAdding(false);
          setEditingId(null);
          if (onClearPrefilled) onClearPrefilled();
          restoreScroll();
        }}
        initialData={initialData} 
      />
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-28">
      {shareQuote && (
        <ShareQuote
          quote={shareQuote.quote}
          book={shareQuote.book}
          chapter={shareQuote.chapter}
          onClose={() => setShareQuote(null)}
        />
      )}
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
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-4xl font-serif text-primary-text tracking-tight">Crónicas</h2>
        {bulkMode && (
          <div className="flex items-center gap-2">
            <button onClick={bulkDelete} disabled={selected.size === 0} className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-danger-deep hover:bg-danger-deep/80 text-white rounded-lg transition-colors disabled:opacity-40">
              Eliminar ({selected.size})
            </button>
            <button onClick={exitBulk} aria-label="Salir de selección" className="p-2 text-stone-400 hover:text-stone-600">
              <X size={20} />
            </button>
          </div>
        )}
        {!bulkMode && entries.length > 1 && (
          <button onClick={() => setBulkMode(true)} aria-label="Selección múltiple" className="p-2 text-stone-400 hover:text-accent transition-colors">
            <CheckSquare size={20} />
          </button>
        )}
      </div>

      {/* FLOATING FAB — always accessible */}
      {/* WAX SEAL FAB */}
      {!bulkMode && (
        <button
          onClick={() => { savedScrollY.current = window.scrollY; setIsAdding(true); }}
          aria-label="Nueva crónica"
          className="fixed bottom-24 right-6 z-[110] bg-accent text-white w-16 h-16 rounded-full shadow-md transition-all active:scale-90 flex flex-col items-center justify-center border-2 border-accent-secondary"
        >
          <span className="text-[7px] font-bold tracking-[0.2em] mb-0.5">NUEVA</span>
          <Plus size={20} strokeWidth={3} />
        </button>
      )}

      {/* SEARCH & FILTER */}
      {entries.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="relative group">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-accent transition-colors" size={18} />
            <input
              type="text" placeholder="Inscribir búsqueda..."
              aria-label="Buscar en tus crónicas"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              inputMode="search"
              enterKeyHint="search"
              className="w-full bg-transparent border-b-2 border-accent/40 py-3 pl-8 pr-4 text-lg outline-none focus:border-accent transition-all font-serif italic text-primary-text placeholder:text-stone-400/60"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setBookFilter('todos')}
              className={`px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest border transition-all flex-shrink-0 ${bookFilter === 'todos' ? 'bg-accent text-zinc-950 border-accent shadow-sm' : 'bg-item-bg border-primary/30 text-stone-500 hover:border-accent/40'}`}
            >
              Todos
            </button>
            {books.map(b => (
              <button
                key={b.id || b.title}
                onClick={() => setBookFilter(b.title)}
                className={`px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest border transition-all flex-shrink-0 ${bookFilter === b.title ? 'bg-header-bg border-accent text-accent shadow-inner' : 'bg-item-bg border-primary/30 text-stone-500 hover:border-accent/40'}`}
              >
                {b.emoji} {b.title}
              </button>
            ))}
            <button
              onClick={() => setShowDateRange(prev => !prev)}
              className={`px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest border transition-all flex-shrink-0 ${(dateFrom || dateTo) ? 'bg-header-bg border-accent text-accent' : 'bg-item-bg border-primary/30 text-stone-500 hover:border-accent/40'}`}
            >
              <CalendarDays size={12} className="inline mr-1" />
              {(dateFrom || dateTo) ? `${dateFrom || '…'} — ${dateTo || '…'}` : 'Fechas'}
            </button>
          </div>
          {/* DATE RANGE — collapsed by default */}
          {showDateRange && (
            <div className="flex items-center gap-3 animate-fade-in bg-header-bg p-3 rounded-lg border border-stone-200/50">
              <input
                type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setVisibleCount(PAGE_SIZE); }}
                aria-label="Fecha desde"
                className="flex-1 bg-item-bg/50 border border-stone-200 rounded-md py-2 px-3 text-xs text-primary-text outline-none focus:border-accent font-serif"
              />
              <span className="text-stone-400 text-xs">—</span>
              <input
                type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setVisibleCount(PAGE_SIZE); }}
                aria-label="Fecha hasta"
                className="flex-1 bg-item-bg/50 border border-stone-200 rounded-md py-2 px-3 text-xs text-primary-text outline-none focus:border-accent font-serif"
              />
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(''); setDateTo(''); }} aria-label="Limpiar fechas" className="p-3 text-stone-400 hover:text-accent flex items-center justify-center min-w-[44px] min-h-[44px]">
                  <X size={18} />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-6">
        {filteredEntries.length === 0 ? (
          <div className="bg-header-bg/60 text-center py-24 rounded-sm border-2 border-dashed border-primary/20 shadow-inner">
            <div className="text-4xl mb-4 opacity-30">📜</div>
            <p className="text-stone-500 font-serif italic text-sm max-w-xs mx-auto leading-relaxed">
              {(searchTerm || dateFrom || dateTo || bookFilter !== 'todos')
                ? 'Las páginas del grimorio no guardan registros bajo estos criterios. Ajusta tu búsqueda.'
                : 'El grimorio aguarda su primera inscripción. Toca el sello dorado para forjar una crónica.'}
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
                isExpanded={expandedEntries.has(entry.id)}
                onToggleExpand={() => toggleEntry(entry.id)}
                onShareQuote={(q) => setShareQuote({ quote: q, book: entry.book, chapter: entry.chapter })}
                onNavigateToEntity={onNavigateToEntity}
                onConsultOracle={onConsultOracle}
              />
            ))}
            {hasMore && (
              <button
                onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                className="py-5 text-sm text-accent font-serif italic bg-header-bg hover:bg-section-bg rounded-sm transition-colors shadow-sm tracking-wide"
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

const LogCard = React.memo(function LogCard({ entry, onEdit, onDelete, bulkMode, isSelected, onToggleSelect, isExpanded, onToggleExpand, onShareQuote, onNavigateToEntity, onConsultOracle }) {
  const contentRef = useRef(null);

  return (
    <div
      className={`group bg-header-bg rounded-sm transition-all flex flex-col shadow-sm relative ${
        bulkMode ? 'cursor-pointer' : ''
      } ${isSelected ? 'ring-2 ring-accent' : 'hover:shadow-md'}`}
    >
      <div 
        onClick={bulkMode ? onToggleSelect : onToggleExpand}
        className={`bg-section-bg p-3.5 sm:p-5 flex justify-between items-center transition-colors cursor-pointer ${isExpanded ? 'border-b border-primary/50' : ''} hover:bg-item-bg/50`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {!bulkMode && (
            <span className={`flex-shrink-0 text-accent transition-transform duration-300 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
               <ChevronDown size={18} />
            </span>
          )}
          {bulkMode && (
            <div className="flex-shrink-0 text-accent">
              {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-primary-text text-lg sm:text-xl leading-snug truncate">{entry.book}</h3>
            <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold mt-0.5">{entry.date} • {entry.chapter || 'S/N'}</p>
          </div>
        </div>
        {!bulkMode && (
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span className="hidden sm:inline-block bg-accent/5 text-accent px-2 py-0.5 rounded-sm text-[9px] border border-accent/20 font-bold uppercase tracking-wider">
              {entry.mood}
            </span>
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity">
              <button onClick={onEdit} aria-label="Editar crónica" className="p-2 text-stone-400 hover:text-accent active:text-accent flex items-center justify-center min-w-[40px] min-h-[40px]"><Edit3 size={18}/></button>
              <button onClick={onDelete} aria-label="Eliminar crónica" className="p-2 text-stone-400 hover:text-red-600 active:text-red-700 flex items-center justify-center min-w-[40px] min-h-[40px]"><Trash2 size={18}/></button>
            </div>
          </div>
        )}
      </div>

      <div 
        ref={contentRef}
        className={`transition-all duration-500 overflow-hidden ${isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="p-6 flex flex-col gap-8 bg-item-bg/80">
        {entry.summary && (
          <div className="px-1">
            <div className="flex items-center gap-2 text-accent/50 mb-2">
              <ScrollText size={12}/>
              <span className="text-[9px] uppercase font-bold tracking-widest">Resumen de la Sesión</span>
            </div>
            <p className="text-sm text-primary-text/80 font-serif leading-relaxed px-1 italic">
              {entry.summary}
            </p>
          </div>
        )}

        {entry.reingreso && (
          <div className="bg-item-bg p-5 rounded-sm border-l-4 border-accent italic font-serif text-primary-text leading-relaxed relative shadow-inner">
             <span className="absolute -top-3 left-4 bg-header-bg px-2 text-[9px] text-accent uppercase tracking-widest font-bold">Reingreso</span>
            &ldquo;{entry.reingreso}&rdquo;
          </div>
        )}

        {entry.quotes?.length > 0 && (
          <div className="flex flex-col gap-4 px-1">
            {entry.quotes.map((q, i) => (
              <div key={i} className="relative pl-8 py-2 group/quote">
                <span className="absolute left-0 top-0 text-accent text-3xl font-serif opacity-30">&ldquo;</span>
                <p className="text-base italic font-serif text-primary-text leading-relaxed">
                  {q}
                </p>
                <div className="absolute left-0 bottom-0 w-1 h-full rounded-full bg-accent/10" />
                {onShareQuote && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onShareQuote(q); }}
                    aria-label="Compartir cita"
                    className="absolute right-0 top-1 p-3 text-stone-300 hover:text-accent opacity-0 group-hover/quote:opacity-100 [@media(hover:none)]:opacity-100 transition-all font-bold flex items-center justify-center min-w-[44px] min-h-[44px]"
                  >
                    <Share2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* MULTI-ENTRY PREVIEWS */}
        <div className="grid grid-cols-1 gap-4">
          {entry.characters?.length > 0 && <EntrySection label="Personajes que intervienen en este relato" list={entry.characters.map(c => c.name)} color="character" onNavigate={onNavigateToEntity} onConsult={onConsultOracle} />}
          {entry.places?.length > 0 && <EntrySection label="Lugares recorridos durante esta jornada" list={entry.places.map(p => p.name)} color="place" onNavigate={onNavigateToEntity} onConsult={onConsultOracle} />}
          {entry.worldRules?.length > 0 && <EntrySection label="Principios y leyes de este mundo" list={entry.worldRules.map(r => typeof r === 'string' ? r : r.name)} color="rule" onNavigate={onNavigateToEntity} onConsult={onConsultOracle} />}
          {entry.glossary?.length > 0 && <EntrySection label="Saberes y dudas del archivero" list={entry.glossary.map(g => g.name)} color="glossary" onNavigate={onNavigateToEntity} onConsult={onConsultOracle} />}
          {entry.connections?.length > 0 && (
            <div className="mt-2 space-y-3">
              <div className="flex items-center gap-2 text-accent/70 ml-1">
                <LinkIcon size={12}/>
                <span className="text-[9px] uppercase font-bold tracking-widest">Conexiones</span>
              </div>
              <div className="space-y-3">
                {entry.connections.map((conn, idx) => (
                  <div key={idx} className="bg-item-bg border border-primary/10 p-4 rounded-sm shadow-sm" style={{ borderLeftWidth: '3px', borderLeftColor: 'var(--accent)' }}>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {conn.bookTitles?.map(t => (
                        <span key={t} className="text-[9px] bg-header-bg text-accent px-2 py-1 rounded-sm border border-primary/20 font-bold uppercase tracking-tight">{t}</span>
                      ))}
                    </div>
                    {conn.description && <p className="text-xs text-stone-600 italic font-serif leading-relaxed line-clamp-3">&ldquo;{conn.description}&rdquo;</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

          {entry.mangaPanels?.length > 0 && (
            <MangaPanelsPreview panels={entry.mangaPanels} />
          )}
        </div>
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
    <div className="flex gap-3 overflow-x-auto pb-3 pt-2 scrollbar-hide">
      {resolved.map((img, i) => (
        <div key={i} className="flex-shrink-0 w-32 aspect-video bg-item-bg rounded-sm border border-stone-300 overflow-hidden relative group/img shadow-sm">
          <img src={img} loading="lazy" className="w-full h-full object-cover opacity-80 group-hover/img:opacity-100 transition-opacity" alt={`Panel de manga ${i + 1}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-2">
            <ImageIcon size={12} className="text-white/70" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EntrySection({ label, list, onNavigate, onConsult }) {
  return (
    <div className="py-2 flex flex-col gap-1.5 border-t border-stone-200/40 first:border-t-0 mt-2 first:mt-0">
      <span className="text-[10px] font-serif italic text-stone-400 leading-tight uppercase tracking-widest px-1">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-1">
        {list.map((item, i) => (
          <React.Fragment key={item}>
            <div className="flex items-center gap-1 group">
              {onNavigate ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onNavigate(item); }}
                  className="text-sm font-serif text-primary-text hover:text-accent transition-all decoration-accent/30 hover:underline underline-offset-4 decoration-dotted"
                >
                  {item}
                </button>
              ) : (
                <span className="text-sm font-serif text-primary-text">{item}</span>
              )}
              {onConsult && (
                <button
                  onClick={(e) => { e.stopPropagation(); onConsult({ name: item }); }}
                  className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-accent hover:text-accent-secondary"
                  aria-label={`Consultar sobre ${item}`}
                >
                  <Sparkles size={10} />
                </button>
              )}
            </div>
            {i < list.length - 1 && (
              <span className="text-[10px] text-stone-300 pointer-events-none select-none">✦</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
