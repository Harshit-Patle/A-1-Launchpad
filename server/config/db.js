const mongoose = require('mongoose');
const dns = require('dns');

// Configure public DNS servers for reliable SRV resolution (prevents querySrv ECONNREFUSED on local networks)
try {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (dnsErr) {
    // If setting custom DNS servers is restricted by environment, continue with default
    console.warn('DNS server configuration fallback notice:', dnsErr.message);
}

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
            serverSelectionTimeoutMS: 5000,      // Fail fast (5s instead of 30s) if unreachable
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            maxPoolSize: 10,                     // Suitable for serverless / small instances
            minPoolSize: 0,                      // Avoid holding idle connections in serverless
            maxIdleTimeMS: 30000,                // Close idle connections after 30s
            waitQueueTimeoutMS: 10000,
            heartbeatFrequencyMS: 10000,
            retryWrites: true,
            family: 4,                           // IPv4 only (faster DNS resolution)
        });

        isConnected = true;
        console.log('✅ MongoDB connected successfully');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        console.error('⚠️  Make sure:');
        console.error('   1. MONGO_URI environment variable is set in Vercel / .env');
        console.error('   2. MongoDB Atlas IP whitelist includes 0.0.0.0/0 or current IP');
        console.error('   3. Connection string is correct');
        // Don't exit - allow the app to continue in serverless environment
    }
};

module.exports = connectDB;