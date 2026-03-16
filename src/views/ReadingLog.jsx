import React, { useState } from 'react';
import { Plus, History, Quote, User, Globe, HelpCircle, PenTool, Edit3, Trash2, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { EntryForm } from './EntryForm';
import { useLorekeeperState } from '../hooks/useLorekeeperState';

export function ReadingLog() {
  const { entries, setEntries, books } = useLorekeeperState();
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const saveEntry = (newEntry) => {
    if (editingId) {
      setEntries(entries.map(e => e.id === editingId ? newEntry : e));
    } else {
      setEntries([newEntry, ...entries]);
    }
    setIsAdding(false);
    setEditingId(null);
  };

  const deleteEntry = (id, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    // Slight delay to ensure the event loop is clear before the blocking confirm dialog
    setTimeout(() => {
      if (window.confirm("¿Deseas desvanecer esta crónica para siempre?")) {
        setEntries(prev => prev.filter(ent => ent.id !== id));
      }
    }, 50);
  };

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setIsAdding(true);
  };

  if (isAdding) {
    const initialData = editingId ? entries.find(e => e.id === editingId) : null;
    return <EntryForm books={books} onSave={saveEntry} onCancel={() => { setIsAdding(false); setEditingId(null); }} initialData={initialData} />;
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-24">
      <div className="flex justify-between items-center bg-zinc-950/50 p-4 rounded-xl border border-zinc-900 sticky top-16 z-30 backdrop-blur-md">
        <div>
          <h2 className="text-3xl font-serif text-amber-500">Bitácora</h2>
          <p className="text-zinc-500 text-sm italic">Tus crónicas de viaje.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-amber-600 hover:bg-amber-500 text-zinc-950 p-4 rounded-full shadow-lg transition-all scale-110 active:scale-95"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {entries.length === 0 ? (
          <div className="text-center py-24 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
            <History size={48} className="mx-auto text-zinc-800 mb-4" />
            <p className="text-zinc-600 font-serif italic text-sm">El archivo está en silencio. Registra tu primera crónica.</p>
          </div>
        ) : (
          entries.map((entry) => (
            <LogCard 
              key={entry.id} 
              entry={entry} 
              onEdit={() => startEdit(entry)} 
              onDelete={(e) => deleteEntry(entry.id, e)} 
            />
          ))
        )}
      </div>
    </div>
  );
}

function LogCard({ entry, onEdit, onDelete }) {
  return (
    <div className="group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-amber-500/30 transition-all flex flex-col shadow-xl">
      <div className="bg-gradient-to-r from-amber-600/20 to-transparent p-4 flex justify-between items-center border-b border-zinc-800/50">
        <div>
          <h3 className="font-serif text-amber-100 text-lg">{entry.book}</h3>
          <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold">{entry.date} • {entry.chapter || 'S/N'}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-2 text-zinc-500 hover:text-amber-500"><Edit3 size={16}/></button>
          <button onClick={onDelete} className="p-2 text-zinc-500 hover:text-red-500"><Trash2 size={16}/></button>
          <span className="ml-2 bg-zinc-950 text-amber-500 px-3 py-1 rounded-full text-[9px] border border-amber-500/20 font-bold self-center shadow-inner">
            {entry.mood}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {entry.reingreso && (
          <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/50 italic font-serif text-sm text-amber-50/80 leading-relaxed relative">
             <span className="absolute -top-3 left-3 bg-zinc-900 px-2 text-[8px] text-amber-600 uppercase tracking-widest font-bold">Reingreso</span>
            "{entry.reingreso}"
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
                <span className="text-[10px] uppercase font-bold tracking-widest">Conexiones</span>
              </div>
              <div className="space-y-2">
                {entry.connections.map((conn, idx) => (
                  <div key={idx} className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {conn.bookTitles?.map(t => (
                        <span key={t} className="text-[8px] bg-black/40 text-amber-400 px-2 py-0.5 rounded border border-amber-900/30 font-bold">{t}</span>
                      ))}
                    </div>
                    {conn.description && <p className="text-[10px] text-zinc-400 italic font-serif leading-relaxed line-clamp-2">"{conn.description}"</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* MANGA PANELS PREVIEW */}
        {entry.mangaPanels?.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 pt-2">
            {entry.mangaPanels.map((img, i) => (
              <div key={i} className="flex-shrink-0 w-24 aspect-video bg-black rounded-lg border border-zinc-800 overflow-hidden relative group/img">
                <img src={img} className="w-full h-full object-cover opacity-60 group-hover/img:opacity-100 transition-opacity" alt="Panel" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-1">
                  <ImageIcon size={10} className="text-zinc-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EntrySection({ icon, label, list, color }) {
  const colors = {
    purple: 'text-purple-400 border-purple-500/20 bg-purple-500/5',
    cyan: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5',
    red: 'text-red-400 border-red-500/20 bg-red-500/5',
    amber: 'text-amber-500 border-amber-500/20 bg-amber-500/5',
  };

  return (
    <div className={`p-2 rounded-lg border flex items-center justify-between gap-3 ${colors[color]}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex flex-wrap gap-1 justify-end">
        {list.map(item => <span key={item} className="text-[9px] bg-black/40 px-2 py-0.5 rounded border border-zinc-800 text-zinc-300">{item}</span>)}
      </div>
    </div>
  );
}
