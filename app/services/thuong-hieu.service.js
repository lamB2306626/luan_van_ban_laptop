const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class thuongHieuService {
  // Lọc lấy các trường thuộc tính hợp lệ
  extractthuongHieuData(payload) {
    const thuongHieu = {
      id: payload.id,
      ten_thuong_hieu: payload.ten_thuong_hieu,
      lo_go: payload.lo_go,
      mo_ta: payload.mo_ta,
    };
    Object.keys(thuongHieu).forEach(
      (key) => thuongHieu[key] === undefined && delete thuongHieu[key],
    );
    return thuongHieu;
  }

  // 1. Tạo thương hiệu mới
  async create(payload) {
    if (!payload.id) {
      // Tìm 1 thương hiệu có ID lớn nhất hiện tại
      const lastThuongHieu = await prisma.thuong_hieu.findFirst({
        orderBy: {
          id: "desc",
        },
      });

      if (!lastThuongHieu) {
        payload.id = "TH01";
      } else {
        const currentNumber =
          parseInt(lastThuongHieu.id.replace(/\D/g, ""), 10) || 0;
        payload.id = `TH${String(currentNumber + 1).padStart(2, "0")}`;
      }
    }

    const data = this.extractthuongHieuData(payload);
    try {
      return await prisma.thuong_hieu.create({
        data: data,
      });
    } catch (error) {
      if (error.code === "P2002") {
        throw new Error("TEN_THUONG_HIEU_DA_TON_TAI");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm thương hiệu theo mã (id) hoặc tên (ten_thuong_hieu)
  async find(filterData) {
    const where = {};

    // Tìm kiếm chính xác theo mã
    if (filterData.id) {
      where.id = filterData.id;
    }

    // Tìm kiếm gần đúng (chứa từ khóa, không phân biệt hoa thường) theo tên
    if (filterData.ten_thuong_hieu) {
      where.ten_thuong_hieu = {
        contains: filterData.ten_thuong_hieu,
        mode: "insensitive",
      };
    }

    return await prisma.thuong_hieu.findMany({
      where: where,
    });
  }

  // ==================== Cập nhật thông tin một thương hiệu dựa trên id ======================
  async update(id, payload) {
    // Trích xuất các trường dữ liệu của thương hiệu từ payload gửi lên
    const updateData = this.extractthuongHieuData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính (id)

    try {
      // Thực hiện cập nhật vào CSDL bằng phương thức update của Prisma
      const result = await prisma.thuong_hieu.update({
        where: { id: id },
        data: updateData,
      });
      return result;
    } catch (error) {
      if (error.code === "P2025") {
        return null;
      }
      if (error.code === "P2002") {
        throw new Error("TEN_THUONG_HIEU_DA_TON_TAI");
      }
      throw error;
    }
  }

  // ======================== Xóa thương hiệu dựa trên id ==============================
  async delete(id) {
    try {
      const result = await prisma.thuong_hieu.delete({
        where: { id: id },
      });
      return result;
    } catch (error) {
      // 1. Không tìm thấy bản ghi cần xóa
      if (error.code === "P2025") {
        return null;
      }
      // 2. Lỗi vi phạm khóa ngoại (P2003): Thương hiệu này đang chứa sản phẩm
      if (error.code === "P2003") {
        throw new Error("THUONG_HIEU_DANG_CO_SAN_PHAM");
      }
      throw error;
    }
  }

  // ====================== Xóa tất cả các Thương hiệu chưa có Sản Phẩm ========================
  async deleteAll() {
    try {
      // Chỉ xóa các thương hiệu KHÔNG chứa sản phẩm nào (san_pham: { none: {} })
      const result = await prisma.thuong_hieu.deleteMany({
        where: {
          san_pham: {
            none: {},
          },
        },
      });
      return result.count; // Trả về số lượng thương hiệu hợp lệ đã bị xóa
    } catch (error) {
      throw error;
    }
  }

  // ==================== Tìm một thương hiệu dựa trên id ======================
  async findById(id) {
    return await prisma.thuong_hieu.findUnique({
      where: { id: id },
    });
  }
}

module.exports = thuongHieuService;
