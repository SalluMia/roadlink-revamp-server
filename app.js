const express = require('express');
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv").config();
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
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
    res.status(200).json({message:'server live'});
  });

require('./database/db');

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
