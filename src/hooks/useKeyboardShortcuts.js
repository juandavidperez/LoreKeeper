import { useEffect } from 'react';

export function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const handler = (e) => {
      const isMod = e.metaKey || e.ctrlKey;
      for (const s of shortcuts) {
        if (s.mod && !isMod) continue;
        if (!s.mod && isMod) continue;
        if (e.key.toLowerCase() !== s.key.toLowerCase()) continue;
        // Don't fire when typing in inputs
        const tag = document.activeElement?.tagName;
        if (!s.allowInInput && (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT')) continue;
        e.preventDefault();
        s.action();
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}
