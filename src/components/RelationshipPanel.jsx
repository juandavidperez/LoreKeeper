import React, { useState } from 'react';
import { LucideLink2, LucideArrowRight, LucideRefreshCw } from 'lucide-react';

export function RelationshipPanel({ sourceNode, entities, onSave, onCancel }) {
  const [targetId, setTargetId] = useState('');
  const [type, setType] = useState('Aliado');
  const [isDirectional, setIsDirectional] = useState(false);
  const [weight, setWeight] = useState(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!targetId) return;
    onSave({
      sourceId: sourceNode.id,
      targetId,
      type,
      isDirectional,
      weight
    });
  };

  const REL_TYPES = [
    'Aliado', 'Enemigo', 'Maestro', 'Alumno', 'Familia', 
    'Vínculo de Sangre', 'Originario de', 'Visitó', 'Rival'
  ];

  return (
    <div className="flex flex-col gap-3 p-3 pt-1 animate-inscribe">
      <div className="flex items-center gap-2 mb-1">
        <LucideLink2 size={12} className="text-accent" />
        <p className="text-[10px] font-serif uppercase tracking-widest opacity-70">Forjar Vínculo</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        {/* Target Selector */}
        <select
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          className="text-[11px] font-serif bg-input-bg border border-border-subtle rounded px-2 py-1.5 outline-none focus:border-accent"
        >
          <option value="">Seleccionar destino...</option>
          {entities
            .filter(e => e.id !== sourceNode.id)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(e => (
              <option key={e.id} value={e.id}>{e.name} ({e.type})</option>
            ))
          }
        </select>

        {/* Type Selector */}
        <div className="flex gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="flex-1 text-[11px] font-serif bg-input-bg border border-border-subtle rounded px-2 py-1.5 outline-none"
          >
            {REL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <button
            type="button"
            onClick={() => setIsDirectional(!isDirectional)}
            className="px-3 rounded border border-border-subtle transition-colors"
            title={isDirectional ? "Unidireccional (Flecha)" : "Bidireccional"}
            style={{ color: isDirectional ? 'var(--text-accent)' : 'var(--text-muted)' }}
          >
            {isDirectional ? <LucideArrowRight size={14} /> : <LucideRefreshCw size={14} />}
          </button>
        </div>

        {/* Weight */}
        <div className="flex items-center justify-between px-1">
          <label className="text-[10px] font-serif italic opacity-60">Intensidad: {weight}</label>
          <input 
            type="range" min="1" max="5" value={weight} 
            onChange={(e) => setWeight(parseInt(e.target.value))}
            className="w-24 accent-amber-700 h-1"
          />
        </div>

        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 text-[10px] font-serif py-1.5 rounded opacity-60 hover:opacity-100 transition-opacity"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!targetId}
            className="flex-1 text-[10px] font-serif py-1.5 rounded bg-accent text-white disabled:opacity-30 transition-all active:scale-95"
          >
            Sellar Vínculo
          </button>
        </div>
      </form>
    </div>
  );
}
