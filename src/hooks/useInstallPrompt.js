import { useState, useEffect } from 'react';

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('lore-install-dismissed') === '1'
  );

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      navigator.standalone === true;
    setIsInstalled(standalone);

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios && !standalone);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const installedHandler = () => setIsInstalled(true);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
    dismiss();
  };

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem('lore-install-dismissed', '1');
  };

  const showBanner = !isInstalled && !dismissed && (deferredPrompt !== null || isIOS);

  return { showBanner, isIOS, install, dismiss };
}
