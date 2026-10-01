const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class PhieuGiamGiaService {
  // Lọc lấy các trường thuộc tính hợp lệ của Phiếu Giảm Giá
  extractPhieuGiamGiaData(payload) {
    const phieuGiamGia = {
      id: payload.id,
      ten_phieu: payload.ten_phieu,
      loai_phieu: payload.loai_phieu,
      gia_tri_giam:
        payload.gia_tri_giam !== undefined
          ? parseFloat(payload.gia_tri_giam)
          : undefined,
      don_toi_thieu:
        payload.don_toi_thieu !== undefined
          ? parseFloat(payload.don_toi_thieu)
          : undefined,
      giam_toi_da:
        payload.giam_toi_da !== undefined
          ? parseFloat(payload.giam_toi_da)
          : undefined,
      ngay_bat_dau: payload.ngay_bat_dau
        ? new Date(payload.ngay_bat_dau)
        : undefined,
      ngay_het_han: payload.ngay_het_han
        ? new Date(payload.ngay_het_han)
        : undefined,
      trang_thai: payload.trang_thai,
    };
    Object.keys(phieuGiamGia).forEach(
      (key) => phieuGiamGia[key] === undefined && delete phieuGiamGia[key],
    );
    return phieuGiamGia;
  }

  //1. Tạo phiếu giảm giá mới (Tự sinh mã PGG01, PGG02 nếu client không truyền id)
  async create(payload) {
    if (!payload.id) {
      // Tìm 1 phiếu giảm giá có ID lớn nhất hiện tại
      const lastPhieu = await prisma.phieu_giam_gia.findFirst({
        orderBy: {
          id: "desc",
        },
      });

      if (!lastPhieu) {
        payload.id = "PGG01";
      } else {
        const currentNumber =
          parseInt(lastPhieu.id.replace(/\D/g, ""), 10) || 0;
        payload.id = `PGG${String(currentNumber + 1).padStart(2, "0")}`;
      }
    }

    const data = this.extractPhieuGiamGiaData(payload);
    try {
      return await prisma.phieu_giam_gia.create({
        data: data,
      });
    } catch (error) {
      if (error.code === "P2002") {
        throw new Error("TEN_PHIEU_DA_TON_TAI");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm phiếu giảm giá theo mã (id), tên (ten_phieu), loại, trạng thái, hoặc khả dụng
  async find(filterData) {
    const where = {};

    if (filterData.id) {
      where.id = filterData.id;
    }

    if (filterData.ten_phieu) {
      where.ten_phieu = {
        contains: filterData.ten_phieu,
        mode: "insensitive",
      };
    }

    if (filterData.loai_phieu) {
      where.loai_phieu = filterData.loai_phieu;
    }

    if (filterData.trang_thai !== undefined) {
      where.trang_thai = filterData.trang_thai;
    }

    // Xử lý lọc theo Thời gian hiệu lực
    const now = new Date();

    if (filterData.kha_dung === true) {
      // Phiếu còn hạn & đã tới ngày bắt đầu: ngay_bat_dau <= now <= ngay_het_han
      where.ngay_bat_dau = { lte: now };
      where.ngay_het_han = { gte: now };
    } else if (filterData.kha_dung === false) {
      // Phiếu đã hết hạn: ngay_het_han < now
      where.ngay_het_han = { lt: now };
    }

    if (filterData.tu_ngay || filterData.den_ngay) {
      // Tìm các phiếu có ngày bắt đầu nằm trong khoảng được chọn
      where.ngay_bat_dau = {
        ...(where.ngay_bat_dau || {}),
        ...(filterData.tu_ngay && { gte: new Date(filterData.tu_ngay) }),
        ...(filterData.den_ngay && { lte: new Date(filterData.den_ngay) }),
      };
    }

    return await prisma.phieu_giam_gia.findMany({
      where: where,
      orderBy: {
        ngay_bat_dau: "desc",
      },
    });
  }

  // ==================== Cập nhật thông tin một Phiếu Giảm Giá dựa trên id ======================
  async update(id, payload) {
    const updateData = this.extractPhieuGiamGiaData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính (id)

    try {
      const result = await prisma.phieu_giam_gia.update({
        where: { id: id },
        data: updateData,
      });
      return result;
    } catch (error) {
      if (error.code === "P2025") {
        return null;
      }
      if (error.code === "P2002") {
        throw new Error("TEN_PHIEU_DA_TON_TAI");
      }
      throw error;
    }
  }

  // ======================== Xóa (Vô hiệu hóa) Phiếu Giảm Giá dựa trên id  ==============================
  async delete(id) {
    try {
      const result = await prisma.phieu_giam_gia.update({
        where: { id: id },
        data: { trang_thai: false },
      });
      return result;
    } catch (error) {
      if (error.code === "P2025") {
        return null;
      }
      throw error;
    }
  }

  // ========================  Bật Phiếu Giảm Giá dựa trên id  ==============================
  async restore(id) {
    try {
      const result = await prisma.phieu_giam_gia.update({
        where: { id: id },
        data: { trang_thai: true },
      });
      return result;
    } catch (error) {
      if (error.code === "P2025") {
        return null;
      }
      throw error;
    }
  }

  // ====================== Xóa (Vô hiệu hóa) tất cả các Phiếu Giảm Giá đang bật ========================
  async deleteAll() {
    try {
      const result = await prisma.phieu_giam_gia.updateMany({
        where: {
          trang_thai: true, // Chỉ vô hiệu hóa những phiếu đang hoạt động
        },
        data: {
          trang_thai: false,
        },
      });
      return result.count;
    } catch (error) {
      throw error;
    }
  }

  // ==================== Tìm một Phiếu Giảm Giá dựa trên id ======================
  async findById(id) {
    return await prisma.phieu_giam_gia.findUnique({
      where: { id: id },
    });
  }
}

module.exports = PhieuGiamGiaService;
