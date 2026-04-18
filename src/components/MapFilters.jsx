import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, LucideUsers, LucideNetwork, LucideEyeOff, Filter, ChevronDown, Cloud, Book } from 'lucide-react';

export function MapFilters({ filters, setFilters, showFog, setShowFog, books, selectedBook, setSelectedBook, onNodeFocus }) {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = (key) => setFilters(prev => ({ ...prev, [key]: !prev[key] }));

  const CONFIG = [
    { key: 'showLandmarks', label: 'Lugares', icon: Map, color: 'var(--entity-place)' },
    { key: 'showAutoEdges', label: 'Hilos de Tinta', icon: LucideNetwork, color: 'var(--text-accent)' },
    { key: 'showManualEdges', label: 'Relaciones', icon: LucideUsers, color: 'var(--entity-character)' },
    { key: 'simplifyView', label: 'Simplificar', icon: LucideEyeOff, color: '#d97706' },
  ];

  return (
    <div className="absolute top-3 left-3 flex flex-col items-start gap-2 z-30">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-2 sm:px-3 rounded-lg backdrop-blur-md border border-accent/20 transition-all active:scale-95 shadow-lg group"
        style={{
          background: 'color-mix(in srgb, var(--bg-card) 90%, transparent)',
          color: isOpen ? 'var(--text-accent)' : 'var(--text-muted)'
        }}
        aria-label="Configurar Mapa"
      >
        <Filter size={15} className={isOpen ? 'animate-pulse' : 'group-hover:rotate-12 transition-transform'} />
        <span className="hidden sm:inline text-xs font-serif font-bold tracking-wide uppercase">Configurar Mapa</span>
        <ChevronDown size={13} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: -8, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -8, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="grimoire-card rounded-lg p-2.5 sm:p-3 flex flex-col gap-3 backdrop-blur-md border border-accent/20 shadow-2xl w-[180px] sm:w-[220px]"
            style={{ background: 'color-mix(in srgb, var(--bg-card) 98%, transparent)' }}
          >
            {/* LIBRO */}
            {books && (
              <>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 opacity-50">
                    <Book size={10} className="text-accent" />
                    <p className="text-[9px] font-serif uppercase font-bold tracking-widest">Relato</p>
                  </div>
                  <select
                    value={selectedBook}
                    onChange={e => { setSelectedBook(e.target.value); onNodeFocus?.(); }}
                    className="w-full text-[11px] font-serif rounded border px-2 py-1.5 outline-none transition-colors"
                    style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-subtle)' }}
                  >
                    <option value="all">Todo el archivo</option>
                    {books.map(b => <option key={b.id || b.title} value={b.title}>{b.title}</option>)}
                  </select>
                </div>
                <div className="h-px opacity-10" style={{ background: 'var(--text-muted)' }} />
              </>
            )}

            {/* VISIBILIDAD */}
            <div className="flex flex-col gap-1">
              <p className="text-[9px] font-serif uppercase font-bold tracking-widest opacity-50 px-1">Visibilidad</p>
              {CONFIG.map(item => {
                const ActiveIcon = item.icon;
                const isActive = filters[item.key];
                return (
                  <button
                    key={item.key}
                    onClick={() => toggle(item.key)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md transition-all active:scale-95"
                    style={{
                      background: isActive ? 'color-mix(in srgb, ' + item.color + ' 10%, transparent)' : 'transparent',
                      color: isActive ? item.color : 'var(--text-muted)'
                    }}
                  >
                    <ActiveIcon size={13} className={isActive ? 'opacity-100' : 'opacity-40'} />
                    <span className="text-[10px] font-serif font-bold whitespace-nowrap">{item.label}</span>
                    {!isActive && <LucideEyeOff size={9} className="ml-auto opacity-20" />}
                  </button>
                );
              })}
            </div>

            <div className="h-px opacity-10" style={{ background: 'var(--text-muted)' }} />

            {/* CONEXIONES */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center px-1">
                <p className="text-[9px] font-serif uppercase font-bold tracking-widest opacity-50">Peso mín.</p>
                <span className="text-[10px] font-bold text-accent">×{filters.minWeight}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={filters.minWeight}
                onChange={(e) => setFilters(prev => ({ ...prev, minWeight: parseInt(e.target.value) }))}
                className="w-full accent-amber-700 h-1 bg-amber-900/10 rounded-lg appearance-none cursor-pointer px-1"
              />
            </div>

            {/* BRUMA — solo si props disponibles */}
            {setShowFog && (
              <>
                <div className="h-px opacity-10" style={{ background: 'var(--text-muted)' }} />
                <button
                  onClick={() => setShowFog(!showFog)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md transition-all active:scale-95 hover:bg-accent/5"
                  style={{ color: showFog ? 'var(--text-accent)' : 'var(--text-muted)' }}
                >
                  <Cloud size={13} className={showFog ? 'opacity-100' : 'opacity-40'} />
                  <span className="text-[10px] font-serif font-bold">Bruma</span>
                  <div className={`ml-auto w-6 h-3 rounded-full relative transition-colors ${showFog ? 'bg-accent' : 'bg-stone-300'}`}>
                    <div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all ${showFog ? 'right-0.5' : 'left-0.5'}`} />
                  </div>
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
