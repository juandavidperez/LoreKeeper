import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Sparkles, Send, User, MessageSquare, Clock, X, ChevronDown, ChevronUp, Loader2, RotateCcw, Mic, MicOff, WifiOff, Eye } from 'lucide-react';
import { useLorekeeperState } from '../hooks/useLorekeeperState';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useNotification } from '../hooks/useNotification';
import { callGemini } from '../utils/ai';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { getAnalysisPrompt } from '../utils/archiveAnalysis';

export function OracleView({ initialFocus, onClearFocus }) {
  const { archive } = useLorekeeperState();
  const notify = useNotification();
  
  // States
  const [messages, setMessages] = useLocalStorage('oracle-messages-v4', [
    { id: 1, role: 'oracle', text: '"Hablad, buscador de historias. Las sombras del Archivo se agitan ante vuestra presencia. ¿Qué secreto deseáis desentrañar de los anales hoy?"' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null); // { name, type, category }
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useLocalStorage('oracle-history-v4', []);
  const { recordingField, toggle: toggleRecording, error: speechError, isSupported: speechSupported } = useSpeechRecognition();
  const { isOnline } = useNetworkStatus();
  const isProcessing = useRef(false);
  const scrollRef = useRef(null);

  const allEntities = useMemo(() => {
    const list = [];
    ['personajes', 'lugares', 'reglas', 'glosario'].forEach(cat => {
      (archive[cat] || []).forEach(item => list.push({ ...item, category: cat }));
    });
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [archive]);

  // Track keyboard height via visualViewport (fixes iOS input covered by keyboard)
  const [inputBottom, setInputBottom] = useState(80);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const keyboardH = Math.round(window.innerHeight - vv.offsetTop - vv.height);
      const isLandscape = window.matchMedia('(orientation: landscape) and (max-height: 500px)').matches;
      const navH = isLandscape ? 40 : 80;
      setInputBottom(keyboardH > 50 ? keyboardH + 8 : navH);
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  // Handle initial focus from Encyclopedia or Log
  useEffect(() => {
    if (initialFocus) {
      const found = allEntities.find(e => e.name === initialFocus.name);
      if (found) {
        setSelectedEntity(found);
      }
    }
  }, [initialFocus, allEntities]);

  // Clear focus on unmount
  useEffect(() => {
    return () => {
      if (onClearFocus) onClearFocus();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

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
      let contextPrompt = "";
      if (selectedEntity) {
        contextPrompt = `Estás hablando específicamente sobre ${selectedEntity.name} (${selectedEntity.category}). 
        Contexto del archivo: ${selectedEntity.content || ''}. Tags: ${selectedEntity.tags?.join(', ') || ''}.`;
      } else {
        contextPrompt = "Te consultan sobre los archivos del grimorio en general.";
      }

      const prompt = `${contextPrompt}\n\nPregunta del usuario: "${userText}"\n\nResponde como un Oráculo solemne y poético en español. Usa un tono místico pero informativo. No seas demasiado extenso.`;
      
      const response = await callGemini(prompt, "Eres el Oráculo del Gran Archivo, un sabio eterno que conoce todos los hilos del destino.");
      
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
    
    // Auto-scroll to show the Oracle starting to "see"
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }

    try {
      const analysisContext = getAnalysisPrompt(archive);
      const prompt = `${analysisContext}\n\nActúa como el Oráculo del Archivo. Usando estos hilos sueltos detectados, susurra una visión poética y mística sobre lo que el buscador aún no ha descubierto o ha dejado en el olvido. No seas demasiado directo, usa metáforas.`;
      
      const response = await callGemini(prompt, "Eres el Oráculo del Gran Archivo. Tu misión es revelar los vacíos en la historia con un lenguaje místico y evocador.");
      
      setMessages(prev => [...prev, { id: Date.now(), role: 'oracle', text: response }]);
    } catch (err) {
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
    setSelectedEntity(null);
  };

  const restoreConversation = (history) => {
    setMessages(history.messages);
    setShowHistory(false);
    notify("Conversación recuperada de las sombras.", "info");
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-20 min-h-[calc(100dvh-180px)]">
      {/* Header Estilo Grimorio & Selector (Sticky) */}
      <div className="sticky top-[-24px] z-30 bg-header-bg/90 backdrop-blur-md pb-4 border-b border-primary/20 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-serif text-primary-text tracking-tight">El Oráculo</h2>
        <p className="text-xs text-stone-500 font-serif italic tracking-wide">Consulta los misterios del Archivo</p>
      </div>

        {/* Selector de Contexto */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedEntity(null)}
          className={`flex-shrink-0 px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all border ${
            !selectedEntity 
            ? 'bg-accent text-white border-accent' 
            : 'bg-header-bg text-stone-500 border-accent/20'
          }`}
        >
          Consulta Libre
        </button>
        {allEntities.slice(0, 10).map(entity => (
          <button
            key={`${entity.category}-${entity.name}`}
            onClick={() => setSelectedEntity(entity)}
            className={`flex-shrink-0 px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center gap-2 ${
              selectedEntity?.name === entity.name 
              ? 'bg-accent text-zinc-950 border-accent' 
            : 'bg-header-bg text-stone-500 border-primary/30 hover:border-accent/40 transition-colors'
          }`}
          >
            <User size={10} />
            {entity.name}
          </button>
        ))}
        </div>
      </div>

      {/* Visiones del Archivo (On-demand analysis) */}
      <div className="grimoire-card bg-accent/5 border-accent/30 rounded-sm p-5 shadow-inner flex flex-col sm:flex-row items-center gap-4 animate-fade-in group hover:bg-accent/10 transition-all">
        <div className="bg-accent/20 p-4 rounded-full text-accent group-hover:scale-110 transition-transform shadow-lg">
          <Eye size={24} />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="font-serif text-lg text-primary-text">Visiones del Archivo</h3>
          <p className="text-[10px] text-stone-500 font-serif italic uppercase tracking-wider">¿Qué hilos del destino han quedado sin tejer?</p>
        </div>
        <button
          onClick={handleConsultArchive}
          disabled={isTyping}
          className="w-full sm:w-auto px-6 py-3 bg-accent text-white rounded-sm font-serif font-bold uppercase tracking-widest text-[10px] shadow-md hover:bg-accent-secondary active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isTyping ? 'Invocando...' : 'Consultar el Archivo'}
        </button>
      </div>

      {/* Historial Colapsable */}
      <div className="grimoire-card bg-header-bg border-primary rounded-sm overflow-hidden transition-all shadow-sm">
        <div 
          onClick={() => setShowHistory(!showHistory)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowHistory(!showHistory); } }}
          tabIndex={0}
          role="button"
          aria-expanded={showHistory}
          className="w-full flex justify-between items-center p-3 hover:bg-item-bg/50 transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-accent/50"
        >
          <div className="flex items-center gap-3">
            <Clock size={14} className="text-accent" />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-stone-500">Ecos del Pasado</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={(e) => { e.stopPropagation(); startNewConversation(); }}
              className="p-1 px-2 text-[9px] font-bold uppercase tracking-tighter text-accent-secondary hover:bg-accent/10 rounded-sm"
            >
              Nuevo Trance
            </button>
            {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
        {showHistory && (
          <div className="p-3 pt-0 max-h-48 overflow-y-auto border-t border-primary/20 flex flex-col gap-2 mt-2">
            {conversations.length === 0 ? (
              <p className="text-[10px] text-stone-400 italic py-4 text-center">No hay ecos registrados aún...</p>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => restoreConversation(conv)}
                  className="w-full text-left p-2 rounded-sm bg-item-bg border border-primary/20 hover:border-accent/30 group transition-all"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-primary-text/60 font-serif line-clamp-1">{conv.messages[1]?.text || "Consulta"}</span>
                    <span className="text-[8px] text-stone-400 uppercase tracking-tighter">{new Date(conv.date).toLocaleDateString()}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto pr-2 space-y-6 scroll-smooth scrollbar-thin scrollbar-thumb-accent/20 pb-32"
      >
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col gap-2 ${msg.role === 'oracle' ? 'items-start' : 'items-end'}`}
          >
            {msg.role === 'oracle' ? (
              <div className="flex items-center gap-2 text-[9px] font-bold text-accent uppercase tracking-widest ml-1">
                <Sparkles size={10} /> EL ORÁCULO
              </div>
            ) : (
              <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mr-1">TÚ</div>
            )}
            <div className={`max-w-[90%] px-6 py-5 rounded-sm shadow-sm border animate-fade-in ${
              msg.role === 'oracle' 
              ? 'bg-item-bg border-primary/50 text-primary-text font-serif italic leading-relaxed text-sm sm:text-base' 
              : 'bg-accent/10 border-accent/20 text-accent-secondary text-xs sm:text-sm font-serif'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex flex-col gap-2 items-start animate-pulse">
            <div className="flex items-center gap-2 text-[9px] font-bold text-accent uppercase tracking-widest ml-1">
              <Sparkles size={10} /> EL ORÁCULO
            </div>
            <div className="bg-item-bg border border-primary/50 px-6 py-5 rounded-sm">
              <Loader2 size={16} className="text-accent animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Input Area — bottom driven by visualViewport to survive iOS keyboard */}
      <div className="fixed left-4 right-4 z-50" style={{ bottom: `${inputBottom}px` }}>
        {!isOnline && (
          <div className="max-w-2xl mx-auto mb-2 flex items-center gap-2 px-4 py-2 bg-zinc-800/90 backdrop-blur-sm rounded-sm">
            <WifiOff size={11} className="text-zinc-400 flex-shrink-0" aria-hidden="true" />
            <p className="text-[10px] text-zinc-400 font-serif italic">El Oráculo no puede escuchar sin conexión al Éter</p>
          </div>
        )}
        {speechError && (
          <div className="max-w-2xl mx-auto mb-2 px-4 py-2 bg-danger/10 border border-danger/20 rounded-sm">
            <p className="text-[10px] text-danger italic font-serif">{speechError}</p>
          </div>
        )}
        <form
          onSubmit={handleSend}
          className={`max-w-2xl mx-auto flex items-center gap-2 bg-header-bg/95 border p-2 rounded-sm shadow-2xl backdrop-blur-md transition-colors ${isOnline ? 'border-accent/30' : 'border-zinc-700/50'}`}
        >
          {speechSupported && (
            <button
              type="button"
              onClick={() => toggleRecording('oracle', (text) => {
                setInput(prev => (prev + ' ' + text).trim());
              })}
              disabled={!isOnline}
              className={`p-3 rounded-sm transition-all flex items-center justify-center ${
                recordingField === 'oracle'
                ? 'bg-red-500 text-white animate-pulse'
                : 'text-stone-400 hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed'
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
            placeholder={!isOnline ? 'Sin conexión al Éter...' : selectedEntity ? `Pregunta al Oráculo sobre ${selectedEntity.name}...` : "Pregunta al Oráculo..."}
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none font-serif italic text-primary-text placeholder:text-stone-400 disabled:placeholder:text-stone-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping || !isOnline}
            className="p-3 bg-accent text-white rounded-sm hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
