const prisma = require("../utils/prisma");

class DanhGiaService {
  // Lọc lấy các trường thuộc tính hợp lệ của Đánh Giá
  extractDanhGiaData(payload) {
    const danhGia = {
      id: payload.id,
      id_san_pham: payload.id_san_pham,
      id_khach_hang: payload.id_khach_hang,
      id_chi_tiet_don_hang: payload.id_chi_tiet_don_hang,
      so_sao:
        payload.so_sao !== undefined ? parseInt(payload.so_sao, 10) : undefined,
      noi_dung: payload.noi_dung,
      ngay_danh_gia: payload.ngay_danh_gia,
    };
    Object.keys(danhGia).forEach(
      (key) => danhGia[key] === undefined && delete danhGia[key],
    );
    return danhGia;
  }

  // 1. Tạo đánh giá mới (Tự sinh mã DG01, DG02... nếu không truyền id)
  // 1. Tạo đánh giá mới (Tự sinh mã DG01, DG02... nếu không truyền id)
  async create(payload) {
    // payload cần truyền lên gồm: id_san_pham, id_khach_hang, id_chi_tiet_don_hang, so_sao, noi_dung

    // BƯỚC 1: Kiểm tra tính hợp lệ của id_chi_tiet_don_hang
    const chiTietDonHang = await prisma.chi_tiet_don_hang.findUnique({
      where: { id: payload.id_chi_tiet_don_hang },
      include: {
        don_hang: true, // Để kiểm tra trạng thái đơn hàng
        bien_the: true, // Để lấy id_san_pham gốc của biến thể trong đơn hàng
      },
    });

    if (!chiTietDonHang) {
      throw new Error("CHI_TIET_DON_HANG_KHONG_TON_TAI");
    }

    // BƯỚC 2: Kiểm tra xem đơn hàng này có phải của chính khách hàng đó không
    if (chiTietDonHang.don_hang.id_khach_hang !== payload.id_khach_hang) {
      throw new Error("KHONG_CO_QUYEN_DANH_GIA_DON_HANG_NAY");
    }

    // BƯỚC 3: Kiểm tra xem đơn hàng đã hoàn thành chưa
    if (chiTietDonHang.don_hang.trang_thai_don_hang !== "HOAN_THANH") {
      throw new Error("DON_HANG_CHUA_HOAN_THANH_KHONG_THE_DANH_GIA");
    }

    // BƯỚC 4: Kiểm tra xem sản phẩm trong chi tiết đơn hàng có khớp với sản phẩm khách muốn đánh giá không
    const sanPhamIdTrongDon = chiTietDonHang.bien_the?.id_san_pham;
    if (sanPhamIdTrongDon !== payload.id_san_pham) {
      throw new Error("SAN_PHAM_KHONG_KHOP_VOI_DON_HANG");
    }

    // BƯỚC 5: Tự sinh mã ID đánh giá (DG01, DG02...) nếu chưa có
    if (!payload.id) {
      const lastDanhGia = await prisma.danh_gia.findFirst({
        orderBy: {
          id: "desc",
        },
      });

      if (!lastDanhGia) {
        payload.id = "DG0001";
      } else {
        const currentNumber =
          parseInt(lastDanhGia.id.replace(/\D/g, ""), 10) || 0;
        payload.id = `DG${String(currentNumber + 1).padStart(4, "0")}`;
      }
    }

    const data = this.extractDanhGiaData(payload);

    try {
      return await prisma.danh_gia.create({
        data: data,
        include: {
          san_pham: true,
          khach_hang: true,
          chi_tiet_don_hang: true,
        },
      });
    } catch (error) {
      // Lỗi vi phạm khóa ngoại (P2003)
      if (error.code === "P2003") {
        throw new Error("DU_LIEU_LIEN_KET_KHONG_HOP_LE");
      }
      // Lỗi vi phạm @@unique (Đã đánh giá cho lần mua/sản phẩm này rồi)
      if (error.code === "P2002") {
        throw new Error("KHACH_HANG_DA_DANH_GIA_CHO_LAN_MUA_NAY");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm đánh giá theo bộ lọc (id, id_san_pham, id_khach_hang, so_sao)
  async find(filterData) {
    const where = {};

    if (filterData.id) {
      where.id = filterData.id;
    }

    if (filterData.id_san_pham) {
      where.id_san_pham = filterData.id_san_pham;
    }

    if (filterData.id_khach_hang) {
      where.id_khach_hang = filterData.id_khach_hang;
    }

    if (filterData.so_sao) {
      where.so_sao = parseInt(filterData.so_sao, 10);
    }

    return await prisma.danh_gia.findMany({
      where: where,
      include: {
        san_pham: true,
        khach_hang: true,
        chi_tiet_don_hang: {
          include: {
            bien_the: {
              include: {
                mau_sac: true,
                cpu: true,
                gpu: true,
                dung_luong_ram: true,
                dung_luong_rom: true,
              },
            },
          },
        },
      },
      orderBy: {
        ngay_danh_gia: "desc", // Đánh giá mới nhất lên đầu
      },
    });
  }

  // 3. Cập nhật đánh giá dựa trên id
  async update(id, payload) {
    const updateData = this.extractDanhGiaData(payload);
    delete updateData.id; // Không cho phép sửa khóa chính
    delete updateData.id_san_pham; // Không cho phép đổi sản phẩm
    delete updateData.id_khach_hang; // Không cho phép đổi người đánh giá
    delete updateData.id_chi_tiet_don_hang; // Không cho phép chi tiết đơn hàng

    try {
      const result = await prisma.danh_gia.update({
        where: { id: id },
        data: updateData,
        include: {
          san_pham: true,
          khach_hang: true,
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

  // 4. Xóa một đánh giá dựa trên id
  async delete(id) {
    try {
      const result = await prisma.danh_gia.delete({
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

  // 5. Xóa tất cả đánh giá
  async deleteAll() {
    const result = await prisma.danh_gia.deleteMany({});
    return result.count;
  }

  // 6. Tìm một đánh giá dựa trên id
  async findById(id) {
    return await prisma.danh_gia.findUnique({
      where: { id: id },
      include: {
        san_pham: true,
        khach_hang: true,
      },
    });
  }

  // Lấy thống kê số sao trung bình và tổng số đánh giá của 1 sản phẩm hoặc danh sách các sản phẩm
  async getThongKeDanhGia(idSanPhams) {
    if (!idSanPhams || (Array.isArray(idSanPhams) && idSanPhams.length === 0)) {
      return Array.isArray(idSanPhams)
        ? new Map()
        : { trung_binh_sao: 0, tong_so_danh_gia: 0 };
    }

    // Trường hợp 1: Truyền vào mảng các ID sản phẩm (dùng cho hàm find)
    if (Array.isArray(idSanPhams)) {
      const listThongKe = await prisma.danh_gia.groupBy({
        by: ["id_san_pham"],
        where: {
          id_san_pham: { in: idSanPhams },
        },
        _avg: {
          so_sao: true,
        },
        _count: {
          id: true,
        },
      });

      // Map lưu kết quả thống kê theo từng id_san_pham
      const thongKeMap = new Map();
      listThongKe.forEach((tk) => {
        thongKeMap.set(tk.id_san_pham, {
          trung_binh_sao: tk._avg.so_sao
            ? Number(tk._avg.so_sao.toFixed(1))
            : 0,
          tong_so_danh_gia: tk._count.id || 0,
        });
      });

      return thongKeMap;
    }

    // Trường hợp 2: Truyền vào 1 ID duy nhất (dùng cho hàm findById)
    const stats = await prisma.danh_gia.aggregate({
      where: { id_san_pham: idSanPhams },
      _avg: {
        so_sao: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      trung_binh_sao: stats._avg.so_sao
        ? Number(stats._avg.so_sao.toFixed(1))
        : 0,
      tong_so_danh_gia: stats._count.id || 0,
    };
  }
}

module.exports = DanhGiaService;
