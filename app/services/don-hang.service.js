const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const KhachHangService = require("./khach-hang.service");
const BienTheService = require("./bien-the.service");
const ChiTietGioHangService = require("./chi-tiet-gio-hang.service");
const PhieuKhachHangService = require("./phieu-khach-hang.service");

class DonHangService {
  constructor() {
    this.khachHangService = new KhachHangService();
    this.bienTheService = new BienTheService();
    this.chiTietGioHangService = new ChiTietGioHangService();
    this.phieuKhachHangService = new PhieuKhachHangService();
  }

  extractDonHangData(payload) {
    const donHang = {
      id: payload.id,
      id_khach_hang: payload.id_khach_hang,
      id_nhan_vien: payload.id_nhan_vien,
      id_phieu_giam_gia: payload.id_phieu_giam_gia,
      tong_tien_thanh_toan:
        payload.tong_tien_thanh_toan !== undefined
          ? payload.tong_tien_thanh - toan
          : 0,
      trang_thai_don_hang: payload.trang_thai_don_hang || "CHO_DUYET",
      trang_thai_thanh_toan: payload.trang_thai_thanh_toan || "CHUA_THANH_TOAN",
      ngay_dat: payload.ngay_dat,
      ngay_giao: payload.ngay_giao,
      dia_chi: payload.dia_chi,
      ly_do_huy: payload.ly_do_huy,
    };

    Object.keys(donHang).forEach(
      (key) => donHang[key] === undefined && delete donHang[key],
    );
    return donHang;
  }

  // ==================== HELPER: Chỉ tính tiền giảm từ Voucher ====================
  tinhTienGiamVoucher(phieu, tongTienSauKM) {
    if (!phieu) {
      return tongTienSauKM < 0 ? 0 : tongTienSauKM;
    }

    const giaTriGiam = Number(phieu.gia_tri_giam) || 0;
    let soTienGiamVoucher = 0;

    if (phieu.loai_phieu === "PHAN_TRAM") {
      soTienGiamVoucher = (tongTienSauKM * giaTriGiam) / 100;

      // Nếu có quy định giảm tối đa và tiền giảm vượt trần -> Giới hạn lại
      if (phieu.giam_toi_da !== null && soTienGiamVoucher > phieu.giam_toi_da) {
        soTienGiamVoucher = phieu.giam_toi_da;
      }
    } else if (phieu.loai_phieu === "CO_DINH") {
      soTienGiamVoucher = giaTriGiam;
    }

    let tongTienThanhToan = tongTienSauKM - soTienGiamVoucher;
    if (tongTienThanhToan < 0) {
      tongTienThanhToan = 0;
    }

    return tongTienThanhToan;
  }

  // ==================== HELPER: Tính & cập nhật lại các tổng tiền đơn hàng ====================
  async recalculateTotal(idDonHang, tx) {
    const db = tx || prisma;

    // 1. Lấy thông tin đơn hàng kèm phiếu giảm giá
    const donHang = await db.don_hang.findUnique({
      where: { id: idDonHang },
      include: { phieu_giam_gia: true },
    });

    if (!donHang) {
      throw new Error("DON_HANG_KHONG_TON_TAI");
    }

    // 2. Lấy danh sách chi tiết đơn hàng
    const listChiTiet = await db.chi_tiet_don_hang.findMany({
      where: { id_don_hang: idDonHang },
    });

    // 3. Tính Tổng tiền gốc & Tổng tiền tạm tính từ các cột snapshot
    let tongTienGoc = 0;
    let tongTienSauKM = 0;

    listChiTiet.forEach((item) => {
      const soLuong = Number(item.so_luong) || 0;
      const giaGoc = Number(item.gia_goc) || 0;
      const donGiaApDung = Number(item.don_gia_ap_dung) || 0;

      tongTienGoc += giaGoc * soLuong;
      tongTienSauKM += donGiaApDung * soLuong;
    });

    const tongTienGiamKm = tongTienGoc - tongTienSauKM;

    // 4. Gọi hàm helper để tính toán giảm giá voucher
    const tongTienThanhToan = this.tinhTienGiamVoucher(
      donHang.phieu_giam_gia,
      tongTienSauKM,
    );

    // 5. Cập nhật các tổng tiền vào đơn hàng
    return await db.don_hang.update({
      where: { id: idDonHang },
      data: {
        tong_tien_goc: tongTienGoc,
        tong_tien_giam_km: tongTienGiamKm < 0 ? 0 : tongTienGiamKm,
        tong_tien_thanh_toan: tongTienThanhToan,
      },
    });
  }

