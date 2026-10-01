const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class AnhSanPhamService {
  // Lọc lấy các trường thuộc tính hợp lệ của anh_san_pham
  extractAnhSanPhamData(payload) {
    const anhSanPham = {
      id: payload.id,
      duong_dan_anh: payload.duong_dan_anh,
      la_anh_chinh: payload.la_anh_chinh,
      id_san_pham: payload.id_san_pham,
    };
    Object.keys(anhSanPham).forEach(
      (key) => anhSanPham[key] === undefined && delete anhSanPham[key],
    );
    return anhSanPham;
  }

  // 1. Tạo Ảnh Sản Phẩm mới (Tự sinh mã ASP01, ASP02 nếu client không truyền id)
  async create(payload, tx) {
    const db = tx || prisma;
    if (!payload.id) {
      // Tìm 1 ảnh sản phẩm có ID lớn nhất hiện tại
      const lastAnhSanPham = await db.anh_san_pham.findFirst({
        orderBy: {
          id: "desc", // Sắp xếp ID giảm dần (ví dụ: ASP05, ASP04...)
        },
      });

      if (!lastAnhSanPham) {
        payload.id = "ASP01";
      } else {
        const currentNumber =
          parseInt(lastAnhSanPham.id.replace(/\D/g, ""), 10) || 0;
        payload.id = `ASP${String(currentNumber + 1).padStart(2, "0")}`;
      }
    }

    const data = this.extractAnhSanPhamData(payload);
    try {
      // Thực hiện create thông qua tx
      return await db.anh_san_pham.create({
        data: data,
      });
    } catch (error) {
      // P2003: Vi phạm ràng buộc Khóa ngoại (id_san_pham không tồn tại)
      if (error.code === "P2003") {
        throw new Error("ID_SAN_PHAM_KHONG_TON_TAI");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm ảnh sản phẩm theo mã ảnh (id), mã sản phẩm (id_san_pham) hoặc lọc ảnh chính
  async find(filterData) {
    const where = {};

    if (filterData.id) {
      where.id = filterData.id;
    }

    if (filterData.id_san_pham) {
      where.id_san_pham = filterData.id_san_pham;
    }

    if (filterData.la_anh_chinh !== undefined) {
      where.la_anh_chinh = filterData.la_anh_chinh;
    }

    return await prisma.anh_san_pham.findMany({
      where: where,
    });
  }

  // ==================== Cập nhật thông tin Ảnh Sản Phẩm dựa trên id ======================
  async update(id, payload) {
    const updateData = this.extractAnhSanPhamData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính (id)

    try {
      const result = await prisma.anh_san_pham.update({
        where: { id: id },
        data: updateData,
      });
      return result;
    } catch (error) {
      // 1. Lỗi không tìm thấy bản ghi cần update => Mã lỗi của Prisma là P2025
      if (error.code === "P2025") {
        return null;
      }
      // 2. Lỗi gán id_san_pham mới nhưng mã đó không tồn tại trong DB
      if (error.code === "P2003") {
        throw new Error("ID_SAN_PHAM_KHONG_TON_TAI");
      }
      throw error;
    }
  }

  // ======================== Xóa Ảnh Sản Phẩm dựa trên id ==============================
  async delete(id) {
    try {
      const result = await prisma.anh_san_pham.delete({
        where: { id: id },
      });
      return result;
    } catch (error) {
      if (error.code === "P2025") {
        return null;
      }
      throw error;
    }
  }

  // ====================== Xóa tất cả các Ảnh Sản Phẩm ========================
  async deleteAll() {
    const result = await prisma.anh_san_pham.deleteMany({});
    return result.count;
  }

  // ==================== Tìm một Ảnh Sản Phẩm dựa trên id ======================
  async findById(id) {
    return await prisma.anh_san_pham.findUnique({
      where: { id: id },
    });
  }
}

module.exports = AnhSanPhamService;
