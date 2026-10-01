const express = require("express");
const chiTietThongBao = require("../controllers/chi-tiet-thong-bao.controller");

const router = express.Router();

// ==================== Các route đặc biệt ====================

// Đánh dấu TẤT CẢ thông báo của 1 khách hàng là ĐÃ ĐỌC
router.route("/read-all/:id_khach_hang").patch(chiTietThongBao.markAllAsRead);

// Đếm số lượng thông báo CHƯA ĐỌC của 1 khách hàng 
router.route("/unread-count/:id_khach_hang").get(chiTietThongBao.countUnread);

// ==================== Các route CRUD ====================
router
  .route("/")
  .get(chiTietThongBao.findAll) 
  .post(chiTietThongBao.create) 
  .delete(chiTietThongBao.deleteAll); 


router
  .route("/:id")
  .get(chiTietThongBao.findOne)
  .put(chiTietThongBao.update)
  .patch(chiTietThongBao.update) 
  .delete(chiTietThongBao.delete); 

module.exports = router;
