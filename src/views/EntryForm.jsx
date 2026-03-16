import React, { useState } from 'react';
import { Mic, Sparkles, ChevronDown, ChevronUp, Save, X, Loader2, Plus, Trash2, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { callGemini } from '../utils/ai';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useNotification } from '../hooks/useNotification';

let nextItemId = Date.now();
function uid() { return `item-${nextItemId++}`; }

function ensureIds(items) {
  if (!items) return [];
  return items.map(item => item.id ? item : { ...item, id: uid() });
}

export function EntryForm({ books, onSave, onCancel, initialData = null }) {
  const notify = useNotification();
  const { recordingField, toggle: toggleRecording } = useSpeechRecognition();

  const [form, setForm] = useState(() => {
    if (initialData) {
      return {
        ...initialData,
        characters: ensureIds(initialData.characters),
        places: ensureIds(initialData.places),
        glossary: ensureIds(initialData.glossary),
        connections: ensureIds(initialData.connections),
      };
    }
    return {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      book: books[0]?.title || '',
      chapter: '',
      mood: "Concentrado 🧠",
      reingreso: '',
      quotes: [],
      characters: [],
      places: [],
      worldRules: [],
      glossary: [],
      connections: [],
      mangaPanels: []
    };
  });

  const [isExtracting, setIsExtracting] = useState(false);
  const [openSections, setOpenSections] = useState({
    characters: true, places: false, quotes: false,
    glossary: false, world: false, connections: false, panels: false
  });

  const handleAIAutocomplete = async () => {
    if (!form.reingreso) return;
    setIsExtracting(true);
    try {
      const prompt = `Analiza: "${form.reingreso}". Extrae Personajes, Lugares y Glosario. Devuelve JSON: { characters: [{name, tags:[], content}], places: [{name, tags:[], content}], glossary: [{name, tags:[], content}] }.`;
      const result = await callGemini(prompt, "Eres un bibliotecario solemne.");
      const data = JSON.parse(result);
      setForm(prev => ({
        ...prev,
        characters: [...prev.characters, ...ensureIds(data.characters || [])],
        places: [...prev.places, ...ensureIds(data.places || [])],
        glossary: [...prev.glossary, ...ensureIds(data.glossary || [])]
      }));
      setOpenSections(prev => ({ ...prev, characters: true, places: true }));
      notify("Conocimientos destilados con éxito.", "success");
    } catch {
      notify("El Oráculo no pudo destilar los conocimientos. Intenta de nuevo.", "error");
    } finally {
      setIsExtracting(false);
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
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, mangaPanels: [...prev.mangaPanels, reader.result] }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleBookInConnection = (connId, bookTitle) => {
    const conn = form.connections.find(c => c.id === connId);
    if (!conn) return;
    const newTitles = conn.bookTitles?.includes(bookTitle)
      ? conn.bookTitles.filter(t => t !== bookTitle)
      : [...(conn.bookTitles || []), bookTitle];
    updateItem('connections', connId, 'bookTitles', newTitles);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-24 h-full">
      <div className="flex justify-between items-center bg-zinc-950/80 p-4 rounded-xl border border-zinc-800 sticky top-16 z-40 backdrop-blur-md">
        <h3 className="font-serif text-amber-500 text-xl">{initialData ? 'Editar Crónica' : 'Nueva Crónica'}</h3>
        <div className="flex gap-2">
          <button onClick={onCancel} className="p-2 text-zinc-500 hover:text-zinc-300"><X size={20}/></button>
          <button onClick={() => onSave(form)} className="p-2 bg-amber-600 text-zinc-950 rounded-lg shadow-lg hover:bg-amber-500 transition-colors"><Save size={20}/></button>
        </div>
      </div>

      {/* CORE INFO */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-widest text-zinc-500 ml-1">Libro Actual</label>
          <select
            value={form.book} onChange={e => setForm({...form, book: e.target.value})}
            className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm outline-none font-serif text-amber-50"
          >
            {books.map(b => <option key={b.id || b.title} value={b.title}>{b.emoji} {b.title}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-widest text-zinc-500 ml-1">Ubicación (Cap/Pág)</label>
          <input
            value={form.chapter} onChange={e => setForm({...form, chapter: e.target.value})}
            className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm outline-none font-serif text-amber-50"
            placeholder="Ej. Cap 12"
          />
        </div>
      </div>

      {/* REINGRESO */}
      <div className="bg-zinc-900 border border-amber-500/30 p-5 rounded-xl shadow-2xl">
        <div className="flex justify-between items-center mb-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Resumen de Reingreso</label>
          <button
            onClick={() => toggleRecording('reingreso', (text) => {
              setForm(prev => ({ ...prev, reingreso: (prev.reingreso + ' ' + text).trim() }));
            })}
            className={`p-1.5 rounded-full ${recordingField === 'reingreso' ? 'bg-red-500 text-white animate-pulse' : 'text-zinc-500 hover:bg-zinc-800'}`}
          >
            <Mic size={14}/>
          </button>
        </div>
        <textarea
          value={form.reingreso} onChange={e => setForm({...form, reingreso: e.target.value})}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-sm outline-none font-serif leading-relaxed h-28 italic text-amber-50/80"
          placeholder="¿Qué sombras o luces has encontrado hoy?..."
        />
        <button onClick={handleAIAutocomplete} disabled={isExtracting} className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-zinc-950 text-amber-500 border border-amber-500/20 rounded-xl font-bold font-serif hover:bg-amber-500/5 transition-all">
          {isExtracting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          Destilar conocimientos con IA
        </button>
      </div>

      {/* DYNAMIC SECTIONS */}
      <div className="flex flex-col gap-3">
        {/* CHARACTERS */}
        <EntitySection
          title="Personajes" icon={<Plus size={14}/>}
          isOpen={openSections.characters} onToggle={() => setOpenSections({...openSections, characters: !openSections.characters})}
          onAdd={() => addItem('characters', { name: '', tags: '', content: '' })}
        >
          {form.characters.map((c) => (
            <div key={c.id} className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 mb-2 flex flex-col gap-2 relative">
              <button onClick={() => removeItem('characters', c.id)} className="absolute top-2 right-2 text-zinc-700 hover:text-red-500"><Trash2 size={14}/></button>
              <input value={c.name} onChange={e => updateItem('characters', c.id, 'name', e.target.value)} placeholder="Nombre del ser..." className="bg-transparent border-b border-zinc-800 text-sm font-bold text-amber-100 outline-none pb-1" />
              <input value={c.tags} onChange={e => updateItem('characters', c.id, 'tags', e.target.value.split(','))} placeholder="Etiquetas (separadas por coma)..." className="bg-transparent text-[10px] text-zinc-500 outline-none" />
              <textarea value={c.content} onChange={e => updateItem('characters', c.id, 'content', e.target.value)} placeholder="Observación..." className="bg-transparent text-xs text-zinc-400 outline-none resize-none h-16 font-serif" />
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
            <div key={p.id} className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 mb-2 flex flex-col gap-2 relative border-l-2 border-l-cyan-500/40">
              <button onClick={() => removeItem('places', p.id)} className="absolute top-2 right-2 text-zinc-700 hover:text-red-500"><Trash2 size={14}/></button>
              <input value={p.name} onChange={e => updateItem('places', p.id, 'name', e.target.value)} placeholder="Nombre del paraje..." className="bg-transparent border-b border-zinc-800 text-sm font-bold text-amber-100 outline-none pb-1" />
              <textarea value={p.content} onChange={e => updateItem('places', p.id, 'content', e.target.value)} placeholder="Atmósfera o importancia..." className="bg-transparent text-xs text-zinc-400 outline-none resize-none h-12 font-serif" />
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
            <div key={g.id} className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 mb-2 flex flex-col gap-2 relative border-l-2 border-l-red-500/40">
              <button onClick={() => removeItem('glossary', g.id)} className="absolute top-2 right-2 text-zinc-700 hover:text-red-500"><Trash2 size={14}/></button>
              <input value={g.name} onChange={e => updateItem('glossary', g.id, 'name', e.target.value)} placeholder="Término o pregunta..." className="bg-transparent border-b border-zinc-800 text-sm font-bold text-amber-100 outline-none pb-1" />
              <textarea value={g.content} onChange={e => updateItem('glossary', g.id, 'content', e.target.value)} placeholder="Significado o duda persistente..." className="bg-transparent text-xs text-zinc-400 outline-none resize-none h-12 font-serif" />
            </div>
          ))}
        </EntitySection>

        {/* CONNECTIONS */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
          <div className="w-full flex justify-between items-center p-4">
            <button onClick={() => setOpenSections({...openSections, connections: !openSections.connections})} className="flex items-center gap-3">
              <LinkIcon size={14} className="text-amber-500/60" />
              <span className="font-serif text-xs font-bold text-zinc-400 uppercase tracking-widest">Conexiones Multiversales</span>
            </button>
            <button onClick={() => addItem('connections', { bookTitles: [], description: '' })} className="p-1.5 bg-zinc-800 text-amber-500 rounded-full hover:bg-zinc-700 transition-colors">
              <Plus size={14}/>
            </button>
          </div>
          {openSections.connections && (
            <div className="p-4 pt-0 flex flex-col gap-4">
              {form.connections.length === 0 && (
                <p className="text-[10px] text-zinc-600 italic leading-relaxed text-center py-4">¿Este relato resuena con otros mundos? Añade una conexión para entrelazar destinos.</p>
              )}
              {form.connections.map((conn) => (
                <div key={conn.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col gap-3 relative group/conn">
                  <button onClick={() => removeItem('connections', conn.id)} className="absolute top-3 right-3 text-zinc-700 hover:text-red-500 opacity-0 group-hover/conn:opacity-100 transition-all"><Trash2 size={14}/></button>

                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">Libros Vinculados</label>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1 mt-1">
                      {books.filter(b => b.title !== form.book).map(b => (
                        <button
                          key={b.id || b.title}
                          onClick={() => toggleBookInConnection(conn.id, b.title)}
                          className={`px-2.5 py-1 rounded-full text-[9px] font-bold border transition-all ${conn.bookTitles?.includes(b.title) ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-black/40 border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}
                        >
                          {b.emoji} {b.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-900">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">Naturaleza del Entrelazamiento</label>
                    <textarea
                      value={conn.description} onChange={e => updateItem('connections', conn.id, 'description', e.target.value)}
                      className="bg-transparent text-xs text-zinc-400 outline-none resize-none h-16 font-serif leading-relaxed italic"
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
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg animate-fade-in">
            <button onClick={() => setOpenSections({...openSections, panels: !openSections.panels})} className="w-full flex justify-between items-center p-4 hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <ImageIcon size={14} className="text-zinc-500" />
                <span className="font-serif text-xs font-bold text-zinc-400 uppercase tracking-widest">Paneles de Impacto</span>
              </div>
              {openSections.panels ? <ChevronUp size={14} className="text-zinc-600" /> : <ChevronDown size={14} className="text-zinc-600" />}
            </button>
            {openSections.panels && (
              <div className="p-4 pt-0">
                <div className="grid grid-cols-2 gap-3 mb-2">
                  {form.mangaPanels.map((img, i) => (
                    <div key={i} className="relative aspect-video bg-black rounded-lg overflow-hidden border border-zinc-800 group/panel shadow-inner">
                      <img src={img} className="w-full h-full object-cover opacity-80 group-hover/panel:opacity-100 transition-opacity" alt="Panel" />
                      <button onClick={() => setForm({...form, mangaPanels: form.mangaPanels.filter((_, idx) => idx !== i)})} className="absolute top-2 right-2 bg-black/80 rounded-full p-1.5 text-zinc-500 hover:text-red-500 shadow-lg group-hover/panel:scale-110 transition-all"><X size={12}/></button>
                    </div>
                  ))}
                  <label className="aspect-video bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-amber-500/40 hover:bg-amber-500/5 transition-all group/upload">
                    <Plus size={24} className="text-zinc-700 group-hover/upload:text-amber-500/60 transition-colors" />
                    <span className="text-[8px] text-zinc-700 uppercase mt-2 tracking-widest font-bold group-hover/upload:text-amber-500/60 text-center">Añadir Panel</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EntitySection({ title, icon, isOpen, onToggle, onAdd, children }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="w-full flex justify-between items-center p-4">
        <button onClick={onToggle} className="flex flex-1 items-center gap-3">
          <div className="w-4 h-4 flex items-center justify-center bg-zinc-800 rounded text-[10px] text-zinc-500">
            {isOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </div>
          <span className="font-serif text-xs font-bold text-zinc-400 uppercase tracking-widest">{title}</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); onAdd(); }} className="p-1.5 bg-zinc-800 text-amber-500 rounded-full hover:bg-zinc-700 transition-colors">
          {icon}
        </button>
      </div>
      {isOpen && <div className="p-4 pt-0 flex flex-col gap-2">{children}</div>}
    </div>
  );
}
