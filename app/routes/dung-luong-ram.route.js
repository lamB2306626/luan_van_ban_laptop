const express = require("express");
const dungLuongRam = require("../controllers/dung-luong-ram.controller");

const router = express.Router();

router
  .route("/")
  .get(dungLuongRam.findAll)
  .post(dungLuongRam.create)
  .delete(dungLuongRam.deleteAll);

router
  .route("/:id")
  .get(dungLuongRam.findOne)
  .put(dungLuongRam.update)
  .delete(dungLuongRam.delete);

module.exports = router;
