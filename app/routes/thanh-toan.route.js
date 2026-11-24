const express = require("express");
const thanhToan = require("../controllers/thanh-toan.controller");

const router = express.Router();

// Route tạo URL thanh toán VNPAY
router.route("/create_payment_url").post(thanhToan.createPaymentUrl);

// Route xử lý callback kết quả thanh toán từ VNPAY và lưu DB
router.route("/vnpay_return").post(thanhToan.vnpayReturn);

// Các route CRUD cơ bản cho bảng Thanh_toan (dùng cho quản trị Admin nếu cần)
router.route("/").get(thanhToan.findAll).delete(thanhToan.deleteAll);

router.route("/:id").get(thanhToan.findOne).delete(thanhToan.delete);

module.exports = router;
