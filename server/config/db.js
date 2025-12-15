
const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
    if (isConnected) {
        console.log('Using existing MongoDB connection');
        return;
    }

    try {
        if (!process.env.MONGO_URI) {
            console.warn('⚠️  MONGO_URI not set - running in demo mode');
            return;
        }

        console.log('🔄 Attempting to connect to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 60000,
            connectTimeoutMS: 30000,
            maxPoolSize: 20,
            retryWrites: true,
            retryAttempts: 5,
        });

        isConnected = true;
        console.log('✅ MongoDB connected successfully');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        console.error('⚠️  Make sure:');
        console.error('   1. MONGO_URI environment variable is set in Vercel');
        console.error('   2. MongoDB Atlas IP whitelist includes 0.0.0.0/0 or Vercel IPs');
        console.error('   3. Connection string is correct');
        // Don't exit - allow the app to continue in serverless environment
    }
};

module.exports = connectDB;