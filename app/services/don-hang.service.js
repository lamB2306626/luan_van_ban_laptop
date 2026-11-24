const prisma = require("../utils/prisma");
const KhachHangService = require("./khach-hang.service");
const BienTheService = require("./bien-the.service");
const ChiTietGioHangService = require("./chi-tiet-gio-hang.service");
const PhieuKhachHangService = require("./phieu-khach-hang.service");
const ThongBaoService = require("./thong-bao.service");
const GHNService = require("./ghn.service");

class DonHangService {
  constructor() {
    this.khachHangService = new KhachHangService();
    this.bienTheService = new BienTheService();
    this.chiTietGioHangService = new ChiTietGioHangService();
    this.phieuKhachHangService = new PhieuKhachHangService();
    this.thongBaoService = new ThongBaoService();
    this.ghnService = new GHNService();
  }

  extractDonHangData(payload) {
    const donHang = {
      id: payload.id,
      id_khach_hang: payload.id_khach_hang,
      id_nhan_vien: payload.id_nhan_vien,
      phuong_thuc_thanh_toan: payload.phuong_thuc_thanh_toan,
      id_phieu_giam_gia: payload.id_phieu_giam_gia,
      tien_van_chuyen:
        payload.tien_van_chuyen !== undefined ? payload.tien_van_chuyen : 0,
      tong_tien_thanh_toan:
        payload.tong_tien_thanh_toan !== undefined
          ? payload.tong_tien_thanh_toan
          : 0,
      trang_thai_don_hang: payload.trang_thai_don_hang || "CHO_DUYET",
      trang_thai_thanh_toan: payload.trang_thai_thanh_toan || "CHUA_THANH_TOAN",
      ngay_dat: payload.ngay_dat,
      ngay_giao: payload.ngay_giao,
      so_dien_thoai: payload.so_dien_thoai,
      dia_chi: payload.dia_chi,
      province_id: payload.province_id,
      district_id: payload.district_id,
      ward_code: payload.ward_code,
      ma_van_don: payload.ma_van_don,
      ly_do_huy: payload.ly_do_huy,
    };

    Object.keys(donHang).forEach(
      (key) => donHang[key] === undefined && delete donHang[key],
    );
    return donHang;
  }

  // ==================== HELPER: Chỉ tính tiền giảm từ Voucher ====================
  tinhTienGiamVoucher(phieu, tongTienSauKM) {
    if (!phieu) {
      return tongTienSauKM < 0 ? 0 : tongTienSauKM;
    }

    const giaTriGiam = Number(phieu.gia_tri_giam) || 0;
    let soTienGiamVoucher = 0;

    if (phieu.loai_phieu === "PHAN_TRAM") {
      soTienGiamVoucher = (tongTienSauKM * giaTriGiam) / 100;

      // Nếu có quy định giảm tối đa và tiền giảm vượt trần -> Giới hạn lại
      if (phieu.giam_toi_da !== null && soTienGiamVoucher > phieu.giam_toi_da) {
        soTienGiamVoucher = phieu.giam_toi_da;
      }
    } else if (phieu.loai_phieu === "CO_DINH") {
      soTienGiamVoucher = giaTriGiam;
    }

    let tongTienSauDungPGG = tongTienSauKM - soTienGiamVoucher;
    if (tongTienSauDungPGG < 0) {
      tongTienSauDungPGG = 0;
    }

    return tongTienSauDungPGG;
  }

  // ==================== HELPER: Tính & cập nhật lại các tổng tiền đơn hàng ====================
  async recalculateTotal(idDonHang, tx) {
    const db = tx || prisma;

    // 1. Lấy thông tin đơn hàng kèm phiếu giảm giá
    const donHang = await db.don_hang.findUnique({
      where: { id: idDonHang },
      include: { phieu_giam_gia: true },
    });

    if (!donHang) {
      throw new Error("DON_HANG_KHONG_TON_TAI");
    }

    // 2. Lấy danh sách chi tiết đơn hàng
    const listChiTiet = await db.chi_tiet_don_hang.findMany({
      where: { id_don_hang: idDonHang },
    });

    // 3. Tính Tổng tiền gốc & Tổng tiền tạm tính từ các cột snapshot
    let tongTienGoc = 0;
    let tongTienSauKM = 0;

    listChiTiet.forEach((item) => {
      const soLuong = Number(item.so_luong) || 0;
      const giaGoc = Number(item.gia_goc) || 0;
      const donGiaApDung = Number(item.don_gia_ap_dung) || 0;

      tongTienGoc += giaGoc * soLuong;
      tongTienSauKM += donGiaApDung * soLuong;
    });

    const tongTienGiamKm = tongTienGoc - tongTienSauKM;

    // 4. Gọi hàm helper để tính toán giảm giá voucher
    const tongTienSauDungPGG = this.tinhTienGiamVoucher(
      donHang.phieu_giam_gia,
      tongTienSauKM,
    );

    const tongTienThanhToan =
      tongTienSauDungPGG + Number(donHang.tien_van_chuyen);

    // 5. Cập nhật các tổng tiền vào đơn hàng
    return await db.don_hang.update({
      where: { id: idDonHang },
      data: {
        tong_tien_goc: tongTienGoc,
        tong_tien_giam_km: tongTienGiamKm < 0 ? 0 : tongTienGiamKm,
        tong_tien_thanh_toan: tongTienThanhToan,
      },
    });
  }

