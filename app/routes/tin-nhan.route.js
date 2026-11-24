const express = require("express");
const tinNhan = require("../controllers/tin-nhan.controller");

const router = express.Router();

// 1. Route cho Khách hàng và Nhân viên gửi tin nhắn
router.route("/khach-hang/gui-tin-nhan").post(tinNhan.guiTinNhanKhachHang);

router.route("/nhan-vien/gui-tin-nhan").post(tinNhan.guiTinNhanNhanVien);

module.exports = router;
