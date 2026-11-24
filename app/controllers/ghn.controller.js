const GHNService = require("../services/ghn.service");
const DonHangService = require("../services/don-hang.service");
const ApiError = require("../api-error");
const prisma = require("../utils/prisma");

// ================= 1. Lấy danh sách Tỉnh / Thành =================
exports.getProvinces = async (req, res, next) => {
  try {
    const ghnService = new GHNService();
    const data = await ghnService.getProvinces();
    return res.send(data);
  } catch (error) {
    console.error(`Lỗi khi xóa chi tiết `, error);
    return next(
      new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách Tỉnh/Thành từ GHN"),
    );
  }
};

// ================= 2. Lấy danh sách Quận / Huyện =================
exports.getDistricts = async (req, res, next) => {
  const { provinceId } = req.params;
  if (!provinceId) {
    return next(new ApiError(400, "provinceId không được để trống"));
  }

  try {
    const ghnService = new GHNService();
    const data = await ghnService.getDistricts(provinceId);
    return res.send(data);
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi lấy danh sách Quận/Huyện với provinceId = ${provinceId}`,
      ),
    );
  }
};

// ================= 3. Lấy danh sách Phường / Xã =================
exports.getWards = async (req, res, next) => {
  const { districtId } = req.params;
  if (!districtId) {
    return next(new ApiError(400, "districtId không được để trống"));
  }

  try {
    const ghnService = new GHNService();
    const data = await ghnService.getWards(districtId);
    return res.send(data);
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi lấy danh sách Phường/Xã với districtId = ${districtId}`,
      ),
    );
  }
};

// ================= 4. Tính phí vận chuyển =================
exports.calculateShippingFee = async (req, res, next) => {
  try {
    const { to_district_id, to_ward_code, items, tong_tien } = req.body;

    if (!to_district_id || !to_ward_code || !items || items.length === 0) {
      return next(
        new ApiError(400, "Thiếu thông tin địa chỉ giao hàng hoặc sản phẩm!"),
      );
    }

    // Khởi tạo service và gọi hàm tính phí
    const ghnService = new GHNService();
    const result = await ghnService.calculateFee({
      to_district_id,
      to_ward_code,
      items,
      tong_tien,
    });

    // Trả kết quả về cho Frontend
    return res.send({
      success: true,
      phi_van_chuyen: result?.total || 0,
      data: result,
    });
  } catch (error) {
    console.error(
      "Lỗi khi tính phí ship GHN:",
      error.response?.data || error.message,
    );
    return next(
      new ApiError(
        500,
        error.response?.data?.message ||
          "Không thể tính phí vận chuyển từ GHN lúc này.",
      ),
    );
  }
};

// ================= 5. Tạo vận đơn GHN =================
exports.createOrderGHN = async (req, res, next) => {
  try {
    const { id_don_hang } = req.params;

    if (!id_don_hang) {
      return next(new ApiError(400, "Thiếu mã đơn hàng cần xác nhận!"));
    }

    // Khởi tạo service và gọi hàm xử lý
    const ghnService = new GHNService();
    const result = await ghnService.createOrder(id_don_hang);

    // Trả kết quả về cho Vue Frontend
    return res.status(200).json({
      success: true,
      message: "Xác nhận đơn hàng và tạo vận đơn GHN thành công!",
      data: result,
    });
  } catch (error) {
    console.error(
      "Lỗi khi xác nhận đơn hàng sang GHN:",
      error.response?.data || error.message,
    );
    return next(
      new ApiError(
        500,
        error.message ||
          error.response?.data?.message ||
          "Không thể tạo vận đơn sang GHN lúc này.",
      ),
    );
  }
};

