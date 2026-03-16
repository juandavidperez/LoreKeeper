import React, { useState } from 'react';
import { CheckCircle2, Circle, Edit3, Plus, Trash2, Save, Book, Layers, Layout } from 'lucide-react';
import { useLorekeeperState } from '../hooks/useLorekeeperState';

export function ReadingPlan() {
  const {
    phases, setPhases,
    schedule, setSchedule,
    books, setBooks,
    completedWeeks, setCompletedWeeks
  } = useLorekeeperState();

  const [isEditing, setIsEditing] = useState(false);
  const [activeManager, setActiveManager] = useState('weeks');

  const toggleWeek = (week) => {
    setCompletedWeeks((prev) =>
      prev.includes(week) ? prev.filter(w => w !== week) : [...prev, week]
    );
  };

  const progress = Math.round((completedWeeks.length / schedule.length) * 100);

  // CRUD: Weeks
  const addWeek = () => {
    const nextWeek = schedule.length > 0 ? schedule[schedule.length - 1].week + 1 : 1;
    setSchedule([...schedule, {
      week: nextWeek,
      mangaTitle: books.find(b => b.type === 'manga')?.title || "",
      mangaVols: "",
      novelTitle: books.find(b => b.type === 'novel')?.title || "",
      novelSection: "",
      tip: "Nueva semana de aventura."
    }]);
  };

  const updateWeek = (weekNum, field, value) => {
    setSchedule(schedule.map(w => w.week === weekNum ? { ...w, [field]: value } : w));
  };

  const deleteWeek = (weekNum) => {
    setSchedule(schedule.filter(w => w.week !== weekNum));
  };

  // CRUD: Phases
  const addPhase = () => {
    const lastWeek = schedule.length > 0 ? schedule[schedule.length - 1].week : 1;
    setPhases([...phases, { id: Date.now(), label: "Nueva Fase", weeks: [lastWeek, lastWeek], color: "#78716C", desc: "Descripción de fase" }]);
  };

  const updatePhase = (id, field, value) => {
    setPhases(phases.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const deletePhase = (id) => {
    setPhases(phases.filter(p => p.id !== id));
  };

  // CRUD: Books
  const addBook = () => {
    setBooks([...books, { id: `book-${Date.now()}`, title: "Nuevo Libro", emoji: "📖", color: "#78716C", type: "novel" }]);
  };

  const updateBook = (id, field, value) => {
    setBooks(books.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const deleteBook = (id) => {
    setBooks(books.filter(b => b.id !== id));
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-24 h-full">
      {/* HEADER */}
      <PlanHeader isEditing={isEditing} onToggleEdit={() => setIsEditing(!isEditing)} />

      {/* EDITING TABS */}
      {isEditing && (
        <ManagerTabs activeManager={activeManager} onSelect={setActiveManager} />
      )}

      {/* PROGRESS (Only View Mode) */}
      {!isEditing && <ProgressBar progress={progress} />}

      {/* BOOK MANAGER */}
      {isEditing && activeManager === 'books' && (
        <BookManager books={books} onUpdate={updateBook} onDelete={deleteBook} onAdd={addBook} />
      )}

      {/* PHASE MANAGER */}
      {isEditing && activeManager === 'phases' && (
        <PhaseManager phases={phases} onUpdate={updatePhase} onDelete={deletePhase} onAdd={addPhase} />
      )}

      {/* SCHEDULE (View/Edit Weeks) */}
      {(activeManager === 'weeks' || !isEditing) && (
        <WeekSchedule
          phases={phases} schedule={schedule} books={books}
          completedWeeks={completedWeeks} isEditing={isEditing}
          onToggleWeek={toggleWeek} onUpdateWeek={updateWeek}
          onDeleteWeek={deleteWeek} onAddWeek={addWeek}
        />
      )}
    </div>
  );
}

function PlanHeader({ isEditing, onToggleEdit }) {
  return (
    <div className="flex justify-between items-center sm:text-center sm:flex-col sm:gap-4 bg-zinc-950/50 p-4 rounded-xl border border-zinc-900 sticky top-16 z-40 backdrop-blur-md">
      <div>
        <h2 className="text-3xl font-serif text-amber-500">Plan Maestro</h2>
        <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Arquitectura del Tiempo</p>
      </div>
      <button
        onClick={onToggleEdit}
        className={`flex items-center gap-2 px-6 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${isEditing ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}
      >
        {isEditing ? <Save size={14}/> : <Edit3 size={14}/>}
        {isEditing ? 'Finalizar Diseño' : 'Rediseñar Viaje'}
      </button>
    </div>
  );
}

function ManagerTabs({ activeManager, onSelect }) {
  const tabs = [
    { id: 'weeks', icon: Layout, label: 'Semanas' },
    { id: 'phases', icon: Layers, label: 'Fases' },
    { id: 'books', icon: Book, label: 'Portal de Libros' },
  ];

  return (
    <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
      {tabs.map(tab => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeManager === tab.id ? 'bg-zinc-800 text-amber-500' : 'text-zinc-500'}`}
          >
            <Icon size={14}/>{tab.label}
          </button>
        );
      })}
    </div>
  );
}

