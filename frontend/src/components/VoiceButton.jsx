import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

export default function VoiceButton({ onTranscript, disabled }) {
  const [listening, setListening] = useState(false);
  const recogRef = useRef(null);
  const { lang } = useApp();

  if (!SpeechRecognition) return null;

  const handleClick = () => {
    if (listening) {
      recogRef.current?.stop();
      setListening(false);
      return;
    }

    const recog = new SpeechRecognition();
    // Support both English and Nepali speech recognition
    recog.lang = lang === 'np' ? 'ne-NP' : 'en-US';
    recog.interimResults = false;
    recog.maxAlternatives = 1;

    recog.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      onTranscript(transcript);
    };
    recog.onend = () => setListening(false);
    recog.onerror = () => setListening(false);

    recogRef.current = recog;
    recog.start();
    setListening(true);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={listening ? 'Stop recording' : 'Start voice input'}
      className={`p-2.5 rounded-full transition-colors disabled:opacity-40 ${
        listening
          ? 'bg-red-100 text-red-600 animate-pulse'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2zm-5 9v-2" />
        <path d="M12 19v2M8 21h8" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    </button>
  );
}
