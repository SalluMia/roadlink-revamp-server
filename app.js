const express = require('express');
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv").config();
const path = require('path');

// Load environment variables first
if (dotenv.error) {
  console.error('Error loading .env file:', dotenv.error);
  process.exit(1);
}

// Environment configuration
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Check if MongoDB URI is available
if (!process.env.Mongo_URI) {
  console.error('❌ MongoDB URI is not defined in environment variables');
  console.error('Please check your .env file contains: Mongo_URI=your_mongodb_connection_string');
  process.exit(1);
}

console.log('✅ Environment variables loaded successfully');
console.log('🔧 Environment:', NODE_ENV);
console.log('🌐 Port:', PORT);
console.log('📡 Frontend URL:', FRONTEND_URL);

const app = express();

// CORS configuration
const corsOptions = {
  origin: NODE_ENV === 'development' 
    ? [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173']
    : ['https://roadslink.in', 'https://www.roadslink.in'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(bodyParser.json());

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.use('/api/admin', require('./routes/adminRoute'));
app.use('/api/employee', require('./routes/employeeRoute'));

// Set the views directory to the folder where your EJS files are stored
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Sample route to render an EJS template
app.get('/certificate', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'certificateTemplate.html'));
});

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Road Link Server is running',
        environment: NODE_ENV,
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

// Initialize database connection
require('./database/db');

app.listen(PORT, () => {
  console.log(`🚀 Server is running on PORT ${PORT} in ${NODE_ENV} mode`);
  console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
  console.log(`📊 MongoDB URI: ${process.env.Mongo_URI ? 'Configured' : 'Not configured'}`);
});
