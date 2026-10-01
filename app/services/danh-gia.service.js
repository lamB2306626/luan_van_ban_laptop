const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class DanhGiaService {
  // Lọc lấy các trường thuộc tính hợp lệ của Đánh Giá
  extractDanhGiaData(payload) {
    const danhGia = {
      id: payload.id,
      id_san_pham: payload.id_san_pham,
      id_khach_hang: payload.id_khach_hang,
      so_sao:
        payload.so_sao !== undefined ? parseInt(payload.so_sao, 10) : undefined,
      noi_dung: payload.noi_dung,
      ngay_danh_gia: payload.ngay_danh_gia,
    };
    Object.keys(danhGia).forEach(
      (key) => danhGia[key] === undefined && delete danhGia[key],
    );
    return danhGia;
  }

  // 1. Tạo đánh giá mới (Tự sinh mã DG01, DG02... nếu không truyền id)
  async create(payload) {
    if (!payload.id) {
      // Tìm 1 đánh giá có ID lớn nhất hiện tại
      const lastDanhGia = await prisma.danh_gia.findFirst({
        orderBy: {
          id: "desc",
        },
      });

      if (!lastDanhGia) {
        payload.id = "DG01";
      } else {
        const currentNumber =
          parseInt(lastDanhGia.id.replace(/\D/g, ""), 10) || 0;
        payload.id = `DG${String(currentNumber + 1).padStart(2, "0")}`;
      }
    }

    const data = this.extractDanhGiaData(payload);
    try {
      return await prisma.danh_gia.create({
        data: data,
        include: {
          san_pham: true,
          khach_hang: true,
        },
      });
    } catch (error) {
      // Lỗi vi phạm khóa ngoại (P2003): id_san_pham hoặc id_khach_hang không tồn tại
      if (error.code === "P2003") {
        throw new Error("SAN_PHAM_HOAC_KHACH_HANG_KHONG_TON_TAI");
      }
      // Lỗi vi phạm @@unique([id_san_pham, id_khach_hang])
      if (error.code === "P2002") {
        throw new Error("KHACH_HANG_DA_DANH_GIA_SAN_PHAM_NAY");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm đánh giá theo bộ lọc (id, id_san_pham, id_khach_hang, so_sao)
  async find(filterData) {
    const where = {};

    if (filterData.id) {
      where.id = filterData.id;
    }

    if (filterData.id_san_pham) {
      where.id_san_pham = filterData.id_san_pham;
    }

    if (filterData.id_khach_hang) {
      where.id_khach_hang = filterData.id_khach_hang;
    }

    if (filterData.so_sao) {
      where.so_sao = parseInt(filterData.so_sao, 10);
    }

    return await prisma.danh_gia.findMany({
      where: where,
      include: {
        san_pham: true,
        khach_hang: true,
      },
      orderBy: {
        ngay_danh_gia: "desc", // Đánh giá mới nhất lên đầu
      },
    });
  }

  // 3. Cập nhật đánh giá dựa trên id
  async update(id, payload) {
    const updateData = this.extractDanhGiaData(payload);
    delete updateData.id; // Không cho phép sửa khóa chính
    delete updateData.id_san_pham; // Không cho phép đổi sản phẩm
    delete updateData.id_khach_hang; // Không cho phép đổi người đánh giá

    try {
      const result = await prisma.danh_gia.update({
        where: { id: id },
        data: updateData,
        include: {
          san_pham: true,
          khach_hang: true,
        },
      });
      return result;
    } catch (error) {
      if (error.code === "P2025") {
        return null;
      }
      throw error;
    }
  }

  // 4. Xóa một đánh giá dựa trên id
  async delete(id) {
    try {
      const result = await prisma.danh_gia.delete({
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

  // 5. Xóa tất cả đánh giá
  async deleteAll() {
    const result = await prisma.danh_gia.deleteMany({});
    return result.count;
  }

  // 6. Tìm một đánh giá dựa trên id
  async findById(id) {
    return await prisma.danh_gia.findUnique({
      where: { id: id },
      include: {
        san_pham: true,
        khach_hang: true,
      },
    });
  }
}

module.exports = DanhGiaService;
