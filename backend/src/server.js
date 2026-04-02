require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = require('./app');
const { connectDB } = require('./config/database');
const reminderService = require('./services/reminderService');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Connect to database
        await connectDB();

        // Start server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV}`);

            // Start reminder service
            reminderService.start();
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
