const Employee = require('../models/employeeModel');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const tempDir = path.join(__dirname, "..", "temp");
const puppeteer = require('puppeteer');
const ejs = require('ejs');
const tmp = require('tmp');
const QRCode = require('qrcode');
const { chromium } = require('playwright');

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const SITE_URL = process.env.SITE_URL || (NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://www.roadslink.in/api');
const VERIFY_LINK = process.env.VERIFY_LINK || (NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://roadslink.in');

// Ensure the temp directory exists
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

// Create operation
exports.addEmployee = async (req, res) => {
    try {
        const {
            registrationId,
            passportNumber,
            name,
            email,
            certificateCode,
            studentId,
            rtaPsychometricTest,
            rtaEnglishTest,
            category,
            companyName,
            date
        } = req.body;

        // Create new employee instance
        const newEmployee = new Employee({
            registrationId,
            passportNumber,
            name,
            email,
            certificateCode,
            studentId,
            rtaPsychometricTest,
            rtaEnglishTest,
            category,
            companyName,
            date
        });

        // Save employee to database
        const savedEmployee = await newEmployee.save();

        res.status(201).json(savedEmployee);
    } catch (error) {
        console.error('Error adding employee:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Read operation
exports.getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;

        const employee = await Employee.findById(id);

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json(employee);
    } catch (error) {
        console.error('Error getting employee:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Update operation
exports.updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const updateFields = req.body;

        const updatedEmployee = await Employee.findByIdAndUpdate(id, updateFields, { new: true });

        if (!updatedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json(updatedEmployee);
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Delete operation
exports.deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedEmployee = await Employee.findByIdAndDelete(id);

        if (!deletedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

exports.getAllEmployees = async (req, res) => {
    try {
        const employees = await Employee.find();

        res.status(200).json(employees);
    } catch (error) {
        console.error('Error getting all employees:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Route to handle search query
exports.getSearchEmployee = async (req, res) => {
    try {
        const { registrationId, passportNumber } = req.query;
        console.log(registrationId);
        if (!registrationId && !passportNumber) {
            return res.status(400).json({ message: "Please enter at least one of RegistrationId or PassportNumber" });
        }
        // Create an empty filter object
        let filter = {};

        // Check if registrationId is provided
        if (registrationId) {
            // Add registrationId to the filter with case-insensitive regex
            filter.registrationId = { $regex: registrationId, $options: 'i' };
        }

        // Check if passportNumber is provided
        if (passportNumber) {
            // Add passportNumber to the filter with case-insensitive regex
            filter.passportNumber = { $regex: passportNumber, $options: 'i' };
        }

        // Query database for matching employee records with both conditions
        const employees = await Employee.find({ $and: [filter] });
        // Check if any records are found
        if (employees.length === 0) {
            return res.status(404).json({ message: "No records found" });
        }
        res.json({ employees });
    } catch (error) {
        console.error("Error searching employees:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


// Add this new function to your controller



// Keep the original downloadCertificate for actual downloads
exports.downloadCertificate = async (req, res) => {
    let browser;
    
    try {
        console.log('Step 1: Starting certificate download');
        const { registrationId } = req.params;

        if (!registrationId) {
            console.log('Error: No registration ID provided');
            return res.status(400).json({ message: "Registration ID is required" });
        }

        console.log('Step 2: Looking for employee with ID:', registrationId);
        const employee = await Employee.findOne({ registrationId });
        
        if (!employee) {
            console.log('Error: Employee not found');
            return res.status(404).json({ message: "Employee not found" });
        }

        console.log('Step 3: Employee found, preparing URLs');
        // const siteUrl = 'https://www.roadslink.in/api';
        const siteUrl = SITE_URL;
        const verificationUrl = `${siteUrl}/certification?registrationId=${employee.registrationId}&passportNumber=${employee.passportNumber}`;
        const qrCodeUrl = `${siteUrl}/api/employee/certificate/view/${employee.registrationId}`;

        console.log('Step 4: Generating QR code');
        const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl);

        console.log('Step 5: Preparing certificate data');
        const certificateData = {
            employee,
            logo1: 'path_to_logo_1',
            logo2: 'path_to_logo_2',
            siteUrl,
            verificationUrl,
            qrCodeUrl: qrCodeDataUrl,
        };

        console.log('Step 6: Rendering HTML template');
        const htmlContent = await ejs.renderFile(
            path.join(__dirname, '..', 'public', 'certificateTemplate.html'),
            certificateData
        );

        console.log('Step 7: Launching Puppeteer browser');
        browser = await puppeteer.launch({
            headless: true,
            timeout: 60000,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        console.log('Step 8: Creating new page');
        const page = await browser.newPage();
        
        console.log('Step 9: Setting page content');
        await page.setContent(htmlContent, { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });

        console.log('Step 10: Generating PDF');
        const pdfBuffer = await page.pdf({
            width: '15.60in',
            height: '11.03in',
            landscape: true,
            printBackground: true,
            timeout: 30000
        });

        console.log('Step 11: Closing browser');
        await browser.close();
        browser = null;

        console.log('Step 12: Creating directory and file paths');
        const generatedCertificatesDir = path.join(__dirname, '..', 'generated-certificates');
        if (!fs.existsSync(generatedCertificatesDir)) {
            fs.mkdirSync(generatedCertificatesDir, { recursive: true });
        }

        const fileName = `${employee.name.replace(/[^a-zA-Z0-9]/g, '_')}-${employee.registrationId}.pdf`;
        const filePath = path.join(generatedCertificatesDir, fileName);

        console.log('Step 13: Writing PDF file');
        fs.writeFileSync(filePath, pdfBuffer);

        console.log('Step 14: Sending download response');
        res.status(200).download(filePath, fileName, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                return res.status(500).json({ message: 'Error downloading the certificate' });
            }

            console.log('Step 15: Cleaning up file');
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (unlinkError) {
                console.error('Error removing file:', unlinkError);
            }
        });

    } catch (error) {
        console.error('ERROR AT STEP:', error.message);
        console.error('Full error:', error);
        
        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.error('Error closing browser:', closeError);
            }
        }
        
        res.status(500).json({ 
            message: 'Error generating the certificate',
            error: error.message,
            stack: error.stack
        });
    }
};
exports.viewCertificate = async (req, res) => {
    try {
        const { registrationId } = req.params;

        if (!registrationId) {
            return res.status(400).json({ message: "Registration ID is required" });
        }

        // Fetch the employee data based on registrationId
        const employee = await Employee.findOne({ registrationId });
        console.log(employee);
        
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        // Prepare dynamic URLs
        const siteUrl = SITE_URL;
        const verificationUrl = `${siteUrl}/certification?registrationId=${employee.registrationId}&passportNumber=${employee.passportNumber}`;
        const qrCodeUrl = `${siteUrl}/api/employee/certificate/download/${employee.registrationId}`;

        // Generate the QR code URL for display
        const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl);

        // Prepare certificate data 
        const certificateData = {
            employee,
            logo1: 'path_to_logo_1',  // Update with correct path or URL
            logo2: 'path_to_logo_2',  // Update with correct path or URL
            siteUrl,
            verificationUrl,
            qrCodeUrl: qrCodeDataUrl, // Pass the generated QR code DataURL to the template
        };

        // Render the certificate HTML content using your existing template
        const htmlContent = await ejs.renderFile(
            path.join(__dirname, '..', 'public', 'certificateTemplate.html'), // Your existing template
            certificateData
        );

        // Send the HTML response for viewing
        res.status(200).send(htmlContent);

    } catch (error) {
        console.error('Error viewing certificate:', error);
        res.status(500).json({ message: 'Error viewing the certificate' });
    }
};

exports.unifiedCertificateHandler = async (req, res) => {
    const { registrationId } = req.params;
    let browser;

    try {
        console.log('unifiedCertificateHandler: Starting PDF generation for registrationId:', registrationId);
        
        if (!registrationId) {
            console.log('unifiedCertificateHandler: No registration ID provided');
            return res.status(400).json({ message: "Registration ID is required" });
        }

        const employee = await Employee.findOne({ registrationId });
        console.log('unifiedCertificateHandler: Employee found:', employee ? 'Yes' : 'No');

        if (!employee) {
            console.log('unifiedCertificateHandler: Employee not found for registrationId:', registrationId);
            return res.status(404).json({ message: "Employee not found" });
        }

        console.log('unifiedCertificateHandler: Starting PDF generation process');
        const siteUrl = SITE_URL; // or 'http://localhost:5000' in dev
        const verificationUrl = `${siteUrl}/certification?registrationId=${employee.registrationId}&passportNumber=${employee.passportNumber}`;
        const qrCodeUrl = `${siteUrl}/api/employee/certificate/${employee.registrationId}`;

        console.log('unifiedCertificateHandler: Generating QR code');
        const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl);

        const certificateData = {
            employee,
            logo1: 'path_to_logo_1',
            logo2: 'path_to_logo_2',
            siteUrl,
            verificationUrl,
            qrCodeUrl: qrCodeDataUrl
        };

        console.log('unifiedCertificateHandler: Rendering HTML template');
        const htmlContent = await ejs.renderFile(
            path.join(__dirname, '..', 'public', 'certificateTemplate.html'),
            certificateData
        );

        console.log('unifiedCertificateHandler: Launching browser');
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        console.log('unifiedCertificateHandler: Creating new page');
        const page = await browser.newPage();
        await page.setContent(htmlContent, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        console.log('unifiedCertificateHandler: Generating PDF');
        const pdfBuffer = await page.pdf({
            width: '15.60in',
            height: '11.03in',
            landscape: true,
            printBackground: true
        });

        console.log('unifiedCertificateHandler: Closing browser');
        await browser.close();

        const fileName = `${employee.name.replace(/[^a-zA-Z0-9]/g, '_')}-${employee.registrationId}.pdf`;
        console.log('unifiedCertificateHandler: Sending PDF response, fileName:', fileName);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('Cache-Control', 'public, max-age=3600');

        console.log('unifiedCertificateHandler: PDF generation completed successfully');
        return res.end(pdfBuffer);

    } catch (error) {
        console.error('unifiedCertificateHandler: Error displaying certificate as PDF:', error);

        if (browser) {
            try {
                await browser.close();
            } catch (err) {
                console.error('Failed to close browser:', err);
            }
        }

        return res.status(500).json({
            message: 'Error displaying certificate as PDF',
            error: error.message
        });
    }
};

exports.serveGeneratedPDF = async (req, res) => {
    try {
        const { filename } = req.params;
        
        if (!filename) {
            return res.status(400).json({ message: "Filename is required" });
        }

        // Sanitize filename to prevent directory traversal
        const sanitizedFilename = path.basename(filename);
        
        const generatedCertificatesDir = path.join(__dirname, '..', 'generated-certificates');
        const filePath = path.join(generatedCertificatesDir, sanitizedFilename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "PDF file not found" });
        }

        // Get file stats
        const stats = fs.statSync(filePath);
        
        // Set headers for PDF display
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Content-Disposition', `inline; filename="${sanitizedFilename}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600');

        // Create read stream and pipe to response
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Error serving generated PDF:', error);
        res.status(500).json({ 
            message: 'Error serving the PDF file',
            error: error.message 
        });
    }
};




