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
  ShieldCheck,
  Tag,
  TrendingUp,
  DollarSign,
  Package,
  Edit3,
  Trash2,
  Percent,
  Check,
  Layers,
  Home,
  Lock,
  Eye,
  EyeOff,
  Leaf,
  Mountain,
  Globe,
  LayoutDashboard,
  UserCheck,
  BarChart2,
  Settings,
  ArrowRight,
  TreePine,
  CreditCard,
  RotateCcw,
  Receipt,
  CalendarRange,
  AlertTriangle,
  RefreshCw,
  FileText
} from 'lucide-react';
import {
  fetchDestinations,
  createBooking,
  fetchBookings,
  createDestination,
  updateDestination,
  updateDestinationOffer,
  deleteDestination,
  fetchBookingStats,
  updateBookingStatus,
  fetchOffers,
  createOffer,
  validateOffer,
  deleteOffer,
  registerUser,
  loginUser,
  logoutUser,
  fetchMe,
  fetchAllUsers,
  createPaymentOrderApi,
  verifyPaymentApi,
  fetchCancellationPolicy,
  fetchBookingById,
  cancelBookingApi,
  fetchRefundStatusApi,
  fetchAdminRevenueApi,
  fetchAdminTransactionsApi,
  fetchAdminRefundsApi
} from './api';

const CATEGORIES = [
  'All',
  'Hills & Nature',
  'Beach & Fun',
  'Heritage & Culture',
  'Adventure & Snow'
];

const STORAGE_KEY = 'travel_user';

