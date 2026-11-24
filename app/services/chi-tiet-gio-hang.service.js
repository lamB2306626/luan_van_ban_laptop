const prisma = require("../utils/prisma");
const gioHangService = require("./gio-hang.service");
const BienTheService = require("./bien-the.service");

class ChiTietGioHangService {
  constructor() {
    this.gioHangService = new gioHangService();
    this.bienTheService = new BienTheService();
  }

  // Lọc lấy các trường thuộc tính hợp lệ của Chi Tiết Giỏ Hàng
  extractChiTietGioHangData(payload) {
    const chiTietGioHang = {
      id: payload.id,
      id_bien_the: payload.id_bien_the,
      id_gio_hang: payload.id_gio_hang,
      so_luong: payload.so_luong,
    };
    Object.keys(chiTietGioHang).forEach(
      (key) => chiTietGioHang[key] === undefined && delete chiTietGioHang[key],
    );
    return chiTietGioHang;
  }

  // 1. Thêm sản phẩm (biến thể) vào giỏ hàng (Tự sinh mã CTGH01, CTGH02... nếu không truyền id)
  async create(payload) {
    if (!payload.id) {
      // Tìm 1 chi tiết giỏ hàng có ID lớn nhất hiện tại
      const lastChiTiet = await prisma.chi_tiet_gio_hang.findFirst({
        orderBy: {
          id: "desc",
        },
      });

      if (!lastChiTiet) {
        payload.id = "CTGH0001";
      } else {
        const currentNumber =
          parseInt(lastChiTiet.id.replace(/\D/g, ""), 10) || 0;
        payload.id = `CTGH${String(currentNumber + 1).padStart(4, "0")}`;
      }
    }

    const data = this.extractChiTietGioHangData(payload);
    try {
      return await prisma.chi_tiet_gio_hang.create({
        data: data,
        include: {
          gio_hang: true,
          bien_the: true,
        },
      });
    } catch (error) {
      // Lỗi vi phạm khóa ngoại (P2003): id_bien_the hoặc id_gio_hang không tồn tại
      if (error.code === "P2003") {
        throw new Error("GIO_HANG_HOAC_BIEN_THE_KHONG_TON_TAI");
      }
      // Lỗi trùng lặp @@unique([id_gio_hang, id_bien_the])
      if (error.code === "P2002") {
        throw new Error("BIEN_THE_DA_CO_TRONG_GIO_HANG");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm chi tiết giỏ hàng theo bộ lọc (id, id_gio_hang, id_bien_the)
  async find(filterData, tx) {
    const db = tx || prisma;
    const where = {};

    if (filterData.id) {
      where.id = filterData.id;
    }

    if (filterData.id_gio_hang) {
      where.id_gio_hang = filterData.id_gio_hang;
    }

    if (filterData.id_bien_the) {
      where.id_bien_the = filterData.id_bien_the;
    }

    if (filterData.danh_sach_id && Array.isArray(filterData.danh_sach_id)) {
      where.id = { in: filterData.danh_sach_id };
    }

    if (filterData.id_khach_hang) {
      where.gio_hang = { id_khach_hang: filterData.id_khach_hang };
    }

    // 1. Query lấy danh sách chi tiết giỏ hàng gốc
    const listChiTiet = await db.chi_tiet_gio_hang.findMany({
      where: where,
      include: {
        gio_hang: true,
      },
    });

    if (listChiTiet.length === 0) {
      return [];
    }

    // 2. Gom mảng ID các biến thể
    const bienTheIds = [...new Set(listChiTiet.map((ct) => ct.id_bien_the))];

    // 3. Lấy thông tin biến thể đã tính giá khuyến mãi từ BienTheService
    const listBienTheCalculated = await this.bienTheService.find(
      { danh_sach_id: bienTheIds },
      tx,
    );

    const bienTheMap = new Map(listBienTheCalculated.map((bt) => [bt.id, bt]));

    // 4. Map thông tin biến thể và tính thành tiền từng dòng
    return listChiTiet.map((ctgh) => {
      const bienTheInfo = bienTheMap.get(ctgh.id_bien_the) || null;

      if (bienTheInfo) {
        const giaGoc = Number(bienTheInfo.gia) || 0;
        const donGiaApDung = Number(bienTheInfo.don_gia_ap_dung) || 0;

        return {
          ...ctgh,
          gia_goc: giaGoc,
          don_gia_ap_dung: donGiaApDung,
          bien_the: bienTheInfo,
        };
      }

      return {
        ...ctgh,
        gia_goc: 0,
        don_gia_ap_dung: 0,
        bien_the: null,
      };
    });
  }

  // 3. Cập nhật chi tiết giỏ hàng dựa trên id
  async update(id, payload) {
    const updateData = this.extractChiTietGioHangData(payload);
    delete updateData.id; // Không cho phép sửa khóa chính
    delete updateData.id_bien_the;

    try {
      const result = await prisma.chi_tiet_gio_hang.update({
        where: { id: id },
        data: updateData,
        include: {
          gio_hang: true,
          bien_the: true,
        },
      });
      return result;
    } catch (error) {
      if (error.code === "P2025") {
        return null;
      }
      if (error.code === "P2003") {
        throw new Error("GIO_HANG_HOAC_BIEN_THE_KHONG_TON_TAI");
      }
      throw error;
    }
  }

  // 4. Xóa một món khỏi giỏ hàng dựa trên id chi tiết
  async delete(id) {
    try {
      const result = await prisma.chi_tiet_gio_hang.delete({
        where: { id: id },
      });
      return result;
    } catch (error) {
      if (error.code === "P2025") {
        return null;
      }
      throw error;
    }
  }

  // 5. Xóa tất cả sản phẩm trong giỏ hàng (theo id_gio_hang)
  async deleteByGioHangId(idGioHang) {
    const result = await prisma.chi_tiet_gio_hang.deleteMany({
      where: { id_gio_hang: idGioHang },
    });
    return result.count;
  }

  // 6. Tìm một chi tiết giỏ hàng theo id
  async findById(id) {
    return await prisma.chi_tiet_gio_hang.findUnique({
      where: { id: id },
      include: {
        gio_hang: true,
        bien_the: true,
      },
    });
  }

  // ==================== THÊM SẢN PHẨM VÀO GIỎ HÀNG ====================
  async addToCart({
    id_khach_hang,
    id_bien_the,
    so_luong = 1,
    is_buy_now = false,
  }) {
    const MAX_QUANTITY_PER_ITEM = 3;

    const quantityToAdd = parseInt(so_luong, 10);
    if (isNaN(quantityToAdd) || quantityToAdd <= 0) {
      throw new Error("SO_LUONG_KHONG_HOP_LE");
    }

    if (quantityToAdd > MAX_QUANTITY_PER_ITEM) {
      throw new Error("VUOT_QUA_GIOI_HAN_TOI_DA_3_SAN_PHAM");
    }

    // 1. Kiểm tra tồn tại biến thể
    const bienThe = await prisma.bien_the.findUnique({
      where: { id: id_bien_the },
    });

    if (!bienThe) {
      throw new Error("BIEN_THE_KHONG_TON_TAI");
    }

    if (bienThe.so_luong <= 0) {
      throw new Error("VUOT_QUA_SO_LUONG_TON_KHO");
    }

    // Mức trần thực tế được phép mua (nhỏ nhất giữa 3 và tồn kho)
    const maxAllowed = Math.min(MAX_QUANTITY_PER_ITEM, bienThe.so_luong);

    if (!is_buy_now && quantityToAdd > bienThe.so_luong) {
      throw new Error("VUOT_QUA_SO_LUONG_TON_KHO");
    }

    // 2. Tìm hoặc tạo giỏ hàng
    let gioHang = await this.gioHangService.findByKhachHangId(id_khach_hang);
    if (!gioHang) {
      gioHang = await this.gioHangService.create({
        id_khach_hang: id_khach_hang,
      });
    }

    // 3. Kiểm tra chi tiết giỏ hàng hiện tại
    const chiTietHienTai = await prisma.chi_tiet_gio_hang.findFirst({
      where: {
        id_gio_hang: gioHang.id,
        id_bien_the: id_bien_the,
      },
    });

    if (chiTietHienTai) {
      let tongSoLuongMoi = chiTietHienTai.so_luong + quantityToAdd;

      if (is_buy_now) {
        // NẾU LÀ MUA NGAY: Chạm trần thì tự động kẹp về mức tối đa (maxAllowed)
        if (tongSoLuongMoi > maxAllowed) {
          tongSoLuongMoi = maxAllowed;
        }
      } else {
        // NẾU THÊM GIỎ BÌNH THƯỜNG: Vượt trần thì báo lỗi như cũ
        if (tongSoLuongMoi > MAX_QUANTITY_PER_ITEM) {
          const err = new Error(
            "SAU_KHI_THEM_VUOT_QUA_GIOI_HAN_TOI_DA_3_SAN_PHAM",
          );
          err.currentInCart = chiTietHienTai.so_luong;
          throw err;
        }

        if (tongSoLuongMoi > bienThe.so_luong) {
          const err = new Error("SAU_KHI_THEM_VUOT_QUA_SO_LUONG_TON_KHO");
          err.currentInCart = chiTietHienTai.so_luong;
          err.stockAvailable = bienThe.so_luong;
          throw err;
        }
      }

      return await this.update(chiTietHienTai.id, {
        so_luong: tongSoLuongMoi,
      });
    } else {
      // Nếu chưa có trong giỏ: Với Mua ngay thì cũng kẹp sẵn nếu quantityToAdd > maxAllowed
      const finalQuantity = is_buy_now
        ? Math.min(quantityToAdd, maxAllowed)
        : quantityToAdd;

      return await this.create({
        id_gio_hang: gioHang.id,
        id_bien_the: id_bien_the,
        so_luong: finalQuantity,
      });
    }
  }

  // Kiểm tra và lấy danh sách chi tiết giỏ hàng thuộc về đúng khách hàng
  async findValidItemsForCustomer(items, idKhachHang, tx) {
    const prismaClient = prisma;

    const listItems = await prismaClient.chi_tiet_gio_hang.findMany({
      where: {
        id: {
          in: items,
        },
        gio_hang: {
          id_khach_hang: idKhachHang,
        },
      },
    });

    // So sánh số lượng tìm thấy với số lượng ID gửi lên
    if (listItems.length !== items.length) {
      throw new Error("DANH_SACH_CHI_TIET_GIO_HANG_KHONG_HOP_LE");
    }

    return listItems;
  }
}

module.exports = ChiTietGioHangService;
