import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { getStats } from '../services/triageService';

// ─── Animated number ──────────────────────────────────────────────────────────
function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value == null || isNaN(Number(value))) { setDisplay(value ?? '—'); return; }
    const end = Number(value);
    const duration = 800;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{display}</>;
}

// ─── Donut Arc SVG ────────────────────────────────────────────────────────────
function DonutChart({ high = 0, medium = 0, low = 0, total = 0, t }) {
  if (total === 0) return (
    <div className="flex items-center justify-center h-48 text-slate-400 text-sm">{t?.dashboard?.noData || 'No data yet'}</div>
  );
  const cx = 80, cy = 80, r = 58, strokeW = 18;
  const circ = 2 * Math.PI * r;
  const pctH = high   / total;
  const pctM = medium / total;
  const pctL = low    / total;
  const dashH = circ * pctH;
  const dashM = circ * pctM;
  const dashL = circ * pctL;
  const gapH  = circ - dashH;
  const gapM  = circ - dashM;
  const gapL  = circ - dashL;
  const offH  = 0;
  const offM  = -dashH;
  const offL  = -(dashH + dashM);

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width="160" height="160" viewBox="0 0 160 160" className="drop-shadow-sm">
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={strokeW} />
        {/* High */}
        {pctH > 0 && (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ef4444" strokeWidth={strokeW}
            strokeDasharray={`${dashH} ${gapH}`}
            strokeDashoffset={offH}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        )}
        {/* Medium */}
        {pctM > 0 && (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f59e0b" strokeWidth={strokeW}
            strokeDasharray={`${dashM} ${gapM}`}
            strokeDashoffset={offM}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        )}
        {/* Low */}
        {pctL > 0 && (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#10b981" strokeWidth={strokeW}
            strokeDasharray={`${dashL} ${gapL}`}
            strokeDashoffset={offL}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        )}
        {/* Center */}
        <text x={cx} y={cy - 6}  textAnchor="middle" fill="#0f172a" fontSize="22" fontWeight="700">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#94a3b8" fontSize="10">{t?.dashboard?.total?.toLowerCase() || 'total'}</text>
      </svg>

      {/* Legend */}
      <div className="flex gap-4 text-xs font-medium">
        {[
          { color: 'bg-red-500',   label: 'High',   pct: Math.round(pctH * 100) },
          { color: 'bg-amber-400', label: 'Medium', pct: Math.round(pctM * 100) },
          { color: 'bg-emerald-500', label: 'Low',  pct: Math.round(pctL * 100) },
        ].map(({ color, label, pct }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <span className="text-gray-600">{label}</span>
            <span className="font-bold text-gray-900">{pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stat Hero Card ───────────────────────────────────────────────────────────
function HeroStat({ label, value, icon, gradient, glow, badge }) {
  return (
    <div className={`rounded-lg md:rounded-2xl p-4 md:p-5 relative overflow-hidden ${gradient} shadow-md`}>
      <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-20 blur-xl ${glow}`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <div className="w-8 md:w-10 h-8 md:h-10 rounded-lg md:rounded-xl bg-white/20 flex items-center justify-center text-white text-base md:text-lg">
            {icon}
          </div>
          {badge && (
            <span className="text-white/80 text-xs font-semibold bg-white/20 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xl md:text-3xl font-extrabold text-white tracking-tight">
          <AnimatedNumber value={value} />
        </p>
        <p className="text-white/75 text-xs md:text-sm mt-1 font-medium">{label}</p>
      </div>
    </div>
  );
}

// ─── Quick Action ─────────────────────────────────────────────────────────────
function QuickAction({ icon, label, desc, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg md:rounded-2xl bg-white border border-gray-100 hover:border-teal-200 hover:shadow-md transition-all duration-200 text-left group w-full"
    >
      <div className={`w-10 md:w-12 h-10 md:h-12 rounded-lg md:rounded-xl ${color} flex items-center justify-center text-lg md:text-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-gray-900 text-xs md:text-sm">{label}</p>
        <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
      </div>
      <svg className="w-4 h-4 text-gray-300 group-hover:text-teal-500 ml-auto transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

// ─── Health Tip ───────────────────────────────────────────────────────────────
const TIPS = [
  { tip: 'Drink at least 8 glasses of water daily to stay properly hydrated.', icon: '💧' },
  { tip: 'Wash your hands for at least 20 seconds with soap to prevent infections.', icon: '🧼' },
  { tip: 'Get 7–8 hours of sleep each night for optimal immune function.', icon: '😴' },
  { tip: 'Eat a balanced diet rich in fruits and vegetables for essential nutrients.', icon: '🥗' },
  { tip: 'Exercise for at least 30 minutes most days to maintain cardiovascular health.', icon: '🏃' },
];

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const tip = TIPS[new Date().getDay() % TIPS.length];

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => setError(t.errors?.fetchFailed || 'Failed to load stats'));
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-xl">⚠️</div>
          <p className="text-red-500 font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="text-teal-600 text-sm hover:underline">Try again</button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm animate-pulse">{t.dashboard?.loading || 'Loading dashboard…'}</p>
        </div>
      </div>
    );
  }

  const dist  = stats.risk_distribution || {};
  const total = stats.total_sessions    || 0;

  const heroStats = [
    {
      label: t.dashboard?.total || 'Total Sessions',
      value: total,
      icon:  '🩺',
      gradient: 'bg-gradient-to-br from-teal-500 to-teal-700',
      glow:  'bg-teal-300',
      badge: t.dashboard?.allTime || 'All time',
    },
    {
      label: t.dashboard?.high || 'High Risk',
      value: dist.HIGH ?? 0,
      icon:  '🚨',
      gradient: 'bg-gradient-to-br from-red-500 to-rose-700',
      glow:  'bg-red-300',
      badge: total > 0 ? `${Math.round(((dist.HIGH || 0) / total) * 100)}%` : '—',
    },
    {
      label: t.dashboard?.medium || 'Medium Risk',
      value: dist.MEDIUM ?? 0,
      icon:  '⚠️',
      gradient: 'bg-gradient-to-br from-amber-400 to-orange-500',
      glow:  'bg-amber-300',
      badge: total > 0 ? `${Math.round(((dist.MEDIUM || 0) / total) * 100)}%` : '—',
    },
    {
      label: t.dashboard?.low || 'Low Risk',
      value: dist.LOW ?? 0,
      icon:  '✅',
      gradient: 'bg-gradient-to-br from-emerald-500 to-green-700',
      glow:  'bg-emerald-300',
      badge: total > 0 ? `${Math.round(((dist.LOW || 0) / total) * 100)}%` : '—',
    },
  ];

  const topDistrict = stats.districts?.[0];

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6 animate-fade-in">

        {/* ── Hero stats row ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
          {heroStats.map((s) => (
            <HeroStat key={s.label} {...s} />
          ))}
        </div>

        {/* ── Middle row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

          {/* Donut chart card */}
          <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm md:text-base text-gray-900">{t.dashboard?.riskDistribution || 'Risk Distribution'}</h3>
              <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{t.dashboard?.allTime || 'All time'}</span>
            </div>
            <DonutChart high={dist.HIGH} medium={dist.MEDIUM} low={dist.LOW} total={total} t={t} />
          </div>

          {/* Districts leaderboard */}
          <div className="lg:col-span-2 bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6">
            <div className="mb-4">
              <h3 className="font-bold text-sm md:text-base text-gray-900">{t.dashboard?.districts || 'Districts by Sessions'}</h3>
            </div>

            {stats.districts && stats.districts.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {stats.districts.slice(0, 10).map((d, idx) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="text-xs md:text-sm font-medium text-gray-700">📍 {d.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                {t.dashboard?.noDistrictData || 'No district data yet'}
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

          {/* Quick Actions */}
          <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6">
            <h3 className="font-bold text-sm md:text-base text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <QuickAction
                icon="💬" label="Start New Chat"
                desc="Describe your symptoms"
                color="bg-teal-50"
                onClick={() => navigate('/chat')}
              />
              <QuickAction
                icon="🗺️" label="View Health Map"
                desc="Find nearby facilities"
                color="bg-blue-50"
                onClick={() => navigate('/map')}
              />
              <QuickAction
                icon="📊" label="Export Report"
                desc="Download stats as PDF"
                color="bg-purple-50"
                onClick={() => alert('Export feature coming soon!')}
              />
            </div>
          </div>

          {/* Risk gauge & key metric */}
          <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 space-y-4">
            <h3 className="font-bold text-sm md:text-base text-gray-900">Risk Breakdown</h3>
            {total > 0 ? (
              <div className="space-y-3">
                {[
                  { label: 'High Risk',   count: dist.HIGH   || 0, color: 'bg-red-500',    pct: Math.round(((dist.HIGH   || 0) / total) * 100) },
                  { label: 'Medium Risk', count: dist.MEDIUM || 0, color: 'bg-amber-400',  pct: Math.round(((dist.MEDIUM || 0) / total) * 100) },
                  { label: 'Low Risk',    count: dist.LOW    || 0, color: 'bg-emerald-500', pct: Math.round(((dist.LOW    || 0) / total) * 100) },
                ].map(({ label, count, color, pct }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs md:text-sm mb-1">
                      <span className="font-medium text-gray-700">{label}</span>
                      <span className="font-bold text-gray-900">{count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`${color} h-2.5 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-6">No sessions recorded yet</p>
            )}

            {topDistrict && (
              <div className="mt-4 bg-teal-50 border border-teal-100 rounded-lg md:rounded-xl p-3">
                <p className="text-xs text-teal-600 font-semibold uppercase tracking-wide">Top District</p>
                <p className="font-bold text-teal-800 mt-0.5 text-sm">{topDistrict.name}</p>
                <p className="text-teal-600 text-xs">{topDistrict.count} sessions</p>
              </div>
            )}
          </div>

          {/* Health Tip */}
          <div className="rounded-xl md:rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-600 p-4 md:p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl md:text-2xl">{tip.icon}</span>
                <span className="text-white/80 text-xs font-semibold uppercase tracking-wide">Health Tip of the Day</span>
              </div>
              <p className="text-white text-xs md:text-sm leading-relaxed font-medium">{tip.tip}</p>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-white/60 text-xs">Powered by HealthSaathi AI</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coverage summary */}
        {stats.districts && stats.districts.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Coverage Summary</h3>
              <span className="text-xs text-teal-600 font-semibold bg-teal-50 px-3 py-1 rounded-full">
                {stats.districts.length} / 77 Districts
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-2">
              {stats.districts.map((d) => {
                const intensity = total > 0 ? d.count / total : 0;
                const opacity   = Math.max(0.2, Math.min(1, intensity * 5));
                return (
                  <div
                    key={d.name}
                    title={`${d.name}: ${d.count} sessions`}
                    className="rounded-lg p-2 text-center cursor-default hover:scale-105 transition-transform duration-150"
                    style={{ backgroundColor: `rgba(13, 148, 136, ${opacity})` }}
                  >
                    <p className="text-xs font-bold text-white truncate leading-none">{d.name.slice(0, 3)}</p>
                    <p className="text-white/80 text-xs mt-0.5">{d.count}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
