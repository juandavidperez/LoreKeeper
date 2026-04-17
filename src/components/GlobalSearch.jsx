import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { Search, X, BookOpen, User, Globe, HelpCircle, Scroll, Quote, FileText } from 'lucide-react';
import { useLorekeeperState } from '../hooks/useLorekeeperState';

const TYPE_ICONS = {
  entry: FileText,
  personaje: User,
  lugar: Globe,
  glosario: HelpCircle,
  regla: Scroll,
  quote: Quote,
};

const TYPE_LABELS = {
  entry: 'Cronica',
  personaje: 'Personaje',
  lugar: 'Lugar',
  glosario: 'Glosario',
  regla: 'Regla',
  quote: 'Cita',
};

function Highlight({ text, query }) {
  if (!query || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-accent/25 text-accent not-italic rounded-sm px-0.5">{part}</mark>
      : part
  );
}

export function GlobalSearch({ onNavigate, onClose }) {
  const { entries, archive } = useLorekeeperState();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  useBodyScrollLock();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const results = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    const matches = [];

    // Search entries (summary, chapter, book)
    entries.forEach(entry => {
      const inSummary = entry.reingreso?.toLowerCase().includes(q);
      const inChapter = entry.chapter?.toLowerCase().includes(q);
      const inBook = entry.book?.toLowerCase().includes(q);
      if (inSummary || inChapter || inBook) {
        matches.push({
          type: 'entry',
          name: `${entry.book} — ${entry.chapter || entry.date}`,
          preview: entry.reingreso?.slice(0, 120) || '',
          book: entry.book,
          tab: 'log',
        });
      }
    });

    // Search quotes
    entries.forEach(entry => {
      entry.quotes?.forEach(quote => {
        if (quote.toLowerCase().includes(q)) {
          matches.push({
            type: 'quote',
            name: quote.length > 80 ? quote.slice(0, 80) + '...' : quote,
            preview: `${entry.book} — ${entry.chapter || entry.date}`,
            book: entry.book,
            tab: 'log',
          });
        }
      });
    });

    // Search archive entities
    for (const [category, items] of Object.entries(archive)) {
      items.forEach(item => {
        const inName = item.name.toLowerCase().includes(q);
        const inTags = item.tags.some(t => t.toLowerCase().includes(q));
        const inMentions = item.mentions.some(m => m.text?.toLowerCase().includes(q));
        if (inName || inTags || inMentions) {
          matches.push({
            type: item.type || category,
            name: item.name,
            preview: item.mentions[0]?.text?.slice(0, 120) || item.tags.join(', '),
            book: item.book,
            tab: 'encyclopedia',
          });
        }
      });
    }

    return matches.slice(0, 20);
  }, [query, entries, archive]);

  const handleSelect = useCallback((result) => {
    onNavigate(result.tab);
    onClose();
  }, [onNavigate, onClose]);

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-20 px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-white border border-[#c9b08a] rounded-sm shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#c9b08a]/50">
          <Search size={18} className="text-stone-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar en todo el Archivo..."
            aria-label="Busqueda global"
            className="flex-1 bg-transparent text-sm text-primary-text outline-none font-serif placeholder:text-stone-400 placeholder:italic"
          />
          <kbd className="hidden sm:block text-[10px] text-stone-400 border border-stone-300 rounded px-1.5 py-0.5 font-mono">ESC</kbd>
          <button onClick={onClose} aria-label="Cerrar busqueda" className="sm:hidden p-1 text-stone-400 hover:text-stone-600">
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
          {query.length < 2 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-xs text-stone-400 font-serif italic">Escribe al menos 2 caracteres para buscar</p>
            </div>
          ) : results.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-xs text-stone-400 font-serif italic">El Archivo no guarda registros bajo ese nombre</p>
            </div>
          ) : (
            <ul role="listbox">
              {results.map((result, idx) => {
                const Icon = TYPE_ICONS[result.type] || FileText;
                return (
                  <li key={idx}>
                    <button
                      role="option"
                      onClick={() => handleSelect(result)}
                      className="w-full px-5 py-3 flex items-start gap-3 hover:bg-[#f7edd8] transition-colors text-left border-b border-[#c9b08a]/20 last:border-0"
                    >
                      <div className="mt-0.5 shrink-0">
                        <Icon size={14} className="text-stone-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm text-primary-text font-serif truncate">
                            <Highlight text={result.name} query={query} />
                          </span>
                          <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold shrink-0">
                            {TYPE_LABELS[result.type] || result.type}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 truncate font-serif italic">
                          <Highlight text={result.preview} query={query} />
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 mt-0.5">
                        <BookOpen size={10} className="text-stone-300" />
                        <span className="text-[10px] text-stone-400">{result.book}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