  // ==================== XEM TRƯỚC ĐƠN HÀNG (PREVIEW CHECKOUT) TỪ DANH SÁCH CÁC CHI TIẾT GIỎ HÀNG =====================
  async previewCheckout(payload, tx) {
    const { items, id_khach_hang } = payload;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("DANH_SACH_SAN_PHAM_RONG");
    }

    if (!id_khach_hang) {
      throw new Error("KHACH_HANG_KHONG_HOP_LE");
    }

    // 1. Lấy danh sách items kèm thông tin biến thể & giá áp dụng
    const listChiTietGioHang = await this.chiTietGioHangService.find(
      {
        danh_sach_id: items,
        id_khach_hang: id_khach_hang, // Chỉ lấy giỏ hàng thuộc khách hàng hiện tại
      },
      tx,
    );

    if (listChiTietGioHang.length !== items.length) {
      throw new Error("DANH_SACH_CHI_TIET_GIO_HANG_KHONG_HOP_LE");
    }

    // 2. Tính tổng tiền gốc và tổng tiền sau khi giảm giá từ chương trình khuyến mãi (sản phẩm)
    let tongTienGoc = 0;
    let tongTienSauKM = 0;

    const chiTietDonHang = listChiTietGioHang.map((item) => {
      tongTienGoc += (Number(item.gia_goc) || 0) * (Number(item.so_luong) || 0);
      tongTienSauKM +=
        (Number(item.don_gia_ap_dung) || 0) * (Number(item.so_luong) || 0);
      return item;
    });

    const tongTienGiamKm = tongTienGoc - tongTienSauKM;

