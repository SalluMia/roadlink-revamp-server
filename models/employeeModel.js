const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  registrationId: {
    type: String,
    required: true
  },
  passportNumber: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  certificateCode: {
    type: String,
    required: true
  },
  studentId: {
    type: String,
    required: true
  },
  rtaPsychometricTest: {
    type: String,
    required: true
  },
  rtaEnglishTest: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  }
});

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
