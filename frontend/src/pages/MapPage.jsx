import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import HealthMap from '../components/HealthMap';
import { getHealthPosts } from '../services/triageService';

export default function MapPage() {
  const { t, location: userLocation, recommendedFacilities, recommendedFacilityType } = useApp();
  const routerLocation = useLocation();
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const targetHospital = routerLocation.state?.targetHospital || null;

  useEffect(() => {
    if (Array.isArray(recommendedFacilities) && recommendedFacilities.length > 0) {
      setPosts(recommendedFacilities);
      return;
    }
    setLoading(true);
    getHealthPosts(userLocation?.lat ?? null, userLocation?.lng ?? null, recommendedFacilityType || 'clinic', 10)
      .then(data  => { setPosts(Array.isArray(data) ? data : (data.posts || [])); setLoading(false); })
      .catch(() => { setError(t.errors.fetchFailed); setLoading(false); });
  }, [userLocation, recommendedFacilities, recommendedFacilityType, t.errors.fetchFailed]);

  const facilityTypeColors = {
    hospital: 'bg-red-100 text-red-700 border-red-200',
    pharmacy: 'bg-amber-100 text-amber-700 border-amber-200',
    clinic:   'bg-teal-100 text-teal-700 border-teal-200',
  };

  const typeColor = facilityTypeColors[recommendedFacilityType] || facilityTypeColors.clinic;

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* ── Map header ── */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-lg">
            🗺️
          </div>
          <div>
            <h2 className="font-bold text-gray-900">{t.map.title}</h2>
            {posts.length > 0 && !loading && (
              <p className="text-xs text-gray-400 mt-0.5">
                {posts.length} {t.map.facilitiesFound}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {loading && (
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">{t.map.loading}</span>
            </div>
          )}
          {recommendedFacilityType && (
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border capitalize ${typeColor}`}>
              📍 {recommendedFacilityType}s
            </span>
          )}
        </div>
      </div>

      {/* Alerts */}
      {!userLocation && !targetHospital && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs text-amber-700 font-medium">{t.map.noLocation}</p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Map */}
      <div className="flex-1">
        <HealthMap posts={posts} targetHospital={targetHospital} />
      </div>
    </div>
  );
}
