import { Share, Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { useInstallPrompt } from '../hooks/useInstallPrompt';

export function InstallBanner() {
  const { showBanner, isIOS, install, dismiss } = useInstallPrompt();

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-24 left-4 right-4 z-[90] max-w-lg mx-auto"
        >
          <div className="bg-zinc-900 border border-accent/30 rounded-sm shadow-2xl px-5 py-4 flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] font-serif text-accent mb-1">
                Instalar Lorekeeper
              </p>
              {isIOS ? (
                <p className="text-xs text-zinc-400 font-serif italic leading-relaxed">
                  Toca <Share size={11} className="inline mb-0.5" aria-hidden="true" /> en Safari → <strong className="text-zinc-300">«Añadir a pantalla de inicio»</strong>
                </p>
              ) : (
                <p className="text-xs text-zinc-400 font-serif italic leading-relaxed">
                  Accede sin navegador, como una app nativa.
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!isIOS && (
                <button
                  onClick={install}
                  className="flex items-center gap-1.5 px-3 py-2 bg-accent text-white text-[10px] font-bold uppercase tracking-widest font-serif rounded-sm hover:bg-accent-secondary transition-colors"
                >
                  <Download size={13} />
                  Instalar
                </button>
              )}
              <button
                onClick={dismiss}
                aria-label="Cerrar"
                className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
