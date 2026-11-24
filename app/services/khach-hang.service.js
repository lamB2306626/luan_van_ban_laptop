const prisma = require("../utils/prisma");
const bcrypt = require("bcrypt");

const PhieuKhachHangService = require("./phieu-khach-hang.service");
const phieuKhachHangService = new PhieuKhachHangService();

const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(
  "123250462571-d7bggil4n0be4kpp5pkgcor11mssntgc.apps.googleusercontent.com",
);

class KhachHangService {
  // Trích xuất và định dạng dữ liệu đầu vào
  extractKhachHangData(payload) {
    const khachHang = {
      id: payload.id,
      ho_ten: payload.ho_ten,
      email: payload.email,
      mat_khau: payload.mat_khau,
      so_dien_thoai: payload.so_dien_thoai,
      ngay_sinh: payload.ngay_sinh ? new Date(payload.ngay_sinh) : undefined,
      avatar: payload.avatar,
      trang_thai:
        payload.trang_thai !== undefined
          ? Boolean(payload.trang_thai)
          : undefined,
      tong_chi_tieu:
        payload.tong_chi_tieu !== undefined
          ? Number(payload.tong_chi_tieu)
          : undefined,
      id_hang_thanh_vien: payload.id_hang_thanh_vien,
    };
    Object.keys(khachHang).forEach(
      (key) => khachHang[key] === undefined && delete khachHang[key],
    );
    return khachHang;
  }

  // ==================== HELPER 1: Tìm Hạng Phù Hợp Theo Chi Tiêu ====================
  async getHangPhuHopByChiTieu(tongChiTieu, tx) {
    const db = tx || prisma;

    // Tìm hạng thành viên cao nhất mà tổng chi tiêu đạt/vượt mốc
    const matchedHang = await db.hang_thanh_vien.findFirst({
      where: {
        moc_chi_tieu: {
          lte: Number(tongChiTieu), // lte = Less Than or Equal (<=)
        },
      },
      orderBy: {
        moc_chi_tieu: "desc", // Lấy hạng có mốc chi tiêu cao nhất đủ điều kiện
      },
    });

    return matchedHang; // Trả về object Hạng hoặc null nếu < 50 triệu
  }

  // ==================== HELPER 2: Cập Nhật Chi Tiêu & Xét Nâng Hạng & Tặng phiếu giảm giá ====================
  async updateTongChiTieuAndHang(id_khach_hang, amount, tx) {
    const db = tx || prisma;

    const khachHang = await db.khach_hang.findUnique({
      where: { id: id_khach_hang },
    });

    if (!khachHang) throw new Error("KHACH_HANG_KHONG_TON_TAI");

    const newTongChiTieu = Number(khachHang.tong_chi_tieu) + Number(amount);
    const matchedHang = await this.getHangPhuHopByChiTieu(newTongChiTieu, db);

    // Xác định id hạng mới: Nếu tìm thấy hạng phù hợp thì lấy id hạng đó, ngược lại là null
    const newHangId = matchedHang ? matchedHang.id : null;

    // Kiểm tra điều kiện TĂNG HẠNG:
    // - Có hạng mới (newHangId khác null)
    // - Và hạng mới khác với hạng hiện tại của khách hàng
    const isUpgraded =
      newHangId !== null && newHangId !== khachHang.id_hang_thanh_vien;

    // 2. Cập nhật khách hàng
    const updatedCustomer = await db.khach_hang.update({
      where: { id: id_khach_hang },
      data: {
        tong_chi_tieu: newTongChiTieu,
        id_hang_thanh_vien: newHangId,
      },
      include: { hang_thanh_vien: true },
    });

    // 3. Nếu ĐƯỢC TĂNG HẠNG -> Tìm và tặng phiếu giảm giá
    if (isUpgraded) {
      const dsPhieuHang = await db.phieu_hang_thanh_vien.findMany({
        where: { id_hang_thanh_vien: newHangId },
      });

      // Tận dụng hàm create của PhieuKhachHangService
      for (const item of dsPhieuHang) {
        await phieuKhachHangService.create(
          {
            id_khach_hang: id_khach_hang,
            id_phieu_giam_gia: item.id_phieu_giam_gia,
          },
          db, // Truyền db (đang là tx) vào đây để gom chung transaction
        );
      }

      // GỌI HÀM GỬI THÔNG BÁO TẶNG PHIẾU KHI TĂNG HANG
      const ThongBaoService = require("./thong-bao.service");
      const thongBaoService = new ThongBaoService();
      await thongBaoService.sendThangHangNotification(
        {
          khachHang: updatedCustomer,
          hangMoi: matchedHang,
          soLuongPhieu: dsPhieuHang.length,
        },
        db, // Truyền db (tx) vào để an toàn Transaction
      );
    }

    return updatedCustomer;
  }

