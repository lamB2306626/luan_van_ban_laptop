const prisma = require("../utils/prisma");

class LichSuXemService {
  // Lọc lấy các trường thuộc tính hợp lệ của lịch sử xem
  extractLichSuXemData(payload) {
    const lichSu = {
      id: payload.id,
      thoi_gian_xem: payload.thoi_gian_xem,
      id_san_pham: payload.id_san_pham,
      id_khach_hang: payload.id_khach_hang,
    };
    Object.keys(lichSu).forEach(
      (key) => lichSu[key] === undefined && delete lichSu[key],
    );
    return lichSu;
  }

  // 1. Tạo mới hoặc cập nhật lịch sử xem (Tự sinh mã LS01, LS02... nếu chưa có)
  async create(payload) {
    if (!payload.id_khach_hang || !payload.id_san_pham) {
      throw new Error("THIEU_THONG_TIN_KHACH_HANG_HOAC_SAN_PHAM");
    }

    // Nếu CHƯA XEM -> Tạo mới hoàn toàn (có tự sinh mã ID nếu client không truyền)
    if (!payload.id) {
      const lastRecord = await prisma.lich_su_xem.findFirst({
        orderBy: {
          id: "desc", // Sắp xếp ID giảm dần (ví dụ: LS05, LS04...)
        },
      });

      if (!lastRecord) {
        payload.id = "LSX0001";
      } else {
        const currentNumber =
          parseInt(lastRecord.id.replace(/\D/g, ""), 10) || 0;
        payload.id = `LSX${String(currentNumber + 1).padStart(4, "0")}`;
      }
    }

    const data = this.extractLichSuXemData(payload);
    try {
      return await prisma.lich_su_xem.create({
        data: data,
      });
    } catch (error) {
      if (error.code === "P2003") {
        const fieldName = error.meta?.field_name || "";
        if (fieldName.includes("id_khach_hang")) {
          throw new Error("ID_KHACH_HANG_KHONG_TON_TAI");
        }
        if (fieldName.includes("id_san_pham")) {
          throw new Error("ID_SAN_PHAM_KHONG_TON_TAI");
        }
        throw new Error("KHOA_NGOAI_KHONG_TON_TAI");
      }
      if (error.code === "P2002") {
        throw new Error("LICH_SU_XEM_DA_TON_TAI");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm lịch sử xem theo id, id_khach_hang hoặc id_san_pham
  async find(filterData) {
    const where = {};

    if (filterData.id) {
      where.id = filterData.id;
    }

    if (filterData.id_khach_hang) {
      where.id_khach_hang = filterData.id_khach_hang;
    }

    if (filterData.id_san_pham) {
      where.id_san_pham = filterData.id_san_pham;
    }

    return await prisma.lich_su_xem.findMany({
      where: where,
      orderBy: {
        thoi_gian_xem: "desc", // Mặc định ưu tiên hiển thị cái mới xem gần nhất lên đầu
      },
      include: {
        san_pham: true, // Lấy kèm thông tin sản phẩm nếu cần hiển thị ra giao diện Vue
      },
    });
  }

  // ==================== Cập nhật thông tin lịch sử xem dựa trên id ======================
  async update(id, payload) {
    const updateData = this.extractLichSuXemData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính (id)

    try {
      const result = await prisma.lich_su_xem.update({
        where: { id: id },
        data: updateData,
      });
      return result;
    } catch (error) {
      if (error.code === "P2025") {
        return null; // Không tìm thấy bản ghi cần update
      }
      if (error.code === "P2002") {
        throw new Error("LICH_SU_XEM_BI_TRUNG");
      }
      throw error;
    }
  }

  // ======================== Xóa một bản ghi lịch sử xem dựa trên id ==============================
  async delete(id) {
    try {
      const result = await prisma.lich_su_xem.delete({
        where: { id: id },
      });
      return result;
    } catch (error) {
      if (error.code === "P2025") {
        return null; // Không tìm thấy bản ghi cần xóa
      }
      throw error;
    }
  }

  // ====================== Xóa tất cả lịch sử xem (có thể lọc theo khách hàng nếu muốn) ========================
  async deleteAll(filterData = {}) {
    try {
      const where = {};
      if (filterData.id_khach_hang) {
        where.id_khach_hang = filterData.id_khach_hang;
      }

      const result = await prisma.lich_su_xem.deleteMany({
        where: where,
      });
      return result.count; // Trả về tổng số bản ghi lịch sử đã bị xóa
    } catch (error) {
      throw error;
    }
  }

  // ==================== Tìm một bản ghi lịch sử xem dựa trên id ======================
  async findById(id) {
    return await prisma.lich_su_xem.findUnique({
      where: { id: id },
      include: {
        san_pham: true,
        khach_hang: true,
      },
    });
  }
}

module.exports = LichSuXemService;
