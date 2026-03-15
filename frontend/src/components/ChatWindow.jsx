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
    <div className="flex flex-col h-full bg-gray-50">

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-2">

        {/* Welcome message */}
        <div className="flex justify-start mb-4 animate-slide-up">
          <div className="flex items-start gap-3 max-w-2xl">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
              AI
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
              <p className="text-gray-800 text-sm leading-relaxed">{t.chat.welcome}</p>
            </div>
          </div>
        </div>

        {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                AI
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
                <div className="flex gap-1.5 items-center py-1">
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div className="bg-white border-t border-gray-100 px-6 py-4 shadow-sm">
        <div className="flex items-end gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-400/20 transition-all duration-200">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.chat.placeholder}
            disabled={loading}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-800 placeholder-gray-400 max-h-32 leading-relaxed disabled:opacity-50 align-top"
          />
          <div className="flex items-center gap-2 flex-shrink-0">
            <VoiceButton onTranscript={text => setInput(prev => prev + text)} disabled={loading} />
            {loading ? (
              <button
                onClick={handleCancel}
                className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors shadow-sm"
                title="Cancel"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <svg className="w-4 h-4 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m-7 7 7-7 7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">Press Enter to send · Shift+Enter for new line · Not a substitute for professional medical advice</p>
      </div>
    </div>
  );
}
