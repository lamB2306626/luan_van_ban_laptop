const express = require("express");
const anhSanPham = require("../controllers/anh-san-pham.controller");

const router = express.Router();

router
  .route("/")
  .get(anhSanPham.findAll)
  .post(anhSanPham.create)
  .delete(anhSanPham.deleteAll);

router
  .route("/:id")
  .get(anhSanPham.findOne)
  .put(anhSanPham.update)
  .delete(anhSanPham.delete);

module.exports = router;
