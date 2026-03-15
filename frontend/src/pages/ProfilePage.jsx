import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import apiClient from '../services/api';

export default function ProfilePage() {
  const { t, user } = useApp();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [healthHistory, setHealthHistory] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReport: true,
  });
  const [formData, setFormData] = useState({
    firstName: user?.name || '',
    email: user?.email || '',
    phone: '',
    dateOfBirth: '',
    bloodType: '',
  });

  useEffect(() => {
    // Load profile data from backend when component mounts
    const loadProfile = async () => {
      try {
        const response = await apiClient.get('/profile/');
        setFormData(prev => ({
          ...prev,
          phone: response.data?.phone_number || '',
          bloodType: response.data?.blood_group || '',
        }));
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };
    
    // Fetch health history on mount so stats always have data
    const loadHistory = async () => {
      try {
        const response = await apiClient.get('/history/');
        setHealthHistory(response.data || []);
      } catch (error) {
        console.error('Failed to fetch health history:', error);
      }
    };
    
    loadProfile();
    loadHistory();
  }, []);

  useEffect(() => {
    if (activeTab === 'health') {
      fetchHealthHistory();
    }
  }, [activeTab]);

  const fetchHealthHistory = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/history/');
      setHealthHistory(response.data || []);
    } catch (error) {
      console.error('Failed to fetch health history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const profileData = {
        phone_number: formData.phone,
        blood_group: formData.bloodType,
      };
      
      const response = await apiClient.put('/profile/', profileData);
      
      // Update local state with saved data
      setFormData(prev => ({
        ...prev,
        phone: response.data?.phone_number || prev.phone,
        bloodType: response.data?.blood_group || prev.bloodType,
      }));
      
      setEditMode(false);
      alert(t.common?.success || 'Profile updated successfully!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert(error.response?.data?.error || t.errors?.saveFailed || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <div className="bg-white border-b border-teal-100 px-8 py-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t.profile.title}</h1>
            <p className="text-gray-600 text-sm mt-1">{t.profile.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-teal-100 px-8">
        <div className="flex gap-8">
          {[
            { id: 'account', label: t.profile.accountTab, icon: '👤' },
            { id: 'health', label: t.profile.healthTab, icon: '📋' },
            { id: 'settings', label: t.profile.settingsTab, icon: '⚙️' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-2 border-b-2 font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-600 hover:text-teal-600'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* ─── Account Tab ─── */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              {/* Profile Overview Card */}
              <div className="card-light">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{t.profile.accountInformation}</h2>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      editMode
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'btn-secondary'
                    }`}
                  >
                    {editMode ? t.profile.cancel : t.profile.edit}
                  </button>
                </div>

                {editMode ? (
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{t.profile.firstName}</label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{t.profile.email}</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{t.profile.phone}</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="input-field"
                          placeholder="+977..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{t.profile.dateOfBirth}</label>
                        <input
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{t.profile.bloodType}</label>
                        <select
                          value={formData.bloodType}
                          onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                          className="input-field"
                        >
                          <option value="">Select Blood Type</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button 
                        type="submit" 
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        disabled={loading}
                      >
                        {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {t.profile.saveButton}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditMode(false)}
                        disabled={loading}
                        className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t.profile.cancel}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{t.profile.firstName}</p>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{formData.firstName || t.profile.notProvided}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{t.profile.email}</p>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{formData.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{t.profile.phone}</p>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{formData.phone || t.profile.notProvided}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{t.profile.bloodType}</p>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{formData.bloodType || t.profile.notProvided}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Account Stats */}
              <div className="grid grid-cols-2 gap-4">
                {(() => {
                  // Calculate days since registration
                  const userDateJoined = user?.date_joined ? new Date(user.date_joined) : null;
                  const daysAgo = userDateJoined ? Math.floor((Date.now() - userDateJoined.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                  
                  const getDaysText = (days) => {
                    if (days === 0) return 'Today';
                    if (days === 1) return '1 day ago';
                    if (days < 30) return `${days} days ago`;
                    if (days < 365) {
                      const months = Math.floor(days / 30);
                      return months === 1 ? '1 month ago' : `${months} months ago`;
                    }
                    const years = Math.floor(days / 365);
                    return years === 1 ? '1 year ago' : `${years} years ago`;
                  };

                  return [
                    { label: t.profile.consultations, value: healthHistory.length, icon: '🩺' },
                    { label: t.profile.joined, value: getDaysText(daysAgo), icon: '📅' },
                  ].map((stat, idx) => (
                    <div key={idx} className="card-light flex items-center gap-4">
                      <div className="text-4xl">{stat.icon}</div>
                      <div>
                        <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">{stat.label}</p>
                        <p className="text-lg font-bold text-teal-600 mt-1">{stat.value}</p>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* ─── Health History Tab ─── */}
          {activeTab === 'health' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.profile.healthConsultationHistory}</h2>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin" />
                </div>
              ) : healthHistory.length === 0 ? (
                <div className="card-light text-center py-12">
                  <p className="text-gray-600 text-lg">{t.profile.noHistory}</p>
                  <p className="text-gray-500 text-sm mt-2">{t.profile.healthHistoryEmpty}</p>
                </div>
              ) : (
                <div className="overflow-x-auto pb-2">
                  <div className="flex gap-4 min-w-min">
                    {healthHistory.map((session, idx) => (
                      <div key={idx} className="flex-shrink-0 w-80 bg-white rounded-2xl border border-teal-100 p-5 hover:shadow-lg hover:border-teal-300 transition-all cursor-pointer">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <p className="text-xs text-gray-600 font-medium">{new Date(session.created_at).toLocaleDateString()}</p>
                            <p className="text-xs text-gray-500 mt-1">{new Date(session.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                            session.risk_level === 'HIGH'
                              ? 'badge-high'
                              : session.risk_level === 'MEDIUM'
                              ? 'badge-medium'
                              : 'badge-low'
                          }`}>
                            {session.risk_level}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">{t.profile.district}</p>
                            <p className="text-sm font-semibold text-gray-900 mt-1">{session.district || t.profile.generalCheck}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">{t.profile.symptoms}</p>
                            <p className="text-sm text-gray-700 mt-1 line-clamp-2">{session.symptoms}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Settings Tab ─── */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.profile.settingsPreferences}</h2>

              {/* Notifications */}
              <div className="card-light">
                <h3 className="text-xl font-bold text-gray-900 mb-6">{t.profile.notifications}</h3>
                <div className="space-y-4">
                  {[
                    {
                      key: 'emailNotifications',
                      label: t.profile.emailNotifications,
                      desc: t.profile.receiveUpdates,
                      icon: '📧'
                    },
                    {
                      key: 'pushNotifications',
                      label: t.profile.pushNotifications,
                      desc: t.profile.getInstantAlerts,
                      icon: '🔔'
                    },
                    {
                      key: 'weeklyReport',
                      label: t.profile.weeklyReport,
                      desc: t.profile.weeklyHealthReport,
                      icon: '📊'
                    },
                  ].map(({ key, label, desc, icon }) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-white rounded-xl border border-teal-100 hover:border-teal-300 transition-all">
                      <div className="flex items-start gap-4">
                        <span className="text-2xl">{icon}</span>
                        <div>
                          <p className="font-semibold text-gray-900">{label}</p>
                          <p className="text-sm text-gray-600 mt-1">{desc}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleNotificationChange(key)}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-200 flex-shrink-0 ${
                          notifications[key] ? 'bg-teal-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                            notifications[key] ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy & Security */}
              <div className="card-light">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Privacy & Security</h3>
                <div className="space-y-4">
                  <button className="w-full p-4 bg-white rounded-xl border border-teal-100 hover:border-teal-300 text-left transition-all group hover:bg-teal-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🔐</span>
                        <div>
                          <p className="font-semibold text-gray-900">Change Password</p>
                          <p className="text-sm text-gray-600 mt-1">Update your account password securely</p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-teal-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                  <button className="w-full p-4 bg-white rounded-xl border border-teal-100 hover:border-teal-300 text-left transition-all group hover:bg-teal-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🛡️</span>
                        <div>
                          <p className="font-semibold text-gray-900">Two-Factor Authentication</p>
                          <p className="text-sm text-gray-600 mt-1">Add an extra layer of security</p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-teal-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="card-light border-red-200 bg-red-50">
                <h3 className="text-xl font-bold text-red-900 mb-6">Danger Zone</h3>
                <button className="w-full p-4 bg-red-100 rounded-xl border border-red-300 hover:border-red-400 text-left transition-all group hover:bg-red-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🗑️</span>
                      <div>
                        <p className="font-semibold text-red-900">Delete Account</p>
                        <p className="text-sm text-red-700 mt-1">Permanently delete your account and all data</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-red-600 group-hover:text-red-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
