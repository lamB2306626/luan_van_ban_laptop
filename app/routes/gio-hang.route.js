const express = require("express");
const gioHang = require("../controllers/gio-hang.controller");

const router = express.Router();

router
  .route("/")
  .get(gioHang.findAll)
  .post(gioHang.create)
  .delete(gioHang.deleteAll);

router
  .route("/:id")
  .get(gioHang.findOne)
  .put(gioHang.update)
  .delete(gioHang.delete);

module.exports = router;