  // ==================== HELPER 3: Cập nhật hạng phù hợp cho 1 Khách hàng ====================
  async updateHang(id_khach_hang, tx) {
    const db = tx || prisma;
    const khachHang = await db.khach_hang.findUnique({
      where: { id: id_khach_hang },
    });

    if (!khachHang) return;

    // Tìm hạng phù hợp theo mốc chi tiêu mới nhất
    const matchedHang = await this.getHangPhuHopByChiTieu(
      khachHang.tong_chi_tieu,
      db,
    );
    const newHangId = matchedHang ? matchedHang.id : null;

    // Nếu hạng mới khác với hạng hiện tại trong database
    if (newHangId !== khachHang.id_hang_thanh_vien) {
      // Kiểm tra xem đây có phải trường hợp thăng hạng không để tặng phiếu
      const isUpgraded =
        newHangId !== null &&
        (!khachHang.id_hang_thanh_vien ||
          newHangId > khachHang.id_hang_thanh_vien);

      // Cập nhật lại ID hạng mới
      const updatedCustomer = await db.khach_hang.update({
        where: { id: id_khach_hang },
        data: { id_hang_thanh_vien: newHangId },
      });

      // Nếu nâng lên hạng mới -> Tặng bổ sung các phiếu thuộc hạng mới đó
      if (isUpgraded) {
        const dsPhieuHang = await db.phieu_hang_thanh_vien.findMany({
          where: { id_hang_thanh_vien: newHangId },
        });

        for (const item of dsPhieuHang) {
          await phieuKhachHangService.create(
            {
              id_khach_hang: id_khach_hang,
              id_phieu_giam_gia: item.id_phieu_giam_gia,
            },
            db,
          );
        }

        // GỌI HÀM GỬI THÔNG BÁO TẶNG PHIẾU KHI TĂNG HANG
        const ThongBaoService = require("./thong-bao.service");
        const thongBaoService = new ThongBaoService();
        await thongBaoService.sendThangHangNotification(
          {
            khachHang: updatedCustomer,
            hangMoi: matchedHang,
            soLuongPhieu: dsPhieuHang.length,
          },
          db, // Truyền db (tx) vào để an toàn Transaction
        );
      }
    }
  }

  // ==================== HELPER 4: Quét toàn bộ Khách hàng để tái xét hạng ====================
  async updateHangAllKhachHang() {
    try {
      const allCustomers = await prisma.khach_hang.findMany({
        select: { id: true },
      });

      // Lặp qua từng khách hàng và cập nhật lại hạng phù hợp
      for (const customer of allCustomers) {
        await this.updateHang(customer.id);
      }
      console.log(
        "-> [SUCCESS] Đã đồng bộ lại toàn bộ hạng thành viên cho khách hàng!",
      );
    } catch (error) {
      console.error("-> [ERROR] Lỗi khi đồng bộ lại hạng thành viên:", error);
    }
  }

