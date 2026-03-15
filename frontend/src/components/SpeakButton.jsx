import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import ttsService from '../services/textToSpeechService';

export default function SpeakButton({ text, disabled = false }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const { lang } = useApp();

  // Update playing state when TTS state changes
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPlaying(ttsService.isCurrentlySpeaking());
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timeout);
    }
  }, [error]);

  const handleSpeak = async () => {
    setError(null);

    if (isPlaying) {
      ttsService.stop();
      setIsPlaying(false);
      return;
    }

    try {
      setIsPreparing(true);
      
      await ttsService.speak(text, lang, {
        onStart: () => {
          setIsPreparing(false);
          setIsPlaying(true);
        },
        onEnd: () => {
          setIsPlaying(false);
          setIsPreparing(false);
        },
        onError: (err) => {
          setError(err.message);
          setIsPlaying(false);
          setIsPreparing(false);
        },
      });
    } catch (err) {
      setError(err.message);
      setIsPlaying(false);
      setIsPreparing(false);
    }
  };

  if (!text || text.trim() === '') {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSpeak}
        disabled={disabled || isPreparing}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full transition-colors disabled:opacity-40 ${
          isPlaying
            ? 'bg-blue-100 text-blue-600 animate-pulse'
            : isPreparing
            ? 'bg-yellow-100 text-yellow-600 animate-pulse'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title={
          isPreparing
            ? 'Preparing...'
            : isPlaying
            ? 'Stop playback'
            : `Read aloud (${lang === 'np' ? 'Nepali' : 'English'})`
        }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
        </svg>
        <span>{isPreparing ? 'Preparing...' : isPlaying ? 'Stop' : 'Read'}</span>
      </button>
      {error && (
        <div className="text-xs text-red-600 p-2 bg-red-50 rounded border border-red-200 max-w-xs">
          {error}
        </div>
      )}
    </div>
  );
}
