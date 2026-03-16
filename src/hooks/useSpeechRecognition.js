import { useState, useRef, useEffect, useCallback } from 'react';

export function useSpeechRecognition() {
  const recognitionRef = useRef(null);
  const [recordingField, setRecordingField] = useState(null);
  const callbackRef = useRef(null);

  // Create the SpeechRecognition instance once on mount
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

    recognition.onend = () => setRecordingField(null);
    recognitionRef.current = recognition;

    return () => recognition.abort();
  }, []);

  const toggle = useCallback((field, onTranscript) => {
    const rec = recognitionRef.current;
    if (!rec) return;

    if (recordingField === field) {
      rec.stop();
    } else {
      if (recordingField) rec.stop();
      callbackRef.current = onTranscript;
      setRecordingField(field);
      rec.start();
    }
  }, [recordingField]);

  return { recordingField, toggle };
}
