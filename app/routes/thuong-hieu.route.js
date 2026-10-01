const express = require("express");
const thuongHieu = require("../controllers/thuong-hieu.controller");
const upload = require("../middlewares/uploadThuongHieu");

const router = express.Router();

router
  .route("/")
  .get(thuongHieu.findAll)
  .post(upload.single("lo_go"), thuongHieu.create)
  .delete(thuongHieu.deleteAll);

router
  .route("/:id")
  .get(thuongHieu.findOne)
  .put(upload.single("lo_go"), thuongHieu.update)
  .delete(thuongHieu.delete);

module.exports = router;
