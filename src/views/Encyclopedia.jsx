import React, { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { Search, ChevronRight, BookOpen, Clock, Filter, Scroll, Sparkles, Map } from 'lucide-react';
import { useLorekeeperState } from '../hooks/useLorekeeperState';

const WisdomMap = lazy(() => import('./WisdomMap').then(m => ({ default: m.WisdomMap })));

export function Encyclopedia({ entityFocus, onClearFocus, onConsultOracle }) {
  const { archive, books } = useLorekeeperState();
  const [view, setView] = useState('archive'); // 'archive' | 'map'
  const [categoryFilter, setCategoryFilter] = useState('todos'); // 'todos', 'personajes', 'lugares', 'reglas', 'glosario'
  const [searchTerm, setSearchTermRaw] = useState('');
  const [bookFilter, setBookFilterRaw] = useState('todos');
  const [visibleCount, setVisibleCount] = useState(20);
  const PAGE_SIZE = 20;

  const setSearchTerm = useCallback((v) => { setSearchTermRaw(v); setVisibleCount(PAGE_SIZE); }, []);
  const setBookFilter = useCallback((v) => { setBookFilterRaw(v); setVisibleCount(PAGE_SIZE); }, []);

  const filteredData = useMemo(() => {
    const allCategories = ['personajes', 'lugares', 'reglas', 'glosario'];
    let raw = [];
    
    if (categoryFilter === 'todos') {
      allCategories.forEach(cat => {
        raw = [...raw, ...(archive[cat] || []).map(item => ({ ...item, type: cat }))];
      });
    } else {
      raw = (archive[categoryFilter] || []).map(item => ({ ...item, type: categoryFilter }));
    }

    if (bookFilter !== 'todos') {
      raw = raw.filter(item => item.book === bookFilter || item.mentions.some(m => m.book === bookFilter));
    }
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      raw = raw.filter(item =>
        item.name.toLowerCase().includes(lowerSearch) ||
        item.tags.some(t => t.toLowerCase().includes(lowerSearch))
      );
    }
    
    return raw.sort((a, b) => a.name.localeCompare(b.name));
  }, [archive, categoryFilter, searchTerm, bookFilter]);

  // Apply entity focus from navigation (Adjusting state when a prop changes)
  const [prevEntityFocus, setPrevEntityFocus] = useState(null);
  if (entityFocus !== prevEntityFocus) {
    setPrevEntityFocus(entityFocus);
    if (entityFocus) {
      setSearchTermRaw(entityFocus);
      setBookFilterRaw('todos');
      setView('archive');
      
      for (const cat of ['personajes', 'lugares', 'reglas', 'glosario']) {
        if (archive[cat]?.some(e => e.name.toLowerCase().includes(entityFocus.toLowerCase()))) {
          setCategoryFilter(cat);
          break;
        }
      }
      setVisibleCount(PAGE_SIZE);
      if (onClearFocus) onClearFocus();
    }
  }

  const visibleData = filteredData.slice(0, visibleCount);
  const hasMore = visibleCount < filteredData.length;

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-20">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-serif text-primary-text tracking-tight">El Archivo</h2>
          <p className="text-xs text-stone-500 font-serif italic tracking-wide">Consulta los misterios registrados</p>
        </div>
        <div className="flex gap-1 bg-item-bg rounded-sm p-1 mb-1">
          <button
            onClick={() => setView('archive')}
            aria-label="Vista de lista"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest font-serif transition-all ${view === 'archive' ? 'bg-accent text-white shadow-sm' : 'text-stone-500 hover:text-accent'}`}
          >
            <Scroll size={12} />
            Lista
          </button>
          <button
            onClick={() => setView('map')}
            aria-label="Vista de mapa"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest font-serif transition-all ${view === 'map' ? 'bg-accent text-white shadow-sm' : 'text-stone-500 hover:text-accent'}`}
          >
            <Map size={12} />
            Mapa
          </button>
        </div>
      </div>

      {view === 'map' && (
        <Suspense fallback={<div className="flex items-center justify-center py-20"><span className="text-stone-400 font-serif italic text-sm">Invocando el mapa…</span></div>}>
          <WisdomMap />
        </Suspense>
      )}

      {view === 'map' && null /* skip archive content below */}
      {view !== 'map' && <>

      {/* SEARCH — sticky */}
      <div className="sticky top-16 z-40 backdrop-blur-md py-3 -mt-3 border-b border-accent/20" style={{ backgroundColor: 'color-mix(in srgb, var(--bg-app) 95%, transparent)' }}>
        <div className="relative group">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-accent transition-colors" size={18} />
          <input
            type="text" placeholder="Inscribir búsqueda..."
            aria-label="Buscar en los registros"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-b-2 border-accent/40 py-3 pl-8 pr-4 text-lg outline-none focus:border-accent transition-all font-serif italic text-primary-text placeholder:text-stone-400/60"
          />
        </div>
      </div>

      {/* BOOK FILTER */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1 -mt-3 scrollbar-hide">
        <Filter size={14} className="text-accent/40 flex-shrink-0" />
        <button
          onClick={() => setBookFilter('todos')}
          className={`px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest border transition-all flex-shrink-0 ${
            bookFilter === 'todos' 
            ? 'bg-accent text-zinc-950 border-accent' 
            : 'bg-header-bg text-stone-500 border-primary/50 hover:border-accent/40'
          }`}
        >
          Todos los Libros
        </button>
        {books.filter(b => !b.title.includes('—')).map(b => (
          <button
            key={b.id || b.title}
            onClick={() => setBookFilter(b.title)}
            className={`px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest border transition-all flex-shrink-0 ${bookFilter === b.title ? 'bg-header-bg border-accent text-accent shadow-inner' : 'bg-item-bg border-stone-200 text-stone-500 hover:border-stone-400'}`}
          >
            {b.emoji} {b.title}
          </button>
        ))}
      </div>

      {/* CATEGORY MICRO-FILTERS */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {['todos', 'personajes', 'lugares', 'reglas', 'glosario'].map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`text-[10px] font-bold uppercase tracking-widest transition-all ${categoryFilter === cat ? 'text-accent border-b border-accent' : 'text-stone-400 hover:text-stone-600'}`}
          >
            {cat === 'todos' ? 'Cualquier Categoría' : cat}
          </button>
        ))}
      </div>

      {/* ENTITY LIST */}
      {filteredData.length > 0 && (searchTerm || bookFilter !== 'todos' || categoryFilter !== 'todos') && (
        <p className="text-[10px] text-stone-400 font-serif italic -mt-2">
          {filteredData.length} {filteredData.length === 1 ? 'registro encontrado' : 'registros encontrados'}
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredData.length === 0 ? (
          <div className="bg-header-bg flex flex-col items-center gap-3 text-center py-20 border-2 border-dashed border-primary/20 rounded-sm">
            <div className="text-4xl opacity-30">📜</div>
            <p className="text-primary-text/50 font-serif italic text-sm max-w-xs leading-relaxed">
              Las estanterías del Archivo aguardan en silencio para estos criterios.
            </p>
          </div>
        ) : (
          <>
            {visibleData.map((item) => (
              <EntityCard
                key={`${item.type}-${item.name}`}
                item={item}
                onConsultOracle={onConsultOracle}
              />
            ))}
            {hasMore && (
              <button
                onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                className="py-5 text-sm text-accent font-serif italic bg-header-bg hover:bg-section-bg rounded-sm transition-colors shadow-sm tracking-wide"
              >
                Mostrar más registros ({filteredData.length - visibleCount} restantes)
              </button>
            )}
          </>
        )}
      </div>
      </>}
    </div>
  );
}

