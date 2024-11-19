const express = require("express");
const { registerAdmin, loginAdmin} = require("../controllers/adminController");
const multer = require("multer");
const router = express.Router();

function configureMulterStorage(destinationFolder) {
    return multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, path.join("uploads", destinationFolder));
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const fileExtension = path.extname(file.originalname);
        const fileName = `${file.fieldname}-${uniqueSuffix}${fileExtension}`;
        cb(null, fileName);
      },
    });
  }

  // Create a Multer instance for product image uploads (example)
  const AdminUpload = multer({ storage: configureMulterStorage("admin") });
// Route to book multiple classes
router.post("/adminRegister", registerAdmin);

router.post("/adminLogin", loginAdmin);


module.exports = router;
