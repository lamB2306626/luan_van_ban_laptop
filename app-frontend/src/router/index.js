import { createWebHistory, createRouter } from "vue-router";

// 1. Import các Layouts mà chúng ta vừa tạo
import AdminLayout from "@/components/Layouts/AdminLayout.vue";
import KhachHangLayout from "@/components/Layouts/KhachHangLayout.vue";
import AuthKHLayout from "@/components/Layouts/AuthKHLayout.vue";
import AuthAdminLayout from "@/components/Layouts/AuthAdminLayout.vue";

const routes = [
  // ============================== NHÓM KHÁCH HÀNG (CLIENT) ==================================
  {
    path: "/",
    component: KhachHangLayout,
    children: [
      // ==================== ROUTE TRANG CHU ====================
      {
        path: "/trang-chu",
        name: "trang-chu.home",
        component: () => import("@/views/TrangChu/TrangChuView.vue"),
      },

      // ==================== ROUTE TRANG CHI TIET SAN PHAM ====================
      {
        path: "/chi-tiet-san-pham/:id",
        name: "chi-tiet-san-pham.home",
        component: () =>
          import("@/views/ChiTietSanPham/ChiTietSanPhamView.vue"),
        props: true,
      },

      // ==================== ROUTE TRANG GIO HANG ====================
      {
        path: "/gio-hang",
        name: "gio-hang.home",
        component: () => import("@/views/TrangGioHang/TrangGioHangView.vue"),
        props: true,
        meta: { requiresAuth: true, role: "customer" },
      },
      // ==================== ROUTE TRANG DAT HANG ====================
      {
        path: "/dat-hang/preview",
        name: "dat-hang.preview",
        component: () => import("@/views/TrangDatHang/XemTruocDonHangView.vue"),
        props: true,
        meta: { requiresAuth: true, role: "customer" },
      },
      // ==================== ROUTE TRANG THANH TOAN ====================
      {
        path: "/payment-return",
        name: "PaymentReturn",
        component: () =>
          import("../views/TrangThanhToan/PaymentReturnView.vue"),
        meta: { requiresAuth: true, role: "customer" },
      },
      // ==================== ROUTE TRANG DAT HANG ====================
      {
        path: "/lich-su-don-hang",
        name: "lich-su-don-hang.home",
        component: () => import("@/views/LichSuDonHang/LichSuDonHang.vue"),
        props: true,
        meta: { requiresAuth: true, role: "customer" },
      },
      {
        path: "/lich-su-don-hang/:id",
        name: "lich-su-don-hang.detail",
        component: () => import("@/views/LichSuDonHang/ChiTietDonHang.vue"),
        props: true,
        meta: { requiresAuth: true, role: "customer" },
      },
      // ==================== ROUTE TRANG THONG BAO ====================
      {
        path: "/trang-thong-bao",
        name: "trang-thong-bao.home",
        component: () => import("@/views/TrangThongBao/TrangThongBao.vue"),
        meta: { requiresAuth: true, role: "customer" },
      },
      // ==================== ROUTE TRANG LIEN HE ====================
      {
        path: "/trang-lien-he",
        name: "trang-lien-he.home",
        component: () => import("@/views/TrangLienHe/TrangLienHe.vue"),
        meta: { requiresAuth: true, role: "customer" },
      },
      // ==================== ROUTE TRANG THONG TIN CA NHAN KHACH HANG ====================
      {
        path: "/trang-thong-tin-kh/:id",
        name: "trang-thong-tin-kh.home",
        component: () => import("@/views/TrangThongTinKH/TrangThongTinKH.vue"),
        props: true,
        meta: { requiresAuth: true, role: "customer" },
      },
      // ==================== ROUTE TRANG CHATBOT ====================
      {
        path: "/tu-van-ai",
        name: "tu-van-ai.home",
        component: () => import("@/views/TuVanAI/TuVanAI.vue"),
        meta: { requiresAuth: true, role: "customer" },
      },

      // ==================== ROUTE TRANG DIA_CHI ====================
      {
        path: "/dia-chi/add",
        name: "dia-chi.add",
        component: () => import("@/views/DiaChi/DiaChiAdd.vue"),
        meta: { requiresAuth: true, role: "customer" },
      },
    ],
  },

  // NHÓM ĐĂNG NHẬP & ĐĂNG KÝ KHÁCH HÀNG
  {
    path: "/khach-hang-auth",
    component: AuthKHLayout,
    meta: { guestOnlyCustomer: true },
    children: [
      {
        path: "/khach-hang/login",
        name: "khach-hang.login",
        component: () => import("@/views/KhachHang/LoginView.vue"),
      },
      {
        path: "/khach-hang/register",
        name: "khach-hang.register",
        component: () => import("@/views/KhachHang/RegisterView.vue"),
      },
    ],
  },

  // NHÓM ĐĂNG NHẬP NHÂN VIÊN / ADMIN
  {
    path: "/quan-tri-auth",
    component: AuthAdminLayout,
    meta: { guestOnlyAdmin: true },
    children: [
      {
        path: "/admin-login",
        name: "admin.login",
        component: () => import("@/views/NhanVien/LoginView.vue"),
      },
    ],
  },

  // ============================== NHÓM QUẢN TRỊ (ADMIN) ==================================
  {
    path: "/admin",
    component: AdminLayout,
    meta: { requiresAuth: true, role: "admin" },
    children: [
      {
        path: "/admin/trang-chu",
        name: "admin.home",
        component: () => import("@/views/Admin/TrangChuAdminView.vue"),
        meta: { requiresAuth: true, role: "admin" },
      },
      // ==================== ROUTE DANH MỤC ====================
      {
        path: "/danh-muc",
        name: "danh-muc.home",
        component: () => import("@/views/DanhMuc/DanhMucView.vue"),
        meta: {
          requiresAuth: true,
          role: "admin",
        },
      },
      {
        path: "/danh-muc/add",
        name: "danh-muc.add",
        component: () => import("@/views/DanhMuc/DanhMucAdd.vue"),
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên kho", "Quản trị viên"],
        },
      },
      {
        path: "/danh-muc/edit/:id",
        name: "danh-muc.edit",
        component: () => import("@/views/DanhMuc/DanhMucEdit.vue"),
        props: true, // Cho phép truyền URL parameter (id) thành props trong component
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên kho", "Quản trị viên"],
        },
      },

      // ==================== ROUTE THUONG HIEU ====================
      {
        path: "/thuong-hieu",
        name: "thuong-hieu.home",
        component: () => import("@/views/ThuongHieu/ThuongHieuView.vue"),
        meta: { requiresAuth: true, role: "admin" },
      },
      {
        path: "/thuong-hieu/add",
        name: "thuong-hieu.add",
        component: () => import("@/views/ThuongHieu/ThuongHieuAdd.vue"),
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên kho", "Quản trị viên"],
        },
      },
      {
        path: "/thuong-hieu/edit/:id",
        name: "thuong-hieu.edit",
        component: () => import("@/views/ThuongHieu/ThuongHieuEdit.vue"),
        props: true, // Cho phép truyền URL parameter (id) thành props trong component
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên kho", "Quản trị viên"],
        },
      },

      // ==================== ROUTE NHA CUNG CAP ====================
      {
        path: "/nha-cung-cap",
        name: "nha-cung-cap.home",
        component: () => import("@/views/NhaCungCap/NhaCungCapView.vue"),
        meta: {
          requiresAuth: true,
          role: "admin",
        },
      },
      {
        path: "/nha-cung-cap/add",
        name: "nha-cung-cap.add",
        component: () => import("@/views/NhaCungCap/NhaCungCapAdd.vue"),
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên kho", "Quản trị viên"],
        },
      },
      {
        path: "/nha-cung-cap/edit/:id",
        name: "nha-cung-cap.edit",
        component: () => import("@/views/NhaCungCap/NhaCungCapEdit.vue"),
        props: true, // Cho phép truyền URL parameter (id) thành props trong component
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên kho", "Quản trị viên"],
        },
      },

      // ==================== ROUTE MAU SAC ====================
      {
        path: "/mau-sac",
        name: "mau-sac.home",
        component: () => import("@/views/MauSac/MauSacView.vue"),
        meta: { requiresAuth: true, role: "admin" },
      },
      {
        path: "/mau-sac/add",
        name: "mau-sac.add",
        component: () => import("@/views/MauSac/MauSacAdd.vue"),
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên kho", "Quản trị viên"],
        },
      },
      {
        path: "/mau-sac/edit/:id",
        name: "mau-sac.edit",
        component: () => import("@/views/MauSac/MauSacEdit.vue"),
        props: true, // Cho phép truyền URL parameter (id) thành props trong component
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên kho", "Quản trị viên"],
        },
      },

      // ==================== ROUTE CPU ====================
      {
        path: "/cpu",
        name: "cpu.home",
        component: () => import("@/views/Cpu/CpuView.vue"),
        meta: { requiresAuth: true, role: "admin" },
      },
      {
        path: "/cpu/add",
        name: "cpu.add",
        component: () => import("@/views/Cpu/CpuAdd.vue"),
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên kho", "Quản trị viên"],
        },
      },
      {
        path: "/cpu/edit/:id",
        name: "cpu.edit",
        component: () => import("@/views/Cpu/CpuEdit.vue"),
        props: true, // Cho phép truyền URL parameter (id) thành props trong component
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên kho", "Quản trị viên"],
        },
      },

      // ==================== ROUTE GPU ====================
      {
        path: "/gpu",
        name: "gpu.home",
        component: () => import("@/views/Gpu/GpuView.vue"),
        meta: { requiresAuth: true, role: "admin" },
      },
      {
        path: "/gpu/add",
        name: "gpu.add",
        component: () => import("@/views/Gpu/GpuAdd.vue"),
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên kho", "Quản trị viên"],
        },
      },
      {
        path: "/gpu/edit/:id",
        name: "gpu.edit",
        component: () => import("@/views/Gpu/GpuEdit.vue"),
        props: true, // Cho phép truyền URL parameter (id) thành props trong component
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên kho", "Quản trị viên"],
        },
      },

      // ==================== ROUTE RAM ====================
      {
        path: "/ram",
        name: "ram.home",
        component: () => import("@/views/Ram/RamView.vue"),
        meta: { requiresAuth: true, role: "admin" },
      },
      {
        path: "/ram/add",
        name: "ram.add",
        component: () => import("@/views/Ram/RamAdd.vue"),
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên kho", "Quản trị viên"],
        },
      },
      {
        path: "/ram/edit/:id",
        name: "ram.edit",
        component: () => import("@/views/Ram/RamEdit.vue"),
        props: true, // Cho phép truyền URL parameter (id) thành props trong component
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên kho", "Quản trị viên"],
        },
      },

      // ==================== ROUTE ROM ====================
      {
        path: "/rom",
        name: "rom.home",
        component: () => import("@/views/Rom/RomView.vue"),
        meta: { requiresAuth: true, role: "admin" },
      },
      {
        path: "/rom/add",
        name: "rom.add",
        component: () => import("@/views/Rom/RomAdd.vue"),
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên kho", "Quản trị viên"],
        },
      },
      {
        path: "/rom/edit/:id",
        name: "rom.edit",
        component: () => import("@/views/Rom/RomEdit.vue"),
        props: true, // Cho phép truyền URL parameter (id) thành props trong component
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên kho", "Quản trị viên"],
        },
      },

      // ==================== ROUTE SAN PHAM ====================
      {
        path: "/san-pham",
        name: "san-pham.home",
        component: () => import("@/views/SanPham/SanPhamView.vue"),
        meta: { requiresAuth: true, role: "admin" },
      },
      {
        path: "/san-pham/detail/:id",
        name: "san-pham.detail",
        component: () => import("@/views/SanPham/SanPhamDetailView.vue"),
        props: true,
        meta: {
          requiresAuth: true,
          role: "admin",
        },
      },
      {
        path: "/san-pham/add",
        name: "san-pham.add",
        component: () => import("@/views/SanPham/SanPhamAdd.vue"),
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên kho", "Quản trị viên"],
        },
      },
      {
        path: "/san-pham/trash",
        name: "san-pham.trash",
        component: () => import("@/views/SanPham/SanPhamTrash.vue"),
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên kho", "Quản trị viên"],
        },
      },
      // {
      //   path: "/san-pham/edit/:id",
      //   name: "san-pham.edit",
      //   component: () => import("@/views/SanPham/SanPhamEdit.vue"),
      //   props: true, // Cho phép truyền URL parameter (id) thành props trong component
      // },

      // ==================== ROUTE NHAN VIEN ====================
      {
        path: "/nhan-vien",
        name: "nhan-vien.home",
        component: () => import("@/views/NhanVien/NhanVienView.vue"),
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Quản trị viên"],
        },
      },
      {
        path: "/nhan-vien/add",
        name: "nhan-vien.add",
        component: () => import("@/views/NhanVien/NhanVienAdd.vue"),
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Quản trị viên"],
        },
      },
      {
        path: "/nhan-vien/edit/:id",
        name: "nhan-vien.edit",
        component: () => import("@/views/NhanVien/NhanVienEdit.vue"),
        props: true, // Cho phép truyền URL parameter (id) thành props trong component
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Quản trị viên"],
        },
      },
      {
        path: "/nhan-vien/edit-one/:id",
        name: "nhan-vien.edit-one",
        component: () => import("@/views/NhanVien/NhanVienOneEdit.vue"),
        props: true, // Cho phép truyền URL parameter (id) thành props trong component
        meta: { requiresAuth: true, role: "admin" },
      },

      // ==================== ROUTE PHIEU NHAP ====================
      {
        path: "/phieu-nhap",
        name: "phieu-nhap.home",
        component: () => import("@/views/PhieuNhap/PhieuNhapView.vue"),
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên kho", "Quản trị viên"],
        },
      },
      {
        path: "/phieu-nhap/detail/:id",
        name: "phieu-nhap.detail",
        component: () => import("@/views/PhieuNhap/PhieuNhapDetailView.vue"),
        props: true,
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên kho", "Quản trị viên"],
        },
      },
      {
        path: "/phieu-nhap/add",
        name: "phieu-nhap.add",
        component: () => import("@/views/PhieuNhap/PhieuNhapAdd.vue"),
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên kho", "Quản trị viên"],
        },
      },
      {
        path: "/phieu-nhap/edit/:id",
        name: "phieu-nhap.edit",
        component: () => import("@/views/PhieuNhap/PhieuNhapEdit.vue"),
        props: true,
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên kho", "Quản trị viên"],
        },
      },

      // ==================== ROUTE DOT KHUYEN MAI ====================
      {
        path: "/dot-khuyen-mai",
        name: "dot-khuyen-mai.home",
        component: () => import("@/views/DotKhuyenMai/DotKhuyenMaiView.vue"),
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: [
            "Nhân viên Marketing",
            "Nhân viên bán hàng",
            "Quản trị viên",
          ],
        },
      },
      {
        path: "/dot-khuyen-mai/detail/:id",
        name: "dot-khuyen-mai.detail",
        component: () =>
          import("@/views/DotKhuyenMai/DotKhuyenMaiDetailView.vue"),
        props: true,
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: [
            "Nhân viên Marketing",
            "Nhân viên bán hàng",
            "Quản trị viên",
          ],
        },
      },
      {
        path: "/dot-khuyen-mai/add",
        name: "dot-khuyen-mai.add",
        component: () => import("@/views/DotKhuyenMai/DotKhuyenMaiAdd.vue"),
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên Marketing", "Quản trị viên"],
        },
      },
      {
        path: "/dot-khuyen-mai/edit/:id",
        name: "dot-khuyen-mai.edit",
        component: () => import("@/views/DotKhuyenMai/DotKhuyenMaiEdit.vue"),
        props: true,
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên Marketing", "Quản trị viên"],
        },
      },

      // ==================== ROUTE PHIEU GIAM GIA ====================
      {
        path: "/phieu-giam-gia",
        name: "phieu-giam-gia.home",
        component: () => import("@/views/PhieuGiamGia/PhieuGiamGiaView.vue"),
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: [
            "Nhân viên Marketing",
            "Nhân viên bán hàng",
            "Quản trị viên",
          ],
        },
      },
      {
        path: "/phieu-giam-gia/add",
        name: "phieu-giam-gia.add",
        component: () => import("@/views/PhieuGiamGia/PhieuGiamGiaAdd.vue"),
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên Marketing", "Quản trị viên"],
        },
      },
      {
        path: "/phieu-giam-gia/edit/:id",
        name: "phieu-giam-gia.edit",
        component: () => import("@/views/PhieuGiamGia/PhieuGiamGiaEdit.vue"),
        props: true,
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên Marketing", "Quản trị viên"],
        },
      },
      {
        path: "/phieu-giam-gia/tang-phieu/:id?", // :id? có thể truyền hoặc không
        name: "tang-phieu",
        component: () => import("@/views/PhieuGiamGia/TangPhieuView.vue"),
        props: true,
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên Marketing", "Quản trị viên"],
        },
      },

      // ==================== ROUTE HANG THANH VIEN ====================
      {
        path: "/hang-thanh-vien",
        name: "hang-thanh-vien.home",
        component: () => import("@/views/HangThanhVien/HangThanhVienView.vue"),
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: [
            "Nhân viên Marketing",
            "Nhân viên bán hàng",
            "Quản trị viên",
          ],
        },
      },
      {
        path: "/hang-thanh-vien/add",
        name: "hang-thanh-vien.add",
        component: () => import("@/views/HangThanhVien/HangThanhVienAdd.vue"),
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên Marketing", "Quản trị viên"],
        },
      },
      {
        path: "/hang-thanh-vien/edit/:id",
        name: "hang-thanh-vien.edit",
        component: () => import("@/views/HangThanhVien/HangThanhVienEdit.vue"),
        props: true,
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên Marketing", "Quản trị viên"],
        },
      },

      // ==================== ROUTE THONG BAO ====================
      {
        path: "/thong-bao",
        name: "thong-bao.home",
        component: () => import("@/views/ThongBao/ThongBaoView.vue"),
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên Marketing", "Quản trị viên"],
        },
      },
      {
        path: "/thong-bao/add",
        name: "thong-bao.add",
        component: () => import("@/views/ThongBao/ThongBaoAdd.vue"),
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên Marketing", "Quản trị viên"],
        },
      },
      {
        path: "/thong-bao/edit/:id",
        name: "thong-bao.edit",
        component: () => import("@/views/ThongBao/ThongBaoEdit.vue"),
        props: true,
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên Marketing", "Quản trị viên"],
        },
      },
      {
        path: "/thong-bao/gui-thong-bao/:id?",
        name: "gui-thong-bao",
        component: () => import("@/views/ThongBao/GuiThongBaoView.vue"),
        props: true,
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên Marketing", "Quản trị viên"],
        },
      },

      // ==================== ROUTE DON_HANG ====================
      {
        path: "/don-hang",
        name: "don-hang.home",
        component: () => import("@/views/DonHang/DonHangView.vue"),
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên bán hàng", "Quản trị viên"],
        },
      },
      {
        path: "/don-hang/:id",
        name: "don-hang.detail",
        component: () => import("@/views/DonHang/DonHangDetailView.vue"),
        props: true,
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên bán hàng", "Quản trị viên"],
        },
      },
      // ==================== ROUTE CUOC_TRO_TRUYEN ====================
      {
        path: "/lich-su-tro-truyen",
        name: "lich-su-tro-truyen.home",
        component: () =>
          import("@/views/LichSuTroTruyen/LichSuTroTruyenView.vue"),
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên bán hàng", "Quản trị viên"],
        },
      },
      {
        path: "/lich-su-tro-truyen/:id",
        name: "lich-su-tro-truyen.detail",
        component: () =>
          import("@/views/LichSuTroTruyen/ChiTietLichSuTroTruyen.vue"),
        props: true,
        meta: { requiresAuth: true, role: "admin" },
        allowedRoles: ["Nhân viên bán hàng", "Quản trị viên"],
      },

      // ==================== ROUTE KHACH HANG ====================
      {
        path: "/khach-hang",
        name: "khach-hang.home",
        component: () => import("@/views/KhachHang/KhachHangView.vue"),
        meta: {
          requiresAuth: true,
          role: "admin",
          allowedRoles: ["Nhân viên bán hàng", "Quản trị viên"],
        },
      },

      // ==================== ROUTE THONG KE ====================
      {
        path: "/thong-ke",
        name: "thong-ke.home",
        component: () => import("@/views/ThongKe/ThongKeView.vue"),
        meta: {
          requiresAuth: true,
          role: "admin",
          // allowedRoles: ["Nhân viên bán hàng", "Quản trị viên"],
        },
      },
    ],
  },
];

