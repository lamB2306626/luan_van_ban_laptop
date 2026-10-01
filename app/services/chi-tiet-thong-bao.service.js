const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class ChiTietThongBaoService {
  // Lọc lấy các trường thuộc tính hợp lệ của Chi tiết thông báo
  extractChiTietThongBaoData(payload) {
    const chiTiet = {
      id: payload.id,
      id_thong_bao: payload.id_thong_bao,
      id_khach_hang: payload.id_khach_hang,
      ngay_tao: payload.ngay_tao,
      da_doc: payload.da_doc,
    };
    Object.keys(chiTiet).forEach(
      (key) => chiTiet[key] === undefined && delete chiTiet[key],
    );
    return chiTiet;
  }

  // Helper tự sinh mã id tiếp theo (CTTB01, CTTB02...)
  async generateNextId(tx = prisma) {
    const lastRecord = await tx.chi_tiet_thong_bao.findFirst({
      orderBy: { id: "desc" },
    });

    if (!lastRecord) return "CTTB01";
    const currentNumber = parseInt(lastRecord.id.replace(/\D/g, ""), 10) || 0;
    return `CTTB${String(currentNumber + 1).padStart(2, "0")}`;
  }

  // ==================== 1. Phân phối Thông báo cho Khách hàng (Thêm mới chi tiết thông báo) ====================
  // chi-tiet-thong-bao.service.js

  async create(payload, tx) {
    const db = tx || prisma; // Ưu tiên dùng tx truyền vào

    // Trường hợp 1: Gửi cho danh sách nhiều khách hàng cùng lúc
    if (
      Array.isArray(payload.danh_sach_id_khach_hang) &&
      payload.danh_sach_id_khach_hang.length > 0
    ) {
      // Tìm chi tiết thông báo có id lớn nhất hiện tại TRONG TRANSACTION HIỆN TẠI (db)
      const lastRecord = await db.chi_tiet_thong_bao.findFirst({
        orderBy: { id: "desc" },
      });

      let startNum = lastRecord
        ? parseInt(lastRecord.id.replace(/\D/g, ""), 10) || 0
        : 0;

      const records = payload.danh_sach_id_khach_hang.map((idKhachHang) => {
        startNum += 1;
        return {
          id: `CTTB${String(startNum).padStart(2, "0")}`,
          id_thong_bao: payload.id_thong_bao,
          id_khach_hang: idKhachHang,
        };
      });

      try {
        const result = await db.chi_tiet_thong_bao.createMany({
          data: records,
          skipDuplicates: true,
        });

        if (result.count === 0) {
          throw new Error("TAT_CA_THONG_BAO_DA_DUOC_GUI_TRUOC_DO");
        }
        return { totalCreated: result.count };
      } catch (error) {
        if (error.code === "P2003") {
          throw new Error("THONG_BAO_HOAC_KHACH_HANG_KHONG_TON_TAI");
        }
        throw error;
      }
    }

    // Trường hợp 2: Gửi cho 1 khách hàng cụ thể (mã lẻ)
    if (!payload.id) {
      payload.id = await this.generateNextId(db); // Nhớ truyền db vào đây luôn nếu generateNextId dùng query
    }
    const data = this.extractChiTietThongBaoData(payload);
    try {
      return await db.chi_tiet_thong_bao.create({
        data,
        include: {
          thong_bao: true,
          khach_hang: true,
        },
      });
    } catch (error) {
      if (error.code === "P2003") {
        throw new Error("THONG_BAO_HOAC_KHACH_HANG_KHONG_TON_TAI");
      }
      if (error.code === "P2002") {
        throw new Error("THONG_BAO_DA_DUOC_GUI_CHO_KHACH_HANG_NAY");
      }
      throw error;
    }
  }

  // ==================== 2. Lấy danh sách Chi tiết thông báo (Kết hợp bộ lọc) ====================
  async find(filterData) {
    const where = {};

    if (filterData.id) where.id = filterData.id;
    if (filterData.id_thong_bao) where.id_thong_bao = filterData.id_thong_bao;
    if (filterData.id_khach_hang)
      where.id_khach_hang = filterData.id_khach_hang;
    if (filterData.da_doc !== undefined) where.da_doc = filterData.da_doc;

    return await prisma.chi_tiet_thong_bao.findMany({
      where,
      include: {
        thong_bao: true,
        khach_hang: true,
      },
      orderBy: {
        ngay_tao: "desc",
      },
    });
  }

  // ==================== 3. Cập nhật trạng thái/thông tin chi tiết ====================
  async update(id, payload) {
    const updateData = this.extractChiTietThongBaoData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính

    try {
      return await prisma.chi_tiet_thong_bao.update({
        where: { id },
        data: updateData,
        include: {
          thong_bao: true,
        },
      });
    } catch (error) {
      if (error.code === "P2025") return null;
      if (error.code === "P2003") {
        throw new Error("THONG_BAO_HOAC_KHACH_HANG_KHONG_TON_TAI");
      }
      throw error;
    }
  }

  // ==================== 4. Xóa một bản ghi Chi tiết thông báo ====================
  async delete(id) {
    try {
      return await prisma.chi_tiet_thong_bao.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === "P2025") return null;
      throw error;
    }
  }

  // ==================== 5. Xóa tất cả Chi tiết thông báo ====================
  async deleteAll() {
    const result = await prisma.chi_tiet_thong_bao.deleteMany({});
    return result.count;
  }

  // ==================== 6. Tìm một Chi tiết thông báo theo id ====================
  async findById(id) {
    return await prisma.chi_tiet_thong_bao.findUnique({
      where: { id },
      include: {
        thong_bao: true,
        khach_hang: true,
      },
    });
  }

  // ==================== 7. Đánh dấu tất cả thông báo của 1 Khách hàng là ĐÃ ĐỌC ====================
  async markAllAsRead(id_khach_hang) {
    const result = await prisma.chi_tiet_thong_bao.updateMany({
      where: {
        id_khach_hang,
        da_doc: false,
      },
      data: {
        da_doc: true,
      },
    });
    return result.count;
  }

  // ==================== 8. Đếm số lượng thông báo CHƯA ĐỌC của Khách hàng ====================
  async countUnread(id_khach_hang) {
    return await prisma.chi_tiet_thong_bao.count({
      where: {
        id_khach_hang,
        da_doc: false,
      },
    });
  }
}

module.exports = ChiTietThongBaoService;
