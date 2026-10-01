const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class DiaChiService {
  // Lọc lấy các trường thuộc tính hợp lệ của Địa chỉ
  extractDiaChiData(payload) {
    const diaChi = {
      id: payload.id,
      id_khach_hang: payload.id_khach_hang,
      ten_nguoi_nhan: payload.ten_nguoi_nhan,
      sdt_nguoi_nhan: payload.sdt_nguoi_nhan,
      dia_chi: payload.dia_chi,
      la_mac_dinh:
        payload.la_mac_dinh !== undefined
          ? Boolean(payload.la_mac_dinh)
          : undefined,
    };
    Object.keys(diaChi).forEach(
      (key) => diaChi[key] === undefined && delete diaChi[key],
    );
    return diaChi;
  }

  // ==================== 1. Tạo Địa Chỉ mới (Tự sinh mã DC01, DC02...) ====================
  async create(payload) {
    if (!payload.id) {
      // Tìm 1 địa chỉ có ID lớn nhất hiện tại
      const lastDiaChi = await prisma.dia_chi.findFirst({
        orderBy: {
          id: "desc",
        },
      });

      if (!lastDiaChi) {
        payload.id = "DC01";
      } else {
        const currentNumber =
          parseInt(lastDiaChi.id.replace(/\D/g, ""), 10) || 0;
        payload.id = `DC${String(currentNumber + 1).padStart(2, "0")}`;
      }
    }

    const data = this.extractDiaChiData(payload);

    try {
      // Nếu địa chỉ mới được đánh dấu la_mac_dinh = true, reset các địa chỉ khác của khách hàng thành false
      if (data.la_mac_dinh) {
        await prisma.dia_chi.updateMany({
          where: { id_khach_hang: data.id_khach_hang },
          data: { la_mac_dinh: false },
        });
      }

      return await prisma.dia_chi.create({
        data: data,
        include: { khach_hang: true },
      });
    } catch (error) {
      // Lỗi vi phạm khóa ngoại (P2003): Khách hàng không tồn tại
      if (error.code === "P2003") {
        throw new Error("KHACH_HANG_KHONG_TON_TAI");
      }
      throw error;
    }
  }

  // ==================== 2. Tìm kiếm danh sách Địa Chỉ kết hợp bộ lọc ====================
  async find(filterData) {
    const where = {};

    if (filterData.id) where.id = filterData.id;
    if (filterData.id_khach_hang)
      where.id_khach_hang = filterData.id_khach_hang;
    if (filterData.sdt_nguoi_nhan)
      where.sdt_nguoi_nhan = filterData.sdt_nguoi_nhan;

    if (filterData.ten_nguoi_nhan) {
      where.ten_nguoi_nhan = {
        contains: filterData.ten_nguoi_nhan,
        mode: "insensitive",
      };
    }

    return await prisma.dia_chi.findMany({
      where: where,
      include: { khach_hang: true },
      orderBy: {
        la_mac_dinh: "desc", // Địa chỉ mặc định luôn lên đầu
      },
    });
  }

  // ==================== 3. Cập nhật Địa Chỉ dựa trên id ====================
  async update(id, payload) {
    const updateData = this.extractDiaChiData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính (id)

    try {
      // Lấy thông tin địa chỉ hiện tại để xác định id_khach_hang
      const currentDiaChi = await prisma.dia_chi.findUnique({
        where: { id: id },
      });

      if (!currentDiaChi) return null;

      // Nếu cập nhật địa chỉ này thành la_mac_dinh = true, reset các địa chỉ khác về false
      if (updateData.la_mac_dinh === true) {
        await prisma.dia_chi.updateMany({
          where: {
            id_khach_hang: currentDiaChi.id_khach_hang,
            id: { not: id },
          },
          data: { la_mac_dinh: false },
        });
      }

      return await prisma.dia_chi.update({
        where: { id: id },
        data: updateData,
        include: { khach_hang: true },
      });
    } catch (error) {
      if (error.code === "P2025") return null;
      if (error.code === "P2003") {
        throw new Error("KHACH_HANG_KHONG_TON_TAI");
      }
      throw error;
    }
  }

  // ==================== 4. Xóa một Địa Chỉ dựa trên id ====================
  async delete(id) {
    try {
      const result = await prisma.dia_chi.delete({
        where: { id: id },
      });
      return result;
    } catch (error) {
      if (error.code === "P2025") return null;
      // Lỗi vi phạm khóa ngoại nếu địa chỉ đã liên kết với Đơn hàng
      if (error.code === "P2003") {
        throw new Error("DIA_CHI_DANG_DUOC_SU_DUNG");
      }
      throw error;
    }
  }

  // ==================== 5. Xóa tất cả Địa Chỉ ====================
  async deleteAll() {
    try {
      const result = await prisma.dia_chi.deleteMany({});
      return result.count;
    } catch (error) {
      throw error;
    }
  }

  // ==================== 6. Tìm một Địa Chỉ dựa trên id ====================
  async findById(id) {
    return await prisma.dia_chi.findUnique({
      where: { id: id },
      include: { khach_hang: true },
    });
  }
}

module.exports = DiaChiService;
