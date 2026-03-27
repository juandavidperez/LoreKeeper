import { Cloud, CloudOff, Loader2, AlertCircle, Check } from 'lucide-react';
import { useSync } from '../hooks/useSync';
import { useAuth } from '../hooks/useAuth';

const STATUS_CONFIG = {
  idle: { icon: Cloud, color: 'text-stone-400', label: 'Listo' },
  syncing: { icon: Loader2, color: 'text-accent', label: 'Sincronizando...', spin: true },
  synced: { icon: Check, color: 'text-emerald-500', label: 'Sincronizado' },
  error: { icon: AlertCircle, color: 'text-red-400', label: 'Error de sync' },
  offline: { icon: CloudOff, color: 'text-stone-400', label: 'Sin conexion' },
};

export function SyncIndicator() {
  const { user, isConfigured } = useAuth();
  const { status, pendingCount, sync } = useSync();

  if (!isConfigured || !user) return null;

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle;
  const Icon = config.icon;

  return (
    <button
      onClick={sync}
      aria-label={config.label}
      title={`${config.label}${pendingCount > 0 ? ` (${pendingCount} pendientes)` : ''}`}
      className={`relative p-1.5 transition-colors hover:bg-accent/10 rounded-full ${config.color}`}
    >
      <Icon size={14} className={config.spin ? 'animate-spin' : ''} />
      {pendingCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-accent text-white text-[9px] font-bold rounded-full flex items-center justify-center">
          {pendingCount > 9 ? '9+' : pendingCount}
        </span>
      )}
    </button>
  );
}
