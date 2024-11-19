const Employee = require('../models/employeeModel');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const tempDir = path.join(__dirname, "..", "temp");
const puppeteer = require('puppeteer');
const ejs = require('ejs');
const tmp = require('tmp');
const QRCode = require('qrcode');

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


exports.downloadCertificate = async (req, res) => {
    try {
        const { registrationId } = req.params;

        if (!registrationId) {
            return res.status(400).json({ message: "Registration ID is required" });
        }

        // Fetch the employee data based on registrationId
        const employee = await Employee.findOne({ registrationId });
        console.log(employee)
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        // Prepare dynamic URLs
        const siteUrl = 'https://www.roadslink.in/api';
        const verificationUrl = `${siteUrl}/certification?registrationId=${employee.registrationId}&passportNumber=${employee.passportNumber}`;
        const qrCodeUrl = `${siteUrl}/api/employee/certificate/download/${employee.registrationId}`;

        // Generate the QR code URL
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

        // Render the certificate HTML content using the EJS template
        const htmlContent = await ejs.renderFile(
            path.join(__dirname, '..', 'public', 'certificateTemplate.html'), // Adjust the correct path
            certificateData
        );

        // Launch Puppeteer and generate PDF from the rendered HTML
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });

        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'load' });

        // Generate the PDF from the HTML content
        const pdfBuffer = await page.pdf({
            width: '15.60in',
            height: '11.03in',
            landscape: true,
            printBackground: true
        });

        // Ensure the generated-certificates directory exists
        const generatedCertificatesDir = path.join(__dirname, '..', 'generated-certificates');
        if (!fs.existsSync(generatedCertificatesDir)) {
            fs.mkdirSync(generatedCertificatesDir);
        }

        const fileName = `${employee.name}-${employee.studentId}.pdf`;
        const filePath = path.join(generatedCertificatesDir, fileName);

        // Save the PDF to the server
        fs.writeFileSync(filePath, pdfBuffer);

        // Send the generated PDF as a response
        res.status(200).download(filePath, fileName, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                return res.status(500).json({ message: 'Error downloading the certificate' });
            }

            // Optionally remove the file after sending it
            fs.unlinkSync(filePath);
        });
    } catch (error) {
        console.error('Error generating certificate:', error);
        res.status(500).json({ message: 'Error generating the certificate' });
    }
};
