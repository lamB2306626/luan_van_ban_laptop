const prisma = require("../utils/prisma");

// Định nghĩa các trạng thái đơn hàng được tính vào doanh thu thực tế
// Khai báo chuẩn bộ 7 trạng thái đơn hàng của hệ thống (đặt ở đầu file)
const TRANG_THAI_HOAN_THANH = ["HOAN_THANH"];
const TRANG_THAI_DANG_XU_LY = ["CHO_DUYET", "DA_XAC_NHAN", "DANG_VAN_CHUYEN"];
const TEN_TRANG_THAI_MAP = {
  CHO_DUYET: "Chờ duyệt",
  DA_XAC_NHAN: "Đã xác nhận",
  DANG_VAN_CHUYEN: "Đang giao",
  HOAN_THANH: "Đã giao",
  NV_HUY: "Đã hủy (bởi Admin)",
  KH_HUY: "Đã hủy (bởi Khách Hàng)",
  GIAO_THAT_BAI: "Giao hàng thất bại",
};

class ThongKeService {
  // 1. Hàm hỗ trợ chuẩn hóa khoảng thời gian lọc (Mặc định lấy 30 ngày gần nhất nếu không truyền)
  extractDateRange(filterData = {}) {
    const endDate = filterData.den_ngay
      ? new Date(filterData.den_ngay)
      : new Date();
    // Đưa về cuối ngày (23:59:59.999) để không sót đơn đặt trong ngày cuối
    endDate.setHours(23, 59, 59, 999);

    const startDate = filterData.tu_ngay
      ? new Date(filterData.tu_ngay)
      : new Date(new Date().setDate(endDate.getDate() - 30));
    // Đưa về đầu ngày (00:00:00.000)
    startDate.setHours(0, 0, 0, 0);

    return {
      startDate,
      endDate,
      groupBy: filterData.loai_thoi_gian || "day", // 'day' | 'month' | 'year'
    };
  }

  // 2. Hàm hỗ trợ tính Giá nhập trung bình (Giá vốn) của từng biến thể sản phẩm
  async getGiaVonTrungBinhMap() {
    // Lấy dữ liệu trực tiếp từ bảng chi_tiet_phieu_nhap
    const danhSachChiTietNhap = await prisma.chi_tiet_phieu_nhap.findMany({
      select: {
        id_bien_the: true,
        so_luong_nhap: true,
        gia_nhap: true,
      },
    });

    const thongKeNhap = {};

    for (const item of danhSachChiTietNhap) {
      const idBienThe = item.id_bien_the;
      const soLuong = Number(item.so_luong_nhap) || 0;
      const giaNhap = Number(item.gia_nhap) || 0;

      if (!thongKeNhap[idBienThe]) {
        thongKeNhap[idBienThe] = { tongSoLuong: 0, tongTienNhap: 0 };
      }

      thongKeNhap[idBienThe].tongSoLuong += soLuong;
      thongKeNhap[idBienThe].tongTienNhap += soLuong * giaNhap;
    }

    // Tạo Map: { [id_bien_the]: gia_von_trung_binh }
    const giaVonMap = {};
    for (const [idBienThe, data] of Object.entries(thongKeNhap)) {
      giaVonMap[idBienThe] =
        data.tongSoLuong > 0 ? data.tongTienNhap / data.tongSoLuong : 0;
    }

    return giaVonMap;
  }

  // 3. Hàm hỗ trợ format mốc thời gian để gom nhóm biểu đồ
  formatTimeKey(dateObj, groupBy) {
    const d = new Date(dateObj);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    if (groupBy === "year") return `${year}`;
    if (groupBy === "month") return `${year}-${month}`;
    return `${year}-${month}-${day}`; // Mặc định theo ngày: YYYY-MM-DD
  }

