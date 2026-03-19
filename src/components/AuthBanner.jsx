import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { Zap, X, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function AuthBanner() {
  const { user, signIn, signOut, isConfigured, loading } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  // Don't render if Supabase is not configured or still loading
  if (!isConfigured || loading) return null;

  // Signed in: show user info with sign out
  if (user) {
    return (
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Zap size={14} className="text-amber-500" />
        <span className="truncate max-w-[160px]">{user.email}</span>
        <button
          onClick={signOut}
          aria-label="Desconectar del Eter"
          className="p-1 hover:text-zinc-300 transition-colors"
        >
          <LogOut size={14} />
        </button>
      </div>
    );
  }

  // Magic link sent
  if (sent) {
    return (
      <div className="flex items-center gap-2 text-xs text-amber-500/80 font-serif">
        <Zap size={14} />
        <span>Enlace enviado. Revisa tu correo.</span>
        <button onClick={() => { setSent(false); setExpanded(false); }} className="p-1 hover:text-zinc-300">
          <X size={14} />
        </button>
      </div>
    );
  }

  // Collapsed: subtle banner
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-amber-500/80 transition-colors font-serif"
      >
        <Zap size={14} />
        <span>Conectar al Eter</span>
      </button>
    );
  }

  // Expanded: email input
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError(null);
    const { error: err } = await signIn(email.trim());
    setSending(false);
    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
  };

  return (
    <AnimatePresence>
      <motion.form
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        onSubmit={handleSubmit}
        className="flex items-center gap-2"
      >
        <Zap size={14} className="text-amber-500 shrink-0" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          aria-label="Correo para conectar al Eter"
          className="text-xs bg-transparent border-b border-zinc-700 focus:border-amber-500 outline-none px-1 py-0.5 w-40 text-zinc-300 placeholder:text-zinc-600"
          autoFocus
        />
        <button
          type="submit"
          disabled={sending}
          className="text-xs text-amber-500 hover:text-amber-400 disabled:opacity-50 font-serif font-bold"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : 'Invocar'}
        </button>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="p-1 text-zinc-600 hover:text-zinc-400"
          aria-label="Cerrar"
        >
          <X size={14} />
        </button>
        {error && (
          <span className="text-xs text-red-400">{error}</span>
        )}
      </motion.form>
    </AnimatePresence>
  );
}
