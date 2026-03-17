import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const NotificationContext = createContext();

const STYLES = {
  error: 'bg-red-950 border-red-500/40 text-red-200',
  success: 'bg-emerald-950 border-emerald-500/40 text-emerald-200',
  info: 'bg-zinc-900 border-amber-500/40 text-amber-200',
};

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return React.createElement('div',
    { className: 'fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-fade-in pointer-events-auto' },
    React.createElement('div',
      { className: `px-5 py-3 rounded-xl border text-sm font-serif shadow-2xl max-w-sm ${STYLES[type] || STYLES.info}` },
      message
    )
  );
}

export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState(null);

  const notify = useCallback((message, type = 'info') => {
    setNotification({ message, type, id: Date.now() });
  }, []);

  const dismiss = useCallback(() => setNotification(null), []);

  // Listen for storage quota errors from useLocalStorage
  useEffect(() => {
    const handler = (e) => notify(e.detail, 'error');
    window.addEventListener('lore-storage-error', handler);
    return () => window.removeEventListener('lore-storage-error', handler);
  }, [notify]);

  return React.createElement(
    NotificationContext.Provider,
    { value: notify },
    children,
    notification ? React.createElement(Toast, { ...notification, onClose: dismiss }) : null
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}
