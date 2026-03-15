import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import ChatWindow from '../components/ChatWindow';
import { getCurrentLocation } from '../services/locationService';

export default function ChatPage() {
  const {
    t, location, setLocation,
    locationError, setLocationError,
    locationLoading, setLocationLoading,
  } = useApp();

  const handleGetLocation = () => {
    setLocationLoading(true);
    setLocationError(null);
    getCurrentLocation()
      .then(loc  => { setLocation(loc); setLocationLoading(false); })
      .catch(err => { setLocationError(err.message); setLocationLoading(false); });
  };

  useEffect(() => {
    if (!location) handleGetLocation();
  }, []);

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden">

      {/* ── Main chat column ── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Location bar */}
        <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-4 shadow-sm">
          {/* GPS icon */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{t.location.label}</span>
          </div>

          {locationLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-400">{t.location.getting}</span>
            </div>
          ) : location ? (
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono text-emerald-700">
                  {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                </span>
              </div>
              <button
                onClick={handleGetLocation}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 transition-colors"
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
                <span className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-full px-3 py-1.5">
                  {t.location[locationError] || locationError}
                </span>
              )}
              <button
                onClick={handleGetLocation}
                className="text-xs bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white px-4 py-1.5 rounded-full transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center gap-1.5"
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
        <div className="flex-1 overflow-hidden">
          <ChatWindow />
        </div>
      </div>

      {/* ── Right context panel ── */}
      <div className="hidden xl:flex flex-col w-72 border-l border-gray-100 bg-white p-5 gap-5 overflow-y-auto">

        {/* How it works */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">How it works</h4>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Describe Symptoms', desc: 'Type or speak your symptoms in English or Nepali', icon: '💬' },
              { step: '2', title: 'AI Analysis',       desc: 'Our AI triages your case and assesses risk level',  icon: '🧠' },
              { step: '3', title: 'Get Guidance',      desc: 'Receive advice and nearby facility recommendations', icon: '🏥' },
            ].map(({ step, title, desc, icon }) => (
              <div key={step} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                  {icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk levels guide */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Risk Levels</h4>
          <div className="space-y-2">
            {[
              { level: 'HIGH',   color: 'bg-red-500',    text: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-100',    desc: 'Seek emergency care immediately' },
              { level: 'MEDIUM', color: 'bg-amber-400',  text: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-100',  desc: 'Visit a clinic within 24 hours'  },
              { level: 'LOW',    color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100', desc: 'Home care & rest recommended'     },
            ].map(({ level, color, text, bg, border, desc }) => (
              <div key={level} className={`${bg} border ${border} rounded-xl p-3 flex items-start gap-2.5`}>
                <span className={`w-2.5 h-2.5 rounded-full ${color} flex-shrink-0 mt-1`} />
                <div>
                  <p className={`text-xs font-bold ${text}`}>{level}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy note */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mt-auto">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-xs font-semibold text-slate-500">Privacy</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">Your conversations are confidential and used only to provide health guidance.</p>
        </div>
      </div>
    </div>
  );
}
