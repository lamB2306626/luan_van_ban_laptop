const express = require("express");
const danhGia = require("../controllers/danh-gia.controller");

const router = express.Router();

router
  .route("/")
  .get(danhGia.findAll)
  .post(danhGia.create)
  .delete(danhGia.deleteAll);

router
  .route("/:id")
  .get(danhGia.findOne)
  .put(danhGia.update)
  .delete(danhGia.delete);

module.exports = router;
