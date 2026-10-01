const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class BienTheService {
  // Lọc lấy các trường thuộc tính hợp lệ
  extractBienTheData(payload) {
    const bienThe = {
      id: payload.id,
      id_san_pham: payload.id_san_pham,
      id_mau_sac: payload.id_mau_sac,
      id_cpu: payload.id_cpu,
      id_gpu: payload.id_gpu,
      id_ram: payload.id_ram,
      id_rom: payload.id_rom,
      gia: payload.gia !== undefined ? Number(payload.gia) : undefined,
      so_luong:
        payload.so_luong !== undefined
          ? parseInt(payload.so_luong, 10)
          : undefined,
      duong_dan_anh: payload.duong_dan_anh,
      trang_thai: payload.trang_thai,
    };
    Object.keys(bienThe).forEach(
      (key) => bienThe[key] === undefined && delete bienThe[key],
    );
    return bienThe;
  }

  // ==================== Hàm Helper: Tính toán giá khuyến mãi cho 1 biến thể ====================
  tinhGiaKhuyenMai(bienThe) {
    const giaGoc = Number(bienThe.gia);
    const listKhuyenMai = bienThe.san_pham?.chi_tiet_khuyen_mai || [];

    let giaGiamMax = 0;

    // Tính thử số tiền giảm của từng khuyến mãi để tìm cái cao nhất
    for (const km of listKhuyenMai) {
      const giaTriGiam = Number(km.gia_tri_giam);
      let giaGiamHienTai = 0;

      if (km.loai_giam_gia === "PHAN_TRAM") {
        giaGiamHienTai = (giaGoc * giaTriGiam) / 100;
      } else if (km.loai_giam_gia === "CO_DINH") {
        giaGiamHienTai = giaTriGiam;
      }

      // Lưu lại mức giảm lớn nhất
      if (giaGiamHienTai > giaGiamMax) {
        giaGiamMax = giaGiamHienTai;
      }
    }
    
    const donGiaApDung = Math.max(0, giaGoc - giaGiamMax);

    const { chi_tiet_khuyen_mai, ...dataBienThe } = bienThe;

    return {
      ...dataBienThe,
      don_gia_ap_dung: donGiaApDung,
    };
  }

  // ==================== HELPER: Trừ tồn kho biến thể ====================
  async giamSoLuongTonKho(idBienThe, soLuongGiam, tx) {
    const db = tx || prisma;
    return await db.bien_the.update({
      where: { id: idBienThe },
      data: {
        so_luong: {
          decrement: Number(soLuongGiam),
        },
      },
    });
  }

  // ==================== HELPER: Cộng trả lại tồn kho ====================
  async tangSoLuongTonKho(idBienThe, soLuongTang, tx) {
    const db = tx || prisma;
    return await db.bien_the.update({
      where: { id: idBienThe },
      data: {
        so_luong: {
          increment: Number(soLuongTang),
        },
      },
    });
  }

  // 1. Tạo biến thể mới (Tự sinh mã BT01, BT02 nếu client không truyền id)
  async create(payload) {
    if (!payload.id) {
      // Tìm 1 biến thể có ID lớn nhất hiện tại
      const lastBienThe = await prisma.bien_the.findFirst({
        orderBy: {
          id: "desc", // Sắp xếp ID giảm dần (ví dụ: BT05, BT04, BT03...)
        },
      });

      if (!lastBienThe) {
        // Nếu database chưa có biến thể nào
        payload.id = "BT01";
      } else {
        // Lấy phần số ra khỏi chuỗi (VD: "BT05" -> lấy số 5)
        const currentNumber =
          parseInt(lastBienThe.id.replace(/\D/g, ""), 10) || 0;
        // Cộng thêm 1 và format lại thành chuỗi BT06
        payload.id = `BT${String(currentNumber + 1).padStart(2, "0")}`;
      }
    }

    const data = this.extractBienTheData(payload);
    try {
      return await prisma.bien_the.create({
        data: data,
        include: {
          san_pham: true, // Trả về kèm thông tin sản phẩm liên kết
          mau_sac: true,
          cpu: true,
          gpu: true,
          dung_luong_ram: true,
          dung_luong_rom: true,
        },
      });
    } catch (error) {
      // Lỗi vi phạm khóa ngoại (P2003): id_san_pham truyền vào không tồn tại
      if (error.code === "P2003") {
        throw new Error("KHOA_NGOAI_KHONG_TON_TAI");
      }
      // Lỗi vi phạm ràng buộc unique
      if (error.code === "P2002") {
        throw new Error("BIEN_THE_DA_TON_TAI");
      }
      throw error;
    }
  }

  // ==================== 2. Tìm kiếm biến thể theo bộ lọc ====================
  async find(filterData, tx) {
    const db = tx || prisma; // Ưu tiên dùng Transaction Client nếu có
    const where = {};
    const now = new Date();

    if (filterData.id) {
      where.id = filterData.id;
    }

    // Lọc theo mảng danh sách ID biến thể
    if (
      Array.isArray(filterData.danh_sach_id) &&
      filterData.danh_sach_id.length > 0
    ) {
      where.id = { in: filterData.danh_sach_id };
    }

    if (filterData.id_san_pham) {
      where.id_san_pham = filterData.id_san_pham;
    }

    if (filterData.trang_thai !== undefined) {
      where.trang_thai = filterData.trang_thai;
    }

    if (filterData.id_cpu) where.id_cpu = filterData.id_cpu;
    if (filterData.id_gpu) where.id_gpu = filterData.id_gpu;
    if (filterData.id_ram) where.id_ram = filterData.id_ram;
    if (filterData.id_rom) where.id_rom = filterData.id_rom;

    const bienTheList = await db.bien_the.findMany({
      where: where,
      include: {
        san_pham: {
          include: {
            chi_tiet_khuyen_mai: {
              where: {
                dot_khuyen_mai: {
                  ngay_bat_dau: { lte: now },
                  ngay_ket_thuc: { gte: now },
                },
              },
              include: {
                dot_khuyen_mai: true,
              },
            },
          },
        },
        mau_sac: true,
        cpu: true,
        gpu: true,
        dung_luong_ram: true,
        dung_luong_rom: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return bienTheList.map((bienThe) => this.tinhGiaKhuyenMai(bienThe));
  }

  // ==================== Cập nhật thông tin một Biến Thể dựa trên id ======================
  async update(id, payload) {
    const updateData = this.extractBienTheData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính (id)
    delete updateData.id_san_pham;
    try {
      const result = await prisma.bien_the.update({
        where: { id: id },
        data: updateData,
        include: {
          san_pham: true,
          mau_sac: true,
          cpu: true,
          gpu: true,
          dung_luong_ram: true,
          dung_luong_rom: true,
        },
      });
      return result;
    } catch (error) {
      // 1. Lỗi không tìm thấy bản ghi cần update => Mã lỗi của Prisma là P2025
      if (error.code === "P2025") {
        return null;
      }
      // 2. Lỗi truyền mã id_san_pham mới không tồn tại
      if (error.code === "P2003") {
        throw new Error("KHOA_NGOAI_KHONG_TON_TAI");
      }
      // 3. Lỗi vi phạm ràng buộc unique
      if (error.code === "P2002") {
        throw new Error("BIEN_THE_DA_TON_TAI");
      }
      throw error;
    }
  }

  // ======================== Xóa (khóa) Biến Thể dựa trên id ==============================
  async delete(id) {
    try {
      // Đổi từ prisma.bien_the.delete sang update trang_thai -> false
      const result = await prisma.bien_the.update({
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

  // Khôi phục Biến Thể (chỉ cho phép nếu Sản Phẩm cha đang hoạt động)
  async restore(id) {
    try {
      // 1. Tìm biến thể kèm theo trạng thái của Sản phẩm cha
      const bienThe = await prisma.bien_the.findUnique({
        where: { id: id },
        include: {
          san_pham: {
            select: { trang_thai: true },
          },
        },
      });

      // Nếu không tìm thấy biến thể
      if (!bienThe) {
        return null;
      }

      // 2. Kiểm tra nếu Sản phẩm cha đang bị vô hiệu hóa (false)
      if (!bienThe.san_pham?.trang_thai) {
        throw new Error("SAN_PHAM_DANG_NGUNG_KINH_DOANH");
      }

      // 3. Khôi phục trạng thái biến thể thành true
      const result = await prisma.bien_the.update({
        where: { id: id },
        data: { trang_thai: true },
        include: {
          san_pham: true,
          mau_sac: true,
          cpu: true,
          gpu: true,
          dung_luong_ram: true,
          dung_luong_rom: true,
        },
      });

      return result;
    } catch (error) {
      if (error.code === "P2025") {
        return null;
      }
      throw error;
    }
  }

  // ====================== Xóa (khóa) tất cả các Biến Thể ========================
  async deleteAll() {
    const result = await prisma.bien_the.updateMany({
      where: {
        trang_thai: true,
      },
      data: {
        trang_thai: false,
      },
    });
    return result.count;
  }

  // ==================== Tìm một Biến Thể dựa trên id (gọi lại hàm find để có thể lấy được luôn giá khuyến mãi) ======================
  async findById(id, tx) {
    const list = await this.find({ id: id }, tx);
    return list.length > 0 ? list[0] : null;
  }
}

module.exports = BienTheService;

