let app;

try {
    app = require('../server');
} catch (error) {
    console.error('❌ Failed to load server:', error);
    // Fallback minimal app if server fails to load
    const express = require('express');
    app = express();
    app.get('/api/health', (req, res) => {
        res.status(200).json({
            status: 'error',
            message: 'Server initialization failed',
            error: error.message
        });
    });
}

module.exports = app;
