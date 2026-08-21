const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Destination = require('./models/Destination');
const Offer = require('./models/Offer');
const Booking = require('./models/Booking');

const seedData = async () => {
  try {
    const primaryUri = process.env.MONGODB_URI;
    let connected = false;

    if (primaryUri) {
      try {
        await mongoose.connect(primaryUri);
        console.log(`🌿 Connected to MongoDB Atlas Cloud: ${primaryUri}`);
        connected = true;
      } catch (cloudErr) {
        console.log(`⚠️ Cloud MongoDB Auth Failed (${cloudErr.message}). Trying local MongoDB fallback...`);
      }
    }

    if (!connected) {
      const localUri = 'mongodb://127.0.0.1:27017/naturetrails';
      await mongoose.connect(localUri);
      console.log(`🌿 Connected to Local MongoDB: ${localUri}`);
    }

    // Clear existing collections
    await User.deleteMany({});
    await Destination.deleteMany({});
    await Offer.deleteMany({});
    await Booking.deleteMany({});
    console.log('🧹 Cleared existing database collections.');

    // Seed Admin & User
    const hashedAdminPass = await bcrypt.hash('admin123', 10);
    const adminUser = await User.create({
      name: 'Admin',
      email: 'admin@travel.com',
      password: hashedAdminPass,
      role: 'ADMIN'
    });

    const hashedUserPass = await bcrypt.hash('user123', 10);
    const normalUser = await User.create({
      name: 'Demo Traveler',
      email: 'user@travel.com',
      password: hashedUserPass,
      role: 'USER'
    });

    console.log(`👤 Seeded Admin: ${adminUser.email} (ADMIN)`);
    console.log(`👤 Seeded User: ${normalUser.email} (USER)`);

    // Seed Destinations
    const destinations = await Destination.insertMany([
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
    console.log(`🏔️ Seeded ${destinations.length} Destinations.`);

    // Seed Offers
    const offers = await Offer.insertMany([
      {
        code: 'SUMMER20',
        discountType: 'percentage',
        discountValue: 20,
        minBookingAmount: 3000,
        description: 'Get 20% OFF on all summer tour packages!',
        active: true,
        expiresAt: '2026-12-31'
      },
      {
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        minBookingAmount: 0,
        description: 'Welcome deal! Extra 10% OFF on your first tour booking.',
        active: true,
        expiresAt: '2026-12-31'
      },
      {
        code: 'EXPLORE500',
        discountType: 'flat',
        discountValue: 500,
        minBookingAmount: 4000,
        description: 'Flat ₹500 discount on bookings over ₹4,000.',
        active: true,
        expiresAt: '2026-12-31'
      }
    ]);
    console.log(`🏷️ Seeded ${offers.length} Promo Codes.`);

    // Seed Sample Booking
    const sampleBooking = await Booking.create({
      user: normalUser._id,
      userName: normalUser.name,
      userEmail: normalUser.email,
      destination: destinations[0]._id,
      destinationDetails: {
        name: destinations[0].name,
        location: destinations[0].location,
        pricePerPerson: destinations[0].price
      },
      travelDate: '2026-09-01',
      numberOfGuests: 2,
      contactNumber: '+91 98765 43210',
      rawTotal: 7998,
      discountAmount: 1599,
      promoCodeApplied: 'SUMMER20',
      totalPrice: 6399,
      status: 'Confirmed',
      bookedAt: new Date()
    });
    console.log(`🎫 Seeded Sample Booking: ${sampleBooking._id}`);

    console.log('\n✅ Database Seeding Completed Successfully! 🌿');
    process.exit(0);
  } catch (error) {
    console.error(`❌ Seeding Failed: ${error.message}`);
    process.exit(1);
  }
};

seedData();
