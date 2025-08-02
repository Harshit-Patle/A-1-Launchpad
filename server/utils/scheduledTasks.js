const cron = require('node-cron');
const notificationController = require('../controllers/notificationController');
const log = require('./logger');

// Initialize scheduled tasks
const initScheduledTasks = () => {
    // Run notification checks every day at 8:00 AM
    cron.schedule('0 8 * * *', async () => {
        log.info('Running scheduled notification checks');
        try {
            await notificationController.runNotificationChecks();
            log.info('Scheduled notification checks completed');
        } catch (error) {
            log.error('Error during scheduled notification checks:', error);
        }
    });

    // Test task to run notifications every minute (for development only)
    // Uncomment during development/testing and comment out for production
    /*
    cron.schedule('* * * * *', async () => {
        log.info('Running test notification checks');
        try {
            await notificationController.runNotificationChecks();
            log.info('Test notification checks completed');
        } catch (error) {
            log.error('Error during test notification checks:', error);
        }
    });
    */

    log.info('Scheduled tasks initialized');
};

module.exports = { initScheduledTasks };
