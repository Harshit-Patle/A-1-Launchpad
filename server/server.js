const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();

// CORS Configuration
const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:5173'], // React dev server and Vite dev server
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
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
app.use('/api/settings', require('./routes/settingsRoutes'));

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
        msg: 'Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
    });
});

// Force port 5002 to avoid conflicts
const PORT = 5002;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
