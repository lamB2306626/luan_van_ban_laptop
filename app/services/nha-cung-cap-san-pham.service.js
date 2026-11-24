const prisma = require("../utils/prisma");

class NhaCungCapSanPhamService {
  extractData(payload) {
    const data = {
      id: payload.id,
      id_nha_cc: payload.id_nha_cc,
      id_san_pham: payload.id_san_pham,
      gia_nhap: payload.gia_nhap,
      ghi_chu: payload.ghi_chu,
    };
    Object.keys(data).forEach(
      (key) => data[key] === undefined && delete data[key],
    );
    return data;
  }

  // Helper tự sinh mã id tiếp theo nếu bạn thích dùng chuỗi (NCCSP01, NCCSP02...)
  // Nếu bạn dùng Int tự tăng (autoincrement) ở Prisma thì có thể bỏ qua hàm này.
  async generateNextId(tx = prisma) {
    const lastRecord = await tx.nha_cung_cap_san_pham.findFirst({
      orderBy: { id: "desc" },
    });

    if (!lastRecord) return "NCCSP01";
    const currentNumber =
      parseInt(String(lastRecord.id).replace(/\D/g, ""), 10) || 0;
    return `NCCSP${String(currentNumber + 1).padStart(2, "0")}`;
  }

  // ==================== 1. Thêm liên kết ====================
  async create(payload, tx) {
    const db = tx || prisma;

    // Trường hợp 1: Thêm danh sách nhiều nhà cung cấp cho 1 sản phẩm cùng lúc
    if (
      Array.isArray(payload.danh_sach_nha_cung_cap) &&
      payload.danh_sach_nha_cung_cap.length > 0 &&
      payload.id_san_pham
    ) {
      const records = payload.danh_sach_nha_cung_cap.map((item) => ({
        id_san_pham: payload.id_san_pham,
        id_nha_cc: typeof item === "string" ? item : item.id_nha_cc,
        gia_nhap: typeof item === "object" ? item.gia_nhap : undefined,
        ghi_chu: typeof item === "object" ? item.ghi_chu : undefined,
      }));

      try {
        const result = await db.nha_cung_cap_san_pham.createMany({
          data: records,
          skipDuplicates: true,
        });

        if (result.count === 0) {
          throw new Error("TAT_CA_LIEN_KET_DA_TON_TAI_TRUOC_DO");
        }
        return { totalCreated: result.count };
      } catch (error) {
        if (error.code === "P2003") {
          throw new Error("NHA_CUNG_CAP_HOAC_SAN_PHAM_KHONG_TON_TAI");
        }
        throw error;
      }
    }

    // Trường hợp 2: Thêm một liên kết đơn lẻ
    const data = this.extractData(payload);
    try {
      return await db.nha_cung_cap_san_pham.create({
        data,
        include: {
          nha_cung_cap: true,
          san_pham: true,
        },
      });
    } catch (error) {
      if (error.code === "P2003") {
        throw new Error("NHA_CUNG_CAP_HOAC_SAN_PHAM_KHONG_TON_TAI");
      }
      if (error.code === "P2002") {
        throw new Error("SAN_PHAM_DA_CO_NHA_CUNG_CAP_NAY");
      }
      throw error;
    }
  }

  // ==================== 2. Lấy danh sách (Bộ lọc) ====================
  async find(filterData) {
    const where = {};

    if (filterData.id) where.id = filterData.id;
    if (filterData.id_nha_cc) where.id_nha_cc = filterData.id_nha_cc;
    if (filterData.id_san_pham) where.id_san_pham = filterData.id_san_pham;

    return await prisma.nha_cung_cap_san_pham.findMany({
      where,
      include: {
        nha_cung_cap: true,
        san_pham: true,
      },
    });
  }

  // ==================== 3. Cập nhật theo ID ====================
  async update(id, payload) {
    const updateData = this.extractData(payload);
    delete updateData.id; // Không cho sửa khóa chính

    try {
      return await prisma.nha_cung_cap_san_pham.update({
        where: { id },
        data: updateData,
        include: {
          nha_cung_cap: true,
          san_pham: true,
        },
      });
    } catch (error) {
      if (error.code === "P2025") return null;
      if (error.code === "P2003") {
        throw new Error("NHA_CUNG_CAP_HOAC_SAN_PHAM_KHONG_TON_TAI");
      }
      if (error.code === "P2002") {
        throw new Error("SAN_PHAM_DA_CO_NHA_CUNG_CAP_NAY");
      }
      throw error;
    }
  }

  // ==================== 4. Xóa theo ID ====================
  async delete(id) {
    try {
      return await prisma.nha_cung_cap_san_pham.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === "P2025") return null;
      throw error;
    }
  }

  // ==================== 5. Xóa tất cả ====================
  async deleteAll() {
    const result = await prisma.nha_cung_cap_san_pham.deleteMany({});
    return result.count;
  }

  // ==================== 6. Tìm một bản ghi theo ID ====================
  async findById(id) {
    return await prisma.nha_cung_cap_san_pham.findUnique({
      where: { id },
      include: {
        nha_cung_cap: true,
        san_pham: true,
      },
    });
  }
}

module.exports = NhaCungCapSanPhamService;
