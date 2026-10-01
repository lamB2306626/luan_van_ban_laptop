const express = require("express");
const vaiTro = require("../controllers/vai-tro.controller");

const router = express.Router();

router
  .route("/")
  .get(vaiTro.findAll)
  .post(vaiTro.create)
  .delete(vaiTro.deleteAll);

router
  .route("/:id")
  .get(vaiTro.findOne)
  .put(vaiTro.update)
  .delete(vaiTro.delete);

module.exports = router;
