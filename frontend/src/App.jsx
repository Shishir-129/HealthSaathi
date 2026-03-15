import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/AppContext';
import LanguageToggle from './components/LanguageToggle';
import ChatPage from './pages/ChatPage';
import MapPage from './pages/MapPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useApp();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ collapsed, onToggle }) {
  const { t, user, logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/chat',
      label: t.nav.chat,
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      to: '/map',
      label: t.nav.map,
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
    },
    {
      to: '/dashboard',
      label: t.nav.dashboard,
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      to: '/profile',
      label: 'My Profile',
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <aside
      className={`flex flex-col h-screen bg-gradient-to-b from-teal-900 to-slate-800 border-r border-teal-700/50 transition-all duration-300 flex-shrink-0 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-teal-700/50">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white font-bold text-base leading-tight">HealthSaathi</p>
            <p className="text-teal-300 text-xs font-semibold">AI Health Companion</p>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive
                ? `flex items-center gap-3 px-3 py-2.5 rounded-xl text-white bg-gradient-to-r from-teal-500 to-emerald-500 font-semibold shadow-md transition-all duration-200 ${collapsed ? 'justify-center' : ''}`
                : `flex items-center gap-3 px-3 py-2.5 rounded-xl text-teal-200 hover:text-white hover:bg-teal-700/40 font-medium transition-all duration-200 ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            {icon}
            {!collapsed && <span className="text-sm">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-teal-700/50 pt-3 space-y-2">
        {/* Language toggle */}
        {!collapsed && (
          <div className="px-1">
            <LanguageToggle />
          </div>
        )}

        {/* User info */}
        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl bg-teal-700/40 border border-teal-600/50 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-teal-100 text-sm font-medium truncate">{user?.name || user?.email}</p>
              <p className="text-teal-300/80 text-xs truncate font-medium">{user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              title="Logout"
              className="text-teal-300 hover:text-red-400 transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-teal-300 hover:text-white hover:bg-teal-700/40 transition-all duration-200 text-xs font-medium ${collapsed ? 'justify-center' : ''}`}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

// ─── Top Bar ─────────────────────────────────────────────────────────────────
function TopBar() {
  const { t } = useApp();

  const pageTitles = {
    '/chat':      { title: 'AI Health Chat', sub: 'Describe your symptoms for instant triage' },
    '/map':       { title: 'Health Map',     sub: 'Find nearby healthcare facilities'          },
    '/dashboard': { title: 'Analytics Dashboard', sub: 'Health statistics and insights'        },
  };

  const path = window.location.pathname;
  const page = pageTitles[path] || { title: 'HealthSathi', sub: '' };

  return (
    <header className="h-16 bg-white border-b border-teal-200 flex items-center justify-between px-6 flex-shrink-0 shadow-sm">
      <div>
        <h2 className="text-gray-900 font-bold text-lg leading-tight">{page.title}</h2>
        {page.sub && <p className="text-teal-600 text-xs mt-0.5 font-medium">{page.sub}</p>}
      </div>
      <div className="flex items-center gap-3">
        {/* Status pill */}
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 rounded-full px-3 py-1.5 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-700 text-xs font-semibold">System Online</span>
        </div>
        {/* Date */}
        <span className="text-teal-600 text-xs font-medium">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>
    </header>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
function AppShell() {
  const { isAuthenticated } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*"         element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/chat"      element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/map"       element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/profile"   element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/profile"   element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="*"          element={<Navigate to="/chat" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </BrowserRouter>
  );
}
