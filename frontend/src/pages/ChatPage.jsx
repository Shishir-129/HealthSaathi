import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import ChatWindow from '../components/ChatWindow';
import { getCurrentLocation, getPlaceAndCity } from '../services/locationService';
import apiClient from '../services/api';

export default function ChatPage() {
  const {
    t, location, setLocation,
    locationError, setLocationError,
    locationLoading, setLocationLoading,
    messages, clearMessages,
    setRecommendedFacilityType, setRecommendedFacilities,
  } = useApp();

  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [placeData, setPlaceData] = useState({ place: null, city: null, loading: false });

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
    fetchChatHistory(); // Refresh history to show the saved consultation
  };

  useEffect(() => {
    if (!location) handleGetLocation();
    fetchChatHistory();
  }, []);

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
      const response = await apiClient.get('/triage/history/');
      setChatHistory(response.data || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-transparent overflow-hidden gap-3 p-3">

      {/* ─── Left Sidebar: Chat History ─── */}
      <div className="hidden xl:flex flex-col w-80 gap-3 overflow-hidden bg-gradient-to-b from-teal-700 to-teal-800 rounded-2xl p-4">

        {/* New Consultation Button */}
        <button onClick={handleNewConsultation} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold px-4 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Consultation
        </button>

        {/* Chat History */}
        <div className="bg-teal-600/30 rounded-2xl p-3 border border-teal-500/40 flex flex-col overflow-hidden">
          <h3 className="text-sm font-bold text-teal-50 uppercase tracking-wider mb-2">📋 Recent Consultations</h3>
          <div className="flex-1 overflow-y-auto space-y-2">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="w-6 h-6 border-2 border-teal-300 border-t-teal-600 rounded-full animate-spin" />
              </div>
            ) : chatHistory.length === 0 ? (
              <p className="text-xs text-teal-200/80 text-center py-4">No consultations yet. Start a new conversation!</p>
            ) : (
              chatHistory.slice(0, 5).map((session, idx) => (
                <button
                  key={idx}
                  className="text-left p-3 rounded-lg bg-teal-600/40 border border-teal-500/50 hover:border-teal-400 hover:bg-teal-600/50 transition-all group"
                >
                  <div className="flex items-start gap-2">
                    <span className={`text-lg ${
                      session.risk_level === 'HIGH' ? '🔴' :
                      session.risk_level === 'MEDIUM' ? '🟡' :
                      '🟢'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-teal-50 group-hover:text-teal-100 transition-colors">
                        {new Date(session.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-teal-200/80 mt-0.5 line-clamp-1">{session.district || 'General Check'}</p>
                      <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-1.5 ${
                        session.risk_level === 'HIGH'
                          ? 'badge-high'
                          : session.risk_level === 'MEDIUM'
                          ? 'badge-medium'
                          : 'badge-low'
                      }`}>
                        {session.risk_level}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── Main Chat Area ─── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Location bar */}
        <div className="bg-white shadow-sm rounded-2xl mb-2 flex items-center justify-between gap-3 border border-emerald-100 px-4 py-2">
          {/* GPS icon */}
          <div className="flex items-center gap-1 text-teal-600 flex-shrink-0">
            <svg className="w-4 h-4 flex-shrink-0 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a 8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wide">{t.location.label}</span>
          </div>

          {locationLoading ? (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
              <span className="text-xs text-emerald-600 font-medium">{t.location.getting}</span>
            </div>
          ) : location ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-300 rounded-full px-2 py-1">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-emerald-700 truncate">
                    {placeData.loading ? 'Getting location...' : placeData.place}
                  </span>
                </div>
              </div>
              <button
                onClick={handleGetLocation}
                className="text-xs text-teal-600 hover:text-teal-700 font-bold flex items-center gap-0.5 transition-all hover:bg-teal-50 px-2 py-1 rounded-lg flex-shrink-0"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              {locationError && (
                <span className="text-xs text-red-600 bg-red-50 border border-red-300 rounded-full px-2 py-1 font-medium">
                  {t.location[locationError] || locationError}
                </span>
              )}
              <button
                onClick={handleGetLocation}
                className="text-xs bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold px-3 py-1 rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                <svg className="w-3 h-3 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {t.location.getLocation}
              </button>
            </div>
          )}

          {/* Notification icon */}
          <button className="text-gray-500 hover:text-teal-600 transition-colors flex-shrink-0" title="Notifications">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </div>

        {/* Chat content */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          <ChatWindow />
        </div>
      </div>
    </div>
  );
}
