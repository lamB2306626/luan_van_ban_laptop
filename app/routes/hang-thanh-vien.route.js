const express = require("express");
const hangThanhVien = require("../controllers/hang-thanh-vien.controller");

const router = express.Router();

router
  .route("/")
  .get(hangThanhVien.findAll)
  .post(hangThanhVien.create)
  .delete(hangThanhVien.deleteAll);

router
  .route("/:id")
  .get(hangThanhVien.findOne)
  .put(hangThanhVien.update)
  .delete(hangThanhVien.delete);

module.exports = router;
