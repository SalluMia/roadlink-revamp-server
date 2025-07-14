# Road Link Backend Server

## Environment Configuration

This backend now supports environment-based configuration for development and production.

### Development Environment
Create a `.env` file in the root directory:
```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
SITE_URL=http://localhost:5000
VERIFY_LINK=http://localhost:3000
```

### Production Environment
For production, use these environment variables:
```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://roadslink.in
SITE_URL=https://www.roadslink.in/api
VERIFY_LINK=https://roadslink.in
```

## New Features

### Environment-Based Configuration
- Automatic URL switching based on environment
- CORS configuration for development and production
- Improved server logging with environment information

### New PDF Endpoints

1. **Serve Generated PDFs**
   - Endpoint: `GET /api/employee/certificate/generated/:filename`
   - Purpose: Serves pre-generated PDF files from the `generated-certificates` directory
   - Features:
     - File validation and sanitization
     - Proper HTTP headers for PDF display
     - Error handling for missing files
     - Caching headers for performance

2. **Enhanced PDF Generation**
   - All existing PDF endpoints now use environment variables
   - Improved error handling and logging
   - Better file management

## API Endpoints

### Employee Management
- `GET /api/employee/getAllEmployees` - Get all employees
- `POST /api/employee/addEmployees` - Add new employee
- `PUT /api/employee/updateEmployee/:id` - Update employee
- `DELETE /api/employee/deleteEmployee/:id` - Delete employee
- `GET /api/employee/search` - Search employees

### Certificate Management
- `GET /api/employee/certificate/download/:registrationId` - Download certificate
- `GET /api/employee/certificate/view/:registrationId` - View certificate HTML
- `GET /api/employee/certificate/pdf-certificate/:registrationId` - Generate PDF on demand
- `GET /api/employee/certificate/generated/:filename` - Serve pre-generated PDF (NEW)

## Running the Server

### Development
```bash
npm start
# or
node app.js
```

### Production
```bash
NODE_ENV=production npm start
```

## Environment Variables

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| NODE_ENV | development | production | Environment mode |
| PORT | 5000 | 5000 | Server port |
| FRONTEND_URL | http://localhost:3000 | https://roadslink.in | Frontend URL for CORS |
| SITE_URL | http://localhost:5000 | https://www.roadslink.in/api | Backend site URL |
| VERIFY_LINK | http://localhost:3000 | https://roadslink.in | Verification link |

## CORS Configuration

The server automatically configures CORS based on the environment:

- **Development**: Allows localhost origins (3000, 5173)
- **Production**: Allows only production domains

## PDF File Management

### Generated Certificates Directory
- Location: `./generated-certificates/`
- Contains pre-generated PDF files
- Files are named: `{EmployeeName}-{StudentId}.pdf`
- New endpoint serves these files directly

### File Naming Convention
- Employee names are sanitized (special characters replaced with underscores)
- Format: `{sanitized_name}-{student_id}.pdf`
- Example: `Muhammad_Khan-12345.pdf`

## Error Handling

All endpoints include proper error handling:
- File not found errors
- Invalid request parameters
- Server errors with detailed logging
- CORS errors for invalid origins

## Security Features

- File path sanitization to prevent directory traversal
- CORS origin validation
- Input validation for all endpoints
- Proper HTTP headers for file serving

## Dependencies

Make sure all required dependencies are installed:
```bash
npm install
```

Key dependencies:
- express
- cors
- body-parser
- dotenv
- puppeteer (for PDF generation)
- qrcode (for QR code generation)
- ejs (for template rendering) 