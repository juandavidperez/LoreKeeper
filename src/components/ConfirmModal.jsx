export function ConfirmModal({ title, message, confirmLabel = 'Confirmar', danger = false, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
    >
      <div
        className={`bg-white border rounded-sm p-6 max-w-sm mx-4 shadow-2xl ${danger ? 'border-danger-deep/30' : 'border-[#c9b08a]'}`}
        onClick={e => e.stopPropagation()}
      >
        <h3 className={`font-serif text-lg mb-2 ${danger ? 'text-danger-deep' : 'text-accent'}`}>{title}</h3>
        <p className="text-stone-600 text-sm font-serif italic mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm rounded-sm font-bold transition-colors ${
              danger
                ? 'bg-danger-deep hover:bg-danger-deep/80 text-white'
                : 'bg-accent hover:bg-accent-secondary text-white'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
