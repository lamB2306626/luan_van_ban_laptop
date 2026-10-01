const express = require("express");
const thongBao = require("../controllers/thong-bao.controller");

const router = express.Router();

router
  .route("/")
  .get(thongBao.findAll)
  .post(thongBao.create)
  .delete(thongBao.deleteAll);

router
  .route("/:id")
  .get(thongBao.findOne)
  .put(thongBao.update)
  .delete(thongBao.delete);

module.exports = router;
