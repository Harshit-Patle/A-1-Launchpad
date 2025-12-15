
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
            maxPoolSize: 100,                    // Increased significantly for concurrent ops
            minPoolSize: 20,                     // Keep more warm connections
            maxIdleTimeMS: 120000,               // Keep idle connections longer
            waitQueueTimeoutMS: 30000,           // Wait up to 30s for a connection
            heartbeatFrequencyMS: 10000,
            retryWrites: true,
            family: 4,                           // IPv4 only (faster DNS)
        });

        isConnected = true;
        console.log('✅ MongoDB connected successfully - Pool: 20-100 connections');
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