const express = require("express");
const nhanVien = require("../controllers/nhan-vien.controller");
const upload = require("../middlewares/uploadNhanVien");

const router = express.Router();

router.post("/login", nhanVien.login);
router.route("/:id/restore").patch(nhanVien.restore);

router
  .route("/")
  .get(nhanVien.findAll)
  .post(upload.single("image"), nhanVien.create)
  .delete(nhanVien.deleteAll);

router
  .route("/:id")
  .get(nhanVien.findOne)
  .put(upload.single("image"), nhanVien.update)
  .delete(nhanVien.delete);

module.exports = router;
