import { useState } from 'react';
import { Cloud, CloudOff, Loader2, AlertCircle, Check, DownloadCloud } from 'lucide-react';
import { useSync } from '../hooks/useSync';
import { useAuth } from '../hooks/useAuth';
import { ConfirmModal } from './ConfirmModal';

const STATUS_CONFIG = {
  idle: { icon: Cloud, color: 'text-stone-400', label: 'Guardar en la nube' },
  saving: { icon: Loader2, color: 'text-accent', label: 'Guardando...', spin: true },
  saved: { icon: Check, color: 'text-emerald-500', label: 'Guardado en la nube' },
  error: { icon: AlertCircle, color: 'text-red-400', label: 'Error al guardar' },
  offline: { icon: CloudOff, color: 'text-stone-400', label: 'Sin conexión' },
};

export function SyncIndicator() {
  const { user, isConfigured } = useAuth();
  const { status, backup, restore } = useSync();
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  if (!isConfigured || !user) return null;

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle;
  const Icon = config.icon;
  const busy = status === 'saving';

  return (
    <>
      <button
        onClick={backup}
        aria-label={config.label}
        title={config.label}
        className={`p-1.5 transition-colors hover:bg-accent/10 rounded-full ${config.color}`}
      >
        <Icon size={14} className={config.spin ? 'animate-spin' : ''} />
      </button>
      <button
        onClick={() => setShowRestoreConfirm(true)}
        disabled={busy}
        aria-label="Restaurar desde la nube"
        title="Restaurar desde la nube"
        className="p-1.5 transition-colors hover:bg-accent/10 rounded-full text-stone-400 disabled:opacity-40"
      >
        <DownloadCloud size={14} />
      </button>
      {showRestoreConfirm && (
        <ConfirmModal
          title="Restaurar desde la nube"
          message="Esto reemplazará todos tus datos locales con la última copia guardada en la nube. Esta acción no se puede deshacer."
          confirmLabel="Restaurar"
          onConfirm={() => { setShowRestoreConfirm(false); restore(); }}
          onCancel={() => setShowRestoreConfirm(false)}
        />
      )}
    </>
  );
}
