import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../context/AppContext';

// Fix Leaflet default icon paths broken by Vite bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

function RecenterMap({ lat, lng, zoom = 13 }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.setView([lat, lng], zoom);
  }, [lat, lng, zoom, map]);
  return null;
}


function extractLatLng(post) {
  // Added a quick safety check to support your direct lat/lng format too
  if (post?.lat != null && post?.lng != null) {
    return { lat: Number(post.lat), lng: Number(post.lng) };
  }

  const centroid = post?.centroid;

  if (Array.isArray(centroid) && centroid.length >= 2) {
    const first = Number(centroid[0]);
    const second = Number(centroid[1]);
    if (Number.isFinite(first) && Number.isFinite(second)) {
      if (Math.abs(first) <= 90 && Math.abs(second) <= 180) {
        return { lat: first, lng: second };
      }
      return { lat: second, lng: first };
    }
  }

  if (centroid && typeof centroid === 'object') {
    const lat = Number(centroid.lat ?? centroid.latitude);
    const lng = Number(centroid.lng ?? centroid.lon ?? centroid.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  return null;
}


function HospitalMarker({ post, point, isTarget }) {
  const markerRef = useRef(null);

  useEffect(() => {
    if (isTarget && markerRef.current) {
      setTimeout(() => {
        markerRef.current.openPopup();
      }, 200); 
    }
  }, [isTarget]);

  return (
    <Marker position={[point.lat, point.lng]} icon={hospitalIcon} ref={markerRef}>
      <Popup>
        <strong>{post.name}</strong><br />
        {post.distance_km != null && <span>📍 {post.distance_km.toFixed(1)} km away</span>}
      </Popup>
    </Marker>
  );
}


export default function HealthMap({ posts = [], targetHospital = null }) {
  const { t, location } = useApp();

  let centerLat = 27.7172; // Default Kathmandu
  let centerLng = 85.3240;
  let zoomLevel = 13;

  
  const targetPoint = targetHospital ? extractLatLng(targetHospital) : null;

  if (targetPoint) {
    centerLat = targetPoint.lat;
    centerLng = targetPoint.lng;
    zoomLevel = 16;
  } else if (location?.lat && location?.lng) {
    centerLat = location.lat;
    centerLng = location.lng;
  }

  const allPosts = [...posts];
  
  if (targetHospital && targetPoint) {
    // Check if the target hospital is already in the list using the safely extracted points
    const isAlreadyIncluded = allPosts.some(p => {
       const pPoint = extractLatLng(p);
       return pPoint && pPoint.lat === targetPoint.lat && pPoint.lng === targetPoint.lng;
    });
    
    if (!isAlreadyIncluded) {
      allPosts.push(targetHospital);
    }
  }

  return (
    <MapContainer center={[centerLat, centerLng]} zoom={zoomLevel} className="w-full h-full rounded-xl z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <RecenterMap lat={centerLat} lng={centerLng} zoom={zoomLevel} />

      {location && (
        <Marker position={[location.lat, location.lng]} icon={userIcon}>
          <Popup>
            <strong>{t.map.yourLocation}</strong><br />
            {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </Popup>
        </Marker>
      )}

      {allPosts.map((post, idx) => {
        
        const point = extractLatLng(post);
        if (!point) return null;
        
        // Check if this specific marker matches your chat target
        const isTarget = targetPoint && 
                         targetPoint.lat === point.lat && 
                         targetPoint.lng === point.lng;

        return (
          <HospitalMarker 
            key={idx} 
            post={post} 
            point={point}
            isTarget={isTarget} 
          />
        );
      })}

      {/* Legend */}
      <div className="absolute bottom-6 left-6 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 max-w-xs">
        <h4 className="font-bold text-gray-900 text-sm mb-3">Map Legend</h4>
        <div className="space-y-2">
          {/* Blue marker - Your location */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">●</div>
            <span className="text-xs text-gray-700 font-medium">Your Location</span>
          </div>
          {/* Red marker - Healthcare facilities */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">●</div>
            <span className="text-xs text-gray-700 font-medium">Healthcare Facility</span>
          </div>
          {/* Hospital info */}
          <div className="border-t border-gray-200 pt-2 mt-2">
            <p className="text-xs text-gray-600">📍 Click markers to see details</p>
          </div>
        </div>
      </div>
    </MapContainer>
  );
}
