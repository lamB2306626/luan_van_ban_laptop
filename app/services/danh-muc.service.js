const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class DanhMucService {
  // Lọc lấy các trường thuộc tính hợp lệ
  extractDanhMucData(payload) {
    const danhMuc = {
      id: payload.id,
      ten_danh_muc: payload.ten_danh_muc,
      mo_ta: payload.mo_ta,
    };
    Object.keys(danhMuc).forEach(
      (key) => danhMuc[key] === undefined && delete danhMuc[key],
    );
    return danhMuc;
  }

  // 1. Tạo danh mục mới (Tự sinh mã DM01, DM02 nếu client không truyền id)
  async create(payload) {
    if (!payload.id) {
      // Tìm 1 danh mục có ID lớn nhất hiện tại
      const lastDanhMuc = await prisma.danh_muc.findFirst({
        orderBy: {
          id: "desc", // Sắp xếp ID giảm dần (ví dụ: DM05, DM04, DM03...)
        },
      });

      if (!lastDanhMuc) {
        // Nếu database chưa có danh mục nào
        payload.id = "DM01";
      } else {
        // Lấy phần số ra khỏi chuỗi (VD: "DM05" -> lấy số 5)
        const currentNumber =
          parseInt(lastDanhMuc.id.replace(/\D/g, ""), 10) || 0;
        // Cộng thêm 1 và format lại thành chuỗi DM06
        payload.id = `DM${String(currentNumber + 1).padStart(2, "0")}`;
      }
    }

    const data = this.extractDanhMucData(payload);
    try {
      return await prisma.danh_muc.create({
        data: data,
      });
    } catch (error) {
      // Mã P2002 của Prisma đại diện cho lỗi vi phạm ràng buộc UNIQUE
      if (error.code === "P2002") {
        throw new Error("TEN_DANH_MUC_DA_TON_TAI");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm danh mục theo mã (id) hoặc tên (ten_danh_muc)
  async find(filterData) {
    const where = {};

    // Tìm kiếm chính xác theo mã
    if (filterData.id) {
      where.id = filterData.id;
    }

    // Tìm kiếm gần đúng (chứa từ khóa, không phân biệt hoa thường) theo tên
    if (filterData.ten_danh_muc) {
      where.ten_danh_muc = {
        contains: filterData.ten_danh_muc,
        mode: "insensitive",
      };
    }

    return await prisma.danh_muc.findMany({
      where: where,
    });
  }

  // ==================== Cập nhật thông tin một Danh Mục dựa trên id ======================
  async update(id, payload) {
    const updateData = this.extractDanhMucData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính (id)

    try {
      const result = await prisma.danh_muc.update({
        where: { id: id },
        data: updateData,
      });
      return result;
    } catch (error) {
      // 1. Lỗi không tìm thấy bản ghi cần update => Mã lỗi của Prisima là P2025
      if (error.code === "P2025") {
        return null;
      }
      // 2. Lỗi bị trùng tên danh mục với bản ghi khác (UNIQUE constraint) => Mã lỗi là 2002
      if (error.code === "P2002") {
        throw new Error("TEN_DANH_MUC_DA_TON_TAI");
      }
      throw error;
    }
  }

  // ======================== Xóa Danh Mục dựa trên id ==============================
  async delete(id) {
    try {
      const result = await prisma.danh_muc.delete({
        where: { id: id },
      });
      return result;
    } catch (error) {
      // 1. Không tìm thấy bản ghi cần xóa
      if (error.code === "P2025") {
        return null;
      }
      // 2. Lỗi vi phạm khóa ngoại (P2003): Danh mục này đang chứa sản phẩm
      if (error.code === "P2003") {
        throw new Error("DANH_MUC_DANG_CO_SAN_PHAM");
      }
      throw error;
    }
  }

  // ====================== Xóa tất cả các Danh Mục chưa có Sản Phẩm ========================
  async deleteAll() {
    try {
      // Chỉ xóa các danh mục KHÔNG chứa sản phẩm nào (san_pham: { none: {} })
      const result = await prisma.danh_muc.deleteMany({
        where: {
          san_pham: {
            none: {},
          },
        },
      });
      return result.count; // Trả về số lượng danh mục hợp lệ đã bị xóa
    } catch (error) {
      throw error;
    }
  }

  // ==================== Tìm một Danh Mục dựa trên id ======================
  async findById(id) {
    return await prisma.danh_muc.findUnique({
      where: { id: id },
    });
  }
}

module.exports = DanhMucService;
