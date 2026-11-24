const express = require("express");
const thongKe = require("../controllers/thong-ke.controller");

const router = express.Router();

// Thống kê Doanh thu & Lợi nhuận gộp
// GET /api/thong-ke/doanh-thu-loi-nhuan?tu_ngay=2026-10-01&den_ngay=2026-11-22&loai_thoi_gian=day
router.route("/doanh-thu-loi-nhuan").get(thongKe.getDoanhThuLoiNhuan);

// Thống kê Tình trạng & Hiệu suất xử lý Đơn hàng
// GET /api/thong-ke/don-hang?tu_ngay=2026-10-01&den_ngay=2026-11-22
router.route("/don-hang").get(thongKe.getThongKeDonHang);

// Thống kê Top Sản phẩm & Cấu hình laptop bán chạy
// GET /api/thong-ke/san-pham-cau-hinh?tu_ngay=2026-10-01&den_ngay=2026-11-22&limit=5
router.route("/san-pham-cau-hinh").get(thongKe.getThongKeSanPhamCauHinh);

// Thống kê Tồn kho & Cảnh báo nhập hàng
// GET /api/thong-ke/ton-kho?nguong_sap_het=5&so_ngay_ton_dong=45
router.route("/ton-kho").get(thongKe.getThongKeTonKho);

module.exports = router;
