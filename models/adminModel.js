const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  }
});

// Hash the password before saving to the database
adminSchema.pre('save', async function (next) {
  const admin = this;

  if (admin.isModified('password')) {
    admin.password = await bcrypt.hash(admin.password, 10);
  }

  next();
});

// Generate an authentication token
adminSchema.methods.generateAuthToken = function () {
  const admin = this;
  const token = jwt.sign({ _id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return token;
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
