import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { login as authLogin } from '../services/triageService';

export default function LoginPage() {
  const { t } = useApp();
  const navigate = useNavigate();
  const { login } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getErrorMessage = (errorData) => {
    if (typeof errorData === 'string') return errorData;
    if (typeof errorData === 'object' && errorData !== null) {
      const firstField = Object.keys(errorData)[0];
      if (firstField && Array.isArray(errorData[firstField])) return errorData[firstField][0];
      if (errorData.error) return typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
      return Object.values(errorData).flat()[0] || 'An error occurred';
    }
    return 'Login failed. Please try again.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError(t.auth?.emptyFieldError || 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const response = await authLogin(email, password);
      login(
        { id: response.user.id, name: response.user.first_name || response.user.username, email: response.user.email },
        response.token
      );
      navigate('/chat');
    } catch (err) {
      setError(getErrorMessage(err.response?.data));
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Patients Helped', value: '12,400+' },
    { label: 'Districts Covered', value: '77' },
    { label: 'Accuracy Rate', value: '94%' },
  ];

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* ── Left decorative panel ── */}
      <div className="hidden lg:flex flex-col w-[52%] relative overflow-hidden bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900">
        {/* Animated blobs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-32 right-10 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-600/15 rounded-full blur-2xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-12 justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-glow-teal">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-xl">HealthSathi</p>
              <p className="text-teal-400 text-xs">Powered by AI</p>
            </div>
          </div>

          {/* Hero text */}
          <div className="space-y-6">
            <div>
              <h1 className="text-5xl font-bold text-white leading-tight">
                Your AI<br />
                <span className="text-gradient bg-gradient-to-r from-teal-400 to-cyan-300">Health Companion</span>
              </h1>
              <p className="mt-4 text-slate-300 text-lg leading-relaxed max-w-sm">
                Instant symptom triage, nearby health facility discovery, and personalized medical guidance — all in one platform.
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {['🩺 AI Triage', '📍 Facility Map', '🌐 Multilingual', '⚡ Instant Results'].map(f => (
                <span key={f} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5 text-white/80 text-sm">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-4">
            {stats.map(({ label, value }) => (
              <div key={label} className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                <p className="text-3xl font-bold text-white">{value}</p>
                <p className="text-slate-400 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile brand (hidden on lg) */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">HealthSathi</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">{t.auth?.loginTitle || 'Welcome back'}</h2>
            <p className="text-gray-500 mt-2">{t.auth?.loginSubtitle || 'Sign in to continue to your dashboard'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {t.auth?.emailLabel || 'Email address'}
              </label>
              <div className="relative">
                <svg className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t.auth?.emailPlaceholder || 'your@email.com'}
                  className="input-field pl-11"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {t.auth?.passwordLabel || 'Password'}
              </label>
              <div className="relative">
                <svg className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t.auth?.passwordPlaceholder || '••••••••'}
                  className="input-field pl-11 pr-11"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-14-14zM10 3c4.478 0 8.268 2.943 9.542 7a10.016 10.016 0 01-1.99 3.542M3.458 10C4.732 5.943 8.522 3 13 3" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t.auth?.loggingIn || 'Signing in…'}
                </>
              ) : (
                <>
                  {t.auth?.loginButton || 'Sign in'}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="text-gray-500 text-sm text-center mt-6">
            {t.auth?.noAccount || "Don't have an account?"}{' '}
            <Link to="/register" className="text-teal-600 font-semibold hover:text-teal-700 transition-colors">
              {t.auth?.registerLink || 'Create account'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
