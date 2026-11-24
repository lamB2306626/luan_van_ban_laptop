const prisma = require("../utils/prisma");
const DonHangService = require("./don-hang.service");
const BienTheService = require("./bien-the.service");

class ChiTietDonHangService {
  constructor() {
    this.donHangService = new DonHangService();
    this.bienTheService = new BienTheService();
  }

  // Lọc lấy các trường thuộc tính hợp lệ
  extractChiTietDonHangData(payload) {
    const chiTiet = {
      id: payload.id,
      id_don_hang: payload.id_don_hang,
      id_bien_the: payload.id_bien_the,
      so_luong:
        payload.so_luong !== undefined ? Number(payload.so_luong) : undefined,
      gia_goc: Number(payload.gia_goc),
      don_gia_ap_dung: Number(payload.don_gia_ap_dung),
    };

    Object.keys(chiTiet).forEach(
      (key) => chiTiet[key] === undefined && delete chiTiet[key],
    );
    return chiTiet;
  }

  // 1. Tạo chi tiết đơn hàng mới (Tự sinh mã CTDH01, CTDH02 nếu client không truyền id)
  async create(payload, tx) {
    const executeLogic = async (transaction) => {
      const now = new Date();

      // Query lấy biến thể kèm theo đợt khuyến mãi còn hiệu lực
      const bienThe = await this.bienTheService.findById(
        payload.id_bien_the,
        transaction,
      );

      if (!bienThe) {
        throw new Error("DON_HANG_HOAC_BIEN_THE_KHONG_TON_TAI");
      }

      const soLuongDat = Number(payload.so_luong) || 0;
      const MAX_QUANTITY_PER_ITEM = 3;

      if (soLuongDat > MAX_QUANTITY_PER_ITEM) {
        throw new Error("VUOT_QUA_GIOI_HAN_TOI_DA_3_SAN_PHAM");
      }

      if (soLuongDat > bienThe.so_luong) {
        throw new Error("SO_LUONG_TON_KHO_KHONG_DU");
      }

      // Gán 2 thông số giá vào payload trước khi lưu
      payload.gia_goc = bienThe.gia;
      payload.don_gia_ap_dung = bienThe.don_gia_ap_dung;

      // Tự sinh ID nếu client không truyền
      if (!payload.id) {
        const lastRecord = await transaction.chi_tiet_don_hang.findFirst({
          orderBy: { id: "desc" },
        });

        const currentNumber = lastRecord
          ? parseInt(lastRecord.id.replace(/\D/g, ""), 10) || 0
          : 0;

        payload.id = `CTDH${String(currentNumber + 1).padStart(4, "0")}`;
      }

      const data = this.extractChiTietDonHangData(payload);

      // ======================= TRỪ TỒN KHO BIẾN THỂ ===============================
      await this.bienTheService.giamSoLuongTonKho(
        payload.id_bien_the,
        soLuongDat,
        transaction,
      );

      // ======================= TẠO CHI TIẾT ĐƠN HÀNG MỚI =======================
      const newChiTiet = await transaction.chi_tiet_don_hang.create({
        data: data,
        include: {
          don_hang: true,
          bien_the: true,
        },
      });

      //======================= CẬP NHẬT LẠI TỔNG TIỀN ĐƠN HÀNG =======================
      await this.donHangService.recalculateTotal(
        payload.id_don_hang,
        transaction,
      );

      return newChiTiet;
    };

    try {
      if (tx) {
        return await executeLogic(tx);
      }
      return await prisma.$transaction(async (transaction) => {
        return await executeLogic(transaction);
      });
    } catch (error) {
      if (error.code === "P2002") {
        throw new Error("BIEN_THE_DA_TON_TAI_TRONG_DON_HANG");
      }
      if (error.code === "P2003") {
        throw new Error("DON_HANG_HOAC_BIEN_THE_KHONG_TON_TAI");
      }
      throw error;
    }
  }

