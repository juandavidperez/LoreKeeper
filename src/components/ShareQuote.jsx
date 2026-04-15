import { useCallback } from 'react';
import { Share2, Copy, X } from 'lucide-react';
import { useNotification } from '../hooks/useNotification';

const quoteText = (quote, book, chapter) =>
  `\u201C${quote}\u201D \u2014 ${book}${chapter ? `, ${chapter}` : ''}`;

export function ShareQuote({ quote, book, chapter, onClose }) {
  const notify = useNotification();

  const copyToClipboard = useCallback(async (text) => {
    const t = text ?? quoteText(quote, book, chapter);
    try {
      await navigator.clipboard.writeText(t);
      notify('Cita copiada al portapapeles.', 'success');
      onClose();
    } catch {
      notify('No se pudo copiar la cita.', 'error');
    }
  }, [quote, book, chapter, notify, onClose]);

  const share = useCallback(async () => {
    const text = quoteText(quote, book, chapter);
    if (navigator.share) {
      try {
        await navigator.share({ text });
        onClose();
      } catch (err) {
        if (err.name !== 'AbortError') copyToClipboard(text);
      }
    } else {
      copyToClipboard(text);
    }
  }, [quote, book, chapter, onClose, copyToClipboard]);

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-header-bg border border-accent/30 rounded-sm shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-accent/20">
          <h3 className="font-serif text-sm text-primary-text font-bold">Compartir Cita</h3>
          <button onClick={onClose} aria-label="Cerrar" className="p-1.5 text-stone-400 hover:text-primary-text transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Preview */}
        <div className="p-5">
          <div className="bg-[#f7edd8] border border-[#c9b08a]/50 rounded-sm p-5 mb-4">
            <p className="text-sm text-stone-800 italic font-serif leading-relaxed">&ldquo;{quote}&rdquo;</p>
            <p className="text-xs text-stone-500 mt-3 font-serif">
              {book}{chapter ? ` \u2014 ${chapter}` : ''}
            </p>
          </div>

          <div className="flex gap-3">
            {navigator.share && (
              <button
                onClick={share}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-accent hover:bg-accent-secondary text-white rounded-sm text-xs font-bold uppercase tracking-widest transition-colors"
              >
                <Share2 size={14} />
                Compartir
              </button>
            )}
            <button
              onClick={() => copyToClipboard()}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-item-bg hover:bg-section-bg text-primary-text rounded-sm text-xs font-bold uppercase tracking-widest transition-colors border border-primary/30"
            >
              <Copy size={14} />
              Copiar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
