import { createWebHistory, createRouter } from "vue-router";

const routes = [
  // ==================== ROUTE DANH MỤC ====================
  {
    path: "/danh-muc",
    name: "danh-muc.home",
    component: () => import("@/views/DanhMuc/DanhMucView.vue"),
  },
  {
    path: "/danh-muc/add",
    name: "danh-muc.add",
    component: () => import("@/views/DanhMuc/DanhMucAdd.vue"),
  },
  {
    path: "/danh-muc/edit/:id",
    name: "danh-muc.edit",
    component: () => import("@/views/DanhMuc/DanhMucEdit.vue"),
    props: true, // Cho phép truyền URL parameter (id) thành props trong component
  },

  // ==================== ROUTE THUONG HIEU ====================
  {
    path: "/thuong-hieu",
    name: "thuong-hieu.home",
    component: () => import("@/views/ThuongHieu/ThuongHieuView.vue"),
  },
  {
    path: "/thuong-hieu/add",
    name: "thuong-hieu.add",
    component: () => import("@/views/ThuongHieu/ThuongHieuAdd.vue"),
  },
  {
    path: "/thuong-hieu/edit/:id",
    name: "thuong-hieu.edit",
    component: () => import("@/views/ThuongHieu/ThuongHieuEdit.vue"),
    props: true, // Cho phép truyền URL parameter (id) thành props trong component
  },

  // ==================== ROUTE NHA CUNG CAP ====================
  {
    path: "/nha-cung-cap",
    name: "nha-cung-cap.home",
    component: () => import("@/views/NhaCungCap/NhaCungCapView.vue"),
  },
  {
    path: "/nha-cung-cap/add",
    name: "nha-cung-cap.add",
    component: () => import("@/views/NhaCungCap/NhaCungCapAdd.vue"),
  },
  {
    path: "/nha-cung-cap/edit/:id",
    name: "nha-cung-cap.edit",
    component: () => import("@/views/NhaCungCap/NhaCungCapEdit.vue"),
    props: true, // Cho phép truyền URL parameter (id) thành props trong component
  },

  // ==================== ROUTE MAU SAC ====================
  {
    path: "/mau-sac",
    name: "mau-sac.home",
    component: () => import("@/views/MauSac/MauSacView.vue"),
  },
  {
    path: "/mau-sac/add",
    name: "mau-sac.add",
    component: () => import("@/views/MauSac/MauSacAdd.vue"),
  },
  {
    path: "/mau-sac/edit/:id",
    name: "mau-sac.edit",
    component: () => import("@/views/MauSac/MauSacEdit.vue"),
    props: true, // Cho phép truyền URL parameter (id) thành props trong component
  },

  // ==================== ROUTE CPU ====================
  {
    path: "/cpu",
    name: "cpu.home",
    component: () => import("@/views/Cpu/CpuView.vue"),
  },
  {
    path: "/cpu/add",
    name: "cpu.add",
    component: () => import("@/views/Cpu/CpuAdd.vue"),
  },
  {
    path: "/cpu/edit/:id",
    name: "cpu.edit",
    component: () => import("@/views/Cpu/CpuEdit.vue"),
    props: true, // Cho phép truyền URL parameter (id) thành props trong component
  },

  // ==================== ROUTE GPU ====================
  {
    path: "/gpu",
    name: "gpu.home",
    component: () => import("@/views/Gpu/GpuView.vue"),
  },
  {
    path: "/gpu/add",
    name: "gpu.add",
    component: () => import("@/views/Gpu/GpuAdd.vue"),
  },
  {
    path: "/gpu/edit/:id",
    name: "gpu.edit",
    component: () => import("@/views/Gpu/GpuEdit.vue"),
    props: true, // Cho phép truyền URL parameter (id) thành props trong component
  },

  // ==================== ROUTE RAM ====================
  {
    path: "/ram",
    name: "ram.home",
    component: () => import("@/views/Ram/RamView.vue"),
  },
  {
    path: "/ram/add",
    name: "ram.add",
    component: () => import("@/views/Ram/RamAdd.vue"),
  },
  {
    path: "/ram/edit/:id",
    name: "ram.edit",
    component: () => import("@/views/Ram/RamEdit.vue"),
    props: true, // Cho phép truyền URL parameter (id) thành props trong component
  },

  // ==================== ROUTE ROM ====================
  {
    path: "/rom",
    name: "rom.home",
    component: () => import("@/views/Rom/RomView.vue"),
  },
  {
    path: "/rom/add",
    name: "rom.add",
    component: () => import("@/views/Rom/RomAdd.vue"),
  },
  {
    path: "/rom/edit/:id",
    name: "rom.edit",
    component: () => import("@/views/Rom/RomEdit.vue"),
    props: true, // Cho phép truyền URL parameter (id) thành props trong component
  },

  // ==================== ROUTE SAN PHAM ====================
  {
    path: "/san-pham",
    name: "san-pham.home",
    component: () => import("@/views/SanPham/SanPhamView.vue"),
  },
  {
    path: "/san-pham/detail/:id",
    name: "san-pham.detail",
    component: () => import("@/views/SanPham/SanPhamDetailView.vue"),
    props: true,
  },
  {
    path: "/san-pham/add",
    name: "san-pham.add",
    component: () => import("@/views/SanPham/SanPhamAdd.vue"),
  },
  {
    path: "/san-pham/edit/:id",
    name: "san-pham.edit",
    component: () => import("@/views/SanPham/SanPhamEdit.vue"),
    props: true, // Cho phép truyền URL parameter (id) thành props trong component
  },

  // ==================== ROUTE NHAN VIEN ====================
  {
    path: "/nhan-vien",
    name: "nhan-vien.home",
    component: () => import("@/views/NhanVien/NhanVienView.vue"),
  },
  {
    path: "/admin-login",
    name: "admin-login",
    component: () => import("@/views/NhanVien/LoginView.vue"),
  },
  {
    path: "/nhan-vien/add",
    name: "nhan-vien.add",
    component: () => import("@/views/NhanVien/NhanVienAdd.vue"),
  },
  {
    path: "/nhan-vien/edit/:id",
    name: "nhan-vien.edit",
    component: () => import("@/views/NhanVien/NhanVienEdit.vue"),
    props: true, // Cho phép truyền URL parameter (id) thành props trong component
  },
  {
    path: "/nhan-vien/edit-one/:id",
    name: "nhan-vien.edit-one",
    component: () => import("@/views/NhanVien/NhanVienOneEdit.vue"),
    props: true, // Cho phép truyền URL parameter (id) thành props trong component
  },

  // ==================== ROUTE PHIEU NHAP ====================
  {
    path: "/phieu-nhap",
    name: "phieu-nhap.home",
    component: () => import("@/views/PhieuNhap/PhieuNhapView.vue"),
  },
  {
    path: "/phieu-nhap/detail/:id",
    name: "phieu-nhap.detail",
    component: () => import("@/views/PhieuNhap/PhieuNhapDetailView.vue"),
    props: true,
  },
  {
    path: "/phieu-nhap/add",
    name: "phieu-nhap.add",
    component: () => import("@/views/PhieuNhap/PhieuNhapAdd.vue"),
  },
  {
    path: "/phieu-nhap/edit/:id",
    name: "phieu-nhap.edit",
    component: () => import("@/views/PhieuNhap/PhieuNhapEdit.vue"),
    props: true,
  },

  // ==================== ROUTE DOT KHUYEN MAI ====================
  {
    path: "/dot-khuyen-mai",
    name: "dot-khuyen-mai.home",
    component: () => import("@/views/DotKhuyenMai/DotKhuyenMaiView.vue"),
  },
  {
    path: "/dot-khuyen-mai/detail/:id",
    name: "dot-khuyen-mai.detail",
    component: () => import("@/views/DotKhuyenMai/DotKhuyenMaiDetailView.vue"),
    props: true,
  },
  {
    path: "/dot-khuyen-mai/add",
    name: "dot-khuyen-mai.add",
    component: () => import("@/views/DotKhuyenMai/DotKhuyenMaiAdd.vue"),
  },
  {
    path: "/dot-khuyen-mai/edit/:id",
    name: "dot-khuyen-mai.edit",
    component: () => import("@/views/DotKhuyenMai/DotKhuyenMaiEdit.vue"),
    props: true,
  },

  // ==================== ROUTE PHIEU GIAM GIA ====================
  {
    path: "/phieu-giam-gia",
    name: "phieu-giam-gia.home",
    component: () => import("@/views/PhieuGiamGia/PhieuGiamGiaView.vue"),
  },
  {
    path: "/phieu-giam-gia/add",
    name: "phieu-giam-gia.add",
    component: () => import("@/views/PhieuGiamGia/PhieuGiamGiaAdd.vue"),
  },
  {
    path: "/phieu-giam-gia/edit/:id",
    name: "phieu-giam-gia.edit",
    component: () => import("@/views/PhieuGiamGia/PhieuGiamGiaEdit.vue"),
    props: true,
  },
  {
    path: "/phieu-giam-gia/tang-phieu/:id?", // :id? có thể truyền hoặc không
    name: "tang-phieu",
    component: () => import("@/views/PhieuGiamGia/TangPhieuView.vue"),
    props: true,
  },

  // ==================== ROUTE HANG THANH VIEN ====================
  {
    path: "/hang-thanh-vien",
    name: "hang-thanh-vien.home",
    component: () => import("@/views/HangThanhVien/HangThanhVienView.vue"),
  },
  {
    path: "/hang-thanh-vien/add",
    name: "hang-thanh-vien.add",
    component: () => import("@/views/HangThanhVien/HangThanhVienAdd.vue"),
  },
  {
    path: "/hang-thanh-vien/edit/:id",
    name: "hang-thanh-vien.edit",
    component: () => import("@/views/HangThanhVien/HangThanhVienEdit.vue"),
    props: true,
  },

  // ==================== ROUTE THONG BAO ====================
  {
    path: "/thong-bao",
    name: "thong-bao.home",
    component: () => import("@/views/ThongBao/ThongBaoView.vue"),
  },
  {
    path: "/thong-bao/add",
    name: "thong-bao.add",
    component: () => import("@/views/ThongBao/ThongBaoAdd.vue"),
  },
  {
    path: "/thong-bao/edit/:id",
    name: "thong-bao.edit",
    component: () => import("@/views/ThongBao/ThongBaoEdit.vue"),
    props: true,
  },
  {
    path: "/thong-bao/gui-thong-bao/:id?",
    name: "gui-thong-bao",
    component: () => import("@/views/ThongBao/GuiThongBaoView.vue"),
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
