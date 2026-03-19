export function ConfirmModal({ title, message, confirmLabel = 'Confirmar', danger = false, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
    >
      <div
        className={`bg-zinc-900 border rounded-2xl p-6 max-w-sm mx-4 shadow-2xl ${danger ? 'border-danger-deep/30' : 'border-zinc-800'}`}
        onClick={e => e.stopPropagation()}
      >
        <h3 className={`font-serif text-lg mb-2 ${danger ? 'text-danger-deep' : 'text-amber-500'}`}>{title}</h3>
        <p className="text-zinc-400 text-sm font-serif italic mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm rounded-lg font-bold transition-colors ${
              danger
                ? 'bg-danger-deep hover:bg-danger-deep/80 text-white'
                : 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
