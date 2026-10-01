const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class ThuocTinhBienTheService {
  // Lọc lấy các trường thuộc tính hợp lệ
  extractThuocTinhBienTheData(payload) {
    const thuocTinhBienThe = {
      id: payload.id,
      id_bien_the: payload.id_bien_the,
      id_gia_tri_thuoc_tinh: payload.id_gia_tri_thuoc_tinh,
    };
    Object.keys(thuocTinhBienThe).forEach(
      (key) =>
        thuocTinhBienThe[key] === undefined && delete thuocTinhBienThe[key],
    );
    return thuocTinhBienThe;
  }

  // 1. Tạo liên kết thuộc tính - biến thể mới (Tự sinh mã TTBT01, TTBT02 nếu client không truyền id)
  async create(payload) {
    if (!payload.id) {
      // Tìm 1 bản ghi có ID lớn nhất hiện tại
      const lastRecord = await prisma.thuoc_tinh_bien_the.findFirst({
        orderBy: {
          id: "desc", // Sắp xếp ID giảm dần (ví dụ: TTBT05, TTBT04, TTBT03...)
        },
      });

      if (!lastRecord) {
        // Nếu database chưa có bản ghi nào
        payload.id = "TTBT01";
      } else {
        // Lấy phần số ra khỏi chuỗi (VD: "TTBT05" -> lấy số 5)
        const currentNumber =
          parseInt(lastRecord.id.replace(/\D/g, ""), 10) || 0;
        // Cộng thêm 1 và format lại thành chuỗi TTBT06
        payload.id = `TTBT${String(currentNumber + 1).padStart(2, "0")}`;
      }
    }

    const data = this.extractThuocTinhBienTheData(payload);
    try {
      return await prisma.thuoc_tinh_bien_the.create({
        data: data,
        include: {
          bien_the: true,
          gia_tri_thuoc_tinh: true,
        },
      });
    } catch (error) {
      // 1. Mã P2002: Lỗi vi phạm ràng buộc UNIQUE (Cặp id_bien_the và id_gia_tri_thuoc_tinh đã tồn tại)
      if (error.code === "P2002") {
        throw new Error("LIEN_KET_DA_TON_TAI");
      }
      // 2. Mã P2003: Lỗi vi phạm khóa ngoại (id_bien_the hoặc id_gia_tri_thuoc_tinh không tồn tại)
      if (error.code === "P2003") {
        throw new Error("KHOA_NGOAI_KHONG_TON_TAI");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm liên kết theo mã (id), mã biến thể (id_bien_the) hoặc mã giá trị thuộc tính (id_gia_tri_thuoc_tinh)
  async find(filterData) {
    const where = {};

    // Tìm kiếm chính xác theo mã bản ghi
    if (filterData.id) {
      where.id = filterData.id;
    }

    // Tìm kiếm theo mã biến thể
    if (filterData.id_bien_the) {
      where.id_bien_the = filterData.id_bien_the;
    }

    // Tìm kiếm theo mã giá trị thuộc tính
    if (filterData.id_gia_tri_thuoc_tinh) {
      where.id_gia_tri_thuoc_tinh = filterData.id_gia_tri_thuoc_tinh;
    }

    return await prisma.thuoc_tinh_bien_the.findMany({
      where: where,
      include: {
        bien_the: true,
        gia_tri_thuoc_tinh: true,
      },
    });
  }

  // ==================== Cập nhật thông tin một Liên Kết dựa trên id ======================
  async update(id, payload) {
    const updateData = this.extractThuocTinhBienTheData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính (id)
    delete updateData.id_bien_the;

    try {
      const result = await prisma.thuoc_tinh_bien_the.update({
        where: { id: id },
        data: updateData,
        include: {
          bien_the: true,
          gia_tri_thuoc_tinh: true,
        },
      });
      return result;
    } catch (error) {
      // 1. Lỗi không tìm thấy bản ghi cần update => Mã lỗi của Prisma là P2025
      if (error.code === "P2025") {
        return null;
      }
      // 2. Lỗi vi phạm UNIQUE (Bản ghi trùng cặp id_bien_the và id_gia_tri_thuoc_tinh khác)
      if (error.code === "P2002") {
        throw new Error("LIEN_KET_DA_TON_TAI");
      }
      // 3. Lỗi vi phạm khóa ngoại
      if (error.code === "P2003") {
        throw new Error("KHOA_NGOAI_KHONG_TON_TAI");
      }
      throw error;
    }
  }

  // ======================== Xóa Liên Kết dựa trên id ==============================
  async delete(id) {
    try {
      // Đơn giản hóa: Thực hiện xóa trực tiếp theo id
      const result = await prisma.thuoc_tinh_bien_the.delete({
        where: { id: id },
      });
      return result;
    } catch (error) {
      // Nếu không tìm thấy bản ghi cần xóa
      if (error.code === "P2025") {
        return null;
      }
      throw error;
    }
  }

  // ====================== Xóa tất cả các Liên Kết ========================
  async deleteAll() {
    // Đơn giản hóa: Tiến hành xóa sạch toàn bộ bản ghi
    const result = await prisma.thuoc_tinh_bien_the.deleteMany({});
    return result.count; // Trả về số lượng bản ghi đã xóa
  }

  // ==================== Tìm một Liên Kết dựa trên id ======================
  async findById(id) {
    return await prisma.thuoc_tinh_bien_the.findUnique({
      where: { id: id },
      include: {
        bien_the: true,
        gia_tri_thuoc_tinh: true,
      },
    });
  }
}

module.exports = ThuocTinhBienTheService;
