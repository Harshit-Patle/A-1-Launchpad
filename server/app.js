const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });
}

// Connect to Database
connectDB();

const app = express();

// 1. Normalize AWS API Gateway stage & function name prefixes across req.url and req.originalUrl
app.use((req, res, next) => {
    const stripPrefix = (url) => {
        if (!url) return '/';
        return url
            .replace(/^\/default\/lims-backend/, '')
            .replace(/^\/default\/a-1-launchpad-backend/, '')
            .replace(/^\/default/, '')
            .replace(/^\/lims-backend/, '')
            .replace(/^\/a-1-launchpad-backend/, '') || '/';
    };

    req.url = stripPrefix(req.url);
    if (req.originalUrl) {
        req.originalUrl = stripPrefix(req.originalUrl);
    }
    next();
});

// 2. Global CORS headers and preflight OPTIONS handling for all environments
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-auth-token');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
    next();
});

// Middleware to ensure DB connection is ready for API endpoints
app.use('/api', async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        next(err);
    }
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'A-1 Launchpad API Server',
        status: 'running',
        version: '1.0.0',
        endpoints: '/api/*'
    });
});

// Add a test route for CORS & connectivity
app.get('/api/cors-test', (req, res) => {
    res.json({ message: 'CORS is working properly!' });
});

// API Routes
try {
    app.use('/api/auth', require('./routes/authRoutes'));
    app.use('/api/components', require('./routes/componentRoutes'));
    app.use('/api/logs', require('./routes/logRoutes'));
    app.use('/api/users', require('./routes/userRoutes'));
    app.use('/api/import-export', require('./routes/importExportRoutes'));
    app.use('/api/reservations', require('./routes/reservationRoutes'));
    app.use('/api/maintenance', require('./routes/maintenanceRoutes'));
    app.use('/api/reports', require('./routes/reportRoutes'));
    app.use('/api/notifications', require('./routes/notificationRoutes'));
    app.use('/api/approvals', require('./routes/approvalRoutes'));
    app.use('/api/component-settings', require('./routes/componentSettings'));
    app.use('/api/dashboard', require('./routes/dashboardRoutes'));
    app.use('/api/waste', require('./routes/wasteRoutes'));
    console.log('✅ All routes loaded successfully');
} catch (err) {
    console.error('❌ Error loading routes:', err.message);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ msg: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({
        error: err.name,
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
    });
});

module.exports = app;
