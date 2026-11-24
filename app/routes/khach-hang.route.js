const express = require("express");
const khachHang = require("../controllers/khach-hang.controller");
const upload = require("../middlewares/uploadKhachHang");

const router = express.Router();

router.post("/login", khachHang.login);
router.route("/:id/restore").patch(khachHang.restore);

router.post("/google-login", khachHang.googleLogin);
router.post("/facebook-login", khachHang.loginWithFacebook);

router
  .route("/")
  .get(khachHang.findAll)
  .post(khachHang.create)
  .delete(khachHang.deleteAll);

router
  .route("/:id")
  .get(khachHang.findOne)
  .put(upload.single("image"), khachHang.update)
  .delete(khachHang.delete);

module.exports = router;
