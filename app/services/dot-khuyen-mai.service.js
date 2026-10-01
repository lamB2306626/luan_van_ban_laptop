const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class DotKhuyenMaiService {
  // Lọc lấy các trường thuộc tính hợp lệ
  extractDotKhuyenMaiData(payload) {
    const dotKhuyenMai = {
      id: payload.id,
      ten_dot: payload.ten_dot,
      ngay_bat_dau: payload.ngay_bat_dau
        ? new Date(payload.ngay_bat_dau)
        : undefined,
      ngay_ket_thuc: payload.ngay_ket_thuc
        ? new Date(payload.ngay_ket_thuc)
        : undefined,
    };
    Object.keys(dotKhuyenMai).forEach(
      (key) => dotKhuyenMai[key] === undefined && delete dotKhuyenMai[key],
    );
    return dotKhuyenMai;
  }

  // 1. Tạo đợt khuyến mãi mới (Tự sinh mã DKM01, DKM02 nếu client không truyền id)
  async create(payload, tx) {
    const db = tx || prisma;

    if (!payload.id) {
      // Tìm đợt khuyến mãi có ID lớn nhất hiện tại
      const lastDot = await db.dot_khuyen_mai.findFirst({
        orderBy: {
          id: "desc",
        },
      });

      if (!lastDot) {
        payload.id = "DKM01";
      } else {
        const currentNumber = parseInt(lastDot.id.replace(/\D/g, ""), 10) || 0;
        payload.id = `DKM${String(currentNumber + 1).padStart(2, "0")}`;
      }
    }

    const data = this.extractDotKhuyenMaiData(payload);

    // Kiểm tra tính hợp lệ của ngày bắt đầu và ngày kết thúc
    if (
      data.ngay_bat_dau &&
      data.ngay_ket_thuc &&
      data.ngay_bat_dau > data.ngay_ket_thuc
    ) {
      throw new Error("NGAY_KET_THUC_PHAI_LON_HON_NGAY_BAT_DAU");
    }

    try {
      return await db.dot_khuyen_mai.create({
        data: data,
      });
    } catch (error) {
      if (error.code === "P2002") {
        throw new Error("DOT_KHUYEN_MAI_DA_TON_TAI");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm đợt khuyến mãi theo id hoặc ten_dot
  async find(filterData) {
    const where = {};

    if (filterData.id) {
      where.id = filterData.id;
    }

    if (filterData.ten_dot) {
      where.ten_dot = {
        contains: filterData.ten_dot,
        mode: "insensitive",
      };
    }

    // Xử lý lọc theo Thời gian hiệu lực
    const now = new Date();

    if (filterData.kha_dung === true) {
      // Đợt Khuyến mãi còn hạn & đã tới ngày bắt đầu: ngay_bat_dau <= now <= ngay_ket_thuc
      where.ngay_bat_dau = { lte: now };
      where.ngay_ket_thuc = { gte: now };
    } else if (filterData.kha_dung === false) {
      // Đợt Khuyến mãi đã hết hạn: ngay_ket_thuc < now
      where.ngay_ket_thuc = { lt: now };
    }

    if (filterData.tu_ngay || filterData.den_ngay) {
      // Tìm các phiếu có ngày bắt đầu nằm trong khoảng được chọn
      where.ngay_bat_dau = {
        ...(where.ngay_bat_dau || {}),
        ...(filterData.tu_ngay && { gte: new Date(filterData.tu_ngay) }),
        ...(filterData.den_ngay && { lte: new Date(filterData.den_ngay) }),
      };
    }

    return await prisma.dot_khuyen_mai.findMany({
      where: where,
      orderBy: {
        ngay_bat_dau: "desc",
      },
    });
  }

  // ==================== Cập nhật đợt khuyến mãi dựa trên id ======================
  async update(id, payload, tx) {
    const db = tx || prisma;
    const updateData = this.extractDotKhuyenMaiData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính

    // Nếu cập nhật cả 2 mốc thời gian -> kiểm tra tính hợp lệ
    if (
      updateData.ngay_bat_dau &&
      updateData.ngay_ket_thuc &&
      updateData.ngay_bat_dau > updateData.ngay_ket_thuc
    ) {
      throw new Error("NGAY_KET_THUC_PHAI_LON_HON_NGAY_BAT_DAU");
    }

    try {
      return await db.dot_khuyen_mai.update({
        where: { id: id },
        data: updateData,
      });
    } catch (error) {
      if (error.code === "P2025") {
        return null;
      }
      if (error.code === "P2002") {
        throw new Error("DOT_KHUYEN_MAI_DA_TON_TAI");
      }
      throw error;
    }
  }

  // ======================== Xóa đợt khuyến mãi dựa trên id ==============================
  async delete(id, tx) {
    const db = tx || prisma;
    try {
      return await db.dot_khuyen_mai.delete({
        where: { id: id },
      });
    } catch (error) {
      if (error.code === "P2025") {
        return null;
      }
      throw error;
    }
  }

  // ==================== Tìm một đợt khuyến mãi dựa trên id ======================
  async findById(id) {
    return await prisma.dot_khuyen_mai.findUnique({
      where: { id: id },
    });
  }
}

module.exports = DotKhuyenMaiService;
