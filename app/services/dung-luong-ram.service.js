const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class DungLuongRamService {
  // Lọc lấy các trường thuộc tính hợp lệ
  extractRamData(payload) {
    const ram = {
      id: payload.id,
      dung_luong_ram: payload.dung_luong_ram,
    };
    Object.keys(ram).forEach(
      (key) => ram[key] === undefined && delete ram[key],
    );
    return ram;
  }

  // 1. Tạo Dung Lượng RAM mới (Tự sinh mã RAM01, RAM02 nếu client không truyền id)
  async create(payload) {
    if (!payload.id) {
      // Tìm 1 RAM có ID lớn nhất hiện tại
      const lastRam = await prisma.dung_luong_ram.findFirst({
        orderBy: {
          id: "desc", // Sắp xếp ID giảm dần (ví dụ: RAM05, RAM04, RAM03...)
        },
      });

      if (!lastRam) {
        // Nếu database chưa có bản ghi RAM nào
        payload.id = "RAM01";
      } else {
        // Lấy phần số ra khỏi chuỗi (VD: "RAM05" -> lấy số 5)
        const currentNumber = parseInt(lastRam.id.replace(/\D/g, ""), 10) || 0;
        // Cộng thêm 1 và format lại thành chuỗi RAM06
        payload.id = `RAM${String(currentNumber + 1).padStart(2, "0")}`;
      }
    }

    const data = this.extractRamData(payload);
    try {
      return await prisma.dung_luong_ram.create({
        data: data,
      });
    } catch (error) {
      // Mã P2002 của Prisma đại diện cho lỗi vi phạm ràng buộc UNIQUE (trùng dung_luong_ram hoặc id)
      if (error.code === "P2002") {
        throw new Error("DUNG_LUONG_RAM_DA_TON_TAI");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm Dung Lượng RAM theo mã (id) hoặc giá trị (dung_luong_ram)
  async find(filterData) {
    const where = {};

    // Tìm kiếm chính xác theo mã
    if (filterData.id) {
      where.id = filterData.id;
    }

    // Tìm kiếm gần đúng (chứa từ khóa, không phân biệt hoa thường)
    if (filterData.dung_luong_ram) {
      where.dung_luong_ram = {
        contains: filterData.dung_luong_ram,
        mode: "insensitive",
      };
    }

    return await prisma.dung_luong_ram.findMany({
      where: where,
    });
  }

  // ==================== Cập nhật thông tin một Dung Lượng RAM dựa trên id ======================
  async update(id, payload) {
    const updateData = this.extractRamData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính (id)

    try {
      const result = await prisma.dung_luong_ram.update({
        where: { id: id },
        data: updateData,
      });
      return result;
    } catch (error) {
      // 1. Lỗi không tìm thấy bản ghi cần update => Mã lỗi của Prisma là P2025
      if (error.code === "P2025") {
        return null;
      }
      // 2. Lỗi bị trùng dung lượng RAM với bản ghi khác (UNIQUE constraint) => Mã lỗi là P2002
      if (error.code === "P2002") {
        throw new Error("DUNG_LUONG_RAM_DA_TON_TAI");
      }
      throw error;
    }
  }

  // ======================== Xóa Dung Lượng RAM dựa trên id ==============================
  async delete(id) {
    try {
      const result = await prisma.dung_luong_ram.delete({
        where: { id: id },
      });
      return result;
    } catch (error) {
      // 1. Không tìm thấy bản ghi cần xóa
      if (error.code === "P2025") {
        return null;
      }
      // 2. Lỗi vi phạm khóa ngoại (P2003): Dung lượng RAM này đang được sử dụng ở bảng khác (ví dụ: biến thể)
      if (error.code === "P2003") {
        throw new Error("RAM_DANG_DUOC_SU_DUNG");
      }
      throw error;
    }
  }

  // ====================== Xóa tất cả các Dung Lượng RAM chưa được sử dụng ========================
  async deleteAll() {
    try {
      // Chỉ xóa các dung lượng RAM KHÔNG gắn với biến thể nào (nếu schema đã nối quan hệ bien_the)
      const result = await prisma.dung_luong_ram.deleteMany({
        where: {
          bien_the: {
            none: {},
          },
        },
      });
      return result.count; // Trả về số lượng bản ghi đã bị xóa
    } catch (error) {
      throw error;
    }
  }

  // ==================== Tìm một Dung Lượng RAM dựa trên id ======================
  async findById(id) {
    return await prisma.dung_luong_ram.findUnique({
      where: { id: id },
    });
  }
}

module.exports = DungLuongRamService;
