const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
    const uploadPath = path.resolve(__dirname, "../uploads");
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    },
  });
  
  // Initialize multer with storage and file filter
  const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
      const fileTypes = /jpeg|jpg|png|gif/;
      const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
      const mimeType = fileTypes.test(file.mimetype);
  
      if (extName && mimeType) {
        cb(null, true);
      } else {
        cb(new Error("Only image files are allowed!"));
      }
    },
  });

  module.exports = {upload};