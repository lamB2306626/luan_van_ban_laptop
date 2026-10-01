const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class ChiTietKhuyenMaiService {
  // Lọc lấy các trường thuộc tính hợp lệ
  extractChiTietKMData(payload) {
    const chiTiet = {
      id: payload.id,
      id_dot_km: payload.id_dot_km,
      id_san_pham: payload.id_san_pham,
      loai_giam_gia: payload.loai_giam_gia,
      gia_tri_giam:
        payload.gia_tri_giam !== undefined
          ? Number(payload.gia_tri_giam)
          : undefined,
    };
    Object.keys(chiTiet).forEach(
      (key) => chiTiet[key] === undefined && delete chiTiet[key],
    );
    return chiTiet;
  }

  // 1. Thêm chi tiết khuyến mãi mới (Tự sinh mã CTKM01, CTKM02...)
  async create(payload, tx) {
    const db = tx || prisma;
    // Trường hợp 1: Thêm hàng loạt sản phẩm vào đợt khuyến mãi
    if (
      Array.isArray(payload.danh_sach_id_san_pham) &&
      payload.danh_sach_id_san_pham.length > 0
    ) {
      const executeBatch = async (transactionClient) => {
        const lastRecord =
          await transactionClient.chi_tiet_khuyen_mai.findFirst({
            orderBy: { id: "desc" },
          });

        let startNum = lastRecord
          ? parseInt(lastRecord.id.replace(/\D/g, ""), 10) || 0
          : 0;

        const records = payload.danh_sach_id_san_pham.map((idSanPham) => {
          startNum += 1;
          return {
            id: `CTKM${String(startNum).padStart(2, "0")}`,
            id_dot_km: payload.id_dot_km,
            id_san_pham: idSanPham,
            loai_giam_gia: payload.loai_giam_gia,
            gia_tri_giam: Number(payload.gia_tri_giam),
          };
        });

        try {
          const result = await transactionClient.chi_tiet_khuyen_mai.createMany(
            {
              data: records,
            },
          );

          return {
            totalCreated: result.count,
          };
        } catch (error) {
          if (error.code === "P2003") {
            throw new Error("DOT_KHUYEN_MAI_HOAC_SAN_PHAM_KHONG_TON_TAI");
          }
          if (error.code === "P2002") {
            throw new Error("SAN_PHAM_DA_CO_TRONG_DOT_KHUYEN_MAI");
          }
          throw error;
        }
      };

      // Nếu có tx truyền từ ngoài thì dùng luôn, không thì tự tạo $transaction
      return tx
        ? await executeBatch(tx)
        : await prisma.$transaction(executeBatch);
    }

    // Trường hợp 2: Thêm 1 sản phẩm cụ thể
    if (!payload.id) {
      const lastChiTiet = await db.chi_tiet_khuyen_mai.findFirst({
        orderBy: { id: "desc" },
      });
      const currentNumber = lastChiTiet
        ? parseInt(lastChiTiet.id.replace(/\D/g, ""), 10) || 0
        : 0;
      payload.id = `CTKM${String(currentNumber + 1).padStart(2, "0")}`;
    }

    const data = this.extractChiTietKMData(payload);

    try {
      return await db.chi_tiet_khuyen_mai.create({
        data: data,
        include: {
          dot_khuyen_mai: true,
          san_pham: true,
        },
      });
    } catch (error) {
      if (error.code === "P2003") {
        throw new Error("DOT_KHUYEN_MAI_HOAC_SAN_PHAM_KHONG_TON_TAI");
      }
      if (error.code === "P2002") {
        throw new Error("SAN_PHAM_DA_CO_TRONG_DOT_KHUYEN_MAI");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm danh sách chi tiết khuyến mãi theo bộ lọc (id, id_dot_km, id_san_pham)
  async find(filterData) {
    const where = {};

    if (filterData.id) {
      where.id = filterData.id;
    }

    if (filterData.id_dot_km) {
      where.id_dot_km = filterData.id_dot_km;
    }

    if (filterData.id_san_pham) {
      where.id_san_pham = filterData.id_san_pham;
    }

    return await prisma.chi_tiet_khuyen_mai.findMany({
      where: where,
      include: {
        dot_khuyen_mai: true,
        san_pham: true,
      },
    });
  }

  // 3. Cập nhật chi tiết khuyến mãi theo mã id
  async update(id, payload, tx) {
    const db = tx || prisma;
    const updateData = this.extractChiTietKMData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính
    delete updateData.id_dot_km;

    try {
      return await db.chi_tiet_khuyen_mai.update({
        where: { id: id },
        data: updateData,
        include: {
          dot_khuyen_mai: true,
          san_pham: true,
        },
      });
    } catch (error) {
      if (error.code === "P2025") {
        return null;
      }
      if (error.code === "P2003") {
        throw new Error("DOT_KHUYEN_MAI_HOAC_SAN_PHAM_KHONG_TON_TAI");
      }
      if (error.code === "P2002") {
        throw new Error("SAN_PHAM_DA_CO_TRONG_DOT_KHUYEN_MAI");
      }
      throw error;
    }
  }

  // 4. Xóa một chi tiết khuyến mãi dựa trên mã id
  async delete(id, tx) {
    const db = tx || prisma;
    try {
      return await db.chi_tiet_khuyen_mai.delete({
        where: { id: id },
      });
    } catch (error) {
      if (error.code === "P2025") {
        return null;
      }
      throw error;
    }
  }

  // 5. Xóa tất cả các chi tiết khuyến mãi (theo mã đợt khuyến mãi)
  async deleteByDotKm(id_dot_km, tx) {
    const db = tx || prisma;
    const result = await db.chi_tiet_khuyen_mai.deleteMany({
      where: { id_dot_km: id_dot_km },
    });
    return result.count;
  }

  // 6. Tìm một chi tiết khuyến mãi dựa trên mã id
  async findById(id) {
    return await prisma.chi_tiet_khuyen_mai.findUnique({
      where: { id: id },
      include: {
        dot_khuyen_mai: true,
        san_pham: true,
      },
    });
  }
}

module.exports = ChiTietKhuyenMaiService;
