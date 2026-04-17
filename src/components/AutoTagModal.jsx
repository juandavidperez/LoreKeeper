import { CheckSquare, Square, X } from 'lucide-react'
import { useState } from 'react'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

export function AutoTagModal({ detected, onConfirm, onCancel }) {
  useBodyScrollLock();
  // detected is { characters: [], places: [], glossary: [], worldRules: [] }
  const [selected, setSelected] = useState(() => {
    const initial = {}
    Object.entries(detected).forEach(([cat, list]) => {
      initial[cat] = new Set(list.map(e => e.name))
    })
    return initial
  })

  const toggle = (cat, name) => {
    setSelected(prev => {
      const next = { ...prev }
      const set = new Set(next[cat])
      if (set.has(name)) set.delete(name)
      else set.add(name)
      next[cat] = set
      return next
    })
  }

  const handleConfirm = () => {
    const final = {}
    Object.entries(selected).forEach(([cat, set]) => {
      final[cat] = Array.from(set).map(name => detected[cat].find(e => e.name === name))
    })
    onConfirm(final)
  }

  const total = Object.values(selected).reduce((acc, set) => acc + set.size, 0)

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/50 backdrop-blur-md animate-fade-in px-4">
      <div className="bg-header-bg border-2 border-accent/30 rounded-sm w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-accent/10 flex justify-between items-center bg-section-bg">
          <div>
            <h3 className="font-serif text-xl text-accent">Entidades Detectadas</h3>
            <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold mt-1">¿Deseas enlazarlas a esta crónica?</p>
          </div>
          <button onClick={onCancel} className="p-2 text-stone-400 hover:text-stone-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-6">
          {Object.entries(detected).map(([cat, list]) => {
            if (list.length === 0) return null
            const label = { 
              characters: 'Personajes', 
              places: 'Lugares', 
              glossary: 'Glosario', 
              worldRules: 'Reglas' 
            }[cat]

            return (
              <div key={cat} className="space-y-2">
                <h4 className="text-[9px] uppercase font-bold tracking-widest text-stone-400 border-b border-stone-200 pb-1">{label}</h4>
                <div className="flex flex-col gap-1">
                  {list.map(item => {
                    const isSelected = selected[cat].has(item.name)
                    return (
                      <button
                        key={item.name}
                        onClick={() => toggle(cat, item.name)}
                        className={`flex items-center justify-between p-3 rounded-sm transition-all border ${
                          isSelected 
                            ? 'bg-accent/5 border-accent text-accent' 
                            : 'bg-item-bg border-stone-200 text-stone-400'
                        }`}
                      >
                        <span className="font-serif italic text-sm">{item.name}</span>
                        {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-section-bg border-t border-accent/10 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 text-xs font-bold text-stone-400 uppercase tracking-widest hover:text-stone-600 transition-colors"
          >
            Omitir
          </button>
          <button
            onClick={handleConfirm}
            className="flex-[2] py-3 bg-accent text-white rounded-sm font-serif font-bold uppercase tracking-[0.2em] shadow-md hover:bg-accent-secondary active:scale-[0.98] transition-all"
          >
            Enlazar ({total})
          </button>
        </div>
      </div>
    </div>
  )
}