export default function App() {
  // =============================================
  // AUTH STATE
  // =============================================
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  // =============================================
  // VIEW / ROUTING STATE
  // =============================================
  // Views: 'login' | 'register' | 'explore' | 'user-dashboard' |
  //        'admin-dashboard' | 'admin-bookings' | 'admin-places' |
  //        'admin-offers' | 'admin-users'
  const [activeView, setActiveView] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const user = saved ? JSON.parse(saved) : null;
      if (!user) return 'login';
      return user.role === 'ADMIN' ? 'admin-dashboard' : 'explore';
    } catch { return 'login'; }
  });

  // =============================================
  // DATA STATE
  // =============================================
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [bookingsList, setBookingsList] = useState([]);
  const [adminBookingStats, setAdminBookingStats] = useState({
    totalBookings: 0, totalRevenue: 0,
    statusCounts: { Confirmed: 0, Completed: 0, Cancelled: 0 }
  });
  const [offersList, setOffersList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('All');

  // =============================================
  // MODAL STATE
  // =============================================
  const [bookingModalDest, setBookingModalDest] = useState(null);
  const [detailModalDest, setDetailModalDest] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editPlaceModal, setEditPlaceModal] = useState(null);
  const [editOfferModal, setEditOfferModal] = useState(null);
  const [showBookingsDrawer, setShowBookingsDrawer] = useState(false);

  // =============================================
  // CANCELLATION & PAYMENT STATE
  // =============================================
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('Change of travel plans');
  const [cancellationModalEstimate, setCancellationModalEstimate] = useState(null);
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [paymentProcessingId, setPaymentProcessingId] = useState(null);

  // =============================================
  // ADMIN REVENUE ANALYTICS STATE
  // =============================================
  const [revenueFilter, setRevenueFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [revenueKpis, setRevenueKpis] = useState({
    grossRevenue: 0,
    totalRefunds: 0,
    netRevenue: 0,
    successfulPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    cancelledBookings: 0,
    refundedBookings: 0,
    totalRefundPendingAmount: 0
  });
  const [revenueTransactions, setRevenueTransactions] = useState([]);
  const [revenueRefunds, setRevenueRefunds] = useState([]);
  const [revenueTab, setRevenueTab] = useState('kpis');
  const [revenueLoading, setRevenueLoading] = useState(false);

  // =============================================
  // AUTH FORM STATE
  // =============================================
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // =============================================
  // BOOKING FORM STATE
  // =============================================
  const [bookingForm, setBookingForm] = useState({
    travelDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    numberOfGuests: 2,
    contactNumber: '',
    userName: '',
    userEmail: ''
  });
  const [promoInput, setPromoInput] = useState('');
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [validatingPromo, setValidatingPromo] = useState(false);

  // =============================================
  // DESTINATION FORM STATE
  // =============================================
  const [addForm, setAddForm] = useState({
    name: '', location: '',
    category: 'Hills & Nature',
    price: '', originalPrice: '',
    offerTag: '', rating: '4.8',
    image: '', description: '',
    duration: '3 Days / 2 Nights'
  });
  const [offerForm, setOfferForm] = useState({ price: '', originalPrice: '', offerTag: '' });

  // =============================================
  // COUPON FORM STATE
  // =============================================
  const [newCouponForm, setNewCouponForm] = useState({
    code: '', discountType: 'percentage',
    discountValue: '', minBookingAmount: '0', description: ''
  });

  // =============================================
  // TOAST STATE
  // =============================================
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  };

  // =============================================
  // NAVIGATION HELPER
  // =============================================
  const navigate = (view) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Role-protected navigation
  const navigateAdmin = (view) => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      addToast("You don't have permission to access this page.", 'error');
      return;
    }
    navigate(view);
  };

  const navigateUser = (view) => {
    if (!currentUser) {
      addToast('Please log in to continue.', 'error');
      navigate('login');
      return;
    }
    navigate(view);
  };

  // =============================================
  // DATA LOADERS
  // =============================================
  const loadDestinationsData = async () => {
    setLoading(true);
    try {
      const res = await fetchDestinations(selectedCategory, searchQuery);
      if (res.success && res.data) setDestinations(res.data);
    } catch (err) {
      addToast(err.message || 'Failed to load destinations', 'error');
    } finally { setLoading(false); }
  };

  const loadOffersData = async () => {
    try {
      const res = await fetchOffers();
      if (res.success && res.data) setOffersList(res.data);
    } catch (err) { console.error(err); }
  };

  const loadAllBookingsData = async () => {
    if (!currentUser) return;
    try {
      const res = await fetchBookings();
      if (res && res.success && Array.isArray(res.data)) {
        setBookingsList(res.data);
      }
    } catch (err) {
      if (err.message?.includes('Authentication required') || err.message?.includes('Access denied')) {
        setCurrentUser(null);
        localStorage.removeItem(STORAGE_KEY);
        setActiveView('login');
        return;
      }
    }

    if (currentUser?.role === 'ADMIN') {
      try {
        const statsRes = await fetchBookingStats();
        if (statsRes && statsRes.success && statsRes.data) {
          setAdminBookingStats(statsRes.data);
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      }
    }
  };

  const loadUsersData = async () => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    try {
      const res = await fetchAllUsers();
      if (res && res.success && res.data) setUsersList(res.data);
    } catch (err) {
      if (err.message?.includes('Authentication required') || err.message?.includes('Access denied')) {
        setCurrentUser(null);
        localStorage.removeItem(STORAGE_KEY);
        setActiveView('login');
      }
    }
  };

  const loadAdminRevenueData = async (filterOverride, startOverride, endOverride) => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    setRevenueLoading(true);
    try {
      const activeFilter = filterOverride !== undefined ? filterOverride : revenueFilter;
      const start = startOverride !== undefined ? startOverride : customStartDate;
      const end = endOverride !== undefined ? endOverride : customEndDate;

      const params = { filter: activeFilter };
      if (activeFilter === 'custom') {
        if (start) params.startDate = start;
        if (end) params.endDate = end;
      }

      const [revRes, txRes, refRes] = await Promise.all([
        fetchAdminRevenueApi(params),
        fetchAdminTransactionsApi(params),
        fetchAdminRefundsApi(params)
      ]);

      if (revRes && revRes.success && revRes.data?.kpis) {
        setRevenueKpis(revRes.data.kpis);
      }
      if (txRes && txRes.success && txRes.data) {
        setRevenueTransactions(txRes.data);
      }
      if (refRes && refRes.success && refRes.data) {
        setRevenueRefunds(refRes.data);
      }
    } catch (err) {
      console.error('Failed to load admin revenue data:', err);
    } finally {
      setRevenueLoading(false);
    }
  };

  // Restore active server session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await fetchMe();
        if (res && res.success && res.user) {
          setCurrentUser(res.user);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(res.user));
        } else {
          setCurrentUser(null);
          localStorage.removeItem(STORAGE_KEY);
          setActiveView('login');
        }
      } catch (err) {
        setCurrentUser(null);
        localStorage.removeItem(STORAGE_KEY);
        setActiveView('login');
      }
    };
    restoreSession();
  }, []);

  useEffect(() => { loadDestinationsData(); }, [selectedCategory, searchQuery]);
  useEffect(() => { loadOffersData(); }, []);

  useEffect(() => {
    if (currentUser) loadAllBookingsData();
  }, [currentUser, activeView]);

  useEffect(() => {
    if (currentUser?.role === 'ADMIN' && (activeView === 'admin-dashboard' || activeView === 'admin-revenue')) {
      loadUsersData();
      loadAdminRevenueData();
    }
  }, [currentUser, activeView, revenueFilter]);

  // Pre-fill booking form with logged-in user
  useEffect(() => {
    if (currentUser) {
      setBookingForm(prev => ({
        ...prev,
        userName: currentUser.name || '',
        userEmail: currentUser.email || ''
      }));
    }
  }, [currentUser]);

  // Reset promo on booking modal close
  useEffect(() => {
    if (!bookingModalDest) {
      setPromoInput('');
      setAppliedOffer(null);
    }
  }, [bookingModalDest]);

  // =============================================
  // AUTH HANDLERS
  // =============================================
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await loginUser({ email: authForm.email, password: authForm.password });
      if (res.success && res.user) {
        const user = res.user;
        setCurrentUser(user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        addToast(`Welcome back, ${user.name}! 🌿`, 'success');
        setAuthForm({ name: '', email: '', password: '' });
        // Role-based routing
        if (user.role === 'ADMIN') {
          navigate('admin-dashboard');
          loadUsersData();
        } else {
          navigate('explore');
        }
      }
    } catch (err) {
      setAuthError(err.message || 'Invalid email or password');
    } finally { setAuthLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (authForm.password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await registerUser(authForm);
      if (res.success && res.user) {
        const user = res.user;
        setCurrentUser(user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        addToast(`Welcome to NatureTrails, ${user.name}! 🌿`, 'success');
        setAuthForm({ name: '', email: '', password: '' });
        navigate('explore');
      }
    } catch (err) {
      setAuthError(err.message || 'Registration failed. Please try again.');
    } finally { setAuthLoading(false); }
  };

  const handleLogout = async () => {
    try { await logoutUser(); } catch (err) { console.error(err); }
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
    setActiveView('login');
    setAuthForm({ name: '', email: '', password: '' });
    setAuthError('');
    addToast('Logged out successfully. Safe travels! 🌿', 'success');
  };

  // =============================================
  // BOOKING HANDLERS
  // =============================================
  const getRawTotal = () => {
    if (!bookingModalDest) return 0;
    return (bookingModalDest.price || 0) * (bookingForm.numberOfGuests || 1);
  };

  const handleApplyPromoCode = async () => {
    if (!promoInput.trim()) return;
    setValidatingPromo(true);
    try {
      const rawTotal = getRawTotal();
      const res = await validateOffer(promoInput, rawTotal);
      if (res.success && res.data) {
        setAppliedOffer(res.data);
        addToast(res.message, 'success');
      }
    } catch (err) {
      setAppliedOffer(null);
      addToast(err.message || 'Invalid promo code', 'error');
    } finally { setValidatingPromo(false); }
  };

  const initiatePayment = async (booking) => {
    const bookingId = booking.id || booking._id;
    setPaymentProcessingId(bookingId);
    try {
      const orderData = await createPaymentOrderApi(bookingId);
      if (!orderData || !orderData.orderId) {
        throw new Error('Failed to create payment order');
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'NatureTrails 🌿',
        description: `Tour Reservation - ${booking.destination?.name || 'Nature Experience'}`,
        order_id: orderData.orderId,
        prefill: {
          name: booking.userName || currentUser?.name || 'Traveler',
          email: booking.userEmail || currentUser?.email || 'user@example.com',
          contact: booking.contactNumber || ''
        },
        theme: {
          color: '#1B5E3C'
        },
        handler: async function (response) {
          try {
            const verifyRes = await verifyPaymentApi({
              bookingId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            if (verifyRes.success) {
              addToast('🎉 Payment verified! Your tour booking is Confirmed.', 'success');
              loadAllBookingsData();
              if (currentUser?.role === 'ADMIN') loadAdminRevenueData();
            }
          } catch (verErr) {
            addToast(verErr.message || 'Payment verification failed', 'error');
            loadAllBookingsData();
          } finally {
            setPaymentProcessingId(null);
          }
        },
        modal: {
          ondismiss: function () {
            addToast('Payment cancelled. Your booking is saved in My Bookings (Pending Payment).', 'info');
            setPaymentProcessingId(null);
            loadAllBookingsData();
          }
        }
      };

      const isPlaceholderMockKey = !orderData.keyId || orderData.keyId === 'rzp_test_naturetrails2026' || orderData.isSimulated;

      if (window.Razorpay && !isPlaceholderMockKey) {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (failRes) {
          addToast(`Payment failed: ${failRes.error?.description || 'Transaction declined'}`, 'error');
          setPaymentProcessingId(null);
          loadAllBookingsData();
        });
        rzp.open();
      } else {
        const confirmSim = window.confirm(
          `[Razorpay Gateway Simulation]\n\nConfirm payment of ₹${booking.totalPrice?.toLocaleString()} for "${booking.destination?.name || 'Tour'}"?`
        );
        if (confirmSim) {
          const simVerify = await verifyPaymentApi({
            bookingId,
            razorpay_order_id: orderData.orderId,
            razorpay_payment_id: `pay_simulated_${Date.now()}`,
            razorpay_signature: 'simulated_valid_signature'
          });
          if (simVerify.success) {
            addToast('🎉 Payment verified! Your tour booking is Confirmed.', 'success');
            loadAllBookingsData();
            if (currentUser?.role === 'ADMIN') loadAdminRevenueData();
          }
        } else {
          addToast('Payment pending. You can complete payment anytime in My Bookings.', 'info');
        }
        setPaymentProcessingId(null);
      }
    } catch (err) {
      addToast(err.message || 'Payment initiation failed', 'error');
      setPaymentProcessingId(null);
    }
  };

  const handleOpenCancelModal = async (booking) => {
    setCancellingBooking(booking);
    setCancellationReason('Change of travel plans');
    setCancellationModalEstimate(null);
    try {
      const res = await fetchBookingById(booking.id || booking._id);
      if (res && res.success && res.cancellationEstimate) {
        setCancellationModalEstimate(res.cancellationEstimate);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmCancellation = async () => {
    if (!cancellingBooking) return;
    setIsSubmittingCancel(true);
    try {
      const bId = cancellingBooking.id || cancellingBooking._id;
      const res = await cancelBookingApi(bId, cancellationReason);
      if (res && res.success) {
        const refundAmt = res.refundAmount || res.data?.refundAmount || 0;
        const refundPct = res.refundPercentage || res.data?.refundPercentage || 0;
        if (refundAmt > 0) {
          addToast(`Booking cancelled. Refund of ₹${refundAmt.toLocaleString()} (${refundPct}%) initiated.`, 'success');
        } else {
          addToast('Booking cancelled. Per policy (within 72 hours), ₹0 refund applies.', 'info');
        }
        setCancellingBooking(null);
        loadAllBookingsData();
        if (currentUser?.role === 'ADMIN') loadAdminRevenueData();
      }
    } catch (err) {
      addToast(err.message || 'Failed to cancel booking', 'error');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

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
        userEmail: bookingForm.userEmail || currentUser?.email || 'guest@example.com',
        promoCode: appliedOffer ? appliedOffer.code : null,
        discountAmount: appliedOffer ? appliedOffer.discountAmount : 0
      };
      const res = await createBooking(payload);
      if (res.success && res.data) {
        addToast('Reservation created! Opening payment gateway...', 'success');
        setBookingModalDest(null);
        setBookingsList(prev => [res.data, ...prev.filter(b => b.id !== res.data.id)]);
        loadAllBookingsData();
        initiatePayment(res.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to submit booking', 'error');
    }
  };

  // =============================================
  // ADMIN DESTINATION HANDLERS
  // =============================================
  const handleAddDestinationSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createDestination(addForm);
      if (res.success) {
        addToast('✨ New destination added successfully!', 'success');
        setShowAddModal(false);
        setAddForm({ name: '', location: '', category: 'Hills & Nature', price: '', originalPrice: '', offerTag: '', rating: '4.8', image: '', description: '', duration: '3 Days / 2 Nights' });
        loadDestinationsData();
      }
    } catch (err) { addToast(err.message || 'Failed to add destination', 'error'); }
  };

  const handleEditDestinationSubmit = async (e) => {
    e.preventDefault();
    if (!editPlaceModal) return;
    try {
      const res = await updateDestination(editPlaceModal.id, addForm);
      if (res.success) {
        addToast('Destination updated successfully', 'success');
        setEditPlaceModal(null);
        loadDestinationsData();
      }
    } catch (err) { addToast(err.message || 'Failed to update destination', 'error'); }
  };

  const handleSaveOfferSubmit = async (e) => {
    e.preventDefault();
    if (!editOfferModal) return;
    try {
      const res = await updateDestinationOffer(editOfferModal.id, offerForm);
      if (res.success) {
        addToast(`Offer updated for ${editOfferModal.name}!`, 'success');
        setEditOfferModal(null);
        loadDestinationsData();
      }
    } catch (err) { addToast(err.message || 'Failed to update offer', 'error'); }
  };

  const handleDeletePlace = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await deleteDestination(id);
      if (res.success) {
        addToast(`Deleted destination "${name}"`, 'success');
        loadDestinationsData();
      }
    } catch (err) { addToast(err.message || 'Failed to delete destination', 'error'); }
  };

  const handleUpdateBookingStatus = async (id, newStatus) => {
    try {
      const res = await updateBookingStatus(id, newStatus);
      if (res.success) {
        addToast(`Booking ${id} → ${newStatus}`, 'success');
        loadAllBookingsData();
      }
    } catch (err) { addToast(err.message || 'Failed to update booking status', 'error'); }
  };

  const handleCreateCouponSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createOffer(newCouponForm);
      if (res.success) {
        addToast(`Created promo code '${res.data.code}'!`, 'success');
        setNewCouponForm({ code: '', discountType: 'percentage', discountValue: '', minBookingAmount: '0', description: '' });
        loadOffersData();
      }
    } catch (err) { addToast(err.message || 'Failed to create offer coupon', 'error'); }
  };

  const handleDeleteCoupon = async (id, code) => {
    if (!window.confirm(`Delete coupon code ${code}?`)) return;
    try {
      const res = await deleteOffer(id);
      if (res.success) {
        addToast(`Deleted coupon ${code}`, 'success');
        loadOffersData();
      }
    } catch (err) { addToast(err.message || 'Failed to delete offer', 'error'); }
  };

  const getFilteredBookings = () => {
    if (bookingStatusFilter === 'All') return bookingsList;
    return bookingsList.filter(b => 
      (b.status && b.status.toLowerCase() === bookingStatusFilter.toLowerCase()) ||
      (b.bookingStatus && b.bookingStatus.toLowerCase() === bookingStatusFilter.toLowerCase())
    );
  };

  // User's own bookings: display all bookings returned for the user
  const myBookings = currentUser ? bookingsList : [];

  // =============================================
  // ADMIN GUARD — inline
  // =============================================
  const isAdmin = currentUser?.role === 'ADMIN';
  const isLoggedIn = !!currentUser;

  // If visiting admin view without being admin → redirect
  const adminViews = ['admin-dashboard', 'admin-revenue', 'admin-bookings', 'admin-places', 'admin-offers', 'admin-users'];
  if (adminViews.includes(activeView) && !isAdmin) {
    return (
      <div>
        <NavBar currentUser={currentUser} activeView={activeView} navigate={navigate} navigateUser={navigateUser} navigateAdmin={navigateAdmin} handleLogout={handleLogout} isAdmin={isAdmin} loadAllBookingsData={loadAllBookingsData} loadOffersData={loadOffersData} setShowBookingsDrawer={setShowBookingsDrawer} loadAdminRevenueData={loadAdminRevenueData} loadUsersData={loadUsersData} />
        <div className="app-container">
          <div className="access-denied-page">
            <div className="access-denied-card">
              <div className="access-denied-icon">
                <Lock size={32} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '10px' }}>
                Access Restricted
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '28px', lineHeight: 1.6 }}>
                You don't have permission to access this page. Admin privileges are required.
              </p>
              <button className="btn-primary" onClick={() => navigate(isLoggedIn ? 'explore' : 'login')}>
                <Home size={16} />
                {isLoggedIn ? 'Back to Explore' : 'Go to Login'}
              </button>
            </div>
          </div>
        </div>
        <ToastContainer toasts={toasts} />
      </div>
    );
  }

  // If visiting user views without being logged in → redirect to login
  const protectedUserViews = ['explore', 'user-dashboard'];
  if (protectedUserViews.includes(activeView) && !isLoggedIn) {
    return (
      <LoginPage
        authForm={authForm} setAuthForm={setAuthForm}
        authLoading={authLoading} authError={authError}
        showPassword={showPassword} setShowPassword={setShowPassword}
        handleLogin={handleLogin}
        navigate={navigate}
        toasts={toasts}
      />
    );
  }

  // =============================================
  // RENDER: LOGIN PAGE
  // =============================================
  if (activeView === 'login') {
    return (
      <>
        <LoginPage
          authForm={authForm} setAuthForm={setAuthForm}
          authLoading={authLoading} authError={authError}
          showPassword={showPassword} setShowPassword={setShowPassword}
          handleLogin={handleLogin}
          navigate={navigate}
          toasts={toasts}
        />
        <ToastContainer toasts={toasts} />
      </>
    );
  }

  // =============================================
  // RENDER: REGISTER PAGE
  // =============================================
  if (activeView === 'register') {
    return (
      <>
        <RegisterPage
          authForm={authForm} setAuthForm={setAuthForm}
          authLoading={authLoading} authError={authError}
          showPassword={showPassword} setShowPassword={setShowPassword}
          handleRegister={handleRegister}
          navigate={navigate}
        />
        <ToastContainer toasts={toasts} />
      </>
    );
  }

  // =============================================
  // RENDER: ADMIN PAGES
  // =============================================
  if (adminViews.includes(activeView)) {
    return (
      <div className="admin-page-wrapper">
        {/* Admin Navbar */}
        <NavBar currentUser={currentUser} activeView={activeView} navigate={navigate} navigateUser={navigateUser} navigateAdmin={navigateAdmin} handleLogout={handleLogout} isAdmin={isAdmin} loadAllBookingsData={loadAllBookingsData} loadOffersData={loadOffersData} setShowBookingsDrawer={setShowBookingsDrawer} loadAdminRevenueData={loadAdminRevenueData} loadUsersData={loadUsersData} />

        <div className="admin-layout">
          {/* Sidebar */}
          <aside className="admin-sidebar">
            <div className="admin-sidebar-nav">
              <div className="admin-sidebar-title">Main</div>
              <div className={`admin-sidebar-item ${activeView === 'admin-dashboard' ? 'active' : ''}`}
                onClick={() => navigate('admin-dashboard')}>
                <LayoutDashboard size={18} /> Dashboard
              </div>

              <div className="admin-sidebar-title">Management</div>
              <div className={`admin-sidebar-item ${activeView === 'admin-users' ? 'active' : ''}`}
                onClick={() => { navigate('admin-users'); loadUsersData(); }}>
                <Users size={18} /> Users
                {usersList.length > 0 && <span className="admin-sidebar-badge">{usersList.length}</span>}
              </div>
              <div className={`admin-sidebar-item ${activeView === 'admin-places' ? 'active' : ''}`}
                onClick={() => navigate('admin-places')}>
                <MapPin size={18} /> Destinations
                {destinations.length > 0 && <span className="admin-sidebar-badge">{destinations.length}</span>}
              </div>
              <div className={`admin-sidebar-item ${activeView === 'admin-bookings' ? 'active' : ''}`}
                onClick={() => { navigate('admin-bookings'); loadAllBookingsData(); }}>
                <Briefcase size={18} /> Bookings
                {bookingsList.length > 0 && <span className="admin-sidebar-badge">{bookingsList.length}</span>}
              </div>
              <div className={`admin-sidebar-item ${activeView === 'admin-revenue' ? 'active' : ''}`}
                onClick={() => { navigate('admin-revenue'); loadAdminRevenueData(); }}>
                <TrendingUp size={18} /> Revenue Analytics
              </div>
              <div className={`admin-sidebar-item ${activeView === 'admin-offers' ? 'active' : ''}`}
                onClick={() => { navigate('admin-offers'); loadOffersData(); }}>
                <Tag size={18} /> Promo Offers
                {offersList.length > 0 && <span className="admin-sidebar-badge">{offersList.length}</span>}
              </div>
            </div>

            <div className="admin-sidebar-footer">
              <div className="admin-sidebar-title">Account</div>
              <div className="admin-sidebar-item" onClick={() => navigate('explore')}>
                <Globe size={18} /> View Site
              </div>
              <div className="admin-sidebar-item admin-logout-item" onClick={handleLogout}>
                <LogOut size={18} /> Logout
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="admin-main">

            {/* ADMIN DASHBOARD */}
            {activeView === 'admin-dashboard' && (
              <div className="admin-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="admin-page-header">
                  <div className="admin-page-eyebrow">
                    <ShieldCheck size={14} /> Admin Control Center
                  </div>
                  <h1 className="admin-page-title">Travel Dashboard</h1>
                  <p className="admin-page-subtitle">Manage destinations, bookings, and users from one place.</p>
                </div>

                {/* Metrics */}
                <div className="admin-metrics-grid">
                  <div className="metric-card" onClick={() => navigate('admin-users')} style={{ cursor: 'pointer' }}>
                    <div className="metric-icon-box bg-forest"><Users size={24} /></div>
                    <div>
                      <div className="metric-label">Total Users</div>
                      <div className="metric-value">{usersList.length}</div>
                      <div className="metric-subtext">Registered travelers</div>
                    </div>
                  </div>
                  <div className="metric-card" onClick={() => navigate('admin-places')} style={{ cursor: 'pointer' }}>
                    <div className="metric-icon-box bg-sage"><MapPin size={24} /></div>
                    <div>
                      <div className="metric-label">Destinations</div>
                      <div className="metric-value">{destinations.length}</div>
                      <div className="metric-subtext">Active spots in catalog</div>
                    </div>
                  </div>
                  <div className="metric-card" onClick={() => navigate('admin-bookings')} style={{ cursor: 'pointer' }}>
                    <div className="metric-icon-box bg-sand"><Briefcase size={24} /></div>
                    <div>
                      <div className="metric-label">Total Bookings</div>
                      <div className="metric-value">{adminBookingStats.totalBookings || bookingsList.length}</div>
                      <div className="metric-subtext">Confirmed & active tours</div>
                    </div>
                  </div>
                  <div className="metric-card" onClick={() => navigate('admin-revenue')} style={{ cursor: 'pointer' }}>
                    <div className="metric-icon-box bg-cream"><DollarSign size={24} /></div>
                    <div>
                      <div className="metric-label">Net Revenue</div>
                      <div className="metric-value">₹{(revenueKpis.netRevenue || 0).toLocaleString()}</div>
                      <div className="metric-subtext">Gross ₹{(revenueKpis.grossRevenue || 0).toLocaleString()} − Refunds ₹{(revenueKpis.totalRefunds || 0).toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* Real-time Revenue & Refund Analytics Component */}
                <AdminRevenueSection
                  revenueFilter={revenueFilter}
                  setRevenueFilter={setRevenueFilter}
                  customStartDate={customStartDate}
                  setCustomStartDate={setCustomStartDate}
                  customEndDate={customEndDate}
                  setCustomEndDate={setCustomEndDate}
                  revenueKpis={revenueKpis}
                  revenueTransactions={revenueTransactions}
                  revenueRefunds={revenueRefunds}
                  revenueTab={revenueTab}
                  setRevenueTab={setRevenueTab}
                  revenueLoading={revenueLoading}
                  loadAdminRevenueData={loadAdminRevenueData}
                />

                {/* Quick Links */}
                <div className="admin-section">
                  <div className="admin-section-header">
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700 }}>Quick Actions</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '3px' }}>Common management tasks</p>
                    </div>
                  </div>
                  <div className="admin-quick-actions-grid">
                    {[
                      { icon: <PlusCircle size={20}/>, label: 'Add Destination', sub: 'Create new travel spot', action: () => setShowAddModal(true) },
                      { icon: <Users size={20}/>, label: 'Manage Users', sub: 'View all registered users', action: () => { navigate('admin-users'); loadUsersData(); } },
                      { icon: <Briefcase size={20}/>, label: 'View Bookings', sub: 'Monitor all reservations', action: () => { navigate('admin-bookings'); loadAllBookingsData(); } },
                      { icon: <Tag size={20}/>, label: 'Manage Offers', sub: 'Create & manage coupons', action: () => { navigate('admin-offers'); loadOffersData(); } },
                    ].map((qa, i) => (
                      <div key={i} className="admin-quick-action-card" onClick={qa.action}>
                        <div className="admin-quick-action-icon">{qa.icon}</div>
                        <div className="admin-quick-action-text">
                          <div className="admin-quick-action-label">{qa.label}</div>
                          <div className="admin-quick-action-sub">{qa.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Bookings Summary */}
                <div className="admin-section">
                  <div className="admin-section-header">
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700 }}>Recent Bookings</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '3px' }}>Latest 5 tour reservations</p>
                    </div>
                    <button className="btn-secondary" onClick={() => navigate('admin-bookings')}>
                      View All <ChevronRight size={15}/>
                    </button>
                  </div>
                  {bookingsList.length === 0 ? (
                    <div className="empty-state" style={{ padding: '30px' }}>
                      <Briefcase size={36} style={{ color: 'var(--text-light)', marginBottom: '10px' }} />
                      <p>No bookings yet.</p>
                    </div>
                  ) : (
                    <div className="admin-recent-bookings-list">
                      {[...bookingsList].reverse().slice(0, 5).map(b => (
                        <div key={b.id} className="admin-recent-booking-item">
                          <div className="admin-recent-booking-info">
                            <div className="admin-recent-booking-title">{b.destination?.name || 'Tour Destination'}</div>
                            <div className="admin-recent-booking-meta">{b.userName} · {b.travelDate} · {b.numberOfGuests || 1} guest(s)</div>
                          </div>
                          <div className="admin-recent-booking-amount-col">
                            <span className="admin-recent-booking-price">₹{b.totalPrice?.toLocaleString()}</span>
                            <span className={`status-badge status-${(b.status || 'confirmed').toLowerCase()}`}>{b.status || 'Confirmed'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ADMIN REVENUE ANALYTICS VIEW */}
            {activeView === 'admin-revenue' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="admin-page-header">
                  <div className="admin-page-eyebrow"><TrendingUp size={14} /> Financial Intelligence</div>
                  <h1 className="admin-page-title">Revenue & Refund Analytics</h1>
                  <p className="admin-page-subtitle">Verified Razorpay payments, customer refund audits, and date-filtered revenue metrics.</p>
                </div>
                <AdminRevenueSection
                  revenueFilter={revenueFilter}
                  setRevenueFilter={setRevenueFilter}
                  customStartDate={customStartDate}
                  setCustomStartDate={setCustomStartDate}
                  customEndDate={customEndDate}
                  setCustomEndDate={setCustomEndDate}
                  revenueKpis={revenueKpis}
                  revenueTransactions={revenueTransactions}
                  revenueRefunds={revenueRefunds}
                  revenueTab={revenueTab}
                  setRevenueTab={setRevenueTab}
                  revenueLoading={revenueLoading}
                  loadAdminRevenueData={loadAdminRevenueData}
                />
              </div>
            )}

            {/* ADMIN USERS */}
            {activeView === 'admin-users' && (
              <div className="admin-container">
                <div className="admin-page-header">
                  <div className="admin-page-eyebrow"><Users size={14} /> User Management</div>
                  <h1 className="admin-page-title">Registered Users</h1>
                  <p className="admin-page-subtitle">{usersList.length} users registered on the platform</p>
                </div>
                <div className="admin-section">
                  {usersList.length === 0 ? (
                    <div className="empty-state">
                      <Users size={40} style={{ color: 'var(--text-light)', marginBottom: '12px' }} />
                      <p>No users registered yet.</p>
                    </div>
                  ) : (
                    <div className="users-grid">
                      {usersList.map(u => (
                        <div key={u.id} className="user-card">
                          <div className="user-avatar">{u.name.charAt(0).toUpperCase()}</div>
                          <div className="user-card-info" style={{ flex: 1 }}>
                            <h4>{u.name}</h4>
                            <p style={{ marginBottom: '6px' }}>{u.email}</p>
                            <span className={u.role === 'ADMIN' ? 'role-badge-admin' : 'role-badge-user'}>
                              {u.role === 'ADMIN' ? <ShieldCheck size={11}/> : <User size={11}/>} {u.role}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ADMIN BOOKINGS */}
            {activeView === 'admin-bookings' && (
              <div className="admin-container">
                <div className="admin-page-header">
                  <div className="admin-page-eyebrow"><Briefcase size={14}/> Booking Management</div>
                  <h1 className="admin-page-title">All Tour Bookings</h1>
                  <p className="admin-page-subtitle">Track and manage all customer reservations</p>
                </div>

                <div className="admin-metrics-grid">
                  {[
                    { label: 'Total', value: adminBookingStats.totalBookings || bookingsList.length, cls: 'bg-forest' },
                    { label: 'Confirmed', value: adminBookingStats.statusCounts?.Confirmed || 0, cls: 'bg-sage' },
                    { label: 'Completed', value: adminBookingStats.statusCounts?.Completed || 0, cls: 'bg-sand' },
                    { label: 'Cancelled', value: adminBookingStats.statusCounts?.Cancelled || 0, cls: 'bg-cream' },
                  ].map((m, i) => (
                    <div key={i} className="metric-card">
                      <div>
                        <div className="metric-label">{m.label}</div>
                        <div className="metric-value">{m.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="admin-section">
                  <div className="admin-section-header">
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700 }}>Booking Monitor</h3>
                    </div>
                    <div className="status-filter-pills">
                      {['All', 'Confirmed', 'Completed', 'Cancelled'].map(st => (
                        <button key={st} className={`status-chip ${bookingStatusFilter === st ? 'active' : ''}`}
                          onClick={() => setBookingStatusFilter(st)}>{st}</button>
                      ))}
                    </div>
                  </div>

                  {getFilteredBookings().length === 0 ? (
                    <div className="empty-state" style={{ padding: '40px' }}>
                      <Briefcase size={40} style={{ color: 'var(--text-light)', marginBottom: '12px' }} />
                      <p>No bookings match the filter.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Booking Ref</th>
                            <th>Customer</th>
                            <th>Destination</th>
                            <th>Date</th>
                            <th>Guests</th>
                            <th>Total Paid</th>
                            <th>Status</th>
                            <th>Update</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredBookings().map(b => (
                            <tr key={b.id}>
                              <td><span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--primary)', fontSize: '0.82rem' }}>{b.id}</span></td>
                              <td>
                                <div style={{ fontWeight: 600 }}>{b.userName}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.userEmail}</div>
                              </td>
                              <td>
                                <div style={{ fontWeight: 600 }}>{b.destination?.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.destination?.location}</div>
                              </td>
                              <td style={{ whiteSpace: 'nowrap' }}>{b.travelDate}</td>
                              <td>{b.numberOfGuests}</td>
                              <td><span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--primary)' }}>₹{b.totalPrice?.toLocaleString()}</span></td>
                              <td><span className={`status-badge status-${(b.status || 'confirmed').toLowerCase()}`}>{b.status}</span></td>
                              <td>
                                <select className="input-field select-sm" style={{ minWidth: '120px' }}
                                  value={b.status || 'Confirmed'}
                                  onChange={e => handleUpdateBookingStatus(b.id, e.target.value)}>
                                  <option value="Confirmed">Confirmed</option>
                                  <option value="Completed">Completed</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ADMIN PLACES */}
            {activeView === 'admin-places' && (
              <div className="admin-container">
                <div className="admin-page-header">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                    <div>
                      <div className="admin-page-eyebrow"><MapPin size={14}/> Destination Management</div>
                      <h1 className="admin-page-title">Manage Places & Offers</h1>
                      <p className="admin-page-subtitle">Add, edit, and manage tourist destinations</p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                      <PlusCircle size={16}/> Add New Place
                    </button>
                  </div>
                </div>

                <div className="admin-section">
                  {destinations.length === 0 ? (
                    <div className="empty-state">
                      <MapPin size={40} style={{ color: 'var(--text-light)', marginBottom: '12px' }} />
                      <p>No destinations yet.</p>
                    </div>
                  ) : (
                    <div className="admin-places-grid">
                      {destinations.map(place => (
                        <div key={place.id} className="admin-place-card">
                          <div className="admin-place-image-box">
                            <img src={place.image} alt={place.name} />
                            <span className="card-category-badge">{place.category}</span>
                            {place.offerTag && <span className="card-offer-badge"><Tag size={11}/> {place.offerTag}</span>}
                          </div>
                          <div className="admin-place-body">
                            <h4>{place.name}</h4>
                            <div className="admin-place-location"><MapPin size={12}/> {place.location}</div>
                            <div className="admin-place-price-row">
                              <div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Price</div>
                                {place.originalPrice ? (
                                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                    <span style={{ textDecoration: 'line-through', color: 'var(--text-light)', fontSize: '0.8rem' }}>₹{place.originalPrice.toLocaleString()}</span>
                                    <strong style={{ color: 'var(--primary)', fontSize: '1rem' }}>₹{place.price.toLocaleString()}</strong>
                                  </div>
                                ) : (
                                  <strong style={{ color: 'var(--primary)', fontSize: '1rem' }}>₹{place.price.toLocaleString()}</strong>
                                )}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{place.duration}</div>
                            </div>
                            <div className="admin-place-actions">
                              <button className="btn-offer" onClick={() => {
                                setEditOfferModal(place);
                                setOfferForm({ price: place.price || '', originalPrice: place.originalPrice || place.price || '', offerTag: place.offerTag || '20% OFF SPECIAL' });
                              }}><Tag size={13}/> Set Offer</button>
                              <button className="btn-secondary" onClick={() => {
                                setEditPlaceModal(place);
                                setAddForm({ name: place.name, location: place.location, category: place.category, price: place.price, originalPrice: place.originalPrice || '', offerTag: place.offerTag || '', rating: place.rating || '4.8', image: place.image, description: place.description, duration: place.duration });
                              }}><Edit3 size={13}/> Edit</button>
                              <button className="btn-danger" onClick={() => handleDeletePlace(place.id, place.name)}><Trash2 size={13}/></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ADMIN OFFERS */}
            {activeView === 'admin-offers' && (
              <div className="admin-container">
                <div className="admin-page-header">
                  <div className="admin-page-eyebrow"><Tag size={14}/> Promo Management</div>
                  <h1 className="admin-page-title">Promo Coupons & Discounts</h1>
                  <p className="admin-page-subtitle">Create and manage global discount codes for travelers</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                  {/* Create Coupon */}
                  <form onSubmit={handleCreateCouponSubmit} className="admin-section" style={{ height: 'fit-content' }}>
                    <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <PlusCircle size={16} color="var(--primary)"/> New Promo Code
                    </h4>
                    <div className="form-group">
                      <label className="form-label">Coupon Code</label>
                      <input type="text" className="input-field" placeholder="e.g. SUMMER30" value={newCouponForm.code}
                        onChange={e => setNewCouponForm({ ...newCouponForm, code: e.target.value.toUpperCase() })} required />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group">
                        <label className="form-label">Type</label>
                        <select className="input-field" value={newCouponForm.discountType}
                          onChange={e => setNewCouponForm({ ...newCouponForm, discountType: e.target.value })}>
                          <option value="percentage">Percentage (%)</option>
                          <option value="flat">Flat Amount (₹)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Value</label>
                        <input type="number" className="input-field" placeholder={newCouponForm.discountType === 'percentage' ? "20" : "500"}
                          value={newCouponForm.discountValue}
                          onChange={e => setNewCouponForm({ ...newCouponForm, discountValue: e.target.value })} required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Min Booking (₹)</label>
                      <input type="number" className="input-field" placeholder="3000" value={newCouponForm.minBookingAmount}
                        onChange={e => setNewCouponForm({ ...newCouponForm, minBookingAmount: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <input type="text" className="input-field" placeholder="Get 20% OFF on summer packages" value={newCouponForm.description}
                        onChange={e => setNewCouponForm({ ...newCouponForm, description: e.target.value })} />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                      <Tag size={15}/> Publish Coupon
                    </button>
                  </form>

                  {/* Coupons List */}
                  <div>
                    <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700, marginBottom: '14px' }}>
                      Active Promo Coupons ({offersList.length})
                    </h4>
                    {offersList.length === 0 ? (
                      <div className="empty-state admin-section"><Tag size={36} style={{ color: 'var(--text-light)', marginBottom: '10px' }} /><p>No coupons created yet.</p></div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {offersList.map(coupon => (
                          <div key={coupon.id} className="admin-section coupon-item-card">
                            <div className="coupon-item-left">
                              <div className="coupon-code-badge"><Tag size={14}/> {coupon.code}</div>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px' }}>{coupon.description}</p>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '4px' }}>
                                Min: ₹{(coupon.minBookingAmount || 0).toLocaleString()} · Expires: {coupon.expiresAt || 'Active'}
                              </div>
                            </div>
                            <div className="coupon-item-right">
                              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>
                                {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                              </div>
                              <button className="btn-danger" style={{ padding: '6px 14px' }} onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}>
                                <Trash2 size={13}/> Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>

        {/* Shared Modals */}
        <SharedModals
          showAddModal={showAddModal} setShowAddModal={setShowAddModal}
          editPlaceModal={editPlaceModal} setEditPlaceModal={setEditPlaceModal}
          editOfferModal={editOfferModal} setEditOfferModal={setEditOfferModal}
          addForm={addForm} setAddForm={setAddForm}
          offerForm={offerForm} setOfferForm={setOfferForm}
          handleAddDestinationSubmit={handleAddDestinationSubmit}
          handleEditDestinationSubmit={handleEditDestinationSubmit}
          handleSaveOfferSubmit={handleSaveOfferSubmit}
        />
        <ToastContainer toasts={toasts} />
      </div>
    );
  }

  // =============================================
  // RENDER: USER EXPLORE VIEW (default logged-in)
  // =============================================
  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <NavBar currentUser={currentUser} activeView={activeView} navigate={navigate} navigateUser={navigateUser} navigateAdmin={navigateAdmin} handleLogout={handleLogout} isAdmin={isAdmin} loadAllBookingsData={loadAllBookingsData} loadOffersData={loadOffersData} setShowBookingsDrawer={setShowBookingsDrawer} loadAdminRevenueData={loadAdminRevenueData} loadUsersData={loadUsersData} />

      <div className="app-container">

        {/* USER DASHBOARD VIEW */}
        {activeView === 'user-dashboard' && (
          <div className="user-dashboard">
            {/* Welcome Card */}
            <div className="user-welcome-card">
              <div className="welcome-eyebrow">
                <Leaf size={13}/> Welcome Back
              </div>
              <h1 className="welcome-title">
                Hello, {currentUser?.name?.split(' ')[0] || 'Traveler'}! 🌿
              </h1>
              <p className="welcome-subtitle">
                "Explore more. Leave less." — Ready for your next adventure? Discover handpicked eco-travel destinations across India.
              </p>
              <div className="welcome-actions">
                <button className="btn-white" onClick={() => navigate('explore')}>
                  <Compass size={17}/> Explore Destinations
                </button>
                <button className="btn-white-outline" onClick={() => { loadAllBookingsData(); setShowBookingsDrawer(true); }}>
                  <Briefcase size={16}/> My Bookings
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <div className="section-header">
                <div>
                  <h2 className="section-title">Quick Actions</h2>
                  <p className="section-subtitle">What would you like to do?</p>
                </div>
              </div>
              <div className="quick-actions-grid">
                {[
                  { icon: <Compass size={22}/>, label: 'Explore Destinations', sub: 'Browse travel spots', action: () => navigate('explore') },
                  { icon: <Briefcase size={22}/>, label: 'My Bookings', sub: `${myBookings.length} reservation${myBookings.length !== 1 ? 's' : ''}`, action: () => { loadAllBookingsData(); setShowBookingsDrawer(true); } },
                  { icon: <Tag size={22}/>, label: 'Promo Offers', sub: `${offersList.length} active code${offersList.length !== 1 ? 's' : ''}`, action: () => navigate('explore') },
                  { icon: <User size={22}/>, label: 'My Profile', sub: currentUser?.email, action: () => {} },
                ].map((qa, i) => (
                  <div key={i} className="quick-action-card" onClick={qa.action}>
                    <div className="quick-action-icon">{qa.icon}</div>
                    <div>
                      <div className="quick-action-label">{qa.label}</div>
                      <div className="quick-action-sub">{qa.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Destinations */}
            <div>
              <div className="section-header">
                <div>
                  <h2 className="section-title">Featured Destinations</h2>
                  <p className="section-subtitle">Handpicked places for your next escape</p>
                </div>
                <button className="btn-secondary" onClick={() => navigate('explore')}>
                  View All <ChevronRight size={15}/>
                </button>
              </div>
              {loading ? (
                <div className="loader-spinner" />
              ) : (
                <div className="destinations-grid">
                  {destinations.slice(0, 3).map(item => (
                    <DestinationCard key={item.id} item={item}
                      onBook={() => setBookingModalDest(item)}
                      onDetail={() => setDetailModalDest(item)} />
                  ))}
                </div>
              )}
            </div>

            {/* My Recent Bookings */}
            <div>
              <div className="section-header">
                <div>
                  <h2 className="section-title">My Recent Bookings</h2>
                  <p className="section-subtitle">Your latest tour reservations</p>
                </div>
              </div>
              {myBookings.length === 0 ? (
                <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                  <Briefcase size={40} style={{ color: 'var(--text-light)', margin: '0 auto 12px' }} />
                  <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: '8px' }}>No bookings yet</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Explore destinations and book your first tour!</p>
                  <button className="btn-primary" onClick={() => navigate('explore')}>
                    <Compass size={16}/> Explore Now
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {myBookings.slice(0, 4).map(bk => (
                    <div key={bk.id} className="recent-booking-card" style={{ cursor: 'pointer' }} onClick={() => { loadAllBookingsData(); setShowBookingsDrawer(true); }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                        <div style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                          <img src={destinations.find(d => d.name === bk.destination?.name)?.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=100'}
                            alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem' }}>{bk.destination?.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <MapPin size={12} style={{ display: 'inline', marginRight: '3px' }}/>{bk.destination?.location} · {bk.travelDate}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--primary)' }}>₹{bk.totalPrice?.toLocaleString()}</span>
                        <span className={`status-badge status-${(bk.bookingStatus || bk.status || 'confirmed').toLowerCase().replace(' ', '_')}`}>
                          {bk.bookingStatus || bk.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* EXPLORE VIEW */}
        {activeView === 'explore' && (
          <>
            {/* Hero */}
            <header className="hero-section">
              <div className="hero-eyebrow">
                <Leaf size={13}/> Explore More. Leave Less.
              </div>
              <h1 className="hero-title">
                Unforgettable Journeys,<br />
                <span className="highlight">Extraordinary Places</span>
              </h1>
              <p className="hero-subtitle">
                Discover serene hill stations, tropical beaches, ancient heritage wonders, and snow-capped adventure peaks — with seamless instant booking.
              </p>

              <div className="search-bar-container">
                <div className="search-input-wrapper">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search destinations (e.g. Ooty, Goa, Munnar)..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadDestinationsData()}
                  />
                </div>
                <button className="btn-primary" onClick={loadDestinationsData}>
                  Find Tours
                </button>
              </div>

              {/* Promo Banner */}
              {offersList.length > 0 && (
                <div className="offers-banner">
                  <div className="offers-banner-badge"><Tag size={12}/> Promo Codes</div>
                  <div className="offers-banner-items">
                    {offersList.map(off => (
                      <div key={off.id} className="offer-pill">
                        <strong>{off.code}</strong>: {off.discountType === 'percentage' ? `${off.discountValue}% OFF` : `₹${off.discountValue} OFF`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-number">{destinations.length}+</div>
                  <div className="stat-label">Exotic Locations</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{bookingsList.length || 12}+</div>
                  <div className="stat-label">Total Bookings</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">4.9 ★</div>
                  <div className="stat-label">Average Rating</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">100%</div>
                  <div className="stat-label">Instant Confirm</div>
                </div>
              </div>
            </header>

            {/* Category Filter */}
            <div className="category-filter-bar">
              <span className="category-filter-label">Filter:</span>
              {CATEGORIES.map(cat => (
                <button key={cat} className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}>{cat}</button>
              ))}
            </div>

            {/* Section Header */}
            <div className="section-header">
              <div>
                <h2 className="section-title">
                  {selectedCategory === 'All' ? 'Featured Destinations' : selectedCategory}
                </h2>
                <p className="section-subtitle">Handpicked experiences with exclusive discounts</p>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="loader-spinner" />
            ) : destinations.length === 0 ? (
              <div className="empty-state card" style={{ padding: '60px 24px' }}>
                <Compass size={48} style={{ color: 'var(--text-light)', marginBottom: '16px' }} />
                <h3>No destinations found</h3>
                <p>Try a different keyword or category filter.</p>
              </div>
            ) : (
              <div className="destinations-grid">
                {destinations.map(item => (
                  <DestinationCard key={item.id} item={item}
                    onBook={() => {
                      if (!isLoggedIn) {
                        addToast('Please log in to book a tour.', 'error');
                        navigate('login');
                        return;
                      }
                      setBookingModalDest(item);
                    }}
                    onDetail={() => setDetailModalDest(item)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Booking Modal */}
      {bookingModalDest && (
        <div className="modal-overlay" onClick={() => setBookingModalDest(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setBookingModalDest(null)}><X size={17}/></button>
            <div className="modal-header">
              <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Instant Reservation</div>
              <h2 className="modal-title">Book {bookingModalDest.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                <MapPin size={13} color="var(--accent)"/> {bookingModalDest.location}
              </div>
            </div>
            <form onSubmit={handleBookingSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="input-field" placeholder="Your full name" value={bookingForm.userName}
                  onChange={e => setBookingForm({ ...bookingForm, userName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="input-field" placeholder="your.email@example.com" value={bookingForm.userEmail}
                  onChange={e => setBookingForm({ ...bookingForm, userEmail: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Travel Date</label>
                  <input type="date" className="input-field" value={bookingForm.travelDate}
                    onChange={e => setBookingForm({ ...bookingForm, travelDate: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Guests</label>
                  <input type="number" min="1" max="20" className="input-field" value={bookingForm.numberOfGuests}
                    onChange={e => setBookingForm({ ...bookingForm, numberOfGuests: parseInt(e.target.value) || 1 })} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Contact Number</label>
                <input type="tel" className="input-field" placeholder="+91 98765 43210" value={bookingForm.contactNumber}
                  onChange={e => setBookingForm({ ...bookingForm, contactNumber: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Promo Code</span>
                  {appliedOffer && <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓ Applied</span>}
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" className="input-field" placeholder="e.g. SUMMER20" value={promoInput}
                    onChange={e => setPromoInput(e.target.value.toUpperCase())} />
                  <button type="button" className="btn-secondary" onClick={handleApplyPromoCode} disabled={validatingPromo} style={{ flexShrink: 0 }}>
                    {validatingPromo ? 'Checking...' : 'Apply'}
                  </button>
                </div>
              </div>
              <div className="price-summary-box">
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className="price-summary-title">₹{bookingModalDest.price?.toLocaleString()} × {bookingForm.numberOfGuests} Guest(s)</span>
                    <span>₹{getRawTotal().toLocaleString()}</span>
                  </div>
                  {appliedOffer && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)', fontSize: '0.85rem', marginBottom: '6px' }}>
                      <span>Promo Discount ({appliedOffer.code})</span>
                      <span>-₹{(appliedOffer.discountAmount || 0).toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1.5px solid var(--border-light)', paddingTop: '10px', marginTop: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Total Payable:</span>
                    <span className="price-summary-total">₹{((appliedOffer ? (appliedOffer.finalTotal ?? appliedOffer.finalPrice ?? (getRawTotal() - (appliedOffer.discountAmount || 0))) : getRawTotal()) || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
                <CheckCircle2 size={17}/> Confirm & Reserve Tour
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModalDest && (
        <div className="modal-overlay" onClick={() => setDetailModalDest(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px' }}>
            <button className="modal-close-btn" onClick={() => setDetailModalDest(null)}><X size={17}/></button>
            <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', height: '230px', marginBottom: '22px' }}>
              <img src={detailModalDest.image} alt={detailModalDest.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <span className="card-category-badge" style={{ position: 'static' }}>{detailModalDest.category}</span>
              {detailModalDest.offerTag && <span className="card-offer-badge" style={{ position: 'static' }}><Tag size={11}/> {detailModalDest.offerTag}</span>}
              <span style={{ color: 'var(--charcoal)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                <Star size={15} fill="#F59E0B" color="#F59E0B"/> {detailModalDest.rating || 4.8}
              </span>
            </div>
            <h2 className="modal-title">{detailModalDest.name}</h2>
            <div style={{ color: 'var(--accent)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '14px' }}>
              <MapPin size={14}/> {detailModalDest.location}
            </div>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '22px' }}>{detailModalDest.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'var(--cream)', borderRadius: 'var(--radius-sm)', marginBottom: '22px' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Duration</div>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>{detailModalDest.duration}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Per Person</div>
                {detailModalDest.originalPrice ? (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', justifyContent: 'flex-end' }}>
                    <span style={{ textDecoration: 'line-through', color: 'var(--text-light)', fontSize: '0.85rem' }}>₹{detailModalDest.originalPrice?.toLocaleString()}</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>₹{detailModalDest.price?.toLocaleString()}</span>
                  </div>
                ) : (
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>₹{detailModalDest.price?.toLocaleString()}</div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDetailModalDest(null)}>Close</button>
              <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => {
                if (!isLoggedIn) { addToast('Please log in to book.', 'error'); navigate('login'); return; }
                setBookingModalDest(detailModalDest);
                setDetailModalDest(null);
              }}>
                Book Now <ChevronRight size={15}/>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* My Bookings Drawer */}
      {showBookingsDrawer && (
        <div className="modal-overlay" onClick={() => setShowBookingsDrawer(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <button className="modal-close-btn" onClick={() => setShowBookingsDrawer(false)}><X size={17}/></button>
            <div className="modal-header">
              <h2 className="modal-title">My Bookings</h2>
              <p className="modal-subtitle">Your confirmed tour reservations</p>
            </div>
            {myBookings.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 0' }}>
                <Briefcase size={40} style={{ color: 'var(--text-light)', marginBottom: '12px' }} />
                <p>No bookings yet. Explore destinations and book your first tour!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '60vh', overflowY: 'auto' }}>
                {myBookings.map(bk => {
                  const isCancelled = bk.bookingStatus === 'CANCELLED' || bk.status === 'Cancelled';
                  const isCompleted = bk.bookingStatus === 'COMPLETED' || bk.status === 'Completed';
                  const isPending = bk.bookingStatus === 'PENDING_PAYMENT' || bk.paymentStatus === 'PENDING';
                  const canCancel = !isCancelled && !isCompleted;

                  return (
                    <div key={bk.id} style={{ background: 'var(--cream)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '18px 20px', borderLeft: `4px solid ${isCancelled ? 'var(--error)' : isPending ? '#B8860B' : isCompleted ? 'var(--info)' : 'var(--primary)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)' }}>REF: {bk.id}</span>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className={`status-badge status-${(bk.bookingStatus || bk.status || 'confirmed').toLowerCase().replace(' ', '_')}`}>
                            {bk.bookingStatus || bk.status}
                          </span>
                          <span className={`status-badge status-${(bk.paymentStatus || 'pending').toLowerCase()}`}>
                            Payment: {bk.paymentStatus || 'PENDING'}
                          </span>
                          {isCancelled && bk.refundStatus && bk.refundStatus !== 'NOT_APPLICABLE' && (
                            <span className={`status-badge status-${bk.refundStatus.toLowerCase()}`}>
                              Refund: {bk.refundStatus}
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '4px' }}>{bk.destination?.name}</h3>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.83rem', marginBottom: '12px' }}>
                        <MapPin size={12} style={{ display: 'inline', marginRight: '3px' }}/>{bk.destination?.location}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', fontSize: '0.82rem', background: 'white', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '12px' }}>
                        <div><span style={{ color: 'var(--text-light)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Travel Date</span><strong>{bk.travelDate}</strong></div>
                        <div><span style={{ color: 'var(--text-light)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Guests</span><strong>{bk.numberOfGuests} Person(s)</strong></div>
                        <div><span style={{ color: 'var(--text-light)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Amount</span><strong style={{ color: 'var(--primary)' }}>₹{bk.totalPrice?.toLocaleString()}</strong></div>
                      </div>

                      {/* Cancellation / Refund Summary if cancelled */}
                      {isCancelled && (
                        <div style={{ background: 'var(--error-bg)', border: '1px solid #F5C6CB', borderRadius: 'var(--radius-xs)', padding: '10px 14px', marginBottom: '12px', fontSize: '0.82rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: 'var(--error)', fontWeight: 700 }}>Cancelled Reservation</span>
                            <span style={{ color: 'var(--text-muted)' }}>{bk.cancellationDate ? new Date(bk.cancellationDate).toLocaleDateString() : ''}</span>
                          </div>
                          {bk.cancellationReason && (
                            <div style={{ color: 'var(--text-medium)', marginBottom: '4px' }}>
                              <strong>Reason:</strong> {bk.cancellationReason}
                            </div>
                          )}
                          {bk.refundAmount > 0 ? (
                            <div style={{ color: 'var(--success)', fontWeight: 700 }}>
                              ✓ Refund Amount: ₹{bk.refundAmount.toLocaleString()} ({bk.refundPercentage || 0}% policy applied) — Status: {bk.refundStatus}
                            </div>
                          ) : (
                            <div style={{ color: 'var(--text-muted)' }}>
                              Non-refundable as per policy (cancelled within 72 hours of travel).
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center' }}>
                        {isPending && (
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                            disabled={paymentProcessingId === bk.id}
                            onClick={() => initiatePayment(bk)}
                          >
                            <CreditCard size={14} />
                            {paymentProcessingId === bk.id ? 'Connecting Gateway...' : 'Pay Now (Razorpay)'}
                          </button>
                        )}

                        {canCancel && (
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: '8px 14px', fontSize: '0.82rem', color: 'var(--error)', borderColor: 'var(--error)' }}
                            onClick={() => handleOpenCancelModal(bk)}
                          >
                            <RotateCcw size={13} style={{ display: 'inline', marginRight: '4px' }} />
                            Cancel Booking
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancellingBooking && (
        <div className="modal-overlay" onClick={() => !isSubmittingCancel && setCancellingBooking(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <button className="modal-close-btn" disabled={isSubmittingCancel} onClick={() => setCancellingBooking(null)}><X size={17}/></button>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error)', marginBottom: '6px' }}>
                <AlertTriangle size={22} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cancellation Request</span>
              </div>
              <h2 className="modal-title">Cancel Tour Booking</h2>
              <p className="modal-subtitle">Booking Ref: <strong>{cancellingBooking.id || cancellingBooking._id}</strong></p>
            </div>

            <div style={{ background: 'var(--cream)', padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Destination:</span>
                <strong>{cancellingBooking.destination?.name || 'Tour Package'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Travel Date:</span>
                <strong>{cancellingBooking.travelDate}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Amount Paid:</span>
                <strong style={{ color: 'var(--primary)' }}>₹{cancellingBooking.totalPrice?.toLocaleString()}</strong>
              </div>
            </div>

            {/* Cancellation Policy Engine Visualizer */}
            <div className="policy-card">
              <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '10px', color: 'var(--charcoal)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={16} /> Cancellation & Refund Policy
              </div>
              <div className={`policy-tier-row ${cancellationModalEstimate?.refundPercentage === 90 ? 'active' : ''}`}>
                <span>7 or more days before trip:</span>
                <strong>90% Refund</strong>
              </div>
              <div className={`policy-tier-row ${cancellationModalEstimate?.refundPercentage === 50 ? 'active' : ''}`}>
                <span>3 to 6 days before trip:</span>
                <strong>50% Refund</strong>
              </div>
              <div className={`policy-tier-row ${cancellationModalEstimate?.refundPercentage === 0 ? 'active' : ''}`}>
                <span>Within 72 hours of trip:</span>
                <strong>No Refund (0%)</strong>
              </div>

              {cancellationModalEstimate && (
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {cancellationModalEstimate.daysBeforeTrip} days ({cancellationModalEstimate.hoursBeforeTrip} hrs) before trip
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)' }}>
                      {cancellationModalEstimate.policyApplied}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Estimated Refund</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: cancellationModalEstimate.refundAmount > 0 ? 'var(--success)' : 'var(--error)' }}>
                      ₹{cancellationModalEstimate.refundAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginTop: '14px' }}>
              <label className="form-label">Reason for Cancellation</label>
              <select
                className="input-field"
                value={cancellationReason}
                onChange={e => setCancellationReason(e.target.value)}
              >
                <option value="Change of travel plans">Change of travel plans</option>
                <option value="Personal emergency">Personal emergency</option>
                <option value="Medical / Health reason">Medical / Health reason</option>
                <option value="Work / Schedule conflict">Work / Schedule conflict</option>
                <option value="Found alternative arrangement">Found alternative arrangement</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={isSubmittingCancel}
                onClick={() => setCancellingBooking(null)}
              >
                Keep Reservation
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center', background: 'var(--error)', borderColor: 'var(--error)' }}
                disabled={isSubmittingCancel}
                onClick={handleConfirmCancellation}
              >
                {isSubmittingCancel ? 'Processing...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared admin modals (add/edit destination) */}
      <SharedModals
        showAddModal={showAddModal} setShowAddModal={setShowAddModal}
        editPlaceModal={editPlaceModal} setEditPlaceModal={setEditPlaceModal}
        editOfferModal={editOfferModal} setEditOfferModal={setEditOfferModal}
        addForm={addForm} setAddForm={setAddForm}
        offerForm={offerForm} setOfferForm={setOfferForm}
        handleAddDestinationSubmit={handleAddDestinationSubmit}
        handleEditDestinationSubmit={handleEditDestinationSubmit}
        handleSaveOfferSubmit={handleSaveOfferSubmit}
      />

      <ToastContainer toasts={toasts} />
    </div>
  );
}

// =============================================
// SUB-COMPONENTS
// =============================================

function NavBar({ currentUser, activeView, navigate, navigateUser, navigateAdmin, handleLogout, isAdmin, loadAllBookingsData, loadOffersData, setShowBookingsDrawer, loadAdminRevenueData, loadUsersData }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  const handleNavClick = (fn) => {
    fn();
    closeMobile();
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-brand" onClick={() => navigate(currentUser ? (isAdmin ? 'admin-dashboard' : 'explore') : 'login')}>
          <div className="nav-brand-icon"><TreePine size={22} color="white"/></div>
          <span className="nav-brand-text">Nature<span>Trails</span></span>
        </div>

        {/* Desktop nav links */}
        <div className="nav-links nav-links-desktop">
          {currentUser && !isAdmin && (
            <>
              <div className={`nav-item ${activeView === 'explore' ? 'active' : ''}`} onClick={() => navigate('explore')}>
                <Compass size={16}/> Explore
              </div>
              <div className={`nav-item ${activeView === 'user-dashboard' ? 'active' : ''}`} onClick={() => navigate('user-dashboard')}>
                <Home size={16}/> Dashboard
              </div>
              <div className="nav-item" onClick={() => { loadAllBookingsData(); navigate('user-dashboard'); if (setShowBookingsDrawer) setShowBookingsDrawer(true); }}>
                <Briefcase size={16}/> My Bookings
              </div>
            </>
          )}
          {isAdmin && (
            <>
              <div className={`nav-item admin-nav-btn ${activeView === 'admin-dashboard' ? 'active' : ''}`} onClick={() => navigate('admin-dashboard')}>
                <LayoutDashboard size={16}/> Dashboard
              </div>
              <div className={`nav-item ${activeView === 'admin-users' ? 'active' : ''}`} onClick={() => { navigate('admin-users'); if (typeof loadUsersData === 'function') loadUsersData(); }}>
                <Users size={16}/> Users
              </div>
              <div className={`nav-item ${activeView === 'admin-places' ? 'active' : ''}`} onClick={() => navigate('admin-places')}>
                <MapPin size={16}/> Destinations
              </div>
              <div className={`nav-item ${activeView === 'admin-bookings' ? 'active' : ''}`} onClick={() => { navigate('admin-bookings'); loadAllBookingsData(); }}>
                <Briefcase size={16}/> Bookings
              </div>
              <div className={`nav-item ${activeView === 'admin-revenue' ? 'active' : ''}`} onClick={() => { navigate('admin-revenue'); if (loadAdminRevenueData) loadAdminRevenueData(); }}>
                <TrendingUp size={16}/> Revenue
              </div>
              <div className="nav-divider"></div>
              <div className="nav-item" onClick={() => navigate('explore')}><Globe size={16}/> View Site</div>
            </>
          )}
          {!currentUser && (
            <div className={`nav-item ${activeView === 'login' ? 'active' : ''}`} onClick={() => navigate('login')}>
              <User size={16}/> Sign In
            </div>
          )}
          {currentUser && (
            <>
              <div className="nav-divider"></div>
              <div className="user-badge">
                <User size={14}/>
                <span>{currentUser.name.split(' ')[0]}</span>
                <span className="user-badge-role">{currentUser.role}</span>
              </div>
              <button className="btn-secondary" onClick={handleLogout} style={{ padding: '8px 14px' }} title="Logout">
                <LogOut size={15}/>
              </button>
            </>
          )}
        </div>

        {/* Mobile: hamburger button only */}
        <div className="nav-mobile-right">
          <button
            className="hamburger-btn"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span className={`hamburger-line ${mobileOpen ? 'open-1' : ''}`}></span>
            <span className={`hamburger-line ${mobileOpen ? 'open-2' : ''}`}></span>
            <span className={`hamburger-line ${mobileOpen ? 'open-3' : ''}`}></span>
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      {mobileOpen && (
        <div className="mobile-nav-overlay" onClick={closeMobile}>
          <div className="mobile-nav-menu" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="mobile-nav-header">
              <div className="nav-brand">
                <div className="nav-brand-icon"><TreePine size={20} color="white"/></div>
                <span className="nav-brand-text">Nature<span>Trails</span></span>
              </div>
              <button className="modal-close-btn" onClick={closeMobile}><X size={17}/></button>
            </div>

            {/* Mobile User Profile Card */}
            {currentUser && (
              <div className="mobile-user-profile">
                <div className="mobile-user-avatar">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="mobile-user-info">
                  <div className="mobile-user-name">{currentUser.name}</div>
                  <div className="mobile-user-email">{currentUser.email}</div>
                </div>
                <span className="user-badge-role">{currentUser.role}</span>
              </div>
            )}

            {/* Nav Items */}
            <div className="mobile-nav-items">
              {currentUser && !isAdmin && (
                <>
                  <div className={`mobile-nav-item ${activeView === 'explore' ? 'active' : ''}`}
                    onClick={() => handleNavClick(() => navigate('explore'))}>
                    <Compass size={19}/> Explore Destinations
                  </div>
                  <div className={`mobile-nav-item ${activeView === 'user-dashboard' ? 'active' : ''}`}
                    onClick={() => handleNavClick(() => navigate('user-dashboard'))}>
                    <Home size={19}/> My Dashboard
                  </div>
                  <div className="mobile-nav-item"
                    onClick={() => handleNavClick(() => { loadAllBookingsData(); navigate('user-dashboard'); if (setShowBookingsDrawer) setShowBookingsDrawer(true); })}>
                    <Briefcase size={19}/> My Bookings
                  </div>
                </>
              )}

              {isAdmin && (
                <>
                  <div className={`mobile-nav-item ${activeView === 'admin-dashboard' ? 'active' : ''}`}
                    onClick={() => handleNavClick(() => navigate('admin-dashboard'))}>
                    <LayoutDashboard size={19}/> Dashboard
                  </div>
                  <div className={`mobile-nav-item ${activeView === 'admin-users' ? 'active' : ''}`}
                    onClick={() => handleNavClick(() => { navigate('admin-users'); if (typeof loadUsersData === 'function') loadUsersData(); })}>
                    <Users size={19}/> Users
                  </div>
                  <div className={`mobile-nav-item ${activeView === 'admin-places' ? 'active' : ''}`}
                    onClick={() => handleNavClick(() => navigate('admin-places'))}>
                    <MapPin size={19}/> Destinations
                  </div>
                  <div className={`mobile-nav-item ${activeView === 'admin-bookings' ? 'active' : ''}`}
                    onClick={() => handleNavClick(() => { navigate('admin-bookings'); loadAllBookingsData(); })}>
                    <Briefcase size={19}/> Bookings
                  </div>
                  <div className={`mobile-nav-item ${activeView === 'admin-revenue' ? 'active' : ''}`}
                    onClick={() => handleNavClick(() => { navigate('admin-revenue'); if (loadAdminRevenueData) loadAdminRevenueData(); })}>
                    <TrendingUp size={19}/> Revenue Analytics
                  </div>
                  <div className={`mobile-nav-item ${activeView === 'admin-offers' ? 'active' : ''}`}
                    onClick={() => handleNavClick(() => { navigate('admin-offers'); loadOffersData(); })}>
                    <Tag size={19}/> Promo Offers
                  </div>
                  <div className="mobile-nav-divider"></div>
                  <div className="mobile-nav-item" onClick={() => handleNavClick(() => navigate('explore'))}>
                    <Globe size={19}/> View Site
                  </div>
                </>
              )}

              {!currentUser && (
                <div className="mobile-nav-item" onClick={() => handleNavClick(() => navigate('login'))}>
                  <User size={19}/> Sign In
                </div>
              )}
            </div>

            {/* Footer */}
            {currentUser && (
              <div className="mobile-nav-footer">
                <button className="btn-danger" style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => { handleLogout(); closeMobile(); }}>
                  <LogOut size={16}/> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function DestinationCard({ item, onBook, onDetail }) {
  return (
    <div className="destination-card">
      <div className="card-image-wrapper">
        <img className="card-image" src={item.image} alt={item.name} />
        <span className="card-category-badge">{item.category}</span>
        {item.offerTag && <span className="card-offer-badge"><Tag size={11}/> {item.offerTag}</span>}
        <span className="card-rating-badge"><Star size={13} fill="#F59E0B" color="#F59E0B"/> {item.rating || 4.8}</span>
      </div>
      <div className="card-content">
        <div className="card-location"><MapPin size={13}/><span>{item.location}</span></div>
        <h3 className="card-title">{item.name}</h3>
        <p className="card-description">{item.description}</p>
        <div className="card-details-row">
          <div className="card-duration"><Clock size={13}/><span>{item.duration}</span></div>
          <div className="card-price">
            <div className="price-label">Starting at</div>
            {item.originalPrice && item.originalPrice > item.price ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                <span className="price-original">₹{item.originalPrice?.toLocaleString()}</span>
                <span className="price-amount">₹{item.price?.toLocaleString()}</span>
              </div>
            ) : (
              <div className="price-amount">₹{item.price?.toLocaleString()}</div>
            )}
          </div>
        </div>
        <div className="card-actions">
          <button className="btn-secondary" onClick={onDetail}>Details</button>
          <button className="btn-primary" onClick={onBook}>Book Tour</button>
        </div>
      </div>
    </div>
  );
}

function LoginPage({ authForm, setAuthForm, authLoading, authError, showPassword, setShowPassword, handleLogin, navigate }) {
  return (
    <div className="auth-page">
      <div className="auth-left">
        <img className="auth-left-image" src="https://images.unsplash.com/photo-1545389336-cf090694435e?q=80&w=1200&auto=format&fit=crop" alt="Nature Travel" />
        <div className="auth-left-overlay">
          <div className="auth-left-logo">
            <div className="auth-left-logo-icon"><TreePine size={22}/></div>
            <span className="auth-left-logo-text">NatureTrails</span>
          </div>
          <div className="auth-left-content">
            <div className="auth-left-tagline"><Leaf size={12}/> Eco Travel Platform</div>
            <h2 className="auth-left-title">Explore More.<br/>Leave Less.</h2>
            <p className="auth-left-desc">Discover handpicked eco-travel destinations across India's most breathtaking landscapes.</p>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrapper">
          <div className="auth-form-card">
            <div className="auth-logo-small">
              <div className="auth-logo-small-icon"><TreePine size={18}/></div>
              <span className="auth-logo-small-text">NatureTrails</span>
            </div>
            <h1 className="auth-form-title">Welcome back</h1>
            <p className="auth-form-subtitle">Sign in to explore destinations and manage your bookings.</p>

            {authError && (
              <div className="auth-error-msg"><AlertCircle size={15}/> {authError}</div>
            )}

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="input-field" placeholder="you@example.com"
                  value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} required autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} className="input-field" placeholder="••••••••"
                    value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} required style={{ paddingRight: '46px' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                    {showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={authLoading}
                style={{ width: '100%', justifyContent: 'center', padding: '13px', marginTop: '6px', borderRadius: 'var(--radius-sm)' }}>
                {authLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="auth-switch">
              Don't have an account?{' '}
              <span className="auth-switch-link" onClick={() => navigate('register')}>Create account</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegisterPage({ authForm, setAuthForm, authLoading, authError, showPassword, setShowPassword, handleRegister, navigate }) {
  return (
    <div className="auth-page">
      <div className="auth-left">
        <img className="auth-left-image" src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop" alt="Mountain Travel" />
        <div className="auth-left-overlay">
          <div className="auth-left-logo">
            <div className="auth-left-logo-icon"><TreePine size={22}/></div>
            <span className="auth-left-logo-text">NatureTrails</span>
          </div>
          <div className="auth-left-content">
            <div className="auth-left-tagline"><Mountain size={12}/> Adventure Awaits</div>
            <h2 className="auth-left-title">Your Journey<br/>Starts Here.</h2>
            <p className="auth-left-desc">Join thousands of travelers discovering eco-friendly destinations across India's most pristine wilderness.</p>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrapper">
          <div className="auth-form-card">
            <div className="auth-logo-small">
              <div className="auth-logo-small-icon"><TreePine size={18}/></div>
              <span className="auth-logo-small-text">NatureTrails</span>
            </div>
            <h1 className="auth-form-title">Create account</h1>
            <p className="auth-form-subtitle">Join NatureTrails and start exploring sustainable travel.</p>

            {authError && (
              <div className="auth-error-msg"><AlertCircle size={15}/> {authError}</div>
            )}

            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="input-field" placeholder="Your full name"
                  value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} required autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="input-field" placeholder="you@example.com"
                  value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} className="input-field" placeholder="Min. 6 characters"
                    value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} required style={{ paddingRight: '46px' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                    {showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={authLoading}
                style={{ width: '100%', justifyContent: 'center', padding: '13px', marginTop: '6px', borderRadius: 'var(--radius-sm)' }}>
                {authLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="auth-switch">
              Already have an account?{' '}
              <span className="auth-switch-link" onClick={() => navigate('login')}>Sign in</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SharedModals({ showAddModal, setShowAddModal, editPlaceModal, setEditPlaceModal, editOfferModal, setEditOfferModal, addForm, setAddForm, offerForm, setOfferForm, handleAddDestinationSubmit, handleEditDestinationSubmit, handleSaveOfferSubmit }) {
  const CATEGORIES_FILTERED = ['Hills & Nature', 'Beach & Fun', 'Heritage & Culture', 'Adventure & Snow'];

  return (
    <>
      {/* Add / Edit Destination Modal */}
      {(showAddModal || editPlaceModal) && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); setEditPlaceModal(null); }}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => { setShowAddModal(false); setEditPlaceModal(null); }}><X size={17}/></button>
            <div className="modal-header">
              <h2 className="modal-title">{editPlaceModal ? `Edit ${editPlaceModal.name}` : 'Add New Destination'}</h2>
              <p className="modal-subtitle">{editPlaceModal ? 'Modify destination details' : 'Add a new travel spot to the NatureTrails catalog'}</p>
            </div>
            <form onSubmit={editPlaceModal ? handleEditDestinationSubmit : handleAddDestinationSubmit}>
              <div className="form-group">
                <label className="form-label">Destination Name</label>
                <input type="text" className="input-field" placeholder="e.g. Coorg Coffee Hills" value={addForm.name}
                  onChange={e => setAddForm({ ...addForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Location / State</label>
                <input type="text" className="input-field" placeholder="e.g. Karnataka, India" value={addForm.location}
                  onChange={e => setAddForm({ ...addForm, location: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="input-field" value={addForm.category} onChange={e => setAddForm({ ...addForm, category: e.target.value })}>
                    {CATEGORIES_FILTERED.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Price (₹)</label>
                  <input type="number" className="input-field" placeholder="4999" value={addForm.price}
                    onChange={e => setAddForm({ ...addForm, price: e.target.value })} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Original Price (Optional)</label>
                  <input type="number" className="input-field" placeholder="5999" value={addForm.originalPrice}
                    onChange={e => setAddForm({ ...addForm, originalPrice: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Offer Tag Badge</label>
                  <input type="text" className="input-field" placeholder="e.g. 20% OFF" value={addForm.offerTag}
                    onChange={e => setAddForm({ ...addForm, offerTag: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input type="url" className="input-field" placeholder="https://images.unsplash.com/photo-..." value={addForm.image}
                  onChange={e => setAddForm({ ...addForm, image: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="input-field" rows="3" placeholder="Brief highlights about the destination..."
                  value={addForm.description} onChange={e => setAddForm({ ...addForm, description: e.target.value })} />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
                <PlusCircle size={17}/> {editPlaceModal ? 'Update Destination' : 'Publish Destination'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Set Offer Modal */}
      {editOfferModal && (
        <div className="modal-overlay" onClick={() => setEditOfferModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <button className="modal-close-btn" onClick={() => setEditOfferModal(null)}><X size={17}/></button>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                <Tag size={14}/> Destination Offer Config
              </div>
              <h2 className="modal-title">Set Offer for {editOfferModal.name}</h2>
            </div>
            <form onSubmit={handleSaveOfferSubmit}>
              <div className="form-group">
                <label className="form-label">Discounted Selling Price (₹)</label>
                <input type="number" className="input-field" placeholder="e.g. 3999" value={offerForm.price}
                  onChange={e => setOfferForm({ ...offerForm, price: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Original Price (Strikethrough) (₹)</label>
                <input type="number" className="input-field" placeholder="e.g. 4999" value={offerForm.originalPrice}
                  onChange={e => setOfferForm({ ...offerForm, originalPrice: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Offer Badge Tag</label>
                <input type="text" className="input-field" placeholder="e.g. FLAT 20% OFF" value={offerForm.offerTag}
                  onChange={e => setOfferForm({ ...offerForm, offerTag: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setOfferForm({ price: editOfferModal.price, originalPrice: null, offerTag: '' })}>
                  Clear Offer
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                  <Tag size={15}/> Save Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type === 'success' ? <CheckCircle2 size={17} color="var(--primary)"/> : <AlertCircle size={17} color="var(--error)"/>}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

function AdminRevenueSection({
  revenueFilter,
  setRevenueFilter,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  revenueKpis,
  revenueTransactions,
  revenueRefunds,
  revenueTab,
  setRevenueTab,
  revenueLoading,
  loadAdminRevenueData
}) {
  return (
    <div className="admin-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="admin-section-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <TrendingUp size={20} color="var(--primary)" />
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800 }}>
              Payment-Based Revenue & Refund Analytics
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Calculated strictly from verified Razorpay payments (Gross Revenue) minus completed refunds (Net Revenue).
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => loadAdminRevenueData()}
          disabled={revenueLoading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={revenueLoading ? 'spin' : ''} />
          {revenueLoading ? 'Updating...' : 'Refresh Data'}
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="revenue-filter-bar">
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-medium)', marginRight: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <CalendarRange size={15} /> Period:
        </span>
        {[
          { key: 'all', label: 'All Time' },
          { key: 'today', label: 'Today' },
          { key: 'week', label: 'This Week' },
          { key: 'month', label: 'This Month' },
          { key: 'year', label: 'This Year' },
          { key: 'custom', label: 'Custom Range' },
        ].map(f => (
          <button
            key={f.key}
            type="button"
            className={`date-pill ${revenueFilter === f.key ? 'active' : ''}`}
            onClick={() => {
              setRevenueFilter(f.key);
              if (f.key !== 'custom') loadAdminRevenueData(f.key);
            }}
          >
            {f.label}
          </button>
        ))}

        {revenueFilter === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', flexWrap: 'wrap' }}>
            <input
              type="date"
              className="input-field"
              style={{ padding: '6px 10px', fontSize: '0.8rem', width: 'auto' }}
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>to</span>
            <input
              type="date"
              className="input-field"
              style={{ padding: '6px 10px', fontSize: '0.8rem', width: 'auto' }}
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
            />
            <button
              type="button"
              className="btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              onClick={() => loadAdminRevenueData('custom', customStartDate, customEndDate)}
            >
              Apply Filter
            </button>
          </div>
        )}
      </div>

      {/* 9 KPI Metric Cards */}
      <div className="revenue-kpi-grid">
        {/* 1. Gross Revenue */}
        <div className="revenue-kpi-card highlight-gross">
          <div>
            <div className="metric-label" style={{ color: 'var(--primary)' }}>1. Gross Revenue</div>
            <div className="metric-value" style={{ color: 'var(--primary)', fontSize: '1.75rem' }}>
              ₹{(revenueKpis?.grossRevenue || 0).toLocaleString()}
            </div>
          </div>
          <div className="metric-subtext">Verified successful payments</div>
        </div>

        {/* 2. Total Refunds */}
        <div className="revenue-kpi-card highlight-refund">
          <div>
            <div className="metric-label" style={{ color: 'var(--error)' }}>2. Total Refunds</div>
            <div className="metric-value" style={{ color: 'var(--error)', fontSize: '1.75rem' }}>
              ₹{(revenueKpis?.totalRefunds || 0).toLocaleString()}
            </div>
          </div>
          <div className="metric-subtext">Completed refunds processed</div>
        </div>

        {/* 3. Net Revenue */}
        <div className="revenue-kpi-card highlight-net">
          <div>
            <div className="metric-label" style={{ color: '#008080' }}>3. Net Revenue</div>
            <div className="metric-value" style={{ color: '#008080', fontSize: '1.75rem' }}>
              ₹{(revenueKpis?.netRevenue || 0).toLocaleString()}
            </div>
          </div>
          <div className="metric-subtext">Formula: Gross − Completed Refunds</div>
        </div>

        {/* 4. Successful Payments */}
        <div className="revenue-kpi-card">
          <div>
            <div className="metric-label">4. Successful Payments</div>
            <div className="metric-value">{revenueKpis?.successfulPayments || 0}</div>
          </div>
          <div className="metric-subtext">Gateway verified transactions</div>
        </div>

        {/* 5. Pending Payments */}
        <div className="revenue-kpi-card">
          <div>
            <div className="metric-label">5. Pending Payments</div>
            <div className="metric-value" style={{ color: '#856404' }}>{revenueKpis?.pendingPayments || 0}</div>
          </div>
          <div className="metric-subtext">Reservations awaiting checkout</div>
        </div>

        {/* 6. Failed Payments */}
        <div className="revenue-kpi-card">
          <div>
            <div className="metric-label">6. Failed Payments</div>
            <div className="metric-value" style={{ color: 'var(--error)' }}>{revenueKpis?.failedPayments || 0}</div>
          </div>
          <div className="metric-subtext">Declined or signature error</div>
        </div>

        {/* 7. Cancelled Bookings */}
        <div className="revenue-kpi-card">
          <div>
            <div className="metric-label">7. Cancelled Bookings</div>
            <div className="metric-value">{revenueKpis?.cancelledBookings || 0}</div>
          </div>
          <div className="metric-subtext">Total tours cancelled</div>
        </div>

        {/* 8. Refunded Bookings */}
        <div className="revenue-kpi-card">
          <div>
            <div className="metric-label">8. Refunded Bookings</div>
            <div className="metric-value">{revenueKpis?.refundedBookings || 0}</div>
          </div>
          <div className="metric-subtext">Completed refund count</div>
        </div>

        {/* 9. Total Refund Pending Amount */}
        <div className="revenue-kpi-card">
          <div>
            <div className="metric-label">9. Pending Refunds</div>
            <div className="metric-value" style={{ color: '#B78103' }}>
              ₹{(revenueKpis?.totalRefundPendingAmount || 0).toLocaleString()}
            </div>
          </div>
          <div className="metric-subtext">Pending gateway confirmation</div>
        </div>
      </div>

      {/* Tables Subtabs */}
      <div style={{ marginTop: '10px' }}>
        <div className="admin-tabs-bar">
          <button
            type="button"
            className={`admin-tab-btn ${revenueTab === 'kpis' ? 'active' : ''}`}
            onClick={() => setRevenueTab('kpis')}
          >
            <Receipt size={16} /> Verified Transactions ({revenueTransactions.length})
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${revenueTab === 'refunds' ? 'active' : ''}`}
            onClick={() => setRevenueTab('refunds')}
          >
            <RotateCcw size={16} /> Processed Refunds ({revenueRefunds.length})
          </button>
        </div>

        {/* Tab 1: Verified Transactions */}
        {revenueTab === 'kpis' && (
          <div>
            {revenueTransactions.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px' }}>
                <Receipt size={36} style={{ color: 'var(--text-light)', marginBottom: '8px' }} />
                <p>No verified transactions found for this period.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Payment ID</th>
                      <th>Customer</th>
                      <th>Destination</th>
                      <th>Amount Paid</th>
                      <th>Payment Date</th>
                      <th>Razorpay Payment ID</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueTransactions.map(tx => (
                      <tr key={tx.id || tx.paymentId}>
                        <td>
                          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--primary)', fontSize: '0.8rem' }}>
                            {tx.paymentId}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{tx.customerName}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{tx.customerEmail}</div>
                        </td>
                        <td>{tx.destinationName}</td>
                        <td>
                          <strong style={{ color: 'var(--primary)' }}>₹{tx.amount?.toLocaleString()}</strong>
                        </td>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                          {tx.paymentDate ? new Date(tx.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </td>
                        <td>
                          <code style={{ fontSize: '0.78rem', background: 'var(--cream)', padding: '2px 6px', borderRadius: '4px' }}>
                            {tx.razorpayPaymentId}
                          </code>
                        </td>
                        <td>
                          <span className={`status-badge status-${(tx.paymentStatus || 'success').toLowerCase()}`}>
                            {tx.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Processed Refunds */}
        {revenueTab === 'refunds' && (
          <div>
            {revenueRefunds.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px' }}>
                <RotateCcw size={36} style={{ color: 'var(--text-light)', marginBottom: '8px' }} />
                <p>No refund records found for this period.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Refund ID</th>
                      <th>Customer</th>
                      <th>Destination</th>
                      <th>Refund Amount</th>
                      <th>Policy Applied</th>
                      <th>Razorpay Refund ID</th>
                      <th>Status</th>
                      <th>Date Initiated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueRefunds.map(rf => (
                      <tr key={rf.id || rf.refundId}>
                        <td>
                          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--error)', fontSize: '0.8rem' }}>
                            {rf.refundId}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{rf.customerName}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{rf.customerEmail}</div>
                        </td>
                        <td>{rf.destinationName}</td>
                        <td>
                          <strong style={{ color: 'var(--error)' }}>₹{rf.refundAmount?.toLocaleString()}</strong>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                            {rf.cancellationPolicy?.policyApplied || `${rf.cancellationPolicy?.refundPercentage || 0}% Refund`}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {rf.cancellationPolicy?.daysBeforeTravel != null ? `${rf.cancellationPolicy.daysBeforeTravel}d before trip` : ''}
                          </div>
                        </td>
                        <td>
                          <code style={{ fontSize: '0.78rem', background: 'var(--cream)', padding: '2px 6px', borderRadius: '4px' }}>
                            {rf.razorpayRefundId}
                          </code>
                        </td>
                        <td>
                          <span className={`status-badge status-${(rf.refundStatus || 'refunded').toLowerCase()}`}>
                            {rf.refundStatus}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                          {rf.refundInitiatedDate ? new Date(rf.refundInitiatedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
