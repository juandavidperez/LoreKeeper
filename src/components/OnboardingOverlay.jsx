import { useState } from 'react';
import { Calendar, BookOpen, Library, Sparkles, ChevronRight } from 'lucide-react';

const STEPS = [
  {
    title: 'El Grimorio Despierta',
    body: 'Has abierto un archivo vivo. Cada sesion de lectura se inscribe como cronica — personajes, lugares, citas y reglas del mundo narrativo, preservados para siempre.',
  },
  {
    title: 'Tres Rituales',
    rituals: [
      { icon: Calendar, label: 'Plan Maestro', desc: 'Organiza tu lectura por semanas y sella cada una como ritual.' },
      { icon: BookOpen, label: 'Cronicas', desc: 'Registra cronicas con resumenes, personajes, lugares y citas.' },
      { icon: Library, label: 'El Archivo', desc: 'Los nombres inscritos se agregan automaticamente al Archivo.' },
    ],
  },
  {
    title: 'El Oraculo Aguarda',
    body: 'Forja tu primera cronica y el Archivo cobrara vida. Consulta al Oraculo para revelar conexiones ocultas entre tus lecturas.',
    isOracle: true,
  },
];

export function OnboardingOverlay({ onComplete }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center px-6">
      <div
        className="absolute inset-0 backdrop-blur-md"
        style={{ backgroundColor: 'color-mix(in srgb, var(--bg-app) 92%, transparent)' }}
      />

      <div className="grimoire-card relative w-full max-w-sm bg-white rounded-sm p-8 flex flex-col items-center text-center">
        <span className="text-[10px] text-accent font-serif uppercase tracking-[0.3em] mb-6 font-bold">
          {['I', 'II', 'III'][step]} de {STEPS.length}
        </span>

        <h2 className="text-2xl font-serif text-primary-text mb-4 animate-fade-in">{current.title}</h2>

        {current.rituals ? (
          <div className="flex flex-col gap-4 w-full text-left mb-6 animate-fade-in">
            {current.rituals.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-sm bg-[#f7edd8] border border-[#c9b08a] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={14} className="text-accent" />
                  </div>
                  <div>
                    <span className="text-sm font-serif font-bold text-primary-text">{r.label}</span>
                    <p className="text-xs text-stone-500 font-serif leading-relaxed mt-0.5">{r.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <>
            <p className="text-sm text-stone-600 font-serif leading-relaxed mb-6 max-w-xs animate-fade-in">
              {current.body}
            </p>
            {current.isOracle && (
              <div className="w-12 h-12 rounded-full border border-oracle/30 bg-oracle/5 flex items-center justify-center mb-6 animate-oracle-glow">
                <Sparkles size={20} className="text-oracle" />
              </div>
            )}
          </>
        )}

        <div className="flex gap-3 mb-6">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`text-[8px] transition-all duration-300 ${
                i === step ? 'text-accent scale-150' : i < step ? 'text-accent/40' : 'text-stone-300'
              }`}
            >
              &#9670;
            </span>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 text-xs text-stone-500 hover:text-stone-700 font-bold uppercase tracking-widest transition-colors"
            >
              Atras
            </button>
          )}
          <button
            onClick={() => isLast ? onComplete() : setStep(step + 1)}
            className="px-6 py-2.5 bg-accent hover:bg-accent-secondary text-white rounded-sm text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
          >
            {isLast ? 'Comenzar' : 'Siguiente'}
            {!isLast && <ChevronRight size={14} />}
          </button>
        </div>

        {!isLast && (
          <button
            onClick={onComplete}
            className="mt-5 text-[10px] text-stone-400 hover:text-stone-600 tracking-widest transition-colors font-serif italic"
          >
            Ya conozco el camino
          </button>
        )}
      </div>
    </div>
  );
}
