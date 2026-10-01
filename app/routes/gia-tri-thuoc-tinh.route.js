const express = require("express");
const giaTriThuocTinh = require("../controllers/gia-tri-thuoc-tinh.controller");

const router = express.Router();

router
  .route("/")
  .get(giaTriThuocTinh.findAll)
  .post(giaTriThuocTinh.create)
  .delete(giaTriThuocTinh.deleteAll);

router
  .route("/:id")
  .get(giaTriThuocTinh.findOne)
  .put(giaTriThuocTinh.update)
  .delete(giaTriThuocTinh.delete);

module.exports = router;
