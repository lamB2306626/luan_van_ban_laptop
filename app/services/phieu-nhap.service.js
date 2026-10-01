const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class PhieuNhapService {
  // Lọc lấy các trường thuộc tính hợp lệ
  extractPhieuNhapData(payload) {
    const phieuNhap = {
      id: payload.id,
      // id_ncc: payload.id_ncc,
      id_nhan_vien: payload.id_nhan_vien,
      tong_tien:
        payload.tong_tien !== undefined ? Number(payload.tong_tien) : undefined,
      ngay_nhap: payload.ngay_nhap ? new Date(payload.ngay_nhap) : undefined,
    };
    Object.keys(phieuNhap).forEach(
      (key) => phieuNhap[key] === undefined && delete phieuNhap[key],
    );
    return phieuNhap;
  }

  // 1. Tạo Phiếu Nhập mới (Tự sinh mã PN01, PN02 nếu client không truyền id)
  async create(payload) {
    if (!payload.id) {
      // Tìm 1 Phiếu Nhập có ID lớn nhất hiện tại
      const lastPhieuNhap = await prisma.phieu_nhap.findFirst({
        orderBy: {
          id: "desc", // Sắp xếp ID giảm dần (ví dụ: PN05, PN04, PN03...)
        },
      });

      if (!lastPhieuNhap) {
        // Nếu database chưa có Phiếu Nhập nào
        payload.id = "PN01";
      } else {
        // Lấy phần số ra khỏi chuỗi (VD: "PN05" -> lấy số 5)
        const currentNumber =
          parseInt(lastPhieuNhap.id.replace(/\D/g, ""), 10) || 0;
        // Cộng thêm 1 và format lại thành chuỗi PN06
        payload.id = `PN${String(currentNumber + 1).padStart(2, "0")}`;
      }
    }

    const data = this.extractPhieuNhapData(payload);
    try {
      return await prisma.phieu_nhap.create({
        data: data,
        include: {
          // nha_cung_cap: true,
          nhan_vien: true,
        },
      });
    } catch (error) {
      // Mã P2003: Lỗi vi phạm khóa ngoại (id_ncc hoặc id_nhan_vien không tồn tại)
      if (error.code === "P2003") {
        throw new Error("KHOA_NGOAI_KHONG_TON_TAI");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm Phiếu Nhập theo mã (id), mã nhà cung cấp (id_ncc) hoặc mã nhân viên (id_nhan_vien)
  async find(filterData) {
    const where = {};

    // Tìm kiếm chính xác theo mã phiếu nhập
    if (filterData.id) {
      where.id = filterData.id;
    }

    // Tìm kiếm theo mã nhà cung cấp
    // if (filterData.id_ncc) {
    //   where.id_ncc = filterData.id_ncc;
    // }

    // Tìm kiếm theo mã nhân viên lập phiếu
    // if (filterData.id_nhan_vien) {
    //   where.id_nhan_vien = filterData.id_nhan_vien;
    // }

    if (filterData.tu_ngay || filterData.den_ngay) {
      // Tìm các phiếu có ngày bắt đầu nằm trong khoảng được chọn
      where.ngay_nhap = {
        ...(where.ngay_nhap || {}),
        ...(filterData.tu_ngay && { gte: new Date(filterData.tu_ngay) }),
        ...(filterData.den_ngay && { lte: new Date(filterData.den_ngay) }),
      };
    }

    return await prisma.phieu_nhap.findMany({
      where: where,
      include: {
        // nha_cung_cap: true,
        nhan_vien: true,
      },
    });
  }

  // ==================== Cập nhật thông tin một Phiếu Nhập dựa trên id ======================
  async update(id, payload) {
    const updateData = this.extractPhieuNhapData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính (id)
    delete updateData.tong_tien; // Không cho phép cập nhật tổng tiền vì được tính tự động

    try {
      const result = await prisma.phieu_nhap.update({
        where: { id: id },
        data: updateData,
        include: {
          // nha_cung_cap: true,
          nhan_vien: true,
        },
      });
      return result;
    } catch (error) {
      // 1. Không tìm thấy bản ghi cần update => Mã lỗi của Prisma là P2025
      if (error.code === "P2025") {
        return null;
      }
      // 2. Lỗi vi phạm khóa ngoại
      if (error.code === "P2003") {
        throw new Error("KHOA_NGOAI_KHONG_TON_TAI");
      }
      throw error;
    }
  }

  // ======================== Xóa Phiếu Nhập dựa trên id ==============================
  async delete(id) {
    try {
      const result = await prisma.phieu_nhap.delete({
        where: { id: id },
      });
      return result;
    } catch (error) {
      // Không tìm thấy bản ghi cần xóa
      if (error.code === "P2025") {
        return null;
      }
      throw error;
    }
  }

  // ====================== Xóa tất cả các Phiếu Nhập ========================
  async deleteAll() {
    try {
      const result = await prisma.phieu_nhap.deleteMany({});
      return result.count; // Trả về số lượng phiếu nhập đã bị xóa
    } catch (error) {
      throw error;
    }
  }

  // ==================== Tìm một Phiếu Nhập dựa trên id ======================
  async findById(id) {
    return await prisma.phieu_nhap.findUnique({
      where: { id: id },
      include: {
        // nha_cung_cap: true,
        nhan_vien: true,
      },
    });
  }
}

module.exports = PhieuNhapService;
