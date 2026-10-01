const express = require("express");
const chiTietDonHang = require("../controllers/chi-tiet-don-hang.controller");

const router = express.Router();

router
  .route("/")
  .get(chiTietDonHang.findAll)
  .post(chiTietDonHang.create)
  .delete(chiTietDonHang.deleteAll);

router
  .route("/:id")
  .get(chiTietDonHang.findOne)
  .put(chiTietDonHang.update)
  .delete(chiTietDonHang.delete);

module.exports = router;