  // ==================== 1. Tạo Khách Hàng mới ====================
  async create(payload, tx) {
    const db = tx || prisma;
    if (!payload.id) {
      const lastKhachHang = await db.khach_hang.findFirst({
        orderBy: { id: "desc" },
      });

      if (!lastKhachHang) {
        payload.id = "KH0001";
      } else {
        const currentNumber =
          parseInt(lastKhachHang.id.replace(/\D/g, ""), 10) || 0;
        payload.id = `KH${String(currentNumber + 1).padStart(4, "0")}`;
      }
    }

    const data = this.extractKhachHangData(payload);

    // MÃ HÓA MẬT KHẨU NẾU CÓ
    if (data.mat_khau) {
      const salt = await bcrypt.genSalt(10);
      data.mat_khau = await bcrypt.hash(data.mat_khau, salt);
    }

    try {
      return await db.khach_hang.create({
        data: data,
        include: { hang_thanh_vien: true },
      });
    } catch (error) {
      if (error.code === "P2002") {
        throw new Error("EMAIL_KHONG_HOP_LE_HOAC_DA_TON_TAI");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm danh sách Khách Hàng (Hỗ trợ lọc theo mã, tên, email, sđt)
  async find(filterData) {
    const where = {};

    if (filterData.id) where.id = filterData.id;
    if (filterData.email) where.email = filterData.email;
    if (filterData.so_dien_thoai)
      where.so_dien_thoai = filterData.so_dien_thoai;
    if (filterData.id_hang_thanh_vien)
      where.id_hang_thanh_vien = filterData.id_hang_thanh_vien;

    if (filterData.ho_ten) {
      where.ho_ten = {
        contains: filterData.ho_ten,
        mode: "insensitive",
      };
    }

    if (filterData.trang_thai !== undefined) {
      where.trang_thai = filterData.trang_thai;
    }

    return await prisma.khach_hang.findMany({
      where: where,
      include: { hang_thanh_vien: true },
    });
  }

  // 3. Cập nhật thông tin Khách Hàng theo ID
  async update(id, payload) {
    const updateData = this.extractKhachHangData(payload);
    delete updateData.id; // Không cho phép sửa id
    delete updateData.tong_chi_tieu; // Không cho phép sửa tong_chi_tieu, chỉ cho phép cập nhật tự động khi thêm đơn hàng
    delete updateData.id_hang_thanh_vien; // Không cho phép sửa id_hang_thanh_vien, chỉ cho phép cập nhật tự động khi cập nhật tong_chi_tieu

    try {
      return await prisma.khach_hang.update({
        where: { id: id },
        data: updateData,
        include: { hang_thanh_vien: true },
      });
    } catch (error) {
      if (error.code === "P2025") return null;
      if (error.code === "P2002") {
        throw new Error("EMAIL_KHONG_HOP_LE_HOAC_DA_TON_TAI");
      }
      if (error.code === "P2003") {
        throw new Error("HANG_THANH_VIEN_KHONG_TON_TAI");
      }
      throw error;
    }
  }

  // 4. Xóa (khóa) một Khách Hàng theo ID
  async delete(id) {
    try {
      return await prisma.khach_hang.update({
        where: { id: id },
        data: { trang_thai: false },
      });
    } catch (error) {
      if (error.code === "P2025") return null;
      throw error;
    }
  }

  // 5. Khôi phục Khách hàng dựa trên id
  async restore(id) {
    try {
      const result = await prisma.khach_hang.update({
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

  // 6. Xóa (khóa) tất cả Khách Hàng
  async deleteAll() {
    const result = await prisma.khach_hang.updateMany({
      where: {
        trang_thai: true, // Chỉ cập nhật những tài khoản đang hoạt động để tối ưu performance
      },
      data: {
        trang_thai: false,
      },
    });
    return result.count;
  }

  // 7. Tìm một Khách Hàng theo ID
  async findById(id) {
    return await prisma.khach_hang.findUnique({
      where: { id: id },
      include: { hang_thanh_vien: true },
    });
  }

  // ==================== Đăng nhập tài khoản khách hàng ======================
  async login(email, mat_khau) {
    // Tìm nhân viên theo email kèm theo thông tin vai trò (role)
    const khachHang = await prisma.khach_hang.findUnique({
      where: { email: email },
    });

    if (!khachHang) {
      return null;
    }

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(mat_khau, khachHang.mat_khau);
    if (!isMatch) return null;

    return khachHang;
  }

  // ==================== Đăng nhập tài khoản GOOGLE ======================
  async loginWithGoogle(googleToken) {
    // 1. Xác thực ID Token với Google
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience:
        "123250462571-d7bggil4n0be4kpp5pkgcor11mssntgc.apps.googleusercontent.com",
    });

    const payload = ticket.getPayload();
    const {
      sub: providerid,
      email,
      name: hoten,
      picture: googleImageUrl,
    } = payload;

    // 2. Tìm khách hàng trong DB (Theo providerid HOẶC email)
    let user = await prisma.khach_hang.findFirst({
      where: {
        OR: [{ providerid: providerid }, { email: email }],
      },
    });

    // 3. Nếu chưa tồn tại -> Tải avatar & Tái sử dụng hàm this.create() để tạo tài khoản mới
    if (!user) {
      let savedAvatarFileName = null;
      if (googleImageUrl) {
        const fileName = `kh_${Date.now().toString().slice(-8)}.jpg`;
        savedAvatarFileName = await this.saveSocialAvatar(
          googleImageUrl,
          fileName,
        );
      }

      // Gọi lại hàm this.create() -> Tự động sinh ID tăng dần (KH01, KH02...)
      user = await this.create({
        ho_ten: hoten,
        email: email,
        avatar: savedAvatarFileName,
        provider: "google",
        providerid: providerid,
        trang_thai: true,
        tong_chi_tieu: 0,
      });
    } else if (!user.providerid) {
      // 4. Trường hợp tài khoản đã tồn tại (đã đăng ký bằng Email thường trước đó)
      // Cập nhật thông tin Google Provider và bổ sung Avatar nếu chưa có
      let savedAvatarFileName = user.avatar;
      if (!savedAvatarFileName && googleImageUrl) {
        const fileName = `kh_${Date.now().toString().slice(-8)}.jpg`;
        savedAvatarFileName = await this.saveSocialAvatar(
          googleImageUrl,
          fileName,
        );
      }

      user = await prisma.khach_hang.update({
        where: { id: user.id },
        data: {
          provider: "google",
          providerid: providerid,
          avatar: savedAvatarFileName,
        },
      });
    }

    // 5. Kiểm tra trạng thái tài khoản (trang_thai kiểu Boolean: false = Khóa)
    if (!user.trang_thai) {
      throw new Error("TAI_KHOAN_BI_KHOA");
    }

    return user;
  }

  // ==================== Đăng nhập tài khoản FACEBOOK ======================
  async loginWithFacebook(facebookToken) {
    // 1. Gọi Graph API của Facebook để lấy thông tin người dùng
    let fbRes;
    try {
      fbRes = await axios.get("https://graph.facebook.com/v19.0/me", {
        params: {
          fields: "id,name,email,picture.type(large)",
          access_token: facebookToken,
        },
      });
    } catch (err) {
      console.error(
        "Lỗi Graph API Facebook:",
        err.response?.data || err.message,
      );
      throw new Error("XAC_THUC_FACEBOOK_THAT_BAI");
    }

    const { id: providerid, name: hoten, picture } = fbRes.data;
    const fbImageUrl = picture?.data?.url || null;

    // Xử lý trường hợp Facebook không trả về email (đăng ký FB bằng SĐT)
    const email = fbRes.data.email || `${providerid}@facebook.com`;

    // 2. Tìm khách hàng trong DB (Theo providerid HOẶC email)
    let user = await prisma.khach_hang.findFirst({
      where: {
        OR: [{ providerid: providerid }, { email: email }],
      },
    });

    // 3. Nếu chưa tồn tại -> Tải avatar & Tái sử dụng hàm this.create() để tạo tài khoản mới
    if (!user) {
      let savedAvatarFileName = null;
      if (fbImageUrl) {
        const fileName = `fb_${Date.now().toString().slice(-8)}.jpg`;
        savedAvatarFileName = await this.saveSocialAvatar(fbImageUrl, fileName);
      }

      // Gọi lại hàm this.create() -> Tự động sinh ID tăng dần (KH01, KH02...)
      user = await this.create({
        ho_ten: hoten,
        email: email,
        avatar: savedAvatarFileName,
        provider: "facebook",
        providerid: providerid,
        trang_thai: true,
        tong_chi_tieu: 0,
      });
    } else if (!user.providerid) {
      // 4. Trường hợp tài khoản đã tồn tại (đã đăng ký bằng Email thường trước đó)
      // Cập nhật thông tin Facebook Provider và bổ sung Avatar nếu chưa có
      let savedAvatarFileName = user.avatar;
      if (!savedAvatarFileName && fbImageUrl) {
        const fileName = `fb_${Date.now().toString().slice(-8)}.jpg`;
        savedAvatarFileName = await this.saveSocialAvatar(fbImageUrl, fileName);
      }

      user = await prisma.khach_hang.update({
        where: { id: user.id },
        data: {
          provider: "facebook",
          providerid: providerid,
          avatar: savedAvatarFileName,
        },
      });
    }

    // 5. Kiểm tra trạng thái tài khoản (trang_thai kiểu Boolean: false = Khóa)
    if (!user.trang_thai) {
      throw new Error("TAI_KHOAN_BI_KHOA");
    }

    return user;
  }

  // ==================== Tải và Lưu Ảnh từ Google ======================
  async saveSocialAvatar(imageUrl, filename) {
    try {
      // process.cwd() lấy thư mục gốc dự án Node.js
      const uploadDir = path.join(process.cwd(), "public/uploads/KhachHang");

      // Tự động tạo thư mục nếu chưa có
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, filename);

      // Tải ảnh stream từ Google
      const response = await axios({
        url: imageUrl,
        method: "GET",
        responseType: "stream",
      });

      return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        writer.on("finish", () => {
          // Trả về tên file ngắn gọn để lưu vào DB (khớp với VarChar(30))
          resolve(filename);
        });

        writer.on("error", (err) => {
          console.error("❌ Lỗi khi ghi file ảnh:", err);
          resolve(null);
        });
      });
    } catch (error) {
      console.error("❌ Lỗi khi tải Google Avatar:", error.message);
      return null;
    }
  }
}

module.exports = KhachHangService;
