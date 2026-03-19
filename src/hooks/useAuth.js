import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import React from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => !!supabase);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

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

  const signIn = useCallback(async (email) => {
    if (!supabase) return { error: { message: 'Supabase no configurado' } };
    // In Capacitor, redirect back to the native app scheme
    const isNative = window.Capacitor?.isNativePlatform?.();
    const redirectTo = isNative
      ? 'com.lorekeeper.app://login'
      : window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setIsFirstLogin(false);
  }, []);

  const clearFirstLogin = useCallback(() => setIsFirstLogin(false), []);

  const value = {
    user,
    loading,
    isFirstLogin,
    clearFirstLogin,
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