  // ==================== 1. THỐNG KÊ DOANH THU & LỢI NHUẬN GỘP ======================
  async thongKeDoanhThuLoiNhuan(filterData) {
    const { startDate, endDate, groupBy } = this.extractDateRange(filterData);

    // Bước 1: Lấy bảng giá vốn trung bình của tất cả biến thể
    const giaVonMap = await this.getGiaVonTrungBinhMap();

    // Bước 2: Lấy danh sách đơn hàng thành công trong khoảng thời gian lọc
    const danhSachDonHang = await prisma.don_hang.findMany({
      where: {
        ngay_dat: {
          gte: startDate,
          lte: endDate,
        },
        trang_thai_don_hang: {
          in: TRANG_THAI_HOAN_THANH,
        },
      },
      include: {
        chi_tiet_don_hang: {
          select: {
            id_bien_the: true,
            so_luong: true,
            don_gia_ap_dung: true,
          },
        },
      },
      orderBy: {
        ngay_dat: "asc",
      },
    });

    // Bước 3: Khởi tạo các biến tổng hợp cho thẻ KPI & dữ liệu biểu đồ
    let tongDoanhThu = 0; // Tổng tiền hàng khách trả (đã trừ khuyến mãi, không tính phí ship)
    let tongTienThanhToan = 0; // Tổng tiền thực thu gồm cả ship
    let tongTienGiamKm = 0; // Tổng chi phí khuyến mãi / voucher
    let tongPhiVanChuyen = 0; // Tổng phí vận chuyển
    let tongGiaVon = 0; // Tổng giá vốn hàng bán (COGS)
    let tongSanPhamBanRa = 0; // Tổng số lượng máy bán được

    const bieuDoMap = {};

    // Bước 4: Duyệt từng đơn hàng để tính toán chi tiết
    for (const donHang of danhSachDonHang) {
      const tienThanhToan = Number(donHang.tong_tien_thanh_toan) || 0;
      const tienGiamKm = Number(donHang.tong_tien_giam_km) || 0;
      const phiShip = Number(donHang.tien_van_chuyen) || 0;

      // Doanh thu thuần từ bán hàng (trừ phí ship vì phí ship trả cho bên vận chuyển GHN)
      const doanhThuThuanDon = Math.max(0, tienThanhToan - phiShip);

      // Tính giá vốn của đơn hàng này dựa trên từng biến thể đã bán
      let giaVonDon = 0;
      let soLuongMayTrongDon = 0;

      for (const chiTiet of donHang.chi_tiet_don_hang) {
        const soLuong = Number(chiTiet.so_luong) || 0;
        const giaVonBienThe = giaVonMap[chiTiet.id_bien_the] || 0;

        giaVonDon += soLuong * giaVonBienThe;
        soLuongMayTrongDon += soLuong;
      }

      const loiNhuanGopDon = doanhThuThuanDon - giaVonDon;

      // Cộng dồn vào tổng toàn kỳ
      tongDoanhThu += doanhThuThuanDon;
      tongTienThanhToan += tienThanhToan;
      tongTienGiamKm += tienGiamKm;
      tongPhiVanChuyen += phiShip;
      tongGiaVon += giaVonDon;
      tongSanPhamBanRa += soLuongMayTrongDon;

      // Gom nhóm dữ liệu theo mốc thời gian cho biểu đồ (Ngày / Tháng / Năm)
      const timeKey = this.formatTimeKey(donHang.ngay_dat, groupBy);

      if (!bieuDoMap[timeKey]) {
        bieuDoMap[timeKey] = {
          thoi_gian: timeKey,
          so_don_hang: 0,
          doanh_thu: 0,
          gia_von: 0,
          loi_nhuan_gop: 0,
          tien_giam_km: 0,
        };
      }

      bieuDoMap[timeKey].so_don_hang += 1;
      bieuDoMap[timeKey].doanh_thu += doanhThuThuanDon;
      bieuDoMap[timeKey].gia_von += giaVonDon;
      bieuDoMap[timeKey].loi_nhuan_gop += loiNhuanGopDon;
      bieuDoMap[timeKey].tien_giam_km += tienGiamKm;
    }

    const tongLoiNhuanGop = tongDoanhThu - tongGiaVon;
    const tySuatLoiNhuan =
      tongDoanhThu > 0
        ? Number(((tongLoiNhuanGop / tongDoanhThu) * 100).toFixed(2))
        : 0;

    // Làm tròn số tiền trong mảng biểu đồ
    const duLieuBieuDo = Object.values(bieuDoMap).map((item) => ({
      ...item,
      doanh_thu: Math.round(item.doanh_thu),
      gia_von: Math.round(item.gia_von),
      loi_nhuan_gop: Math.round(item.loi_nhuan_gop),
      tien_giam_km: Math.round(item.tien_giam_km),
    }));

    return {
      bo_loc: {
        tu_ngay: startDate,
        den_ngay: endDate,
        loai_thoi_gian: groupBy,
      },
      tong_quan: {
        tong_don_hang: danhSachDonHang.length,
        tong_san_pham_ban_ra: tongSanPhamBanRa,
        tong_doanh_thu: Math.round(tongDoanhThu),
        tong_tien_thanh_toan: Math.round(tongTienThanhToan),
        tong_gia_von: Math.round(tongGiaVon),
        tong_loi_nhuan_gop: Math.round(tongLoiNhuanGop),
        ty_suat_loi_nhuan: tySuatLoiNhuan, // Đơn vị: %
        tong_tien_giam_km: Math.round(tongTienGiamKm),
        tong_phi_van_chuyen: Math.round(tongPhiVanChuyen),
      },
      bieu_do: duLieuBieuDo,
    };
  }

