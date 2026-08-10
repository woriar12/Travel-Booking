const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend connection
app.use(cors());

// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Route & API List
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Tourist Application API (Simple Public Mode) 🌴🚀',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile'
      },
      destinations: {
        getAll: 'GET /api/destinations',
        getById: 'GET /api/destinations/:id',
        create: 'POST /api/destinations'
      },
      bookings: {
        create: 'POST /api/bookings',
        getAll: 'GET /api/bookings'
      }
    }
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/destinations', require('./routes/destinationRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route Not Found - ${req.originalUrl}`
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Tourist App Server is running on port: ${PORT}`);
  console.log(`🌍 Base URL: http://localhost:${PORT}`);
  console.log(`==================================================\n`);
});

module.exports = app;
