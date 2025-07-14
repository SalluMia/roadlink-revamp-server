const express = require('express');
const router = express.Router();
const { 
    getAllEmployees, 
    addEmployee, 
    updateEmployee, 
    deleteEmployee, 
    getSearchEmployee, 
    downloadCertificate, 
    viewCertificate,
    viewCertificatePDF,  // Add the new function
    generateTemplatedPDF,
    generateRobustPuppeteerPDF,
    unifiedCertificateHandler,
    serveGeneratedPDF  // Add new function for serving generated PDFs
} = require('../controllers/employeeController');

// Existing routes
router.get('/getAllEmployees', getAllEmployees);
router.post('/addEmployees', addEmployee);
router.put('/updateEmployee/:id', updateEmployee);
router.delete('/deleteEmployee/:id', deleteEmployee);
router.get('/search', getSearchEmployee);

// Certificate routes
router.get('/certificate/download/:registrationId', downloadCertificate); // Force download
router.get('/certificate/view/:registrationId', viewCertificate);     // HTML view
router.get('/certificate/pdf-certificate/:registrationId', unifiedCertificateHandler);

// New route to serve generated PDFs
router.get('/certificate/generated/:filename', serveGeneratedPDF);

module.exports = router;