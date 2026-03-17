import React, { useState, useMemo, useCallback } from 'react';
import { Search, User, Globe, HelpCircle, Sparkles, ChevronRight, BookOpen, Clock, Filter, Loader2, Scroll } from 'lucide-react';
import { callGemini } from '../utils/ai';
import { useLorekeeperState } from '../hooks/useLorekeeperState';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useNotification } from '../hooks/useNotification';

export function Encyclopedia() {
  const { archive, books } = useLorekeeperState();
  const notify = useNotification();
  const [activeTab, setActiveTabRaw] = useState('personajes');
  const [searchTerm, setSearchTermRaw] = useState('');
  const [bookFilter, setBookFilterRaw] = useState('todos');
  const [oracleReplies, setOracleReplies] = useLocalStorage('oracle-replies', {});
  const [loadingOracle, setLoadingOracle] = useState(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const PAGE_SIZE = 20;

  const tabs = [
    { id: 'personajes', label: 'Personajes', icon: <User size={16}/> },
    { id: 'lugares', label: 'Lugares', icon: <Globe size={16}/> },
    { id: 'reglas', label: 'Reglas', icon: <Scroll size={16}/> },
    { id: 'glosario', label: 'Glosario', icon: <HelpCircle size={16}/> }
  ];

  const filteredData = useMemo(() => {
    let raw = archive[activeTab] || [];
    if (bookFilter !== 'todos') {
      raw = raw.filter(item => item.book === bookFilter || item.mentions.some(m => m.book === bookFilter));
    }
    if (searchTerm) {
      raw = raw.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return raw;
  }, [archive, activeTab, searchTerm, bookFilter]);

  const setActiveTab = useCallback((v) => { setActiveTabRaw(v); setVisibleCount(PAGE_SIZE); }, []);
  const setSearchTerm = useCallback((v) => { setSearchTermRaw(v); setVisibleCount(PAGE_SIZE); }, []);
  const setBookFilter = useCallback((v) => { setBookFilterRaw(v); setVisibleCount(PAGE_SIZE); }, []);

  const visibleData = filteredData.slice(0, visibleCount);
  const hasMore = visibleCount < filteredData.length;

  const invokeOracle = async (entityName, type, force = false) => {
    if (!force && oracleReplies[entityName]) return;
    setLoadingOracle(entityName);

    const mentions = archive[activeTab].find(e => e.name === entityName)?.mentions.map(m => m.text).join(' ');
    if (!mentions) {
      setOracleReplies(prev => ({ ...prev, [entityName]: "Aún no hay suficientes registros sobre este nombre en el Archivo..." }));
      setLoadingOracle(null);
      return;
    }

    try {
      const prompt = `Como el Oráculo del Gran Archivo, da una revelación poética y solemne sobre ${entityName} (${type}).
      Basa tu sabiduría únicamente en estas observaciones: "${mentions}".
      REGLA CRÍTICA: Responde con PROSA POÉTICA FLUIDA en español.
      NO respondas con JSON. NO uses bloques de código. NO uses listas.
      Busca la belleza en el misterio. No hagas spoilers más allá de lo leído.`;

      const reply = await callGemini(prompt, "Eres un oráculo misterioso y solemne que habla en prosa poética, nunca en código.");
      setOracleReplies(prev => ({ ...prev, [entityName]: reply }));
    } catch {
      notify("El Oráculo guarda silencio por ahora. Intenta de nuevo.", "error");
    } finally {
      setLoadingOracle(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-24 h-full">
      <div className="sticky top-16 z-40 bg-zinc-950/80 backdrop-blur-md p-4 rounded-xl border border-zinc-900 shadow-lg">
        <h2 className="text-3xl font-serif text-amber-500 mb-4">El Archivo</h2>

        {/* SEARCH & FILTER */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
            <input
              type="text" placeholder="Buscar en los registros..."
              aria-label="Buscar en los registros"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-amber-500/50 transition-all font-serif italic"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Filter size={14} className="text-zinc-600 flex-shrink-0" />
            <button
              onClick={() => setBookFilter('todos')}
              className={`px-3 py-1.5 rounded-full text-[9px] font-bold border transition-all flex-shrink-0 ${bookFilter === 'todos' ? 'bg-amber-500 text-zinc-950 border-amber-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
            >
              Todos los Libros
            </button>
            {books.filter(b => !b.title.includes('—')).map(b => (
              <button
                key={b.id || b.title}
                onClick={() => setBookFilter(b.title)}
                className={`px-3 py-1.5 rounded-full text-[9px] font-bold border transition-all flex-shrink-0 ${bookFilter === b.title ? 'bg-amber-600/20 border-amber-500/50 text-amber-400' : 'bg-zinc-950 border-zinc-800 text-zinc-600'}`}
              >
                {b.emoji} {b.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div role="tablist" aria-label="Categorías del archivo" className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-zinc-800 text-amber-500 shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ENTITY LIST */}
      <div className="flex flex-col gap-4">
        {filteredData.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 font-serif italic border-2 border-dashed border-zinc-900 rounded-2xl">
             No hay registros de "{activeTab}" bajo estos criterios.
          </div>
        ) : (
          <>
            {visibleData.map((item) => (
              <EntityCard
                key={item.name}
                item={item}
                oracleReply={oracleReplies[item.name]}
                onInvoke={(force) => invokeOracle(item.name, activeTab, force)}
                isLoading={loadingOracle === item.name}
              />
            ))}
            {hasMore && (
              <button
                onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                className="py-4 text-sm text-amber-500 font-serif italic border border-zinc-800 rounded-xl hover:bg-zinc-900 transition-colors"
              >
                Mostrar más registros ({filteredData.length - visibleCount} restantes)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const EntityCard = React.memo(function EntityCard({ item, oracleReply, onInvoke, isLoading }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`bg-zinc-900 border transition-all duration-500 rounded-2xl overflow-hidden shadow-xl ${isExpanded ? 'border-amber-500/30' : 'border-zinc-800 hover:border-zinc-700'}`}>
      <div className="p-5 flex justify-between items-start cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-serif text-xl text-amber-100">{item.name}</h3>
            <div className="flex gap-1">
              {item.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[8px] bg-zinc-950 text-zinc-500 px-2 py-0.5 rounded border border-zinc-800 uppercase tracking-widest font-bold">{tag}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
            <BookOpen size={10}/>
            <span>Visto por primera vez en: {item.book}</span>
          </div>
        </div>
        <ChevronRight size={20} className={`text-zinc-700 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-amber-500' : ''}`} />
      </div>

      {isExpanded && (
        <div className="px-5 pb-5 animate-fade-in flex flex-col gap-6">
          {/* EVOLUTION TIMELINE */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
              <Clock size={14} className="text-amber-600" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Cronología de Observaciones</span>
            </div>
            <div className="flex flex-col gap-3 pl-2 border-l border-zinc-800 ml-1">
              {item.mentions.map((mention, idx) => (
                <div key={idx} className="relative pl-6">
                  <div className="absolute left-[-5px] top-2 w-2 h-2 rounded-full bg-zinc-800 border border-zinc-700" />
                  <span className="text-[9px] text-zinc-600 block mb-1 font-bold">{mention.date} • {mention.book}</span>
                  <p className="text-xs text-zinc-400 italic leading-relaxed font-serif">"{mention.text}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* ORACLE REVELATION */}
          <div className="relative group p-[1px] bg-gradient-to-tr from-amber-900/40 via-amber-500/20 to-amber-900/40 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.05)]">
            <div className="absolute inset-0 bg-zinc-950 rounded-2xl" />

            <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full transition-all duration-1000 group-hover:bg-amber-500/10" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full transition-all duration-1000 group-hover:bg-amber-500/10" />

            <div className="relative p-6 flex flex-col items-center text-center">
              <div className="mb-4 flex flex-col items-center">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 mb-2 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                  <Sparkles size={20} className="text-amber-500 animate-pulse" />
                </div>
                <h4 className="font-serif text-[10px] uppercase tracking-[0.3em] text-amber-600 font-bold">La Revelación del Oráculo</h4>
              </div>

              {oracleReply ? (
                <div className="animate-fade-in space-y-4">
                  <div className="relative">
                    <span className="absolute -top-2 -left-4 text-4xl text-amber-500/10 font-serif leading-none">"</span>
                    <p className="text-base text-amber-50/90 italic leading-relaxed font-serif drop-shadow-sm px-2">
                       {oracleReply}
                    </p>
                    <span className="absolute -bottom-4 -right-2 text-4xl text-amber-500/10 font-serif leading-none">"</span>
                  </div>
                  <div className="flex flex-col items-center gap-4 mt-6">
                    <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                    <button
                      onClick={(e) => { e.stopPropagation(); onInvoke(true); }}
                      className="text-[8px] uppercase tracking-widest text-zinc-600 hover:text-amber-500 transition-colors font-bold"
                    >
                      Solicitar otra revelación
                    </button>
                  </div>
                </div>
              ) : isLoading ? (
                <div className="w-full max-w-xs flex flex-col items-center gap-4 py-4 animate-pulse">
                  <Loader2 size={24} className="animate-spin text-amber-500/60" />
                  <p className="text-[10px] uppercase tracking-[0.2em] text-amber-600/60 font-bold">Desvelando el destino...</p>
                  <div className="w-full space-y-2">
                    <div className="h-2 bg-amber-500/10 rounded-full w-full" />
                    <div className="h-2 bg-amber-500/10 rounded-full w-4/5 mx-auto" />
                    <div className="h-2 bg-amber-500/10 rounded-full w-3/5 mx-auto" />
                  </div>
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onInvoke(); }}
                  className="w-full max-w-xs py-4 bg-zinc-950/50 hover:bg-amber-500/5 text-amber-500 border border-amber-500/30 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500 group/btn hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center gap-3"
                >
                  <Sparkles size={16} className="group-hover/btn:rotate-12 transition-transform" />
                  <span>Tocar el Oráculo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
