const express = require("express");
const nhaCungCap = require("../controllers/nha-cung-cap.controller");

const router = express.Router();

router
  .route("/")
  .get(nhaCungCap.findAll)
  .post(nhaCungCap.create)
  .delete(nhaCungCap.deleteAll);

router
  .route("/:id")
  .get(nhaCungCap.findOne)
  .put(nhaCungCap.update)
  .delete(nhaCungCap.delete);

module.exports = router;
