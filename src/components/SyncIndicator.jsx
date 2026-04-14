import { Cloud, CloudOff, Loader2, AlertCircle, Check } from 'lucide-react';
import { useSync } from '../hooks/useSync';
import { useAuth } from '../hooks/useAuth';

const STATUS_CONFIG = {
  idle: { icon: Cloud, color: 'text-stone-400', label: 'Guardar en la nube' },
  saving: { icon: Loader2, color: 'text-accent', label: 'Guardando...', spin: true },
  saved: { icon: Check, color: 'text-emerald-500', label: 'Guardado en la nube' },
  error: { icon: AlertCircle, color: 'text-red-400', label: 'Error al guardar' },
  offline: { icon: CloudOff, color: 'text-stone-400', label: 'Sin conexión' },
};

export function SyncIndicator() {
  const { user, isConfigured } = useAuth();
  const { status, backup } = useSync();

  if (!isConfigured || !user) return null;

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle;
  const Icon = config.icon;

  return (
    <button
      onClick={backup}
      aria-label={config.label}
      title={config.label}
      className={`p-1.5 transition-colors hover:bg-accent/10 rounded-full ${config.color}`}
    >
      <Icon size={14} className={config.spin ? 'animate-spin' : ''} />
    </button>
  );
}
