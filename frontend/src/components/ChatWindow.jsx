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

export default function ChatWindow({ onConsultationSubmitted, conversationId, onConversationIdChange, district }) {
  const {
    t, location, messages, addMessage,
    loading, setLoading,
    setRecommendedFacilityType, setRecommendedFacilities,
  } = useApp();

  const [input, setInput]                 = useState('');
  const [localConversationId, setLocalConversationId] = useState(conversationId);
  const bottomRef                         = useRef(null);
  const abortControllerRef               = useRef(null);
  const textareaRef                       = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  useEffect(() => {
    setLocalConversationId(conversationId);
  }, [conversationId]);

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
        abortControllerRef.current.signal,
        localConversationId,
        district
      );
      
      // Update conversation ID if returned from backend (for new conversations)
      if (result.conversation_id && !localConversationId) {
        setLocalConversationId(result.conversation_id);
        if (onConversationIdChange) {
          onConversationIdChange(result.conversation_id);
        }
      }
      
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
      
      // Refresh history after successful consultation submission
      if (onConsultationSubmitted) {
        onConsultationSubmitted();
      }
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
    <div className="flex flex-col h-full bg-gray-100">

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4 bg-gray-100">

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
      <div className="bg-gray-100 border-t border-gray-300 px-8 py-3 shadow-sm">
        {/* Quick symptom buttons */}
        {!messages.some(m => m.role === 'user') && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Quick Symptoms:</p>
            <div className="overflow-x-auto flex gap-2 pb-2 scrollbar-gray">
              {[
                'I have fever, headache and sore throat',
                'Chest pain and shortness of breath',
                'Severe stomach pain and nausea',
                'Persistent cough and body aches',
              ].map((symptom, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(symptom)}
                  className="px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50 hover:border-teal-400 transition-all duration-200 font-medium whitespace-nowrap flex-shrink-0"
                >
                  {symptom}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input container */}
        <div className="flex items-start gap-3 bg-gray-50 border-2 border-gray-300 rounded-2xl px-5 py-2 focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-400/20 transition-all duration-200 group hover:ring-2 hover:ring-gray-300/40">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.chat.placeholder}
            disabled={loading}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-800 placeholder-gray-500 max-h-32 leading-relaxed disabled:opacity-50 pt-2 font-medium"
          />
          <div className="flex items-center gap-2 flex-shrink-0 pt-2">
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
        <p className="text-xs text-gray-600 text-center mt-2 font-medium">Press Enter to send · Shift+Enter for new line · Not a substitute for professional medical advice</p>
      </div>
    </div>
  );
}
