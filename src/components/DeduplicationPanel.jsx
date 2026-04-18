import React, { useState } from 'react';
import { Search, LucideMerge, X } from 'lucide-react';

export function DeduplicationPanel({ sourceEntity, allEntities, onCancel, onMerge }) {
  const [searchTerm, setSearchTerm] = useState('');

  const candidates = allEntities
    .filter(e => e.id !== sourceEntity.id && e.type === sourceEntity.type)
    .filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(0, 5);

  return (
    <div className="p-3 bg-accent/5 border-t border-accent/20 flex flex-col gap-3 animate-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LucideMerge size={14} className="text-accent" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Fusionar Entidad</span>
        </div>
        <button onClick={onCancel} className="text-stone-400 hover:text-stone-600 transition-colors">
          <X size={14} />
        </button>
      </div>

      <p className="text-[10px] text-stone-500 italic leading-tight">
        Combina "{sourceEntity.name}" con otra entrada para unificar menciones y eliminar duplicados.
      </p>

      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400" size={12} />
        <input
          type="text"
          placeholder="Buscar duplicado..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-accent/20 rounded px-7 py-1.5 text-xs outline-none focus:border-accent transition-all"
        />
      </div>

      <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-1">
        {candidates.map(candidate => (
          <button
            key={candidate.id}
            onClick={() => onMerge(candidate.id)}
            className="flex items-center justify-between p-2 rounded hover:bg-accent hover:text-white transition-all text-left group"
          >
            <span className="text-xs font-serif">{candidate.name}</span>
            <span className="text-[9px] opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest font-bold">Fusionar</span>
          </button>
        ))}
        {candidates.length === 0 && (
          <p className="text-[10px] text-center py-2 text-stone-400 italic">No se encontraron candidatos.</p>
        )}
      </div>
    </div>
  );
}