  // ==================== 2. THỐNG KÊ TÌNH TRẠNG & HIỆU SUẤT XỬ LÝ ĐƠN HÀNG ======================
  async thongKeDonHang(filterData) {
    const { startDate, endDate } = this.extractDateRange(filterData);

    // Lấy toàn bộ đơn hàng phát sinh trong khoảng thời gian lọc
    const danhSachDonHang = await prisma.don_hang.findMany({
      where: {
        ngay_dat: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        trang_thai_don_hang: true,
        trang_thai_thanh_toan: true,
        phuong_thuc_thanh_toan: true,
        tong_tien_thanh_toan: true,
        ly_do_huy: true,
        ngay_dat: true,
        ngay_giao: true,
        id_nhan_vien: true,
        nhan_vien: {
          select: {
            id: true,
            ho_ten: true,
            email: true,
          },
        },
      },
    });

    const tongSoDon = danhSachDonHang.length;

    // Các biến gom nhóm thống kê
    const trangThaiDonMap = {}; // Gom theo 7 trạng thái đơn hàng
    const phuongThucTtMap = {}; // Gom theo phương thức thanh toán (COD, VNPAY...)
    const trangThaiTtMap = {}; // Gom theo trạng thái thanh toán

    // Tách riêng 3 nhóm lý do hủy / thất bại
    const lyDoKhachHuyMap = {};
    const lyDoNvHuyMap = {};
    const lyDoGiaoThatBaiMap = {};

    // Đếm chi tiết từng nhóm trạng thái
    let soDonThanhCong = 0; // HOAN_THANH
    let soDonDangXuLy = 0; // CHO_DUYET, DA_XAC_NHAN, DANG_VAN_CHUYEN
    let soDonKhachHuy = 0; // KH_HUY
    let soDonNvHuy = 0; // NV_HUY (Không được duyệt)
    let soDonGiaoThatBai = 0; // GIAO_THAT_BAI

    let tongThoiGianGiaoGio = 0;
    let soDonCoNgayGiao = 0;

    for (const don of danhSachDonHang) {
      const tienDon = Number(don.tong_tien_thanh_toan) || 0;
      const trangThaiDon = don.trang_thai_don_hang || "KHONG_XAC_DINH";
      const phuongThucTt = don.phuong_thuc_thanh_toan || "KHAC";
      const trangThaiTt = don.trang_thai_thanh_toan || "CHUA_THANH_TOAN";

      // 1. Thống kê theo từng Trạng thái đơn hàng (kèm tên tiếng Việt để Vue vẽ biểu đồ luôn)
      if (!trangThaiDonMap[trangThaiDon]) {
        trangThaiDonMap[trangThaiDon] = {
          ma_trang_thai: trangThaiDon,
          ten_trang_thai: TEN_TRANG_THAI_MAP[trangThaiDon] || trangThaiDon,
          so_luong: 0,
          tong_gia_tri: 0,
        };
      }
      trangThaiDonMap[trangThaiDon].so_luong += 1;
      trangThaiDonMap[trangThaiDon].tong_gia_tri += tienDon;

      // Phân loại chi tiết 5 nhóm trạng thái
      if (TRANG_THAI_HOAN_THANH.includes(trangThaiDon)) {
        soDonThanhCong += 1;
      } else if (TRANG_THAI_DANG_XU_LY.includes(trangThaiDon)) {
        soDonDangXuLy += 1;
      } else if (trangThaiDon === "KH_HUY") {
        soDonKhachHuy += 1;
        const lyDo = don.ly_do_huy?.trim() || "Khách không ghi rõ lý do";
        if (!lyDoKhachHuyMap[lyDo]) {
          lyDoKhachHuyMap[lyDo] = { ly_do: lyDo, so_luong: 0 };
        }
        lyDoKhachHuyMap[lyDo].so_luong += 1;
      } else if (trangThaiDon === "NV_HUY") {
        soDonNvHuy += 1;
        const lyDo = don.ly_do_huy?.trim() || "Admin không ghi rõ lý do";
        if (!lyDoNvHuyMap[lyDo]) {
          lyDoNvHuyMap[lyDo] = { ly_do: lyDo, so_luong: 0 };
        }
        lyDoNvHuyMap[lyDo].so_luong += 1;
      } else if (trangThaiDon === "GIAO_THAT_BAI") {
        soDonGiaoThatBai += 1;
        const lyDo = don.ly_do_huy?.trim() || "Giao vận thất bại";
        if (!lyDoGiaoThatBaiMap[lyDo]) {
          lyDoGiaoThatBaiMap[lyDo] = { ly_do: lyDo, so_luong: 0 };
        }
        lyDoGiaoThatBaiMap[lyDo].so_luong += 1;
      }

      // 2. Thống kê theo Phương thức thanh toán (VNPAY, COD...)
      if (!phuongThucTtMap[phuongThucTt]) {
        phuongThucTtMap[phuongThucTt] = {
          phuong_thuc: phuongThucTt,
          so_luong: 0,
          tong_gia_tri: 0,
        };
      }
      phuongThucTtMap[phuongThucTt].so_luong += 1;
      phuongThucTtMap[phuongThucTt].tong_gia_tri += tienDon;

      // 3. Thống kê theo Trạng thái thanh toán
      if (!trangThaiTtMap[trangThaiTt]) {
        trangThaiTtMap[trangThaiTt] = {
          trang_thai: trangThaiTt,
          so_luong: 0,
          tong_gia_tri: 0,
        };
      }
      trangThaiTtMap[trangThaiTt].so_luong += 1;
      trangThaiTtMap[trangThaiTt].tong_gia_tri += tienDon;

      // 4. Tính thời gian giao hàng trung bình (chỉ tính trên các đơn HOAN_THANH có ngay_giao)
      if (trangThaiDon === "HOAN_THANH" && don.ngay_giao && don.ngay_dat) {
        const diffMs = new Date(don.ngay_giao) - new Date(don.ngay_dat);
        if (diffMs >= 0) {
          tongThoiGianGiaoGio += diffMs / (1000 * 60 * 60);
          soDonCoNgayGiao += 1;
        }
      }
    }

    // Tính tỷ lệ % cho từng trạng thái đơn hàng & phương thức thanh toán
    const tyLeTrangThaiDon = Object.values(trangThaiDonMap).map((item) => ({
      ...item,
      tong_gia_tri: Math.round(item.tong_gia_tri),
      ty_le_phan_tram:
        tongSoDon > 0
          ? Number(((item.so_luong / tongSoDon) * 100).toFixed(2))
          : 0,
    }));

    const thongKePhuongThucTt = Object.values(phuongThucTtMap).map((item) => ({
      ...item,
      tong_gia_tri: Math.round(item.tong_gia_tri),
      ty_le_phan_tram:
        tongSoDon > 0
          ? Number(((item.so_luong / tongSoDon) * 100).toFixed(2))
          : 0,
    }));

    // Sắp xếp Top lý do giảm dần theo số lượng cho từng nhóm
    const sortDesc = (mapObj) =>
      Object.values(mapObj).sort((a, b) => b.so_luong - a.so_luong);

    // Tỷ lệ giao thất bại trên tổng số đơn đã xuất kho đi giao (HOAN_THANH + GIAO_THAT_BAI)
    const tongDonDaXuatKho = soDonThanhCong + soDonGiaoThatBai;

    return {
      bo_loc: {
        tu_ngay: startDate,
        den_ngay: endDate,
      },
      tong_quan: {
        tong_so_don: tongSoDon,
        so_don_thanh_cong: soDonThanhCong,
        so_don_dang_xu_ly: soDonDangXuLy,
        so_don_khach_huy: soDonKhachHuy,
        so_don_nv_huy: soDonNvHuy,
        so_don_giao_that_bai: soDonGiaoThatBai,
        ty_le_thanh_cong:
          tongSoDon > 0
            ? Number(((soDonThanhCong / tongSoDon) * 100).toFixed(2))
            : 0,
        ty_le_khach_huy:
          tongSoDon > 0
            ? Number(((soDonKhachHuy / tongSoDon) * 100).toFixed(2))
            : 0,
        ty_le_nv_huy:
          tongSoDon > 0
            ? Number(((soDonNvHuy / tongSoDon) * 100).toFixed(2))
            : 0,
        ty_le_giao_that_bai:
          tongDonDaXuatKho > 0
            ? Number(((soDonGiaoThatBai / tongDonDaXuatKho) * 100).toFixed(2))
            : 0,
        thoi_gian_giao_trung_binh_gio:
          soDonCoNgayGiao > 0
            ? Number((tongThoiGianGiaoGio / soDonCoNgayGiao).toFixed(1))
            : 0,
      },
      theo_trang_thai_don: tyLeTrangThaiDon,
      theo_phuong_thuc_thanh_toan: thongKePhuongThucTt,
      theo_trang_thai_thanh_toan: Object.values(trangThaiTtMap),
      chi_tiet_ly_do_huy: {
        khach_huy: sortDesc(lyDoKhachHuyMap),
        nhan_vien_huy: sortDesc(lyDoNvHuyMap),
        giao_that_bai: sortDesc(lyDoGiaoThatBaiMap),
      },
    };
  }

