const express = require("express");
const mauSac = require("../controllers/mau-sac.controller");

const router = express.Router();

router
  .route("/")
  .get(mauSac.findAll)
  .post(mauSac.create)
  .delete(mauSac.deleteAll);

router
  .route("/:id")
  .get(mauSac.findOne)
  .put(mauSac.update)
  .delete(mauSac.delete);

module.exports = router;
