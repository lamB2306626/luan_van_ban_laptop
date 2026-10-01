const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class ThongSoService {
  // Lọc lấy các trường thuộc tính hợp lệ của thong_so
  extractThongSoData(payload) {
    const thongSo = {
      id: payload.id,
      kich_thuoc_man_hinh: payload.kich_thuoc_man_hinh,
      do_phan_giai: payload.do_phan_giai,
      dung_luong_pin: payload.dung_luong_pin,
      cong_xuat_sac: payload.cong_xuat_sac,
      cong_ket_noi: payload.cong_ket_noi,
      chuan_wifi_bluetooth: payload.chuan_wifi_bluetooth,
      trong_luong: payload.trong_luong,
      chat_lieu_vo: payload.chat_lieu_vo,
      he_dieu_hanh: payload.he_dieu_hanh,
      id_san_pham: payload.id_san_pham,
    };
    Object.keys(thongSo).forEach(
      (key) => thongSo[key] === undefined && delete thongSo[key],
    );
    return thongSo;
  }

  // 1. Tạo Thông Số mới (Tự sinh mã TS01, TS02 nếu client không truyền id)
  async create(payload) {
    if (!payload.id) {
      // Tìm 1 thông số có ID lớn nhất hiện tại
      const lastThongSo = await prisma.thong_so.findFirst({
        orderBy: {
          id: "desc", // Sắp xếp ID giảm dần (ví dụ: TS05, TS04...)
        },
      });

      if (!lastThongSo) {
        payload.id = "TS01";
      } else {
        const currentNumber =
          parseInt(lastThongSo.id.replace(/\D/g, ""), 10) || 0;
        payload.id = `TS${String(currentNumber + 1).padStart(2, "0")}`;
      }
    }

    const data = this.extractThongSoData(payload);
    try {
      return await prisma.thong_so.create({
        data: data,
        include: {
          san_pham: true, // Lấy kèm thông tin sản phẩm sở hữu thông số này
        },
      });
    } catch (error) {
      // P2002: Vi phạm ràng buộc UNIQUE (Sản phẩm này đã có thông số kỹ thuật rồi)
      if (error.code === "P2002") {
        throw new Error("SAN_PHAM_DA_CO_THONG_SO");
      }
      // P2003: Vi phạm ràng buộc Khóa ngoại (id_san_pham không tồn tại trong bảng san_pham)
      if (error.code === "P2003") {
        throw new Error("ID_SAN_PHAM_KHONG_TON_TAI");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm thông số kỹ thuật theo mã thông số (id) hoặc mã sản phẩm (id_san_pham)
  async find(filterData) {
    const where = {};

    if (filterData.id) {
      where.id = filterData.id;
    }

    if (filterData.id_san_pham) {
      where.id_san_pham = filterData.id_san_pham;
    }

    return await prisma.thong_so.findMany({
      where: where,
      include: {
        san_pham: true,
      },
    });
  }

  // ==================== Cập nhật thông tin Thông Số dựa trên id ======================
  async update(id, payload) {
    const updateData = this.extractThongSoData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính (id)
    delete updateData.id_san_pham;
    
    try {
      const result = await prisma.thong_so.update({
        where: { id: id },
        data: updateData,
        include: {
          san_pham: true,
        },
      });
      return result;
    } catch (error) {
      // 1. Lỗi không tìm thấy bản ghi cần update => Mã lỗi của Prisma là P2025
      if (error.code === "P2025") {
        return null;
      }
      // 2. Lỗi gán id_san_pham mới bị trùng với một sản phẩm khác đã có thông số
      if (error.code === "P2002") {
        throw new Error("SAN_PHAM_DA_CO_THONG_SO");
      }
      // 3. Lỗi gán id_san_pham mới nhưng mã đó không tồn tại trong DB
      if (error.code === "P2003") {
        throw new Error("ID_SAN_PHAM_KHONG_TON_TAI");
      }
      throw error;
    }
  }

  // ======================== Xóa Thông Số dựa trên id ==============================
  async delete(id) {
    try {
      const result = await prisma.thong_so.delete({
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

  // ====================== Xóa tất cả các Thông Số ========================
  async deleteAll() {
    const result = await prisma.thong_so.deleteMany({});
    return result.count;
  }

  // ==================== Tìm một Thông Số dựa trên id ======================
  async findById(id) {
    return await prisma.thong_so.findUnique({
      where: { id: id },
      include: {
        san_pham: true,
      },
    });
  }
}

module.exports = ThongSoService;
