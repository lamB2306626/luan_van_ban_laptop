const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class DungLuongRomService {
  // Lọc lấy các trường thuộc tính hợp lệ
  extractRomData(payload) {
    const rom = {
      id: payload.id,
      dung_luong_rom: payload.dung_luong_rom,
    };
    Object.keys(rom).forEach(
      (key) => rom[key] === undefined && delete rom[key],
    );
    return rom;
  }

  // 1. Tạo Dung Lượng ROM mới (Tự sinh mã ROM01, ROM02 nếu client không truyền id)
  async create(payload) {
    if (!payload.id) {
      // Tìm 1 ROM có ID lớn nhất hiện tại
      const lastRom = await prisma.dung_luong_rom.findFirst({
        orderBy: {
          id: "desc", // Sắp xếp ID giảm dần (ví dụ: ROM05, ROM04, ROM03...)
        },
      });

      if (!lastRom) {
        // Nếu database chưa có bản ghi ROM nào
        payload.id = "ROM01";
      } else {
        // Lấy phần số ra khỏi chuỗi (VD: "ROM05" -> lấy số 5)
        const currentNumber = parseInt(lastRom.id.replace(/\D/g, ""), 10) || 0;
        // Cộng thêm 1 và format lại thành chuỗi ROM06
        payload.id = `ROM${String(currentNumber + 1).padStart(2, "0")}`;
      }
    }

    const data = this.extractRomData(payload);
    try {
      return await prisma.dung_luong_rom.create({
        data: data,
      });
    } catch (error) {
      // Mã P2002 của Prisma đại diện cho lỗi vi phạm ràng buộc UNIQUE (trùng dung_luong_rom hoặc id)
      if (error.code === "P2002") {
        throw new Error("DUNG_LUONG_ROM_DA_TON_TAI");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm Dung Lượng ROM theo mã (id) hoặc giá trị (dung_luong_rom)
  async find(filterData) {
    const where = {};

    // Tìm kiếm chính xác theo mã
    if (filterData.id) {
      where.id = filterData.id;
    }

    // Tìm kiếm gần đúng (chứa từ khóa, không phân biệt hoa thường)
    if (filterData.dung_luong_rom) {
      where.dung_luong_rom = {
        contains: filterData.dung_luong_rom,
        mode: "insensitive",
      };
    }

    return await prisma.dung_luong_rom.findMany({
      where: where,
    });
  }

  // ==================== Cập nhật thông tin một Dung Lượng ROM dựa trên id ======================
  async update(id, payload) {
    const updateData = this.extractRomData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính (id)

    try {
      const result = await prisma.dung_luong_rom.update({
        where: { id: id },
        data: updateData,
      });
      return result;
    } catch (error) {
      // 1. Lỗi không tìm thấy bản ghi cần update => Mã lỗi của Prisma là P2025
      if (error.code === "P2025") {
        return null;
      }
      // 2. Lỗi bị trùng dung lượng ROM với bản ghi khác (UNIQUE constraint) => Mã lỗi là P2002
      if (error.code === "P2002") {
        throw new Error("DUNG_LUONG_ROM_DA_TON_TAI");
      }
      throw error;
    }
  }

  // ======================== Xóa Dung Lượng ROM dựa trên id ==============================
  async delete(id) {
    try {
      const result = await prisma.dung_luong_rom.delete({
        where: { id: id },
      });
      return result;
    } catch (error) {
      // 1. Không tìm thấy bản ghi cần xóa
      if (error.code === "P2025") {
        return null;
      }
      // 2. Lỗi vi phạm khóa ngoại (P2003): Dung lượng ROM này đang được sử dụng ở bảng khác (ví dụ: biến thể)
      if (error.code === "P2003") {
        throw new Error("ROM_DANG_DUOC_SU_DUNG");
      }
      throw error;
    }
  }

  // ====================== Xóa tất cả các Dung Lượng ROM chưa được sử dụng ========================
  async deleteAll() {
    try {
      // Chỉ xóa các dung lượng ROM KHÔNG gắn với biến thể nào (nếu schema đã nối quan hệ bien_the)
      const result = await prisma.dung_luong_rom.deleteMany({
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

  // ==================== Tìm một Dung Lượng ROM dựa trên id ======================
  async findById(id) {
    return await prisma.dung_luong_rom.findUnique({
      where: { id: id },
    });
  }
}

module.exports = DungLuongRomService;
