const winston = require('winston');
const path = require('path');

// Create a Winston logger instance
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
    transports: [
        // Output to console
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
            )
        }),
        // Output to log file
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/app.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

module.exports = logger;
