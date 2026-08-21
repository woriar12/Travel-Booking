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
  if (!user) return { 'Content-Type': 'application/json' };
  return {
    'Content-Type': 'application/json',
    'x-user-id': user.id,
    'x-user-role': user.role
  };
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
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch destinations');
    return data;
  } catch (err) {
    console.error('API Error (fetchDestinations):', err);
    throw err;
  }
};

export const fetchDestinationById = async (id) => {
  try {
    const res = await fetch(`${API_BASE}/destinations/${id}`, defaultOptions());
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch destination');
    return data;
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
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create destination');
    return data;
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
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update destination');
    return data;
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
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update destination offer');
    return data;
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
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete destination');
    return data;
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
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create booking');
    return data;
  } catch (err) {
    console.error('API Error (createBooking):', err);
    throw err;
  }
};

export const fetchBookings = async () => {
  try {
    const res = await fetch(`${API_BASE}/bookings`, defaultOptions());
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch bookings');
    return data;
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
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch booking stats');
    return data;
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
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update booking status');
    return data;
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
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
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
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data;
  } catch (err) {
    console.error('API Error (loginUser):', err);
    throw err;
  }
};

export const logoutUser = async () => {
  try {
    const res = await fetch(`${API_BASE}/auth/logout`, defaultOptions({
      method: 'POST'
    }));
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('API Error (logoutUser):', err);
  }
};

export const fetchMe = async () => {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, defaultOptions());
    const data = await res.json();
    if (!res.ok) return null;
    return data;
  } catch (err) {
    return null;
  }
};

export const fetchAllUsers = async () => {
  try {
    const res = await fetch(`${API_BASE}/auth/users`, defaultOptions({
      headers: authHeaders(),
    }));
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch users');
    return data;
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
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch offers');
    return data;
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
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create offer');
    return data;
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
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Invalid promo code');
    return data;
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
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete offer');
    return data;
  } catch (err) {
    console.error('API Error (deleteOffer):', err);
    throw err;
  }
};
