import { useMemo, useState, useCallback, useRef } from 'react';
import { Calendar, BookOpen, Library, Sparkles, Search, Bell, BellOff, X, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useTheme } from '../context/ThemeContext';
import { AuthBanner } from './AuthBanner';
import { SyncIndicator } from './SyncIndicator';
import { GlobalSearch } from './GlobalSearch';

const TAB_IDS = ['plan', 'log', 'encyclopedia', 'oracle'];

const slideVariants = {
  enter: (d) => ({ opacity: 0, x: d >= 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0 },
  exit: (d) => ({ opacity: 0, x: d >= 0 ? -60 : 60 }),
};

export function MainLayout({ activeTab, setActiveTab, children }) {
  const { theme, toggleTheme } = useTheme();
  const [reminder, setReminder] = useLocalStorage('lore-reminder', '0');
  const [reminderTime, setReminderTime] = useLocalStorage('lore-reminder-time', '21:00');
  const [showSearch, setShowSearch] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);

  const tabs = [
    { id: 'plan', label: 'Plan', icon: Calendar },
    { id: 'log', label: 'Crónicas', icon: BookOpen },
    { id: 'encyclopedia', label: 'Archivo', icon: Library },
    { id: 'oracle', label: 'Oráculo', icon: Sparkles },
  ];

  // --- Swipe navigation ---
  const [direction, setDirection] = useState(0);
  const touchRef = useRef(null);

  const navigateWithDirection = useCallback((tabId) => {
    const cur = TAB_IDS.indexOf(activeTab);
    const next = TAB_IDS.indexOf(tabId);
    if (next === -1 || next === cur) return;
    setDirection(next > cur ? 1 : -1);
    setActiveTab(tabId);
    document.getElementById('main-content')?.focus();
  }, [activeTab, setActiveTab]);

  const handleTouchStart = useCallback((e) => {
    // Check if the touch target is inside a horizontally scrollable container
    let target = e.target;
    let isScrollable = false;
    while (target && target !== e.currentTarget) {
      if (target.scrollWidth > target.clientWidth) {
        const style = window.getComputedStyle(target);
        if (style.overflowX === 'auto' || style.overflowX === 'scroll') {
          isScrollable = true;
          break;
        }
      }
      target = target.parentElement;
    }

    touchRef.current = { 
      x: e.touches[0].clientX, 
      y: e.touches[0].clientY,
      isScrollable 
    };
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!touchRef.current || touchRef.current.isScrollable) {
      touchRef.current = null;
      return;
    }
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = e.changedTouches[0].clientY - touchRef.current.y;
    touchRef.current = null;
    if (Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 60) {
      const idx = TAB_IDS.indexOf(activeTab) + (dx < 0 ? 1 : -1);
      if (idx >= 0 && idx < TAB_IDS.length) navigateWithDirection(TAB_IDS[idx]);
    }
  }, [activeTab, navigateWithDirection]);

  // --- Reminder ---
  const toggleReminder = () => {
    if (reminder === '1') {
      setReminder('0');
      setShowReminderPicker(false);
      return;
    }
    setShowReminderPicker(prev => !prev);
  };

  const confirmReminder = async () => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') return;
      }
      if (Notification.permission === 'denied') return;
    }
    setReminder('1');
    setShowReminderPicker(false);
  };

  const openSearch = useCallback(() => setShowSearch(true), []);
  const closeSearch = useCallback(() => setShowSearch(false), []);

  const shortcuts = useMemo(() => [
    { key: 'k', mod: true, action: () => setShowSearch(prev => !prev) },
    { key: '1', mod: true, action: () => navigateWithDirection('plan') },
    { key: '2', mod: true, action: () => navigateWithDirection('log') },
    { key: '3', mod: true, action: () => navigateWithDirection('encyclopedia') },
    { key: '4', mod: true, action: () => navigateWithDirection('oracle') },
  ], [navigateWithDirection]);
  useKeyboardShortcuts(shortcuts);

  return (
    <div className="min-h-dvh pb-32 bg-app-bg text-primary-text font-sans overflow-x-hidden relative">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:bg-accent focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-bold">
        Saltar al contenido
      </a>
      <header
        className="fixed top-0 left-0 right-0 flex items-center justify-between z-[60] px-6 border-b overflow-hidden bg-header-bg border-primary/30"
        style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(4rem + env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-1">
          <AuthBanner />
          <SyncIndicator />
        </div>
        <h1 className="text-xl font-serif text-accent tracking-[0.2em] font-bold">LOREKEEPER</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
            className="p-2 text-stone-500 hover:text-accent rounded-full transition-colors"
          >
            {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>
          <button
            onClick={openSearch}
            aria-label="Buscar en el grimorio"
            className="p-2 text-stone-500 hover:text-accent rounded-full transition-colors"
          >
            <Search size={18} aria-hidden="true" />
          </button>
          <div className="relative">
            <button
              onClick={toggleReminder}
              aria-label={reminder === '1' ? 'Desactivar recordatorio' : 'Activar recordatorio de lectura'}
              title={reminder === '1' ? `Recordatorio a las ${reminderTime}` : 'Recordatorio de lectura'}
              className={`p-2 rounded-full transition-colors ${reminder === '1' ? 'text-accent' : 'text-stone-500 hover:text-accent'}`}
            >
              {reminder === '1' ? <Bell size={18} aria-hidden="true" /> : <BellOff size={18} aria-hidden="true" />}
            </button>
            {showReminderPicker && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-[#c9b08a] rounded-xl p-4 shadow-xl z-[70] w-56">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs font-serif text-stone-500 italic">A que hora lees, archivero?</p>
                  <button onClick={() => setShowReminderPicker(false)} className="p-1 text-stone-400 hover:text-accent"><X size={12} /></button>
                </div>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full bg-[#f7edd8] border border-[#c9b08a] rounded-lg p-2.5 text-sm text-primary-text outline-none focus:border-accent mb-3 font-serif"
                />
                <button
                  onClick={confirmReminder}
                  className="w-full py-2 bg-accent text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-accent-secondary transition-colors"
                >
                  Invocar recordatorio
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="safe-x max-w-7xl mx-auto min-h-[calc(100dvh-80px)] outline-none"
        style={{ paddingTop: 'calc(6rem + env(safe-area-inset-top))' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeTab}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav
        role="tablist"
        aria-label="Navegación principal"
        className="fixed bottom-0 left-0 right-0 backdrop-blur-lg flex justify-around items-center z-[100] px-4 border-t bg-header-bg/95 border-primary/30 max-w-5xl mx-auto rounded-t-2xl sm:mb-4 sm:border sm:shadow-lg lg:max-w-2xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)', height: 'calc(4rem + env(safe-area-inset-bottom))' }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              onClick={() => navigateWithDirection(tab.id)}
              className={`relative flex flex-col items-center gap-1.5 p-2 min-w-[70px] transition-all duration-300 ease-in-out active:scale-95 ${
                isActive ? 'text-accent scale-110' : 'text-stone-500 hover:text-accent'
              }`}
            >
              <Icon size={isActive ? 24 : 20} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
              <span className={`text-[10px] sm:text-xs font-serif font-bold uppercase tracking-widest transition-opacity ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute -bottom-0 w-8 h-0.5 bg-accent rounded-full"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Global Search Modal */}
      {showSearch && (
        <GlobalSearch onNavigate={setActiveTab} onClose={closeSearch} />
      )}
    </div>
  );
}