// lay thong tin van hang
exports.getGHNOrderDetail = async (req, res) => {
  try {
    const { orderCode } = req.params;

    if (!orderCode) {
      return res.status(400).json({
        success: false,
        message: "Mã vận đơn GHN (orderCode) là bắt buộc",
      });
    }
    const ghnService = new GHNService();

    const ghnData = await ghnService.getOrderDetail(orderCode);

    return res.status(200).json({
      success: true,
      message: "Lấy thông tin đơn hàng từ GHN thành công",
      data: {
        order_code: ghnData.order_code,
        status: ghnData.status, // Trạng thái đơn trên GHN (ready_to_pick, picking, delivering...)
        cod_amount: ghnData.cod_amount, // Số tiền thu hộ COD
        insurance_value: ghnData.insurance_value, // Giá trị khai giá
        to_name: ghnData.to_name,
        to_phone: ghnData.to_phone,
        to_address: ghnData.to_address,
        weight: ghnData.weight,
        total_fee: ghnData.total_fee, // Cước phí vận chuyển
        log: ghnData.log, // Lịch sử hành trình chuyển hàng
        raw: ghnData, // Toàn bộ dữ liệu gốc từ GHN nếu muốn soi chi tiết
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Không thể lấy thông tin đơn hàng từ GHN",
      error: error.response?.data?.message || error.message,
    });
  }
};

// Nhận dữ liệu từ GHN bắn sang, cập nhật trạng thái tương ứng vào cơ sở dữ liệu
exports.handleGHNWebhook = async (req, res, next) => {
  try {
    // GHN Webhook thường gửi lên các thông tin quan trọng này qua req.body
    const { order_code, status, payment_type_id, cod_amount } = req.body;

    console.log("📥 Nhận Webhook từ GHN:", { order_code, status });

    if (!order_code || !status) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin order_code hoặc status từ webhook!",
      });
    }

    // 1. Tìm đơn hàng trong Database dựa vào mã vận đơn (ma_van_don)
    const donHang = await prisma.don_hang.findFirst({
      where: { ma_van_don: order_code },
    });

    if (!donHang) {
      // ⚠️ QUAN TRỌNG: Dù không tìm thấy đơn, vẫn phải trả về HTTP 200 cho GHN
      // để GHN biết server đã nhận được tin, tránh việc GHN liên tục gửi lại (retry).
      return res.status(200).json({
        success: true,
        message: "Không tìm thấy mã vận đơn tương ứng trong hệ thống.",
      });
    }

    const donHangService = new DonHangService();

    let newStatus = null;
    let updatePaymentData = {};

    // 2. Ánh xạ (Map) trạng thái của GHN sang trạng thái của website bạn
    switch (status) {
      case "transporting": // Đang luân chuyển
      case "delivering": // Shipper đang đi giao cho khách
        // Chỉ đổi sang DANG_VAN_CHUYEN nếu đơn đang ở trạng thái DA_XAC_NHAN
        if (donHang.trang_thai_don_hang === "DA_XAC_NHAN") {
          await donHangService.chuyenTTDangVanChuyen(donHang.id);
          console.log(
            `✅ Đã tự động cập nhật đơn hàng [${donHang.id}] sang trạng thái: DA_XAC_NHAN`,
          );
        }
        break;

      case "delivered": // Giao hàng thành công
        // Cho phép chuyển sang HOAN_THANH nếu đơn đang giao hoặc đã xác nhận
        if (
          ["DA_XAC_NHAN", "DANG_VAN_CHUYEN"].includes(
            donHang.trang_thai_don_hang,
          )
        ) {
          await donHangService.chuyenTTHoanThanh(donHang.id);
          console.log(
            `✅ Đã tự động cập nhật đơn hàng [${donHang.id}] sang trạng thái: HOAN_THANH`,
          );
        }
        break;

      case "cancel": // Đơn bị hủy / giao thất bại trả về
        if (
          ["DA_XAC_NHAN", "DANG_VAN_CHUYEN"].includes(
            donHang.trang_thai_don_hang,
          )
        ) {
          await donHangService.huyDonBoiGHThatBai(donHang.id);
          console.log(
            `✅ Đã tự động cập nhật đơn hàng [${donHang.id}] sang trạng thái: GIAO_THAT_BAI`,
          );
        }
        break;

      default:
        // Các trạng thái khác của GHN (như ready_to_pick, picking...) ta có thể bỏ qua chưa cần đổi trạng thái đơn chính
        break;
    }

    // 3. Phản hồi lại cho GHN biết server đã xử lý thành công
    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    console.error("❌ Lỗi xử lý GHN Webhook:", error.message);
    // Vẫn trả về 200 để tránh GHN spam gọi lại liên tục khi server gặp lỗi cú pháp bất thường
    return res.status(200).json({ success: false, error: error.message });
  }
};
