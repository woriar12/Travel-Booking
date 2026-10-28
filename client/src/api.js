const API_BASE = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '') + '/api';

// Common fetch options helper to send session cookie automatically
const defaultOptions = (options = {}) => ({
  ...options,
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }
});

// Helper: safe response parser
const parseResponse = async (res, defaultErrorMessage = 'Request failed') => {
  let data = null;
  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await res.text();
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }
      }
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const errorMsg =
      data?.message ||
      (res.status === 500 || res.status === 503
        ? 'Backend server is not running on port 5000. Please start the backend server (cd server && npm run dev).'
        : defaultErrorMessage);
    throw new Error(errorMsg);
  }

  return data;
};

// Helper: get current user from localStorage
const getCurrentUser = () => {
  try {
    const saved = localStorage.getItem('travel_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

// Helper: build auth headers
const authHeaders = () => {
  const user = getCurrentUser();
  const token = localStorage.getItem('travel_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (user) {
    headers['x-user-id'] = user.id;
    headers['x-user-role'] = user.role;
  }
  return headers;
};

// =============================================
// DESTINATIONS API
// =============================================

export const fetchDestinations = async (category = '', search = '') => {
  try {
    const query = new URLSearchParams();
    if (category && category !== 'All') query.append('category', category);
    if (search) query.append('search', search);

    const res = await fetch(`${API_BASE}/destinations?${query.toString()}`, defaultOptions());
    return await parseResponse(res, 'Failed to fetch destinations');
  } catch (err) {
    console.error('API Error (fetchDestinations):', err);
    throw err;
  }
};

export const fetchDestinationById = async (id) => {
  try {
    const res = await fetch(`${API_BASE}/destinations/${id}`, defaultOptions());
    return await parseResponse(res, 'Failed to fetch destination');
  } catch (err) {
    console.error('API Error (fetchDestinationById):', err);
    throw err;
  }
};

export const createDestination = async (destinationData) => {
  try {
    const res = await fetch(`${API_BASE}/destinations`, defaultOptions({
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(destinationData),
    }));
    return await parseResponse(res, 'Failed to create destination');
  } catch (err) {
    console.error('API Error (createDestination):', err);
    throw err;
  }
};

export const updateDestination = async (id, destinationData) => {
  try {
    const res = await fetch(`${API_BASE}/destinations/${id}`, defaultOptions({
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(destinationData),
    }));
    return await parseResponse(res, 'Failed to update destination');
  } catch (err) {
    console.error('API Error (updateDestination):', err);
    throw err;
  }
};

export const updateDestinationOffer = async (id, offerData) => {
  try {
    const res = await fetch(`${API_BASE}/destinations/${id}/offer`, defaultOptions({
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(offerData),
    }));
    return await parseResponse(res, 'Failed to update destination offer');
  } catch (err) {
    console.error('API Error (updateDestinationOffer):', err);
    throw err;
  }
};

export const deleteDestination = async (id) => {
  try {
    const res = await fetch(`${API_BASE}/destinations/${id}`, defaultOptions({
      method: 'DELETE',
      headers: authHeaders(),
    }));
    return await parseResponse(res, 'Failed to delete destination');
  } catch (err) {
    console.error('API Error (deleteDestination):', err);
    throw err;
  }
};

// =============================================
// BOOKINGS API
// =============================================

export const createBooking = async (bookingData) => {
  try {
    const res = await fetch(`${API_BASE}/bookings`, defaultOptions({
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(bookingData),
    }));
    return await parseResponse(res, 'Failed to create booking');
  } catch (err) {
    console.error('API Error (createBooking):', err);
    throw err;
  }
};

export const fetchBookings = async () => {
  try {
    const res = await fetch(`${API_BASE}/bookings`, defaultOptions({
      headers: authHeaders(),
    }));
    return await parseResponse(res, 'Failed to fetch bookings');
  } catch (err) {
    console.error('API Error (fetchBookings):', err);
    throw err;
  }
};

export const fetchBookingStats = async () => {
  try {
    const res = await fetch(`${API_BASE}/bookings/stats`, defaultOptions({
      headers: authHeaders(),
    }));
    return await parseResponse(res, 'Failed to fetch booking stats');
  } catch (err) {
    console.error('API Error (fetchBookingStats):', err);
    throw err;
  }
};

export const updateBookingStatus = async (id, status) => {
  try {
    const res = await fetch(`${API_BASE}/bookings/${id}/status`, defaultOptions({
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    }));
    return await parseResponse(res, 'Failed to update booking status');
  } catch (err) {
    console.error('API Error (updateBookingStatus):', err);
    throw err;
  }
};

// =============================================
// AUTH API
// =============================================

export const registerUser = async (credentials) => {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, defaultOptions({
      method: 'POST',
      body: JSON.stringify(credentials),
    }));
    const data = await parseResponse(res, 'Registration failed');
    if (data?.token) {
      localStorage.setItem('travel_token', data.token);
    }
    return data;
  } catch (err) {
    console.error('API Error (registerUser):', err);
    throw err;
  }
};

export const loginUser = async (credentials) => {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, defaultOptions({
      method: 'POST',
      body: JSON.stringify(credentials),
    }));
    const data = await parseResponse(res, 'Login failed');
    if (data?.token) {
      localStorage.setItem('travel_token', data.token);
    }
    return data;
  } catch (err) {
    console.error('API Error (loginUser):', err);
    throw err;
  }
};

export const logoutUser = async () => {
  try {
    localStorage.removeItem('travel_token');
    const res = await fetch(`${API_BASE}/auth/logout`, defaultOptions({
      method: 'POST'
    }));
    return await parseResponse(res, 'Logout failed');
  } catch (err) {
    console.error('API Error (logoutUser):', err);
  }
};

export const fetchMe = async () => {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, defaultOptions());
    return await parseResponse(res, 'Failed to fetch session');
  } catch (err) {
    return null;
  }
};

export const fetchAllUsers = async () => {
  try {
    const res = await fetch(`${API_BASE}/auth/users`, defaultOptions({
      headers: authHeaders(),
    }));
    return await parseResponse(res, 'Failed to fetch users');
  } catch (err) {
    console.error('API Error (fetchAllUsers):', err);
    throw err;
  }
};

// =============================================
// OFFERS API
// =============================================

export const fetchOffers = async () => {
  try {
    const res = await fetch(`${API_BASE}/offers`, defaultOptions());
    return await parseResponse(res, 'Failed to fetch offers');
  } catch (err) {
    console.error('API Error (fetchOffers):', err);
    throw err;
  }
};

export const createOffer = async (offerData) => {
  try {
    const res = await fetch(`${API_BASE}/offers`, defaultOptions({
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(offerData),
    }));
    return await parseResponse(res, 'Failed to create offer');
  } catch (err) {
    console.error('API Error (createOffer):', err);
    throw err;
  }
};

export const validateOffer = async (code, totalAmount) => {
  try {
    const res = await fetch(`${API_BASE}/offers/validate`, defaultOptions({
      method: 'POST',
      body: JSON.stringify({ code, totalAmount, bookingAmount: totalAmount }),
    }));
    return await parseResponse(res, 'Invalid promo code');
  } catch (err) {
    console.error('API Error (validateOffer):', err);
    throw err;
  }
};

export const deleteOffer = async (id) => {
  try {
    const res = await fetch(`${API_BASE}/offers/${id}`, defaultOptions({
      method: 'DELETE',
      headers: authHeaders(),
    }));
    return await parseResponse(res, 'Failed to delete offer');
  } catch (err) {
    console.error('API Error (deleteOffer):', err);
    throw err;
  }
};
