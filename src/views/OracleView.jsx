import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Sparkles, Send, Clock, ChevronDown, ChevronUp, Loader2, Mic, MicOff, WifiOff, Eye, Search, X, Scroll as ScrollIcon, History } from 'lucide-react';
import { useLorekeeperState } from '../hooks/useLorekeeperState';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useNotification } from '../hooks/useNotification';
import { callGemini } from '../utils/ai';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { getAnalysisPrompt } from '../utils/archiveAnalysis';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_LABEL = { personajes: 'Personaje', lugares: 'Lugar', reglas: 'Regla', glosario: 'Glosario' };

function EntitySearch({ allEntities, selectedEntity, onSelect, onClear }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return allEntities.slice(0, 8);
    const q = query.toLowerCase();
    return allEntities.filter(e => e.name.toLowerCase().includes(q)).slice(0, 10);
  }, [query, allEntities]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (entity) => {
    onSelect(entity);
    setQuery('');
    setOpen(false);
  };

  const handleClear = () => {
    onClear();
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative flex items-stretch gap-2">
      <button
        onClick={onClear}
        className={`flex-shrink-0 px-4 h-10 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center ${
          !selectedEntity ? 'bg-accent text-white border-accent' : 'bg-header-bg text-stone-500 border-accent/20 hover:border-accent/40'
        }`}
      >
        Voz del Éter
      </button>

      <div className="relative flex-1">
        <div className={`flex items-center gap-2 border-b rounded-none px-3 h-10 transition-all ${
          open ? 'border-accent/60 bg-accent/5' : 'border-primary/20 bg-transparent'
        }`}>
          <Search size={12} className="text-stone-400 flex-shrink-0" />
          {selectedEntity && !open ? (
            <span className="flex-1 text-[10px] font-bold uppercase tracking-widest text-accent truncate">{selectedEntity.name}</span>
          ) : (
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder={selectedEntity ? selectedEntity.name : 'Invocar nombre del Archivo...'}
              className="flex-1 bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none text-primary-text placeholder:text-stone-400 placeholder:normal-case placeholder:tracking-normal placeholder:font-normal"
            />
          )}
          {selectedEntity && (
            <button onClick={handleClear} className="text-stone-400 hover:text-accent transition-colors flex-shrink-0">
              <X size={12} />
            </button>
          )}
        </div>

        {open && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-item-bg border border-accent/20 rounded-sm shadow-xl z-50 max-h-52 overflow-y-auto">
            {filtered.map(entity => (
              <button
                key={`${entity.category}-${entity.name}`}
                onMouseDown={() => handleSelect(entity)}
                className="w-full text-left px-3 py-2.5 flex items-center justify-between hover:bg-accent/10 transition-colors group"
              >
                <span className="text-[11px] font-serif text-primary-text group-hover:text-accent transition-colors">{entity.name}</span>
                <span className="text-[9px] uppercase tracking-widest text-stone-400">{CATEGORY_LABEL[entity.category] || entity.category}</span>
              </button>
            ))}
          </div>
        )}

        {open && query.trim() && filtered.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-item-bg border border-accent/20 rounded-sm shadow-xl z-50 px-3 py-4">
            <p className="text-[10px] text-stone-400 font-serif italic text-center">Sin registros en el Archivo</p>
          </div>
        )}
      </div>
    </div>
  );
}

const DEFAULT_GREETING = { id: 1, role: 'oracle', text: '"Hablad, buscador de historias. Las sombras del Archivo se agitan ante vuestra presencia. ¿Qué secreto deseáis desentrañar de los anales hoy?"' };

