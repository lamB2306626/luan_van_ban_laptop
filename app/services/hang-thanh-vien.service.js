const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const PhieuHangThanhVienService = require("./phieu-hang-thanh-vien.service");
const KhachHangService = require("./khach-hang.service");

class HangThanhVienService {
  constructor() {
    this.phieuHangThanhVienService = new PhieuHangThanhVienService();
    this.khachHangService = new KhachHangService();
  }

  // Lọc lấy các trường thuộc tính hợp lệ của Hạng thành viên
  extractHangThanhVienData(payload) {
    const hangThanhVien = {
      id: payload.id,
      ten_hang: payload.ten_hang,
      moc_chi_tieu:
        payload.moc_chi_tieu !== undefined
          ? Number(payload.moc_chi_tieu)
          : undefined,
    };
    Object.keys(hangThanhVien).forEach(
      (key) => hangThanhVien[key] === undefined && delete hangThanhVien[key],
    );
    return hangThanhVien;
  }

  // ==================== 1. Tạo Hạng Thành Viên mới (Tự sinh mã HTV01, HTV02...) ====================
  async create(payload) {
    if (!payload.id) {
      const lastHangThanhVien = await prisma.hang_thanh_vien.findFirst({
        orderBy: {
          id: "desc",
        },
      });

      if (!lastHangThanhVien) {
        payload.id = "HTV01";
      } else {
        const currentNumber =
          parseInt(lastHangThanhVien.id.replace(/\D/g, ""), 10) || 0;
        payload.id = `HTV${String(currentNumber + 1).padStart(2, "0")}`;
      }
    }

    const data = this.extractHangThanhVienData(payload);

    try {
      // 2. Tạo bản ghi Hạng thành viên mới trong Database
      const newHangThanhVien = await prisma.hang_thanh_vien.create({
        data: data,
      });

      // 3. Nếu người dùng có chọn danh sách phiếu giảm giá đính kèm
      if (
        payload.danh_sach_id_phieu_giam_gia &&
        Array.isArray(payload.danh_sach_id_phieu_giam_gia) &&
        payload.danh_sach_id_phieu_giam_gia.length > 0
      ) {
        // Lặp qua danh sách ID phiếu giảm giá và gọi PhieuHangThanhVienService.create
        for (const idPhieu of payload.danh_sach_id_phieu_giam_gia) {
          await this.phieuHangThanhVienService.create({
            id_hang_thanh_vien: newHangThanhVien.id,
            id_phieu_giam_gia: idPhieu,
          });
        }
      }

      // 4. gọi hàm cập nhật lại hạng cho tất cả các khách hàng trong hệ thống (sử dụng bất đồng bô để không làm chậm server)
      this.khachHangService.updateHangAllKhachHang();

      // 5. Trả về thông tin Hạng thành viên vừa tạo kèm danh sách quan hệ phiếu
      return await prisma.hang_thanh_vien.findUnique({
        where: { id: newHangThanhVien.id },
        include: {
          phieu_hang_thanh_vien: {
            include: {
              phieu_giam_gia: true,
            },
          },
        },
      });
    } catch (error) {
      // Mã P2002 của Prisma đại diện cho lỗi vi phạm ràng buộc UNIQUE (trùng ten_hang)
      if (error.code === "P2002") {
        throw new Error("TEN_HANG_THANH_VIEN_DA_TON_TAI");
      }
      throw error;
    }
  }

  // ==================== 2. Tìm kiếm Hạng Thành Viên theo id hoặc ten_hang ====================
  async find(filterData) {
    const where = {};

    // Tìm kiếm chính xác theo mã
    if (filterData.id) {
      where.id = filterData.id;
    }

    // Tìm kiếm gần đúng (chứa từ khóa, không phân biệt hoa thường) theo tên hạng
    if (filterData.ten_hang) {
      where.ten_hang = {
        contains: filterData.ten_hang,
        mode: "insensitive",
      };
    }

    return await prisma.hang_thanh_vien.findMany({
      where: where,
      orderBy: {
        moc_chi_tieu: "asc", // Sắp xếp theo mốc chi tiêu từ thấp đến cao
      },
      include: {
        phieu_hang_thanh_vien: {
          include: {
            phieu_giam_gia: true,
          },
        },
      },
    });
  }

