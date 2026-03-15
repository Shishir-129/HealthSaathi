import apiClient from './api';

/**
 * User login
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Response with user data and token
 */
export async function login(email, password) {
  try {
    const payload = { email, password };
    const response = await apiClient.post('/auth/login/', payload);
    return response.data;
  } catch (error) {
    console.error('login error:', error);
    throw error;
  }
}

/**
 * User registration
 * @param {string} name - User full name
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Response with user data and token
 */
export async function register(name, email, password) {
  try {
    const payload = { 
      name,
      email, 
      password,
      confirm_password: password
    };
    const response = await apiClient.post('/auth/register/', payload);
    return response.data;
  } catch (error) {
    console.error('register error:', error);
    throw error;
  }
}

/**
 * Submit triage symptoms to backend AI for analysis
 * @param {string} symptoms - Patient's symptom description
 * @param {number} lat - Latitude (optional)
 * @param {number} lng - Longitude (optional)
 * @param {AbortSignal} signal - AbortSignal for request cancellation (optional)
 * @param {string} conversationId - Conversation ID to group multiple symptoms (optional)
 * @param {string} district - District/city name from reverse geocoding (optional)
 * @returns {Promise<Object>} Triage result with risk, advice, dos/donts, etc.
 */
export async function submitTriage(symptoms, lat = null, lng = null, signal = null, conversationId = null, district = null) {
  try {
    // Generate a unique session ID for each submission
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const payload = {
      symptoms,
      lat: lat ?? null,
      lng: lng ?? null,
      district: district || '',
      session_id: sessionId,
      conversation_id: conversationId,
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

/**
 * Delete a consultation by session ID
 * @param {string} sessionId - The session ID to delete
 * @returns {Promise<Object>} Response message
 */
export async function deleteConsultation(sessionId) {
  try {
    const response = await apiClient.delete('/history/', {
      params: { session_id: sessionId }
    });
    return response.data;
  } catch (error) {
    console.error('deleteConsultation error:', error);
    throw error;
  }
}
