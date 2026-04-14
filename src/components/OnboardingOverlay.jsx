import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, BookOpen, Library, Sparkles, Map, Clock, ChevronRight, Feather } from 'lucide-react';

const STEPS = [
  {
    id: 'welcome',
    roman: 'I',
    title: 'El Grimorio Despierta',
    body: 'Has abierto un archivo vivo. Cada sesión de lectura se inscribe como crónica — personajes, lugares, citas y reglas del mundo narrativo, preservados para siempre.',
    visual: (
      <div className="relative flex items-center justify-center w-20 h-20 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full border-2 border-accent/30 animate-pulse" />
        <div className="absolute inset-2 rounded-full border border-accent/20" />
        <Feather size={28} className="text-accent" />
      </div>
    ),
  },
  {
    id: 'rituals',
    roman: 'II',
    title: 'Los Cinco Rituales',
    rituals: [
      { icon: Calendar,  label: 'Plan Maestro',  desc: 'Organiza por semanas. Sella cada una como ritual.' },
      { icon: BookOpen,  label: 'Crónicas',       desc: 'Registra resumenes, personajes, lugares y citas.' },
      { icon: Library,   label: 'El Archivo',     desc: 'Todo lo inscrito se agrega automaticamente.' },
      { icon: Sparkles,  label: 'Oráculo',        desc: 'IA que responde con la voz de tus lecturas.' },
      { icon: Map,       label: 'Mapa de Sabiduría', desc: 'Visualiza el universo narrativo en un mapa vivo.' },
    ],
  },
  {
    id: 'chronicle',
    roman: 'III',
    title: 'La Primera Crónica',
    body: 'Ve a Crónicas y pulsa el botón amber para forjar tu primera entrada. Registra el capítulo, tu estado de ánimo y los conocimientos que quieres preservar.',
    visual: (
      <div className="w-full bg-item-bg border border-accent/20 rounded-sm p-4 mb-6 text-left">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-accent font-serif">Nueva Crónica</span>
        </div>
        <div className="space-y-2">
          <div className="h-2 rounded-full bg-accent/20 w-3/4" />
          <div className="h-2 rounded-full bg-accent/10 w-1/2" />
          <div className="h-2 rounded-full bg-accent/10 w-5/6" />
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          <Clock size={10} className="text-stone-400" />
          <span className="text-[9px] text-stone-400 font-serif italic">Incluye tiempo de lectura para estadísticas</span>
        </div>
      </div>
    ),
  },
  {
    id: 'oracle',
    roman: 'IV',
    title: 'El Oráculo Aguarda',
    body: 'Cuando tu Archivo crezca, consulta al Oráculo. Responde con la voz de tus propias lecturas — conexiones ocultas, personajes relacionados, patrones que no habías visto.',
    visual: (
      <div className="w-16 h-16 mx-auto mb-6 rounded-full border border-oracle/30 bg-oracle/5 flex items-center justify-center"
           style={{ boxShadow: '0 0 24px rgba(139,92,246,0.15)' }}>
        <Sparkles size={24} className="text-oracle" />
      </div>
    ),
  },
];

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

export function OnboardingOverlay({ onComplete }) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const go = (next) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center px-0 sm:px-6">
      <div
        className="absolute inset-0 backdrop-blur-md"
        style={{ backgroundColor: 'color-mix(in srgb, var(--bg-app) 90%, transparent)' }}
      />

      <div className="relative w-full sm:max-w-sm bg-header-bg border border-accent/25 rounded-t-xl sm:rounded-sm shadow-2xl overflow-hidden"
           style={{ boxShadow: '0 -4px 40px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(245,158,11,0.08)' }}>

        {/* Double-rule header (grimoire aesthetic) */}
        <div className="border-b-2 border-accent/20 px-8 pt-8 pb-0">
          <div className="border border-accent/10 px-6 pt-6 pb-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-accent font-serif font-bold uppercase tracking-[0.35em]">
                {current.roman} · {STEPS.length}
              </span>
              {/* Step dots */}
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => go(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      i === step ? 'bg-accent scale-125' : i < step ? 'bg-accent/40' : 'bg-stone-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait" custom={dir}>
              <motion.h2
                key={`title-${step}`}
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="text-2xl font-serif text-primary-text leading-tight"
              >
                {current.title}
              </motion.h2>
            </AnimatePresence>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6 min-h-[220px] flex flex-col justify-start overflow-hidden">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={`content-${step}`}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="flex flex-col"
            >
              {current.visual && current.visual}

              {current.body && (
                <p className="text-sm text-muted font-serif leading-relaxed">
                  {current.body}
                </p>
              )}

              {current.rituals && (
                <div className="flex flex-col gap-3">
                  {current.rituals.map((r) => {
                    const Icon = r.icon;
                    return (
                      <div key={r.label} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-sm bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon size={13} className="text-accent" />
                        </div>
                        <div>
                          <span className="text-xs font-serif font-bold text-primary-text">{r.label}</span>
                          <p className="text-[11px] text-muted font-serif leading-snug mt-0.5">{r.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 flex items-center justify-between border-t border-accent/10 pt-5">
          {step > 0 ? (
            <button
              onClick={() => go(step - 1)}
              className="text-[10px] text-muted hover:text-primary-text font-bold uppercase tracking-widest transition-colors"
            >
              Atrás
            </button>
          ) : (
            <button
              onClick={onComplete}
              className="text-[10px] text-muted hover:text-primary-text tracking-widest transition-colors font-serif italic"
            >
              Saltar
            </button>
          )}

          <button
            onClick={() => isLast ? onComplete() : go(step + 1)}
            className="flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent-secondary text-white rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-colors font-serif"
          >
            {isLast ? 'Comenzar' : 'Siguiente'}
            {!isLast && <ChevronRight size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
}
