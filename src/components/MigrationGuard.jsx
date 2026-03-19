import { useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { migrateLocalToSupabase } from '../utils/migration';

/**
 * Invisible component that triggers one-time migration
 * when user signs in for the first time.
 */
export function MigrationGuard() {
  const { user, isFirstLogin, clearFirstLogin } = useAuth();
  const notify = useNotification();
  const migrating = useRef(false);

  useEffect(() => {
    if (!isFirstLogin || !user || migrating.current) return;

    migrating.current = true;
    migrateLocalToSupabase(user.id).then(({ success, error }) => {
      if (success) {
        notify('Datos migrados al Eter. Tu archivo ahora vive en la nube.', 'success');
      } else {
        notify(`Error al migrar: ${error}`, 'error');
      }
      clearFirstLogin();
      migrating.current = false;
    });
  }, [isFirstLogin, user, clearFirstLogin, notify]);

  return null;
}
