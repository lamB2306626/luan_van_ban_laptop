const express = require("express");
const cpu = require("../controllers/cpu.controller");

const router = express.Router();

router
  .route("/")
  .get(cpu.findAll)
  .post(cpu.create)
  .delete(cpu.deleteAll);

router
  .route("/:id")
  .get(cpu.findOne)
  .put(cpu.update)
  .delete(cpu.delete);

module.exports = router;
