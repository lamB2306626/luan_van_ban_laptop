const prisma = require("../utils/prisma");
const moment = require("moment");
const querystring = require("qs");
const crypto = require("crypto");
const DonhangService = require("./don-hang.service");

class ThanhToanService {
  constructor() {
    this.donHangService = new DonhangService();
  }

  // Hàm sắp xếp các tham số alphabet theo quy định VNPAY
  sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
  }

  // Lọc dữ liệu hợp lệ cho bảng thanh_toan
  extractThanhToanData(payload) {
    const thanhToan = {
      id: payload.id,
      phuong_thuc: payload.phuong_thuc,
      ma_giao_dich: payload.ma_giao_dich,
      so_tien: payload.so_tien,
      trang_thai: payload.trang_thai,
      ngay_thanh_toan: payload.ngay_thanh_toan,
      id_don_hang: payload.id_don_hang,
    };
    Object.keys(thanhToan).forEach(
      (key) => thanhToan[key] === undefined && delete thanhToan[key],
    );
    return thanhToan;
  }

  // ==================== 1. Tạo URL Thanh Toán VNPAY ====================
  async createPaymentUrl({ orderId, amount, orderInfo, ipAddr }) {
    const tmnCode = process.env.VNP_TMNCODE;
    const secretKey = process.env.VNP_HASHSECRET;
    let vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURNURL;

    const date = new Date();
    const createDate = moment(date).format("YYYYMMDDHHmmss");

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo || `Thanh toan don hang ${orderId}`,
      vnp_OrderType: "other",
      vnp_Amount: amount * 100,
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    vnp_Params = this.sortObject(vnp_Params);

    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    vnp_Params["vnp_SecureHash"] = signed;
    vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

    return vnpUrl;
  }

  // ==================== 2. Xử lý Callback VNPAY & Lưu CSDL ====================
  async processVnpayReturn(vnp_Params) {
    let params = { ...vnp_Params };
    const secureHash = params["vnp_SecureHash"];

    delete params["vnp_SecureHash"];
    delete params["vnp_SecureHashType"];

    params = this.sortObject(params);
    const secretKey = process.env.VNP_HASHSECRET;
    const signData = querystring.stringify(params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    // Kiểm tra tính hợp lệ của chữ ký
    if (secureHash !== signed) {
      throw new Error("INVALID_CHECKSUM");
    }

    const orderId = params["vnp_TxnRef"];
    const responseCode = params["vnp_ResponseCode"];
    const vnp_TransactionNo = params["vnp_TransactionNo"];
    const amount = Number(params["vnp_Amount"]) / 100;

    if (responseCode === "00") {
      // A. Cập nhật trạng thái đơn hàng trong bảng don_hang, sau đó gọi hàm duyệt đơn hàng
      await prisma.don_hang.update({
        where: { id: orderId },
        data: { trang_thai_thanh_toan: "THANH_CONG" },
      });

      await this.donHangService.duyetDonHang(orderId);

      // B. Thêm bản ghi mới vào bảng thanh_toan (nếu chưa tồn tại mã giao dịch)
      const existingPayment = await prisma.thanh_toan.findFirst({
        where: { ma_giao_dich: vnp_TransactionNo },
      });

      if (!existingPayment) {
        // Tự sinh mã ID thanh toán (VD: TT01, TT02...)
        const lastTT = await prisma.thanh_toan.findFirst({
          orderBy: { id: "desc" },
        });

        let newId = "TT01";
        if (lastTT) {
          const currentNum = parseInt(lastTT.id.replace(/\D/g, ""), 10) || 0;
          newId = `TT${String(currentNum + 1).padStart(2, "0")}`;
        }

        await prisma.thanh_toan.create({
          data: {
            id: newId,
            id_don_hang: orderId,
            phuong_thuc: "VNPAY",
            ma_giao_dich: vnp_TransactionNo,
            so_tien: amount,
            trang_thai: "THANH_CONG",
            ngay_thanh_toan: new Date(),
          },
        });
      }

      return {
        status: "SUCCESS",
        message: "Cập nhật thanh toán thành công!",
      };
    } else {
      // Trường hợp thất bại, cập nhật trạng thái đơn hàng trong bảng don_hang, sau đó gọi hàm hủy đơn hàng
      await prisma.don_hang.update({
        where: { id: orderId },
        data: { trang_thai_thanh_toan: "THAT_BAI" },
      });

      await this.donHangService.huyDonHang(orderId, {
        ly_do_huy: "Khách hàng thanh toán thất bại",
        type: "TT_THAT_BAI",
      });

      throw new Error("PAYMENT_FAILED");
    }
  }

  // ==================== 3. Lấy danh sách giao dịch (Có lọc) ====================
  async find(filterData) {
    const where = {};

    if (filterData.id_don_hang) {
      where.id_don_hang = filterData.id_don_hang;
    }

    if (filterData.ma_giao_dich) {
      where.ma_giao_dich = filterData.ma_giao_dich;
    }

    if (filterData.phuong_thuc) {
      where.phuong_thuc = filterData.phuong_thuc;
    }

    return await prisma.thanh_toan.findMany({
      where: where,
      include: {
        don_hang: true, // Lấy kèm thông tin đơn hàng nếu cần
      },
    });
  }

  // ==================== 4. Tìm 1 giao dịch theo ID ====================
  async findById(id) {
    return await prisma.thanh_toan.findUnique({
      where: { id: id },
      include: { don_hang: true },
    });
  }

  // ==================== 5. Xóa 1 bản ghi thanh toán ====================
  async delete(id) {
    try {
      return await prisma.thanh_toan.delete({
        where: { id: id },
      });
    } catch (error) {
      if (error.code === "P2025") {
        return null;
      }
      throw error;
    }
  }

  // ==================== 6. Xóa tất cả lịch sử thanh toán ====================
  async deleteAll() {
    const result = await prisma.thanh_toan.deleteMany({});
    return result.count;
  }
}

module.exports = ThanhToanService;
