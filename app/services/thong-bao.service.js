const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const ChiTietThongBaoService = require("./chi-tiet-thong-bao.service");

class ThongBaoService {
  constructor() {
    this.chiTietThongBaoService = new ChiTietThongBaoService();
  }

  // Lọc lấy các trường thuộc tính hợp lệ của Thông báo
  extractThongBaoData(payload) {
    const thongBao = {
      id: payload.id,
      tieu_de: payload.tieu_de,
      noi_dung: payload.noi_dung,
      lien_ket: payload.lien_ket,
    };
    Object.keys(thongBao).forEach(
      (key) => thongBao[key] === undefined && delete thongBao[key],
    );
    return thongBao;
  }

  // ==================== 1. Tạo Thông Báo gốc mới + các chi tiết thông báo ====================
  async create(payload, tx) {
    const db = tx || prisma;
    // 1. Tự động sinh mã ID (TB01, TB02...)
    if (!payload.id) {
      const lastThongBao = await db.thong_bao.findFirst({
        orderBy: { id: "desc" },
      });

      if (!lastThongBao) {
        payload.id = "TB01";
      } else {
        const currentNumber =
          parseInt(lastThongBao.id.replace(/\D/g, ""), 10) || 0;
        payload.id = `TB${String(currentNumber + 1).padStart(2, "0")}`;
      }
    }

    // Lấy ra các trường dữ liệu thuộc bảng thong_bao
    const data = this.extractThongBaoData(payload);

    try {
      // 2.1. Tạo bản ghi Thông Báo gốc
      const newThongBao = await db.thong_bao.create({
        data: data,
      });

      // 2.2. Nếu người dùng chọn gửi ngay cho danh sách khách hàng
      if (
        payload.danh_sach_id_khach_hang &&
        Array.isArray(payload.danh_sach_id_khach_hang) &&
        payload.danh_sach_id_khach_hang.length > 0
      ) {
        // Gọi chiTietThongBaoService.create để gửi thông báo này cho danh sách ID Khách Hàng
        await this.chiTietThongBaoService.create(
          {
            id_thong_bao: newThongBao.id,
            danh_sach_id_khach_hang: payload.danh_sach_id_khach_hang,
          },
          db,
        );
      }

      // 2.3. Trả về Thông báo vừa tạo kèm theo danh sách chi tiết đã phân phát
      return await db.thong_bao.findUnique({
        where: { id: newThongBao.id },
        include: {
          chi_tiet_thong_bao: {
            include: {
              khach_hang: true, // Bao gồm thông tin khách hàng nếu cần
            },
          },
        },
      });
    } catch (error) {
      console.error("Lỗi khi tạo thông báo:", error);
      throw error;
    }
  }

  // ==================== 2. Lấy danh sách Thông Báo ====================
  async find(filterData) {
    const where = {};

    if (filterData.id) where.id = filterData.id;
    if (filterData.tieu_de) {
      where.tieu_de = {
        contains: filterData.tieu_de,
        mode: "insensitive",
      };
    }

    return await prisma.thong_bao.findMany({
      where,
      orderBy: { ngay_tao: "desc" },
    });
  }

  // ==================== 3. Cập nhật nội dung Thông Báo ====================
  async update(id, payload) {
    const updateData = this.extractThongBaoData(payload);
    delete updateData.id;

    try {
      return await prisma.thong_bao.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if (error.code === "P2025") return null;
      throw error;
    }
  }

  // ==================== 4. Xóa một Thông Báo ====================
  async delete(id) {
    try {
      return await prisma.thong_bao.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === "P2025") return null;
      throw error;
    }
  }

  // ==================== 5. Xóa tất cả Thông Báo ====================
  async deleteAll() {
    const result = await prisma.thong_bao.deleteMany({});
    return result.count;
  }

  // ==================== 6. Tìm một Thông Báo theo id ====================
  async findById(id) {
    return await prisma.thong_bao.findUnique({
      where: { id },
    });
  }

  // ==================== Gửi thông báo khi nâng hạng kèm quà ====================
  async sendThangHangNotification({ khachHang, hangMoi, soLuongPhieu }, db) {
    // 1. Soạn nội dung cá nhân hóa
    const tieuDe = `Chúc mừng ${khachHang.ho_ten || "bạn"} đã nâng hạng ${hangMoi.ten_hang}!`;
    let noiDung = `Cảm ơn bạn đã đồng hành. Bạn vừa được nâng lên hạng thành viên ${hangMoi.ten_hang}.`;

    if (soLuongPhieu > 0) {
      noiDung += ` Hệ thống đã tặng ${soLuongPhieu} phiếu giảm giá đặc quyền vào ví của bạn. Kiểm tra ngay nhé!`;
    }

    // 2. hàm tạo thông báo và chi tiết thông báo
    return await this.create(
      {
        tieu_de: tieuDe,
        noi_dung: noiDung,
        lien_ket: "/user/vouchers",
        danh_sach_id_khach_hang: [khachHang.id], // Truyền dạng mảng [id] để tự động tạo chi tiết
      },
      db, // Truyền db (tx) để gom chung Transaction
    );
  }
}

module.exports = ThongBaoService;
