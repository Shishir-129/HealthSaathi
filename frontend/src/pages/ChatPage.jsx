import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import ChatWindow from '../components/ChatWindow';
import { getCurrentLocation, getPlaceAndCity } from '../services/locationService';
import { deleteConsultation } from '../services/triageService';
import apiClient from '../services/api';

export default function ChatPage() {
  const {
    t, location, setLocation,
    locationError, setLocationError,
    locationLoading, setLocationLoading,
    messages, clearMessages, addMessage,
    setRecommendedFacilityType, setRecommendedFacilities,
    conversationId: contextConversationId, setConversationId,  // 🧠 Memory system
    user,
  } = useApp();

  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [placeData, setPlaceData] = useState({ place: null, city: null, loading: false });
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [conversationId, setLocalConversationId] = useState(null);  // Local state for ChatWindow
  const [showMobileHistory, setShowMobileHistory] = useState(false);

  // 🧠 Sync local conversation ID with context
  useEffect(() => {
    setConversationId(conversationId);
  }, [conversationId, setConversationId]);

  // 🧠 Handler to update both local and context conversation ID
  const handleConversationIdChange = (newConvId) => {
    setLocalConversationId(newConvId);
    setConversationId(newConvId);  // Update context
  };

  const handleGetLocation = () => {
    setLocationLoading(true);
    setLocationError(null);
    getCurrentLocation()
      .then(loc  => { setLocation(loc); setLocationLoading(false); })
      .catch(err => { setLocationError(err.message); setLocationLoading(false); });
  };

  const handleNewConsultation = () => {
    clearMessages();
    setRecommendedFacilityType(null);
    setRecommendedFacilities([]);
    setSelectedSession(null);
    setLocalConversationId(null);
    setConversationId(null);  // 🧠 Clear in context
    setSessionKey(prev => prev + 1);
    fetchChatHistory();
  };

  const handleDeleteConsultation = async (session, e) => {
    e.stopPropagation();
    if (!window.confirm(t.sidebar.deleteConfirm)) return;
    try {
      await deleteConsultation(session.session_id || session.conversation_id);
      fetchChatHistory();
      if (selectedSession?.session_id === session.session_id || selectedSession?.conversation_id === session.conversation_id) {
        handleNewConsultation();
      }
    } catch (error) {
      console.error('Failed to delete consultation:', error);
      alert(t.common.deleteFailed);
    }
  };

  const handleLoadConsultation = (session) => {
    // Clear current chat
    clearMessages();
    setRecommendedFacilityType(null);
    setRecommendedFacilities([]);
    setSelectedSession(session);
    setLocalConversationId(session.conversation_id || session.session_id);
    setConversationId(session.conversation_id || session.session_id);  // 🧠 Set in context
    setSessionKey(prev => prev + 1);

    // Load all sessions from the conversation
    if (session.sessions && Array.isArray(session.sessions)) {
      session.sessions.forEach((s) => {
        // Add the symptoms as a user message
        addMessage({ role: 'user', text: s.symptoms });

        // Add the AI response with triageResult for RiskCard formatting
        addMessage({
          role: 'ai',
          text: t.chat.here,
          triageResult: {
            risk: s.risk_level,
            brief_advice: s.brief_advice,
            detailed_advice: s.detailed_advice,
            food_eat: s.food_eat,
            food_avoid: s.food_avoid,
            dos: s.dos,
            donts: s.donts,
            nepali_advice: s.nepali_advice,
            recommended_facilities: [],
            recommended_facility_type: session.district,
          }
        });
      });
    } else {
      // Fallback for single session (backward compatibility)
      addMessage({ role: 'user', text: session.symptoms });
      addMessage({
        role: 'ai',
        text: t.chat.here,
        triageResult: {
          risk: session.risk_level,
          brief_advice: session.brief_advice,
          detailed_advice: session.detailed_advice,
          food_eat: session.food_eat,
          food_avoid: session.food_avoid,
          dos: session.dos,
          donts: session.donts,
          nepali_advice: session.nepali_advice,
          recommended_facilities: [],
          recommended_facility_type: session.district,
        }
      });
    }
  };

  useEffect(() => {
    if (!location) handleGetLocation();
    fetchChatHistory();
  }, []);

  // Clear chat and history when user changes (login/logout)
  useEffect(() => {
    clearMessages();
    setChatHistory([]);
    setSelectedSession(null);
    setLocalConversationId(null);
    setConversationId(null);  // 🧠 Clear in context
    setSessionKey(prev => prev + 1);
  }, [user?.id, clearMessages, setConversationId]);

  // Fetch place and city name when location changes
  useEffect(() => {
    if (location && location.lat && location.lng) {
      setPlaceData(prev => ({ ...prev, loading: true }));
      getPlaceAndCity(location.lat, location.lng)
        .then(data => setPlaceData({ ...data, loading: false }))
        .catch(() => setPlaceData({ place: 'Location', city: 'Nepal', loading: false }));
    }
  }, [location]);

  const fetchChatHistory = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/history/');
      setChatHistory(response.data || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-transparent overflow-hidden gap-2 md:gap-3 p-2 md:p-3">

      {/* ─── Left Sidebar: Chat History ─── */}
      {!isSidebarCollapsed && (
        <div className="hidden lg:flex flex-col w-72 xl:w-80 gap-3 overflow-hidden bg-gray-100 rounded-2xl p-4 animate-in fade-in slide-in-from-left">

          {/* Collapse Sidebar Button */}
          <button
            onClick={() => setIsSidebarCollapsed(true)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors px-2 py-1 hover:bg-gray-200 rounded-lg"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {t.sidebar.collapse}
          </button>

          {/* New Consultation Button */}
          <button onClick={handleNewConsultation} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold px-4 py-3 rounded-lg transition-all shadow-md hover:shadow-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t.sidebar.newConsultation}
          </button>

          {/* Chat History */}
          <div className="bg-white rounded-2xl border border-gray-200 flex flex-col overflow-hidden relative">
            <button
              onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
              className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">📋 {t.sidebar.recentConsultations}</h3>
              <svg className={`w-5 h-5 text-gray-600 transition-transform ${isHistoryCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7-7m0 0L5 14m7-7v12" />
              </svg>
            </button>

            {!isHistoryCollapsed && (
              <>
                <div className="absolute right-0 top-14 bottom-0 w-1 bg-gradient-to-b from-teal-400 to-emerald-500 rounded-r-lg" />
                <div className="flex-1 overflow-y-auto space-y-1 border-t border-gray-200 p-2">
                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="w-6 h-6 border-2 border-teal-300 border-t-teal-600 rounded-full animate-spin" />
                    </div>
                  ) : chatHistory.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">{t.sidebar.noConsultations}</p>
                  ) : (
                    chatHistory.slice(0, 10).map((session, idx) => (
                      <div
                        key={idx}
                        className="relative flex items-stretch rounded-lg hover:bg-gray-100 transition-all group text-xs"
                      >
                        <button
                          onClick={() => handleLoadConsultation(session)}
                          className="flex-1 text-left px-3 py-2 flex items-center gap-2 min-w-0"
                        >
                          <span className={`text-sm flex-shrink-0 ${
                            session.risk_level === 'HIGH' ? '🔴' :
                            session.risk_level === 'MEDIUM' ? '🟡' :
                            '🟢'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-700 font-medium truncate group-hover:text-teal-600">
                              {session.symptoms.substring(0, 40)}{session.symptoms.length > 40 ? '...' : ''}
                            </p>
                            <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                              <span>{new Date(session.created_at).toLocaleDateString()}</span>
                              {session.session_count > 1 && (
                                <span className="bg-teal-100 text-teal-700 px-1.5 rounded text-xs font-semibold">
                                  {session.session_count} {t.sidebar.symptoms}
                                </span>
                              )}
                            </p>
                          </div>
                        </button>
                        <button
                          onClick={(e) => handleDeleteConsultation(session, e)}
                          className="px-3 py-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-r transition-all flex-shrink-0 opacity-0 group-hover:opacity-100"
                          title={t.sidebar.deleteConsultation}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Expand Sidebar Button (when collapsed) */}
      {isSidebarCollapsed && (
        <button
          onClick={() => setIsSidebarCollapsed(false)}
          className="hidden lg:flex items-center justify-center w-14 h-14 bg-white hover:bg-gray-100 rounded-full transition-all shadow-lg text-teal-600 hover:text-teal-700 flex-shrink-0 border border-gray-200 animate-in fade-in"
          title={t.sidebar.expand}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* ─── Main Chat Area ─── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Location bar */}
        <div className="bg-white shadow-sm rounded-xl md:rounded-2xl mb-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-3 border border-emerald-100 px-3 md:px-4 py-2 text-xs md:text-sm">
          {/* GPS icon and label */}
          <div className="flex items-center gap-2 text-teal-600 flex-shrink-0">
            <svg className="w-4 h-4 flex-shrink-0 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a 8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-bold text-teal-700 uppercase tracking-wide">{t.location.label}</span>
          </div>

          <div className="flex items-center gap-2 flex-1 md:flex-initial min-w-0 w-full md:w-auto">
            {locationLoading ? (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
                <span className="text-emerald-600 font-medium">{t.location.getting}</span>
              </div>
            ) : location ? (
              <>
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-300 rounded-full px-2 py-1 flex-1 min-w-0">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-semibold text-emerald-700 truncate">
                      {placeData.loading ? t.location.getting : placeData.place}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleGetLocation}
                  className="text-teal-600 hover:text-teal-700 font-bold flex items-center gap-0.5 transition-all hover:bg-teal-50 px-2 py-1 rounded-lg flex-shrink-0 whitespace-nowrap"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden md:inline">{t.location.refresh}</span>
                </button>
              </>
            ) : (
              <>
                {locationError && (
                  <span className="text-red-600 bg-red-50 border border-red-300 rounded-full px-2 py-1 font-medium">
                    {t.location[locationError] || locationError}
                  </span>
                )}
                <button
                  onClick={handleGetLocation}
                  className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold px-3 py-1 rounded-lg transition-all shadow-md hover:shadow-lg flex-shrink-0 whitespace-nowrap"
                >
                  <svg className="w-3 h-3 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span className="hidden md:inline">{t.location.getLocation}</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile action buttons - new chat and history */}
          <div className="lg:hidden flex items-center gap-1 flex-shrink-0">
            {/* New Consultation Button */}
            <button
              onClick={handleNewConsultation}
              className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-600 transition-colors flex-shrink-0"
              title="New consultation"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            {/* View History Button */}
            <button
              onClick={() => setShowMobileHistory(true)}
              className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors flex-shrink-0"
              title="View history"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 2m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          {/* Notification icon - hidden on small screens */}
          <button className="hidden sm:block text-gray-500 hover:text-teal-600 transition-colors flex-shrink-0" title="Notifications">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </div>

        {/* Chat content */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          <ChatWindow key={sessionKey} conversationId={conversationId} district={placeData.city} onConversationIdChange={handleConversationIdChange} onConsultationSubmitted={fetchChatHistory} />
        </div>


      </div>

      {/* Mobile History Modal - visible on mobile when showMobileHistory is true */}
      {showMobileHistory && (
        <>
          {/* Modal Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={() => setShowMobileHistory(false)}
          />
          {/* Modal Content */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[80vh] lg:hidden flex flex-col animate-slide-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-900">{t.sidebar.recentConsultations}</h3>
              <button
                onClick={() => setShowMobileHistory(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-6 h-6 border-2 border-teal-300 border-t-teal-600 rounded-full animate-spin" />
                </div>
              ) : chatHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <p className="text-gray-600 text-center font-medium">{t.sidebar.noConsultations}</p>
                  <p className="text-gray-500 text-sm mt-2">Start a new consultation to see history</p>
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {chatHistory.slice(0, 20).map((session, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        handleLoadConsultation(session);
                        setShowMobileHistory(false);
                      }}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
                    >
                      <span className={`text-lg flex-shrink-0 mt-1 ${
                        session.risk_level === 'HIGH' ? '🔴' :
                        session.risk_level === 'MEDIUM' ? '🟡' :
                        '🟢'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {session.symptoms.substring(0, 40)}{session.symptoms.length > 40 ? '...' : ''}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(session.created_at).toLocaleDateString()}</p>
                        {session.session_count > 1 && (
                          <span className="inline-block bg-teal-100 text-teal-700 px-2 py-1 rounded text-xs font-semibold mt-1">
                            {session.session_count} {t.sidebar.symptoms}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConsultation(session, e);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all flex-shrink-0"
                        title={t.sidebar.deleteConsultation}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer - New Consultation Button */}
            <div className="border-t border-gray-200 p-4 flex-shrink-0">
              <button
                onClick={() => {
                  handleNewConsultation();
                  setShowMobileHistory(false);
                }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold px-4 py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                {t.sidebar.newConsultation}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
