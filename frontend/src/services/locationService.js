export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        const messages = {
          1: 'denied',
          2: 'unavailable',
          3: 'timeout',
        };
        reject(new Error(messages[error.code] || 'unknown'));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

export function watchLocation(onUpdate, onError) {
  if (!navigator.geolocation) {
    onError(new Error('Geolocation not supported'));
    return null;
  }
  const id = navigator.geolocation.watchPosition(
    (pos) => onUpdate({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
    (err) => onError(err),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
  );
  return id;
}

export function clearWatch(watchId) {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
}

// Reverse geocoding: Get place name and city from coordinates using Nominatim (OpenStreetMap)
export async function getPlaceAndCity(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!response.ok) throw new Error('Geocoding failed');
    const data = await response.json();
    
    // Extract city/town and place name
    const address = data.address || {};
    const city = address.city || address.town || address.village || address.county || 'Unknown';
    const place = address.neighbourhood || address.suburb || city;
    
    return { place, city };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return { place: 'Location', city: 'Nepal' };
  }
}
