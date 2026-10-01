const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class YeuThichService {
  // Lọc lấy các trường thuộc tính hợp lệ của Yêu Thích
  extractYeuThichData(payload) {
    const yeuThich = {
      id: payload.id,
      id_san_pham: payload.id_san_pham,
      id_khach_hang: payload.id_khach_hang,
      ngay_them: payload.ngay_them,
    };
    Object.keys(yeuThich).forEach(
      (key) => yeuThich[key] === undefined && delete yeuThich[key],
    );
    return yeuThich;
  }

  // 1. Thêm sản phẩm vào danh sách yêu thích (Tự sinh mã YT01, YT02...)
  async create(payload) {
    if (!payload.id) {
      // Tìm 1 bản ghi yêu thích có ID lớn nhất hiện tại
      const lastYeuThich = await prisma.yeu_thich.findFirst({
        orderBy: {
          id: "desc",
        },
      });

      if (!lastYeuThich) {
        payload.id = "YT01";
      } else {
        // Lấy phần số ra khỏi chuỗi (VD: "YT05" -> lấy số 5)
        const currentNumber =
          parseInt(lastYeuThich.id.replace(/\D/g, ""), 10) || 0;
        payload.id = `YT${String(currentNumber + 1).padStart(2, "0")}`;
      }
    }

    const data = this.extractYeuThichData(payload);
    try {
      return await prisma.yeu_thich.create({
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
      // Lỗi trùng lặp @@unique([id_san_pham, id_khach_hang])
      if (error.code === "P2002") {
        throw new Error("SAN_PHAM_DA_CO_TRONG_DANH_SACH_YEU_THICH");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm danh sách yêu thích theo bộ lọc (id, id_khach_hang, id_san_pham)
  async find(filterData) {
    const where = {};

    if (filterData.id) {
      where.id = filterData.id;
    }

    if (filterData.id_khach_hang) {
      where.id_khach_hang = filterData.id_khach_hang;
    }

    if (filterData.id_san_pham) {
      where.id_san_pham = filterData.id_san_pham;
    }

    return await prisma.yeu_thich.findMany({
      where: where,
      include: {
        san_pham: true,
        khach_hang: true,
      },
      orderBy: {
        ngay_them: "desc", // Ưu tiên xếp sản phẩm mới yêu thích lên đầu
      },
    });
  }

  // 3. Xóa một bản ghi Yêu Thích dựa trên mã id
  async delete(id) {
    try {
      const result = await prisma.yeu_thich.delete({
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

  // 4. Xóa yêu thích theo cặp (id_khach_hang & id_san_pham)
  async deleteByCustomerAndProduct(id_khach_hang, id_san_pham) {
    try {
      const result = await prisma.yeu_thich.delete({
        where: {
          id_san_pham_id_khach_hang: {
            id_san_pham: id_san_pham,
            id_khach_hang: id_khach_hang,
          },
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

  // 5. Xóa tất cả bản ghi Yêu Thích
  async deleteAll() {
    const result = await prisma.yeu_thich.deleteMany({});
    return result.count;
  }

  // 6. Tìm một bản ghi Yêu Thích dựa trên mã id
  async findById(id) {
    return await prisma.yeu_thich.findUnique({
      where: { id: id },
      include: {
        san_pham: true,
        khach_hang: true,
      },
    });
  }
}

module.exports = YeuThichService;
