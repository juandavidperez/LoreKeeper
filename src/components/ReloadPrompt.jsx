import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[200] animate-fade-in">
      <div className="bg-white border border-[#c9b08a] backdrop-blur-md p-4 rounded-sm shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-full text-accent">
            <RefreshCw size={18} className={needRefresh ? 'animate-spin-slow' : ''} />
          </div>
          <div>
            <p className="text-sm font-serif font-bold text-primary-text">
              {offlineReady ? 'Aplicacion lista para usar sin conexion' : 'Nueva version disponible'}
            </p>
            <p className="text-xs text-stone-500 uppercase tracking-widest font-bold">
              {offlineReady ? 'El conocimiento ha sido preservado' : 'Actualiza para obtener el ultimo saber'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {needRefresh && (
            <button
              onClick={() => updateServiceWorker(true)}
              className="bg-accent hover:bg-accent-secondary text-white px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95"
            >
              Recargar
            </button>
          )}
          <button
            onClick={close}
            className="p-2 text-stone-400 hover:text-stone-600 transition-colors"
            aria-label="Cerrar aviso"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
