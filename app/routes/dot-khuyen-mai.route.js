const express = require("express");
const dotKhuyenMai = require("../controllers/dot-khuyen-mai.controller");

const router = express.Router();

router
  .route("/")
  .get(dotKhuyenMai.findAll)
  .post(dotKhuyenMai.create)
//   .delete(dotKhuyenMai.deleteAll);

router
  .route("/:id")
  .get(dotKhuyenMai.findOne)
  .put(dotKhuyenMai.update)
  .delete(dotKhuyenMai.delete);

module.exports = router;
