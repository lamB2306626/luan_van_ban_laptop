const prisma = require("../utils/prisma");

class GioHangService {
  // Lọc lấy các trường thuộc tính hợp lệ của Giỏ Hàng
  extractGioHangData(payload) {
    const gioHang = {
      id: payload.id,
      id_khach_hang: payload.id_khach_hang,
    };
    Object.keys(gioHang).forEach(
      (key) => gioHang[key] === undefined && delete gioHang[key],
    );
    return gioHang;
  }

  // 1. Tạo giỏ hàng mới (Tự sinh mã GH01, GH02... nếu không truyền id)
  async create(payload) {
    if (!payload.id) {
      // Tìm 1 giỏ hàng có ID lớn nhất hiện tại
      const lastGioHang = await prisma.gio_hang.findFirst({
        orderBy: {
          id: "desc",
        },
      });

      if (!lastGioHang) {
        payload.id = "GH0001";
      } else {
        const currentNumber =
          parseInt(lastGioHang.id.replace(/\D/g, ""), 10) || 0;
        payload.id = `GH${String(currentNumber + 1).padStart(4, "0")}`;
      }
    }

    const data = this.extractGioHangData(payload);
    try {
      return await prisma.gio_hang.create({
        data: data,
        include: {
          khach_hang: true,
          chi_tiet_gio_hang: true,
        },
      });
    } catch (error) {
      // Lỗi vi phạm khóa ngoại (P2003): id_khach_hang không tồn tại
      if (error.code === "P2003") {
        throw new Error("KHACH_HANG_KHONG_TON_TAI");
      }
      // Lỗi trùng lặp giỏ hàng của khách hàng (nếu bạn có đặt @unique cho id_khach_hang)
      if (error.code === "P2002") {
        throw new Error("KHACH_HANG_DA_CO_GIO_HANG");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm giỏ hàng theo bộ lọc (id, id_khach_hang)
  async find(filterData) {
    const where = {};

    if (filterData.id) {
      where.id = filterData.id;
    }

    if (filterData.id_khach_hang) {
      where.id_khach_hang = filterData.id_khach_hang;
    }

    // 1. Lấy thông tin giỏ hàng
    const listGioHang = await prisma.gio_hang.findMany({
      where: where,
      include: {
        khach_hang: true,
      },
    });

    // 2. Với mỗi giỏ hàng, lấy danh sách chi tiết (thông qua ChiTietGioHangService)
    const ChiTietGioHangService = require("./chi-tiet-gio-hang.service");
    const chiTietGioHangService = new ChiTietGioHangService();

    return await Promise.all(
      listGioHang.map(async (gioHang) => {
        const chiTietList = await chiTietGioHangService.find({
          id_gio_hang: gioHang.id,
        });

        // Lọc danh sách sản phẩm hợp lệ (chỉ lấy các biến thể có trang_thai = true)
        const chiTietHopLe = chiTietList.filter(
          (item) => Boolean(item.bien_the?.trang_thai) === true,
        );

        // Tính tổng tiền dựa trên danh sách sản phẩm hợp lệ
        const tongTienGoc = chiTietHopLe.reduce(
          (sum, item) => sum + (Number(item.gia_goc) || 0) * item.so_luong,
          0,
        );

        const tongThanhToan = chiTietHopLe.reduce(
          (sum, item) =>
            sum + (Number(item.don_gia_ap_dung) || 0) * item.so_luong,
          0,
        );

        return {
          ...gioHang,
          chi_tiet_gio_hang: chiTietList, // Vẫn trả về đủ danh sách để frontend hiển thị cảnh báo
          tong_tien_goc: tongTienGoc,
          tong_tien_giam: tongTienGoc - tongThanhToan,
          tong_thanh_toan: tongThanhToan,
        };
      }),
    );
  }

  // 3. Cập nhật giỏ hàng dựa trên id
  async update(id, payload) {
    const updateData = this.extractGioHangData(payload);
    delete updateData.id; // Không cho phép sửa khóa chính
    delete updateData.id_khach_hang; // Không cho phép chuyển giỏ hàng sang khách khác

    try {
      const result = await prisma.gio_hang.update({
        where: { id: id },
        data: updateData,
        include: {
          khach_hang: true,
          chi_tiet_gio_hang: true,
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

  // 4. Xóa một giỏ hàng dựa trên id
  async delete(id) {
    try {
      const result = await prisma.gio_hang.delete({
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

  // 5. Xóa tất cả giỏ hàng
  async deleteAll() {
    const result = await prisma.gio_hang.deleteMany({});
    return result.count;
  }

  // 6. Tìm một giỏ hàng dựa trên id
  async findById(id) {
    return await prisma.gio_hang.findUnique({
      where: { id: id },
      include: {
        khach_hang: true,
        chi_tiet_gio_hang: true,
      },
    });
  }

  // 7. Tìm giỏ hàng theo ID Khách hàng
  async findByKhachHangId(idKhachHang) {
    return await prisma.gio_hang.findFirst({
      where: { id_khach_hang: idKhachHang },
      include: {
        khach_hang: true,
        chi_tiet_gio_hang: true,
      },
    });
  }

  // 8. Đếm số lượng sản phẩm trong giỏ hàng theo ID Khách hàng
  async countByKhachHangId(idKhachHang) {
    // Tìm giỏ hàng của khách hàng
    const gioHang = await prisma.gio_hang.findFirst({
      where: { id_khach_hang: idKhachHang },
      select: { id: true },
    });

    // Nếu khách chưa có giỏ hàng thì trả về 0
    if (!gioHang) {
      return {
        tong_so_luong: 0,
        so_mat_hang: 0,
      };
    }

    // Dùng aggregate của Prisma để tính tổng so_luong và đếm số dòng biến thể
    const result = await prisma.chi_tiet_gio_hang.aggregate({
      where: { id_gio_hang: gioHang.id },
      _sum: {
        so_luong: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      tong_so_luong: result._sum.so_luong || 0, // Tổng tất cả sản phẩm (VD: 2 + 1 = 3)
      so_mat_hang: result._count.id || 0, // Số loại biến thể khác nhau (VD: 2)
    };
  }
}

module.exports = GioHangService;
