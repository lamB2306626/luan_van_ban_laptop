const express = require("express");
const yeuThich = require("../controllers/yeu-thich.controller");

const router = express.Router();

router
  .route("/khach-hang/:id_khach_hang/san-pham/:id_san_pham")
  .delete(yeuThich.deleteByCustomerAndProduct);

router
  .route("/")
  .get(yeuThich.findAll)
  .post(yeuThich.create)
  .delete(yeuThich.deleteAll); 

router
  .route("/:id")
  .get(yeuThich.findOne) 
  .delete(yeuThich.delete); 

module.exports = router;