  // ==================== XEM TRƯỚC ĐƠN HÀNG (PREVIEW CHECKOUT) TỪ DANH SÁCH CÁC CHI TIẾT GIỎ HÀNG =====================
  async previewCheckout(payload, tx) {
    const { items, id_khach_hang, id_phieu_giam_gia } = payload;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("DANH_SACH_SAN_PHAM_RONG");
    }

    if (!id_khach_hang) {
      throw new Error("KHACH_HANG_KHONG_HOP_LE");
    }

    // 1. Tái sử dụng hàm find của chi tiết giỏ hàng để lấy danh sách items kèm thông tin biến thể & giá
    const listChiTietGioHang = await this.chiTietGioHangService.find(
      {
        danh_sach_id: items,
        id_khach_hang: id_khach_hang, // chỉ tìm các chi tiết giỏ hàng của đúng khách hàng hiện tại
      },
      tx,
    );

    // trường hợp số lượng chi tiết giỏ hàng tìm được không đúng bằng số lượng id giỏ hàng trong items
    // => hoặc có id truyền vào không tồn tại trong bảng chi tiết giỏ hàng hoặc chi tiết giỏ hàng tìm được
    // không phải của khách hàng hiện tại
    if (listChiTietGioHang.length !== items.length) {
      throw new Error("DANH_SACH_CHI_TIET_GIO_HANG_KHONG_HOP_LE");
    }

    // 2. Tính tổng tiền gốc và tổng tiền sau khuyến mãi từ danh sách đã qua xử lý
    let tongTienGoc = 0;
    let tongTienSauKM = 0;

    const chiTietDonHang = listChiTietGioHang.map((item) => {
      tongTienGoc += item.gia_goc * item.so_luong || 0;
      tongTienSauKM += item.don_gia_ap_dung * item.so_luong || 0;

      return item;
    });

    const tongTienGiamKm = tongTienGoc - tongTienSauKM;

    // 3. Xử lý kiểm tra và tính toán giảm giá từ Voucher (nếu có)
    let phieuGiamGiaInfo = null;

    if (id_phieu_giam_gia) {
      const phieuKhachHang =
        await this.phieuKhachHangService.kiemTraPhieuGiamGia(
          id_khach_hang,
          id_phieu_giam_gia,
          tongTienSauKM,
          tx,
        );

      phieuGiamGiaInfo = phieuKhachHang.phieu_giam_gia;
    }

    // 4. Gọi helper tính tiền giảm voucher & tiền thanh toán cuối cùng
    const tongTienThanhToan = this.tinhTienGiamVoucher(
      phieuGiamGiaInfo,
      tongTienSauKM,
    );

