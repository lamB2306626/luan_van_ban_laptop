const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

class NhanVienService {
  // Lọc lấy các trường thuộc tính hợp lệ
  extractNhanVienData(payload) {
    const nhanVien = {
      id: payload.id,
      id_vai_tro: payload.id_vai_tro,
      ho_ten: payload.ho_ten,
      email: payload.email,
      mat_khau: payload.mat_khau,
      so_dien_thoai: payload.so_dien_thoai,
      ngay_sinh: payload.ngay_sinh ? new Date(payload.ngay_sinh) : undefined,
      avatar: payload.avatar,
      trang_thai: payload.trang_thai,
    };
    Object.keys(nhanVien).forEach(
      (key) => nhanVien[key] === undefined && delete nhanVien[key],
    );
    return nhanVien;
  }

  // 1. Tạo Nhân Viên mới (Tự sinh mã NV01, NV02 nếu client không truyền id)
  async create(payload) {
    if (!payload.id) {
      // Tìm 1 Nhân Viên có ID lớn nhất hiện tại
      const lastNhanVien = await prisma.nhan_vien.findFirst({
        orderBy: {
          id: "desc", // Sắp xếp ID giảm dần (ví dụ: NV05, NV04, NV03...)
        },
      });

      if (!lastNhanVien) {
        // Nếu database chưa có Nhân Viên nào
        payload.id = "NV01";
      } else {
        // Lấy phần số ra khỏi chuỗi (VD: "NV05" -> lấy số 5)
        const currentNumber =
          parseInt(lastNhanVien.id.replace(/\D/g, ""), 10) || 0;
        // Cộng thêm 1 và format lại thành chuỗi NV06
        payload.id = `NV${String(currentNumber + 1).padStart(2, "0")}`;
      }
    }

    const data = this.extractNhanVienData(payload);

    // MÃ HÓA MẬT KHẨU NẾU CÓ
    if (data.mat_khau) {
      const salt = await bcrypt.genSalt(10);
      data.mat_khau = await bcrypt.hash(data.mat_khau, salt);
    }

    try {
      return await prisma.nhan_vien.create({
        data: data,
        include: {
          vai_tro: true,
        },
      });
    } catch (error) {
      // 1. Mã P2002 của Prisma: Trùng Email
      if (error.code === "P2002") {
        throw new Error("EMAIL_DA_TON_TAI");
      }
      // 2. Mã P2003 của Prisma: Mã Vai trò (id_vai_tro) không tồn tại
      if (error.code === "P2003") {
        throw new Error("VAI_TRO_KHONG_TON_TAI");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm Nhân Viên theo mã (id), tên (ho_ten) hoặc email
  async find(filterData) {
    const where = {};

    // Tìm kiếm chính xác theo mã
    if (filterData.id) {
      where.id = filterData.id;
    }

    // Tìm kiếm gần đúng theo họ tên
    if (filterData.ho_ten) {
      where.ho_ten = {
        contains: filterData.ho_ten,
        mode: "insensitive",
      };
    }

    // Tìm kiếm theo vai trò
    if (filterData.id_vai_tro) {
      where.id_vai_tro = filterData.id_vai_tro;
    }

    // Tìm kiếm theo trạng thái
    if (filterData.trang_thai !== undefined) {
      where.trang_thai = filterData.trang_thai;
    }

    return await prisma.nhan_vien.findMany({
      where: where,
      include: {
        vai_tro: true,
      },
    });
  }

  // ==================== Cập nhật thông tin một Nhân Viên dựa trên id ======================
  async update(id, payload) {
    const updateData = this.extractNhanVienData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính (id)

    // MÃ HÓA MẬT KHẨU MỚI (NẾU CÓ TRUYỀN SANG)
    if (updateData.mat_khau && updateData.mat_khau.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      updateData.mat_khau = await bcrypt.hash(updateData.mat_khau, salt);
    } else {
      // Nếu client gửi mat_khau rỗng/null -> Xóa key mat_khau để Prisma không ghi đè mất pass cũ
      delete updateData.mat_khau;
    }

    try {
      const result = await prisma.nhan_vien.update({
        where: { id: id },
        data: updateData,
        include: {
          vai_tro: true,
        },
      });
      return result;
    } catch (error) {
      // 1. Không tìm thấy bản ghi cần update
      if (error.code === "P2025") {
        return null;
      }
      // 2. Trùng Email với nhân viên khác
      if (error.code === "P2002") {
        throw new Error("EMAIL_DA_TON_TAI");
      }
      // 3. Mã Vai trò cập nhật không tồn tại
      if (error.code === "P2003") {
        throw new Error("VAI_TRO_KHONG_TON_TAI");
      }
      throw error;
    }
  }

  // ======================== Xóa (khóa) Nhân Viên dựa trên id  ==============================
  async delete(id) {
    try {
      const result = await prisma.nhan_vien.update({
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

  // ======================== Khôi phục Nhân Viên dựa trên id  ==============================
  async restore(id) {
    try {
      const result = await prisma.nhan_vien.update({
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

  // ====================== Xóa (khóa) tất cả các Nhân Viên ========================
  async deleteAll() {
    try {
      const result = await prisma.nhan_vien.updateMany({
        where: {
          trang_thai: true, // Chỉ vô hiệu hóa những nhân viên đang hoạt động
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

  // ==================== Tìm một Nhân Viên dựa trên id ======================
  async findById(id) {
    return await prisma.nhan_vien.findUnique({
      where: { id: id },
      include: {
        vai_tro: true,
      },
    });
  }

  // ==================== Đăng nhập tài khoản nhân viên ======================
  async login(email, mat_khau) {
    // Tìm nhân viên theo email kèm theo thông tin vai trò (role)
    const nhanVien = await prisma.nhan_vien.findUnique({
      where: { email: email },
      include: {
        vai_tro: true,
      },
    });

    if (!nhanVien) {
      return null;
    }

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(mat_khau, nhanVien.mat_khau);
    if (!isMatch) return null;

    return nhanVien;
  }
}

module.exports = NhanVienService;
