const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();

// CORS Configuration
const isDevelopment = process.env.NODE_ENV !== 'production';

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // In development mode, be more permissive with CORS
        if (isDevelopment) {
            // Check if it's a localhost or local network request (192.168.x.x, etc.)
            const isLocalhost = origin.startsWith('http://localhost:');
            const isLocalNetwork = /^http:\/\/192\.168\.\d+\.\d+/.test(origin) ||
                /^http:\/\/10\.\d+\.\d+\.\d+/.test(origin) ||
                /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+/.test(origin);

            if (isLocalhost || isLocalNetwork) {
                console.log('Development CORS allowed for:', origin);
                return callback(null, true);
            }
        }

        // For production or if not matching development criteria
        let allowedOrigins = [
            'http://localhost:3000',   // React dev server 
            'http://localhost:5173',   // Vite dev server
            'http://localhost:5002',   // Direct access to API
            process.env.CLIENT_URL     // From .env file
        ];

        // Add any additional origins from environment variables
        if (process.env.ADDITIONAL_CORS_ORIGINS) {
            const additionalOrigins = process.env.ADDITIONAL_CORS_ORIGINS.split(',');
            allowedOrigins = allowedOrigins.concat(additionalOrigins);
        }

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Add a test route for CORS
app.get('/api/cors-test', (req, res) => {
    res.json({ message: 'CORS is working properly!' });
});

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
    next();
});

// CORS diagnostic endpoint
app.get('/api/cors-diagnostic', (req, res) => {
    let allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5002',
        process.env.CLIENT_URL
    ];

    if (process.env.ADDITIONAL_CORS_ORIGINS) {
        const additionalOrigins = process.env.ADDITIONAL_CORS_ORIGINS.split(',');
        allowedOrigins = allowedOrigins.concat(additionalOrigins);
    }

    res.json({
        message: 'CORS diagnostic information',
        requestOrigin: req.headers.origin || 'none',
        allowedOrigins: allowedOrigins,
        corsMode: isDevelopment ? 'development (permissive)' : 'production (strict)',
        clientUrl: process.env.CLIENT_URL,
        additionalOrigins: process.env.ADDITIONAL_CORS_ORIGINS || 'none configured'
    });
});

// Connect to Database
connectDB();

// Handle OPTIONS preflight requests
app.options('*', cors(corsOptions));

// Routes (incrementally add them back)
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
// Now using the fixed componentSettings route
app.use('/api/component-settings', require('./routes/componentSettings'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/waste', require('./routes/wasteRoutes'));

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

    // Handle CORS errors specifically
    if (err.message.includes('CORS')) {
        return res.status(403).json({
            error: 'CORS Error',
            message: 'Cross-Origin Request Blocked',
            allowedOrigins: corsOptions.origin.toString(),
            requestOrigin: req.headers.origin
        });
    }

    res.status(500).json({
        error: err.name,
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);

    res.status(500).json({
        msg: 'Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
    });
});

// Export for Vercel serverless
module.exports = app;

// For local development
if (require.main === module) {
    const PORT = process.env.PORT || 5002;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}
