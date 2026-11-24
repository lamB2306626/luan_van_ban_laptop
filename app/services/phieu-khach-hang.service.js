const prisma = require("../utils/prisma");
const ThongBaoService = require("./thong-bao.service");

class PhieuKhachHangService {
  constructor() {
    this.thongBaoService = new ThongBaoService();
  }

  // Lọc lấy các trường thuộc tính hợp lệ của Phiếu Khách Hàng
  extractPhieuKhachHangData(payload) {
    const phieuKhachHang = {
      id: payload.id,
      id_khach_hang: payload.id_khach_hang,
      id_phieu_giam_gia: payload.id_phieu_giam_gia,
      trang_thai: payload.trang_thai,
    };
    Object.keys(phieuKhachHang).forEach(
      (key) => phieuKhachHang[key] === undefined && delete phieuKhachHang[key],
    );
    return phieuKhachHang;
  }

  // ==================== KIỂM TRA TÍNH HỢP LỆ CỦA PHIẾU GIẢM GIÁ ====================
  async kiemTraPhieuGiamGia(idKhachHang, idPhieuGiamGia, tongTienDonHang, tx) {
    const db = tx || prisma;

    // 1. Tìm bản ghi phiếu của khách hàng kèm thông tin chi tiết phiếu
    const phieuKhachHang = await db.phieu_khach_hang.findFirst({
      where: {
        id_khach_hang: idKhachHang,
        id_phieu_giam_gia: idPhieuGiamGia,
        trang_thai: true, // Chưa sử dụng
      },
      include: {
        phieu_giam_gia: true,
      },
    });

    if (!phieuKhachHang || !phieuKhachHang.phieu_giam_gia) {
      throw new Error("PHIEU_GIAM_GIA_KHONG_HOP_LE_HOAC_DA_SU_DUNG");
    }

    const detailPgg = phieuKhachHang.phieu_giam_gia;
    const now = new Date();

    // 2. Kiểm tra thời gian hiệu lực
    if (
      (detailPgg.ngay_bat_dau && now < new Date(detailPgg.ngay_bat_dau)) ||
      (detailPgg.ngay_het_han && now > new Date(detailPgg.ngay_het_han))
    ) {
      throw new Error("PHIEU_GIAM_GIA_HET_HAN_HOAC_CHUA_DEN_GIOT_AP_DUNG");
    }

    // 3. Kiểm tra điều kiện giá trị đơn hàng tối thiểu
    if (
      detailPgg.don_toi_thieu &&
      Number(tongTienDonHang) < Number(detailPgg.don_toi_thieu)
    ) {
      throw new Error("DON_HANG_CHUA_DAT_GIA_TRI_TOI_THIEU");
    }

    // Trả về dữ liệu để hàm gọi có thể tái sử dụng thông tin phiếu
    return phieuKhachHang;
  }

  // ==================== ĐÁNH DẤU PHIẾU ĐÃ ĐƯỢC SỬ DỤNG ====================
  async suDungPhieu(idKhachHang, idPhieuGiamGia, tongTienDonHang, tx) {
    const db = tx || prisma;

    // 1. Kiểm tra điều kiện hợp lệ
    const phieuKhachHang = await this.kiemTraPhieuGiamGia(
      idKhachHang,
      idPhieuGiamGia,
      tongTienDonHang,
      tx,
    );

    // 2. Cập nhật trạng thái phiếu thành false (đã sử dụng)
    return await db.phieu_khach_hang.update({
      where: { id: phieuKhachHang.id },
      data: { trang_thai: false },
    });
  }

  // ==================== Hoàn trả lại phiếu giảm giá (khi hủy đơn) ====================
  async hoanTraPhieu(idKhachHang, idPhieuGiamGia, tx) {
    const db = tx || prisma;

    if (!idKhachHang || !idPhieuGiamGia) return null;

    // Tìm bản ghi sở hữu phiếu của khách hàng
    const phieuKhachHang = await db.phieu_khach_hang.findFirst({
      where: {
        id_khach_hang: idKhachHang,
        id_phieu_giam_gia: idPhieuGiamGia,
      },
    });

    if (!phieuKhachHang) {
      return null;
    }

    // Cập nhật trạng thái phiếu về true (khôi phục khả năng sử dụng)
    return await db.phieu_khach_hang.update({
      where: { id: phieuKhachHang.id },
      data: { trang_thai: true },
    });
  }

