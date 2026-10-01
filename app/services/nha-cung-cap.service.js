const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class NhaCungCapService {
  // Lọc lấy các trường thuộc tính hợp lệ
  extractNhaCungCapData(payload) {
    const nhaCungCap = {
      id: payload.id,
      ten_ncc: payload.ten_ncc,
      so_dien_thoai: payload.so_dien_thoai,
      dia_chi: payload.dia_chi,
      email: payload.email,
    };
    Object.keys(nhaCungCap).forEach(
      (key) => nhaCungCap[key] === undefined && delete nhaCungCap[key],
    );
    return nhaCungCap;
  }

  // 1. Tạo nhà cung cấp mới (Tự sinh mã DM01, DM02 nếu client không truyền id)
  async create(payload) {
    if (!payload.id) {
      // Tìm 1 nhà cung cấp có ID lớn nhất hiện tại
      const lastNhaCungCap = await prisma.nha_cung_cap.findFirst({
        orderBy: {
          id: "desc", // Sắp xếp ID giảm dần (ví dụ: DM05, DM04, DM03...)
        },
      });

      if (!lastNhaCungCap) {
        // Nếu database chưa có nhà cung cấp nào
        payload.id = "NCC01";
      } else {
        // Lấy phần số ra khỏi chuỗi (VD: "DM05" -> lấy số 5)
        const currentNumber =
          parseInt(lastNhaCungCap.id.replace(/\D/g, ""), 10) || 0;
        // Cộng thêm 1 và format lại thành chuỗi DM06
        payload.id = `NCC${String(currentNumber + 1).padStart(2, "0")}`;
      }
    }

    const data = this.extractNhaCungCapData(payload);
    try {
      return await prisma.nha_cung_cap.create({
        data: data,
      });
    } catch (error) {
      // Mã P2002 của Prisma đại diện cho lỗi vi phạm ràng buộc UNIQUE
      if (error.code === "P2002") {
        throw new Error("TEN_NHA_CUNG_CAP_DA_TON_TAI");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm nhà cung cấp theo mã (id) hoặc tên (ten_nha_cung_cap)
  async find(filterData) {
    const where = {};

    // Tìm kiếm chính xác theo mã
    if (filterData.id) {
      where.id = filterData.id;
    }

    // Tìm kiếm gần đúng (chứa từ khóa, không phân biệt hoa thường) theo tên
    if (filterData.ten_nha_cung_cap) {
      where.ten_ncc = {
        contains: filterData.ten_nha_cung_cap,
        mode: "insensitive",
      };
    }

    return await prisma.nha_cung_cap.findMany({
      where: where,
    });
  }

  // ==================== Cập nhật thông tin một Nhà Cung Cấp dựa trên id ======================
  async update(id, payload) {
    const updateData = this.extractNhaCungCapData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính (id)

    try {
      const result = await prisma.nha_cung_cap.update({
        where: { id: id },
        data: updateData,
      });
      return result;
    } catch (error) {
      // 1. Lỗi không tìm thấy bản ghi cần update => Mã lỗi của Prisima là P2025
      if (error.code === "P2025") {
        return null;
      }
      // 2. Lỗi bị trùng tên nhà cung cấp với bản ghi khác (UNIQUE constraint) => Mã lỗi là 2002
      if (error.code === "P2002") {
        throw new Error("TEN_NHA_CUNG_CAP_DA_TON_TAI");
      }
      throw error;
    }
  }

  // ======================== Xóa Nhà Cung Cấp dựa trên id ==============================
  async delete(id) {
    try {
      const result = await prisma.nha_cung_cap.delete({
        where: { id: id },
      });
      return result;
    } catch (error) {
      // 1. Nếu không tìm thấy bản ghi cần xóa
      if (error.code === "P2025") {
        return null;
      }
      // 2. Lỗi vi phạm khóa ngoại (P2003): Nhà cung cấp đang nằm trong Phiếu nhập
      if (error.code === "P2003") {
        throw new Error("NHA_CUNG_CAP_DANG_CO_PHIEU_NHAP");
      }
      throw error;
    }
  }

  // ====================== Xóa tất cả các Nhà Cung Cấp chưa có Phiếu Nhập ========================
  async deleteAll() {
    try {
      // Chỉ xóa các nhà cung cấp KHÔNG nằm trong phiếu nhập nào
      const result = await prisma.nha_cung_cap.deleteMany({
        where: {
          phieu_nhap: {
            none: {},
          },
        },
      });
      return result.count; // Trả về số lượng nhà cung cấp hợp lệ đã bị xóa
    } catch (error) {
      throw error;
    }
  }
  // ==================== Tìm một Nhà Cung Cấp dựa trên id ======================
  async findById(id) {
    return await prisma.nha_cung_cap.findUnique({
      where: { id: id },
    });
  }
}

module.exports = NhaCungCapService;
