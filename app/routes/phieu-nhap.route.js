const express = require("express");
const phieuNhap = require("../controllers/phieu-nhap.controller");

const router = express.Router();

router
  .route("/")
  .get(phieuNhap.findAll)
  .post(phieuNhap.create)
  .delete(phieuNhap.deleteAll);

router
  .route("/:id")
  .get(phieuNhap.findOne)
  .put(phieuNhap.update)
  .delete(phieuNhap.delete);

module.exports = router;
