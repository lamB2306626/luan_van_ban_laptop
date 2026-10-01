const express = require("express");
const thongSo = require("../controllers/thong-so.controller");

const router = express.Router();

router
  .route("/")
  .get(thongSo.findAll)
  .post(thongSo.create)
  .delete(thongSo.deleteAll);

router
  .route("/:id")
  .get(thongSo.findOne)
  .put(thongSo.update)
  .delete(thongSo.delete);

module.exports = router;
