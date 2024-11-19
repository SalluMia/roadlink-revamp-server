const Admin = require("../models/adminModel");
const bcrypt=require('bcrypt')
const jwt = require("jsonwebtoken");



exports.registerAdmin = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Validate input
      if (!email || !password) {
        return res.status(400).json({ message: 'Please provide both username and password.' });
      }
  
      // Check if the username is already taken
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({ message: 'email is already exist.' });
      }
  
      // Create a new admin
      const admin = new Admin({ email, password });
      await admin.save();
  
      // Generate and return authentication token
      const token = admin.generateAuthToken();
      res.status(201).json({ token });
    } catch (error) {
      console.error('Error in registerAdmin controller:', error);
      res.status(500).json({ error: error.message });
    }
  };

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both username and password.' });
    }

    // Find admin by username
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // Check password
    const isPasswordMatch = await bcrypt.compare(password, admin.password);

    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // Generate and return authentication token
    const token = admin.generateAuthToken();
    res.status(200).json({ token, admin });
  } catch (error) {
    console.error('Error in loginAdmin controller:', error);
    res.status(500).json({ message:"internal server error", error: error.message });
  }
};