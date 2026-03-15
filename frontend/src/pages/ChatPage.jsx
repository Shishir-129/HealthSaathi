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
    messages,
  } = useApp();

  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [placeData, setPlaceData] = useState({ place: null, city: null, loading: false });

  const handleGetLocation = () => {
    setLocationLoading(true);
    setLocationError(null);
    getCurrentLocation()
      .then(loc  => { setLocation(loc); setLocationLoading(false); })
      .catch(err => { setLocationError(err.message); setLocationLoading(false); });
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

  const guidanceSteps = [
    {
      step: '1',
      title: 'Describe Your Symptoms',
      desc: 'Type or speak your symptoms naturally',
      icon: '💬',
      tips: ['Be as detailed as possible', 'Mention when symptoms started', 'Include severity if known']
    },
    {
      step: '2',
      title: 'AI Analysis',
      desc: 'Our AI analyzes your symptoms',
      icon: '🧠',
      tips: ['Risk assessment (Low/Medium/High)', 'Personalized advice provided', 'Facility recommendations']
    },
    {
      step: '3',
      title: 'Get Recommendations',
      desc: 'Receive healthcare facility suggestions',
      icon: '🏥',
      tips: ['Nearby hospitals & clinics', 'Pharmacies in your area', 'Distance and directions']
    },
    {
      step: '4',
      title: 'Track Your Health',
      desc: 'Keep your consultation history safe',
      icon: '📋',
      tips: ['Automatic record keeping', 'Review past consultations', 'Monitor your health trends']
    },
  ];

  return (
    <div className="flex h-full bg-gradient-to-br from-white via-emerald-50/20 to-white overflow-hidden gap-6 p-6">

      {/* ─── Left Sidebar: Chat History & Guide ─── */}
      <div className="hidden xl:flex flex-col w-80 gap-6 overflow-hidden bg-gradient-to-b from-teal-700 to-teal-800 rounded-2xl p-6">

        {/* How it works button & guide*/}
        <div className="bg-teal-600/30 rounded-2xl p-5 border border-teal-500/40 hover:bg-teal-600/40 transition-all">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="w-full flex items-center justify-between mb-4 px-4 py-3 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 text-teal-900 font-bold hover:shadow-lg transition-all duration-200 shadow-md"
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">📚</span>
              See How It Works
            </span>
            <svg className={`w-5 h-5 transition-transform ${showGuide ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>

          {showGuide && (
            <div className="space-y-3 animate-slide-up">
              {guidanceSteps.map((step) => (
                <div key={step.step} className="p-3 bg-teal-600/40 rounded-xl border border-teal-500/50 hover:border-teal-400 transition-all">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-500/40 flex items-center justify-center text-teal-200 font-bold text-xs flex-shrink-0">
                      {step.step}
                    </div>
                    <div>
                      <p className="font-semibold text-teal-50 text-sm">{step.title}</p>
                      <p className="text-xs text-teal-200/90 mt-0.5">{step.desc}</p>
                      <ul className="text-xs text-teal-100/80 mt-1.5 space-y-0.5">
                        {step.tips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-teal-300 mt-0.5">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat History */}
        <div className="bg-teal-600/30 rounded-2xl p-5 border border-teal-500/40 flex flex-col overflow-hidden">
          <h3 className="text-sm font-bold text-teal-50 uppercase tracking-wider mb-3">📋 Recent Consultations</h3>
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
        <div className="bg-white shadow-sm rounded-2xl mb-4 flex items-center gap-4 border border-emerald-100 px-6 py-4">
          {/* GPS icon */}
          <div className="flex items-center gap-1.5 text-teal-600">
            <svg className="w-5 h-5 flex-shrink-0 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wide">{t.location.label}</span>
          </div>

          {locationLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
              <span className="text-xs text-emerald-600 font-medium">{t.location.getting}</span>
            </div>
          ) : location ? (
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-300 rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-emerald-700">
                    {placeData.loading ? 'Getting location...' : placeData.place}
                  </span>
                  <span className="text-xs text-emerald-600">
                    {!placeData.loading && placeData.city}
                  </span>
                </div>
              </div>
              <button
                onClick={handleGetLocation}
                className="text-xs text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1 transition-all hover:bg-teal-50 px-3 py-1 rounded-lg"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-1">
              {locationError && (
                <span className="text-xs text-red-600 bg-red-50 border border-red-300 rounded-full px-3 py-1.5 font-medium">
                  {t.location[locationError] || locationError}
                </span>
              )}
              <button
                onClick={handleGetLocation}
                className="text-xs bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {t.location.getLocation}
              </button>
            </div>
          )}
        </div>

        {/* Chat content */}
        <div className="flex-1 overflow-hidden rounded-2xl card-light border-teal-200 shadow-lg">
          <ChatWindow />
        </div>
      </div>
    </div>
  );
}
