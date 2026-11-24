const express = require("express");
const lichSuTroTruyen = require("../controllers/lich-su-tro-truyen.controller");

const router = express.Router();

router.route("/:id/doc-tin-nhan").patch(lichSuTroTruyen.markAsRead);

router.route("/").get(lichSuTroTruyen.findAll);

router.route("/khach-hang/:id_khach_hang").get(lichSuTroTruyen.findByKhachHang);

router.route("/tin-chua-doc").get(lichSuTroTruyen.getUnreadSummary);

router
  .route("/tin-chua-doc/khach-hang/:id_khach_hang")
  .get(lichSuTroTruyen.getUnreadByKhachHang);

router
  .route("/:id")
  .get(lichSuTroTruyen.findOne)
  .delete(lichSuTroTruyen.delete);

module.exports = router;
