const express = require("express");
const dungLuongRom = require("../controllers/dung-luong-rom.controller");

const router = express.Router();

router
  .route("/")
  .get(dungLuongRom.findAll)
  .post(dungLuongRom.create)
  .delete(dungLuongRom.deleteAll);

router
  .route("/:id")
  .get(dungLuongRom.findOne)
  .put(dungLuongRom.update)
  .delete(dungLuongRom.delete);

module.exports = router;