    // 5. Trả về kết quả xem trước đơn hàng
    return {
      id_khach_hang: id_khach_hang,
      tong_tien_goc: tongTienGoc,
      tong_tien_giam_km: tongTienGiamKm < 0 ? 0 : tongTienGiamKm,
      tong_tien_thanh_toan: tongTienThanhToan,
      phieu_giam_gia: phieuGiamGiaInfo,
      chi_tiet_don_hang: chiTietDonHang,
    };
  }

  // ==================== TẠO ĐƠN HÀNG TỪ GIỎ HÀNG ====================
  async checkout(payload) {
    const { items, ...donHangPayload } = payload;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("DANH_SACH_SAN_PHAM_RONG");
    }

    if (!donHangPayload.id_khach_hang) {
      throw new Error("KHACH_HANG_KHONG_HOP_LE");
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Lấy danh sách các món trong giỏ hàng
      const listChiTietGioHang = await tx.chi_tiet_gio_hang.findMany({
        where: {
          id: { in: items },
          gio_hang: { id_khach_hang: donHangPayload.id_khach_hang },
        },
      });

      if (listChiTietGioHang.length !== items.length) {
        throw new Error("DANH_SACH_CHI_TIET_GIO_HANG_KHONG_HOP_LE");
      }

      // 2. Tạo đơn hàng gốc trước
      const donHang = await this.create(donHangPayload, tx);

      // 3. Khởi tạo ChiTietDonHangService để tạo các item chi tiết
      const ChiTietDonHangService = require("./chi-tiet-don-hang.service");
      const chiTietDonHangService = new ChiTietDonHangService();

      let tongTienSauKM = 0;

      // Lặp tạo từng chi tiết đơn hàng (Logic tính giá KM & trừ tồn kho nằm hoàn toàn trong service này)
      for (const ctgh of listChiTietGioHang) {
        const newChiTiet = await chiTietDonHangService.create(
          {
            id_don_hang: donHang.id,
            id_bien_the: ctgh.id_bien_the,
            so_luong: ctgh.so_luong,
          },
          tx,
        );

        // Tích lũy tổng tiền từ don_gia_ap_dung mà ChiTietDonHangService đã tự tính toán
        tongTienSauKM +=
          Number(newChiTiet.don_gia_ap_dung) * newChiTiet.so_luong;
      }

      // 4. Áp dụng phiếu giảm giá nếu khách hàng có chọn (dựa trên tongTienSauKM chính xác)
      if (donHangPayload.id_phieu_giam_gia) {
        await this.phieuKhachHangService.suDungPhieu(
          donHangPayload.id_khach_hang,
          donHangPayload.id_phieu_giam_gia,
          tongTienSauKM,
          tx,
        );
      }

      // 5. Dọn dẹp các món đã đặt khỏi giỏ hàng
      await tx.chi_tiet_gio_hang.deleteMany({
        where: {
          id: { in: items },
        },
      });

      // 6. Tính lại tổng tiền thực tế cuối cùng của đơn hàng (Đã trừ phiếu giảm giá nếu có)
      await this.recalculateTotal(donHang.id, tx);

      // 7. Trả về thông tin đơn hàng đầy đủ
      return await tx.don_hang.findUnique({
        where: { id: donHang.id },
        include: {
          khach_hang: true,
          phieu_giam_gia: true,
          chi_tiet_don_hang: {
            include: {
              bien_the: true,
            },
          },
        },
      });
    });
  }

  // ============================== 1. Tạo Đơn hàng mới ==================================
  async create(payload, tx) {
    const executeLogic = async (transaction) => {
      // Tự sinh mã đơn hàng nếu chưa truyền id
      if (!payload.id) {
        const lastDonHang = await transaction.don_hang.findFirst({
          orderBy: { id: "desc" },
        });

        const currentNumber = lastDonHang
          ? parseInt(lastDonHang.id.replace(/\D/g, ""), 10) || 0
          : 0;

        payload.id = `DH${String(currentNumber + 1).padStart(2, "0")}`;
      }

      const data = this.extractDonHangData(payload);

      // Tạo đơn hàng
      return await transaction.don_hang.create({
        data: data,
        include: {
          khach_hang: true,
          phieu_giam_gia: true,
        },
      });
    };

    if (tx) {
      return await executeLogic(tx);
    }
    return await prisma.$transaction(async (transaction) => {
      return await executeLogic(transaction);
    });
  }

  // =================== 2. Lấy danh sách Đơn hàng theo bộ lọc =================
  async find(filter) {
    const where = {};

    if (filter.id) {
      where.id = { contains: filter.id };
    }
    if (filter.id_khach_hang) {
      where.id_khach_hang = filter.id_khach_hang;
    }
    if (filter.trang_thai_don_hang) {
      where.trang_thai_don_hang = filter.trang_thai_don_hang;
    }
    if (filter.trang_thai_thanh_toan) {
      where.trang_thai_thanh_toan = filter.trang_thai_thanh_toan;
    }

    return await prisma.don_hang.findMany({
      where: where,
      include: {
        khach_hang: true,
        phieu_giam_gia: true,
        chi_tiet_don_hang: {
          include: {
            bien_the: true,
          },
        },
      },
      orderBy: { ngay_dat: "desc" },
    });
  }

  // ============================== 3. Tìm một Đơn hàng theo ID ==================================
  async findById(id) {
    return await prisma.don_hang.findUnique({
      where: { id: id },
      include: {
        khach_hang: true,
        phieu_giam_gia: true,
      },
    });
  }

  // ============================== 4. Cập nhật Đơn hàng & Tích lũy chi tiêu ==================================
  async update(id, payload) {
    return await prisma.$transaction(async (tx) => {
      // 1. Kiểm tra đơn hàng tồn tại
      const currentOrder = await tx.don_hang.findUnique({
        where: { id: id },
      });

      if (!currentOrder) return null;

      const data = this.extractDonHangData(payload);
      delete data.id; // Không cho phép sửa id
      delete data.tong_tien_thanh_toan;
      delete data.id_nhan_vien;
      delete data.id_khach_hang;
      delete data.id_phieu_giam_gia;

      // 2. Cập nhật thông tin đơn hàng
      const updatedOrder = await tx.don_hang.update({
        where: { id: id },
        data: data,
        include: {
          khach_hang: true,
          phieu_giam_gia: true,
        },
      });

      // 3. LOGIC TÍCH LŨY CHI TIÊU:
      // Kiểm tra nếu trạng thái chuyển sang HOAN_THANH và đơn hàng trước đó chưa HOAN_THANH
      const isCompletingNow =
        updatedOrder.trang_thai_don_hang === "HOAN_THANH" &&
        currentOrder.trang_thai_don_hang !== "HOAN_THANH";

      if (isCompletingNow && updatedOrder.id_khach_hang) {
        await this.khachHangService.updateTongChiTieuAndHang(
          updatedOrder.id_khach_hang,
          updatedOrder.tong_tien_thanh_toan,
          tx, // Truyền transaction context
        );
      }

      return updatedOrder;
    });
  }

  // ============================== 5. Xóa một Đơn hàng ==================================
  async delete(id) {
    const currentOrder = await prisma.don_hang.findUnique({
      where: { id: id },
    });
    if (!currentOrder) return null;

    return await prisma.don_hang.delete({
      where: { id: id },
    });
  }

  // ============================== 6. Xóa tất cả Đơn hàng ==================================
  async deleteAll() {
    const result = await prisma.don_hang.deleteMany({});
    return result.count;
  }

  // ==================== HỦY ĐƠN HÀNG & HOÀN TỒN KHO ====================
  async huyDonHang(idDonHang, payload, tx) {
    const executeLogic = async (transaction) => {
      // 1. Tìm đơn hàng cần hủy
      const donHang = await transaction.don_hang.findUnique({
        where: { id: idDonHang },
        include: {
          chi_tiet_don_hang: true,
        },
      });

      if (!donHang) {
        return null; // Không tìm thấy đơn hàng
      }

      // 2. Kiểm tra trạng thái: Chỉ cho phép hủy khi ở trạng thái "CHO_DUYET"
      if (donHang.trang_thai_don_hang !== "CHO_DUYET") {
        throw new Error("DON_HANG_KHONG_THE_HUY");
      }

      // 3. Hoàn lại số lượng tồn kho cho từng biến thể trong chi tiết đơn
      if (donHang.chi_tiet_don_hang && donHang.chi_tiet_don_hang.length > 0) {
        await Promise.all(
          donHang.chi_tiet_don_hang.map((chiTiet) =>
            this.bienTheService.tangSoLuongTonKho(
              chiTiet.id_bien_the,
              chiTiet.so_luong,
              transaction,
            ),
          ),
        );
      }

      // 4. HOÀN TRẢ PHIẾU GIẢM GIÁ (nếu đơn hàng có sử dụng phiếu)
      if (donHang.id_phieu_giam_gia) {
        await this.phieuKhachHangService.hoanTraPhieu(
          donHang.id_khach_hang,
          donHang.id_phieu_giam_gia,
          transaction,
        );
      }

      // 5. Cập nhật trạng thái đơn hàng thành "DA_HUY"
      const data = this.extractDonHangData(payload || {});
      const updatedDonHang = await transaction.don_hang.update({
        where: { id: idDonHang },
        data: {
          trang_thai_don_hang: "DA_HUY",
          ly_do_huy: data.ly_do_huy || undefined,
        },
        include: {
          chi_tiet_don_hang: true,
        },
      });

      return updatedDonHang;
    };

    try {
      if (tx) {
        return await executeLogic(tx);
      }
      return await prisma.$transaction(async (transaction) => {
        return await executeLogic(transaction);
      });
    } catch (error) {
      console.error("Lỗi khi hủy đơn hàng:", error);
      throw error;
    }
  }
}

module.exports = DonHangService;