  // ==================== Cập nhật thông tin một Chi Tiết Đơn Hàng ======================
  async update(id, payload, tx) {
    const db = tx || prisma;

    // Nếu có cập nhật lại id_bien_the mới -> Truy vấn lấy lại giá của biến thể mới đó
    if (payload.id_bien_the) {
      const bienThe = await db.bien_the.findUnique({
        where: { id: payload.id_bien_the },
      });

      if (!bienThe) {
        throw new Error("DON_HANG_HOAC_BIEN_THE_KHONG_TON_TAI");
      }

      // Tự động cập nhật lại đơn giá mới tương ứng với biến thể mới
      payload.gia_goc = bienThe.gia;
    }

    const updateData = this.extractChiTietDonHangData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính (id)

    try {
      const result = await db.chi_tiet_don_hang.update({
        where: { id: id },
        data: updateData,
        include: {
          don_hang: true,
          bien_the: true,
        },
      });
      return result;
    } catch (error) {
      if (error.code === "P2025") {
        return null;
      }
      if (error.code === "P2002") {
        throw new Error("BIEN_THE_DA_TON_TAI_TRONG_DON_HANG");
      }
      if (error.code === "P2003") {
        throw new Error("DON_HANG_HOAC_BIEN_THE_KHONG_TON_TAI");
      }
      throw error;
    }
  }

  // ======================== Xóa Chi Tiết Đơn Hàng dựa trên id ==============================
  async delete(id, tx) {
    const db = tx || prisma;
    try {
      const result = await db.chi_tiet_don_hang.delete({
        where: { id: id },
      });
      return result;
    } catch (error) {
      // Không tìm thấy bản ghi cần xóa
      if (error.code === "P2025") {
        return null;
      }
      throw error;
    }
  }

  // ====================== Xóa tất cả Chi Tiết Đơn Hàng ========================
  async deleteAll() {
    try {
      const result = await prisma.chi_tiet_don_hang.deleteMany({});
      return result.count; // Trả về số lượng bản ghi đã bị xóa
    } catch (error) {
      throw error;
    }
  }

  // ==================== Tìm một Chi Tiết Đơn Hàng dựa trên id ======================
  async findById(id) {
    return await prisma.chi_tiet_don_hang.findUnique({
      where: { id: id },
      include: {
        don_hang: true,
        bien_the: true,
      },
    });
  }

  // Lấy thống kê số lượt mua và tổng số lượng sản phẩm bán ra
  async getThongKeLuotMua(idSanPhams) {
    if (!idSanPhams || (Array.isArray(idSanPhams) && idSanPhams.length === 0)) {
      return Array.isArray(idSanPhams)
        ? new Map()
        : { tong_so_luot_mua: 0, tong_so_luong_ban: 0 };
    }

    // Trường hợp 1: Truyền vào mảng các ID sản phẩm (dùng cho hàm find hoặc gợi ý)
    if (Array.isArray(idSanPhams)) {
      // Truy vấn tất cả chi tiết đơn hàng mà biến thể thuộc các sản phẩm trong mảng idSanPhams
      const listChiTiet = await prisma.chi_tiet_don_hang.findMany({
        where: {
          bien_the: {
            id_san_pham: { in: idSanPhams },
          },
        },
        include: {
          bien_the: {
            select: { id_san_pham: true },
          },
        },
      });

      // Map lưu kết quả thống kê theo từng id_san_pham
      const thongKeMap = new Map();

      listChiTiet.forEach((item) => {
        const idSanPham = item.bien_the?.id_san_pham;
        if (!idSanPham) return;

        if (!thongKeMap.has(idSanPham)) {
          thongKeMap.set(idSanPham, {
            tong_so_luot_mua: 0, // Số lần sản phẩm xuất hiện trong các chi tiết đơn hàng
            tong_so_luong_ban: 0, // Tổng số lượng sản phẩm cộng dồn (so_luong)
          });
        }

        const stats = thongKeMap.get(idSanPham);
        stats.tong_so_luot_mua += 1;
        stats.tong_so_luong_ban += item.so_luong || 0;
      });

      return thongKeMap;
    }

    // Trường hợp 2: Truyền vào 1 ID duy nhất (dùng cho trang chi tiết sản phẩm)
    const listChiTietDon = await prisma.chi_tiet_don_hang.findMany({
      where: {
        bien_the: {
          id_san_pham: idSanPhams,
        },
      },
    });

    const tong_so_luot_mua = listChiTietDon.length;
    const tong_so_luong_ban = listChiTietDon.reduce(
      (sum, item) => sum + (item.so_luong || 0),
      0,
    );

    return {
      tong_so_luot_mua: tong_so_luot_mua || 0,
      tong_so_luong_ban: tong_so_luong_ban || 0,
    };
  }
}

module.exports = ChiTietDonHangService;