const EntityCard = React.memo(function EntityCard({ item, onConsultOracle }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`bg-header-bg transition-all duration-500 rounded-sm overflow-hidden border border-primary/30 shadow-sm ${isExpanded ? 'shadow-md' : 'hover:shadow-md'}`}>
      <div className={`p-5 flex justify-between items-start cursor-pointer transition-colors ${isExpanded ? 'bg-section-bg border-b border-primary/20' : 'hover:bg-section-bg/60'}`} onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1 min-w-0">
            <h3 className="font-serif text-xl text-primary-text font-bold truncate flex-1 min-w-0">{item.name}</h3>
            <div className="flex flex-wrap gap-1 shrink-0">
              {item.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[9px] bg-accent/20 text-accent px-2 py-0.5 rounded-full border border-accent/40 uppercase tracking-widest font-bold whitespace-nowrap">{tag}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-accent text-[10px] uppercase tracking-widest font-bold opacity-70">
            <BookOpen size={10}/>
            <span>Visto por primera vez en: <span className="italic normal-case font-serif">{item.book}</span></span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-3 pt-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onConsultOracle(item); }}
            aria-label="Consultar el Oráculo"
            title="Consultar el Oráculo"
            className="p-2 rounded-lg text-accent/60 hover:text-accent transition-colors"
          >
            <Sparkles size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} aria-label={isExpanded ? 'Colapsar' : 'Expandir'} className="p-2.5">
            <ChevronRight size={20} className={`text-accent/60 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-accent' : ''}`} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-5 pt-5 pb-5 animate-fade-in flex flex-col gap-6 bg-item-bg/80 border-t border-primary/50">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-accent/30 pb-2">
              <Clock size={14} className="text-accent/40" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent/70">Cronología de Observaciones</span>
            </div>
            <div className="flex flex-col gap-3 pl-2 border-l border-accent/40 ml-1">
              {item.mentions.map((mention, idx) => (
                <div key={idx} className="relative pl-6">
                  <div className="absolute left-[-4.5px] top-2 w-2 h-2 rounded-full bg-header-bg border border-accent/60" />
                  <span className="text-[10px] text-accent/60 block mb-1 font-bold uppercase tracking-widest">{mention.date} • {mention.book}</span>
                  <p className="text-sm text-primary-text/80 italic leading-relaxed font-serif">"{mention.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
