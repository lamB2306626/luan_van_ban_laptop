const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Tạo thư mục nếu chưa có
const uploadDir = "uploads/ThuongHieu";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`); // VD: 1790315189575.png (chỉ dài ~18 ký tự)
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
});

module.exports = upload;
