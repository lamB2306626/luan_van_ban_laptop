const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class VaiTroService {
  // Lọc lấy các trường thuộc tính hợp lệ
  extractVaiTroData(payload) {
    const vaiTro = {
      id: payload.id,
      ten_vai_tro: payload.ten_vai_tro,
    };
    Object.keys(vaiTro).forEach(
      (key) => vaiTro[key] === undefined && delete vaiTro[key],
    );
    return vaiTro;
  }

  // 1. Tạo Vai Trò mới (Tự sinh mã VT01, VT02 nếu client không truyền id)
  async create(payload) {
    if (!payload.id) {
      // Tìm 1 Vai Trò có ID lớn nhất hiện tại
      const lastVaiTro = await prisma.vai_tro.findFirst({
        orderBy: {
          id: "desc", // Sắp xếp ID giảm dần (ví dụ: VT05, VT04, VT03...)
        },
      });

      if (!lastVaiTro) {
        // Nếu database chưa có Vai Trò nào
        payload.id = "VT01";
      } else {
        // Lấy phần số ra khỏi chuỗi (VD: "VT05" -> lấy số 5)
        const currentNumber =
          parseInt(lastVaiTro.id.replace(/\D/g, ""), 10) || 0;
        // Cộng thêm 1 và format lại thành chuỗi VT06
        payload.id = `VT${String(currentNumber + 1).padStart(2, "0")}`;
      }
    }

    const data = this.extractVaiTroData(payload);
    try {
      return await prisma.vai_tro.create({
        data: data,
      });
    } catch (error) {
      // Mã P2002 của Prisma đại diện cho lỗi vi phạm ràng buộc UNIQUE
      if (error.code === "P2002") {
        throw new Error("TEN_VAI_TRO_DA_TON_TAI");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm Vai Trò theo mã (id) hoặc tên (ten_vai_tro)
  async find(filterData) {
    const where = {};

    // Tìm kiếm chính xác theo mã
    if (filterData.id) {
      where.id = filterData.id;
    }

    // Tìm kiếm gần đúng (chứa từ khóa, không phân biệt hoa thường) theo tên
    if (filterData.ten_vai_tro) {
      where.ten_vai_tro = {
        contains: filterData.ten_vai_tro,
        mode: "insensitive",
      };
    }

    return await prisma.vai_tro.findMany({
      where: where,
    });
  }

  // ==================== Cập nhật thông tin một Vai Trò dựa trên id ======================
  async update(id, payload) {
    const updateData = this.extractVaiTroData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính (id)

    try {
      const result = await prisma.vai_tro.update({
        where: { id: id },
        data: updateData,
      });
      return result;
    } catch (error) {
      // 1. Lỗi không tìm thấy bản ghi cần update => Mã lỗi của Prisma là P2025
      if (error.code === "P2025") {
        return null;
      }
      // 2. Lỗi bị trùng tên Vai Trò với bản ghi khác (UNIQUE constraint) => Mã lỗi là P2002
      if (error.code === "P2002") {
        throw new Error("TEN_VAI_TRO_DA_TON_TAI");
      }
      throw error;
    }
  }

  // ======================== Xóa Vai Trò dựa trên id ==============================
  async delete(id) {
    try {
      const result = await prisma.vai_tro.delete({
        where: { id: id },
      });
      return result;
    } catch (error) {
      // 1. Không tìm thấy bản ghi cần xóa
      if (error.code === "P2025") {
        return null;
      }
      // 2. Lỗi vi phạm khóa ngoại (P2003): Vai trò đang có Nhân viên sử dụng
      if (error.code === "P2003") {
        throw new Error("VAI_TRO_DANG_CO_NHAN_VIEN");
      }
      throw error;
    }
  }

  // ====================== Xóa tất cả các Vai Trò chưa có Nhân Viên ========================
  async deleteAll() {
    try {
      // Chỉ xóa các vai trò KHÔNG chứa nhân viên nào (nhan_vien: { none: {} })
      const result = await prisma.vai_tro.deleteMany({
        where: {
          nhan_vien: {
            none: {},
          },
        },
      });
      return result.count; // Trả về số lượng vai trò hợp lệ đã bị xóa
    } catch (error) {
      throw error;
    }
  }

  // ==================== Tìm một Vai Trò dựa trên id ======================
  async findById(id) {
    return await prisma.vai_tro.findUnique({
      where: { id: id },
    });
  }
}

module.exports = VaiTroService;
