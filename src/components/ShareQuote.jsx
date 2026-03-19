import { useRef, useCallback } from 'react';
import { Share2, Copy, X } from 'lucide-react';
import { useNotification } from '../hooks/useNotification';

export function ShareQuote({ quote, book, chapter, onClose }) {
  const notify = useNotification();
  const canvasRef = useRef(null);

  const generateImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    const W = 600;
    const H = 400;
    canvas.width = W;
    canvas.height = H;

    // Background
    ctx.fillStyle = '#0c0a08';
    ctx.fillRect(0, 0, W, H);

    // Double border (grimoire style)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    ctx.strokeRect(12, 12, W - 24, H - 24);
    ctx.globalAlpha = 0.1;
    ctx.strokeRect(20, 20, W - 40, H - 40);
    ctx.globalAlpha = 1;

    // Quote mark
    ctx.fillStyle = '#f59e0b';
    ctx.globalAlpha = 0.15;
    ctx.font = 'bold 120px serif';
    ctx.fillText('\u201C', 30, 110);
    ctx.globalAlpha = 1;

    // Quote text (word wrap)
    ctx.fillStyle = '#f4f4f5';
    ctx.font = 'italic 18px serif';
    const maxWidth = W - 80;
    const lines = wrapText(ctx, quote, maxWidth);
    const lineHeight = 26;
    const startY = Math.max(100, (H - lines.length * lineHeight) / 2);
    lines.forEach((line, i) => {
      ctx.fillText(line, 40, startY + i * lineHeight);
    });

    // Attribution
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '12px sans-serif';
    const attr = `${book}${chapter ? ' \u2014 ' + chapter : ''}`;
    ctx.fillText(attr, 40, H - 40);

    // Branding
    ctx.fillStyle = '#f59e0b';
    ctx.globalAlpha = 0.4;
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('LOREKEEPER', W - 30, H - 40);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;

    return canvas;
  }, [quote, book, chapter]);

  const shareNative = async () => {
    const canvas = generateImage();
    if (!canvas) return;

    try {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], 'lorekeeper-quote.png', { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          text: `\u201C${quote}\u201D \u2014 ${book}`,
          files: [file],
        });
        onClose();
        return;
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
    }

    // Fallback: share text only
    if (navigator.share) {
      try {
        await navigator.share({ text: `\u201C${quote}\u201D \u2014 ${book}` });
        onClose();
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    // Final fallback: copy text
    copyText();
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(`\u201C${quote}\u201D \u2014 ${book}`);
      notify('Cita copiada al portapapeles.', 'success');
      onClose();
    } catch {
      notify('No se pudo copiar la cita.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
          <h3 className="font-serif text-sm text-heading font-bold">Compartir Cita</h3>
          <button onClick={onClose} aria-label="Cerrar" className="p-1.5 text-zinc-500 hover:text-zinc-300">
            <X size={16} />
          </button>
        </div>

        {/* Preview */}
        <div className="p-5">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4">
            <p className="text-sm text-heading italic font-serif leading-relaxed">&ldquo;{quote}&rdquo;</p>
            <p className="text-xs text-zinc-500 mt-3 font-serif">{book}{chapter ? ` \u2014 ${chapter}` : ''}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={shareNative}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-500 text-zinc-950 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
            >
              <Share2 size={14} />
              {navigator.share ? 'Compartir' : 'Copiar'}
            </button>
            {navigator.share && (
              <button
                onClick={copyText}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors border border-zinc-800"
              >
                <Copy size={14} />
              </button>
            )}
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let current = '';

  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}
