import { useState, useMemo, useRef } from 'react';
import { CheckCircle2, Circle, Edit3, Plus, Trash2, Save, Book, Layers, Layout, Download, Upload, FlaskConical } from 'lucide-react';
import { useLorekeeperState } from '../hooks/useLorekeeperState';
import { useNotification } from '../hooks/useNotification';
import { ConfirmModal } from '../components/ConfirmModal';
import { DEMO_DATA } from '../data/mockData';

export function ReadingPlan() {
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
    setPhases([...phases, { id: Date.now(), label: "Nueva Fase", weeks: [lastWeek, lastWeek], color: "#78716C", desc: "Descripción de fase" }]);
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
    setBooks([...books, { id: `book-${Date.now()}`, title: "Nuevo Libro", emoji: "📖", color: "#78716C", type: "novel" }]);
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
    <div className="flex flex-col gap-6 animate-fade-in pb-24 h-full">
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
      <PlanHeader
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing(!isEditing)}
        onExport={exportData}
        onImport={handleImport}
        onLoadDemo={handleLoadDemo}
        activeManager={activeManager}
        onSelectManager={setActiveManager}
      />

      {/* ONBOARDING HINT */}
      {!isEditing && completedWeeks.length === 0 && schedule.length > 0 && (
        <p className="text-xs text-zinc-500 italic text-center -mt-2">Toca cualquier semana para marcarla como completada.</p>
      )}

      {/* EMPTY STATE — first visit, no schedule yet */}
      {!isEditing && schedule.length === 0 && (
        <div className="grimoire-card text-center py-20 bg-zinc-900 rounded-2xl border-dashed">
          <div className="text-4xl mb-4 opacity-30">📖</div>
          <p className="text-zinc-500 font-serif italic text-sm max-w-xs mx-auto leading-relaxed">
            El grimorio aguarda sus primeras líneas. Toca Editar para forjar tu plan de lectura.
          </p>
        </div>
      )}

      {/* STATISTICS — promoted above schedule */}
      {!isEditing && <ReadingStats entries={entries} books={books} />}

      {/* PROGRESS (Only View Mode) */}
      {!isEditing && schedule.length > 0 && <ProgressBar progress={progress} />}

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
          onToggleWeek={toggleWeek} onUpdateWeek={updateWeek}
          onDeleteWeek={deleteWeek} onAddWeek={addWeek}
        />
      )}
    </div>
  );
}

