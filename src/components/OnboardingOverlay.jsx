import { useState } from 'react';
import { Calendar, BookOpen, Library, Sparkles, ChevronRight } from 'lucide-react';

const STEPS = [
  {
    title: 'El Grimorio Despierta',
    body: 'Has abierto un archivo vivo. Cada sesión de lectura se inscribe como crónica — personajes, lugares, citas y reglas del mundo narrativo, preservados para siempre.',
  },
  {
    title: 'Tres Rituales',
    rituals: [
      { icon: Calendar, label: 'Plan Maestro', desc: 'Organiza tu lectura por semanas y sella cada una como ritual.' },
      { icon: BookOpen, label: 'Bitácora', desc: 'Registra crónicas con resúmenes, personajes, lugares y citas.' },
      { icon: Library, label: 'El Archivo', desc: 'Los nombres inscritos se agregan automáticamente al Archivo.' },
    ],
  },
  {
    title: 'El Oráculo Aguarda',
    body: 'Forja tu primera crónica y el Archivo cobrará vida. Consulta al Oráculo para revelar conexiones ocultas entre tus lecturas.',
    isOracle: true,
  },
];

export function OnboardingOverlay({ onComplete }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center px-6">
      {/* Theme-aware backdrop — uses app bg color for cohesion in both modes */}
      <div
        className="absolute inset-0 backdrop-blur-md"
        style={{ backgroundColor: 'color-mix(in srgb, var(--bg-app) 92%, transparent)' }}
      />

      {/* Grimoire card container */}
      <div className="grimoire-card relative w-full max-w-sm bg-zinc-900 rounded-xl p-8 flex flex-col items-center text-center">
        {/* Chapter mark */}
        <span className="text-[10px] text-amber-500 font-serif uppercase tracking-[0.3em] mb-6 font-bold">
          {['I', 'II', 'III'][step]} de {STEPS.length}
        </span>

        {/* Title */}
        <h2 className="text-2xl font-serif text-heading mb-4 animate-fade-in">{current.title}</h2>

        {/* Body — text or rituals grid */}
        {current.rituals ? (
          <div className="flex flex-col gap-4 w-full text-left mb-6 animate-fade-in">
            {current.rituals.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={14} className="text-amber-500" />
                  </div>
                  <div>
                    <span className="text-sm font-serif font-bold text-heading">{r.label}</span>
                    <p className="text-xs text-zinc-500 font-serif leading-relaxed mt-0.5">{r.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <>
            <p className="text-sm text-zinc-400 font-serif leading-relaxed mb-6 max-w-xs animate-fade-in">
              {current.body}
            </p>
            {current.isOracle && (
              <div className="w-12 h-12 rounded-full border border-oracle/30 bg-oracle/5 flex items-center justify-center mb-6 animate-oracle-glow">
                <Sparkles size={20} className="text-oracle" />
              </div>
            )}
          </>
        )}

        {/* Progress diamonds */}
        <div className="flex gap-3 mb-6">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`text-[8px] transition-all duration-300 ${
                i === step ? 'text-amber-500 scale-150' : i < step ? 'text-amber-500/40' : 'text-zinc-700'
              }`}
            >
              ◆
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 text-xs text-zinc-500 hover:text-zinc-300 font-bold uppercase tracking-widest transition-colors"
            >
              Atrás
            </button>
          )}
          <button
            onClick={() => isLast ? onComplete() : setStep(step + 1)}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-zinc-950 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
          >
            {isLast ? 'Comenzar' : 'Siguiente'}
            {!isLast && <ChevronRight size={14} />}
          </button>
        </div>

        {/* Skip — narrative voice instead of generic "Saltar" */}
        {!isLast && (
          <button
            onClick={onComplete}
            className="mt-5 text-[10px] text-zinc-600 hover:text-zinc-400 tracking-widest transition-colors font-serif italic"
          >
            Ya conozco el camino
          </button>
        )}
      </div>
    </div>
  );
}
