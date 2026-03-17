import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleClearAndReset = () => {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('lore-') || key === 'reading-entries' || key === 'completed-weeks' || key === 'oracle-replies') {
          keys.push(key);
        }
      }
      keys.forEach(k => localStorage.removeItem(k));
    } catch { /* ignore */ }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center shadow-2xl">
            <div className="text-4xl mb-4">📜</div>
            <h1 className="font-serif text-2xl text-amber-500 mb-2">El Archivo se ha corrompido</h1>
            <p className="text-zinc-400 text-sm font-serif italic mb-6 leading-relaxed">
              Un error inesperado ha dañado la sesión. Puedes intentar recargar o, si el problema persiste, reiniciar los datos.
            </p>
            {this.state.error && (
              <pre className="text-[10px] text-red-400/70 bg-zinc-950 p-3 rounded-lg mb-6 overflow-auto max-h-24 text-left border border-zinc-800">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-zinc-950 rounded-xl font-bold text-sm transition-colors"
              >
                Intentar de nuevo
              </button>
              <button
                onClick={this.handleClearAndReset}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm transition-colors"
              >
                Reiniciar datos y recargar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
