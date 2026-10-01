const express = require("express");
const chiTietKhuyenMai = require("../controllers/chi-tiet-khuyen-mai.controller");

const router = express.Router();

router
  .route("/")
  .get(chiTietKhuyenMai.findAll)
  .post(chiTietKhuyenMai.create)
//   .delete(chiTietKhuyenMai.deleteAll);

router
  .route("dot_khuyen_mai/:id_dot_km")
  .delete(chiTietKhuyenMai.deleteByDotKm);

router
  .route("/:id")
  .get(chiTietKhuyenMai.findOne)
  .put(chiTietKhuyenMai.update)
  .delete(chiTietKhuyenMai.delete);

module.exports = router;
