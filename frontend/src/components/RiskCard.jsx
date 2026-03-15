import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const RISK_CONFIG = {
  HIGH:   {
    gradient: 'from-red-50 to-rose-50',
    border:   'border-red-300',
    badgeBg:  'bg-red-500',
    icon:     '🚨',
    pulse:    true,
    accent:   'text-red-600',
    tagBg:    'bg-red-100 text-red-700',
  },
  MEDIUM: {
    gradient: 'from-amber-50 to-yellow-50',
    border:   'border-amber-300',
    badgeBg:  'bg-amber-500',
    icon:     '⚠️',
    pulse:    false,
    accent:   'text-amber-600',
    tagBg:    'bg-amber-100 text-amber-700',
  },
  LOW:    {
    gradient: 'from-emerald-50 to-green-50',
    border:   'border-emerald-300',
    badgeBg:  'bg-emerald-500',
    icon:     '✅',
    pulse:    false,
    accent:   'text-emerald-600',
    tagBg:    'bg-emerald-100 text-emerald-700',
  },
};

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-bold text-teal-700 uppercase tracking-widest mb-2">{children}</p>
  );
}

function TagList({ items, colorClass }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={i} className={`text-xs px-2.5 py-1 rounded-full font-medium ${colorClass}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

export default function RiskCard({ risk, advice, action, nepaliAdvice, nearestPost, recommendedFacilityType, triageResult }) {
  const { t, lang } = useApp();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const cfg = RISK_CONFIG[risk] || RISK_CONFIG.MEDIUM;

  const handleHospitalClick = () => {
    const hasCoords = nearestPost?.lat && nearestPost?.lng;
    const hasCentroid = nearestPost?.centroid;
    if (hasCoords || hasCentroid) navigate('/map', { state: { targetHospital: nearestPost } });
  };

  const briefAdvice    = triageResult?.brief_advice   || advice;
  const detailedAdvice = triageResult?.detailed_advice;
  const foodEat   = triageResult?.food_eat?.split('|').map(f => f.trim()).filter(Boolean)   || [];
  const foodAvoid = triageResult?.food_avoid?.split('|').map(f => f.trim()).filter(Boolean) || [];
  const dos       = triageResult?.dos?.split('|').map(d => d.trim()).filter(Boolean)         || [];
  const donts     = triageResult?.donts?.split('|').map(d => d.trim()).filter(Boolean)       || [];

  const hasExtras = detailedAdvice || foodEat.length || foodAvoid.length || dos.length || donts.length;

  return (
    <div className={`rounded-2xl border-2 ${cfg.border} bg-gradient-to-br ${cfg.gradient} overflow-hidden shadow-md hover:shadow-lg transition-shadow animate-slide-up`}>

      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`relative w-12 h-12 rounded-xl ${cfg.badgeBg} flex items-center justify-center text-2xl shadow-md`}>
            {cfg.icon}
            {cfg.pulse && (
              <span className={`absolute inset-0 rounded-xl ${cfg.badgeBg} opacity-40 animate-ping`} />
            )}
          </div>
          <div>
            <span className={`text-xs font-bold uppercase tracking-widest ${cfg.accent}`}>Risk Level</span>
            <p className={`font-extrabold text-xl leading-tight ${cfg.accent}`}>{t.risk[risk]}</p>
          </div>
        </div>
        {recommendedFacilityType && (
          <span className={`text-xs px-3 py-1.5 rounded-full font-bold capitalize ${cfg.tagBg}`}>
            → {recommendedFacilityType}
          </span>
        )}
      </div>

      {/* ── Brief Advice ── */}
      <div className="px-5 pb-4">
        <SectionLabel>{t.chat.advice}</SectionLabel>
        <p className="text-gray-800 text-sm font-medium leading-relaxed bg-white/70 rounded-xl px-4 py-3 border border-white/90 shadow-sm">
          {briefAdvice}
        </p>
      </div>

      {/* ── Expandable extras ── */}
      {hasExtras && (
        <>
          <button
            onClick={() => setExpanded(e => !e)}
            className={`w-full flex items-center justify-center gap-1.5 py-3 text-xs font-bold ${cfg.accent} hover:bg-black/5 transition-colors border-t border-black/5`}
          >
            {expanded ? 'Show less' : 'Show detailed guidance'}
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expanded && (
            <div className="px-5 pb-4 space-y-4 border-t border-black/5 pt-4 animate-fade-in">
              {detailedAdvice && (
                <div>
                  <SectionLabel>Detailed Guidance</SectionLabel>
                  <p className="text-gray-700 text-sm leading-relaxed bg-white/50 rounded-lg p-3 border border-white/70">{detailedAdvice}</p>
                </div>
              )}

              {(dos.length > 0 || donts.length > 0) && (
                <div className="grid grid-cols-2 gap-3">
                  {dos.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                      <SectionLabel>✅ Do These</SectionLabel>
                      <ul className="space-y-1">
                        {dos.map((item, i) => (
                          <li key={i} className="text-xs text-emerald-800 flex gap-1.5 font-medium">
                            <span className="mt-0.5 text-emerald-600 flex-shrink-0">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {donts.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                      <SectionLabel>❌ Avoid These</SectionLabel>
                      <ul className="space-y-1">
                        {donts.map((item, i) => (
                          <li key={i} className="text-xs text-red-800 flex gap-1.5 font-medium">
                            <span className="mt-0.5 text-red-600 flex-shrink-0">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {foodEat.length > 0 && (
                <div>
                  <SectionLabel>🍎 Foods to Eat</SectionLabel>
                  <TagList items={foodEat} colorClass="bg-green-100 text-green-700 font-medium" />
                </div>
              )}
              {foodAvoid.length > 0 && (
                <div>
                  <SectionLabel>🚫 Foods to Avoid</SectionLabel>
                  <TagList items={foodAvoid} colorClass="bg-red-100 text-red-700 font-medium" />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Nearest health post ── */}
      {nearestPost && (
        <div
          onClick={handleHospitalClick}
          className="mx-5 mb-5 bg-white rounded-xl border border-teal-200 p-4 cursor-pointer hover:border-teal-400 hover:shadow-lg transition-all duration-200 group shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-100 to-emerald-100 border border-teal-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-teal-600 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-0.5">{t.chat.nearestPost}</p>
                <p className="font-bold text-gray-900 text-sm">{nearestPost.name}</p>
                {nearestPost.address && <p className="text-xs text-gray-600 mt-1 font-medium">{nearestPost.address}</p>}
              </div>
            </div>
            <span className="text-xs text-teal-600 font-bold group-hover:text-teal-700 flex items-center gap-0.5 flex-shrink-0">
              Map
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </span>
          </div>
          {nearestPost.type && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs bg-gradient-to-r from-teal-100 to-emerald-100 text-teal-700 border border-teal-200 rounded-full px-3 py-1 capitalize font-bold">
                🏥 {nearestPost.type.replace('_', ' ')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
