const API_BASE = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '') + '/api';

export const fetchDestinations = async (category = '', search = '') => {
  try {
    const query = new URLSearchParams();
    if (category && category !== 'All') query.append('category', category);
    if (search) query.append('search', search);

    const res = await fetch(`${API_BASE}/destinations?${query.toString()}`);
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
    const res = await fetch(`${API_BASE}/destinations/${id}`);
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
    const res = await fetch(`${API_BASE}/destinations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(destinationData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create destination');
    return data;
  } catch (err) {
    console.error('API Error (createDestination):', err);
    throw err;
  }
};

export const createBooking = async (bookingData) => {
  try {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData),
    });
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
    const res = await fetch(`${API_BASE}/bookings`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch bookings');
    return data;
  } catch (err) {
    console.error('API Error (fetchBookings):', err);
    throw err;
  }
};

export const registerUser = async (credentials) => {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
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
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data;
  } catch (err) {
    console.error('API Error (loginUser):', err);
    throw err;
  }
};
