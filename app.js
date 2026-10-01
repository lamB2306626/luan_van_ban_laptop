const express = require("express");
const cors = require("cors");

// Import các route API
const danhMucRouter = require("./app/routes/danh-muc.route");
const thuongHieuRouter = require("./app/routes/thuong-hieu.route");
const sanPhamRouter = require("./app/routes/san-pham.route");
const thongSoRouter = require("./app/routes/thong-so.route");
const anhSanPhamRouter = require("./app/routes/anh-san-pham.route");

//=================================
const thuocTinhRouter = require("./app/routes/thuoc-tinh.route");
const giaTriThuocTinhRouter = require("./app/routes/gia-tri-thuoc-tinh.route");
const thuocTinhBienTheRouter = require("./app/routes/thuoc-tinh-bien-the.route");
//===============================

const mauSacRouter = require("./app/routes/mau-sac.route");
const cpuRouter = require("./app/routes/cpu.route");
const gpuRouter = require("./app/routes/gpu.route");
const dungLuongRamRouter = require("./app/routes/dung-luong-ram.route");
const dungLuongRomRouter = require("./app/routes/dung-luong-rom.route");
const bienTheRouter = require("./app/routes/bien-the.route");
const vaiTroRouter = require("./app/routes/vai-tro.route");
const nhanVienRouter = require("./app/routes/nhan-vien.route");
const phieuNhapRouter = require("./app/routes/phieu-nhap.route");
const chiTietPhieuNhapRouter = require("./app/routes/chi-tiet-phieu-nhap.route");
const nhaCungCapRouter = require("./app/routes/nha-cung-cap.route");
const hangThanhVienRouter = require("./app/routes/hang-thanh-vien.route");
const khachHangRouter = require("./app/routes/khach-hang.route");
const diaChiRouter = require("./app/routes/dia-chi.route");
const thongBaoRouter = require("./app/routes/thong-bao.route");
const chiTietThongBaoRouter = require("./app/routes/chi-tiet-thong-bao.route");
const yeuThichRouter = require("./app/routes/yeu-thich.route");
const danhGiaRouter = require("./app/routes/danh-gia.route");
const phieuGiamGiaRouter = require("./app/routes/phieu-giam-gia.route");
const phieuKhachHangRouter = require("./app/routes/phieu-khach-hang.route");
const phieuHangThanhVienRouter = require("./app/routes/phieu-hang-thanh-vien.route");
const donHangRouter = require("./app/routes/don-hang.route");
const chiTietDonHangRouter = require("./app/routes/chi-tiet-don-hang.route");
const gioHangRouter = require("./app/routes/gio-hang.route");
const chiTietGioHangRouter = require("./app/routes/chi-tiet-gio-hang.route");
const dotKhuyenMaiRouter = require("./app/routes/dot-khuyen-mai.route");
const chiTietKhuyenMaiRouter = require("./app/routes/chi-tiet-khuyen-mai.route");

const app = express();

app.use("/uploads", express.static("uploads"));

app.use(cors());
app.use(express.json());

// Route kiểm tra server
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Laptop Store API!" });
});

// Đăng ký danh sách các API Route riêng
app.use("/api/danh-muc", danhMucRouter);
app.use("/api/thuong-hieu", thuongHieuRouter);
app.use("/api/san-pham", sanPhamRouter);
app.use("/api/thong-so", thongSoRouter);
app.use("/api/anh-san-pham", anhSanPhamRouter);

// ==================================
app.use("/api/thuoc-tinh", thuocTinhRouter);
app.use("/api/gia-tri-thuoc-tinh", giaTriThuocTinhRouter);
app.use("/api/thuoc-tinh-bien-the", thuocTinhBienTheRouter);
// ==================================

app.use("/api/mau-sac", mauSacRouter);
app.use("/api/cpu", cpuRouter);
app.use("/api/gpu", gpuRouter);
app.use("/api/dung-luong-ram", dungLuongRamRouter);
app.use("/api/dung-luong-rom", dungLuongRomRouter);
app.use("/api/bien-the", bienTheRouter);
app.use("/api/vai-tro", vaiTroRouter);
app.use("/api/nhan-vien", nhanVienRouter);
app.use("/api/phieu-nhap", phieuNhapRouter);
app.use("/api/chi-tiet-phieu-nhap", chiTietPhieuNhapRouter);
app.use("/api/nha-cung-cap", nhaCungCapRouter);
app.use("/api/hang-thanh-vien", hangThanhVienRouter);
app.use("/api/khach-hang", khachHangRouter);
app.use("/api/dia-chi", diaChiRouter);
app.use("/api/thong-bao", thongBaoRouter);
app.use("/api/chi-tiet-thong-bao", chiTietThongBaoRouter);
app.use("/api/yeu-thich", yeuThichRouter);
app.use("/api/danh-gia", danhGiaRouter);
app.use("/api/phieu-giam-gia", phieuGiamGiaRouter);
app.use("/api/phieu-khach-hang", phieuKhachHangRouter);
app.use("/api/phieu-hang-thanh-vien", phieuHangThanhVienRouter);
app.use("/api/don-hang", donHangRouter);
app.use("/api/chi-tiet-don-hang", chiTietDonHangRouter);
app.use("/api/gio-hang", gioHangRouter);
app.use("/api/chi-tiet-gio-hang", chiTietGioHangRouter);
app.use("/api/dot-khuyen-mai", dotKhuyenMaiRouter);
app.use("/api/chi-tiet-khuyen-mai", chiTietKhuyenMaiRouter);

// Middleware xử lý lỗi 404 (Không tìm thấy route)

// app.use((req, res, next) => {
//   return res.status(404).json({ message: "Resource not found" });
// });

app.use((err, req, res, next) => {
  return res.status(err.statusCode || 500).json({
    message: err.message || "Đã xảy ra lỗi hệ thống",
  });
});

module.exports = app;


