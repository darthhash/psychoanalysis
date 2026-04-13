import { useState, useRef, useEffect } from "react";
import { Mic, Square } from "lucide-react";

export default function VoiceRecorder({ onTranscript, disabled }) {
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const start = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ru-RU";
    recognition.continuous = true;
    recognition.interimResults = false;

    transcriptRef.current = "";

    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          text += event.results[i][0].transcript + " ";
        }
      }
      transcriptRef.current = text.trim();
    };

    recognition.onerror = () => {
      setRecording(false);
    };

    recognition.onend = () => {
      setRecording(false);
      const text = transcriptRef.current;
      if (text) onTranscript(text);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setRecording(true);
  };

  const stop = () => {
    recognitionRef.current?.stop();
  };

  return (
    <button
      onClick={recording ? stop : start}
      disabled={disabled}
      className={`p-4 rounded-full transition-all ${
        recording
          ? "bg-red-500/20 text-red-400 animate-pulse"
          : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--fg)] border border-[var(--border)]"
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {recording ? <Square size={24} /> : <Mic size={24} />}
    </button>
  );
}
