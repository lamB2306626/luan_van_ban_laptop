const express = require("express");
const diaChi = require("../controllers/dia-chi.controller");

const router = express.Router();

router
  .route("/")
  .get(diaChi.findAll)
  .post(diaChi.create)
  .delete(diaChi.deleteAll);

router
  .route("/:id")
  .get(diaChi.findOne)
  .put(diaChi.update)
  .delete(diaChi.delete);

module.exports = router;