function PlanHeader({ isEditing, onToggleEdit, onExport, onImport, onLoadDemo, activeManager, onSelectManager }) {
  const managerTabs = [
    { id: 'weeks', icon: Layout, label: 'Semanas' },
    { id: 'phases', icon: Layers, label: 'Fases' },
    { id: 'books', icon: Book, label: 'Libros' },
  ];

  return (
    <div className="flex flex-col gap-2">
      {/* Primary row: title + edit action */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-serif text-heading">Plan Maestro</h2>
        <button
          onClick={onToggleEdit}
          className={`flex items-center gap-2 px-5 py-2 rounded-full border text-xs font-bold uppercase tracking-widest transition-all ${isEditing ? 'bg-amber-500 text-zinc-950 border-amber-500' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'}`}
        >
          {isEditing ? <Save size={14}/> : <Edit3 size={14}/>}
          {isEditing ? 'Finalizar' : 'Editar'}
        </button>
      </div>

      {/* Secondary row: utilities (non-edit) or manager tabs (edit) */}
      {!isEditing ? (
        <div className="flex items-center gap-4">
          <button onClick={onExport} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1">
            <Download size={12}/> Exportar
          </button>
          <label aria-label="Importar datos" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1 cursor-pointer">
            <Upload size={12}/> Importar
            <input type="file" accept=".json" onChange={onImport} className="hidden" />
          </label>
          <button onClick={onLoadDemo} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1">
            <FlaskConical size={12}/> Demo
          </button>
        </div>
      ) : (
        <div className="flex gap-5 border-b border-zinc-800 pb-1 mt-1">
          {managerTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectManager(tab.id)}
                className={`flex items-center gap-1.5 pb-2 text-xs font-bold transition-all border-b-2 -mb-px ${activeManager === tab.id ? 'border-amber-500 text-heading' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              >
                <Icon size={13}/>{tab.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProgressBar({ progress }) {
  return (
    <div className="grimoire-card bg-zinc-900 p-6 rounded-xl">
      <div className="flex justify-between items-end mb-4">
        <span className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-bold">Semanas completadas</span>
        <span className="font-serif text-amber-500 text-lg font-bold">{progress}%</span>
      </div>
      <div className="h-2.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progress}%`, backgroundColor: 'var(--text-accent)' }}
        />
      </div>
    </div>
  );
}

function BookManager({ books, onUpdate, onDelete, onAdd }) {
  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {books.map((book) => (
        <div key={book.id} className="grimoire-card bg-zinc-900 p-4 rounded-xl flex items-center gap-4">
          <input value={book.emoji} onChange={e => onUpdate(book.id, 'emoji', e.target.value)} className="w-10 bg-zinc-950 border border-zinc-800 rounded p-1 text-center" />
          <input value={book.title} onChange={e => onUpdate(book.id, 'title', e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-zinc-300 font-serif" />
          <select value={book.type} onChange={e => onUpdate(book.id, 'type', e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-zinc-400">
            <option value="novel">Novela</option>
            <option value="manga">Manga</option>
          </select>
          <input type="color" value={book.color} onChange={e => onUpdate(book.id, 'color', e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-none" />
          <button onClick={() => onDelete(book.id)} className="p-1.5 text-zinc-600 hover:text-danger-deep"><Trash2 size={16}/></button>
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
        <div key={phase.id} className="grimoire-card bg-zinc-900 p-5 rounded-xl flex flex-col gap-3">
          <div className="flex gap-3">
            <input value={phase.label} onChange={e => onUpdate(phase.id, 'label', e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-amber-500 font-serif font-bold" />
            <input type="color" value={phase.color} onChange={e => onUpdate(phase.id, 'color', e.target.value)} className="w-8 h-8 rounded bg-transparent border-none" />
            <button onClick={() => onDelete(phase.id)} className="p-1.5 text-zinc-600 hover:text-danger-deep"><Trash2 size={16}/></button>
          </div>
          <div className="flex gap-4 items-center">
            <span className="text-xs text-zinc-500 font-bold">Desde Sem.</span>
            <input type="number" value={phase.weeks[0]} onChange={e => onUpdate(phase.id, 'weeks', [parseInt(e.target.value), phase.weeks[1]])} className="w-16 bg-zinc-950 border border-zinc-800 rounded p-1 text-center text-xs" />
            <span className="text-xs text-zinc-500 font-bold">Hasta Sem.</span>
            <input type="number" value={phase.weeks[1]} onChange={e => onUpdate(phase.id, 'weeks', [phase.weeks[0], parseInt(e.target.value)])} className="w-16 bg-zinc-950 border border-zinc-800 rounded p-1 text-center text-xs" />
          </div>
          <input value={phase.desc} onChange={e => onUpdate(phase.id, 'desc', e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-zinc-400 font-serif italic" />
        </div>
      ))}
      <button onClick={onAdd} className="py-4 border-2 border-dashed border-zinc-800 text-zinc-600 rounded-xl hover:text-amber-600 transition-all font-serif italic text-sm">+ Delimitar Nueva Fase</button>
    </div>
  );
}

function WeekSchedule({ phases, schedule, books, completedWeeks, isEditing, justSealed, onToggleWeek, onUpdateWeek, onDeleteWeek, onAddWeek }) {
  return (
    <div className="flex flex-col gap-12">
      {phases.map((phase) => (
        <div key={phase.id} className="flex flex-col gap-4">
          <div className="flex justify-between items-end border-l-4 pl-4 py-1" style={{ borderColor: phase.color }}>
            <div>
              <h3 className="font-serif text-xl text-heading">{phase.label}</h3>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">{phase.desc}</p>
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
                  className={`grimoire-card group relative bg-zinc-900 p-5 rounded-xl transition-all duration-300 ${!isEditing ? 'cursor-pointer active:scale-[0.99]' : ''} ${
                    isCompleted && !isEditing ? 'border-success/40 opacity-60' : 'border-zinc-800 hover:border-amber-500/30'
                  } ${justSealed === week.week ? 'animate-inscribe' : ''}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      {!isEditing && (
                        <div className={`p-2 rounded-lg transition-colors ${isCompleted ? 'bg-success text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                          {isCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                        </div>
                      )}
                      <h4 className="font-serif text-lg font-bold">Semana {week.week}</h4>
                    </div>
                    {isEditing && (
                      <button onClick={(e) => { e.stopPropagation(); onDeleteWeek(week.week); }} className="text-zinc-600 hover:text-danger-deep p-1.5"><Trash2 size={16}/></button>
                    )}
                    {!isEditing && isCompleted && (
                      <span className={`text-xs font-bold text-success bg-success/10 px-3 py-1 rounded-full tracking-widest border border-success/30 font-serif ${justSealed === week.week ? 'animate-seal' : ''}`}>✦ SELLADO</span>
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
                    <textarea value={week.tip} onChange={(e) => onUpdateWeek(week.week, 'tip', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-zinc-400 outline-none resize-none font-serif" placeholder="Consejo del Archivero..." />
                  ) : (
                    <p className="text-sm text-zinc-300 italic border-l-2 border-amber-500/40 pl-3 py-1.5 font-serif leading-relaxed">"{week.tip}"</p>
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

function ReadingStats({ entries, books }) {
  const stats = useMemo(() => {
    if (!entries.length) return null;

    const totalEntries = entries.length;
    const totalCharacters = new Set(entries.flatMap(e => (e.characters || []).map(c => c.name))).size;
    const totalPlaces = new Set(entries.flatMap(e => (e.places || []).map(p => p.name))).size;
    const totalQuotes = entries.reduce((sum, e) => sum + (e.quotes?.length || 0), 0);

    const perBook = {};
    entries.forEach(e => { perBook[e.book] = (perBook[e.book] || 0) + 1; });

    // Mood distribution
    const moodCounts = {};
    entries.forEach(e => { if (e.mood) moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1; });
    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

    // Activity last 7 days
    const now = new Date();
    const activity = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = entries.filter(e => e.date === dateStr).length;
      const dayName = d.toLocaleDateString('es', { weekday: 'short' }).slice(0, 2);
      activity.push({ day: dayName, count, date: dateStr });
    }
    const maxActivity = Math.max(...activity.map(a => a.count), 1);

    const fourWeeksAgo = new Date(now);
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const recentEntries = entries.filter(e => new Date(e.date) >= fourWeeksAgo);
    const weeklyPace = Math.round((recentEntries.length / 4) * 10) / 10;

    const dates = [...new Set(entries.map(e => e.date))].sort().reverse();
    let streak = 0;
    const today = now.toISOString().split('T')[0];
    let checkDate = new Date(today);
    for (const d of dates) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (d === dateStr) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (d < dateStr) {
        break;
      }
    }

    return { totalEntries, totalCharacters, totalPlaces, totalQuotes, perBook, weeklyPace, streak, moodCounts, topMood, activity, maxActivity };
  }, [entries]);

  if (!stats) return null;

  return (
    <div className="flex flex-col gap-4 py-1">
      {/* Racha — número editorial, no widget */}
      <div className="flex items-center gap-5">
        <span className="text-6xl font-serif font-bold text-amber-500 leading-none tabular-nums">{stats.streak}</span>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-serif font-bold text-heading">
            {stats.streak === 1 ? 'día de racha' : 'días de racha'}
          </span>
          <span className="text-xs text-zinc-500">
            {stats.weeklyPace} crónicas · semana
          </span>
        </div>
      </div>

      {/* Activity sparkline — last 7 days */}
      <div className="manuscript-divider" />
      <div className="flex items-end gap-1.5">
        {stats.activity.map((a) => (
          <div key={a.date} className="flex flex-col items-center gap-1 flex-1">
            <div className="w-full flex justify-center">
              <div
                className={`w-full max-w-[20px] rounded-sm transition-all ${a.count > 0 ? '' : 'bg-zinc-800'}`}
                style={{ height: `${Math.max(4, (a.count / stats.maxActivity) * 32)}px`, ...(a.count > 0 ? { backgroundColor: 'var(--text-accent)', opacity: 0.7 } : {}) }}
                title={`${a.date}: ${a.count} crónicas`}
              />
            </div>
            <span className="text-[9px] text-zinc-600 uppercase font-bold">{a.day}</span>
          </div>
        ))}
      </div>

      {/* Conteos secundarios — texto fluido, sin cajas */}
      <div className="flex items-center gap-5 flex-wrap border-t border-zinc-800/60 pt-3 text-xs text-zinc-500">
        <span><span className="text-zinc-200 font-serif font-bold text-sm mr-1">{stats.totalEntries}</span>crónicas</span>
        <span><span className="text-zinc-200 font-serif font-bold text-sm mr-1">{stats.totalCharacters}</span>personajes</span>
        <span><span className="text-zinc-200 font-serif font-bold text-sm mr-1">{stats.totalPlaces}</span>lugares</span>
        <span><span className="text-zinc-200 font-serif font-bold text-sm mr-1">{stats.totalQuotes}</span>citas</span>
      </div>

      {/* Mood distribution */}
      {stats.topMood && Object.keys(stats.moodCounts).length > 1 && (
        <div className="flex flex-col gap-2 border-t border-zinc-800/60 pt-3">
          <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Estado dominante</span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.moodCounts).sort((a, b) => b[1] - a[1]).map(([mood, count]) => (
              <span key={mood} className={`text-xs px-2.5 py-1 rounded-full border font-bold ${mood === stats.topMood[0] ? 'border-amber-500 text-amber-500 bg-zinc-900' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>
                {mood} <span className="text-zinc-600 ml-0.5">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Por libro */}
      {Object.keys(stats.perBook).length > 1 && (
        <div className="flex flex-col gap-1.5 border-t border-zinc-800/60 pt-3">
          {Object.entries(stats.perBook).sort((a, b) => b[1] - a[1]).map(([book, count]) => {
            const bookObj = books.find(b => b.title === book);
            const pct = Math.round((count / stats.totalEntries) * 100);
            return (
              <div key={book} className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 font-serif truncate flex-1">{bookObj?.emoji} {book}</span>
                <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: 'var(--text-accent)', opacity: 0.6 }} />
                </div>
                <span className="text-xs text-zinc-300 font-bold w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AssetBox({ label, color, title, section, emoji, isEditing, books, onUpdateTitle, onUpdateSection }) {
  return (
    <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: color || '#1F2937' }} />
      <span className="text-xs uppercase tracking-[0.2em] text-zinc-500 block mb-1 ml-1">{label}</span>
      {isEditing ? (
        <div className="flex flex-col gap-1 ml-1">
          <select value={title} onChange={(e) => onUpdateTitle(e.target.value)} className="bg-transparent border-0 text-zinc-300 text-xs font-serif outline-none p-0 cursor-pointer">
            <option value="">(Ninguno)</option>
            {books.map(b => <option key={b.id || b.title} value={b.title}>{b.emoji} {b.title}</option>)}
          </select>
          <input value={section} onChange={(e) => onUpdateSection(e.target.value)} className="bg-transparent border-b border-zinc-800 text-xs text-zinc-500 p-0 outline-none" placeholder="Meta..." />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 ml-1">
            <span className="text-base">{emoji}</span>
            <span className="text-sm font-serif text-heading/90 leading-tight">{title}</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1 ml-1 italic">{section}</p>
        </>
      )}
    </div>
  );
}
