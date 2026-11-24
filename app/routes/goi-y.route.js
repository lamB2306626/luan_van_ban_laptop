const express = require("express");
const router = express.Router();
const goiYSanPhamController = require("../controllers/goi-y.controller");

// Route gợi ý cá nhân hóa cho Trang chủ (VD: /api/goiy/canhan?makhachhang=KH0001&limit=10)
router.get("/ca-nhan", goiYSanPhamController.getPersonalized);

// Route gợi ý sản phẩm nổi bật/bán chạy cho Khách mới (VD: /api/goiy/noibat?limit=10)
router.get("/noi-bat", goiYSanPhamController.getPopular);

// Route tìm sản phẩm tương tự (VD: /api/goi_y/tuong_tu?id_san_pham=SP01&limit=10)
router.get("/tuong-tu", goiYSanPhamController.getSimilarProducts);

module.exports = router;
