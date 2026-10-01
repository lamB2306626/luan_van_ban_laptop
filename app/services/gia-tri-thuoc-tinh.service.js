const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class GiaTriThuocTinhService {
  // Lọc lấy các trường thuộc tính hợp lệ của gia_tri_thuoc_tinh
  extractGiaTriThuocTinhData(payload) {
    const giaTriThuocTinh = {
      id: payload.id,
      id_thuoc_tinh: payload.id_thuoc_tinh,
      gia_tri: payload.gia_tri,
    };
    Object.keys(giaTriThuocTinh).forEach(
      (key) =>
        giaTriThuocTinh[key] === undefined && delete giaTriThuocTinh[key],
    );
    return giaTriThuocTinh;
  }

  // 1. Tạo giá trị thuộc tính mới (Tự sinh mã GT01, GT02 nếu client không truyền id)
  async create(payload) {
    if (!payload.id) {
      // Tìm 1 giá trị thuộc tính có ID lớn nhất hiện tại
      const lastGiaTri = await prisma.gia_tri_thuoc_tinh.findFirst({
        orderBy: {
          id: "desc", // Sắp xếp ID giảm dần (GT05, GT04...)
        },
      });

      if (!lastGiaTri) {
        payload.id = "GT01";
      } else {
        const currentNumber =
          parseInt(lastGiaTri.id.replace(/\D/g, ""), 10) || 0;
        payload.id = `GT${String(currentNumber + 1).padStart(2, "0")}`;
      }
    }

    const data = this.extractGiaTriThuocTinhData(payload);
    try {
      return await prisma.gia_tri_thuoc_tinh.create({
        data: data,
        include: {
          thuoc_tinh: true, // Kèm theo thông tin bảng thuoc_tinh cha
        },
      });
    } catch (error) {
      // P2003: Lỗi vi phạm khóa ngoại (id_thuoc_tinh không tồn tại ở bảng thuoc_tinh)
      if (error.code === "P2003") {
        throw new Error("ID_THUOC_TINH_KHONG_TON_TAI");
      }
      // P2002: Lỗi vi phạm ràng buộc UNIQUE @@unique([id_thuoc_tinh, gia_tri])
      if (error.code === "P2002") {
        throw new Error("GIA_TRI_THUOC_TINH_DA_TON_TAI");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm giá trị thuộc tính theo id, id_thuoc_tinh hoặc gia_tri
  async find(filterData) {
    const where = {};

    if (filterData.id) {
      where.id = filterData.id;
    }

    if (filterData.id_thuoc_tinh) {
      where.id_thuoc_tinh = filterData.id_thuoc_tinh;
    }

    if (filterData.gia_tri) {
      where.gia_tri = {
        contains: filterData.gia_tri,
        mode: "insensitive",
      };
    }

    return await prisma.gia_tri_thuoc_tinh.findMany({
      where: where,
      include: {
        thuoc_tinh: true, // Lấy kèm thông tin tên thuộc tính cha
      },
    });
  }

  // 3. Tìm một Giá Trị Thuộc Tính theo ID
  async findById(id) {
    return await prisma.gia_tri_thuoc_tinh.findUnique({
      where: { id: id },
      include: {
        thuoc_tinh: true,
      },
    });
  }

  // 4. Cập nhật Giá Trị Thuộc Tính theo ID
  async update(id, payload) {
    const updateData = this.extractGiaTriThuocTinhData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính
    delete updateData.id_thuoc_tinh;

    try {
      const result = await prisma.gia_tri_thuoc_tinh.update({
        where: { id: id },
        data: updateData,
        include: {
          thuoc_tinh: true,
        },
      });
      return result;
    } catch (error) {
      // P2025: Không tìm thấy bản ghi cần update
      if (error.code === "P2025") {
        return null;
      }
      // P2003: Cập nhật id_thuoc_tinh mới nhưng ID đó không tồn tại
      if (error.code === "P2003") {
        throw new Error("ID_THUOC_TINH_KHONG_TON_TAI");
      }
      // P2002: Trùng cặp (id_thuoc_tinh, gia_tri)
      if (error.code === "P2002") {
        throw new Error("GIA_TRI_THUOC_TINH_DA_TON_TAI");
      }
      throw error;
    }
  }

  // 5. Xóa một Giá Trị Thuộc Tính theo ID
  async delete(id) {
    try {
      const result = await prisma.gia_tri_thuoc_tinh.delete({
        where: { id: id },
      });
      return result;
    } catch (error) {
      // Không tìm thấy bản ghi cần xóa
      if (error.code === "P2025") {
        return null;
      }
      // Lỗi vi phạm khóa ngoại (P2003): Giá trị thuộc tính đang được sử dụng trong Thuộc tính biến thể
      if (error.code === "P2003") {
        throw new Error("GIA_TRI_THUOC_TINH_DANG_DUOC_SU_DUNG");
      }
      throw error;
    }
  }

  // 6. Xóa tất cả các Giá Trị Thuộc Tính chưa được liên kết với Biến Thể
  async deleteAll() {
    try {
      // Chỉ xóa các Giá trị thuộc tính KHÔNG nằm trong bảng thuoc_tinh_bien_the
      const result = await prisma.gia_tri_thuoc_tinh.deleteMany({
        where: {
          thuoc_tinh_bien_the: {
            none: {},
          },
        },
      });
      return result.count; // Trả về số lượng bản ghi hợp lệ đã bị xóa
    } catch (error) {
      throw error;
    }
  }
}

module.exports = GiaTriThuocTinhService;