function ProgressBar({ progress }) {
  return (
    <div className="bg-zinc-900/80 p-6 rounded-xl border border-amber-500/20 shadow-2xl backdrop-blur-md">
      <div className="flex justify-between items-end mb-4">
        <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">Consagración del Viaje</span>
        <span className="font-serif text-amber-500 text-lg font-bold">{progress}%</span>
      </div>
      <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
        <div
          className="h-full bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function BookManager({ books, onUpdate, onDelete, onAdd }) {
  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {books.map((book) => (
        <div key={book.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
          <input value={book.emoji} onChange={e => onUpdate(book.id, 'emoji', e.target.value)} className="w-10 bg-zinc-950 border border-zinc-800 rounded p-1 text-center" />
          <input value={book.title} onChange={e => onUpdate(book.id, 'title', e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-amber-50 font-serif" />
          <select value={book.type} onChange={e => onUpdate(book.id, 'type', e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-zinc-400">
            <option value="novel">Novela</option>
            <option value="manga">Manga</option>
          </select>
          <input type="color" value={book.color} onChange={e => onUpdate(book.id, 'color', e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-none" />
          <button onClick={() => onDelete(book.id)} className="text-zinc-600 hover:text-red-500"><Trash2 size={16}/></button>
        </div>
      ))}
      <button onClick={onAdd} className="py-4 border-2 border-dashed border-zinc-800 text-zinc-600 rounded-xl hover:text-amber-500 transition-all font-serif italic text-sm">+ Invocar Nuevo Tomo</button>
    </div>
  );
}

function PhaseManager({ phases, onUpdate, onDelete, onAdd }) {
  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {phases.map((phase) => (
        <div key={phase.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col gap-3">
          <div className="flex gap-3">
            <input value={phase.label} onChange={e => onUpdate(phase.id, 'label', e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-amber-500 font-serif font-bold" />
            <input type="color" value={phase.color} onChange={e => onUpdate(phase.id, 'color', e.target.value)} className="w-8 h-8 rounded bg-transparent border-none" />
            <button onClick={() => onDelete(phase.id)} className="text-zinc-600 hover:text-red-500"><Trash2 size={16}/></button>
          </div>
          <div className="flex gap-4 items-center">
            <span className="text-[10px] text-zinc-500 font-bold">Desde Sem.</span>
            <input type="number" value={phase.weeks[0]} onChange={e => onUpdate(phase.id, 'weeks', [parseInt(e.target.value), phase.weeks[1]])} className="w-16 bg-zinc-950 border border-zinc-800 rounded p-1 text-center text-xs" />
            <span className="text-[10px] text-zinc-500 font-bold">Hasta Sem.</span>
            <input type="number" value={phase.weeks[1]} onChange={e => onUpdate(phase.id, 'weeks', [phase.weeks[0], parseInt(e.target.value)])} className="w-16 bg-zinc-950 border border-zinc-800 rounded p-1 text-center text-xs" />
          </div>
          <input value={phase.desc} onChange={e => onUpdate(phase.id, 'desc', e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded p-2 text-[10px] text-zinc-400 font-serif italic" />
        </div>
      ))}
      <button onClick={onAdd} className="py-4 border-2 border-dashed border-zinc-800 text-zinc-600 rounded-xl hover:text-amber-600 transition-all font-serif italic text-sm">+ Delimitar Nueva Fase</button>
    </div>
  );
}

function WeekSchedule({ phases, schedule, books, completedWeeks, isEditing, onToggleWeek, onUpdateWeek, onDeleteWeek, onAddWeek }) {
  return (
    <div className="flex flex-col gap-10">
      {phases.map((phase) => (
        <div key={phase.id} className="flex flex-col gap-4">
          <div className="flex justify-between items-end border-l-4 pl-4 py-1" style={{ borderColor: phase.color }}>
            <div>
              <h3 className="font-serif text-xl text-amber-100">{phase.label}</h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{phase.desc}</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {schedule.filter(w => w.week >= phase.weeks[0] && w.week <= phase.weeks[1]).map((week) => {
              const isCompleted = completedWeeks.includes(week.week);
              const mangaBook = books.find(b => b.title === week.mangaTitle);
              const novelBook = books.find(b => b.title === week.novelTitle);

              return (
                <div
                  key={week.week}
                  onClick={() => !isEditing && onToggleWeek(week.week)}
                  className={`group relative bg-zinc-900 p-5 rounded-xl border transition-all duration-300 ${!isEditing ? 'cursor-pointer' : ''} ${
                    isCompleted && !isEditing ? 'border-amber-500/40 bg-zinc-900/40 opacity-60' : 'border-zinc-800 hover:border-amber-500/30'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      {!isEditing && (
                        <div className={`p-2 rounded-lg transition-colors ${isCompleted ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-500'}`}>
                          {isCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                        </div>
                      )}
                      <h4 className="font-serif text-lg font-bold">Semana {week.week}</h4>
                    </div>
                    {isEditing && (
                      <button onClick={(e) => { e.stopPropagation(); onDeleteWeek(week.week); }} className="text-zinc-600 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                    )}
                    {!isEditing && isCompleted && (
                      <span className="text-[8px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded tracking-widest border border-amber-500/20">SELLADO</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <AssetBox
                      label="Novela" color={novelBook?.color}
                      title={week.novelTitle} section={week.novelSection} emoji={novelBook?.emoji}
                      isEditing={isEditing} books={books.filter(b => b.type === 'novel')}
                      onUpdateTitle={(val) => onUpdateWeek(week.week, 'novelTitle', val)}
                      onUpdateSection={(val) => onUpdateWeek(week.week, 'novelSection', val)}
                    />
                    <AssetBox
                      label="Manga" color={mangaBook?.color}
                      title={week.mangaTitle} section={week.mangaVols} emoji={mangaBook?.emoji}
                      isEditing={isEditing} books={books.filter(b => b.type === 'manga')}
                      onUpdateTitle={(val) => onUpdateWeek(week.week, 'mangaTitle', val)}
                      onUpdateSection={(val) => onUpdateWeek(week.week, 'mangaVols', val)}
                    />
                  </div>

                  {isEditing ? (
                    <textarea value={week.tip} onChange={(e) => onUpdateWeek(week.week, 'tip', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-[10px] text-zinc-400 outline-none resize-none font-serif" placeholder="Consejo del Archivero..." />
                  ) : (
                    <p className="text-xs text-zinc-400 italic border-l-2 border-amber-500/20 pl-3 py-1 font-serif leading-relaxed">"{week.tip}"</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {isEditing && (
        <button onClick={onAddWeek} className="py-4 border-2 border-dashed border-zinc-800 text-zinc-600 rounded-xl hover:text-amber-500 transition-all font-serif italic text-sm">+ Forjar Nueva Semana</button>
      )}
    </div>
  );
}

function AssetBox({ label, color, title, section, emoji, isEditing, books, onUpdateTitle, onUpdateSection }) {
  return (
    <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: color || '#1F2937' }} />
      <span className="text-[7px] uppercase tracking-[0.2em] text-zinc-600 block mb-1 ml-1">{label}</span>
      {isEditing ? (
        <div className="flex flex-col gap-1 ml-1">
          <select value={title} onChange={(e) => onUpdateTitle(e.target.value)} className="bg-transparent border-0 text-amber-50 text-xs font-serif outline-none p-0 cursor-pointer">
            <option value="">(Ninguno)</option>
            {books.map(b => <option key={b.id || b.title} value={b.title}>{b.emoji} {b.title}</option>)}
          </select>
          <input value={section} onChange={(e) => onUpdateSection(e.target.value)} className="bg-transparent border-b border-zinc-800 text-[9px] text-zinc-500 p-0 outline-none" placeholder="Meta..." />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 ml-1">
            <span className="text-base">{emoji}</span>
            <span className="text-sm font-serif text-amber-50/90 leading-tight">{title}</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1 ml-1 italic">{section}</p>
        </>
      )}
    </div>
  );
}
