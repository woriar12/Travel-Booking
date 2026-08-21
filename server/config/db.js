const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  try {
    const primaryUri = process.env.MONGODB_URI;
    if (primaryUri) {
      try {
        const conn = await mongoose.connect(primaryUri);
        console.log(`\n🌿 MongoDB Connected (Cloud Atlas): ${conn.connection.host}/${conn.connection.name}`);
        autoSeedIfEmpty();
        return;
      } catch (cloudErr) {
        console.error(`\n⚠️ Cloud MongoDB Auth Failed (${cloudErr.message}). Falling back to local MongoDB...`);
      }
    }
    
    const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/naturetrails');
    console.log(`\n🌿 MongoDB Connected (Local): ${localConn.connection.host}/${localConn.connection.name}`);
    autoSeedIfEmpty();
  } catch (error) {
    console.error(`\n❌ MongoDB Connection Failed: ${error.message}`);
  }
};

const autoSeedIfEmpty = async () => {
  try {
    const User = require('../models/User');
    const Destination = require('../models/Destination');
    const Offer = require('../models/Offer');

    // Ensure default Admin user exists with admin123
    let admin = await User.findOne({ email: 'admin@travel.com' });
    if (!admin) {
      const hashedAdminPass = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Admin',
        email: 'admin@travel.com',
        password: hashedAdminPass,
        role: 'ADMIN'
      });
      console.log('👤 Created default Admin: admin@travel.com');
    }

    // Ensure default Demo User exists with user123
    let normalUser = await User.findOne({ email: 'user@travel.com' });
    if (!normalUser) {
      const hashedUserPass = await bcrypt.hash('user123', 10);
      await User.create({
        name: 'Demo Traveler',
        email: 'user@travel.com',
        password: hashedUserPass,
        role: 'USER'
      });
      console.log('👤 Created default User: user@travel.com');
    }

    const destCount = await Destination.countDocuments();
    if (destCount === 0) {
      console.log('🌱 Seeding initial destinations and offers...');
      await Destination.insertMany([
        {
          name: 'Ooty Hill Station',
          location: 'Tamil Nadu, India',
          category: 'Hills & Nature',
          price: 3999,
          originalPrice: 4999,
          offerTag: '20% OFF',
          rating: 4.8,
          image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?q=80&w=1000&auto=format&fit=crop',
          description: 'Experience the Queen of Hill Stations in South India with lush tea gardens, scenic toy train, and foggy mountains.',
          duration: '3 Days / 2 Nights',
          isFeatured: true
        },
        {
          name: 'Goa Sunny Beaches',
          location: 'Goa, India',
          category: 'Beach & Fun',
          price: 6399,
          originalPrice: 7999,
          offerTag: 'SUMMER SPECIAL 20% OFF',
          rating: 4.7,
          image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1000&auto=format&fit=crop',
          description: 'Relax on golden sand beaches, enjoy watersports, nightlife, and historic Portuguese architecture.',
          duration: '4 Days / 3 Nights',
          isFeatured: true
        },
        {
          name: 'Munnar Tea Gardens',
          location: 'Kerala, India',
          category: 'Hills & Nature',
          price: 5999,
          originalPrice: null,
          offerTag: '',
          rating: 4.9,
          image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?q=80&w=1000&auto=format&fit=crop',
          description: 'Discover sprawling green tea plantations, misty mountains, waterfalls, and exotic flora.',
          duration: '3 Days / 2 Nights',
          isFeatured: true
        },
        {
          name: 'Coorg Coffee Hills',
          location: 'Karnataka, India',
          category: 'Hills & Nature',
          price: 4499,
          originalPrice: 5499,
          offerTag: 'FLAT ₹1,000 OFF',
          rating: 4.8,
          image: 'https://images.unsplash.com/photo-1545389336-cf090694435e?q=80&w=1000&auto=format&fit=crop',
          description: 'Known as the Scotland of India, famous for coffee plantations, waterfalls, and pleasant climate.',
          duration: '3 Days / 2 Nights',
          isFeatured: false
        },
        {
          name: 'Manali Snow Peaks',
          location: 'Himachal Pradesh, India',
          category: 'Adventure & Snow',
          price: 8999,
          originalPrice: 10999,
          offerTag: 'SNOW DEAL',
          rating: 4.9,
          image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1000&auto=format&fit=crop',
          description: 'Snow-capped peaks, Solang Valley sports, Rohtang Pass adventure, and serene mountain valleys.',
          duration: '5 Days / 4 Nights',
          isFeatured: false
        },
        {
          name: 'Mahabalipuram Heritage',
          location: 'Tamil Nadu, India',
          category: 'Heritage & Culture',
          price: 3499,
          originalPrice: null,
          offerTag: '',
          rating: 4.6,
          image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=1000&auto=format&fit=crop',
          description: 'Ancient Shore Temple, monolithic rock-cut cave temples, and coastal heritage walk.',
          duration: '2 Days / 1 Night',
          isFeatured: false
        }
      ]);

      await Offer.insertMany([
        { code: 'SUMMER20', discountType: 'percentage', discountValue: 20, minBookingAmount: 3000, description: 'Get 20% OFF on all summer tour packages!', active: true },
        { code: 'WELCOME10', discountType: 'percentage', discountValue: 10, minBookingAmount: 0, description: 'Welcome deal! Extra 10% OFF on your first tour booking.', active: true },
        { code: 'EXPLORE500', discountType: 'flat', discountValue: 500, minBookingAmount: 4000, description: 'Flat ₹500 discount on bookings over ₹4,000.', active: true }
      ]);

      console.log('✅ Auto-seed completed successfully.');
    }
  } catch (err) {
    console.error('Auto-seed check error:', err.message);
  }
};

module.exports = connectDB;
