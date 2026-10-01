const express = require("express");
const thuocTinhBienThe = require("../controllers/thuoc-tinh-bien-the.controller");

const router = express.Router();

router
  .route("/")
  .get(thuocTinhBienThe.findAll)
  .post(thuocTinhBienThe.create)
  .delete(thuocTinhBienThe.deleteAll);

router
  .route("/:id")
  .get(thuocTinhBienThe.findOne)
  .put(thuocTinhBienThe.update)
  .delete(thuocTinhBienThe.delete);

module.exports = router;
