import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import translations from '../i18n/translations';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [lang, setLang] = useState('en');
  const [location, setLocation] = useState(null); // { lat, lng, accuracy }
  const [locationError, setLocationError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recommendedFacilityType, setRecommendedFacilityType] = useState(null);
  const [recommendedFacilities, setRecommendedFacilities] = useState([]);
  
  // Auth state
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const t = translations[lang];

  // Initialize auth from localStorage on mount
  useEffect(() => {
    const storedToken = sessionStorage.getItem('nc_token') || localStorage.getItem('nc_token');
    const storedUser = sessionStorage.getItem('nc_user') || localStorage.getItem('nc_user');
    
    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
        setIsAuthenticated(true);
        sessionStorage.setItem('nc_token', storedToken);
        sessionStorage.setItem('nc_user', JSON.stringify(userData));
        localStorage.removeItem('nc_token');
        localStorage.removeItem('nc_user');
      } catch (err) {
        console.error('Failed to restore auth from storage:', err);
        sessionStorage.removeItem('nc_token');
        sessionStorage.removeItem('nc_user');
        localStorage.removeItem('nc_token');
        localStorage.removeItem('nc_user');
      }
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'en' ? 'np' : 'en'));
  }, []);

  const addMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, { id: Date.now(), ...msg }]);
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  // Auth functions
  const login = useCallback((userData, authToken) => {
    // Clear previous user's session data
    setMessages([]);
    setLocation(null);
    setLocationError(null);
    setRecommendedFacilityType(null);
    setRecommendedFacilities([]);
    
    // Set new user auth
    setUser(userData);
    setToken(authToken);
    setIsAuthenticated(true);
    sessionStorage.setItem('nc_token', authToken);
    sessionStorage.setItem('nc_user', JSON.stringify(userData));
    localStorage.removeItem('nc_token');
    localStorage.removeItem('nc_user');
  }, []);

  const logout = useCallback(() => {
    // Clear all session data
    setMessages([]);
    setLocation(null);
    setLocationError(null);
    setRecommendedFacilityType(null);
    setRecommendedFacilities([]);
    
    // Clear auth
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('nc_token');
    sessionStorage.removeItem('nc_user');
    localStorage.removeItem('nc_token');
    localStorage.removeItem('nc_user');
  }, []);

  return (
    <AppContext.Provider
      value={{
        lang, toggleLang, t,
        location, setLocation,
        locationError, setLocationError,
        locationLoading, setLocationLoading,
        messages, addMessage, clearMessages,
        loading, setLoading,
        recommendedFacilityType,
        setRecommendedFacilityType,
        recommendedFacilities,
        setRecommendedFacilities,
        user, token, isAuthenticated,
        login, logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
