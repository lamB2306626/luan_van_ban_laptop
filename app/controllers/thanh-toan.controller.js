const ThanhToanService = require("../services/thanh-toan.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo URL Thanh Toán VNPAY ==================================
exports.createPaymentUrl = async (req, res, next) => {
  const { orderId, amount } = req.body;

  if (!orderId || !amount) {
    return next(
      new ApiError(400, "Mã đơn hàng và số tiền không được để trống"),
    );
  }

  try {
    const service = new ThanhToanService();

    // Lấy IP người dùng
    const ipAddr =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";

    const paymentUrl = await service.createPaymentUrl({
      orderId,
      amount,
      orderInfo: req.body.orderInfo,
      ipAddr,
    });

    return res.status(200).json({
      status: "OK",
      paymentUrl,
    });
  } catch (error) {
    return next(
      new ApiError(
        500,
        error.message || "Đã xảy ra lỗi khi tạo URL thanh toán VNPAY",
      ),
    );
  }
};

// ============================== 2. Xử lý Kết Quả Trả Về & Cập Nhật CSDL ==================================
exports.vnpayReturn = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(
      new ApiError(400, "Dữ liệu phản hồi thanh toán không được để trống"),
    );
  }

  try {
    const service = new ThanhToanService();
    const result = await service.processVnpayReturn(req.body);

    return res.status(200).json(result);
  } catch (error) {
    if (error.message === "INVALID_CHECKSUM") {
      return next(
        new ApiError(400, "Chữ ký bảo mật không hợp lệ (Checksum failed)"),
      );
    }

    if (error.message === "PAYMENT_FAILED") {
      return next(
        new ApiError(400, "Giao dịch thanh toán VNPAY không thành công"),
      );
    }

    return next(
      new ApiError(
        500,
        error.message || "Đã xảy ra lỗi khi xử lý kết quả thanh toán",
      ),
    );
  }
};

// ============================== 3. Lấy Danh Sách Lịch Sử Thanh Toán ==================================
exports.findAll = async (req, res, next) => {
  try {
    const service = new ThanhToanService();
    const filterData = {
      id_don_hang: req.query.id_don_hang,
      ma_giao_dich: req.query.ma_giao_dich,
      phuong_thuc: req.query.phuong_thuc,
    };

    const documents = await service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách lịch sử thanh toán"),
    );
  }
};

// ============================== 4. Tìm Chi Tiết 1 Giao Dịch Thanh Toán ==================================
exports.findOne = async (req, res, next) => {
  try {
    const service = new ThanhToanService();
    const document = await service.findById(req.params.id);

    if (!document) {
      return next(
        new ApiError(404, "Không tìm thấy thông tin giao dịch thanh toán"),
      );
    }

    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi truy vấn giao dịch thanh toán với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Xóa 1 Bản Ghi Thanh Toán ==================================
exports.delete = async (req, res, next) => {
  try {
    const service = new ThanhToanService();
    const document = await service.delete(req.params.id);

    if (!document) {
      return next(
        new ApiError(404, "Không tìm thấy giao dịch thanh toán cần xóa"),
      );
    }

    return res.send({ message: "Đã xóa bản ghi thanh toán thành công" });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi xóa giao dịch thanh toán với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 6. Xóa Tất Cả Lịch Sử Thanh Toán ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const service = new ThanhToanService();
    const deletedCount = await service.deleteAll();
    return res.send({
      message: `Đã xóa thành công ${deletedCount} bản ghi lịch sử thanh toán khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi trong quá trình dọn dẹp lịch sử thanh toán",
      ),
    );
  }
};