function getCustomerUser() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Kiểm tra có object hợp lệ (ví dụ có id hoặc email)
    return parsed && (parsed.id || parsed.email) ? parsed : null;
  } catch (e) {
    return null;
  }
}

function getAdminUser() {
  try {
    const raw = localStorage.getItem("adminUser");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && (parsed.id || parsed.email) ? parsed : null;
  } catch (e) {
    return null;
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Hàm helper lấy vai trò của nhân viên (chỉnh tên trường cho khớp dữ liệu thực tế)
function getAdminRole(admin) {
  if (!admin) return null;
  return admin.vai_tro.ten_vai_tro || null;
}

router.beforeEach((to, from, next) => {
  const customer = getCustomerUser();
  const admin = getAdminUser();

  const requiresAuth = to.matched.some((record) => record.meta?.requiresAuth);
  const requiredRole = [...to.matched]
    .reverse()
    .find((record) => record.meta?.role)?.meta?.role;

  // Lấy allowedRoles gần nhất (ưu tiên route con nếu có khai báo)
  const allowedRoles = [...to.matched]
    .reverse()
    .find((record) => Array.isArray(record.meta?.allowedRoles))
    ?.meta?.allowedRoles;

  const isGuestOnlyCustomer = to.matched.some(
    (record) => record.meta?.guestOnlyCustomer,
  );
  const isGuestOnlyAdmin = to.matched.some(
    (record) => record.meta?.guestOnlyAdmin,
  );

  // 1. Nếu route yêu cầu đăng nhập
  if (requiresAuth) {
    if (requiredRole === "admin") {
      // Chưa đăng nhập admin -> đá về trang login admin
      if (!admin) {
        if (to.name !== "admin.login") {
          return next({
            name: "admin.login",
            query: { redirect: to.fullPath },
          });
        }
        return next();
      }

      // Đã đăng nhập admin: kiểm tra tiếp allowedRoles nếu route có quy định
      if (allowedRoles && allowedRoles.length > 0) {
        const currentAdminRole = getAdminRole(admin);
        if (!currentAdminRole || !allowedRoles.includes(currentAdminRole)) {
          const deniedMsg = "Bạn không có quyền truy cập chức năng này!";

          // Trường hợp 1: Đã ở trong app và bấm chuyển trang trên giao diện
          if (from.matched.length > 0) {
            window.dispatchEvent(
              new CustomEvent("admin-access-denied", {
                detail: { message: deniedMsg },
              }),
            );
            return next(false);
          }

          // Trường hợp 2: Gõ trực tiếp URL lần đầu (chưa có layout nào mount)
          sessionStorage.setItem("admin_access_denied_msg", deniedMsg);
          return next({ name: "admin.home" });
        }
      }

      return next();
    }

    if (requiredRole === "customer") {
      if (!customer) {
        if (to.name !== "khach-hang.login") {
          return next({
            name: "khach-hang.login",
            query: { redirect: to.fullPath },
          });
        }
      }
      return next();
    }
  }

  // 2. Đã đăng nhập khách hàng mà vào trang đăng nhập khách hàng -> chuyển về trang chủ
  if (isGuestOnlyCustomer && customer) {
    return next({ name: "trang-chu.home" });
  }

  // 3. Đã đăng nhập admin mà vào trang đăng nhập admin -> chuyển về trang quản trị
  if (isGuestOnlyAdmin && admin) {
    return next({ name: "admin.home" });
  }

  return next();
});

export default router;
