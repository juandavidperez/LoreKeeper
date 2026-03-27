import { useState, useMemo, useRef, useEffect } from 'react';
import { Trash2, Book, Layers, Layout, Download, Upload, ChevronDown, ChevronRight } from 'lucide-react';
import { useLorekeeperState } from '../hooks/useLorekeeperState';
import { useNotification } from '../hooks/useNotification';
import { ConfirmModal } from '../components/ConfirmModal';
import { DEMO_DATA } from '../data/mockData';

export function ReadingPlan({ onLogWeek }) {
  const {
    phases, setPhases,
    schedule, setSchedule,
    books, setBooks,
    entries, setEntries,
    completedWeeks, setCompletedWeeks,
    exportData, importData
  } = useLorekeeperState();

  const notify = useNotification();
  const [isEditing, setIsEditing] = useState(false);
  const [activeManager, setActiveManager] = useState('weeks');
  const [confirmModal, setConfirmModal] = useState(null);
  const [expandedPhases, setExpandedPhases] = useState(new Set());

  const handleLoadDemo = () => {
    try {
      importData(JSON.stringify(DEMO_DATA));
      notify('¡Datos de prueba cargados!', 'success');
    } catch (err) {
      notify(err.message || 'Error al cargar la demo.', 'error');
    }
  };

  const [justSealed, setJustSealed] = useState(null);
  const sealTimeout = useRef(null);
  const initialExpansionDone = useRef(false);

  // Identify the "Next Up" week (needed for initial expansion)
  const nextUpWeek = useMemo(() => {
    if (isEditing) return null;
    const sortedPending = schedule
      .filter(w => !completedWeeks.includes(w.week))
      .sort((a, b) => a.week - b.week);
    return sortedPending.length > 0 ? sortedPending[0].week : null;
  }, [schedule, completedWeeks, isEditing]);

  // Initial expansion of the active phase
  useEffect(() => {
    if (nextUpWeek && !initialExpansionDone.current) {
      const activePhase = phases.find(p => nextUpWeek >= p.weeks[0] && nextUpWeek <= p.weeks[1]);
      if (activePhase) {
        setExpandedPhases(new Set([activePhase.id]));
        initialExpansionDone.current = true;
      }
    }
  }, [nextUpWeek, phases]);

  const togglePhase = (phaseId) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phaseId)) next.delete(phaseId);
      else next.add(phaseId);
      return next;
    });
  };

  const toggleWeek = (week) => {
    const wasCompleted = completedWeeks.includes(week);
    setCompletedWeeks((prev) =>
      prev.includes(week) ? prev.filter(w => w !== week) : [...prev, week]
    );
    if (!wasCompleted) {
      setJustSealed(week);
      if (sealTimeout.current) clearTimeout(sealTimeout.current);
      sealTimeout.current = setTimeout(() => setJustSealed(null), 1500);
    }
  };

  const progress = schedule.length > 0 ? Math.round((completedWeeks.length / schedule.length) * 100) : 0;

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setConfirmModal({
      title: 'Importar datos',
      message: '¿Estás seguro? Los datos importados reemplazarán tu estado actual por completo.',
      confirmLabel: 'Importar',
      danger: true,
      onConfirm: () => {
        setConfirmModal(null);
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            importData(ev.target.result);
            notify('Datos importados con éxito.', 'success');
          } catch (err) {
            notify(err.message || 'El archivo no es un JSON válido.', 'error');
          }
        };
        reader.readAsText(file);
      }
    });
  };

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
    setPhases([...phases, { id: Date.now(), label: "Nueva Fase", weeks: [lastWeek, lastWeek], color: "var(--accent)", desc: "Descripción de fase" }]);
  };

  const updatePhase = (id, field, value) => {
    if (field === 'weeks') {
      const [start, end] = value;
      if (end < start) {
        notify('La semana final no puede ser menor que la inicial.', 'error');
        return;
      }
    }
    setPhases(phases.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const deletePhase = (id) => {
    setPhases(phases.filter(p => p.id !== id));
  };

  // CRUD: Books
  const addBook = () => {
    setBooks([...books, { id: `book-${Date.now()}`, title: "Nuevo Libro", emoji: "📖", color: "var(--accent)", type: "novel" }]);
  };

  const updateBook = (id, field, value) => {
    setBooks(books.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const deleteBook = (id) => {
    const bookToDelete = books.find(b => b.id === id);
    if (!bookToDelete) return;

    const bookEntries = entries.filter(e => e.book === bookToDelete.title);

    if (bookEntries.length > 0) {
      setConfirmModal({
        title: 'Eliminar libro',
        message: `"${bookToDelete.title}" tiene ${bookEntries.length} crónica${bookEntries.length !== 1 ? 's' : ''} asociada${bookEntries.length !== 1 ? 's' : ''}. ¿Eliminarlas también?`,
        confirmLabel: 'Eliminar todo',
        danger: true,
        onConfirm: () => {
          setConfirmModal(null);
          setEntries(entries.filter(e => e.book !== bookToDelete.title));
          setBooks(books.filter(b => b.id !== id));
          notify('Libro y crónicas eliminados.', 'success');
        }
      });
    } else {
      setConfirmModal({
        title: 'Eliminar libro',
        message: `¿Deseas eliminar "${bookToDelete.title}"?`,
        confirmLabel: 'Eliminar',
        danger: true,
        onConfirm: () => {
          setConfirmModal(null);
          setBooks(books.filter(b => b.id !== id));
          notify('Libro eliminado.', 'success');
        }
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 animate-fade-in pb-24 h-full">
      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          danger={confirmModal.danger}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* HEADER */}
      <div className="sticky top-[-24px] z-30 bg-header-bg pb-4 border-b border-primary/20">
        <PlanHeader
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing(!isEditing)}
          onExport={exportData}
          onImport={handleImport}
          onLoadDemo={handleLoadDemo}
          activeManager={activeManager}
          onSelectManager={setActiveManager}
        />
      </div>

      {/* PROGRESS / STATS WIDGET (The Archival Widget) */}
      {!isEditing && schedule.length > 0 && (
        <ArchivalStats
          completedTotal={completedWeeks.length}
          totalWeeks={schedule.length}
          progress={progress}
          entries={entries}
        />
      )}

      {/* ONBOARDING HINT */}
      {!isEditing && completedWeeks.length === 0 && schedule.length > 0 && (
        <p className="text-[10px] text-stone-500 italic text-center -mt-4 font-serif opacity-70">Toca cualquier semana para sellar tu progreso en el tiempo.</p>
      )}

      {/* EMPTY STATE */}
      {!isEditing && schedule.length === 0 && (
        <div className="text-center py-24 border-2 border-dashed border-accent/20 rounded-lg mx-2 bg-item-bg/30">
          <div className="text-5xl mb-6 opacity-20 text-primary-text">📜</div>
          <p className="text-stone-400 font-serif italic text-sm max-w-[200px] mx-auto leading-relaxed">
            El Archivo Dorado aguarda... Forja tu primer plan de lectura pulsando Editar.
          </p>
        </div>
      )}

      {/* BOOK MANAGER */}
      {isEditing && activeManager === 'books' && (
        <BookManager books={books} onUpdate={updateBook} onDelete={deleteBook} onAdd={addBook} />
      )}

      {/* PHASE MANAGER */}
      {isEditing && activeManager === 'phases' && (
        <PhaseManager phases={phases} onUpdate={updatePhase} onDelete={deletePhase} onAdd={addPhase} />
      )}

      {/* SCHEDULE */}
      {(activeManager === 'weeks' || !isEditing) && (
        <WeekSchedule
          phases={phases} schedule={schedule} books={books}
          completedWeeks={completedWeeks} isEditing={isEditing}
          justSealed={justSealed}
          expandedPhases={expandedPhases} onTogglePhase={togglePhase}
          nextUpWeek={nextUpWeek}
          onToggleWeek={toggleWeek} onUpdateWeek={updateWeek}
          onDeleteWeek={deleteWeek} onAddWeek={addWeek}
          onLogWeek={onLogWeek}
        />
      )}
      
      {/* DECORATIVE ILLUSTRATION (Generated AI Manuscript Art) */}
      {!isEditing && schedule.length > 0 && (
        <div className="mt-12 opacity-80 flex flex-col items-center gap-4 animate-fade-in duration-1000">
           <div className="w-full max-w-sm border-2 border-primary/30 p-2.5 bg-item-bg shadow-md relative overflow-hidden group">
             <div className="absolute inset-0 bg-stone-900/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
             <img 
               src="/manuscript_footer.png" 
               alt="Scribit in Aeternum"
               className="w-full h-auto grayscale-[0.2] contrast-[1.1] sepia-[0.1]"
             />
           </div>
           <span className="text-[10px] font-serif italic text-stone-400 tracking-widest mt-2 uppercase">Scribit in Aeternum</span>
        </div>
      )}
    </div>
  );
}

function PlanHeader({ isEditing, onToggleEdit, onExport, onImport, onLoadDemo, activeManager, onSelectManager }) {
  const managerTabs = [
    { id: 'weeks', icon: Layout, label: 'SEMANAS' },
    { id: 'phases', icon: Layers, label: 'FASES' },
    { id: 'books', icon: Book, label: 'LIBROS' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <h2 className="text-4xl font-serif text-primary-text leading-tight tracking-tight">Plan Maestro</h2>
          <p className="text-stone-500 font-serif italic text-sm -mt-1 opacity-80">Crónica del Tiempo</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onExport} className="p-2 text-stone-400 hover:text-accent transition-all hover:scale-110 flex items-center justify-center" title="Exportar">
            <Download size={20}/>
          </button>
          <label className="p-2 text-stone-400 hover:text-accent transition-all hover:scale-110 cursor-pointer flex items-center justify-center" title="Importar">
            <Upload size={20}/>
            <input type="file" accept=".json" onChange={onImport} className="hidden" />
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {isEditing && (
          <div className="grid grid-cols-3 bg-section-bg/50 p-1 rounded-full border border-accent/20">
            {managerTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onSelectManager(tab.id)}
                className={`py-2 text-[10px] font-bold tracking-widest transition-all rounded-full ${activeManager === tab.id ? 'bg-item-bg text-accent shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            {!isEditing && (
              <button 
                onClick={onLoadDemo} 
                className="text-[9px] uppercase tracking-[0.2em] font-bold text-stone-300 hover:text-stone-500 transition-colors"
              >
                Restaurar Registro Demo
              </button>
            )}
          </div>
          <button
            onClick={onToggleEdit}
            className={`px-8 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.25em] transition-all border-2 ${isEditing ? 'bg-accent text-white border-accent' : 'border-primary/30 text-stone-600 hover:bg-item-bg hover:border-accent hover:text-accent'}`}
          >
            {isEditing ? 'Guardar Cambios' : 'Editar Archivo'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ArchivalStats({ completedTotal, totalWeeks, progress, entries }) {
  // Real streak calculation
  const streak = useMemo(() => {
    if (!entries.length) return 0;
    const dates = [...new Set(entries.map(e => e.date))].sort().reverse();
    let currentStreak = 0;
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (dates[0] !== today && dates[0] !== yesterdayStr) return 0;

    let checkDate = new Date(dates[0]);
    for (const d of dates) {
      if (d === checkDate.toISOString().split('T')[0]) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return currentStreak;
  }, [entries]);

  return (
    <div className="relative group">
      {/* Decorative inner shadow/glow */}
      <div className="absolute -inset-1 bg-stone-900/5 blur opacity-25 rounded-lg" />
      
      <div className="relative grid grid-cols-1 sm:grid-cols-3 bg-header-bg border border-accent/20 rounded-sm divide-y sm:divide-y-0 sm:divide-x divide-accent/20 shadow-sm transform hover:translate-y-[-1px] transition-transform duration-300">
        <div className="flex flex-col items-center py-5 relative px-4">
          <span className="text-3xl font-serif text-primary-text drop-shadow-sm">{completedTotal}</span>
          <span className="text-[8px] font-bold text-stone-600 uppercase tracking-tighter text-center mt-1">Semanas Selladas</span>
        </div>
        <div className="flex flex-col items-center py-5 px-4 bg-section-bg">
          <span className="text-3xl font-serif text-accent flex items-center gap-1.5 drop-shadow-sm">
            <span className="text-2xl leading-none">✦</span>{streak}
          </span>
          <span className="text-[8px] font-bold text-stone-600 uppercase tracking-tighter text-center mt-1">Racha Actual</span>
        </div>
        <div className="flex flex-col items-center py-5 px-4">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-serif text-primary-text drop-shadow-sm">{progress}%</span>
          </div>
          <span className="text-[8px] font-bold text-stone-600 uppercase tracking-tighter text-center mt-1">
            {completedTotal} de {totalWeeks} semanas
          </span>
        </div>
      </div>
    </div>
  );
}

function BookManager({ books, onUpdate, onDelete, onAdd }) {
  return (
    <div className="flex flex-col gap-4 animate-fade-in px-2">
      <h3 className="font-serif italic text-stone-500 text-sm border-b border-accent/20 pb-2">Registro de Tomos del Archivo</h3>
      {books.map((book) => (
        <div key={book.id} className="bg-header-bg border-primary/40 p-4 rounded-sm flex items-center gap-3 shadow-sm border">
          <input value={book.emoji} onChange={e => onUpdate(book.id, 'emoji', e.target.value)} className="w-10 bg-item-bg border border-accent/10 rounded p-1 text-center text-lg" />
          <div className="flex flex-col flex-1 gap-1">
            <input value={book.title} onChange={e => onUpdate(book.id, 'title', e.target.value)} className="w-full bg-transparent border-0 p-0 text-sm font-serif font-bold text-primary-text focus:ring-0" placeholder="Título del Tomo" />
            <select value={book.type} onChange={e => onUpdate(book.id, 'type', e.target.value)} className="bg-transparent border-0 p-0 text-[10px] text-stone-500 uppercase font-bold focus:ring-0 cursor-pointer">
              <option value="novel">Novela</option>
              <option value="manga">Manga</option>
            </select>
          </div>
          <input type="color" value={book.color} onChange={e => onUpdate(book.id, 'color', e.target.value)} className="w-8 h-8 rounded-full cursor-pointer border-2 border-white shadow-sm" />
          <button onClick={() => onDelete(book.id)} className="p-3 text-stone-300 hover:text-red-500 transition-colors flex items-center justify-center min-w-[48px] min-h-[48px]"><Trash2 size={20}/></button>
        </div>
      ))}
      <button onClick={onAdd} className="py-4 border-2 border-dashed border-primary/30 text-stone-400 rounded-lg hover:text-accent hover:border-accent/50 transition-all font-serif italic text-sm bg-item-bg/40">+ Invocar nuevo Tomo al Archivo</button>
    </div>
  );
}

function PhaseManager({ phases, onUpdate, onDelete, onAdd }) {
  return (
    <div className="flex flex-col gap-6 animate-fade-in px-2">
      <h3 className="font-serif italic text-stone-500 text-sm border-b border-accent/20 pb-2">Cronología de Eras</h3>
      {phases.map((phase) => (
        <div className="w-full bg-input-bg border border-primary rounded-xl p-4 flex flex-col gap-3 group relative transition-all hover:bg-card-bg shadow-sm">
          <button onClick={() => onDelete(phase.id)} className="absolute top-4 right-4 p-3 text-stone-200 hover:text-red-500 transition-colors flex items-center justify-center min-w-[48px] min-h-[48px]"><Trash2 size={20}/></button>
          <div className="flex flex-col gap-1.5">
            <input value={phase.label} onChange={e => onUpdate(phase.id, 'label', e.target.value)} className="bg-transparent border-0 border-b border-accent/20 p-0 text-xl font-serif font-bold text-primary-text focus:ring-0 focus:border-accent" placeholder="Nombre de la Era/Fase" />
            <input value={phase.desc} onChange={e => onUpdate(phase.id, 'desc', e.target.value)} className="bg-transparent border-0 p-0 text-xs font-serif italic text-stone-600 focus:ring-0 placeholder:text-stone-400" placeholder="Breve descripción histórica..." />
          </div>
          <div className="flex gap-6 items-center">
            <div className="flex flex-col gap-1.5 flex-1">
              <span className="text-[9px] uppercase font-bold text-stone-500 tracking-wider">Origen (Semana)</span>
              <input type="number" value={phase.weeks[0]} onChange={e => onUpdate(phase.id, 'weeks', [parseInt(e.target.value), phase.weeks[1]])} inputMode="numeric" className="bg-section-bg border border-accent/20 rounded px-3 py-2 text-sm text-primary-text focus:border-accent outline-none" />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <span className="text-[9px] uppercase font-bold text-stone-500 tracking-wider">Ocaso (Semana)</span>
              <input type="number" value={phase.weeks[1]} onChange={e => onUpdate(phase.id, 'weeks', [phase.weeks[0], parseInt(e.target.value)])} inputMode="numeric" className="bg-section-bg border border-accent/20 rounded px-3 py-2 text-sm text-primary-text focus:border-accent outline-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Estandarte</span>
              <input type="color" value={phase.color} onChange={e => onUpdate(phase.id, 'color', e.target.value)} className="w-10 h-10 rounded-full border-2 border-white shadow-md cursor-pointer overflow-hidden p-0" />
            </div>
          </div>
        </div>
      ))}
      <button onClick={onAdd} className="py-4 border-2 border-dashed border-primary/30 text-stone-400 rounded-lg hover:text-accent hover:border-accent/50 transition-all font-serif italic text-sm bg-item-bg/40">+ Registrar nueva Era en la Cronología</button>
    </div>
  );
}

function WeekSchedule({ phases, schedule, books, completedWeeks, isEditing, justSealed, expandedPhases, onTogglePhase, nextUpWeek, onToggleWeek, onUpdateWeek, onDeleteWeek, onAddWeek, onLogWeek }) {
  return (
    <div className="flex flex-col gap-10">
      {phases.map((phase) => {
        const weekItems = schedule.filter(w => w.week >= phase.weeks[0] && w.week <= phase.weeks[1]);
        if (weekItems.length === 0 && !isEditing) return null;

        const isExpanded = expandedPhases.has(phase.id) || isEditing;

        return (
          <div key={phase.id} className="flex flex-col gap-6">
            <button 
              disabled={isEditing}
              onClick={() => onTogglePhase(phase.id)}
              className={`flex justify-between items-baseline border-b-2 border-accent/20 pb-3 mb-2 relative text-left transition-all ${!isEditing ? 'hover:bg-accent/5 -mx-2 px-2 cursor-pointer' : ''}`}
            >
               <div className="absolute -bottom-0.5 left-0 w-16 h-0.5 bg-accent" />
               <div className="flex items-center gap-3">
                 {!isEditing && (
                    <span className="text-stone-400 group-hover:text-accent transition-colors">
                      {isExpanded ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                    </span>
                 )}
                 <h3 className="font-serif text-2xl text-primary-text tracking-tight">{phase.label}</h3>
               </div>
               <span className="text-xs font-serif italic text-stone-400 tracking-wide">Eras {phase.weeks[0]}—{phase.weeks[1]}</span>
            </button>

            <div className={`flex flex-col divide-y divide-primary/10 transition-all duration-500 overflow-hidden rounded-sm px-4 ${isExpanded ? 'max-h-[5000px] opacity-100 bg-item-bg/80 border border-accent/20 shadow-sm' : 'max-h-0 opacity-0 pointer-events-none'}`}>
              {weekItems.map((week) => {
                const isCompleted = completedWeeks.includes(week.week);
                const isNextUp = nextUpWeek === week.week;
                const mangaBook = books.find(b => b.title === week.mangaTitle);
                const novelBook = books.find(b => b.title === week.novelTitle);

                return (
                  <div
                    key={week.week}
                    onClick={() => !isEditing && onToggleWeek(week.week)}
                    className={`group py-5 flex items-center justify-between gap-4 sm:gap-6 transition-all duration-500 relative ${!isEditing ? 'cursor-pointer hover:bg-accent/5' : 'bg-item-bg shadow-lg border-l-4 border-accent' } ${isNextUp && !isEditing ? 'bg-accent/5' : ''} -mx-4 px-4 my-2 rounded-sm`}
                  >
                    {isNextUp && (
                       <div className="absolute left-0 top-0 w-1 h-full bg-accent/40" />
                    )}
                    
                    <div className="flex items-start gap-4 sm:gap-6 flex-1">
                      <div className="flex flex-col items-center">
                        {isEditing ? (
                          <input 
                            type="number" 
                            value={week.week} 
                            onChange={(e) => onUpdateWeek(week.week, 'week', parseInt(e.target.value))}
                            inputMode="numeric"
                            className="w-16 bg-item-bg border-2 border-accent/30 rounded p-1 text-2xl font-serif font-bold text-accent text-center focus:border-accent outline-none"
                          />
                        ) : (
                          <span className={`text-4xl font-serif font-bold transition-colors duration-500 ${isCompleted ? 'text-stone-200' : isNextUp ? 'text-accent' : 'text-stone-300'}`}>
                            {week.week}
                          </span>
                        )}
                        {isNextUp && <span className="text-[7px] font-bold text-accent tracking-tighter uppercase mt-[-4px]">Siguiente</span>}
                      </div>

                      <div className="flex flex-col gap-3 flex-1 mt-1">
                        <div className="flex items-center gap-2">
                          {isCompleted && <span className="text-[10px] font-serif italic text-stone-300">Sellada transitoriamente</span>}
                          {isEditing && isCompleted && <span className="text-[10px] font-serif italic text-accent/60">(Editando sello histórico)</span>}
                        </div>
                        
                        <div className={`grid grid-cols-1 gap-2 transition-all ${isCompleted && !isEditing ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                          {isEditing ? (
                             <>
                               {/* Novel Edit */}
                               <div className="flex flex-col gap-1 bg-item-bg p-2.5 rounded border border-accent/20 shadow-md transition-all focus-within:ring-2 focus-within:ring-accent/20">
                                 <div className="flex items-center gap-2">
                                   <span className="text-xl">📖</span>
                                   <select 
                                     value={week.novelTitle} 
                                     onChange={(e) => onUpdateWeek(week.week, 'novelTitle', e.target.value)}
                                     className="flex-1 bg-transparent border-0 p-0 text-sm font-serif font-bold text-primary-text focus:ring-0 cursor-pointer appearance-none"
                                   >
                                     <option value="">(Sin Novela)</option>
                                     {books.filter(b => b.type === 'novel').map(b => (
                                       <option key={b.id} value={b.title} style={{ color: b.color || 'inherit' }}>{b.title}</option>
                                     ))}
                                   </select>
                                 </div>
                                 <input 
                                   type="text" 
                                   value={week.novelSection}
                                   onChange={(e) => onUpdateWeek(week.week, 'novelSection', e.target.value)}
                                   className="w-full bg-section-bg mt-1 px-2 py-1.5 rounded border border-accent/30 text-[11px] text-primary-text font-serif font-bold italic uppercase tracking-wider focus:ring-1 focus:ring-accent/50 outline-none placeholder:text-stone-400"
                                   placeholder="Capítulos / Sección / Tomo..."
                                 />
                               </div>

                               {/* Manga Edit */}
                               <div className="flex flex-col gap-1 bg-item-bg p-2.5 rounded border border-accent/20 shadow-md transition-all focus-within:ring-2 focus-within:ring-accent/20">
                                 <div className="flex items-center gap-2">
                                   <span className="text-xl">📚</span>
                                   <select 
                                     value={week.mangaTitle} 
                                     onChange={(e) => onUpdateWeek(week.week, 'mangaTitle', e.target.value)}
                                     className="flex-1 bg-transparent border-0 p-0 text-sm font-serif font-bold text-primary-text focus:ring-0 cursor-pointer appearance-none"
                                   >
                                     <option value="">(Sin Manga)</option>
                                     {books.filter(b => b.type === 'manga').map(b => (
                                       <option key={b.id} value={b.title} style={{ color: b.color || 'inherit' }}>{b.title}</option>
                                     ))}
                                   </select>
                                 </div>
                                 <input 
                                   type="text" 
                                   value={week.mangaVols}
                                   onChange={(e) => onUpdateWeek(week.week, 'mangaVols', e.target.value)}
                                   className="w-full bg-section-bg mt-1 px-2 py-1.5 rounded border border-accent/30 text-[11px] text-primary-text font-serif font-bold italic uppercase tracking-wider focus:ring-1 focus:ring-accent/50 outline-none placeholder:text-stone-400"
                                   placeholder="Capítulos / Tomos / Arcos..."
                                 />
                               </div>
                             </>
                          ) : (
                             <>
                               <div className="flex items-center gap-2.5 text-xs text-primary-text/80 bg-item-bg/40 p-1.5 rounded border border-primary/10 shadow-sm">
                                  <span className="text-lg">{novelBook?.emoji || '📖'}</span>
                                  <div className="flex flex-col">
                                    <span className="font-serif font-bold text-primary-text leading-tight">{week.novelTitle || 'Sin título'}</span>
                                    <span className="text-[10px] text-stone-500 italic uppercase tracking-tighter">{week.novelSection || 'Tomo 1'}</span>
                                  </div>
                               </div>
                               <div className="flex items-center gap-2.5 text-xs text-primary-text/80 bg-item-bg/40 p-1.5 rounded border border-primary/10 shadow-sm">
                                  <span className="text-lg">{mangaBook?.emoji || '📚'}</span>
                                  <div className="flex flex-col">
                                    <span className="font-serif font-bold text-primary-text leading-tight">{week.mangaTitle || 'Sin título'}</span>
                                    <span className="text-[10px] text-stone-500 italic uppercase tracking-tighter">{week.mangaVols || 'Tomo 1'}</span>
                                  </div>
                               </div>
                             </>
                          )}
                        </div>
                        
                        {!isEditing && week.tip && (
                           <p className={`text-[11px] font-serif italic text-stone-400 border-l-2 border-stone-200/50 pl-3 mt-1 leading-relaxed ${isCompleted ? 'opacity-30' : 'opacity-100'}`}>
                             "{week.tip}"
                           </p>
                        )}
                        
                         {isEditing && (
                            <textarea 
                              value={week.tip} 
                              onChange={(e) => onUpdateWeek(week.week, 'tip', e.target.value)} 
                              className="w-full bg-section-bg border border-accent/20 rounded p-2 text-[10px] text-primary-text outline-none resize-none font-serif italic mt-1 focus:border-accent transition-colors shadow-inner" 
                              placeholder="Inscribe un consejo del archivero para esta semana..." 
                            />
                         )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex items-center justify-center w-24 group/seal">
                      {isEditing ? (
                        <button onClick={(e) => { e.stopPropagation(); onDeleteWeek(week.week); }} className="p-3 text-stone-200 hover:text-red-500 hover:bg-red-50 rounded-full transition-all group-hover:text-stone-400"><Trash2 size={20}/></button>
                      ) : (
                        <div className="relative w-20 h-20 flex items-center justify-center">
                          {isCompleted ? (
                            <>
                              <div className={`bg-accent text-white rounded-full w-16 h-16 flex flex-col items-center justify-center shadow-lg transform -rotate-12 border-2 border-accent-secondary animate-seal transition-all hover:scale-110 active:scale-95 group-hover/seal:rotate-0 duration-500`}>
                                 <span className="text-[7px] font-bold tracking-[0.2em] uppercase mb-0.5 opacity-80">ARCHIVOS</span>
                                 <span className="text-[9px] font-serif font-bold leading-tight tracking-widest text-center px-1">SELLADO</span>
                                 <div className="mt-1 flex gap-0.5 opacity-50">
                                   <span className="text-[6px]">✦</span>
                                   <span className="text-[6px]">✦</span>
                                   <span className="text-[6px]">✦</span>
                                 </div>
                              </div>
                              {onLogWeek && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onLogWeek({
                                      book: week.novelTitle || week.mangaTitle,
                                      chapter: `Semana ${week.week}: ${week.novelSection || week.mangaVols}`,
                                      date: new Date().toISOString().split('T')[0]
                                    });
                                  }}
                                  className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold uppercase tracking-widest text-accent hover:text-accent-secondary transition-colors animate-fade-in"
                                >
                                  ✎ Inscribir Crónica
                                </button>
                              )}
                            </>
                          ) : (
                            <button className={`bg-item-bg border-2 border-accent text-accent rounded-sm py-2 px-4 text-[9px] font-bold uppercase tracking-[0.2em] hover:bg-accent hover:text-white transition-all shadow-md group-hover:scale-105 ${isNextUp ? 'ring-4 ring-accent/10' : ''}`}>
                              SELLAR
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {isEditing && (
              <button onClick={onAddWeek} className="mt-4 py-4 border-2 border-dashed border-primary/30 text-stone-400 rounded-lg hover:text-accent hover:border-accent/50 transition-all font-serif italic text-sm text-center bg-item-bg/30">
                + Inscribir nueva semana en este arco histórico
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
