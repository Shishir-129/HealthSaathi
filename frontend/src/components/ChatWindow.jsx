import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import MessageBubble from './MessageBubble';
import VoiceButton from './VoiceButton';
import { submitTriage, getHealthPosts } from '../services/triageService';

const RISK_TO_FACILITY_TYPE = {
  HIGH: 'hospital',
  MEDIUM: 'pharmacy',
  LOW: 'clinic',
};

export default function ChatWindow() {
  const {
    t,
    location,
    messages,
    addMessage,
    loading,
    setLoading,
    setRecommendedFacilityType,
    setRecommendedFacilities,
  } = useApp();
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const abortControllerRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-resize textarea
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

    // Create a new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      // DEBUG: Log request details
      console.log('🔵 Sending triage request:', {
        symptoms: text,
        lat: location?.lat,
        lng: location?.lng,
        hasLocation: location ? 'YES' : 'NO'
      });

      const result = await submitTriage(
        text,
        location?.lat ?? null,
        location?.lng ?? null,
        abortControllerRef.current.signal
      );

      // DEBUG: Log response
      console.log('🟢 Backend response received:', result);

      const recommendedType = RISK_TO_FACILITY_TYPE[result?.risk] || 'clinic';
      console.log('📊 Detected risk level:', result?.risk, '→ Recommended facility:', recommendedType);

      let facilities = [];

      if (location?.lat != null && location?.lng != null) {
        console.log('📍 Fetching health posts for:', recommendedType);
        facilities = await getHealthPosts(location.lat, location.lng, recommendedType, 10);
        console.log('🏥 Fetched facilities:', facilities?.length || 0, 'results');
      } else {
        console.log('⚠️ No location available for facility search');
      }

      setRecommendedFacilityType(recommendedType);
      setRecommendedFacilities(Array.isArray(facilities) ? facilities : []);

      // Format the brief advice text for display
      const briefAdviceText = result.brief_advice || 'Analysis complete.';

      addMessage({
        role: 'ai',
        text: briefAdviceText,
        triageResult: {
          ...result,
          recommended_facility_type: recommendedType,
          recommended_facilities: Array.isArray(facilities) ? facilities : [],
        },
      });
    } catch (error) {
      // Check if the error is due to request cancellation
      if (error.name === 'CanceledError') {
        console.error('❌ Request cancelled');
        addMessage({
          role: 'ai',
          text: 'Request cancelled',
          error: true,
        });
      } else {
        console.error('❌ API Error:', error);
        const errorMsg = error.message || t.errors.fetchFailed;
        addMessage({
          role: 'ai',
          text: `Error: ${errorMsg}`,
          error: true,
        });
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {/* Welcome message */}
        <div className="flex justify-start mb-3">
          <div className="w-8 h-8 rounded-full bg-nepal-blue flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-0.5">
            AI
          </div>
          <div className="max-w-[80%] px-4 py-2.5 bg-white text-gray-800 shadow-sm border border-gray-100 rounded-2xl rounded-tl-sm text-sm leading-relaxed">
            {t.chat.welcome}
          </div>
        </div>

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {loading && (
          <div className="flex justify-start mb-3">
            <div className="w-8 h-8 rounded-full bg-nepal-blue flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0">
              AI
            </div>
            <div className="px-4 py-2.5 bg-white shadow-sm border border-gray-100 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="flex items-start gap-2 bg-gray-100 rounded-2xl px-3 py-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.chat.placeholder}
            disabled={loading}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-800 placeholder-gray-400 max-h-32 leading-relaxed disabled:opacity-50 align-top"
          />
          <VoiceButton
            onTranscript={(text) => setInput((prev) => prev + text)}
            disabled={loading}
          />
          {loading ? (
            <button
              onClick={handleCancel}
              className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
              title="Cancel request"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m-7 7 7-7 7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
