const express = require("express");
const khachHang = require("../controllers/khach-hang.controller");

const router = express.Router();

router.route("/:id/restore").patch(khachHang.restore);

router
  .route("/")
  .get(khachHang.findAll)
  .post(khachHang.create)
  .delete(khachHang.deleteAll);

router
  .route("/:id")
  .get(khachHang.findOne)
  .put(khachHang.update)
  .delete(khachHang.delete);

module.exports = router;
