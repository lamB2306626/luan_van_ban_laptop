const express = require("express");
const phieuHangThanhVien = require("../controllers/phieu-hang-thanh-vien.controller");

const router = express.Router();

router
  .route("/")
  .get(phieuHangThanhVien.findAll)
  .post(phieuHangThanhVien.create)
  .delete(phieuHangThanhVien.deleteAll);

router
  .route("/:id")
  .get(phieuHangThanhVien.findOne)
  .put(phieuHangThanhVien.update)
  .delete(phieuHangThanhVien.delete);

module.exports = router;
