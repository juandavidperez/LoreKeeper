import { useMemo, useState, useCallback } from 'react';
import { Calendar, BookOpen, Library, Sun, Moon, Search, Bell, BellOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { AuthBanner } from './AuthBanner';
import { SyncIndicator } from './SyncIndicator';
import { GlobalSearch } from './GlobalSearch';


export function MainLayout({ activeTab, setActiveTab, children }) {
  const [theme, setTheme] = useLocalStorage('lore-theme', 'light');
  const [reminder, setReminder] = useLocalStorage('lore-reminder', '0');
  const [showSearch, setShowSearch] = useState(false);

  const tabs = [
    { id: 'plan', label: 'Plan', icon: Calendar },
    { id: 'log', label: 'Bitácora', icon: BookOpen },
    { id: 'encyclopedia', label: 'Archivo', icon: Library },
  ];

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  const toggleReminder = async () => {
    if (reminder === '1') {
      setReminder('0');
      return;
    }
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return;
    }
    setReminder('1');
  };
  const openSearch = useCallback(() => setShowSearch(true), []);
  const closeSearch = useCallback(() => setShowSearch(false), []);

  const shortcuts = useMemo(() => [
    { key: 'k', mod: true, action: () => setShowSearch(prev => !prev) },
    { key: '1', mod: true, action: () => setActiveTab('plan') },
    { key: '2', mod: true, action: () => setActiveTab('log') },
    { key: '3', mod: true, action: () => setActiveTab('encyclopedia') },
  ], [setActiveTab]);
  useKeyboardShortcuts(shortcuts);

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-500 ${theme === 'light' ? 'light bg-[#f4ead5]' : 'bg-zinc-950'} text-zinc-300 font-sans`}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:bg-amber-500 focus:text-zinc-950 focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-bold">
        Saltar al contenido
      </a>
      <header className={`fixed top-0 left-0 right-0 h-16 backdrop-blur-md flex items-center justify-between z-[60] px-6 border-b transition-colors duration-500 ${theme === 'light' ? 'bg-[#f4ead5]/90 border-[#d7ccc8]' : 'bg-zinc-950/80 border-zinc-900'}`}>
        <div className="flex items-center gap-1">
          <AuthBanner />
          <SyncIndicator />
        </div>
        <h1 className="text-xl font-serif text-amber-500 tracking-[0.2em] font-bold">LOREKEEPER</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={openSearch}
            aria-label="Busqueda global"
            className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-500/10 rounded-full transition-colors"
          >
            <Search size={18} />
          </button>
          <button
            onClick={toggleReminder}
            aria-label={reminder === '1' ? 'Desactivar recordatorio' : 'Activar recordatorio de lectura'}
            title={reminder === '1' ? 'Recordatorio activo' : 'Recordatorio de lectura'}
            className={`p-2 hover:bg-zinc-500/10 rounded-full transition-colors ${reminder === '1' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {reminder === '1' ? <Bell size={18} /> : <BellOff size={18} />}
          </button>
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Cambiar a modo pergamino' : 'Cambiar a modo oscuro'}
            className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-500/10 rounded-full transition-colors"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="pt-24 px-4 max-w-2xl mx-auto min-h-[calc(100vh-80px)] outline-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav role="tablist" aria-label="Navegacion principal" className={`fixed bottom-0 left-0 right-0 h-16 backdrop-blur-lg flex justify-around items-center z-[100] px-4 border-t safe-area-bottom transition-colors duration-500 ${theme === 'light' ? 'bg-[#f4ead5]/95 border-[#d7ccc8]' : 'bg-zinc-950/90 border-zinc-900'}`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              onClick={() => {
                setActiveTab(tab.id);
                document.getElementById('main-content')?.focus();
              }}
              className={`relative flex flex-col items-center gap-1.5 p-2 min-w-[70px] transition-all duration-300 ease-in-out ${
                isActive ? 'text-amber-500 scale-110' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon size={isActive ? 24 : 20} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-xs font-serif font-bold uppercase tracking-widest transition-opacity ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute -bottom-0 w-8 h-0.5 bg-amber-500 rounded-full"
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
