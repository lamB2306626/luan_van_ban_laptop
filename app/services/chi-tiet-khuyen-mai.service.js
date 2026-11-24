const prisma = require("../utils/prisma");

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

  async create(payload, externalTx = null) {
    const execute = async (tx) => {
      let items = [];
      if (Array.isArray(payload)) {
        items = payload;
      } else if (payload && Array.isArray(payload.ds_chi_tiet)) {
        items = payload.ds_chi_tiet;
      } else {
        items = [payload];
      }

      if (items.length === 0) return [];

      const results = [];

      try {
        const lastChiTiet = await tx.chi_tiet_khuyen_mai.findFirst({
          orderBy: { id: "desc" },
        });

        let currentNumber = lastChiTiet
          ? parseInt(lastChiTiet.id.replace(/\D/g, ""), 10) || 0
          : 0;

        for (const item of items) {
          if (!item.id || item.id.startsWith("CT_TEMP_")) {
            currentNumber += 1;
            item.id = `CTKM${String(currentNumber).padStart(4, "0")}`;
          }

          const cleanData = {
            id: item.id,
            id_dot_km: item.id_dot_km || payload.id_dot_km,
            id_san_pham: item.id_san_pham,
            loai_giam_gia: item.loai_giam_gia,
            gia_tri_giam: Number(item.gia_tri_giam),
          };

          const newDetail = await tx.chi_tiet_khuyen_mai.create({
            data: cleanData,
          });

          results.push(newDetail);
        }

        return Array.isArray(payload)
          ? results
          : payload.ds_chi_tiet
            ? results
            : results[0];
      } catch (error) {
        // 🌟 BẪY LỖI PRISMA TẠI ĐÂY ĐỂ TRUYỀN VỀ CONTROLLER

        // Mã P2003: Khóa ngoại không tồn tại (Sai id_dot_km hoặc id_san_pham)
        if (error.code === "P2003") {
          throw new Error("DOT_KHUYEN_MAI_HOAC_SAN_PHAM_KHONG_TON_TAI");
        }

        // Mã P2002: Vi phạm ràng buộc Unique (Trùng lặp cặp [id_dot_km, id_san_pham])
        if (error.code === "P2002") {
          throw new Error("SAN_PHAM_DA_CO_TRONG_DOT_KHUYEN_MAI");
        }

        // Ném lại các lỗi khác nếu có
        throw error;
      }
    };

    if (externalTx) {
      return await execute(externalTx);
    } else {
      return await prisma.$transaction(async (tx) => {
        return await execute(tx);
      });
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
