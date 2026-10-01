const express = require("express");
const bienThe = require("../controllers/bien-the.controller");
const upload = require("../middlewares/uploadBienThe");

const router = express.Router();

router.route("/:id/restore").patch(bienThe.restore);

router
  .route("/")
  .get(bienThe.findAll)
  .post(upload.single("image"), bienThe.create)
  .delete(bienThe.deleteAll);

router
  .route("/:id")
  .get(bienThe.findOne)
  .put(upload.single("image"), bienThe.update)
  .delete(bienThe.delete);

module.exports = router;
