import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import MessageBubble from './MessageBubble';
import VoiceButton from './VoiceButton';
import { submitTriage, getHealthPosts } from '../services/triageService';

const RISK_TO_FACILITY_TYPE = {
  HIGH:   'hospital',
  MEDIUM: 'pharmacy',
  LOW:    'clinic',
};

export default function ChatWindow() {
  const {
    t, location, messages, addMessage,
    loading, setLoading,
    setRecommendedFacilityType, setRecommendedFacilities,
  } = useApp();

  const [input, setInput]                 = useState('');
  const bottomRef                         = useRef(null);
  const abortControllerRef               = useRef(null);
  const textareaRef                       = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 128) + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    addMessage({ role: 'user', text });
    setLoading(true);
    abortControllerRef.current = new AbortController();
    try {
      const result = await submitTriage(
        text, location?.lat ?? null, location?.lng ?? null,
        abortControllerRef.current.signal
      );
      const recommendedType = RISK_TO_FACILITY_TYPE[result?.risk] || 'clinic';
      let facilities = [];
      if (location?.lat != null && location?.lng != null) {
        facilities = await getHealthPosts(location.lat, location.lng, recommendedType, 10);
      }
      setRecommendedFacilityType(recommendedType);
      setRecommendedFacilities(Array.isArray(facilities) ? facilities : []);
      addMessage({
        role: 'ai',
        text: result.brief_advice || 'Analysis complete.',
        triageResult: {
          ...result,
          recommended_facility_type: recommendedType,
          recommended_facilities: Array.isArray(facilities) ? facilities : [],
        },
      });
    } catch (error) {
      addMessage({
        role: 'ai',
        text: error.name === 'CanceledError' ? 'Request cancelled.' : `Error: ${error.message || t.errors.fetchFailed}`,
        error: true,
      });
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel  = () => { abortControllerRef.current?.abort(); setLoading(false); };
  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-white via-emerald-50/30 to-white">

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">

        {/* Welcome message */}
        <div className="flex justify-start mb-6 animate-slide-up">
          <div className="flex items-start gap-4 max-w-3xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md">
              H
            </div>
            <div className="bg-white border border-emerald-200 rounded-2xl rounded-tl-sm px-6 py-4 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-gray-800 text-sm leading-relaxed font-medium">{t.chat.welcome}</p>
            </div>
          </div>
        </div>

        {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md">
                H
              </div>
              <div className="bg-white border border-emerald-200 rounded-2xl rounded-tl-sm px-6 py-4 shadow-sm">
                <div className="flex gap-1.5 items-center py-1">
                  <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2.5 h-2.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div className="bg-white border-t border-emerald-100 px-8 py-5 shadow-sm">
        <div className="flex items-end gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl px-5 py-3 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-300/30 transition-all duration-200 group hover:ring-2 hover:ring-emerald-300/20">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.chat.placeholder}
            disabled={loading}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-800 placeholder-emerald-400 max-h-32 leading-relaxed disabled:opacity-50 align-top font-medium"
          />
          <div className="flex items-center gap-2 flex-shrink-0">
            <VoiceButton onTranscript={text => setInput(prev => prev + text)} disabled={loading} />
            {loading ? (
              <button
                onClick={handleCancel}
                className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                title="Cancel"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-sm"
              >
                <svg className="w-5 h-5 rotate-90 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m-7 7 7-7 7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-emerald-600 text-center mt-2 font-medium">Press Enter to send · Shift+Enter for new line · Not a substitute for professional medical advice</p>
      </div>
    </div>
  );
}
