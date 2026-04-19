import { useState, useMemo, useRef, Fragment, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Book, Layers, Layout, Download, Upload, ChevronDown, ChevronRight, Plus, Sparkles, Loader2, Scroll, Share2 } from 'lucide-react';
import { useLorekeeperState } from '../hooks/useLorekeeperState';
import { useNotification } from '../hooks/useNotification';
import { ConfirmModal } from '../components/ConfirmModal';
import { callGemini } from '../utils/ai';
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

  const handleLoadDemo = import.meta.env.DEV ? () => {
    import('../data/mockData').then(({ DEMO_DATA }) => {
      try {
        importData(JSON.stringify(DEMO_DATA));
        notify('¡Datos de prueba cargados!', 'success');
      } catch (err) {
        notify(err.message || 'Error al cargar la demo.', 'error');
      }
    });
  } : undefined;

  const [justSealed, setJustSealed] = useState(null);
  const sealTimeout = useRef(null);
  const [sealModal, setSealModal] = useState(null);

  // Identify the "Next Up" week (needed for initial expansion)
  const nextUpWeek = useMemo(() => {
    if (isEditing) return null;
    const sortedPending = schedule
      .filter(w => !completedWeeks.includes(w.week))
      .sort((a, b) => a.week - b.week);
    return sortedPending.length > 0 ? sortedPending[0].week : null;
  }, [schedule, completedWeeks, isEditing]);

  // Initial expansion of the active phase (Adjusting state when a prop changes)
  const [initialPhaseExpansionDone, setInitialPhaseExpansionDone] = useState(false);
  const [prevNextUpWeek, setPrevNextUpWeek] = useState(null);
  if (nextUpWeek !== prevNextUpWeek) {
    setPrevNextUpWeek(nextUpWeek);
    if (nextUpWeek && !initialPhaseExpansionDone) {
      const activePhase = phases.find(p => nextUpWeek >= p.weeks[0] && nextUpWeek <= p.weeks[1]);
      if (activePhase) {
        setExpandedPhases(new Set([activePhase.id]));
        setInitialPhaseExpansionDone(true);
      }
    }
  }

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
      navigator.vibrate?.([10, 60, 25]);
      setJustSealed(week);
      if (sealTimeout.current) clearTimeout(sealTimeout.current);
      sealTimeout.current = setTimeout(() => setJustSealed(null), 1500);

      const weekData = schedule.find(w => w.week === week);
      if (weekData) {
        const bookTitles = [weekData.novelTitle, weekData.mangaTitle].filter(t => t && !t.startsWith('—'));
        const weekEntries = entries.filter(e => bookTitles.includes(e.book));
        setSealModal({ weekData, weekEntries });
      }
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
  const addWeek = (phaseId = null) => {
    if (phaseId) {
      const phase = phases.find(p => p.id === phaseId);
      if (!phase) return;

      // Insert right after this phase's last week
      const insertAt = phase.weeks[1] + 1;
      const newWeek = {
        week: insertAt,
        mangaTitle: books.find(b => b.type === 'manga')?.title || "",
        mangaVols: "",
        novelTitle: books.find(b => b.type === 'novel')?.title || "",
        novelSection: "",
        tip: "Nueva semana de aventura."
      };

      // Shift all weeks that were >= insertAt
      setSchedule([
        ...schedule.filter(w => w.week < insertAt),
        newWeek,
        ...schedule.filter(w => w.week >= insertAt).map(w => ({ ...w, week: w.week + 1 }))
      ]);

      // Extend this phase's end by 1; shift all subsequent phases by 1
      setPhases(phases.map(p => {
        if (p.id === phaseId) return { ...p, weeks: [p.weeks[0], p.weeks[1] + 1] };
        if (p.weeks[0] >= insertAt) return { ...p, weeks: [p.weeks[0] + 1, p.weeks[1] + 1] };
        return p;
      }));

      setCompletedWeeks(completedWeeks.map(w => w >= insertAt ? w + 1 : w));
    } else {
      // No phase: append at the very end
      const nextWeek = schedule.length > 0 ? schedule[schedule.length - 1].week + 1 : 1;
      setSchedule([...schedule, {
        week: nextWeek,
        mangaTitle: books.find(b => b.type === 'manga')?.title || "",
        mangaVols: "",
        novelTitle: books.find(b => b.type === 'novel')?.title || "",
        novelSection: "",
        tip: "Nueva semana de aventura."
      }]);
    }
  };

  const updateWeek = (weekNum, field, value) => {
    setSchedule(schedule.map(w => w.week === weekNum ? { ...w, [field]: value } : w));
  };

  const deleteWeek = (weekNum) => {
    // Remove week, shift all subsequent weeks down by 1
    setSchedule(schedule
      .filter(w => w.week !== weekNum)
      .map(w => w.week > weekNum ? { ...w, week: w.week - 1 } : w)
    );

    // Shrink containing phase's end by 1; shift phases that start after weekNum
    setPhases(phases.map(p => {
      const contains = p.weeks[0] <= weekNum && weekNum <= p.weeks[1];
      if (contains) return { ...p, weeks: [p.weeks[0], p.weeks[1] - 1] };
      if (p.weeks[0] > weekNum) return { ...p, weeks: [p.weeks[0] - 1, p.weeks[1] - 1] };
      return p;
    }));

    setCompletedWeeks(completedWeeks
      .filter(w => w !== weekNum)
      .map(w => w > weekNum ? w - 1 : w)
    );
  };

  const insertWeek = (atWeekNum) => {
    const newWeek = {
      week: atWeekNum,
      mangaTitle: books.find(b => b.type === 'manga')?.title || "",
      mangaVols: "",
      novelTitle: books.find(b => b.type === 'novel')?.title || "",
      novelSection: "",
      tip: ""
    };
    setSchedule([
      ...schedule.filter(w => w.week < atWeekNum),
      newWeek,
      ...schedule.filter(w => w.week >= atWeekNum).map(w => ({ ...w, week: w.week + 1 }))
    ]);
    setPhases(phases.map(p => ({
      ...p,
      weeks: [
        p.weeks[0] >= atWeekNum ? p.weeks[0] + 1 : p.weeks[0],
        p.weeks[1] >= atWeekNum ? p.weeks[1] + 1 : p.weeks[1]
      ]
    })));
    setCompletedWeeks(completedWeeks.map(w => w >= atWeekNum ? w + 1 : w));
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
      {sealModal && (
        <WeeklySealModal
          weekData={sealModal.weekData}
          weekEntries={sealModal.weekEntries}
          onClose={() => setSealModal(null)}
        />
      )}

      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-header-bg pb-4 border-b border-primary/20">
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

      {/* RHYTHM COMPARATOR */}
      {!isEditing && entries.length > 0 && schedule.length > 0 && (
        <RhythmComparator completedWeeks={completedWeeks} schedule={schedule} entries={entries} />
      )}

      {/* HABIT & ACTIVITY CHARTS */}
      {!isEditing && entries.length > 0 && (
        <div className="flex flex-col gap-3">
          <ActivityGrid entries={entries} />
          <HabitGraph entries={entries} />
          <BookStats entries={entries} books={books} />
        </div>
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
          onDeleteWeek={deleteWeek} onInsertWeek={insertWeek} onAddWeek={addWeek}
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
            <Download size={20} />
          </button>
          <label className="p-2 text-stone-400 hover:text-accent transition-all hover:scale-110 cursor-pointer flex items-center justify-center" title="Importar">
            <Upload size={20} />
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
            {!isEditing && import.meta.env.DEV && (
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
  const { streak, totalReadingMinutes } = useMemo(() => {
    let currentStreak = 0;
    if (entries.length) {
      const dates = [...new Set(entries.map(e => e.date))].sort().reverse();
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      if (dates[0] === today || dates[0] === yesterdayStr) {
        let checkDate = new Date(dates[0]);
        for (const d of dates) {
          if (d === checkDate.toISOString().split('T')[0]) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else break;
        }
      }
    }
    const minutes = entries.reduce((sum, e) => sum + (e.readingTime || 0), 0);
    return { streak: currentStreak, totalReadingMinutes: minutes };
  }, [entries]);

  const timeLabel = useMemo(() => {
    if (totalReadingMinutes === 0) return '—';
    const h = Math.floor(totalReadingMinutes / 60);
    const m = totalReadingMinutes % 60;
    return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m`;
  }, [totalReadingMinutes]);

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-stone-900/5 blur opacity-25 rounded-lg" />
      <div className="relative grid grid-cols-2 sm:grid-cols-4 bg-header-bg border border-accent/20 rounded-sm divide-y-0 divide-x divide-accent/20 shadow-sm transform hover:translate-y-[-1px] transition-transform duration-300">
        <div className="flex flex-col items-center py-5 px-4 border-b sm:border-b-0 border-accent/20">
          <span className="text-3xl font-serif text-primary-text drop-shadow-sm">{completedTotal}</span>
          <span className="text-[8px] font-bold text-stone-600 uppercase tracking-tighter text-center mt-1">Semanas Selladas</span>
        </div>
        <div className="flex flex-col items-center py-5 px-4 bg-section-bg border-b sm:border-b-0 border-accent/20 border-l border-accent/20">
          <span className="text-3xl font-serif text-accent flex items-center gap-1.5 drop-shadow-sm">
            <span className="text-2xl leading-none">✦</span>{streak}
          </span>
          <span className="text-[8px] font-bold text-stone-600 uppercase tracking-tighter text-center mt-1">Racha Actual</span>
        </div>
        <div className="flex flex-col items-center py-5 px-4 border-l border-accent/20">
          <span className="text-3xl font-serif text-primary-text drop-shadow-sm">{progress}%</span>
          <span className="text-[8px] font-bold text-stone-600 uppercase tracking-tighter text-center mt-1">
            {completedTotal} de {totalWeeks} sem.
          </span>
        </div>
        <div className="flex flex-col items-center py-5 px-4 border-l border-accent/20">
          <span className="text-3xl font-serif text-primary-text drop-shadow-sm leading-none">{timeLabel}</span>
          <span className="text-[8px] font-bold text-stone-600 uppercase tracking-tighter text-center mt-1">Tiempo Total</span>
        </div>
      </div>
    </div>
  );
}

function RhythmComparator({ completedWeeks, schedule, entries }) {
  const { expectedWeeks, delta, startDate } = useMemo(() => {
    if (!entries.length || !schedule.length) return { expectedWeeks: 0, delta: 0, startDate: null };
    const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
    const start = new Date(sorted[0].date);
    const daysElapsed = Math.floor((new Date() - start) / (1000 * 60 * 60 * 24));
    const expected = Math.min(Math.max(Math.floor(daysElapsed / 7), 0), schedule.length);
    return { expectedWeeks: expected, delta: completedWeeks.length - expected, startDate: start };
  }, [entries, schedule, completedWeeks]);

  if (!startDate) return null;

  const actual = completedWeeks.length;
  const total = schedule.length;
  const actualPct = Math.min((actual / total) * 100, 100);
  const expectedPct = Math.min((expectedWeeks / total) * 100, 100);

  const statusColor = delta > 0 ? 'text-amber-500' : delta < 0 ? 'text-red-500' : 'text-accent';
  const statusLabel = delta > 0 ? `${delta} sem. adelante` : delta < 0 ? `${Math.abs(delta)} sem. atrás` : 'A tiempo';
  const statusIcon = delta > 0 ? '↑' : delta < 0 ? '↓' : '✦';

  return (
    <div className="bg-header-bg border border-primary/20 rounded-sm px-5 py-4 flex flex-col gap-3 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1 h-full bg-accent/20" />
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-500">Ritmo del Viaje</span>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-item-bg border border-primary/10 shadow-sm transition-all group-hover:border-accent/30`}>
          <span className={`text-[10px] font-bold font-serif ${statusColor}`}>{statusIcon} {statusLabel}</span>
        </div>
      </div>
      <div className="relative h-2 bg-item-bg rounded-full border border-primary/5 overflow-hidden">
        {/* Actual Progress (Amber) */}
        <div
          className="absolute top-0 left-0 h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)] transition-all duration-700 ease-out"
          style={{ width: `${actualPct}%` }}
        />

        {/* Expected Marker */}
        {expectedPct > 0 && (
          <div
            className="absolute top-0 w-0.5 h-full bg-stone-400 group-hover:bg-accent transition-colors z-10"
            style={{ left: `${expectedPct}%` }}
          >
            <div className="absolute top-[-4px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-stone-400 group-hover:bg-accent" />
          </div>
        )}
      </div>
      <div className="flex justify-between text-[8px] text-stone-400 font-bold uppercase tracking-widest">
        <span>Selladas: <span className="text-accent font-bold">{actual}</span></span>
        <span>Esperadas: <span className="text-stone-400">{expectedWeeks}</span></span>
        <span>Total: {total}</span>
      </div>
    </div>
  );
}

function HabitGraph({ entries }) {
  const weeks = useMemo(() => {
    const today = new Date();
    const daysSinceMonday = (today.getDay() + 6) % 7;
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - daysSinceMonday);
    currentWeekStart.setHours(0, 0, 0, 0);

    return Array.from({ length: 8 }, (_, i) => {
      const weekOffset = 7 - i; // i=0 → 7 weeks ago, i=7 → current week
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(currentWeekStart.getDate() - weekOffset * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const count = entries.filter(e => {
        const d = new Date(e.date + 'T12:00:00');
        return d >= weekStart && d <= weekEnd;
      }).length;

      const label = weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '');
      return { label, count, isCurrent: weekOffset === 0 };
    });
  }, [entries]);

  const maxCount = Math.max(...weeks.map(w => w.count), 1);
  const totalEntries = weeks.reduce((s, w) => s + w.count, 0);

  return (
    <div className="bg-header-bg border border-accent/20 rounded-sm px-4 pt-4 pb-3 shadow-sm">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">Hábito · Últimas 8 semanas</p>
        {totalEntries > 0 && (
          <span className="text-[9px] font-mono text-accent">{totalEntries} crónicas</span>
        )}
      </div>
      <div className="flex items-end gap-1 h-16">
        {weeks.map((week, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
            {week.count > 0 && (
              <span className={`text-[8px] font-mono leading-none mb-0.5 ${week.isCurrent ? 'text-accent' : 'text-stone-500'}`}>
                {week.count}
              </span>
            )}
            <div
              className={`w-full rounded-[2px] transition-all duration-700 ${week.count === 0
                ? 'bg-stone-800/50'
                : week.isCurrent
                  ? 'bg-accent shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                  : 'bg-accent/40'
                }`}
              style={{ height: week.count === 0 ? '4px' : `${Math.max((week.count / maxCount) * 100, 18)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1 mt-1.5">
        {weeks.map((week, i) => (
          <div key={i} className="flex-1 text-center">
            <span className={`text-[8px] font-mono leading-none block truncate ${week.isCurrent ? 'text-accent' : 'text-stone-600'}`}>
              {week.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityGrid({ entries }) {
  const days = useMemo(() => {
    const entryDates = new Set(entries.map(e => e.date));
    const today = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (29 - i));
      const dateStr = d.toISOString().split('T')[0];
      return { date: dateStr, hasEntry: entryDates.has(dateStr), isToday: i === 29 };
    });
  }, [entries]);

  const activeDays = days.filter(d => d.hasEntry).length;

  return (
    <div className="bg-header-bg border border-accent/20 rounded-sm px-4 pt-4 pb-3 shadow-sm">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">Actividad · Últimos 30 días</p>
        {activeDays > 0 && (
          <span className="text-[9px] font-mono text-accent">{activeDays} días activos</span>
        )}
      </div>
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: 'repeat(30, 1fr)' }}>
        {days.map((day, i) => (
          <div
            key={i}
            title={day.date}
            className={`aspect-square rounded-[1px] ${day.hasEntry
              ? day.isToday
                ? 'bg-accent'
                : 'bg-accent/50'
              : 'bg-stone-800/50'
              }`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[8px] font-mono text-stone-600">{days[0]?.date?.slice(5).replace('-', '/')}</span>
        <span className="text-[8px] font-mono text-accent">hoy</span>
      </div>
    </div>
  );
}

function BookStats({ entries, books }) {
  const stats = useMemo(() => {
    return books.map(book => {
      const bookEntries = entries.filter(e => e.book === book.title);
      const totalMinutes = bookEntries.reduce((sum, e) => sum + (e.readingTime || 0), 0);
      const lastEntry = bookEntries.sort((a, b) => b.date.localeCompare(a.date))[0];
      return {
        book,
        count: bookEntries.length,
        totalMinutes,
        lastDate: lastEntry?.date ?? null,
      };
    }).filter(s => s.count > 0);
  }, [entries, books]);

  if (stats.length === 0) return null;

  const maxMinutes = Math.max(...stats.map(s => s.totalMinutes), 1);
  const maxCount = Math.max(...stats.map(s => s.count), 1);

  const formatTime = (mins) => {
    if (!mins) return null;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m`;
  };

  // Use minutes if any entry has readingTime, else fall back to entry count
  const hasTime = stats.some(s => s.totalMinutes > 0);

  return (
    <div className="bg-header-bg border border-accent/20 rounded-sm px-4 pt-4 pb-5 shadow-sm">
      <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-4">
        Por tomo · {hasTime ? 'Tiempo de lectura' : 'Crónicas registradas'}
      </p>
      <div className="flex flex-col gap-3.5">
        {stats.map(({ book, count, totalMinutes, lastDate }) => {
          const barRatio = hasTime
            ? (totalMinutes / maxMinutes)
            : (count / maxCount);
          const timeStr = formatTime(totalMinutes);

          return (
            <div key={book.id} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-serif text-primary-text truncate flex items-center gap-1.5">
                  <span>{book.emoji}</span>
                  <span className="truncate">{book.title}</span>
                </span>
                <span className="text-[9px] font-mono text-stone-400 flex-shrink-0">
                  {timeStr ?? `${count} crónica${count !== 1 ? 's' : ''}`}
                  {timeStr && <span className="text-stone-600 ml-1">· {count}</span>}
                </span>
              </div>
              <div className="h-1.5 bg-stone-800/40 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.max(barRatio * 100, 4)}%`,
                    backgroundColor: book.color || 'var(--accent)',
                    opacity: 0.75,
                  }}
                />
              </div>
              {lastDate && (
                <span className="text-[8px] font-mono text-stone-600">última entrada {lastDate}</span>
              )}
            </div>
          );
        })}
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
          <button onClick={() => onDelete(book.id)} className="p-3 text-stone-300 hover:text-red-500 transition-colors flex items-center justify-center min-w-[48px] min-h-[48px]"><Trash2 size={20} /></button>
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
        <div key={phase.id} className="w-full bg-input-bg border border-primary/40 rounded-xl p-5 flex flex-col gap-4 group relative transition-all hover:bg-card-bg shadow-sm">
          <button
            onClick={() => onDelete(phase.id)}
            className="absolute top-4 right-4 p-3 text-stone-400 hover:text-red-500 transition-all opacity-60 hover:opacity-100 flex items-center justify-center min-w-[48px] min-h-[48px]"
          >
            <Trash2 size={18} />
          </button>

          <div className="flex flex-col gap-1.5 pr-12">
            <input
              value={phase.label}
              onChange={e => onUpdate(phase.id, 'label', e.target.value)}
              className="bg-transparent border-0 border-b border-accent/20 p-0 text-xl font-serif font-bold text-primary-text focus:ring-0 focus:border-accent w-full"
              placeholder="Nombre de la Era/Fase"
            />
            <input
              value={phase.desc}
              onChange={e => onUpdate(phase.id, 'desc', e.target.value)}
              className="bg-transparent border-0 p-0 text-xs font-serif italic text-stone-600 focus:ring-0 placeholder:text-stone-400 w-full"
              placeholder="Breve descripción histórica..."
            />
          </div>

          <div className="grid grid-cols-[1fr,1fr,auto] gap-3 sm:gap-6 items-end pt-2 border-t border-primary/10">
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] uppercase font-bold text-stone-500 tracking-wider">Origen</span>
              <input
                type="number"
                value={phase.weeks[0]}
                onChange={e => onUpdate(phase.id, 'weeks', [parseInt(e.target.value), phase.weeks[1]])}
                inputMode="numeric"
                className="bg-section-bg border border-accent/20 rounded px-3 py-2 text-sm text-primary-text focus:border-accent outline-none w-full"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] uppercase font-bold text-stone-500 tracking-wider">Ocaso</span>
              <input
                type="number"
                value={phase.weeks[1]}
                onChange={e => onUpdate(phase.id, 'weeks', [phase.weeks[0], parseInt(e.target.value)])}
                inputMode="numeric"
                className="bg-section-bg border border-accent/20 rounded px-3 py-2 text-sm text-primary-text focus:border-accent outline-none w-full"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Color</span>
              <input
                type="color"
                value={phase.color}
                onChange={e => onUpdate(phase.id, 'color', e.target.value)}
                className="w-10 h-10 rounded-full border-2 border-white/20 shadow-md cursor-pointer overflow-hidden p-0"
              />
            </div>
          </div>
        </div>
      ))}
      <button onClick={onAdd} className="py-4 border-2 border-dashed border-primary/30 text-stone-400 rounded-lg hover:text-accent hover:border-accent/50 transition-all font-serif italic text-sm bg-item-bg/40">+ Registrar nueva Era en la Cronología</button>
    </div>
  );
}

function WeekSchedule({ phases, schedule, books, completedWeeks, isEditing, expandedPhases, onTogglePhase, nextUpWeek, onToggleWeek, onUpdateWeek, onDeleteWeek, onInsertWeek, onAddWeek, onLogWeek }) {
  const renderedWeekNumbers = new Set();
  phases.forEach(phase => {
    schedule.filter(w => w.week >= phase.weeks[0] && w.week <= phase.weeks[1])
      .forEach(w => renderedWeekNumbers.add(w.week));
  });
  const orphanWeeks = schedule.filter(w => !renderedWeekNumbers.has(w.week));

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
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
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
                  <Fragment key={week.week}>
                    <div
                      onClick={() => !isEditing && onToggleWeek(week.week)}
                      className={`group py-5 flex items-center justify-between gap-4 sm:gap-6 transition-all duration-500 relative ${!isEditing ? 'cursor-pointer hover:bg-accent/5' : 'bg-item-bg shadow-lg border-l-4 border-accent'} ${isNextUp && !isEditing ? 'bg-accent/5' : ''} -mx-4 px-4 my-2 rounded-sm`}
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
                                <div className="flex items-center gap-2.5 text-xs text-primary-text/80 bg-item-bg/40 p-1.5 rounded border border-primary/10 shadow-sm overflow-hidden">
                                  <span className="text-lg flex-shrink-0">{novelBook?.emoji || '📖'}</span>
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-serif font-bold text-primary-text leading-tight truncate">{week.novelTitle || 'Sin título'}</span>
                                    <span className="text-[10px] text-stone-500 italic uppercase tracking-tighter truncate">{week.novelSection || 'Tomo 1'}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs text-primary-text/80 bg-item-bg/40 p-1.5 rounded border border-primary/10 shadow-sm overflow-hidden">
                                  <span className="text-lg flex-shrink-0">{mangaBook?.emoji || '📚'}</span>
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-serif font-bold text-primary-text leading-tight truncate">{week.mangaTitle || 'Sin título'}</span>
                                    <span className="text-[10px] text-stone-500 italic uppercase tracking-tighter truncate">{week.mangaVols || 'Tomo 1'}</span>
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

                      <div className={`flex-shrink-0 flex items-center justify-center group/seal ${isEditing ? 'w-6' : 'w-24'}`}>
                        {isEditing ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteWeek(week.week); }}
                            className="absolute top-2 right-2 p-2.5 text-stone-300 hover:text-red-500 rounded transition-all opacity-60 hover:opacity-100 flex items-center justify-center min-w-[44px] min-h-[44px]"
                            aria-label="Eliminar semana"
                          >
                            <Trash2 size={16} />
                          </button>
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
                    {isEditing && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onInsertWeek(week.week + 1); }}
                        aria-label={`Insertar semana después de ${week.week}`}
                        className="flex items-center justify-center gap-1.5 w-full py-1.5 text-[10px] font-serif italic text-stone-500 hover:text-accent hover:bg-accent/5 transition-colors"
                      >
                        <Plus size={10} /> insertar semana aquí
                      </button>
                    )}
                  </Fragment>
                );
              })}
            </div>

            {isEditing && (
              <button onClick={() => onAddWeek(phase.id)} className="mt-4 py-4 border-2 border-dashed border-primary/30 text-stone-400 rounded-lg hover:text-accent hover:border-accent/50 transition-all font-serif italic text-sm text-center bg-item-bg/30">
                + Inscribir nueva semana en {phase.label}
              </button>
            )}
          </div>
        );
      })}

      {/* ORPHAN WEEKS (Safety for invisible weeks) */}
      {isEditing && orphanWeeks.length > 0 && (
        <div className="flex flex-col gap-6 mt-4 border-2 border-red-500/20 p-6 rounded-xl bg-red-500/5">
          <div className="flex justify-between items-baseline border-b-2 border-red-500/20 pb-3 mb-2">
            <h3 className="font-serif text-2xl text-red-700 tracking-tight shrink-0">Semanas fuera de cronología</h3>
            <span className="text-[10px] font-serif italic text-red-600/60 text-right leading-tight">Estas semanas existen en el registro pero no pertenecen a ninguna Era definida.</span>
          </div>

          <div className="flex flex-col divide-y divide-red-500/10 bg-item-bg/40 rounded-sm px-4 border border-red-500/10">
            {orphanWeeks.map((week) => (
              <div key={week.week} className="py-4 flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-serif font-bold text-red-800/40">{week.week}</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-serif font-bold text-stone-600">{week.novelTitle || week.mangaTitle || 'Semana sin asignar'}</span>
                    <span className="text-[10px] text-stone-400 italic">No visible en el Plan Maestro</span>
                  </div>
                </div>
                <button
                  onClick={() => onDeleteWeek(week.week)}
                  className="p-3 text-red-400 hover:text-red-600 transition-all flex items-center justify-center min-w-[48px] min-h-[48px]"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-center text-red-700/50 italic font-serif">Aumenta el rango de semanas en el Gestor de Fases para rescatar estas semanas.</p>
        </div>
      )}
    </div>
  );
}

function WeeklySealModal({ weekData, weekEntries, onClose }) {
  const [phrase, setPhrase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  const charCount = weekEntries.reduce((acc, e) => acc + (e.characters?.length || 0), 0);
  const placeCount = weekEntries.reduce((acc, e) => acc + (e.places?.length || 0), 0);
  const quoteCount = weekEntries.reduce((acc, e) => acc + (e.quotes?.length || 0), 0);

  const novelLabel = weekData.novelTitle && !weekData.novelTitle.startsWith('—') ? weekData.novelTitle : null;
  const mangaLabel = weekData.mangaTitle && !weekData.mangaTitle.startsWith('—') ? weekData.mangaTitle : null;

  useEffect(() => {
    const books = [novelLabel, mangaLabel].filter(Boolean).join(' y ');
    const sections = [
      novelLabel && weekData.novelSection ? `${novelLabel} — ${weekData.novelSection}` : null,
      mangaLabel && weekData.mangaVols ? `${mangaLabel} — ${weekData.mangaVols}` : null,
    ].filter(Boolean).join('; ');

    const prompt = `Semana ${weekData.week} sellada en el grimorio. Leído: ${sections || books}. ${weekData.tip ? `Reflexión del cronista: "${weekData.tip}".` : ''} Registrado: ${charCount} personajes, ${placeCount} lugares.

Escribe una sola oración poética (máximo 25 palabras) en español que capture el espíritu de esta semana de lectura. Tono solemne, de archivista antiguo. Sin comillas. Sin explicaciones adicionales.`;

    callGemini(prompt, 'Eres el archivista del Gran Grimorio. Cierras cada semana con una inscripción poética breve.')
      .then(text => setPhrase(text.trim()))
      .catch(() => setPhrase('Los hilos de esta semana han sido tejidos en la eternidad del Archivo.'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-zinc-950/90 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-header-bg border border-accent/40 rounded-t-2xl sm:rounded-xl shadow-2xl overflow-y-auto max-h-[90dvh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-accent/10 border-b border-accent/20 px-6 pt-6 pb-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Scroll size={14} className="text-accent" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-accent">Semana {weekData.week} · Sellada</span>
            <Scroll size={14} className="text-accent" />
          </div>
          <h3 className="font-serif text-xl text-primary-text leading-tight">
            {[novelLabel, mangaLabel].filter(Boolean).join(' · ') || `Semana ${weekData.week}`}
          </h3>
          {(weekData.novelSection || weekData.mangaVols) && (
            <p className="text-[10px] text-stone-400 italic mt-1 font-serif">
              {[weekData.novelSection, weekData.mangaVols].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-6 py-4 border-b border-primary/20">
          {[
            { count: charCount, label: 'personajes' },
            { count: placeCount, label: 'lugares' },
            { count: quoteCount, label: 'frases' },
          ].map(({ count, label }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span className="text-2xl font-serif font-bold text-accent">{count}</span>
              <span className="text-[9px] uppercase tracking-widest text-stone-500">{label}</span>
            </div>
          ))}
        </div>

        {/* Gemini phrase */}
        <div className="px-6 py-6 min-h-[100px] flex items-center justify-center relative bg-item-bg/30">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent pointer-events-none" />
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-stone-400">
              <Loader2 size={24} className="animate-spin text-accent/60" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse">Consultando al Oráculo...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 animate-inscribe max-w-[280px]">
              <div className="h-px w-10 bg-accent/30" />
              <p className="font-serif italic text-base text-primary-text leading-relaxed text-center">
                “{phrase}”
              </p>
              <div className="h-px w-10 bg-accent/30" />
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="px-6 pb-6 pt-2 flex gap-2">
          <button
            onClick={async () => {
              setSharing(true);
              try {
                const SIZE = 1080;
                const canvas = document.createElement('canvas');
                canvas.width = SIZE; canvas.height = SIZE;
                const ctx = canvas.getContext('2d');

                ctx.fillStyle = '#0c0a08';
                ctx.fillRect(0, 0, SIZE, SIZE);
                ctx.strokeStyle = '#78350f'; ctx.lineWidth = 4;
                ctx.strokeRect(20, 20, SIZE - 40, SIZE - 40);
                ctx.strokeStyle = '#a16207'; ctx.lineWidth = 1.5;
                ctx.strokeRect(34, 34, SIZE - 68, SIZE - 68);

                const center = (text, y, font, color) => {
                  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = 'center';
                  ctx.fillText(text, SIZE / 2, y);
                };
                const wrap = (text, y, font, color, maxW, lh) => {
                  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = 'center';
                  let line = '', curY = y;
                  for (const w of text.split(' ')) {
                    const t = line + w + ' ';
                    if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line.trim(), SIZE / 2, curY); line = w + ' '; curY += lh; }
                    else line = t;
                  }
                  ctx.fillText(line.trim(), SIZE / 2, curY);
                  return curY;
                };
                const hline = (y) => {
                  ctx.strokeStyle = '#78350f'; ctx.lineWidth = 1;
                  ctx.beginPath(); ctx.moveTo(80, y); ctx.lineTo(SIZE - 80, y); ctx.stroke();
                };

                center(`✦  SEMANA ${weekData.week}  ·  SELLADA  ✦`, 140, 'bold 26px serif', '#f59e0b');
                hline(168);

                const titleText = [novelLabel, mangaLabel].filter(Boolean).join('  ·  ') || `Semana ${weekData.week}`;
                const fs = titleText.length > 40 ? 44 : titleText.length > 25 ? 52 : 60;
                const lastY = wrap(titleText, 280, `italic bold ${fs}px serif`, '#fafaf9', 900, 70);

                const secs = [
                  novelLabel && weekData.novelSection ? weekData.novelSection : null,
                  mangaLabel && weekData.mangaVols ? weekData.mangaVols : null,
                ].filter(Boolean).join('  ·  ');
                if (secs) wrap(secs, lastY + 60, '28px serif', '#a8a29e', 900, 40);

                hline(500);

                const colW = (SIZE - 160) / 3;
                [{ count: charCount, label: 'PERSONAJES' }, { count: placeCount, label: 'LUGARES' }, { count: quoteCount, label: 'FRASES' }]
                  .forEach(({ count, label }, i) => {
                    const x = 80 + colW * i + colW / 2;
                    ctx.font = 'bold 64px serif'; ctx.fillStyle = '#f59e0b'; ctx.textAlign = 'center';
                    ctx.fillText(count.toString(), x, 580);
                    ctx.font = 'bold 18px serif'; ctx.fillStyle = '#78716c';
                    ctx.fillText(label, x, 616);
                  });

                hline(648);
                if (phrase) wrap(`"${phrase}"`, 748, 'italic 30px serif', '#d6d3d1', 840, 44);
                hline(940);
                center('✦  LoreKeeper  ·  El Gran Archivo', 990, '22px serif', '#57534e');

                canvas.toBlob(async (blob) => {
                  const file = new File([blob], `lorekeeper-semana-${weekData.week}.png`, { type: 'image/png' });
                  try {
                    if (navigator.share && navigator.canShare?.({ files: [file] })) {
                      await navigator.share({ files: [file], title: `Semana ${weekData.week} — LoreKeeper` });
                    } else {
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = file.name; a.click();
                      URL.revokeObjectURL(url);
                    }
                  } catch (_) { /* user cancelled share */ }
                }, 'image/png');
              } finally {
                setSharing(false);
              }
            }}
            disabled={loading || sharing}
            className="flex-1 py-3.5 bg-item-bg border border-accent/30 text-accent font-serif font-bold uppercase tracking-[0.15em] text-[11px] rounded-sm hover:bg-accent/10 active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {sharing ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
            Compartir
          </button>
          <button
            onClick={onClose}
            className="flex-[2] py-3.5 bg-accent text-white font-serif font-bold uppercase tracking-[0.15em] text-[11px] rounded-sm hover:bg-accent-secondary active:scale-[0.98] transition-all shadow-lg border-2 border-accent-secondary"
          >
            Archivar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
