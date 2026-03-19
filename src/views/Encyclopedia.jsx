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
      {/* TITLE — non-sticky */}
      <h2 className="text-3xl font-serif text-heading">El Archivo</h2>

      {/* SEARCH & FILTER — sticky, compact */}
      <div className="sticky top-16 z-40 bg-zinc-950/90 backdrop-blur-md py-3 -mt-3 flex flex-col gap-2 border-b border-zinc-900/60">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
          <input
            type="text" placeholder="Buscar en los registros..."
            aria-label="Buscar en los registros"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-amber-500/50 transition-all font-serif italic"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <Filter size={14} className="text-zinc-600 flex-shrink-0" />
          <button
            onClick={() => setBookFilter('todos')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex-shrink-0 ${bookFilter === 'todos' ? 'bg-amber-500 text-zinc-950 border-amber-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
          >
            Todos los Libros
          </button>
          {books.filter(b => !b.title.includes('—')).map(b => (
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

      {/* ORACLE INVITATION — visible hasta que se consulte el Oráculo por primera vez */}
      {Object.values(archive).some(arr => arr.length > 0) && Object.keys(oracleReplies).length === 0 && (
        <div className="border border-oracle/20 bg-oracle/5 rounded-xl p-4 flex items-start gap-3">
          <Sparkles size={16} className="text-oracle/70 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-serif text-heading font-bold">El Oráculo aguarda ser consultado</p>
            <p className="text-xs text-zinc-500 font-serif italic mt-1 leading-relaxed">
              Expande cualquier registro y convoca al Oráculo para revelar su historia oculta.
            </p>
          </div>
        </div>
      )}

      {/* ENTITY LIST */}
      <div className="flex flex-col gap-4">
        {filteredData.length === 0 ? (
          <div className="flex flex-col items-center gap-3 text-center py-20 border-2 border-dashed border-zinc-900 rounded-2xl">
            <Scroll size={36} className="text-zinc-700" />
            <p className="text-zinc-500 font-serif italic text-sm max-w-xs leading-relaxed">
              {(searchTerm || bookFilter !== 'todos')
                ? `El Archivo no guarda registros de ${tabs.find(t => t.id === activeTab)?.label ?? activeTab} bajo estos criterios.`
                : 'El Archivo aguarda en silencio. Registra tu primera crónica para poblar esta sección.'}
            </p>
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
    <div className={`bg-zinc-900 border transition-all duration-500 rounded-2xl overflow-hidden shadow-xl ${isExpanded ? 'border-oracle/30' : 'border-zinc-800 hover:border-zinc-700'}`}>
      <div className="p-5 flex justify-between items-start">
        <div className="flex-1 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-serif text-xl text-heading">{item.name}</h3>
            <div className="flex gap-1">
              {item.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-xs bg-zinc-950 text-zinc-500 px-2 py-0.5 rounded border border-zinc-800 uppercase tracking-widest font-bold">{tag}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-widest font-bold">
            <BookOpen size={10}/>
            <span>Visto por primera vez en: {item.book}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-3 pt-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); setIsExpanded(true); onInvoke(); }}
            aria-label="Consultar el Oráculo"
            title="Consultar el Oráculo"
            className={`p-2 rounded-lg transition-colors ${
              isLoading ? 'text-oracle/50' :
              oracleReply ? 'text-oracle/70 hover:text-oracle' :
              'text-zinc-600 hover:text-oracle'
            }`}
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          </button>
          <button onClick={() => setIsExpanded(!isExpanded)} aria-label={isExpanded ? 'Colapsar' : 'Expandir'} className="p-1.5">
            <ChevronRight size={20} className={`text-zinc-700 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-oracle' : ''}`} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-5 pb-5 animate-fade-in flex flex-col gap-6">
          {/* ORACLE FIRST */}
          <div className="border border-oracle/20 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-oracle/10 bg-oracle/5">
              <Sparkles size={13} className="text-oracle/70" />
              <span className="font-serif text-xs uppercase tracking-[0.2em] text-oracle/70 font-bold">La Revelación del Oráculo</span>
            </div>
            <div className="p-5">
              {oracleReply ? (
                <div className="animate-fade-in flex flex-col gap-4">
                  <p className="text-base text-heading italic leading-relaxed font-serif">
                    {oracleReply}
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); onInvoke(true); }}
                    className="self-start text-xs text-zinc-600 hover:text-oracle transition-colors font-bold uppercase tracking-widest"
                  >
                    Solicitar otra revelación
                  </button>
                </div>
              ) : isLoading ? (
                <div className="flex items-center gap-3">
                  <Loader2 size={16} className="animate-spin text-oracle/60 flex-shrink-0" />
                  <p className="text-xs text-zinc-500 italic font-serif">Desvelando el destino...</p>
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onInvoke(); }}
                  className="w-full py-3 text-oracle border border-oracle/20 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-oracle/5 transition-colors flex items-center justify-center gap-2 active:scale-95"
                >
                  <Sparkles size={14} />
                  Tocar el Oráculo
                </button>
              )}
            </div>
          </div>

          {/* TIMELINE SECOND */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
              <Clock size={14} className="text-zinc-600" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Cronología de Observaciones</span>
            </div>
            <div className="flex flex-col gap-3 pl-2 border-l border-zinc-800 ml-1">
              {item.mentions.map((mention, idx) => (
                <div key={idx} className="relative pl-6">
                  <div className="absolute left-[-5px] top-2 w-2 h-2 rounded-full bg-zinc-800 border border-zinc-700" />
                  <span className="text-xs text-zinc-500 block mb-1 font-bold">{mention.date} • {mention.book}</span>
                  <p className="text-xs text-zinc-400 italic leading-relaxed font-serif">"{mention.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
