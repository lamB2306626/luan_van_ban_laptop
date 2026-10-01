const express = require("express");
const danhMuc = require("../controllers/danh-muc.controller");

const router = express.Router();

router
  .route("/")
  .get(danhMuc.findAll)
  .post(danhMuc.create)
  .delete(danhMuc.deleteAll);

router
  .route("/:id")
  .get(danhMuc.findOne)
  .put(danhMuc.update)
  .delete(danhMuc.delete);

module.exports = router;