  // ==================== 3. THỐNG KÊ TOP SẢN PHẨM, CẤU HÌNH & LỢI NHUẬN TỪNG MẶT HÀNG ======================
  async thongKeSanPhamCauHinh(filterData) {
    const { startDate, endDate } = this.extractDateRange(filterData);
    const limit = parseInt(filterData.limit, 10) || 10; // Mặc định lấy Top 10

    // Bước 1: Lấy bảng giá vốn trung bình của từng biến thể để tính lời/lỗ
    const giaVonMap = await this.getGiaVonTrungBinhMap();

    // Bước 2: Lấy toàn bộ chi tiết đơn hàng của các đơn đã HOAN_THANH trong khoảng thời gian lọc
    const danhSachChiTietBan = await prisma.chi_tiet_don_hang.findMany({
      where: {
        don_hang: {
          ngay_dat: {
            gte: startDate,
            lte: endDate,
          },
          trang_thai_don_hang: {
            in: TRANG_THAI_HOAN_THANH, // ["HOAN_THANH"]
          },
        },
      },
      select: {
        so_luong: true,
        don_gia_ap_dung: true,
        don_hang: {
          select: {
            tong_tien_goc: true,
            tien_van_chuyen: true,
            tong_tien_thanh_toan: true,
          },
        },
        bien_the: {
          select: {
            id: true,
            duong_dan_anh: true,
            san_pham: {
              select: {
                id: true,
                ten_san_pham: true,
                thuong_hieu: {
                  select: { id: true, ten_thuong_hieu: true },
                },
                danh_muc: {
                  select: { id: true, ten_danh_muc: true },
                },
                anh_san_pham: {
                  where: { la_anh_chinh: true },
                  select: { duong_dan_anh: true },
                },
              },
            },
            cpu: { select: { id: true, ten_cpu: true } },
            gpu: { select: { id: true, ten_gpu: true } },
            dung_luong_ram: { select: { id: true, dung_luong_ram: true } },
            dung_luong_rom: { select: { id: true, dung_luong_rom: true } },
            mau_sac: { select: { id: true, ten_mau_sac: true } },
          },
        },
      },
    });

    // Các Map dùng để gom nhóm dữ liệu
    const sanPhamMap = {}; // Gom theo dòng sản phẩm gốc (san_pham)
    const bienTheMap = {}; // Gom theo từng cấu hình cụ thể (bien_the)
    const thuongHieuMap = {}; // Thị phần theo Thương hiệu
    const danhMucMap = {}; // Thị phần theo Danh mục

    // Các Map phân tích xu hướng cấu hình phần cứng
    const ramMap = {};
    const romMap = {};
    const cpuMap = {};
    const gpuMap = {};
    const mauSacMap = {};

    let tongSoMayBanRa = 0;
    let tongDoanhThuSanPham = 0;
    let tongGiaVonSanPham = 0;

    for (const item of danhSachChiTietBan) {
      const soLuong = Number(item.so_luong) || 0;
      const doanhThuGocItem = soLuong * (Number(item.don_gia_ap_dung) || 0);

      // Phân bổ voucher giảm giá toàn đơn (nếu có) để tính Doanh thu thuần thực tế của từng máy
      const dh = item.don_hang;
      let doanhThuThuanItem = doanhThuGocItem;
      if (dh) {
        const tongTienGocDon =
          (Number(dh.tong_tien_goc) || 0) - (Number(dh.tong_tien_giam_km) || 0);
        const doanhThuThuanDon = Math.max(
          0,
          (Number(dh.tong_tien_thanh_toan) || 0) -
            (Number(dh.tien_van_chuyen) || 0),
        );
        if (tongTienGocDon > 0 && doanhThuThuanDon < tongTienGocDon) {
          doanhThuThuanItem =
            doanhThuGocItem * (doanhThuThuanDon / tongTienGocDon);
        }
      }

      const bt = item.bien_the;
      if (!bt || !bt.san_pham) continue;

      // Tính Giá vốn & Lợi nhuận gộp của dòng sản phẩm này
      const giaVonDonVi = giaVonMap[bt.id] || 0;
      const giaVonItem = soLuong * giaVonDonVi;
      const loiNhuanItem = doanhThuThuanItem - giaVonItem;

      tongSoMayBanRa += soLuong;
      tongDoanhThuSanPham += doanhThuThuanItem;
      tongGiaVonSanPham += giaVonItem;

      const sp = bt.san_pham;
      const anhDaiDienSP = sp.anh_san_pham?.[0]?.duong_dan_anh || null;
      const anhDaiDienBT = bt.duong_dan_anh || null;

      // 1. Gom nhóm theo Sản phẩm gốc (san_pham) - Tích hợp đầy đủ Doanh thu, Giá vốn, Lời/Lỗ
      if (!sanPhamMap[sp.id]) {
        sanPhamMap[sp.id] = {
          id_san_pham: sp.id,
          ten_san_pham: sp.ten_san_pham,
          thuong_hieu: sp.thuong_hieu?.ten_thuong_hieu || "Khác",
          danh_muc: sp.danh_muc?.ten_danh_muc || "Khác",
          anh_dai_dien_sp: anhDaiDienSP,
          so_luong_ban: 0,
          doanh_thu: 0,
          gia_von: 0,
          loi_nhuan_gop: 0,
        };
      }
      sanPhamMap[sp.id].so_luong_ban += soLuong;
      sanPhamMap[sp.id].doanh_thu += doanhThuThuanItem;
      sanPhamMap[sp.id].gia_von += giaVonItem;
      sanPhamMap[sp.id].loi_nhuan_gop += loiNhuanItem;

      // 2. Gom nhóm theo Biến thể cấu hình cụ thể (bien_the)
      const tenCpu = bt.cpu?.ten_cpu || "N/A";
      const tenGpu = bt.gpu?.ten_gpu || "N/A";
      const tenRam = bt.dung_luong_ram?.dung_luong_ram || "N/A";
      const tenRom = bt.dung_luong_rom?.dung_luong_rom || "N/A";
      const tenMau = bt.mau_sac?.ten_mau_sac || "N/A";

      if (!bienTheMap[bt.id]) {
        bienTheMap[bt.id] = {
          id_bien_the: bt.id,
          ten_san_pham: sp.ten_san_pham,
          cau_hinh_tom_tat: `${tenCpu} / ${tenRam} / ${tenRom} / ${tenGpu} (${tenMau})`,
          anh_dai_dien_bt: anhDaiDienBT,
          anh_dai_dien_sp: anhDaiDienSP,
          so_luong_ban: 0,
          doanh_thu: 0,
          gia_von: 0,
          loi_nhuan_gop: 0,
        };
      }
      bienTheMap[bt.id].so_luong_ban += soLuong;
      bienTheMap[bt.id].doanh_thu += doanhThuThuanItem;
      bienTheMap[bt.id].gia_von += giaVonItem;
      bienTheMap[bt.id].loi_nhuan_gop += loiNhuanItem;

      // 3. Gom nhóm theo Thương hiệu
      const tenTh = sp.thuong_hieu?.ten_thuong_hieu || "Khác";
      if (!thuongHieuMap[tenTh]) {
        thuongHieuMap[tenTh] = {
          ten_thuong_hieu: tenTh,
          so_luong_ban: 0,
          doanh_thu: 0,
          loi_nhuan_gop: 0,
        };
      }
      thuongHieuMap[tenTh].so_luong_ban += soLuong;
      thuongHieuMap[tenTh].doanh_thu += doanhThuThuanItem;
      thuongHieuMap[tenTh].loi_nhuan_gop += loiNhuanItem;

      // 4. Gom nhóm theo Danh mục
      const tenDm = sp.danh_muc?.ten_danh_muc || "Khác";
      if (!danhMucMap[tenDm]) {
        danhMucMap[tenDm] = {
          ten_danh_muc: tenDm,
          so_luong_ban: 0,
          doanh_thu: 0,
          loi_nhuan_gop: 0,
        };
      }
      danhMucMap[tenDm].so_luong_ban += soLuong;
      danhMucMap[tenDm].doanh_thu += doanhThuThuanItem;
      danhMucMap[tenDm].loi_nhuan_gop += loiNhuanItem;

      // 5. Hàm tiện ích gom nhóm từng linh kiện cấu hình
      const congDonLinhKien = (mapObj, keyName, label) => {
        if (!mapObj[label]) {
          mapObj[label] = { [keyName]: label, so_luong_ban: 0, doanh_thu: 0 };
        }
        mapObj[label].so_luong_ban += soLuong;
        mapObj[label].doanh_thu += doanhThuThuanItem;
      };

      congDonLinhKien(ramMap, "dung_luong_ram", tenRam);
      congDonLinhKien(romMap, "dung_luong_rom", tenRom);
      congDonLinhKien(cpuMap, "ten_cpu", tenCpu);
      congDonLinhKien(gpuMap, "ten_gpu", tenGpu);
      congDonLinhKien(mauSacMap, "ten_mau_sac", tenMau);
    }

    // Hàm tiện ích sắp xếp giảm dần theo số lượng bán & tính tỷ trọng %
    const formatAndSortList = (
      mapObj,
      maxItems = null,
      sortBy = "so_luong_ban",
    ) => {
      const list = Object.values(mapObj)
        .map((item) => {
          const doanhThuTron = Math.round(item.doanh_thu);
          const giaVonTron =
            item.gia_von !== undefined ? Math.round(item.gia_von) : undefined;
          const loiNhuanTron =
            item.loi_nhuan_gop !== undefined
              ? Math.round(item.loi_nhuan_gop)
              : undefined;

          return {
            ...item,
            doanh_thu: doanhThuTron,
            ...(giaVonTron !== undefined && { gia_von: giaVonTron }),
            ...(loiNhuanTron !== undefined && {
              loi_nhuan_gop: loiNhuanTron,
              loi_nhuan_trung_binh_may:
                item.so_luong_ban > 0
                  ? Math.round(loiNhuanTron / item.so_luong_ban)
                  : 0,
              ty_suat_loi_nhuan:
                doanhThuTron > 0
                  ? Number(((loiNhuanTron / doanhThuTron) * 100).toFixed(2))
                  : 0,
            }),
            ty_le_so_luong:
              tongSoMayBanRa > 0
                ? Number(
                    ((item.so_luong_ban / tongSoMayBanRa) * 100).toFixed(2),
                  )
                : 0,
            ty_le_doanh_thu:
              tongDoanhThuSanPham > 0
                ? Number(
                    ((item.doanh_thu / tongDoanhThuSanPham) * 100).toFixed(2),
                  )
                : 0,
          };
        })
        .sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));

