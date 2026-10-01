const express = require("express");
const phieuGiamGia = require("../controllers/phieu-giam-gia.controller");

const router = express.Router();

router.route("/:id/restore").patch(phieuGiamGia.restore);

router
  .route("/")
  .get(phieuGiamGia.findAll)
  .post(phieuGiamGia.create)
  .delete(phieuGiamGia.deleteAll);

router
  .route("/:id")
  .get(phieuGiamGia.findOne)
  .put(phieuGiamGia.update)
  .delete(phieuGiamGia.delete);

module.exports = router;
