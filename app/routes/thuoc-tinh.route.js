const express = require("express");
const thuocTinh = require("../controllers/thuoc-tinh.controller");

const router = express.Router();

router
  .route("/")
  .get(thuocTinh.findAll)
  .post(thuocTinh.create)
  .delete(thuocTinh.deleteAll);

router
  .route("/:id")
  .get(thuocTinh.findOne)
  .put(thuocTinh.update)
  .delete(thuocTinh.delete);

module.exports = router;
