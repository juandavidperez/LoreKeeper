import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import React from 'react';
import { supabase } from '../lib/supabase';
import { useNotification } from './useNotification';
import { migrateLocalToSupabase } from '../utils/migration';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => !!supabase);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const notify = useNotification();
  const migrating = useRef(false);

  const checkFirstLogin = useCallback(async (userId) => {
    if (!supabase) return;
    // If user has no books in Supabase, it's a first login → trigger migration
    const { data } = await supabase
      .from('books')
      .select('id')
      .eq('user_id', userId)
      .limit(1);
    if (!data || data.length === 0) {
      setIsFirstLogin(true);
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN') {
          checkFirstLogin(session.user.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [checkFirstLogin]);

  // One-time migration on first sign-in (replaces MigrationGuard ghost component)
  useEffect(() => {
    if (!isFirstLogin || !user || migrating.current) return;

    migrating.current = true;
    migrateLocalToSupabase(user.id).then(({ success, error }) => {
      if (success) {
        notify('Datos migrados al Éter. Tu archivo ahora vive en la nube.', 'success');
      } else {
        notify(`Error al migrar: ${error}`, 'error');
      }
      setIsFirstLogin(false);
      migrating.current = false;
    });
  }, [isFirstLogin, user, notify]);

  const signIn = useCallback(async (email) => {
    if (!supabase) return { error: { message: 'Supabase no configurado' } };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setIsFirstLogin(false);
  }, []);

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isConfigured: !!supabase,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
