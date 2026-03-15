import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
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

/**
 * Fetch road route from OSRM (Open Source Routing Machine)
 * Returns array of [lat, lng] coordinates following actual roads
 */
async function fetchRoadRoute(startLat, startLng, endLat, endLng) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      // Convert GeoJSON coordinates to [lat, lng] format for Leaflet
      return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    }
    
    // Fallback to straight line if routing fails
    console.warn('OSRM routing failed, using straight line fallback');
    return [[startLat, startLng], [endLat, endLng]];
  } catch (error) {
    console.error('Route fetch error:', error);
    // Fallback to straight line
    return [[startLat, startLng], [endLat, endLng]];
  }
}


export default function HealthMap({ posts = [], targetHospital = null }) {
  const { t, location } = useApp();
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  let centerLat = 27.7172; // Default Kathmandu
  let centerLng = 85.3240;
  let zoomLevel = 13;

  
  const targetPoint = targetHospital ? extractLatLng(targetHospital) : null;

  // Fetch route when target point changes
  useEffect(() => {
    if (location && targetPoint) {
      fetchRoadRoute(location.lat, location.lng, targetPoint.lat, targetPoint.lng)
        .then(coords => setRouteCoordinates(coords));
    } else {
      setRouteCoordinates([]);
    }
  }, [location, targetPoint]);

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

      {/* Draw route line from user location to target hospital through actual roads */}
      {location && targetPoint && routeCoordinates.length > 0 && (
        <Polyline
          positions={routeCoordinates}
          color="#0284c7"
          weight={8}
          opacity={1}
          lineCap="round"
          lineJoin="round"
        />
      )}
      
      {/* Loading indicator for route */}
      {location && targetPoint && routeCoordinates.length === 0 && (
        <div className="absolute top-6 left-6 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 z-50">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-xs font-medium text-blue-700">Calculating route...</span>
          </div>
        </div>
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

    </MapContainer>
  );
}
