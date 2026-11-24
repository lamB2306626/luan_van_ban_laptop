const express = require("express");
const nhaCungCapSanPham = require("../controllers/nha-cung-cap-san-pham.controller");

const router = express.Router();

router
  .route("/")
  .get(nhaCungCapSanPham.findAll)
  .post(nhaCungCapSanPham.create)
  .delete(nhaCungCapSanPham.deleteAll);

router
  .route("/:id")
  .get(nhaCungCapSanPham.findOne)
  .put(nhaCungCapSanPham.update)
  .delete(nhaCungCapSanPham.delete);

module.exports = router;
