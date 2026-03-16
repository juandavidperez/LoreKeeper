import React from 'react';
import { Calendar, BookOpen, Library } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars

export function MainLayout({ activeTab, setActiveTab, children }) {
  const tabs = [
    { id: 'plan', label: 'Plan', icon: Calendar },
    { id: 'log', label: 'Bitácora', icon: BookOpen },
    { id: 'encyclopedia', label: 'Archivo', icon: Library },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 pb-32 text-zinc-300 font-sans">
      <header className="fixed top-0 left-0 right-0 h-16 backdrop-blur-md bg-zinc-950/80 flex items-center justify-center z-[60] px-6 border-b border-zinc-900">
        <h1 className="text-xl font-serif text-amber-500 tracking-[0.2em] font-bold">LOREKEEPER</h1>
      </header>

      <main className="pt-24 px-4 max-w-2xl mx-auto min-h-[calc(100vh-80px)]">
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

      <nav className="fixed bottom-0 left-0 right-0 h-20 backdrop-blur-lg bg-zinc-950/90 flex justify-around items-center z-[100] px-4 border-t border-zinc-900 safe-area-bottom">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center gap-1.5 p-2 min-w-[70px] transition-all duration-300 ease-in-out ${
                isActive ? 'text-amber-500 scale-110' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon size={isActive ? 24 : 20} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[9px] font-serif font-bold uppercase tracking-widest transition-opacity ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTabGlow"
                  className="absolute -bottom-1 w-12 h-1 bg-amber-500 rounded-full blur-[2px] opacity-40"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