    // 4. Trả về kết quả preview cùng danh sách phiếu giảm giá
    return {
      id_khach_hang: id_khach_hang,
      tong_tien_goc: tongTienGoc,
      tong_tien_giam_km: tongTienGiamKm < 0 ? 0 : tongTienGiamKm,
      tong_tien_sau_km: tongTienSauKM, // Tiền tạm tính sau KM sản phẩm (chưa trừ voucher)
      chi_tiet_don_hang: chiTietDonHang,
    };
  }

  // ==================== TẠO ĐƠN HÀNG TỪ GIỎ HÀNG ====================
  async checkout(payload) {
    const { items, ...donHangPayload } = payload;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("DANH_SACH_SAN_PHAM_RONG");
    }

    const MAX_SELECT_ITEMS = 5;
    if (items.length > MAX_SELECT_ITEMS) {
      throw new Error("DANH_SACH_CHI_DUOC_PHEP_TOI_DA_5_SAN_PHAM");
    }

    if (!donHangPayload.id_khach_hang) {
      throw new Error("KHACH_HANG_KHONG_HOP_LE");
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Lấy danh sách các món trong giỏ hàng
      const listChiTietGioHang = await tx.chi_tiet_gio_hang.findMany({
        where: {
          id: { in: items },
          gio_hang: { id_khach_hang: donHangPayload.id_khach_hang },
        },
      });

      if (listChiTietGioHang.length !== items.length) {
        throw new Error("DANH_SACH_CHI_TIET_GIO_HANG_KHONG_HOP_LE");
      }

      // 2. Tạo đơn hàng gốc trước
      const donHang = await this.create(donHangPayload, tx);

      // 3. Khởi tạo ChiTietDonHangService để tạo các item chi tiết
      const ChiTietDonHangService = require("./chi-tiet-don-hang.service");
      const chiTietDonHangService = new ChiTietDonHangService();

      let tongTienSauKM = 0;

      // Lặp tạo từng chi tiết đơn hàng (Logic tính giá KM & trừ tồn kho nằm hoàn toàn trong service này)
      for (const ctgh of listChiTietGioHang) {
        const newChiTiet = await chiTietDonHangService.create(
          {
            id_don_hang: donHang.id,
            id_bien_the: ctgh.id_bien_the,
            so_luong: ctgh.so_luong,
          },
          tx,
        );

        // Tích lũy tổng tiền từ don_gia_ap_dung mà ChiTietDonHangService đã tự tính toán
        tongTienSauKM +=
          Number(newChiTiet.don_gia_ap_dung) * newChiTiet.so_luong;
      }

      // 4. Áp dụng phiếu giảm giá nếu khách hàng có chọn (dựa trên tongTienSauKM chính xác)
      if (donHangPayload.id_phieu_giam_gia) {
        await this.phieuKhachHangService.suDungPhieu(
          donHangPayload.id_khach_hang,
          donHangPayload.id_phieu_giam_gia,
          tongTienSauKM,
          tx,
        );
      }

      // 5. Dọn dẹp các món đã đặt khỏi giỏ hàng
      await tx.chi_tiet_gio_hang.deleteMany({
        where: {
          id: { in: items },
        },
      });

      // 6. Tính lại tổng tiền thực tế cuối cùng của đơn hàng (Đã trừ phiếu giảm giá nếu có)
      const donHangCapNhat = await this.recalculateTotal(donHang.id, tx);

      // 7. Kiểm tra hạn mức thanh toán COD (<= 45.000.000đ)
      const MAX_COD_AMOUNT = 45000000;
      if (
        donHangCapNhat.phuong_thuc_thanh_toan === "COD" &&
        Number(donHangCapNhat.tong_tien_thanh_toan) > MAX_COD_AMOUNT
      ) {
        throw new Error("VUOT_QUA_HAN_MUC_COD");
      }

      // 8. Trả về thông tin đơn hàng đầy đủ
      return await tx.don_hang.findUnique({
        where: { id: donHang.id },
        include: {
          khach_hang: true,
          phieu_giam_gia: true,
          chi_tiet_don_hang: {
            include: {
              bien_the: true,
            },
          },
        },
      });
    });
  }

  // ============================== 1. Tạo Đơn hàng mới ==================================
  async create(payload, tx) {
    const executeLogic = async (transaction) => {
      // Tự sinh mã đơn hàng nếu chưa truyền id
      if (!payload.id) {
        const lastDonHang = await transaction.don_hang.findFirst({
          orderBy: { id: "desc" },
        });

        const currentNumber = lastDonHang
          ? parseInt(lastDonHang.id.replace(/\D/g, ""), 10) || 0
          : 0;

        payload.id = `DH${String(currentNumber + 1).padStart(6, "0")}`;
      }

      const data = this.extractDonHangData(payload);

      // Tạo đơn hàng
      return await transaction.don_hang.create({
        data: data,
        include: {
          khach_hang: true,
          phieu_giam_gia: true,
        },
      });
    };

    if (tx) {
      return await executeLogic(tx);
    }
    return await prisma.$transaction(async (transaction) => {
      return await executeLogic(transaction);
    });
  }

  // =================== 2. Lấy danh sách Đơn hàng theo bộ lọc =================
  async find(filter) {
    const where = {};

    if (filter.id) {
      where.id = { contains: filter.id };
    }
    if (filter.id_khach_hang) {
      where.id_khach_hang = filter.id_khach_hang;
    }
    if (filter.phuong_thuc_thanh_toan) {
      where.phuong_thuc_thanh_toan = filter.phuong_thuc_thanh_toan;
    }
    if (filter.trang_thai_don_hang) {
      where.trang_thai_don_hang = filter.trang_thai_don_hang;
    }
    if (filter.trang_thai_thanh_toan) {
      where.trang_thai_thanh_toan = filter.trang_thai_thanh_toan;
    }

    return await prisma.don_hang.findMany({
      where: where,
      include: {
        khach_hang: true,
        phieu_giam_gia: true,
        chi_tiet_don_hang: {
          include: {
            bien_the: {
              include: {
                mau_sac: true,
                cpu: true,
                gpu: true,
                dung_luong_ram: true,
                dung_luong_rom: true,
                san_pham: {
                  include: {
                    anh_san_pham: {
                      where: {
                        la_anh_chinh: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { ngay_dat: "desc" },
    });
  }

  // ============================== 3. Tìm một Đơn hàng theo ID ==================================
  async findById(id) {
    return await prisma.don_hang.findUnique({
      where: { id: id },
      include: {
        // khach_hang: true,
        phieu_giam_gia: true,
        chi_tiet_don_hang: {
          include: {
            danh_gia: true,
            bien_the: {
              include: {
                mau_sac: true,
                cpu: true,
                gpu: true,
                dung_luong_ram: true,
                dung_luong_rom: true,
                san_pham: {
                  include: {
                    anh_san_pham: {
                      where: {
                        la_anh_chinh: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  // ============================== 4. Cập nhật Đơn hàng & Tích lũy chi tiêu ==================================
  async update(id, payload) {
    return await prisma.$transaction(async (tx) => {
      // 1. Kiểm tra đơn hàng tồn tại
      const currentOrder = await tx.don_hang.findUnique({
        where: { id: id },
      });

      if (!currentOrder) return null;

      const data = this.extractDonHangData(payload);
      delete data.id; // Không cho phép sửa id
      delete data.tong_tien_thanh_toan;
      delete data.id_nhan_vien;
      delete data.id_khach_hang;
      delete data.id_phieu_giam_gia;

      // 2. Cập nhật thông tin đơn hàng
      const updatedOrder = await tx.don_hang.update({
        where: { id: id },
        data: data,
        include: {
          khach_hang: true,
          phieu_giam_gia: true,
        },
      });

      return updatedOrder;
    });
  }

  // ============================== 5. Xóa một Đơn hàng ==================================
  async delete(id) {
    const currentOrder = await prisma.don_hang.findUnique({
      where: { id: id },
    });
    if (!currentOrder) return null;

    return await prisma.don_hang.delete({
      where: { id: id },
    });
  }

  // ============================== 6. Xóa tất cả Đơn hàng ==================================
  async deleteAll() {
    const result = await prisma.don_hang.deleteMany({});
    return result.count;
  }

  // ==================== DUYỆT ĐƠN HÀNG ====================
  async duyetDonHang(idDonHang, payload = {}, tx) {
    const transaction = tx || prisma;
    // 1. Tìm đơn hàng cần duyệt
    const donHang = await transaction.don_hang.findUnique({
      where: { id: idDonHang },
      include: {
        khach_hang: true,
      },
    });

    if (!donHang) {
      throw new Error("KHONG_TIM_THAY_DON_HANG");
    }

    // 2. Chỉ cho phép duyệt khi đơn hàng đang CHO_DUYET và đơn hàng chưa có mã vận đơn
    if (donHang.trang_thai_don_hang !== "CHO_DUYET") {
      throw new Error("DON_HANG_KHONG_O_TRANG_THAI_CHO_DUYET");
    }

    if (donHang.ma_van_don) {
      throw new Error("DON_HANG_DA_CO_MA_VAN_DON");
    }

    // 3. Chuẩn bị dữ liệu cập nhật
    const updateData = {
      trang_thai_don_hang: "DA_XAC_NHAN",
    };

    if (payload.id_nhan_vien) {
      updateData.id_nhan_vien = payload.id_nhan_vien;
    }

    // Tao đơn hàng GHN
    try {
      const orderGHN = await this.ghnService.createOrder(idDonHang);
      if (orderGHN && orderGHN.order_code)
        updateData.ma_van_don = orderGHN.order_code;
    } catch (error) {
      console.error("Lỗi khi tạo đơn hàng GHN:", error);
      throw error;
    }

    // 4. Cập nhật trạng thái và nhân viên xử lý đơn
    const updatedDonHang = await transaction.don_hang.update({
      where: { id: idDonHang },
      data: updateData,
    });

    // 5. Gửi thông báo tự động
    try {
      if (payload.type === "NV_DUYET") {
        await this.thongBaoService.sendDuyetDonNotification(
          {
            donHang: updatedDonHang,
            idKhachHang: donHang.id_khach_hang,
            tenKhachHang: donHang.khach_hang?.ho_ten,
          },
          transaction,
        );
      }
    } catch (error) {
      console.error("Lỗi khi gửi thông báo:", error);
      throw error;
    }
    return updatedDonHang;
  }

  // ==================== HỦY ĐƠN HÀNG & HOÀN TỒN KHO ====================
  async huyDonHang(idDonHang, payload = {}, tx) {
    const executeLogic = async (transaction) => {
      // 1. Tìm đơn hàng cần hủy
      const donHang = await transaction.don_hang.findUnique({
        where: { id: idDonHang },
        include: {
          chi_tiet_don_hang: true,
          khach_hang: true,
        },
      });

      if (!donHang) {
        return null; // Không tìm thấy đơn hàng
      }

      // 2. Kiểm tra trạng thái: Chỉ cho phép hủy khi ở trạng thái "CHO_DUYET"
      if (donHang.trang_thai_don_hang !== "CHO_DUYET") {
        throw new Error("DON_HANG_KHONG_THE_HUY");
      }

      // 3. Hoàn lại số lượng tồn kho cho từng biến thể trong chi tiết đơn
      if (donHang.chi_tiet_don_hang && donHang.chi_tiet_don_hang.length > 0) {
        await Promise.all(
          donHang.chi_tiet_don_hang.map((chiTiet) =>
            this.bienTheService.tangSoLuongTonKho(
              chiTiet.id_bien_the,
              chiTiet.so_luong,
              transaction,
            ),
          ),
        );
      }

      // 4. HOÀN TRẢ PHIẾU GIẢM GIÁ (nếu đơn hàng có sử dụng phiếu)
      if (donHang.id_phieu_giam_gia) {
        await this.phieuKhachHangService.hoanTraPhieu(
          donHang.id_khach_hang,
          donHang.id_phieu_giam_gia,
          transaction,
        );
      }

      // 5. PHÂN BIỆT NGƯỜI HỦY ĐƠN & GHI CHÚ
      const type = payload.type;
      const lyDo = payload.ly_do_huy;

      // 6. Cập nhật trạng thái đơn hàng thành "NV_HUY"
      const updatedDonHang = await transaction.don_hang.update({
        where: { id: idDonHang },
        data: {
          trang_thai_don_hang: type === "NHAN_VIEN_HUY" ? "NV_HUY" : "KH_HUY",
          ly_do_huy: lyDo,
          // Nếu là Admin hủy thì lưu id_nhan_vien_huy_don vào đơn hàng
          ...(type === "NHAN_VIEN_HUY" && {
            id_nhan_vien: payload.id_nhan_vien_huy_don,
          }),
        },
        include: {
          chi_tiet_don_hang: true,
        },
      });

      // 7. GỬI THÔNG BÁO TỰ ĐỘNG
      await this.thongBaoService.sendHuyDonNotification(
        {
          donHang: updatedDonHang,
          idKhachHang: donHang.id_khach_hang,
          tenKhachHang: donHang.khach_hang?.ho_ten,
          type: type,
        },
        transaction,
      );

      return updatedDonHang;
    };

    try {
      if (tx) {
        return await executeLogic(tx);
      }
      return await prisma.$transaction(async (transaction) => {
        return await executeLogic(transaction);
      });
    } catch (error) {
      console.error("Lỗi khi hủy đơn hàng:", error);
      throw error;
    }
  }

  // ==================== HỦY ĐƠN HÀNG & HOÀN TỒN KHO (BỞI NHÂN VIÊN) ====================
  async huyDonBoiNhanVien(idDonHang, payload = {}, tx) {
    const executeLogic = async (transaction) => {
      const donHang = await transaction.don_hang.findUnique({
        where: { id: idDonHang },
        include: { chi_tiet_don_hang: true, khach_hang: true },
      });

      if (!donHang) return null;

      // Nhân viên chỉ được hủy khi đơn đang chờ duyệt
      if (donHang.trang_thai_don_hang !== "CHO_DUYET") {
        throw new Error("DON_HANG_KHONG_THE_HUY");
      }

      // Hoàn kho
      if (donHang.chi_tiet_don_hang?.length > 0) {
        await Promise.all(
          donHang.chi_tiet_don_hang.map((chiTiet) =>
            this.bienTheService.tangSoLuongTonKho(
              chiTiet.id_bien_the,
              chiTiet.so_luong,
              transaction,
            ),
          ),
        );
      }

      // Hoàn phiếu giảm giá
      if (donHang.id_phieu_giam_gia) {
        await this.phieuKhachHangService.hoanTraPhieu(
          donHang.id_khach_hang,
          donHang.id_phieu_giam_gia,
          transaction,
        );
      }

      // Cập nhật trạng thái NV_HUY kèm nhân viên hủy
      const updatedDonHang = await transaction.don_hang.update({
        where: { id: idDonHang },
        data: {
          trang_thai_don_hang: "NV_HUY",
          ly_do_huy: payload.ly_do_huy,
          id_nhan_vien: payload.id_nhan_vien_huy_don,
        },
        include: { chi_tiet_don_hang: true },
      });

      // Gửi thông báo
      await this.thongBaoService.sendHuyDonNotification(
        {
          donHang: updatedDonHang,
          idKhachHang: donHang.id_khach_hang,
          tenKhachHang: donHang.khach_hang?.ho_ten,
          type: "NV_HUY",
        },
        transaction,
      );

      return updatedDonHang;
    };

    return tx
      ? await executeLogic(tx)
      : await prisma.$transaction(async (t) => await executeLogic(t));
  }

  // ==================== HỦY ĐƠN HÀNG & HOÀN TỒN KHO (BỞI KHÁCH HÀNG) ====================
  async huyDonBoiKhachHang(idDonHang, payload = {}, tx) {
    const executeLogic = async (transaction) => {
      const donHang = await transaction.don_hang.findUnique({
        where: { id: idDonHang },
        include: { chi_tiet_don_hang: true, khach_hang: true },
      });

      if (!donHang) return null;

      // Khách chỉ được tự hủy khi đơn đang chờ duyệt
      if (donHang.trang_thai_don_hang !== "CHO_DUYET") {
        throw new Error("DON_HANG_KHONG_CHO_PHE_DUYET_KHONG_THE_HUY");
      }

      // Hoàn kho
      if (donHang.chi_tiet_don_hang?.length > 0) {
        await Promise.all(
          donHang.chi_tiet_don_hang.map((chiTiet) =>
            this.bienTheService.tangSoLuongTonKho(
              chiTiet.id_bien_the,
              chiTiet.so_luong,
              transaction,
            ),
          ),
        );
      }

      // Hoàn phiếu giảm giá
      if (donHang.id_phieu_giam_gia) {
        await this.phieuKhachHangService.hoanTraPhieu(
          donHang.id_khach_hang,
          donHang.id_phieu_giam_gia,
          transaction,
        );
      }

      // Cập nhật trạng thái KH_HUY
      const updatedDonHang = await transaction.don_hang.update({
        where: { id: idDonHang },
        data: {
          trang_thai_don_hang: "KH_HUY",
          ly_do_huy: payload.ly_do_huy || "Khách hàng tự hủy đơn",
        },
        include: { chi_tiet_don_hang: true },
      });

      // Gửi thông báo
      await this.thongBaoService.sendHuyDonNotification(
        {
          donHang: updatedDonHang,
          idKhachHang: donHang.id_khach_hang,
          tenKhachHang: donHang.khach_hang?.ho_ten,
          type: payload.type,
        },
        transaction,
      );

      return updatedDonHang;
    };

    return tx
      ? await executeLogic(tx)
      : await prisma.$transaction(async (t) => await executeLogic(t));
  }

  // ==================== HỦY ĐƠN HÀNG DO GIAO HÀNG THẤT BẠI ====================
  async huyDonBoiGHThatBai(idDonHang, tx) {
    const executeLogic = async (transaction) => {
      const donHang = await transaction.don_hang.findUnique({
        where: { id: idDonHang },
        include: { chi_tiet_don_hang: true, khach_hang: true },
      });

      if (!donHang) return null;

      // Chỉ chuyển sang GIAO_THAT_BAI nếu đơn đang trong quá trình giao hoặc đã xác nhận
      if (
        !["DA_XAC_NHAN", "DANG_VAN_CHUYEN"].includes(
          donHang.trang_thai_don_hang,
        )
      ) {
        return null; // Không hợp lệ để chuyển trạng thái này
      }

      // Hoàn lại tồn kho vì hàng đã được shipper hoàn trả về kho cửa hàng
      if (donHang.chi_tiet_don_hang?.length > 0) {
        await Promise.all(
          donHang.chi_tiet_don_hang.map((chiTiet) =>
            this.bienTheService.tangSoLuongTonKho(
              chiTiet.id_bien_the,
              chiTiet.so_luong,
              transaction,
            ),
          ),
        );
      }

      // Cập nhật trạng thái đơn hàng thành GIAO_THAT_BAI
      const updatedDonHang = await transaction.don_hang.update({
        where: { id: idDonHang },
        data: {
          trang_thai_don_hang: "GIAO_THAT_BAI",
          // ly_do_huy: lyDo, // Có thể dùng chung trường lưu lý do hoặc ghi chú vận chuyển
        },
        include: { chi_tiet_don_hang: true },
      });

      // Gửi thông báo cho khách hàng về việc giao hàng không thành công
      await this.thongBaoService.sendHuyDonNotification(
        {
          donHang: updatedDonHang,
          idKhachHang: donHang.id_khach_hang,
          tenKhachHang: donHang.khach_hang?.ho_ten,
          type: "GH_THAT_BAI",
        },
        transaction,
      );

      return updatedDonHang;
    };

    return tx
      ? await executeLogic(tx)
      : await prisma.$transaction(async (t) => await executeLogic(t));
  }

  // ==================== CHUYỂN TRẠNG THÁI ĐƠN HÀNG SANG ĐANG VẬN CHUYỂN ====================
  async chuyenTTDangVanChuyen(idDonHang, tx) {
    const executeLogic = async (transaction) => {
      // 1. Tìm đơn hàng cần chuyển trạng thái
      const donHang = await transaction.don_hang.findUnique({
        where: { id: idDonHang },
        include: {
          khach_hang: true,
        },
      });

      if (!donHang) {
        throw new Error("KHONG_TIM_THAY_DON_HANG");
      }

      //2. Chỉ cho phép duyệt khi đơn hàng đang DA_XAC_NHAN
      if (donHang.trang_thai_don_hang !== "DA_XAC_NHAN") {
        throw new Error("DON_HANG_KHONG_O_TRANG_DA_XAC_NHAN");
      }

      // 3. Chuẩn bị dữ liệu cập nhật
      const updateData = {
        trang_thai_don_hang: "DANG_VAN_CHUYEN",
      };

      // 4. Cập nhật trạng thái
      const updatedDonHang = await transaction.don_hang.update({
        where: { id: idDonHang },
        data: updateData,
      });

      return updatedDonHang;
    };
    try {
      if (tx) {
        return await executeLogic(tx);
      }
      return await prisma.$transaction(async (transaction) => {
        return await executeLogic(transaction);
      });
    } catch (error) {
      console.error(
        "Lỗi khi chuyển trạng thái đơn hàng sang đang vận chuyển:",
        error,
      );
      throw error;
    }
  }

  // ==================== CHUYỂN TRẠNG THÁI ĐƠN HÀNG SANG ĐÃ HOÀN THÀNH ====================
  async chuyenTTHoanThanh(idDonHang, tx) {
    const executeLogic = async (transaction) => {
      // 1. Tìm đơn hàng cần chuyển trạng thái
      const donHang = await transaction.don_hang.findUnique({
        where: { id: idDonHang },
        include: {
          khach_hang: true,
        },
      });

      if (!donHang) {
        throw new Error("KHONG_TIM_THAY_DON_HANG");
      }

      //2. Chỉ cho phép duyệt khi đơn hàng đang DA_XAC_NHAN
      if (
        donHang.trang_thai_don_hang !== "DA_XAC_NHAN" &&
        donHang.trang_thai_don_hang !== "DANG_VAN_CHUYEN"
      ) {
        throw new Error(
          "DON_HANG_KHONG_O_TRANG_DA_XAC_NHAN_HOAC_DANG_VAN_CHUYEN",
        );
      }

      // 3. Chuẩn bị dữ liệu cập nhật
      const updateData = {
        trang_thai_don_hang: "HOAN_THANH",
      };

      if (donHang.phuong_thuc_thanh_toan == "COD") {
        updateData.trang_thai_thanh_toan = "DA_THANH_TOAN";
      }

      // 4. Cập nhật trạng thái
      const updatedDonHang = await transaction.don_hang.update({
        where: { id: idDonHang },
        data: updateData,
      });

      // 5. LOGIC TÍCH LŨY CHI TIÊU:
      await this.khachHangService.updateTongChiTieuAndHang(
        updatedDonHang.id_khach_hang,
        updatedDonHang.tong_tien_thanh_toan,
        transaction,
      );

      return updatedDonHang;
    };
    try {
      if (tx) {
        return await executeLogic(tx);
      }
      return await prisma.$transaction(async (transaction) => {
        return await executeLogic(transaction);
      });
    } catch (error) {
      console.error(
        "Lỗi khi chuyển trạng thái đơn hàng sang hoàn thành:",
        error,
      );
      throw error;
    }
  }

  // ==================== THANH TOÁN LẠI ĐƠN HÀNG ====================
  async updateSLTTandNgayDat(idDonHang, tx) {
    const executeLogic = async (transaction) => {
      // 1. Tìm đơn hàng cần thanh toán lại
      const donHang = await transaction.don_hang.findUnique({
        where: { id: idDonHang },
      });

      if (!donHang) {
        return null; // Không tìm thấy đơn hàng
      }

      // 2. Kiểm tra điều kiện: Phải là phương thức QR_CODE, chưa thanh toán và đang CHO_DUYET
      if (
        donHang.phuong_thuc_thanh_toan !== "QR_CODE" ||
        donHang.trang_thai_thanh_toan !== "CHUA_THANH_TOAN" ||
        donHang.trang_thai_don_hang !== "CHO_DUYET"
      ) {
        throw new Error("DON_HANG_KHONG_HOP_LE_THANH_TOAN_LAI");
      }

      // 3. Kiểm tra giới hạn số lần thanh toán lại tối đa (ví dụ: 3 lần)
      const SO_LAN_TOI_DA = 3;
      if (donHang.so_lan_thanh_toan_lai >= SO_LAN_TOI_DA) {
        throw new Error("VUOT_QUA_SO_LAN_THANH_TOAN_LAI");
      }

      // 4. Cập nhật tăng số lần thanh toán lại lên 1 và reset ngay_dat về thời điểm hiện tại
      const updatedDonHang = await transaction.don_hang.update({
        where: { id: idDonHang },
        data: {
          so_lan_thanh_toan_lai: {
            increment: 1, // Tăng giá trị hiện tại lên 1
          },
          ngay_dat: new Date(), // Cập nhật lại thời gian đặt để reset đồng hồ đếm ngược 15 phút mới
        },
      });

      return updatedDonHang;
    };

    try {
      if (tx) {
        return await executeLogic(tx);
      }

      return await prisma.$transaction(async (transaction) => {
        return await executeLogic(transaction);
      });
    } catch (error) {
      console.error("Lỗi khi thanh toán lại đơn hàng:", error);
      throw error;
    }
  }

  // ==================== QUÉT VÀ HỦY ĐƠN HÀNG QUÁ HẠN THANH TOÁN ====================
  async quetVaHuyDonQuaHan() {
    // Đặt thời gian quá hạn là 15 phút trước tính từ thời điểm hiện tại
    const phutQuaHan = 15;
    const thoiGianGioiHan = new Date(Date.now() - phutQuaHan * 60 * 1000);

    // 1. Tìm các đơn hàng thỏa mãn điều kiện quá hạn
    const danhSachDonQuaHan = await prisma.don_hang.findMany({
      where: {
        phuong_thuc_thanh_toan: "QR_CODE", // Hoặc danh sách các phương thức thanh toán online của bạn
        trang_thai_thanh_toan: "CHUA_THANH_TOAN",
        trang_thai_don_hang: "CHO_DUYET",
        ngay_dat: {
          lte: thoiGianGioiHan, // Nhỏ hơn hoặc bằng thời điểm 15 phút trước
        },
      },
      select: { id: true }, // Chỉ lấy id để tối ưu hiệu suất truy vấn
    });

    if (!danhSachDonQuaHan || danhSachDonQuaHan.length === 0) {
      return { count: 0, message: "Không có đơn hàng nào quá hạn." };
    }

    console.log(
      `[CRON JOB] Tìm thấy ${danhSachDonQuaHan.length} đơn hàng quá hạn thanh toán. Đang tiến hành hủy...`,
    );

    let countSuccess = 0;

    // 2. Duyệt qua từng đơn hàng và gọi lại chính hàm huyDonHang bạn đã viết
    for (const don of danhSachDonQuaHan) {
      try {
        await this.huyDonBoiKhachHang(don.id, {
          ly_do_huy: "Hệ thống tự động hủy do quá thời gian thanh toán online)",
          // Không truyền id_nhan_vien_huy_don để hàm tự hiểu là khách tự hủy
          type: "TT_THAT_BAI",
        });
        countSuccess++;
      } catch (error) {
        console.error(
          `[CRON JOB] Lỗi khi hủy đơn hàng ${don.id}:`,
          error.message,
        );
      }
    }

    return {
      count: countSuccess,
      total: danhSachDonQuaHan.length,
    };
  }
}

module.exports = DonHangService;