  // ==================== 1. Gán Phiếu Giảm Giá cho Khách Hàng ====================
  async create(payload, tx) {
    const db = tx || prisma;

    // Trường hợp 1: Phát hành voucher cho danh sách NHIỀU khách hàng cùng lúc
    if (
      Array.isArray(payload.danh_sach_id_khach_hang) &&
      payload.danh_sach_id_khach_hang.length > 0
    ) {
      // Hàm xử lý core để dùng chung cho cả khi có tx hoặc không
      const executeBatch = async (transactionClient) => {
        const lastRecord = await transactionClient.phieu_khach_hang.findFirst({
          orderBy: { id: "desc" },
        });

        let startNum = lastRecord
          ? parseInt(lastRecord.id.replace(/\D/g, ""), 10) || 0
          : 0;

        const records = payload.danh_sach_id_khach_hang.map((idKhachHang) => {
          startNum += 1;
          return {
            id: `PKH${String(startNum).padStart(4, "0")}`,
            id_phieu_giam_gia: payload.id_phieu_giam_gia,
            id_khach_hang: idKhachHang,
            trang_thai:
              payload.trang_thai !== undefined ? payload.trang_thai : true,
          };
        });

        try {
          const result = await transactionClient.phieu_khach_hang.createMany({
            data: records,
          });

          return {
            totalCreated: result.count,
          };
        } catch (error) {
          if (error.code === "P2003") {
            throw new Error("KHACH_HANG_HOAC_PHIEU_GIAM_GIA_KHONG_TON_TAI");
          }
          throw error;
        }
      };

      // Nếu đã có tx truyền từ ngoài vào thì dùng luôn, ngược lại mới tự tạo $transaction
      return tx
        ? await executeBatch(tx)
        : await prisma.$transaction(executeBatch);
    }

    // Trường hợp 2: Gán voucher cho 1 khách hàng cụ thể
    if (!payload.id) {
      const lastPhieuKhachHang = await db.phieu_khach_hang.findFirst({
        orderBy: { id: "desc" },
      });
      const currentNumber = lastPhieuKhachHang
        ? parseInt(lastPhieuKhachHang.id.replace(/\D/g, ""), 10) || 0
        : 0;
      payload.id = `PKH${String(currentNumber + 1).padStart(4, "0")}`;
    }

    const data = this.extractPhieuKhachHangData(payload);

    try {
      return await db.phieu_khach_hang.create({
        data: data,
        include: {
          khach_hang: true,
          phieu_giam_gia: true,
        },
      });
    } catch (error) {
      if (error.code === "P2003") {
        throw new Error("KHACH_HANG_HOAC_PHIEU_GIAM_GIA_KHONG_TON_TAI");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm danh sách phiếu khách hàng theo bộ lọc (id, id_khach_hang, id_phieu_giam_gia, trang_thai)
  // app/services/phieu-khach-hang.service.js

  async find(filterData, tx) {
    const db = tx || prisma; // Hỗ trợ truyền Transaction nếu có
    const where = {};

    if (filterData.id) {
      where.id = filterData.id;
    }

    if (filterData.id_khach_hang) {
      where.id_khach_hang = filterData.id_khach_hang;
    }

    if (filterData.id_phieu_giam_gia) {
      where.id_phieu_giam_gia = filterData.id_phieu_giam_gia;
    }

    // Trạng thái phiếu khách hàng (true: chưa dùng, false: đã dùng)
    if (filterData.trang_thai !== undefined) {
      where.trang_thai = filterData.trang_thai;
    }

    // Lọc theo điều kiện Khả Dụng / Còn Hạn Sử Dụng của Phiếu Giảm Giá
    if (filterData.kha_dung !== undefined) {
      const now = new Date();

      where.phieu_giam_gia = {
        ...(where.phieu_giam_gia || {}),
        // Nếu kha_dung === true: Ngày bắt đầu <= Hiện tại <= Ngày hết hạn
        ...(filterData.kha_dung === true && {
          ngay_bat_dau: { lte: now },
          ngay_het_han: { gte: now },
        }),
        // Nếu kha_dung === false: Đã hết hạn (Ngày hết hạn < Hiện tại)
        ...(filterData.kha_dung === false && {
          ngay_het_han: { lt: now },
        }),
      };
    }

    // Lọc theo trạng thái (Hoạt động/Khóa) của Phiếu Giảm Giá
    if (filterData.trang_thai_khoa !== undefined) {
      where.phieu_giam_gia = {
        ...(where.phieu_giam_gia || {}),
        trang_thai: filterData.trang_thai_khoa === true,
      };
    }

    return await db.phieu_khach_hang.findMany({
      where: where,
      include: {
        khach_hang: true,
        phieu_giam_gia: true, // Lấy kèm thông tin chi tiết phiếu
      },
      orderBy: {
        id: "desc",
      },
    });
  }

  // 3. Cập nhật phiếu khách hàng
  async update(id, payload) {
    const updateData = this.extractPhieuKhachHangData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính (id)
    delete updateData.id_khach_hang;
    delete updateData.id_phieu_giam_gia;

    try {
      const result = await prisma.phieu_khach_hang.update({
        where: { id: id },
        data: updateData,
        include: {
          khach_hang: true,
          phieu_giam_gia: true,
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

  // 4. Xóa một bản ghi Phiếu Khách Hàng dựa trên mã id (Hard Delete)
  async delete(id) {
    try {
      const result = await prisma.phieu_khach_hang.delete({
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

  // 5. Xóa tất cả bản ghi Phiếu Khách Hàng
  async deleteAll() {
    try {
      const result = await prisma.phieu_khach_hang.deleteMany({});
      return result.count;
    } catch (error) {
      throw error;
    }
  }

  // 6. Tìm một bản ghi Phiếu Khách Hàng dựa trên mã id
  async findById(id) {
    return await prisma.phieu_khach_hang.findUnique({
      where: { id: id },
      include: {
        khach_hang: true,
        phieu_giam_gia: true,
      },
    });
  }

  async tangPhieuByAdmin(payload, tx) {
    const db = tx || prisma;

    // 1. Gọi hàm create của chính service này để ghi DB
    const result = await this.create(payload, db);

    // 2. Lấy thông tin phiếu giảm giá để làm nội dung thông báo
    const phieuGiamGia = await db.phieu_giam_gia.findUnique({
      where: { id: payload.id_phieu_giam_gia },
    });

    // 3. Chuẩn bị danh sách ID khách hàng nhận thông báo
    const listIds = Array.isArray(payload.danh_sach_id_khach_hang)
      ? payload.danh_sach_id_khach_hang
      : [payload.id_khach_hang];

    // 4. Gửi thông báo ngữ cảnh "ADMIN TẶNG"
    await this.thongBaoService.sendTangPhieuNotification(
      {
        phieuGiamGia,
        danhSachIdKhachHang: listIds,
      },
      db,
    );

    return result;
  }
}

module.exports = PhieuKhachHangService;
