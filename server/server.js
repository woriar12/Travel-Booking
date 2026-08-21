const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Render / Vercel reverse proxies
app.set('trust proxy', 1);

// Allowed origins for CORS (local + production frontend URL)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL
].filter(Boolean);

// Enable CORS with credentials for session cookie transmission
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(null, true); // Allow during production for easy deployment
    }
  },
  credentials: true,
  exposedHeaders: ['set-cookie']
}));

// Body Parsing & Cookie Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Server-Side Session Middleware (HttpOnly Cookies - No JWT)
const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
  name: 'naturetrails_sid',
  secret: process.env.SESSION_SECRET || 'naturetrails_session_secret_key_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

// Root Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to NatureTrails API 🌿',
    version: '3.0.0',
    database: 'MongoDB (Mongoose Persistent Storage)',
    auth: 'Server-Side Session (HttpOnly Cookies — No JWT)',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me',
        users: 'GET /api/auth/users [ADMIN]'
      },
      destinations: {
        getAll: 'GET /api/destinations',
        getById: 'GET /api/destinations/:id',
        create: 'POST /api/destinations [ADMIN]',
        update: 'PUT /api/destinations/:id [ADMIN]',
        delete: 'DELETE /api/destinations/:id [ADMIN]'
      },
      bookings: {
        create: 'POST /api/bookings [AUTH]',
        getAll: 'GET /api/bookings [USER/ADMIN]',
        stats: 'GET /api/bookings/stats [ADMIN]',
        updateStatus: 'PATCH /api/bookings/:id/status [ADMIN]'
      },
      offers: {
        getAll: 'GET /api/offers',
        validate: 'POST /api/offers/validate',
        create: 'POST /api/offers [ADMIN]',
        delete: 'DELETE /api/offers/:id [ADMIN]'
      }
    }
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/destinations', require('./routes/destinationRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/offers', require('./routes/offersRoutes'));

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route Not Found — ${req.originalUrl}`
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🌿 NatureTrails Server running on port: ${PORT}`);
  console.log(`🌍 Base URL: http://localhost:${PORT}`);
  console.log(`🗄️ Database: MongoDB (naturetrails)`);
  console.log(`🔐 Auth: Server Session (HttpOnly Cookie) — No JWT`);
  console.log(`==================================================\n`);
});

module.exports = app;
