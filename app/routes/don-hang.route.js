const express = require("express");
const donHang = require("../controllers/don-hang.controller");

const router = express.Router();

router.route("/checkout").post(donHang.checkout);
router.route("/preview").post(donHang.previewCheckout);
router.patch("/:id/cancel", donHang.cancel);

router
  .route("/")
  .get(donHang.findAll)
  .post(donHang.create)
  .delete(donHang.deleteAll);

router
  .route("/:id")
  .get(donHang.findOne)
  .put(donHang.update)
  .delete(donHang.delete);

module.exports = router;
