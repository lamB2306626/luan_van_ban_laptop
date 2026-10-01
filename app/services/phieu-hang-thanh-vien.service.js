const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class PhieuHangThanhVienService {
  // Lọc lấy các trường thuộc tính hợp lệ của Phiếu Hạng Thành Viên
  extractPhieuHangThanhVienData(payload) {
    const phieuHangThanhVien = {
      id: payload.id,
      id_hang_thanh_vien: payload.id_hang_thanh_vien,
      id_phieu_giam_gia: payload.id_phieu_giam_gia,
    };
    Object.keys(phieuHangThanhVien).forEach(
      (key) =>
        phieuHangThanhVien[key] === undefined && delete phieuHangThanhVien[key],
    );
    return phieuHangThanhVien;
  }

  // 1. Thêm quy tắc tặng phiếu cho hạng thành viên (Tự sinh mã PHTV01, PHTV02...)
  async create(payload) {
    if (!payload.id) {
      // Tìm 1 bản ghi có ID lớn nhất hiện tại
      const lastPhieuHangThanhVien =
        await prisma.phieu_hang_thanh_vien.findFirst({
          orderBy: {
            id: "desc",
          },
        });

      if (!lastPhieuHangThanhVien) {
        payload.id = "PHTV01";
      } else {
        // Lấy phần số ra khỏi chuỗi (VD: "PHTV05" -> lấy số 5)
        const currentNumber =
          parseInt(lastPhieuHangThanhVien.id.replace(/\D/g, ""), 10) || 0;
        payload.id = `PHTV${String(currentNumber + 1).padStart(2, "0")}`;
      }
    }

    const data = this.extractPhieuHangThanhVienData(payload);
    try {
      return await prisma.phieu_hang_thanh_vien.create({
        data: data,
        include: {
          hang_thanh_vien: true,
          phieu_giam_gia: true,
        },
      });
    } catch (error) {
      // Lỗi vi phạm khóa ngoại (P2003): id_hang_thanh_vien hoặc id_phieu_giam_gia không tồn tại
      if (error.code === "P2003") {
        throw new Error("HANG_THANH_VIEN_HOAC_PHIEU_GIAM_GIA_KHONG_TON_TAI");
      }
      // Lỗi trùng lặp nếu có thiết lập @@unique([id_hang_thanh_vien, id_phieu_giam_gia])
      if (error.code === "P2002") {
        throw new Error("QUY_TAC_TANG_PHIEU_CHO_HANG_NAY_DA_TON_TAI");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm danh sách quy tắc tặng phiếu theo bộ lọc (id, id_hang_thanh_vien, id_phieu_giam_gia)
  async find(filterData) {
    const where = {};

    if (filterData.id) {
      where.id = filterData.id;
    }

    if (filterData.id_hang_thanh_vien) {
      where.id_hang_thanh_vien = filterData.id_hang_thanh_vien;
    }

    if (filterData.id_phieu_giam_gia) {
      where.id_phieu_giam_gia = filterData.id_phieu_giam_gia;
    }

    return await prisma.phieu_hang_thanh_vien.findMany({
      where: where,
      include: {
        hang_thanh_vien: true,
        phieu_giam_gia: true,
      },
      orderBy: {
        id: "desc",
      },
    });
  }

  // 3. Cập nhật thông tin quy tắc tặng phiếu dựa trên mã id
  async update(id, payload) {
    const updateData = this.extractPhieuHangThanhVienData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính (id)
    delete updateData.id_hang_thanh_vien;

    try {
      const result = await prisma.phieu_hang_thanh_vien.update({
        where: { id: id },
        data: updateData,
        include: {
          hang_thanh_vien: true,
          phieu_giam_gia: true,
        },
      });
      return result;
    } catch (error) {
      if (error.code === "P2025") {
        return null;
      }
      if (error.code === "P2003") {
        throw new Error("HANG_THANH_VIEN_HOAC_PHIEU_GIAM_GIA_KHONG_TON_TAI");
      }
      if (error.code === "P2002") {
        throw new Error("QUY_TAC_TANG_PHIEU_CHO_HANG_NAY_DA_TON_TAI");
      }
      throw error;
    }
  }

  // 4. Xóa một quy tắc tặng phiếu dựa trên mã id (Hard Delete)
  async delete(id) {
    try {
      const result = await prisma.phieu_hang_thanh_vien.delete({
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

  // 5. Xóa tất cả các quy tắc tặng phiếu
  async deleteAll() {
    try {
      const result = await prisma.phieu_hang_thanh_vien.deleteMany({});
      return result.count;
    } catch (error) {
      throw error;
    }
  }

  // 6. Tìm một quy tắc tặng phiếu dựa trên mã id
  async findById(id) {
    return await prisma.phieu_hang_thanh_vien.findUnique({
      where: { id: id },
      include: {
        hang_thanh_vien: true,
        phieu_giam_gia: true,
      },
    });
  }
}

module.exports = PhieuHangThanhVienService;
