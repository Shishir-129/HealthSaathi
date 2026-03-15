import apiClient from './api';

/**
 * Submit triage symptoms to backend AI for analysis
 * @param {string} symptoms - Patient's symptom description
 * @param {number} lat - Latitude (optional)
 * @param {number} lng - Longitude (optional)
 * @param {AbortSignal} signal - AbortSignal for request cancellation (optional)
 * @returns {Promise<Object>} Triage result with risk, advice, dos/donts, etc.
 */
export async function submitTriage(symptoms, lat = null, lng = null, signal = null) {
  try {
    const payload = {
      symptoms,
      lat: lat ?? null,
      lng: lng ?? null,
      district: '',
      session_id: '',
    };
    
    const config = {};
    if (signal) {
      config.signal = signal;
    }
    
    console.log('📤 submitTriage payload:', payload);
    const response = await apiClient.post('/triage/', payload, config);
    console.log('📥 submitTriage response:', response.data);
    return response.data;
  } catch (error) {
    console.error('submitTriage error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
    throw error;
  }
}

/**
 * Get nearby health posts/facilities
 * @param {number} lat - User latitude
 * @param {number} lng - User longitude
 * @param {string} type - Facility type (hospital, pharmacy, clinic)
 * @param {number} limit - Max results to return
 * @returns {Promise<Array>} List of health facilities
 */
export async function getHealthPosts(lat = null, lng = null, type = null, limit = null) {
  try {
    const params = {};
    if (lat !== null && lng !== null) {
      params.lat = lat;
      params.lon = lng;
    }
    if (type) {
      params.type = type;
    }
    if (limit != null) {
      params.limit = limit;
    }
    
    console.log('📤 getHealthPosts params:', params);
    const response = await apiClient.get('/baato/', { params });
    console.log('📥 getHealthPosts response:', response.data);
    return response.data;
  } catch (error) {
    console.error('getHealthPosts error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
    throw error;
  }
}

/**
 * Get triage statistics from backend
 * @returns {Promise<Object>} Stats with total_sessions, risk_distribution, districts, etc.
 */
export async function getStats() {
  try {
    const response = await apiClient.get('/stats/');
    return response.data;
  } catch (error) {
    console.error('getStats error:', error);
    throw error;
  }
}

/**
 * Get user's triage history (requires authentication)
 * @returns {Promise<Array>} User's triage sessions
 */
export async function getHistory() {
  try {
    const response = await apiClient.get('/history/');
    return response.data;
  } catch (error) {
    console.error('getHistory error:', error);
    throw error;
  }
}
