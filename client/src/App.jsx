import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Search, 
  MapPin, 
  Star, 
  Clock, 
  Calendar, 
  Users, 
  Phone, 
  PlusCircle, 
  User, 
  LogOut, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Briefcase,
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { 
  fetchDestinations, 
  createBooking, 
  fetchBookings, 
  createDestination, 
  registerUser, 
  loginUser 
} from './api';

const CATEGORIES = [
  'All',
  'Hills & Nature',
  'Beach & Fun',
  'Heritage & Culture',
  'Adventure & Snow'
];

export default function App() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Modals state
  const [bookingModalDest, setBookingModalDest] = useState(null);
  const [detailModalDest, setDetailModalDest] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showBookingsDrawer, setShowBookingsDrawer] = useState(false);

  // User Auth State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('tourist_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    travelDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    numberOfGuests: 2,
    contactNumber: '',
    userName: '',
    userEmail: ''
  });

  // Add Destination Form State
  const [addForm, setAddForm] = useState({
    name: '',
    location: '',
    category: 'Hills & Nature',
    price: '',
    rating: '4.8',
    image: '',
    description: '',
    duration: '3 Days / 2 Nights'
  });

  // User Bookings List
  const [bookingsList, setBookingsList] = useState([]);

  // Toast Alerts State
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Load Destinations
  const loadDestinationsData = async () => {
    setLoading(true);
    try {
      const res = await fetchDestinations(selectedCategory, searchQuery);
      if (res.success && res.data) {
        setDestinations(res.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load destinations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDestinationsData();
  }, [selectedCategory, searchQuery]);

  // Load User Bookings
  const loadUserBookingsData = async () => {
    try {
      const res = await fetchBookings();
      if (res.success && res.data) {
        setBookingsList(res.data);
      }
    } catch (err) {
      addToast('Could not fetch bookings list', 'error');
    }
  };

  // Pre-fill booking form with current logged in user
  useEffect(() => {
    if (currentUser) {
      setBookingForm(prev => ({
        ...prev,
        userName: currentUser.name || '',
        userEmail: currentUser.email || ''
      }));
    }
  }, [currentUser]);

  // Handle Booking Submission
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingModalDest) return;

    try {
      const payload = {
        destinationId: bookingModalDest.id,
        travelDate: bookingForm.travelDate,
        numberOfGuests: bookingForm.numberOfGuests,
        contactNumber: bookingForm.contactNumber,
        userName: bookingForm.userName || currentUser?.name || 'Guest Explorer',
        userEmail: bookingForm.userEmail || currentUser?.email || 'guest@example.com'
      };

      const res = await createBooking(payload);
      if (res.success) {
        addToast(`🎉 Tour booked! Ref: ${res.data.id}`, 'success');
        setBookingModalDest(null);
        loadUserBookingsData();
      }
    } catch (err) {
      addToast(err.message || 'Failed to submit booking', 'error');
    }
  };

  // Handle Create Destination
  const handleAddDestinationSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createDestination(addForm);
      if (res.success) {
        addToast('✨ New destination added successfully!', 'success');
        setShowAddModal(false);
        setAddForm({
          name: '',
          location: '',
          category: 'Hills & Nature',
          price: '',
          rating: '4.8',
          image: '',
          description: '',
          duration: '3 Days / 2 Nights'
        });
        loadDestinationsData();
      }
    } catch (err) {
      addToast(err.message || 'Failed to add destination', 'error');
    }
  };

  // Handle Auth (Login / Register)
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (authMode === 'register') {
        res = await registerUser(authForm);
      } else {
        res = await loginUser({ email: authForm.email, password: authForm.password });
      }

      if (res.success && res.data) {
        setCurrentUser(res.data);
        localStorage.setItem('tourist_user', JSON.stringify(res.data));
        addToast(`Welcome back, ${res.data.name}!`, 'success');
        setShowAuthModal(false);
        setAuthForm({ name: '', email: '', password: '' });
      }
    } catch (err) {
      addToast(err.message || 'Authentication error', 'error');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('tourist_user');
    addToast('Logged out successfully', 'success');
  };

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="navbar glass-panel">
        <div className="nav-brand" onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}>
          <div className="nav-brand-icon">
            <Compass size={22} />
          </div>
          <span>Wanderlust<span style={{ color: '#ec4899' }}>.</span></span>
        </div>

        <div className="nav-links">
          <div 
            className={`nav-item ${selectedCategory === 'All' && !searchQuery ? 'active' : ''}`}
            onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
          >
            <Compass size={18} /> Explore
          </div>

          <div 
            className="nav-item"
            onClick={() => {
              loadUserBookingsData();
              setShowBookingsDrawer(true);
            }}
          >
            <Briefcase size={18} /> My Bookings
          </div>

          <div className="nav-item" onClick={() => setShowAddModal(true)}>
            <PlusCircle size={18} /> Add Spot
          </div>

          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="user-badge">
                <User size={14} />
                <span>{currentUser.name}</span>
              </div>
              <button 
                className="btn-secondary" 
                onClick={handleLogout}
                title="Logout"
                style={{ padding: '8px 12px' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button className="btn-primary" onClick={() => setShowAuthModal(true)}>
              <User size={16} /> Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '999px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', fontSize: '0.85rem', fontWeight: 600, marginBottom: '20px' }}>
          <Sparkles size={14} /> Discover World-Class Destinations
        </div>

        <h1 className="hero-title">
          Unforgettable Journeys,<br />
          <span className="gradient-text">Extraordinary Places</span>
        </h1>
        <p className="hero-subtitle">
          Explore serene hill stations, vibrant tropical beaches, ancient heritage wonders, and snow-filled mountain adventures with seamless instant booking.
        </p>

        {/* Global Search Bar */}
        <div className="search-bar-container">
          <div className="search-input-wrapper">
            <Search size={20} />
            <input 
              type="text" 
              placeholder="Search destinations (e.g. Ooty, Goa, Munnar, Agra)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={loadDestinationsData}>
            Find Tours
          </button>
        </div>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-number">50+</div>
            <div className="stat-label">Exotic Locations</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">12,500+</div>
            <div className="stat-label">Happy Travelers</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">4.9 ★</div>
            <div className="stat-label">Average Tour Rating</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">100%</div>
            <div className="stat-label">Instant Confirmation</div>
          </div>
        </div>
      </header>

      {/* Category Pills Filter */}
      <div className="category-filter-bar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Section Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            {selectedCategory === 'All' ? 'Featured Destinations' : selectedCategory}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Handpicked experiences tailored for your next unforgettable escape
          </p>
        </div>
      </div>

      {/* Loading & Grid */}
      {loading ? (
        <div className="loader-spinner"></div>
      ) : destinations.length === 0 ? (
        <div className="empty-state glass-panel">
          <Compass size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3>No destinations found</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>
            Try searching for another keyword or selecting a different category pill above.
          </p>
        </div>
      ) : (
        <div className="destinations-grid">
          {destinations.map(item => (
            <div className="destination-card" key={item.id}>
              <div className="card-image-wrapper">
                <img className="card-image" src={item.image} alt={item.name} />
                <span className="card-category-badge">{item.category}</span>
                <span className="card-rating-badge">
                  <Star size={14} fill="#fbbf24" color="#fbbf24" />
                  {item.rating || 4.8}
                </span>
              </div>

              <div className="card-content">
                <div className="card-location">
                  <MapPin size={15} />
                  <span>{item.location}</span>
                </div>
                <h3 className="card-title">{item.name}</h3>
                <p className="card-description">{item.description}</p>

                <div className="card-details-row">
                  <div className="card-duration">
                    <Clock size={15} />
                    <span>{item.duration}</span>
                  </div>

                  <div className="card-price">
                    <div className="price-label">Starting at</div>
                    <div className="price-amount">₹{item.price?.toLocaleString()}</div>
                  </div>
                </div>

                <div className="card-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => setDetailModalDest(item)}
                  >
                    Details
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={() => setBookingModalDest(item)}
                  >
                    Book Tour
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {bookingModalDest && (
        <div className="modal-overlay" onClick={() => setBookingModalDest(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setBookingModalDest(null)}>
              <X size={18} />
            </button>

            <div className="modal-header">
              <span style={{ fontSize: '0.8rem', color: '#6366f1', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                Instant Reservation
              </span>
              <h2 className="modal-title">Book {bookingModalDest.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                <MapPin size={14} color="#38bdf8" /> {bookingModalDest.location}
              </div>
            </div>

            <form onSubmit={handleBookingSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text"
                  className="input-field"
                  placeholder="Your full name"
                  value={bookingForm.userName}
                  onChange={e => setBookingForm({ ...bookingForm, userName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email"
                  className="input-field"
                  placeholder="your.email@example.com"
                  value={bookingForm.userEmail}
                  onChange={e => setBookingForm({ ...bookingForm, userEmail: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Travel Date</label>
                  <input 
                    type="date"
                    className="input-field"
                    value={bookingForm.travelDate}
                    onChange={e => setBookingForm({ ...bookingForm, travelDate: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Guests Count</label>
                  <input 
                    type="number"
                    min="1"
                    max="20"
                    className="input-field"
                    value={bookingForm.numberOfGuests}
                    onChange={e => setBookingForm({ ...bookingForm, numberOfGuests: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Contact Mobile Number</label>
                <input 
                  type="tel"
                  className="input-field"
                  placeholder="+91 98765 43210"
                  value={bookingForm.contactNumber}
                  onChange={e => setBookingForm({ ...bookingForm, contactNumber: e.target.value })}
                  required
                />
              </div>

              {/* Dynamic Price Calculation Box */}
              <div className="price-summary-box">
                <div>
                  <div className="price-summary-title">
                    ₹{bookingModalDest.price?.toLocaleString()} × {bookingForm.numberOfGuests} Person(s)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#a5b4fc', marginTop: '2px' }}>
                    Includes all taxes & tour guide
                  </div>
                </div>
                <div className="price-summary-total">
                  ₹{(bookingModalDest.price * (bookingForm.numberOfGuests || 1)).toLocaleString()}
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
                <ShieldCheck size={18} /> Confirm & Reserve Tour
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Destination Detail Modal */}
      {detailModalDest && (
        <div className="modal-overlay" onClick={() => setDetailModalDest(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <button className="modal-close-btn" onClick={() => setDetailModalDest(null)}>
              <X size={18} />
            </button>

            <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', height: '240px', marginBottom: '20px' }}>
              <img src={detailModalDest.image} alt={detailModalDest.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', marginBottom: '12px' }}>
              <span className="card-category-badge" style={{ position: 'static' }}>{detailModalDest.category}</span>
              <span style={{ color: '#fbbf24', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Star size={16} fill="#fbbf24" /> {detailModalDest.rating || 4.8}
              </span>
            </div>

            <h2 className="modal-title">{detailModalDest.name}</h2>
            <div style={{ color: 'var(--accent-blue)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
              <MapPin size={16} /> {detailModalDest.location}
            </div>

            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
              {detailModalDest.description}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>TOUR DURATION</div>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>{detailModalDest.duration}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>PRICE PER PERSON</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>₹{detailModalDest.price?.toLocaleString()}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDetailModalDest(null)}>
                Close
              </button>
              <button 
                className="btn-primary" 
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => {
                  setBookingModalDest(detailModalDest);
                  setDetailModalDest(null);
                }}
              >
                Proceed to Book <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Destination Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
              <X size={18} />
            </button>

            <div className="modal-header">
              <h2 className="modal-title">Add New Destination</h2>
              <p className="modal-subtitle">Add a brand new tourist spot to the Wanderlust directory</p>
            </div>

            <form onSubmit={handleAddDestinationSubmit}>
              <div className="form-group">
                <label className="form-label">Destination Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Coorg Coffee Hills" 
                  value={addForm.name} 
                  onChange={e => setAddForm({ ...addForm, name: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location / State</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Karnataka, India" 
                  value={addForm.location} 
                  onChange={e => setAddForm({ ...addForm, location: e.target.value })} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    className="input-field" 
                    value={addForm.category} 
                    onChange={e => setAddForm({ ...addForm, category: e.target.value })}
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Price (₹)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    placeholder="4999" 
                    value={addForm.price} 
                    onChange={e => setAddForm({ ...addForm, price: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input 
                  type="url" 
                  className="input-field" 
                  placeholder="https://images.unsplash.com/photo-..." 
                  value={addForm.image} 
                  onChange={e => setAddForm({ ...addForm, image: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="input-field" 
                  rows="3" 
                  placeholder="Brief highlights about the destination..." 
                  value={addForm.description} 
                  onChange={e => setAddForm({ ...addForm, description: e.target.value })} 
                ></textarea>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
                <PlusCircle size={18} /> Publish Destination
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Auth Modal (Login / Register) */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <button className="modal-close-btn" onClick={() => setShowAuthModal(false)}>
              <X size={18} />
            </button>

            <div className="modal-header" style={{ textAlign: 'center' }}>
              <h2 className="modal-title">
                {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="modal-subtitle">
                {authMode === 'login' 
                  ? 'Sign in to access your tour bookings & profile' 
                  : 'Join Wanderlust to explore and book handcrafted tours'}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Alex Morgan" 
                    value={authForm.name} 
                    onChange={e => setAuthForm({ ...authForm, name: e.target.value })} 
                    required 
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="input-field" 
                  placeholder="alex@example.com" 
                  value={authForm.email} 
                  onChange={e => setAuthForm({ ...authForm, email: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="••••••••" 
                  value={authForm.password} 
                  onChange={e => setAuthForm({ ...authForm, password: e.target.value })} 
                  required 
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: '10px' }}>
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {authMode === 'login' ? (
                <>Don't have an account? <span style={{ color: '#6366f1', cursor: 'pointer', fontWeight: 600 }} onClick={() => setAuthMode('register')}>Sign up</span></>
              ) : (
                <>Already have an account? <span style={{ color: '#6366f1', cursor: 'pointer', fontWeight: 600 }} onClick={() => setAuthMode('login')}>Log in</span></>
              )}
            </div>
          </div>
        </div>
      )}

      {/* My Bookings Drawer */}
      {showBookingsDrawer && (
        <div className="modal-overlay" onClick={() => setShowBookingsDrawer(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <button className="modal-close-btn" onClick={() => setShowBookingsDrawer(false)}>
              <X size={18} />
            </button>

            <div className="modal-header">
              <h2 className="modal-title">My Bookings History</h2>
              <p className="modal-subtitle">View all your confirmed tour reservations</p>
            </div>

            {bookingsList.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 0' }}>
                <Briefcase size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p>No bookings found yet. Explore destinations and book your first tour!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '60vh', overflowY: 'auto' }}>
                {bookingsList.map(bk => (
                  <div key={bk.id} className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8' }}>{bk.id}</span>
                      <span style={{ padding: '4px 10px', borderRadius: '999px', background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }}>
                        {bk.status || 'Confirmed'}
                      </span>
                    </div>

                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '4px' }}>
                      {bk.destination?.name}
                    </h3>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
                      <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} />
                      {bk.destination?.location}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                      <div>
                        <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>TRAVELER</span>
                        <strong style={{ color: 'white' }}>{bk.userName}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>DATE</span>
                        <strong style={{ color: 'white' }}>{bk.travelDate}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>GUESTS</span>
                        <strong style={{ color: 'white' }}>{bk.numberOfGuests} Person(s)</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>TOTAL PAID</span>
                        <strong style={{ color: '#10b981' }}>₹{bk.totalPrice?.toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Floating Alerts */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === 'success' ? <CheckCircle2 size={18} color="#10b981" /> : <AlertCircle size={18} color="#f43f5e" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
