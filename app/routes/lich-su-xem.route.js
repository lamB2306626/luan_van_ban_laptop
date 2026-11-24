const express = require("express");
const lichSuXem = require("../controllers/lich-su-xem.controller");

const router = express.Router();

router
  .route("/")
  .get(lichSuXem.findAll)
  .post(lichSuXem.create)
  .delete(lichSuXem.deleteAll);

router
  .route("/:id")
  .get(lichSuXem.findOne)
  .put(lichSuXem.update)
  .delete(lichSuXem.delete);

module.exports = router;
