const express = require("express");
const phieuKhachhang = require("../controllers/phieu-khach-hang.controller");

const router = express.Router();

router
  .route("/")
  .get(phieuKhachhang.findAll)
  .post(phieuKhachhang.create)
  .delete(phieuKhachhang.deleteAll);

router
  .route("/:id")
  .get(phieuKhachhang.findOne)
  .put(phieuKhachhang.update)
  .delete(phieuKhachhang.delete);

module.exports = router;
