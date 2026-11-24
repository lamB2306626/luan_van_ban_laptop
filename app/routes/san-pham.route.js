const express = require("express");
const sanPham = require("../controllers/san-pham.controller");
const upload = require("../middlewares/uploadAnhSanPham");

const router = express.Router();

router.route("/:id/restore").patch(sanPham.restore);
router.route("/lay-cho-goi-y").get(sanPham.getAllProductsForRecommendation);
router.route("/for-rag").get(sanPham.getDataForRAG);

router
  .route("/")
  .get(sanPham.findAll)
  .post(upload.array("images", 10), sanPham.create)
  .delete(sanPham.deleteAll);

router
  .route("/:id")
  .get(sanPham.findOne)
  .put(upload.array("images", 10), sanPham.update)
  .delete(sanPham.delete);

module.exports = router;
