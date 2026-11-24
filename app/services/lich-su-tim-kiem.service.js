const prisma = require("../utils/prisma");

class LichSuTimKiemService {
  // Lọc lấy các trường thuộc tính hợp lệ của lịch sử tìm kiếm
  extractLichSuTimKiemData(payload) {
    const lichSu = {
      id: payload.id,
      tu_khoa: payload.tu_khoa,
      gia_tu: payload.gia_tu,
      gia_den: payload.gia_den,
      loai_tim_kiem: payload.loai_tim_kiem,
      thoi_gian_tim: payload.thoi_gian_tim,
      id_khach_hang: payload.id_khach_hang,
    };
    Object.keys(lichSu).forEach(
      (key) => lichSu[key] === undefined && delete lichSu[key],
    );
    return lichSu;
  }

  // 1. Tạo mới lịch sử tìm kiếm (Tự sinh mã LSTK01, LSTK02... nếu chưa có)
  async create(payload) {
    // Trường hợp 1: Client truyền lên một mảng danh sách các tìm kiếm (danhSachTimKiem)
    if (Array.isArray(payload.danh_sach) && payload.danh_sach.length > 0) {
      if (!payload.id_khach_hang) {
        throw new Error("THIEU_THONG_TIN_KHACH_HANG");
      }

      // Lấy mã ID lớn nhất hiện tại trong database để bắt đầu tự sinh tiếp
      const lastRecord = await prisma.lich_su_tim_kiem.findFirst({
        orderBy: { id: "desc" },
      });

      let currentNumber = 0;
      if (lastRecord) {
        currentNumber = parseInt(lastRecord.id.replace(/\D/g, ""), 10) || 0;
      }

      // Chuẩn bị dữ liệu cho lệnh createMany
      const dataToCreate = payload.danh_sach.map((item, index) => {
        currentNumber += 1;
        const newId = `LSTK${String(currentNumber).padStart(4, "0")}`;

        return {
          id: newId,
          tu_khoa: item.tu_khoa,
          gia_tu: item.gia_tu,
          gia_den: item.gia_den,
          loai_tim_kiem: item.loai_tim_kiem,
          id_khach_hang: payload.id_khach_hang,
          thoi_gian_tim: new Date(),
        };
      });

      try {
        const result = await prisma.lich_su_tim_kiem.createMany({
          data: dataToCreate,
          skipDuplicates: true, // Bỏ qua nếu có lỗi trùng lặp ID
        });
        return {
          count: result.count,
          message: "Tạo hàng loạt lịch sử tìm kiếm thành công",
        };
      } catch (error) {
        if (error.code === "P2003") {
          throw new Error("ID_KHACH_HANG_KHONG_TON_TAI");
        }
        throw error;
      }
    }

    // Trường hợp 2: Client truyền lên tạo đơn lẻ (như cũ)
    if (!payload.id_khach_hang || !payload.tu_khoa) {
      throw new Error("THIEU_THONG_TIN_KHACH_HANG_HOAC_TU_KHOA");
    }

    if (!payload.id) {
      const lastRecord = await prisma.lich_su_tim_kiem.findFirst({
        orderBy: { id: "desc" },
      });

      if (!lastRecord) {
        payload.id = "LSTK0001";
      } else {
        const currentNumber =
          parseInt(lastRecord.id.replace(/\D/g, ""), 10) || 0;
        payload.id = `LSTK${String(currentNumber + 1).padStart(4, "0")}`;
      }
    }

    const data = this.extractLichSuTimKiemData(payload);
    try {
      return await prisma.lich_su_tim_kiem.create({
        data: data,
      });
    } catch (error) {
      if (error.code === "P2003") {
        throw new Error("ID_KHACH_HANG_KHONG_TON_TAI");
      }
      if (error.code === "P2002") {
        throw new Error("LICH_SU_TIM_KIEM_DA_TON_TAI");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm lịch sử tìm kiếm theo id, id_khach_hang, loai_tim_kiem hoặc từ khóa
  async find(filterData) {
    const where = {};

    if (filterData.id) {
      where.id = filterData.id;
    }

    if (filterData.id_khach_hang) {
      where.id_khach_hang = filterData.id_khach_hang;
    }

    if (filterData.loai_tim_kiem) {
      where.loai_tim_kiem = filterData.loai_tim_kiem;
    }

    if (filterData.tu_khoa) {
      where.tu_khoa = {
        contains: filterData.tu_khoa,
        mode: "insensitive",
      };
    }

    return await prisma.lich_su_tim_kiem.findMany({
      where: where,
      orderBy: {
        thoi_gian_tim: "desc", // Ưu tiên hiển thị lịch sử tìm kiếm gần nhất lên đầu
      },
      include: {
        khach_hang: true, // Lấy kèm thông tin khách hàng nếu cần
      },
    });
  }

  // ==================== Cập nhật thông tin lịch sử tìm kiếm dựa trên id ======================
  async update(id, payload) {
    const updateData = this.extractLichSuTimKiemData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính (id)

    try {
      const result = await prisma.lich_su_tim_kiem.update({
        where: { id: id },
        data: updateData,
      });
      return result;
    } catch (error) {
      if (error.code === "P2025") {
        return null; // Không tìm thấy bản ghi cần update
      }
      if (error.code === "P2002") {
        throw new Error("LICH_SU_TIM_KIEM_BI_TRUNG");
      }
      throw error;
    }
  }

  // ======================== Xóa một bản ghi lịch sử tìm kiếm dựa trên id ==============================
  async delete(id) {
    try {
      const result = await prisma.lich_su_tim_kiem.delete({
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

  // ====================== Xóa tất cả lịch sử tìm kiếm (có thể lọc theo khách hàng) ========================
  async deleteAll(filterData = {}) {
    try {
      const where = {};
      if (filterData.id_khach_hang) {
        where.id_khach_hang = filterData.id_khach_hang;
      }

      const result = await prisma.lich_su_tim_kiem.deleteMany({
        where: where,
      });
      return result.count; // Trả về tổng số bản ghi lịch sử tìm kiếm đã bị xóa
    } catch (error) {
      throw error;
    }
  }

  // ==================== Tìm một bản ghi lịch sử tìm kiếm dựa trên id ======================
  async findById(id) {
    return await prisma.lich_su_tim_kiem.findUnique({
      where: { id: id },
      include: {
        khach_hang: true,
      },
    });
  }
}

module.exports = LichSuTimKiemService;
