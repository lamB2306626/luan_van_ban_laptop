const prisma = require("../utils/prisma");

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

      trang_thai:
        payload.trang_thai !== undefined
          ? payload.trang_thai === true || payload.trang_thai === "true"
          : undefined,

      is_delete:
        payload.is_delete !== undefined
          ? payload.is_delete === true || payload.is_delete === "true"
          : undefined,
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

    // BÓC TÁCH: Loại bỏ chi_tiet_khuyen_mai khỏi san_pham để JSON trả về gọn sạch
    const { san_pham, ...dataBienThe } = bienThe;

    let cleanSanPham = null;
    if (san_pham) {
      const { chi_tiet_khuyen_mai, ...dataSanPham } = san_pham;
      cleanSanPham = dataSanPham;
    }

    return {
      ...dataBienThe,
      san_pham: cleanSanPham,
      don_gia_ap_dung: donGiaApDung,
      so_tien_giam: giaGiamMax, // Trả thêm số tiền giảm nếu giao diện cần hiển thị
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
  async create(payload, externalTx = null) {
    const execute = async (tx) => {
      // Ép payload về dạng Mảng để xử lý đồng nhất
      const items = Array.isArray(payload) ? payload : [payload];
      if (items.length === 0) return [];

      const results = [];

      // Tìm 1 biến thể có ID lớn nhất hiện tại trong Database
      const lastBienThe = await tx.bien_the.findFirst({
        orderBy: {
          id: "desc", // Sắp xếp ID giảm dần (VD: BT05, BT04...)
        },
      });

      let currentNumber = lastBienThe
        ? parseInt(lastBienThe.id.replace(/\D/g, ""), 10) || 0
        : 0;

      // Tập hợp các id_san_pham bị ảnh hưởng để kiểm tra cập nhật trạng thái sau khi tạo biến thể
      const affectedProductIds = new Set();

      for (const item of items) {
        // Tự động tăng số đếm để sinh mã BT01, BT02 duy nhất cho từng item
        if (!item.id) {
          currentNumber += 1;
          item.id = `BT${String(currentNumber).padStart(2, "0")}`;
        }

        const data = this.extractBienTheData(item);

        // Tạo bản ghi biến thể mới
        const newBienThe = await tx.bien_the.create({
          data: {
            ...data,
            id: item.id, // Đảm bảo gán ID tự sinh
          },
          include: {
            san_pham: true,
            mau_sac: true,
            cpu: true,
            gpu: true,
            dung_luong_ram: true,
            dung_luong_rom: true,
          },
        });

        results.push(newBienThe);

        // Lưu lại id_san_pham của biến thể vừa tạo để check cập nhật trạng thái
        if (newBienThe.id_san_pham) {
          affectedProductIds.add(newBienThe.id_san_pham);
        }
      }

      // KIỂM TRA VÀ CẬP NHẬT TRẠNG THÁI SẢN PHẨM TỪ DANG_HOAN_THIEN SANG DANG_KINH_DOANH
      for (const productId of affectedProductIds) {
        const sanPham = await tx.san_pham.findUnique({
          where: { id: productId },
          include: {
            thong_so: true, // Kiểm tra xem đã có thông số chưa
            bien_the: true, // Lấy danh sách biến thể hiện tại
          },
        });

        // Điều kiện để được chuyển sang DANG_KINH_DOANH:
        // 1. Sản phẩm đang ở trạng thái DANG_HOAN_THIEN
        // 2. Đã có thông số kỹ thuật
        // 3. Có ít nhất 1 biến thể (chắc chắn có vì vừa tạo xong, nhưng check tổng số lượng cho chắc chắn)
        if (
          sanPham &&
          sanPham.trang_thai === "DANG_HOAN_THIEN" &&
          sanPham.thong_so &&
          sanPham.bien_the.length > 0
        ) {
          await tx.san_pham.update({
            where: { id: productId },
            data: { trang_thai: "DANG_KINH_DOANH" },
          });
        }
      }

      // Nếu client truyền 1 object thì trả về object, truyền mảng thì trả về mảng
      return Array.isArray(payload) ? results : results[0];
    };

    try {
      // Nếu service cha (SanPhamService) truyền transaction `externalTx` vào thì dùng luôn,
      // nếu không có thì tự mở transaction mới
      if (externalTx) {
        return await execute(externalTx);
      } else {
        return await prisma.$transaction(async (tx) => {
          return await execute(tx);
        });
      }
    } catch (error) {
      // Lỗi vi phạm khóa ngoại (P2003): id_san_pham, id_cpu... không tồn tại
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
      where.trang_thai =
        filterData.trang_thai === "true" || filterData.trang_thai === true;
    }

    if (filterData.da_xoa !== undefined) {
      where.is_delete =
        filterData.da_xoa === "true" || filterData.da_xoa === true;
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
            anh_san_pham: {
              where: {
                la_anh_chinh: true,
              },
            },
            nha_cung_cap_san_pham: true,
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
  async delete(id, externalTx = null) {
    const execute = async (tx) => {
      // 1. Tìm biến thể cần xóa trước để lấy id_san_pham trước khi cập nhật
      const bienThe = await tx.bien_the.findUnique({
        where: { id: id },
      });

      if (!bienThe) {
        throw new Error("BIEN_THE_KHONG_TON_TAI");
      }

      const productId = bienThe.id_san_pham;

      // 2. Thực hiện cập nhật cờ xóa mềm (is_delete: true) cho biến thể
      const updatedBienThe = await tx.bien_the.update({
        where: { id: id },
        data: {
          is_delete: true, // Đổi thành cờ is_delete: true theo yêu cầu
        },
      });

      // 3. KIỂM TRA VÀ CẬP NHẬT TRẠNG THÁI SẢN PHẨM CHA
      // Đếm xem sản phẩm này còn lại bao nhiêu biến thể CHƯA BỊ XÓA MỀM (is_delete: false)
      const activeVariantsCount = await tx.bien_the.count({
        where: {
          id_san_pham: bienThe.id_san_pham,
          is_delete: false,
        },
      });

      // Lấy thông tin sản phẩm cha hiện tại
      const sanPham = await tx.san_pham.findUnique({
        where: { id: productId },
      });

      // Nếu sản phẩm đang DANG_KINH_DOANH mà số lượng biến thể hoạt động còn lại bằng 0
      // thì tự động hạ cấp trạng thái sản phẩm xuống DANG_HOAN_THIEN
      if (
        sanPham &&
        sanPham.trang_thai === "DANG_KINH_DOANH" &&
        activeVariantsCount === 0
      ) {
        await tx.san_pham.update({
          where: { id: productId },
          data: { trang_thai: "DANG_HOAN_THIEN" },
        });
      }

      return updatedBienThe;
    };

    try {
      if (externalTx) {
        return await execute(externalTx);
      } else {
        return await prisma.$transaction(async (tx) => {
          return await execute(tx);
        });
      }
    } catch (error) {
      if (error.message === "BIEN_THE_KHONG_TON_TAI") {
        throw error;
      }
      throw error;
    }
  }

  // Khôi phục Biến Thể (chỉ cho phép nếu Sản Phẩm cha không bị xóa)
  async restore(id, externalTx = null) {
    const execute = async (tx) => {
      // 1. Tìm biến thể kèm theo cờ id_delete của Sản phẩm cha
      const bienThe = await prisma.bien_the.findUnique({
        where: { id: id },
        include: {
          san_pham: {
            select: { is_delete: true },
          },
        },
      });

      // Nếu không tìm thấy biến thể
      if (!bienThe) {
        return null;
      }

      // 2. Kiểm tra nếu Sản phẩm cha đang bị xóa (is_delete=true)
      if (bienThe.san_pham?.is_delete) {
        throw new Error("SAN_PHAM_DA_XOA_KHOI_HE_THONG");
      }

      // 3. Khôi phục is_delete biến thể thành false
      const result = await prisma.bien_the.update({
        where: { id: id },
        data: { is_delete: false },
        include: {
          san_pham: true,
          mau_sac: true,
          cpu: true,
          gpu: true,
          dung_luong_ram: true,
          dung_luong_rom: true,
        },
      });

      // 4. KIỂM TRA VÀ CẬP NHẬT TRẠNG THÁI SẢN PHẨM CHA
      // Đếm xem sản phẩm này còn lại bao nhiêu biến thể CHƯA BỊ XÓA MỀM (is_delete: false)
      const activeVariantsCount = await tx.bien_the.count({
        where: {
          id_san_pham: bienThe.id_san_pham,
          is_delete: false,
        },
      });

      // Lấy thông tin sản phẩm cha hiện tại
      const sanPham = await tx.san_pham.findUnique({
        where: { id: bienThe.id_san_pham },
      });

      console.log(sanPham, activeVariantsCount);
      // Nếu sản phẩm đang DANG_HOAN_THIEN mà số lượng biến thể hoạt động lớn hơn 0
      // thì tự động hạ nâng trạng thái sản phẩm xuống DANG_HOAT_DONG
      if (
        sanPham &&
        sanPham.trang_thai === "DANG_HOAN_THIEN" &&
        activeVariantsCount > 0
      ) {
        await tx.san_pham.update({
          where: { id: bienThe.id_san_pham },
          data: { trang_thai: "DANG_KINH_DOANH" },
        });
      }

      return result;
    };

    try {
      if (externalTx) {
        return await execute(externalTx);
      } else {
        return await prisma.$transaction(async (tx) => {
          return await execute(tx);
        });
      }
    } catch (error) {
      if (error.code === "P2025") {
        return null;
      }
      throw error;
    }
  }

  // ====================== Xóa (khóa) tất cả các Biến Thể ========================
  // async deleteAll() {
  //   const result = await prisma.bien_the.updateMany({
  //     where: {
  //       trang_thai: true,
  //     },
  //     data: {
  //       trang_thai: false,
  //     },
  //   });
  //   return result.count;
  // }

  // ==================== Tìm một Biến Thể dựa trên id (gọi lại hàm find để có thể lấy được luôn giá khuyến mãi) ======================
  async findById(id, tx) {
    const list = await this.find({ id: id }, tx);
    return list.length > 0 ? list[0] : null;
  }
}

module.exports = BienTheService;