      return maxItems ? list.slice(0, maxItems) : list;
    };

    // Danh sách toàn bộ sản phẩm sắp xếp theo Lợi nhuận gộp từ cao xuống thấp (để lọc cả lời lẫn lỗ)
    const danhSachLoiNhuanSanPham = formatAndSortList(
      sanPhamMap,
      null,
      "loi_nhuan_gop",
    );

    const tongLoiNhuanSanPham = tongDoanhThuSanPham - tongGiaVonSanPham;

    return {
      bo_loc: {
        tu_ngay: startDate,
        den_ngay: endDate,
        limit,
      },
      tong_quan: {
        tong_so_may_ban_ra: tongSoMayBanRa,
        tong_doanh_thu_san_pham: Math.round(tongDoanhThuSanPham),
        tong_gia_von_san_pham: Math.round(tongGiaVonSanPham),
        tong_loi_nhuan_san_pham: Math.round(tongLoiNhuanSanPham),
        so_san_pham_ban_lo: danhSachLoiNhuanSanPham.filter(
          (sp) => sp.loi_nhuan_gop < 0,
        ).length,
      },
      top_san_pham: formatAndSortList(sanPhamMap, limit, "so_luong_ban"),
      top_san_pham_loi_nhuan: danhSachLoiNhuanSanPham.slice(0, limit),
      bang_loi_nhuan_san_pham: danhSachLoiNhuanSanPham,
      top_bien_the_cau_hinh: formatAndSortList(
        bienTheMap,
        limit,
        "so_luong_ban",
      ),
      thi_phan_thuong_hieu: formatAndSortList(
        thuongHieuMap,
        null,
        "so_luong_ban",
      ),
      thi_phan_danh_muc: formatAndSortList(danhMucMap, null, "so_luong_ban"),
      xu_huong_cau_hinh: {
        ram: formatAndSortList(ramMap),
        rom: formatAndSortList(romMap),
        cpu: formatAndSortList(cpuMap, limit),
        gpu: formatAndSortList(gpuMap, limit),
        mau_sac: formatAndSortList(mauSacMap),
      },
    };
  }

  // ==================== 4. THỐNG KÊ TỒN KHO & CẢNH BÁO NHẬP HÀNG ======================
  async thongKeTonKho(filterData = {}) {
    // Ngưỡng cảnh báo sắp hết hàng (mặc định < 5 máy, tức là <= 4)
    const nguongSapHet =
      filterData.nguong_sap_het !== undefined
        ? parseInt(filterData.nguong_sap_het, 10)
        : 5;

    // Số ngày không phát sinh đơn để coi là hàng tồn đọng (mặc định 45 ngày)
    const soNgayTonDong =
      filterData.so_ngay_ton_dong !== undefined
        ? parseInt(filterData.so_ngay_ton_dong, 10)
        : 45;

    const now = new Date();
    const mocThoiGian30Ngay = new Date();
    mocThoiGian30Ngay.setDate(now.getDate() - 30);

    const mocThoiGianTonDong = new Date();
    mocThoiGianTonDong.setDate(now.getDate() - soNgayTonDong);

    // Bước 1: Lấy bảng giá vốn trung bình của từng biến thể
    const giaVonMap = await this.getGiaVonTrungBinhMap();

    // Bước 2: Lấy danh sách toàn bộ biến thể đang quản lý (chưa bị xóa mềm)
    const danhSachBienThe = await prisma.bien_the.findMany({
      where: {
        is_delete: false,
        san_pham: {
          is_delete: false,
        },
      },
      select: {
        id: true,
        gia: true,
        so_luong: true,
        trang_thai: true,
        duong_dan_anh: true,
        san_pham: {
          select: {
            id: true,
            ten_san_pham: true,
            trang_thai: true,
            thuong_hieu: { select: { ten_thuong_hieu: true } },
            danh_muc: { select: { ten_danh_muc: true } },
            anh_san_pham: {
              where: { la_anh_chinh: true },
              select: { duong_dan_anh: true },
            },
          },
        },
        cpu: { select: { ten_cpu: true } },
        gpu: { select: { ten_gpu: true } },
        dung_luong_ram: { select: { dung_luong_ram: true } },
        dung_luong_rom: { select: { dung_luong_rom: true } },
        mau_sac: { select: { ten_mau_sac: true } },
        // Lấy thông tin các đợt nhập để biết ngày nhập đầu tiên & gần nhất
        chi_tiet_phieu_nhap: {
          select: {
            so_luong_nhap: true,
            gia_nhap: true,
            phieu_nhap: {
              select: { ngay_nhap: true },
            },
          },
        },
      },
    });

    // Bước 3: Lấy số lượng bán ra của từng biến thể trong 30 ngày qua & trong khoảng soNgayTonDong
    const khoangLayDon =
      mocThoiGianTonDong < mocThoiGian30Ngay
        ? mocThoiGianTonDong
        : mocThoiGian30Ngay;

    const danhSachBanGanDay = await prisma.chi_tiet_don_hang.findMany({
      where: {
        don_hang: {
          ngay_dat: {
            gte: khoangLayDon,
            lte: now,
          },
          trang_thai_don_hang: {
            in: TRANG_THAI_HOAN_THANH, // ["HOAN_THANH"]
          },
        },
      },
      select: {
        id_bien_the: true,
        so_luong: true,
        don_hang: {
          select: { ngay_dat: true },
        },
      },
    });

    // Gom nhóm tốc độ bán theo id_bien_the
    const ban30NgayMap = {};
    const banTrongKyTonDongMap = {};

    for (const item of danhSachBanGanDay) {
      const idBt = item.id_bien_the;
      const sl = Number(item.so_luong) || 0;
      const ngayDat = new Date(item.don_hang.ngay_dat);

      if (ngayDat >= mocThoiGian30Ngay) {
        ban30NgayMap[idBt] = (ban30NgayMap[idBt] || 0) + sl;
      }
      if (ngayDat >= mocThoiGianTonDong) {
        banTrongKyTonDongMap[idBt] = (banTrongKyTonDongMap[idBt] || 0) + sl;
      }
    }

    // Bước 4: Tổng hợp chỉ số tồn kho & phân loại cảnh báo
    let tongSoLuongTon = 0;
    let tongGiaTriTonVon = 0;
    let tongGiaTriTonBanLe = 0;
    let soBienTheHetHang = 0;

    const canhBaoSapHetHang = [];
    const hangTonDongList = [];
    const tonKhoTheoThuongHieuMap = {};

    for (const bt of danhSachBienThe) {
      const soLuongTon = Number(bt.so_luong) || 0;
      const giaBanLe = Number(bt.gia) || 0;
      const giaVon = giaVonMap[bt.id] || 0;

      const giaTriVonItem = soLuongTon * giaVon;
      const giaTriBanLeItem = soLuongTon * giaBanLe;

      const duongDanAnhBT = bt.duong_dan_anh?.trim() || "";
      const duongDanAnhSP = bt.san_pham.anh_san_pham?.[0]?.duong_dan_anh.trim();

      tongSoLuongTon += soLuongTon;
      tongGiaTriTonVon += giaTriVonItem;
      tongGiaTriTonBanLe += giaTriBanLeItem;

      if (soLuongTon === 0) {
        soBienTheHetHang += 1;
      }

      // Gom nhóm tồn kho theo Thương hiệu (để vẽ biểu đồ phân bổ vốn tồn kho)
      const tenTh = bt.san_pham?.thuong_hieu?.ten_thuong_hieu || "Khác";
      if (!tonKhoTheoThuongHieuMap[tenTh]) {
        tonKhoTheoThuongHieuMap[tenTh] = {
          ten_thuong_hieu: tenTh,
          so_luong_ton: 0,
          gia_tri_von: 0,
        };
      }
      tonKhoTheoThuongHieuMap[tenTh].so_luong_ton += soLuongTon;
      tonKhoTheoThuongHieuMap[tenTh].gia_tri_von += giaTriVonItem;

      // Chuẩn hóa thông tin hiển thị của biến thể
      const tenCauHinh = `${bt.cpu?.ten_cpu || "N/A"} / ${bt.dung_luong_ram?.dung_luong_ram || "N/A"} / ${bt.dung_luong_rom?.dung_luong_rom || "N/A"} / ${bt.gpu?.ten_gpu || "N/A"} (${bt.mau_sac?.ten_mau_sac || "N/A"})`;
      const daBan30Ngay = ban30NgayMap[bt.id] || 0;
      const daBanTrongKyTonDong = banTrongKyTonDongMap[bt.id] || 0;

      // Tìm ngày nhập đầu tiên và ngày nhập gần nhất của biến thể này
      let ngayNhapGanNhat = null;
      let ngayNhapDauTien = null;
      for (const ctpn of bt.chi_tiet_phieu_nhap) {
        if (ctpn.phieu_nhap?.ngay_nhap) {
          const d = new Date(ctpn.phieu_nhap.ngay_nhap);
          if (!ngayNhapGanNhat || d > ngayNhapGanNhat) ngayNhapGanNhat = d;
          if (!ngayNhapDauTien || d < ngayNhapDauTien) ngayNhapDauTien = d;
        }
      }

      // 4.1. Kiểm tra Cảnh báo Sắp hết hàng (so_luong < nguongSapHet và đang kinh doanh)
      if (bt.trang_thai && soLuongTon < nguongSapHet) {
        // Phân mức độ ưu tiên để Frontend gắn badge Đỏ / Vàng
        let mucDoCanhBao = "TRUNG_BINH"; // Vàng: còn ít nhưng bán chậm
        if (soLuongTon === 0) {
          mucDoCanhBao = "HET_HANG"; // Đỏ đậm: đã hết sạch hàng
        } else if (daBan30Ngay >= 3 || soLuongTon <= 2) {
          mucDoCanhBao = "KHAN_CAP"; // Đỏ: sắp hết & bán nhanh
        }

        canhBaoSapHetHang.push({
          id_bien_the: bt.id,
          id_san_pham: bt.san_pham?.id,
          ten_san_pham: bt.san_pham?.ten_san_pham,
          thuong_hieu: tenTh,
          cau_hinh_tom_tat: tenCauHinh,
          so_luong_ton: soLuongTon,
          da_ban_30_ngay: daBan30Ngay,
          gia_nhap_tb: Math.round(giaVon),
          gia_ban: Math.round(giaBanLe),
          muc_do_canh_bao: mucDoCanhBao,
          duong_dan_anh_bt: duongDanAnhBT,
          duong_dan_anh_sp: duongDanAnhSP,
        });
      }

      // 4.2. Kiểm tra Hàng tồn đọng (Dead stock):
      // Còn hàng trong kho (> 0), đã nhập trước mốc soNgayTonDong, và không bán được máy nào trong kỳ đó
      if (
        soLuongTon > 0 &&
        daBanTrongKyTonDong === 0 &&
        ngayNhapDauTien &&
        ngayNhapDauTien <= mocThoiGianTonDong
      ) {
        const soNgayChuaBan = ngayNhapGanNhat
          ? Math.floor((now - ngayNhapGanNhat) / (1000 * 60 * 60 * 24))
          : soNgayTonDong;

        hangTonDongList.push({
          id_bien_the: bt.id,
          id_san_pham: bt.san_pham?.id,
          ten_san_pham: bt.san_pham?.ten_san_pham,
          thuong_hieu: tenTh,
          cau_hinh_tom_tat: tenCauHinh,
          so_luong_ton: soLuongTon,
          gia_nhap_tb: Math.round(giaVon),
          tong_von_dong: Math.round(giaTriVonItem),
          ngay_nhap_gan_nhat: ngayNhapGanNhat,
          so_ngay_khong_phat_sinh_don: Math.max(soNgayTonDong, soNgayChuaBan),
          duong_dan_anh_bt: duongDanAnhBT,
          duong_dan_anh_sp: duongDanAnhSP,
        });
      }
    }

    // Sắp xếp danh sách Sắp hết hàng: ưu tiên mẫu bán chạy trong 30 ngày qua lên đầu, sau đó tới số lượng tồn ít nhất
    canhBaoSapHetHang.sort((a, b) => {
      if (b.da_ban_30_ngay !== a.da_ban_30_ngay) {
        return b.da_ban_30_ngay - a.da_ban_30_ngay;
      }
      return a.so_luong_ton - b.so_luong_ton;
    });

    // Sắp xếp danh sách Hàng tồn đọng: ưu tiên mẫu đang đọng nhiều vốn nhất lên đầu
    hangTonDongList.sort((a, b) => b.tong_von_dong - a.tong_von_dong);

    // Sắp xếp tồn kho theo thương hiệu giảm dần theo giá trị vốn
    const tonKhoTheoThuongHieu = Object.values(tonKhoTheoThuongHieuMap)
      .map((item) => ({
        ...item,
        gia_tri_von: Math.round(item.gia_tri_von),
        ty_le_von:
          tongGiaTriTonVon > 0
            ? Number(((item.gia_tri_von / tongGiaTriTonVon) * 100).toFixed(2))
            : 0,
      }))
      .sort((a, b) => b.gia_tri_von - a.gia_tri_von);

    return {
      tham_so_loc: {
        nguong_sap_het: nguongSapHet,
        so_ngay_ton_dong: soNgayTonDong,
      },
      tong_quan: {
        tong_bien_the_dang_quan_ly: danhSachBienThe.length,
        tong_so_luong_ton: tongSoLuongTon,
        tong_gia_tri_ton_von: Math.round(tongGiaTriTonVon),
        tong_gia_tri_ton_ban_le: Math.round(tongGiaTriTonBanLe),
        so_bien_the_het_hang: soBienTheHetHang,
        so_bien_the_sap_het: canhBaoSapHetHang.length,
        so_bien_the_ton_dong: hangTonDongList.length,
        tong_von_ton_dong: hangTonDongList.reduce(
          (sum, item) => sum + item.tong_von_dong,
          0,
        ),
      },
      ton_kho_theo_thuong_hieu: tonKhoTheoThuongHieu,
      canh_bao_sap_het_hang: canhBaoSapHetHang,
      hang_ton_dong: hangTonDongList,
    };
  }
}

module.exports = ThongKeService;
