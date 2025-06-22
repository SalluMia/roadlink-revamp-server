const express = require('express');
const router = express.Router();
const { getAllEmployees, addEmployee, updateEmployee, deleteEmployee, getSearchEmployee, downloadCertificate, viewCertificate } = require('../controllers/employeeController');

// Get all employees
router.get('/getAllEmployees', getAllEmployees);

// Add a new employee
router.post('/addEmployees', addEmployee);

// Update an employee
router.put('/updateEmployee/:id', updateEmployee);

// Delete an employee
router.delete('/deleteEmployee/:id', deleteEmployee);
router.get('/search', getSearchEmployee);
router.get('/certificate/download/:registrationId', downloadCertificate);
router.get('/certificate/view/:registrationId', viewCertificate);


module.exports = router;
