const mongoose = require('mongoose');

// Get MongoDB URI from environment variables
const Mongo_URI = process.env.Mongo_URI;

// Validate MongoDB URI
if (!Mongo_URI) {
  console.error('❌ MongoDB URI is not defined in environment variables');
  console.error('Please check your .env file contains: Mongo_URI=your_mongodb_connection_string');
  process.exit(1);
}

console.log('🔗 Attempting to connect to MongoDB...');
console.log('📡 MongoDB URI:', Mongo_URI.substring(0, 50) + '...');

// Connect to MongoDB with options
mongoose.connect(Mongo_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
})
.then(() => {
  console.log('✅ Database connection established successfully');
  console.log('📊 Connected to MongoDB Atlas');
})
.catch((error) => {
  console.error('❌ Database connection error:', error.message);
  console.error('🔍 Error details:', error);
  process.exit(1);
});

// Handle connection events
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('📴 MongoDB connection closed through app termination');
  process.exit(0);
});