  // ==================== 3. Cập nhật thông tin Hạng Thành Viên dựa trên id ====================
  async update(id, payload) {
    const updateData = this.extractHangThanhVienData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính (id)

    try {
      // 1. Cập nhật thông tin cơ bản của Hạng thành viên
      const result = await prisma.hang_thanh_vien.update({
        where: { id: id },
        data: updateData,
      });

      // 2. Nếu payload có gửi kèm danh sách phiếu (kể cả mảng rỗng `[]` khi người dùng xóa hết phiếu)
      if (
        payload.danh_sach_id_phieu_giam_gia &&
        Array.isArray(payload.danh_sach_id_phieu_giam_gia)
      ) {
        // 2a. Xóa sạch các liên kết phiếu cũ của Hạng thành viên này
        await prisma.phieu_hang_thanh_vien.deleteMany({
          where: { id_hang_thanh_vien: id },
        });

        // 2b. Thêm lại các liên kết phiếu mới thông qua PhieuHangThanhVienService
        for (const idPhieu of payload.danh_sach_id_phieu_giam_gia) {
          await this.phieuHangThanhVienService.create({
            id_hang_thanh_vien: id,
            id_phieu_giam_gia: idPhieu,
          });
        }
      }

      // 3. gọi hàm cập nhật lại hạng cho tất cả các khách hàng trong hệ thống (sử dụng bất đồng bô để không làm chậm server)
      this.khachHangService.updateHangAllKhachHang();

      // 4. Trả về dữ liệu đã cập nhật đầy đủ kèm thông tin các phiếu liên quan
      return await prisma.hang_thanh_vien.findUnique({
        where: { id: id },
        include: {
          phieu_hang_thanh_vien: {
            include: {
              phieu_giam_gia: true,
            },
          },
        },
      });
    } catch (error) {
      // 1. Lỗi không tìm thấy bản ghi cần update
      if (error.code === "P2025") {
        return null;
      }
      // 2. Lỗi bị trùng tên Hạng thành viên
      if (error.code === "P2002") {
        throw new Error("TEN_HANG_THANH_VIEN_DA_TON_TAI");
      }
      throw error;
    }
  }

  // ==================== 4. Xóa một Hạng Thành Viên dựa trên id ====================
  async delete(id) {
    try {
      const result = await prisma.hang_thanh_vien.delete({
        where: { id: id },
      });

      // có thể không cần gọi hàm cập nhật hạng vì vốn chỉ cho xóa hạng thành viên không thuộc về khách hàng nào nến nếu cập nhật cũng không xảy ra thay đổi hạng 
      // this.khachHangService.updateHangAllKhachHang();

      return result;
    } catch (error) {
      // 1. Không tìm thấy bản ghi cần xóa
      if (error.code === "P2025") {
        return null;
      }
      // 2. Lỗi vi phạm khóa ngoại (P2003): Hạng thành viên đang có khách hàng liên kết
      if (error.code === "P2003") {
        throw new Error("HANG_THANH_VIEN_DANG_CO_KHACH_HANG");
      }
      throw error;
    }
  }

  // ==================== 5. Xóa tất cả các Hạng Thành Viên chưa có Khách Hàng ====================
  async deleteAll() {
    try {
      // Chỉ xóa những Hạng thành viên KHÔNG chứa khách hàng nào (khach_hang: { none: {} })
      const result = await prisma.hang_thanh_vien.deleteMany({
        where: {
          khach_hang: {
            none: {},
          },
        },
      });

      // có thể không cần gọi hàm cập nhật hạng vì vốn chỉ cho xóa hạng thành viên không thuộc về khách hàng nào nến nếu cập nhật cũng không xảy ra
      // this.khachHangService.updateHangAllKhachHang();

      return result.count; // Trả về số lượng bản ghi đã xóa
    } catch (error) {
      throw error;
    }
  }

  // ==================== 6. Tìm một Hạng Thành Viên dựa trên id ====================
  async findById(id) {
    return await prisma.hang_thanh_vien.findUnique({
      where: { id: id },
      include: {
        phieu_hang_thanh_vien: {
          include: {
            phieu_giam_gia: true,
          },
        },
      },
    });
  }
}

module.exports = HangThanhVienService;