export function OracleView({ initialFocus, onClearFocus }) {
  const { archive, entries } = useLorekeeperState();
  const notify = useNotification();

  // Per-entity conversation map: entityKey → messages[]
  const [conversationMap, setConversationMap] = useLocalStorage('oracle-conversations-v5', {});
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useLocalStorage('oracle-history-v4', []);
  const { recordingField, toggle: toggleRecording, error: speechError, isSupported: speechSupported } = useSpeechRecognition();
  const { isOnline } = useNetworkStatus();
  const isProcessing = useRef(false);
  const scrollRef = useRef(null);

  const entityKey = selectedEntity ? `${selectedEntity.category}-${selectedEntity.name}` : 'free';
  const entityKeyRef = useRef(entityKey);
  useEffect(() => { entityKeyRef.current = entityKey; }, [entityKey]);

  const messages = conversationMap[entityKey] || [DEFAULT_GREETING];

  const setMessages = useCallback((updater) => {
    const key = entityKeyRef.current;
    setConversationMap(prev => {
      const current = prev[key] || [DEFAULT_GREETING];
      const next = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [key]: next };
    });
  }, [setConversationMap]);

  const allEntities = useMemo(() => {
    const list = [];
    ['personajes', 'lugares', 'reglas', 'glosario'].forEach(cat => {
      (archive[cat] || []).forEach(item => list.push({ ...item, category: cat }));
    });
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [archive]);

  const [keyboardH, setKeyboardH] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const kh = Math.round(window.innerHeight - vv.offsetTop - vv.height);
      setKeyboardH(kh > 50 ? kh : 0);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  useEffect(() => {
    if (initialFocus) {
      const found = allEntities.find(e => e.name === initialFocus.name);
      if (found) setSelectedEntity(found);
    }
  }, [initialFocus, allEntities]);

  useEffect(() => {
    return () => { if (onClearFocus) onClearFocus(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const buildAccumulatedContext = (entity, allEntries) => {
    if (entity) {
      const categoryKey = { personajes: 'characters', lugares: 'places', glosario: 'glossary', reglas: 'worldRules' }[entity.category] || 'characters';
      const mentions = [...allEntries]
        .filter(e => (e[categoryKey] || []).some(item => item.name === entity.name))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-8)
        .map(e => {
          const item = (e[categoryKey] || []).find(i => i.name === entity.name);
          const tags = item?.tags?.length ? ` [${item.tags.join(', ')}]` : '';
          return `• ${e.date} · ${e.book} · ${e.chapter}: ${item?.content || '(sin notas)'}${tags}`;
        });

      return `El buscador consulta sobre: ${entity.name} (${entity.category}).

Conocimiento acumulado en el Archivo: ${entity.content || '(sin resumen consolidado)'}
Tags: ${entity.tags?.join(', ') || 'ninguno'}

Historial de apariciones en las crónicas (${mentions.length} registradas, orden cronológico):
${mentions.length > 0 ? mentions.join('\n') : '(sin apariciones detalladas aún)'}`;
    }

    const recent = [...allEntries]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .map(e => `• ${e.date} · ${e.book} · ${e.chapter}${e.summary ? ': ' + e.summary.slice(0, 180) : ''}`)
      .join('\n');

    return `Consulta general sobre el Gran Archivo.${recent ? `\n\nÚltimas crónicas registradas:\n${recent}` : '\n\nEl grimorio aún no contiene crónicas.'}`;
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isTyping || isProcessing.current) return;

    isProcessing.current = true;

    const userText = input.trim();
    const newMessages = [...messages, { id: Date.now(), role: 'user', text: userText }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const contextPrompt = buildAccumulatedContext(selectedEntity, entries);
      const prompt = `${contextPrompt}\n\nPregunta del buscador: "${userText}"\n\nResponde como Oráculo solemne y poético en español. Tono místico pero informativo. No demasiado extenso.`;

      const response = await callGemini(prompt, "Eres el Oráculo del Gran Archivo, un sabio eterno que conoce todos los hilos del destino y la evolución de cada ser registrado en las crónicas.");

      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'oracle', text: response }]);
    } catch (err) {
      notify(err?.message || "El Oráculo se ha sumido en el silencio. Intenta de nuevo.", "error");
    } finally {
      setIsTyping(false);
      isProcessing.current = false;
    }
  };

  const handleConsultArchive = async () => {
    if (isTyping || isProcessing.current) return;
    isProcessing.current = true;
    setIsTyping(true);

    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }

    try {
      const analysisContext = getAnalysisPrompt(archive);
      const prompt = `${analysisContext}\n\nActúa como el Oráculo del Archivo. Usando estos hilos sueltos detectados, susurra una visión poética y mística sobre lo que el buscador aún no ha descubierto o ha dejado en el olvido. No seas demasiado directo, usa metáforas.`;

      const response = await callGemini(prompt, "Eres el Oráculo del Gran Archivo. Tu misión es revelar los vacíos en la historia con un lenguaje místico y evocador.");

      setMessages(prev => [...prev, { id: Date.now(), role: 'oracle', text: response }]);
    } catch {
      notify("Las brumas del archivo son demasiado densas ahora. Intenta de nuevo.", "error");
    } finally {
      setIsTyping(false);
      isProcessing.current = false;
    }
  };

  const startNewConversation = () => {
    if (messages.length > 1) {
      setConversations(prev => [{ id: Date.now(), date: new Date().toISOString(), messages }, ...prev].slice(0, 10));
    }
    setMessages([{ id: Date.now(), role: 'oracle', text: '"El hilo anterior se ha tejido. Empecemos de nuevo, buscador."' }]);
  };

  const restoreConversation = (history) => {
    setMessages(history.messages);
    setShowHistory(false);
    notify("Conversación recuperada de las sombras.", "info");
  };

  return (
    <div className="flex flex-col animate-fade-in relative overflow-hidden" style={{ height: `calc(100dvh - var(--main-padding-top) - var(--nav-height) - ${keyboardH}px)` }}>
      {/* Header Fixed */}
      <div className="sticky top-0 z-30 bg-header-bg/95 backdrop-blur-md pb-3 border-b border-primary/10 flex flex-col gap-3">
        <div className="flex justify-between items-center px-1">
          <div className="flex flex-col">
            <h2 className="text-2xl font-ritual text-primary-text tracking-wide uppercase">El Oráculo</h2>
            <p className="text-[10px] text-accent font-archival italic uppercase tracking-[0.25em] opacity-80">Consultar los Ecos de Sabiduría</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-item-bg border border-primary/20 text-accent hover:border-accent/40 rounded-sm transition-all shadow-sm active:scale-95"
              aria-label="Explorar Ecos"
            >
              <ScrollIcon size={14} />
              <span className="text-[9px] font-bold uppercase tracking-widest hidden sm:inline">Ecos</span>
            </button>
          </div>
        </div>

        <EntitySearch
          allEntities={allEntities}
          selectedEntity={selectedEntity}
          onSelect={setSelectedEntity}
          onClear={() => setSelectedEntity(null)}
        />
      </div>

      {/* History Drawer */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-header-bg/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[85%] max-w-sm bg-header-bg shadow-2xl z-[101] border-l border-primary/20 flex flex-col"
            >
              <div className="p-6 border-b border-primary/10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <History size={16} className="text-accent" />
                  <h3 className="font-ritual text-lg text-primary-text uppercase tracking-wider">Ecos del Pasado</h3>
                </div>
                <button onClick={() => setShowHistory(false)} className="p-2 text-stone-400 hover:text-primary-text">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <button
                  onClick={() => { startNewConversation(); setShowHistory(false); }}
                  className="w-full py-3 px-4 bg-accent/10 border border-accent/20 text-accent rounded-sm font-bold uppercase tracking-widest text-[10px] hover:bg-accent/20 transition-all flex items-center justify-center gap-2 mb-4"
                >
                  <Sparkles size={14} /> Invocar Nuevo Trance
                </button>

                {conversations.length === 0 ? (
                  <p className="text-xs text-stone-400 italic text-center py-10">El Éter está en silencio...</p>
                ) : (
                  conversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => restoreConversation(conv)}
                      className="w-full text-left p-4 rounded-xl bg-item-bg border border-primary/10 hover:border-accent/30 hover:shadow-md transition-all group"
                    >
                      <p className="text-xs text-primary-text/80 font-serif line-clamp-2 mb-2 italic">
                        "{conv.messages[1]?.text || "Consulta sin pregunta"}"
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-stone-400 uppercase tracking-tighter">{new Date(conv.date).toLocaleDateString()}</span>
                        <span className="text-[9px] text-accent font-bold opacity-0 group-hover:opacity-100 transition-opacity">REINVOCAR</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-1 pt-6 space-y-1 scroll-smooth scrollbar-hide pb-6"
      >
        {messages.map((msg, idx) => (
          <div key={msg.id} className="flex flex-col animate-fade-in">
            {msg.role === 'user' ? (
              <div className="flex flex-col items-center justify-center my-2 opacity-70 italic">
                <span className="text-[8px] font-archival font-bold text-accent mb-1 tracking-[0.4em]">✦ PETICIÓN ✦</span>
                <p className="text-xs font-serif text-primary-text px-8 text-center max-w-sm">"{msg.text}"</p>
              </div>
            ) : (
              <div className="oracle-inscription space-y-3 py-3 animate-inscribe">
                <div className="flex items-center gap-3 text-[10px] font-ritual text-accent tracking-[0.3em] mb-3">
                  <Sparkles size={12} className="animate-pulse" />
                  <span>VISIÓN DEL ORÁCULO</span>
                </div>
                <div className="prose-stone prose-sm md:prose-base indent-6 line-clamp-none overflow-visible">
                   <span dangerouslySetInnerHTML={{ __html: msg.text
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.+?)\*/g, '<em>$1</em>')
                    .replace(/\n/g, '<br/>')
                  }} />
                </div>
                {idx < messages.length - 1 && <div className="mystic-divider"><span>✧</span></div>}
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex flex-col items-start my-8 transition-all">
             <div className="flex items-center gap-3 text-[10px] font-ritual text-accent tracking-[0.3em] mb-4 animate-pulse">
                <Sparkles size={12} />
                <span>EL ORÁCULO ESTÁ TEJIENDO...</span>
              </div>
              <div className="w-full h-px bg-gradient-to-right from-accent/40 via-accent/5 to-transparent animate-shimmer" />
          </div>
        )}
      </div>

      {/* Input Area - Integrated structural Footer */}
      <div className="z-40 bg-header-bg/95 backdrop-blur-sm border-t border-primary/20 pt-4 pb-6 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] transition-all duration-300">
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          {/* Contextual Vision Trigger - Ritualized but compact */}
          <div className="flex justify-center -mt-8 mb-1">
            <button
              onClick={handleConsultArchive}
              disabled={isTyping}
              className="flex items-center gap-2 px-3 py-1.5 bg-item-bg border border-accent/30 rounded-full shadow-md hover:border-accent/60 transition-all active:scale-95 disabled:opacity-40"
              title="Invocar Visiones del Archivo"
            >
              <Eye size={12} className="text-accent" />
              <span className="text-[8px] font-archival italic text-accent uppercase tracking-[0.3em] font-bold">Visiones del Archivo</span>
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {!isOnline && (
              <div className="flex items-center justify-center gap-2 py-1 bg-zinc-900/50 backdrop-blur-sm rounded-full border border-zinc-800">
                <WifiOff size={10} className="text-zinc-500" />
                <p className="text-[9px] text-zinc-500 font-serif italic uppercase tracking-tighter">Sin conexión al Éter</p>
              </div>
            )}

            <form
              onSubmit={handleSend}
              className={`flex items-center gap-1.5 px-3 py-1 bg-item-bg/40 rounded-xl transition-all duration-500 border border-transparent ${isOnline ? 'border-accent/20 focus-within:border-accent/40 ring-1 ring-transparent focus-within:ring-accent/5' : 'border-stone-700'}`}
            >
              {speechSupported && (
                <button
                  type="button"
                  onClick={() => toggleRecording('oracle', (text) => {
                    setInput(prev => (prev + ' ' + text).trim());
                  })}
                  disabled={!isOnline}
                  className={`p-2 transition-all flex items-center justify-center ${
                    recordingField === 'oracle'
                    ? 'text-red-500 animate-pulse'
                    : 'text-stone-500 hover:text-accent'
                  }`}
                >
                  {recordingField === 'oracle' ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              )}
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isTyping || !isOnline}
                inputMode="text"
                enterKeyHint="send"
                placeholder={!isOnline ? 'El Éter está en silencio...' : "Inscribe tu consulta..."}
                className="flex-1 bg-transparent px-3 py-4 text-sm sm:text-base outline-none font-serif italic text-primary-text placeholder:text-stone-500/60 placeholder:normal-case placeholder:italic"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping || !isOnline}
                className="p-3 text-accent hover:text-accent-secondary transition-all disabled:opacity-20 active:scale-95"
              >
                {isTyping ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
