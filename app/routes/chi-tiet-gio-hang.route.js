const express = require("express");
const chiTietGioHang = require("../controllers/chi-tiet-gio-hang.controller");

const router = express.Router();

router.route("/gio-hang/:id_Gio_Hang").delete(chiTietGioHang.deleteByGioHang);
router.route("/add").post(chiTietGioHang.addToCart);

router
  .route("/")
  .get(chiTietGioHang.findAll)
  .post(chiTietGioHang.create)


router
  .route("/:id")
  .get(chiTietGioHang.findOne)
  .put(chiTietGioHang.update)
  .delete(chiTietGioHang.delete);

module.exports = router;
