import { BookOpen, Mic, Sparkles, ChevronDown, ChevronUp, Save, X, Loader2, Plus, Trash2, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { callGemini } from '../utils/ai';
import { MOODS } from '../data/mockData';
import { externalizePanels } from '../utils/imageStore';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useNotification } from '../hooks/useNotification';
import { useTheme } from '../hooks/useTheme';
import { useLorekeeperState } from '../hooks/useLorekeeperState';
import { useSoundscape } from '../hooks/useSoundscape';
import { ConfirmModal } from '../components/ConfirmModal';
import { TiptapEditor } from '../components/TiptapEditor';
import { autoTag } from '../utils/autoTag';
import { AutoTagModal } from '../components/AutoTagModal';

function NameAutocomplete({ value, onChange, placeholder, suggestions = [], inputClassName }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const matches = value.length > 0
    ? suggestions.filter(s => s.name.toLowerCase().includes(value.toLowerCase()) && s.name.toLowerCase() !== value.toLowerCase()).slice(0, 5)
    : [];

  const pick = (name) => {
    onChange(name);
    setOpen(false);
  };

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={inputClassName}
      />
      {open && matches.length > 0 && (
        <ul className="absolute left-0 right-0 top-full mt-1 bg-header-bg border border-accent/25 rounded-sm shadow-2xl z-50 overflow-hidden">
          {matches.map(s => (
            <li key={s.name}>
              <button
                type="button"
                onMouseDown={() => pick(s.name)}
                onTouchEnd={(e) => { e.preventDefault(); pick(s.name); }}
                className="w-full text-left px-4 py-3 text-sm font-serif text-primary-text hover:bg-accent/10 active:bg-accent/20 flex items-center justify-between gap-3"
              >
                <span>{s.name}</span>
                {s.mentions?.length > 1 && (
                  <span className="text-[10px] text-stone-400 flex-shrink-0">{s.mentions.length} entradas</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

let nextItemId = 0;
function uid() { return `item-${Date.now()}-${nextItemId++}-${Math.random().toString(36).slice(2, 7)}`; }

function ensureIds(items) {
  if (!items) return [];
  return items.map(item => item.id ? item : { ...item, id: uid() });
}

export function EntryForm({ books, onSave, onCancel, initialData = null }) {
  const notify = useNotification();
  const { theme } = useTheme();
  const { archive } = useLorekeeperState();
  const { playInkScratch } = useSoundscape();
  const { recordingField, toggle: toggleRecording, error: speechError, isSupported: speechSupported } = useSpeechRecognition();

  const DRAFT_KEY = 'lore-entry-draft';
  const isNewEntry = !initialData;

  const [form, setForm] = useState(() => {
    const defaultState = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      book: books[0]?.title || '',
      chapter: '',
      mood: "Concentrado 🧠",
      reingreso: '',
      readingTime: 0,
      quotes: [],
      characters: [],
      places: [],
      worldRules: [],
      glossary: [],
      connections: [],
      mangaPanels: []
    };

    if (initialData) {
      const merged = { ...defaultState, ...initialData };
      return {
        ...merged,
        characters: ensureIds(merged.characters),
        places: ensureIds(merged.places),
        glossary: ensureIds(merged.glossary),
        connections: ensureIds(merged.connections),
      };
    }
    // Restore draft if available
    try {
      const draft = window.localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        const merged = { ...defaultState, ...parsed };
        return { 
          ...merged, 
          characters: ensureIds(merged.characters), 
          places: ensureIds(merged.places), 
          glossary: ensureIds(merged.glossary), 
          connections: ensureIds(merged.connections) 
        };
      }
    } catch { /* ignore */ }
    return defaultState;
  });

  // Auto-save draft for new entries (debounced)
  const draftTimer = useRef(null);
  const formDirty = useRef(false);
  useEffect(() => {
    if (!isNewEntry) return;
    formDirty.current = true;
    clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
        formDirty.current = false;
      } catch { /* quota — beforeunload will warn */ }
    }, 500);
    return () => clearTimeout(draftTimer.current);
  }, [form, isNewEntry]);

  // Warn on unsaved changes when navigating away
  useEffect(() => {
    if (!isNewEntry) return;
    const handleBeforeUnload = (e) => {
      if (formDirty.current || form.reingreso?.trim()) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isNewEntry, form.reingreso]);

  const handleSave = (formData, explicitSkipAutoTag = false) => {
    if (isSaving.current) return;
    if (!formData.book) { notify('Selecciona un libro antes de guardar.', 'error'); return; }
    
    // Detailed Validation
    const emptyChar = formData.characters?.find(c => !c.name?.trim());
    if (emptyChar) { notify('Todos los personajes deben tener un nombre.', 'error'); return; }

    const emptyPlace = formData.places?.find(p => !p.name?.trim());
    if (emptyPlace) { notify('Todos los lugares deben tener un nombre.', 'error'); return; }

    const emptyGlossary = formData.glossary?.find(g => !g.name?.trim());
    if (emptyGlossary) { notify('Todos los términos del glosario deben tener un nombre.', 'error'); return; }

    const emptyRule = formData.worldRules?.find(r => !r.name?.trim());
    if (emptyRule) { notify('Todas las reglas del mundo deben tener un nombre o concepto.', 'error'); return; }

    const hasEmptyQuote = formData.quotes?.some(q => !q?.trim());
    if (hasEmptyQuote) { notify('No puedes guardar citas vacías.', 'error'); return; }

    if (!formData.reingreso?.trim() && 
        !formData.characters?.length && 
        !formData.places?.length && 
        !formData.glossary?.length &&
        !formData.worldRules?.length &&
        !formData.quotes?.length) {
      notify('Escribe un resumen o añade al menos un conocimiento.', 'error');
      return;
    }

    // Smart Auto-Tagging Flow
    if (!explicitSkipAutoTag && isNewEntry) {
      const detected = autoTag(formData.reingreso, archive);
      // Filter out those already in form
      const filtered = {
        characters: (detected.characters || []).filter(d => !formData.characters.some(f => f.name.toLowerCase() === d.name.toLowerCase())),
        places: (detected.places || []).filter(d => !formData.places.some(f => f.name.toLowerCase() === d.name.toLowerCase())),
        glossary: (detected.glossary || []).filter(d => !formData.glossary.some(f => f.name.toLowerCase() === d.name.toLowerCase())),
        worldRules: (detected.worldRules || []).filter(d => !formData.worldRules.some(f => f.name.toLowerCase() === d.name.toLowerCase())),
      };
      
      const hasNew = Object.values(filtered).some(l => l.length > 0);
      if (hasNew) {
        setPendingAutoTags({ formData, detected: filtered });
        return;
      }
    }

    isSaving.current = true;
    navigator.vibrate?.(20);
    playInkScratch();
    if (isNewEntry) window.localStorage.removeItem(DRAFT_KEY);
    // Move inline manga images to IndexedDB before saving
    if (formData.mangaPanels?.length > 0) {
      externalizePanels(formData.mangaPanels).then(keys => {
        onSave({ ...formData, mangaPanels: keys });
      }).catch(() => {
        notify('No se pudieron guardar las imágenes en caché. Se guardaron en línea como respaldo.', 'error');
        onSave(formData); // fallback: keep inline
      }).finally(() => {
        isSaving.current = false;
      });
      return;
    }
    onSave(formData);
    isSaving.current = false;
  };

  const handleCancel = () => {
    if (isNewEntry) window.localStorage.removeItem(DRAFT_KEY);
    onCancel();
  };

  const [step, setStep] = useState('essence'); // 'essence' | 'knowledge'
  const [isExtracting, setIsExtracting] = useState(false);
  const isExtractingLock = useRef(false);
  const isSaving = useRef(false);
  const [pendingAutoTags, setPendingAutoTags] = useState(null);
  const [panelToRemove, setPanelToRemove] = useState(null);
  const [showLoreRef, setShowLoreRef] = useState(false);
  const [loreSearch, setLoreSearch] = useState('');
  const [openSections, setOpenSections] = useState({
    quotes: true, characters: false, places: false,
    glossary: false, world: false, connections: false, panels: false
  });

  const filteredLore = useMemo(() => {
    const all = [
      ...(archive.personajes || []).map(p => ({ ...p, cat: 'personaje' })),
      ...(archive.lugares || []).map(l => ({ ...l, cat: 'lugar' })),
      ...(archive.glosario || []).map(g => ({ ...g, cat: 'glosario' })),
      ...(archive.reglas || []).map(r => ({ ...r, cat: 'regla' })),
    ];
    if (!loreSearch) return all;
    return all.filter(e => e.name.toLowerCase().includes(loreSearch.toLowerCase()));
  }, [archive, loreSearch]);

  const handleAIAutocomplete = async () => {
    if (!form.reingreso || isExtracting || isExtractingLock.current) return;
    setIsExtracting(true);
    isExtractingLock.current = true;
    try {
      const prompt = `Analiza: "${form.reingreso}". Extrae Personajes, Lugares, Glosario, Frases memorables y Reglas del Mundo (anotaciones sobre cómo funciona el mundo). Devuelve JSON: { characters: [{name, tags:[], content}], places: [{name, tags:[], content}], glossary: [{name, tags:[], content}], quotes: [string], worldRules: [{name, content}] }.`;
      const result = await callGemini(prompt, "Eres un bibliotecario solemne.");
      const data = JSON.parse(result);
      setForm(prev => ({
        ...prev,
        characters: [...prev.characters, ...ensureIds(data.characters || [])],
        places: [...prev.places, ...ensureIds(data.places || [])],
        glossary: [...prev.glossary, ...ensureIds(data.glossary || [])],
        quotes: [...prev.quotes, ...(data.quotes || [])],
        worldRules: [...prev.worldRules, ...ensureIds(data.worldRules || [])]
      }));
      setOpenSections(prev => ({ ...prev, characters: true, places: true, quotes: true, world: true }));
      setStep('knowledge');
      playInkScratch();
      notify("Conocimientos destilados con éxito.", "success");
    } catch {
      notify("El Oráculo no pudo destilar los conocimientos. Intenta de nuevo.", "error");
    } finally {
      setIsExtracting(false);
      isExtractingLock.current = false;
    }
  };

  const addItem = (section, template) => {
    setForm({ ...form, [section]: [...form[section], { ...template, id: uid() }] });
  };

  const updateItem = (section, id, field, value) => {
    setForm({
      ...form,
      [section]: form[section].map(item => item.id === id ? { ...item, [field]: value } : item)
    });
  };

  const removeItem = (section, id) => {
    setForm({ ...form, [section]: form[section].filter(item => item.id !== id) });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_DIM = 800;
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/webp', 0.7);
      setForm(prev => ({ ...prev, mangaPanels: [...prev.mangaPanels, compressed] }));
    };
    img.src = URL.createObjectURL(file);
  };

  const toggleBookInConnection = (connId, bookTitle) => {
    const conn = form.connections.find(c => c.id === connId);
    if (!conn) return;
    const newTitles = conn.bookTitles?.includes(bookTitle)
      ? conn.bookTitles.filter(t => t !== bookTitle)
      : [...(conn.bookTitles || []), bookTitle];
    updateItem('connections', connId, 'bookTitles', newTitles);
  };

  const knowledgeCount =
    form.characters.length + form.places.length + form.glossary.length +
    form.worldRules.length + form.quotes.length + form.connections.length;

  const switchStep = (s) => {
    setStep(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-24 h-full">
      {pendingAutoTags && (
        <AutoTagModal
          detected={pendingAutoTags.detected}
          onCancel={() => {
            const data = pendingAutoTags.formData;
            setPendingAutoTags(null);
            handleSave(data, true); // Save without auto-tagging
          }}
          onConfirm={(confirmed) => {
            const data = { ...pendingAutoTags.formData };
            // Merge confirmed entities
            Object.keys(confirmed).forEach(cat => {
              data[cat] = [...data[cat], ...confirmed[cat].map(e => ({ ...e, id: uid() }))];
            });
            setPendingAutoTags(null);
            handleSave(data, true); // Final save
          }}
        />
      )}
      {panelToRemove !== null && (
        <ConfirmModal
          title="Eliminar panel"
          message="¿Deseas eliminar este panel de impacto? No se puede deshacer."
          confirmLabel="Eliminar"
          danger
          onConfirm={() => {
            setForm(prev => ({ ...prev, mangaPanels: prev.mangaPanels.filter((_, idx) => idx !== panelToRemove) }));
            setPanelToRemove(null);
          }}
          onCancel={() => setPanelToRemove(null)}
        />
      )}
      {/* HEADER ROW */}
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-primary-text text-2xl tracking-tight">
          {initialData ? 'Editar Crónica' : 'Nueva Crónica'}
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={handleCancel} aria-label="Cancelar" className="p-2 text-stone-400 hover:text-stone-600 flex items-center justify-center">
            <X size={20}/>
          </button>
          <button
            onClick={() => handleSave(form)}
            aria-label="Guardar crónica"
            className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-sm hover:bg-accent-secondary active:scale-95 transition-all border border-accent-secondary/30"
          >
            <Save size={16}/>
            <span className="font-bold text-xs uppercase tracking-[0.2em] font-serif">
              {theme === 'dark' ? 'FORJAR' : 'GUARDAR'}
            </span>
          </button>
          <button
            onClick={() => setShowLoreRef(true)}
            aria-label="Consultar Archivo"
            title="Consultar Archivo"
            className="p-2.5 bg-item-bg text-accent rounded-sm border border-accent/20 hover:border-accent transition-colors"
          >
            <BookOpen size={20} />
          </button>
        </div>
      </div>

      {/* STEP TABS */}
      <div
        className="sticky z-40 -mx-4 px-4 py-2 border-b border-accent/20 backdrop-blur-md"
        style={{ top: 'calc(4rem + env(safe-area-inset-top))', backgroundColor: 'color-mix(in srgb, var(--bg-app) 95%, transparent)' }}
      >
        <div className="flex gap-1 bg-item-bg rounded-sm p-1">
          <button
            onClick={() => switchStep('essence')}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-[0.18em] font-serif rounded-sm transition-all ${
              step === 'essence' ? 'bg-accent text-white shadow-sm' : 'text-stone-500 hover:text-accent'
            }`}
          >
            Esencia
          </button>
          <button
            onClick={() => switchStep('knowledge')}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-[0.18em] font-serif rounded-sm transition-all flex items-center justify-center gap-1.5 ${
              step === 'knowledge' ? 'bg-accent text-white shadow-sm' : 'text-stone-500 hover:text-accent'
            }`}
          >
            Conocimientos
            {knowledgeCount > 0 && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                step === 'knowledge' ? 'bg-white/30 text-white' : 'bg-accent/15 text-accent'
              }`}>
                {knowledgeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── ESENCIA STEP ── */}
      {step === 'essence' && <>

      {/* CORE INFO */}
      <div className="bg-section-bg p-6 rounded-sm grid grid-cols-1 sm:grid-cols-2 gap-6 shadow-inner">
        <div className="flex flex-col gap-1.5 group">
          <label htmlFor="entry-book" className="text-[10px] uppercase tracking-[0.2em] font-bold text-accent/60 ml-1">Libro Actual</label>
          <select
            id="entry-book"
            value={form.book} onChange={e => setForm({...form, book: e.target.value})}
            className="bg-transparent border-0 border-b-2 border-stone-300 py-2 px-1 text-lg outline-none focus:border-accent transition-all font-serif text-primary-text"
          >
            {books.map(b => <option key={b.id || b.title} value={b.title}>{b.emoji} {b.title}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5 group">
          <label htmlFor="entry-chapter" className="text-[10px] uppercase tracking-[0.2em] font-bold text-accent/60 ml-1">Ubicación (Cap/Pág)</label>
          <input
            id="entry-chapter"
            value={form.chapter} onChange={e => setForm({...form, chapter: e.target.value})}
            inputMode="text"
            enterKeyHint="next"
            className="bg-transparent border-0 border-b-2 border-stone-300 py-2 px-1 text-lg outline-none focus:border-accent transition-all font-serif text-primary-text placeholder:text-stone-300 italic"
            placeholder="Ej. Cap 12"
          />
        </div>
        <div className="flex flex-col gap-1.5 group sm:col-span-2">
          <label htmlFor="entry-reading-time" className="text-[10px] uppercase tracking-[0.2em] font-bold text-accent/60 ml-1">Tiempo de lectura (min)</label>
          <input
            id="entry-reading-time"
            type="number"
            min="0"
            max="600"
            value={form.readingTime || ''}
            onChange={e => setForm({...form, readingTime: Math.max(0, parseInt(e.target.value, 10) || 0)})}
            inputMode="numeric"
            enterKeyHint="next"
            className="bg-transparent border-0 border-b-2 border-stone-300 py-2 px-1 text-lg outline-none focus:border-accent transition-all font-serif text-primary-text placeholder:text-stone-300"
            placeholder="0"
          />
        </div>
      </div>

      {/* MOOD */}
      <div className="flex flex-col gap-3 px-1">
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-accent/60 ml-1">Estado de ánimo</span>
        <div className="flex gap-2 flex-wrap">
          {MOODS.map(mood => (
            <button
              key={mood}
              type="button"
              onClick={() => setForm({...form, mood})}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                form.mood === mood
                  ? 'bg-accent text-white shadow-md scale-105'
                  : 'bg-item-bg border border-stone-200 text-stone-500 hover:border-accent/50'
              }`}
            >
              {mood}
            </button>
          ))}
        </div>
      </div>

      {/* REINGRESO */}
      <div className="bg-section-bg p-6 rounded-sm shadow-inner relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <label htmlFor="entry-reingreso" className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Resumen de Reingreso</label>
          {speechSupported && (
            <button
              onClick={() => toggleRecording('reingreso', (text) => {
                setForm(prev => ({ ...prev, reingreso: (prev.reingreso + ' ' + text).trim() }));
              })}
              aria-label={recordingField === 'reingreso' ? 'Detener grabación' : 'Dictar por voz'}
              className={`p-3 rounded-full transition-all flex items-center justify-center min-w-[48px] min-h-[48px] ${recordingField === 'reingreso' ? 'bg-red-500 text-white animate-pulse' : 'text-stone-400 hover:text-accent'}`}
            >
              <Mic size={18}/>
            </button>
          )}
        </div>
        {speechError && (
          <p className="text-xs text-red-600 mb-2 italic font-serif">{speechError}</p>
        )}
        <TiptapEditor
          value={form.reingreso}
          onChange={v => setForm({...form, reingreso: v})}
          placeholder="¿Qué sombras o luces has encontrado hoy?..."
          className="text-lg"
        />
        <button 
          onClick={handleAIAutocomplete} 
          disabled={isExtracting || !form.reingreso?.trim()} 
          className="mt-6 flex items-center justify-center gap-2 w-full py-4 bg-app-bg text-accent border border-accent/20 rounded-sm font-bold font-serif tracking-wide hover:bg-accent hover:text-white transition-all disabled:opacity-40 disabled:cursor-default shadow-sm"
        >
          {isExtracting ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          <span>Destilar conocimientos con IA</span>
        </button>
      </div>


      {/* CTA to knowledge step */}
      <button
        onClick={() => switchStep('knowledge')}
        className="flex items-center justify-center gap-3 py-4 text-sm text-accent hover:text-accent-secondary font-serif italic transition-all bg-header-bg rounded-sm border border-accent/10 shadow-sm"
      >
        <Plus size={15} />
        <span>Añadir personajes, lugares y más</span>
      </button>

      </>}

      {/* ── CONOCIMIENTOS STEP ── */}
      {step === 'knowledge' && <div className="flex flex-col gap-3">
        {/* FRASES */}
        <EntitySection
          title="Frase Memorable" icon={<Plus size={14}/>}
          isOpen={openSections.quotes} onToggle={() => setOpenSections({...openSections, quotes: !openSections.quotes})}
          onAdd={() => setForm({...form, quotes: [...form.quotes, '']})}
        >
          {form.quotes.map((q, i) => (
            <div key={i} className="bg-item-bg p-5 rounded-sm border-l-4 border-l-accent/40 mb-3 flex flex-col gap-2 relative shadow-sm transition-all hover:shadow-md">
              <button onClick={() => setForm({...form, quotes: form.quotes.filter((_, idx) => idx !== i)})} aria-label="Eliminar" className="absolute top-3 right-3 p-3 text-stone-300 hover:text-red-500 transition-colors flex items-center justify-center min-w-[48px] min-h-[48px]"><Trash2 size={20}/></button>
              <TiptapEditor
                value={q}
                onChange={v => {
                  const newQuotes = [...form.quotes];
                  newQuotes[i] = v;
                  setForm({...form, quotes: newQuotes});
                }}
                placeholder="Escribe la frase..."
                className="text-sm h-auto min-h-[60px]"
              />
            </div>
          ))}
        </EntitySection>

        {/* CHARACTERS */}
        <EntitySection
          title="Personajes" icon={<Plus size={14}/>}
          isOpen={openSections.characters} onToggle={() => setOpenSections({...openSections, characters: !openSections.characters})}
          onAdd={() => addItem('characters', { name: '', tags: '', content: '' })}
        >
          {form.characters.map((c) => (
            <div key={c.id} className="bg-item-bg p-5 rounded-sm border-l-4 border-l-entity-character/40 mb-3 flex flex-col gap-3 relative shadow-sm hover:shadow-md transition-all">
              <button onClick={() => removeItem('characters', c.id)} aria-label="Eliminar" className="absolute top-3 right-3 p-3 text-stone-300 hover:text-red-500 transition-colors flex items-center justify-center min-w-[48px] min-h-[48px]"><Trash2 size={20}/></button>
              <NameAutocomplete value={c.name} onChange={v => updateItem('characters', c.id, 'name', v)} placeholder="Nombre del ser..." suggestions={archive.personajes || []} inputClassName="w-full bg-transparent border-0 border-b-2 border-primary-text/10 text-lg font-bold text-primary-text outline-none pb-1 focus:border-accent transition-all" />
              <input value={c.tags} onChange={e => updateItem('characters', c.id, 'tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} placeholder="Etiquetas (separadas por coma)..." className="bg-transparent border-0 border-b border-primary-text/5 text-xs text-stone-400 outline-none focus:border-accent/20 transition-all font-serif italic" />
              <TiptapEditor
                value={c.content}
                onChange={v => updateItem('characters', c.id, 'content', v)}
                placeholder="Observación..."
                className="text-sm h-auto min-h-[80px]"
              />
            </div>
          ))}
        </EntitySection>

        {/* PLACES */}
        <EntitySection
          title="Lugares" icon={<Plus size={14}/>}
          isOpen={openSections.places} onToggle={() => setOpenSections({...openSections, places: !openSections.places})}
          onAdd={() => addItem('places', { name: '', tags: '', content: '' })}
        >
          {form.places.map((p) => (
            <div key={p.id} className="bg-item-bg p-5 rounded-sm border-l-4 border-l-entity-place/40 mb-3 flex flex-col gap-3 relative shadow-sm hover:shadow-md transition-all">
              <button onClick={() => removeItem('places', p.id)} aria-label="Eliminar" className="absolute top-3 right-3 p-3 text-stone-300 hover:text-red-500 transition-colors flex items-center justify-center min-w-[48px] min-h-[48px]"><Trash2 size={20}/></button>
              <NameAutocomplete value={p.name} onChange={v => updateItem('places', p.id, 'name', v)} placeholder="Nombre del paraje..." suggestions={archive.lugares || []} inputClassName="w-full bg-transparent border-0 border-b-2 border-primary/20 text-lg font-bold text-primary-text outline-none pb-1 focus:border-accent transition-all" />
              <TiptapEditor
                value={p.content}
                onChange={v => updateItem('places', p.id, 'content', v)}
                placeholder="Atmósfera o importancia..."
                className="text-sm h-auto min-h-[80px]"
              />
            </div>
          ))}
        </EntitySection>

        {/* GLOSSARY */}
        <EntitySection
          title="Glosario y Dudas" icon={<Plus size={14}/>}
          isOpen={openSections.glossary} onToggle={() => setOpenSections({...openSections, glossary: !openSections.glossary})}
          onAdd={() => addItem('glossary', { name: '', tags: '', content: '' })}
        >
          {form.glossary.map((g) => (
            <div key={g.id} className="bg-item-bg p-5 rounded-sm border-l-4 border-l-oracle/40 mb-3 flex flex-col gap-3 relative shadow-sm hover:shadow-md transition-all">
              <button onClick={() => removeItem('glossary', g.id)} aria-label="Eliminar" className="absolute top-3 right-3 p-3 text-stone-300 hover:text-red-500 transition-colors flex items-center justify-center min-w-[48px] min-h-[48px]"><Trash2 size={20}/></button>
              <NameAutocomplete value={g.name} onChange={v => updateItem('glossary', g.id, 'name', v)} placeholder="Término o pregunta..." suggestions={archive.glosario || []} inputClassName="w-full bg-transparent border-0 border-b-2 border-primary/20 text-lg font-bold text-primary-text outline-none pb-1 focus:border-accent transition-all" />
              <TiptapEditor
                value={g.content}
                onChange={v => updateItem('glossary', g.id, 'content', v)}
                placeholder="Significado o duda persistente..."
                className="text-sm h-auto min-h-[80px]"
              />
            </div>
          ))}
        </EntitySection>

        {/* WORLD RULES */}
        <EntitySection
          title="Reglas del Mundo" icon={<Plus size={14}/>}
          isOpen={openSections.world} onToggle={() => setOpenSections({...openSections, world: !openSections.world})}
          onAdd={() => addItem('worldRules', { name: '', content: '' })}
        >
          {form.worldRules.map((w) => (
            <div key={w.id} className="bg-item-bg p-5 rounded-sm border-l-4 border-l-entity-rule/40 mb-3 flex flex-col gap-3 relative shadow-sm hover:shadow-md transition-all">
              <button onClick={() => removeItem('worldRules', w.id)} aria-label="Eliminar" className="absolute top-3 right-3 p-3 text-stone-300 hover:text-red-500 transition-colors flex items-center justify-center min-w-[48px] min-h-[48px]"><Trash2 size={20}/></button>
              <NameAutocomplete value={w.name} onChange={v => updateItem('worldRules', w.id, 'name', v)} placeholder="Concepto (ej. El Chakra)..." suggestions={archive.reglas || []} inputClassName="w-full bg-transparent border-0 border-b-2 border-primary/20 text-lg font-bold text-primary-text outline-none pb-1 focus:border-accent transition-all" />
              <TiptapEditor
                value={w.content}
                onChange={v => updateItem('worldRules', w.id, 'content', v)}
                placeholder="En qué consiste esta ley..."
                className="text-sm h-auto min-h-[80px]"
              />
            </div>
          ))}
        </EntitySection>

        {/* CONNECTIONS */}
        <div className="bg-section-bg rounded-sm overflow-hidden shadow-inner border border-primary/10">
          <div className="w-full flex justify-between items-center p-5">
            <button onClick={() => setOpenSections({...openSections, connections: !openSections.connections})} className="flex items-center gap-4">
              <div className={`w-6 h-6 flex items-center justify-center rounded-sm transition-all shadow-sm ${openSections.connections ? 'bg-accent text-white rotate-0' : 'bg-item-bg text-stone-400 -rotate-90'}`}>
                <ChevronDown size={14} strokeWidth={3} />
              </div>
              <span className="font-serif text-[10px] sm:text-xs font-bold text-accent uppercase tracking-[0.2em]">Conexiones Multiversales</span>
            </button>
            <button onClick={() => addItem('connections', { bookTitles: [], description: '' })} className="w-10 h-10 bg-item-bg text-accent rounded-full hover:bg-accent hover:text-white transition-all shadow-sm border border-accent/10 flex items-center justify-center">
              <Plus size={14}/>
            </button>
          </div>
          {openSections.connections && (
            <div className="px-5 pb-5 flex flex-col gap-4">
              {form.connections.length === 0 && (
                <p className="text-xs text-stone-500 italic leading-relaxed text-center py-6 font-serif">¿Este relato resuena con otros mundos? Añade una conexión para entrelazar destinos.</p>
              )}
              {form.connections.map((conn) => (
                <div key={conn.id} className="bg-item-bg p-5 rounded-sm flex flex-col gap-4 relative group/conn shadow-sm border border-primary/5">
                  <button onClick={() => removeItem('connections', conn.id)} className="absolute top-4 right-4 text-stone-300 hover:text-red-500 opacity-0 group-hover/conn:opacity-100 transition-all"><Trash2 size={16}/></button>

                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Libros Vinculados</label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                      {books.filter(b => b.title !== form.book).map(b => (
                        <button
                          key={b.id || b.title}
                          onClick={() => toggleBookInConnection(conn.id, b.title)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${conn.bookTitles?.includes(b.title) ? 'bg-accent text-white border-accent' : 'bg-item-bg border-primary/30 text-stone-500 hover:border-accent/30'}`}
                        >
                          {b.emoji} {b.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-4 border-t border-stone-100">
                    <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Naturaleza del Entrelazamiento</label>
                    <textarea
                      value={conn.description} onChange={e => updateItem('connections', conn.id, 'description', e.target.value)}
                      className="bg-transparent text-sm text-primary-text outline-none resize-none h-20 font-serif leading-relaxed italic py-1 border-0 border-b border-primary/10 focus:border-accent/20 transition-all"
                      placeholder="Describe la razón de esta conexión..."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MANGA PANELS - CONDITIONAL */}
        {books.find(b => b.title === form.book)?.type === 'manga' && (
          <div className="bg-section-bg rounded-sm overflow-hidden shadow-inner">
            <button onClick={() => setOpenSections({...openSections, panels: !openSections.panels})} className="w-full flex justify-between items-center p-5 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-6 h-6 flex items-center justify-center rounded-sm transition-all shadow-sm ${openSections.panels ? 'bg-accent text-white rotate-0' : 'bg-item-bg text-stone-400 -rotate-90'}`}>
                  <ChevronDown size={14} strokeWidth={3} />
                </div>
                <span className="font-serif text-[10px] sm:text-xs font-bold text-accent uppercase tracking-[0.2em]">Paneles de Impacto</span>
              </div>
            </button>
            {openSections.panels && (
              <div className="px-5 pb-5">
                <div className="grid grid-cols-2 gap-4 mb-2">
                  {form.mangaPanels.map((img, i) => (
                    <div key={i} className="relative aspect-video bg-black rounded-sm overflow-hidden border border-stone-200 group/panel shadow-md">
                      <img src={img} loading="lazy" className="w-full h-full object-cover opacity-90 group-hover/panel:opacity-100 transition-opacity" alt={`Panel de manga ${i + 1}`} />
                      <button onClick={() => setPanelToRemove(i)} className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full p-2 text-white hover:bg-red-600 transition-all group-hover/panel:scale-110 shadow-lg"><X size={14}/></button>
                    </div>
                  ))}
                  <label className="aspect-video bg-item-bg border-2 border-dashed border-stone-300 rounded-sm flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-all group/upload shadow-sm">
                    <Plus size={28} className="text-stone-300 group-hover/upload:text-accent transition-colors" />
                    <span className="text-[10px] text-stone-400 uppercase mt-2 tracking-[0.2em] font-bold group-hover/upload:text-accent text-center px-2">Añadir Panel</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </div>}
      {/* ── LORE REFERENCE DRAWER ── */}
      <AnimatePresence>
        {showLoreRef && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoreRef(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] bg-header-bg z-[100] shadow-2xl border-l border-accent/20 flex flex-col"
            >
              <div className="p-4 border-b border-accent/20 flex items-center justify-between bg-section-bg">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-accent" />
                  <span className="font-serif font-bold text-primary-text tracking-tight">Referencia del Archivo</span>
                </div>
                <button onClick={() => setShowLoreRef(false)} className="p-2 text-stone-400 hover:text-accent transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 border-b border-accent/10">
                <input
                  autoFocus
                  type="text"
                  placeholder="Buscar conocimiento..."
                  value={loreSearch}
                  onChange={e => setLoreSearch(e.target.value)}
                  className="w-full bg-app-bg border border-accent/20 rounded-sm px-4 py-3 text-sm font-serif italic outline-none focus:border-accent/50 transition-all shadow-inner"
                />
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {filteredLore.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-stone-400 font-serif italic">No hay registros que coincidan con tu búsqueda.</p>
                  </div>
                ) : (
                  filteredLore.map(entity => (
                    <div key={`${entity.cat}-${entity.name}`} className="bg-item-bg p-4 rounded-sm border border-primary/10 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-serif font-bold text-primary-text">{entity.name}</h4>
                        <span className="text-[8px] uppercase tracking-widest bg-accent/10 text-accent px-1.5 py-0.5 rounded-full border border-accent/20">{entity.cat}</span>
                      </div>
                      {entity.description ? (
                        <p className="text-xs text-primary-text/70 italic font-serif leading-relaxed line-clamp-3 mb-2">"{entity.description}"</p>
                      ) : (
                        <p className="text-[10px] text-stone-400 italic font-serif mb-2">Sin descripción permanente.</p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {entity.tags?.slice(0, 3).map(t => (
                          <span key={t} className="text-[8px] text-stone-400 border border-stone-200 px-1.5 py-0.5 rounded-sm">#{t}</span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-4 bg-section-bg border-t border-accent/10">
                <p className="text-[9px] text-stone-400 text-center font-serif italic">Consulta el lore sin cerrar tu crónica actual.</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function EntitySection({ title, icon, isOpen, onToggle, onAdd, children }) {
  return (
    <div className="bg-section-bg rounded-sm overflow-hidden shadow-inner">
      <div className="w-full flex justify-between items-center p-5">
        <button onClick={onToggle} aria-expanded={isOpen} className="flex flex-1 items-center gap-4">
          <div className={`w-6 h-6 flex items-center justify-center rounded-sm transition-all shadow-sm ${isOpen ? 'bg-accent text-white rotate-0' : 'bg-item-bg text-stone-400 -rotate-90'}`}>
            <ChevronDown size={14} strokeWidth={3} />
          </div>
          <span className="font-serif text-[10px] sm:text-xs font-bold text-accent theme-uppercase tracking-[0.2em]">{title}</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); onAdd(); }} className="w-10 h-10 bg-item-bg text-accent rounded-full hover:bg-accent hover:text-white transition-all shadow-sm border border-accent/10 flex items-center justify-center">
          {icon}
        </button>
      </div>
      {isOpen && <div className="px-5 pb-5 flex flex-col gap-1">{children}</div>}
    </div>
  );
}
