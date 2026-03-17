import { useState, useRef, useEffect, useCallback } from 'react';

const ERROR_MESSAGES = {
  'not-allowed': 'Permiso de micrófono denegado. Habilítalo en la configuración del navegador.',
  'no-speech': 'No se detectó voz. Intenta de nuevo.',
  'audio-capture': 'No se encontró micrófono. Verifica tu dispositivo.',
  'network': 'Error de red en el reconocimiento de voz.',
};

export function useSpeechRecognition() {
  const recognitionRef = useRef(null);
  const [recordingField, setRecordingField] = useState(null);
  const [error, setError] = useState(null);
  const isSupported = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const callbackRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) transcript += event.results[i][0].transcript + ' ';
      }
      if (transcript.trim() && callbackRef.current) {
        callbackRef.current(transcript.trim());
      }
    };

    recognition.onerror = (event) => {
      const msg = ERROR_MESSAGES[event.error] || `Error de voz: ${event.error}`;
      setError(msg);
      setRecordingField(null);
    };

    recognition.onend = () => setRecordingField(null);
    recognitionRef.current = recognition;

    return () => recognition.abort();
  }, []);

  const toggle = useCallback((field, onTranscript) => {
    setError(null);
    const rec = recognitionRef.current;
    if (!rec) {
      setError('Tu navegador no soporta reconocimiento de voz.');
      return;
    }

    if (recordingField === field) {
      rec.stop();
    } else {
      if (recordingField) rec.stop();
      callbackRef.current = onTranscript;
      setRecordingField(field);
      try {
        rec.start();
      } catch {
        setError('No se pudo iniciar el reconocimiento de voz.');
        setRecordingField(null);
      }
    }
  }, [recordingField]);

  return { recordingField, toggle, error, isSupported };
}
