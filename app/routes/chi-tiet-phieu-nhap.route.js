const express = require("express");
const chiTietPhieuNhap = require("../controllers/chi-tiet-phieu-nhap.controller");

const router = express.Router();

router
  .route("/")
  .get(chiTietPhieuNhap.findAll)
  .post(chiTietPhieuNhap.create)
  .delete(chiTietPhieuNhap.deleteAll);

router
  .route("/:id")
  .get(chiTietPhieuNhap.findOne)
  .put(chiTietPhieuNhap.update)
  .delete(chiTietPhieuNhap.delete);

module.exports = router;
