const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class MauSacService {
  // Lọc lấy các trường thuộc tính hợp lệ
  extractMauSacData(payload) {
    const mauSac = {
      id: payload.id,
      ten_mau_sac: payload.ten_mau_sac,
    };
    Object.keys(mauSac).forEach(
      (key) => mauSac[key] === undefined && delete mauSac[key],
    );
    return mauSac;
  }

  // 1. Tạo màu sắc mới (Tự sinh mã MS01, MS02 nếu client không truyền id)
  async create(payload) {
    if (!payload.id) {
      // Tìm 1 màu sắc có ID lớn nhất hiện tại
      const lastMauSac = await prisma.mau_sac.findFirst({
        orderBy: {
          id: "desc", // Sắp xếp ID giảm dần (ví dụ: MS05, MS04, MS03...)
        },
      });

      if (!lastMauSac) {
        // Nếu database chưa có màu sắc nào
        payload.id = "MS01";
      } else {
        // Lấy phần số ra khỏi chuỗi (VD: "MS05" -> lấy số 5)
        const currentNumber =
          parseInt(lastMauSac.id.replace(/\D/g, ""), 10) || 0;
        // Cộng thêm 1 và format lại thành chuỗi MS06
        payload.id = `MS${String(currentNumber + 1).padStart(2, "0")}`;
      }
    }

    const data = this.extractMauSacData(payload);
    try {
      return await prisma.mau_sac.create({
        data: data,
      });
    } catch (error) {
      // Mã P2002 của Prisma đại diện cho lỗi vi phạm ràng buộc UNIQUE (trùng ten_mau_sac hoặc id)
      if (error.code === "P2002") {
        throw new Error("TEN_MAU_SAC_DA_TON_TAI");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm màu sắc theo mã (id) hoặc tên (ten_mau_sac)
  async find(filterData) {
    const where = {};

    // Tìm kiếm chính xác theo mã
    if (filterData.id) {
      where.id = filterData.id;
    }

    // Tìm kiếm gần đúng (chứa từ khóa, không phân biệt hoa thường) theo tên
    if (filterData.ten_mau_sac) {
      where.ten_mau_sac = {
        contains: filterData.ten_mau_sac,
        mode: "insensitive",
      };
    }

    return await prisma.mau_sac.findMany({
      where: where,
    });
  }

  // ==================== Cập nhật thông tin một Màu Sắc dựa trên id ======================
  async update(id, payload) {
    const updateData = this.extractMauSacData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính (id)

    try {
      const result = await prisma.mau_sac.update({
        where: { id: id },
        data: updateData,
      });
      return result;
    } catch (error) {
      // 1. Lỗi không tìm thấy bản ghi cần update => Mã lỗi của Prisma là P2025
      if (error.code === "P2025") {
        return null;
      }
      // 2. Lỗi bị trùng tên màu sắc với bản ghi khác (UNIQUE constraint) => Mã lỗi là P2002
      if (error.code === "P2002") {
        throw new Error("TEN_MAU_SAC_DA_TON_TAI");
      }
      throw error;
    }
  }

  // ======================== Xóa Màu Sắc dựa trên id ==============================
  async delete(id) {
    try {
      const result = await prisma.mau_sac.delete({
        where: { id: id },
      });
      return result;
    } catch (error) {
      // 1. Không tìm thấy bản ghi cần xóa
      if (error.code === "P2025") {
        return null;
      }
      // 2. Lỗi vi phạm khóa ngoại (P2003): Màu sắc này đang được sử dụng ở bảng khác (ví dụ: biến thể)
      if (error.code === "P2003") {
        throw new Error("MAU_SAC_DANG_DUC_SU_DUNG");
      }
      throw error;
    }
  }

  // ====================== Xóa tất cả các Màu Sắc chưa được sử dụng ========================
  async deleteAll() {
    try {
      // Chỉ xóa các màu sắc KHÔNG gắn với biến thể nào (nếu schema đã nối quan hệ bien_the)
      const result = await prisma.mau_sac.deleteMany({
        where: {
          bien_the: {
            none: {},
          },
        },
      });
      return result.count; // Trả về số lượng màu sắc đã bị xóa
    } catch (error) {
      throw error;
    }
  }

  // ==================== Tìm một Màu Sắc dựa trên id ======================
  async findById(id) {
    return await prisma.mau_sac.findUnique({
      where: { id: id },
    });
  }
}

module.exports = MauSacService;
