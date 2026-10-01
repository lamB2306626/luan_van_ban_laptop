const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class ThuocTinhService {
  // Lọc lấy các trường thuộc tính hợp lệ
  extractThuocTinhData(payload) {
    const thuocTinh = {
      id: payload.id,
      ten_thuoc_tinh: payload.ten_thuoc_tinh,
    };
    Object.keys(thuocTinh).forEach(
      (key) => thuocTinh[key] === undefined && delete thuocTinh[key],
    );
    return thuocTinh;
  }

  // 1. Tạo Thuộc Tính mới (Tự sinh mã DM01, DM02 nếu client không truyền id)
  async create(payload) {
    if (!payload.id) {
      // Tìm 1 Thuộc Tính có ID lớn nhất hiện tại
      const lastThuocTinh = await prisma.thuoc_tinh.findFirst({
        orderBy: {
          id: "desc", // Sắp xếp ID giảm dần (ví dụ: DM05, DM04, DM03...)
        },
      });

      if (!lastThuocTinh) {
        // Nếu database chưa có Thuộc Tính nào
        payload.id = "TT01";
      } else {
        // Lấy phần số ra khỏi chuỗi (VD: "DM05" -> lấy số 5)
        const currentNumber =
          parseInt(lastThuocTinh.id.replace(/\D/g, ""), 10) || 0;
        // Cộng thêm 1 và format lại thành chuỗi DM06
        payload.id = `TT${String(currentNumber + 1).padStart(2, "0")}`;
      }
    }

    const data = this.extractThuocTinhData(payload);
    try {
      return await prisma.thuoc_tinh.create({
        data: data,
      });
    } catch (error) {
      // Mã P2002 của Prisma đại diện cho lỗi vi phạm ràng buộc UNIQUE
      if (error.code === "P2002") {
        throw new Error("TEN_THUOC_TINH_DA_TON_TAI");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm Thuộc Tính theo mã (id) hoặc tên (ten_thuoc_tinh)
  async find(filterData) {
    const where = {};

    // Tìm kiếm chính xác theo mã
    if (filterData.id) {
      where.id = filterData.id;
    }

    // Tìm kiếm gần đúng (chứa từ khóa, không phân biệt hoa thường) theo tên
    if (filterData.ten_thuoc_tinh) {
      where.ten_thuoc_tinh = {
        contains: filterData.ten_thuoc_tinh,
        mode: "insensitive",
      };
    }

    return await prisma.thuoc_tinh.findMany({
      where: where,
    });
  }

  // ==================== Cập nhật thông tin một Thuộc Tính dựa trên id ======================
  async update(id, payload) {
    const updateData = this.extractThuocTinhData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính (id)

    try {
      const result = await prisma.thuoc_tinh.update({
        where: { id: id },
        data: updateData,
      });
      return result;
    } catch (error) {
      // 1. Lỗi không tìm thấy bản ghi cần update => Mã lỗi của Prisima là P2025
      if (error.code === "P2025") {
        return null;
      }
      // 2. Lỗi bị trùng tên Thuộc Tính với bản ghi khác (UNIQUE constraint) => Mã lỗi là 2002
      if (error.code === "P2002") {
        throw new Error("TEN_THUOC_TINH_DA_TON_TAI");
      }
      throw error;
    }
  }

  // ======================== Xóa Thuộc Tính dựa trên id ==============================
  async delete(id) {
    try {
      const result = await prisma.thuoc_tinh.delete({
        where: { id: id },
      });
      return result;
    } catch (error) {
      // 1. Không tìm thấy bản ghi cần xóa
      if (error.code === "P2025") {
        return null;
      }
      // 2. Lỗi vi phạm khóa ngoại (P2003): Thuộc tính đang chứa Giá trị thuộc tính
      if (error.code === "P2003") {
        throw new Error("THUOC_TINH_DANG_CO_GIA_TRI");
      }
      throw error;
    }
  }

  // ====================== Xóa tất cả các Thuộc Tính chưa có Giá Trị ========================
  async deleteAll() {
    try {
      // Chỉ xóa các thuộc tính KHÔNG chứa giá trị thuộc tính nào (gia_tri_thuoc_tinh: { none: {} })
      const result = await prisma.thuoc_tinh.deleteMany({
        where: {
          gia_tri_thuoc_tinh: {
            none: {},
          },
        },
      });
      return result.count; // Trả về số lượng thuộc tính hợp lệ đã bị xóa
    } catch (error) {
      throw error;
    }
  }
  
  // ==================== Tìm một Thuộc Tính dựa trên id ======================
  async findById(id) {
    return await prisma.thuoc_tinh.findUnique({
      where: { id: id },
    });
  }
}

module.exports = ThuocTinhService;
