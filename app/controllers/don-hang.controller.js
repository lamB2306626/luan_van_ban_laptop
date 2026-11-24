const DonHangService = require("../services/don-hang.service");
const GHNService = require("../services/ghn.service");
const ApiError = require("../api-error");

// ==================== Xem trước thông tin đơn hàng ====================
exports.previewCheckout = async (req, res, next) => {
  // Kiểm tra các trường thông tin bắt buộc
  if (!req.body?.id_khach_hang) {
    return next(new ApiError(400, "id_khach_hang không được để trống"));
  }

  if (
    !req.body?.items ||
    !Array.isArray(req.body.items) ||
    req.body.items.length === 0
  ) {
    return next(
      new ApiError(
        400,
        "Danh sách sản phẩm checkout (items) không được để trống",
      ),
    );
  }

  try {
    const donHangService = new DonHangService();

    const payload = {
      items: req.body.items, // Mảng ID chi tiết giỏ hàng: ["CTGH01", "CTGH02"]
      id_khach_hang: req.body.id_khach_hang,
      id_phieu_giam_gia: req.body.id_phieu_giam_gia,
    };

    const result = await donHangService.previewCheckout(payload);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Lỗi Checkout Chi Tiết:", error);

    if (error.message === "DANH_SACH_SAN_PHAM_RONG") {
      return next(
        new ApiError(400, "Danh sách sản phẩm items không được để trống"),
      );
    }
    if (error.message === "KHACH_HANG_KHONG_HOP_LE") {
      return next(new ApiError(400, "Thông tin khách hàng không hợp lệ"));
    }
    if (error.message === "DANH_SACH_CHI_TIET_GIO_HANG_KHONG_HOP_LE") {
      return next(
        new ApiError(
          400,
          "Một số sản phẩm trong giỏ hàng không tồn tại hoặc không thuộc về bạn",
        ),
      );
    }

    if (error.message === "PHIEU_GIAM_GIA_KHONG_HOP_LE_HOAC_DA_SU_DUNG") {
      return next(
        new ApiError(
          400,
          "Phiếu giảm giá không hợp lệ, không thuộc về khách hàng hoặc đã được sử dụng",
        ),
      );
    }

    if (error.message === "PHIEU_GIAM_GIA_HET_HAN_HOAC_CHUA_DEN_GIOT_AP_DUNG") {
      return next(
        new ApiError(
          400,
          "Phiếu giảm giá đã hết hạn hoặc chưa đến thời gian áp dụng",
        ),
      );
    }

    if (error.message === "DON_HANG_CHUA_DAT_GIA_TRI_TOI_THIEU") {
      return next(
        new ApiError(
          400,
          "Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã giảm giá này",
        ),
      );
    }

    return next(
      new ApiError(500, "Đã xảy ra lỗi khi tính toán xem trước đơn hàng"),
    );
  }
};

// ============================== CHECKOUT: Tạo Đơn Hàng từ Giỏ Hàng ==================================
exports.checkout = async (req, res, next) => {
  // 1. Kiểm tra các trường thông tin bắt buộc
  if (!req.body?.id_khach_hang) {
    return next(new ApiError(400, "id_khach_hang không được để trống"));
  }

  if (
    !req.body?.items ||
    !Array.isArray(req.body.items) ||
    req.body.items.length === 0
  ) {
    return next(
      new ApiError(
        400,
        "Danh sách sản phẩm checkout (items) không được để trống",
      ),
    );
  }

  try {
    const service = new DonHangService();
    const document = await service.checkout(req.body);

    return res.status(201).send({
      message: "Đặt hàng thành công!",
      data: document,
    });
  } catch (error) {
    console.error("Loi:", error);
    // Bắt các lỗi nghiệp vụ cụ thể
    if (error.message === "DANH_SACH_SAN_PHAM_RONG") {
      return next(
        new ApiError(
          400,
          "Danh sách sản phẩm mua không hợp lệ hoặc đang trống",
        ),
      );
    }

    if (error.message === "DANH_SACH_CHI_DUOC_PHEP_TOI_DA_5_SAN_PHAM") {
      return next(
        new ApiError(
          400,
          "Mỗi đơn hàng chi được phép đặt mua tối đa 5 phân loại sản phẩm",
        ),
      );
    }

    if (error.message === "DANH_SACH_CHI_TIET_GIO_HANG_KHONG_HOP_LE") {
      return next(
        new ApiError(
          400,
          "Một hoặc nhiều sản phẩm trong giỏ hàng không tồn tại hoặc không thuộc quyền sở hữu của bạn",
        ),
      );
    }

    if (error.message === "VUOT_QUA_GIOI_HAN_TOI_DA_3_SAN_PHAM") {
      return next(
        new ApiError(
          400,
          "Mỗi lần mua được thêm tối đa 3 sản phẩm cho mỗi phân loại",
        ),
      );
    }

    if (error.message === "SO_LUONG_TON_KHO_KHONG_DU") {
      return next(
        new ApiError(400, "Số lượng tồn kho không đủ để đáp ứng đơn hàng"),
      );
    }

    if (error.message === "DON_HANG_HOAC_BIEN_THE_KHONG_TON_TAI") {
      return next(
        new ApiError(404, "Sản phẩm biến thể trong đơn hàng không tồn tại"),
      );
    }

    if (error.message === "PHIEU_GIAM_GIA_KHONG_HOP_LE_HOAC_DA_SU_DUNG") {
      return next(
        new ApiError(
          400,
          "Phiếu giảm giá không hợp lệ, không thuộc về khách hàng hoặc đã được sử dụng",
        ),
      );
    }

    if (error.message === "PHIEU_GIAM_GIA_HET_HAN_HOAC_CHUA_DEN_GIOT_AP_DUNG") {
      return next(
        new ApiError(
          400,
          "Phiếu giảm giá đã hết hạn hoặc chưa đến thời gian áp dụng",
        ),
      );
    }

    if (error.message === "DON_HANG_CHUA_DAT_GIA_TRI_TOI_THIEU") {
      return next(
        new ApiError(
          400,
          "Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã giảm giá này",
        ),
      );
    }

    if (error.message === "VUOT_QUA_HAN_MUC_COD") {
      return next(
        new ApiError(
          400,
          "Đơn hàng có tổng thanh toán vượt quá 45.000.000đ không hỗ trợ thanh toán COD. Vui lòng chọn phương thức chuyển khoản QR Code.",
        ),
      );
    }

    // 3. Lỗi hệ thống ngoài dự kiến
    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình xử lý đặt hàng"),
    );
  }
};

// ============================== 1. Tạo Đơn Hàng Mới ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.id_khach_hang) {
    return next(new ApiError(400, "id_khach_hang không được để trống"));
  }
  if (!req.body?.dia_chi) {
    return next(new ApiError(400, "dia_chi không được để trống"));
  }

  try {
    const service = new DonHangService();
    const document = await service.create(req.body);
    return res.status(201).send({
      message: "Tạo đơn hàng thành công",
      data: document,
    });
  } catch (error) {
    if (error.code === "P2003") {
      return next(
        new ApiError(
          404,
          "Khách hàng, Nhân viên hoặc Phiếu giảm giá không tồn tại trong hệ thống",
        ),
      );
    }

    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình tạo đơn hàng mới"),
    );
  }
};

// =================== 2. Lấy danh sách Đơn Hàng kết hợp bộ lọc =================
exports.findAll = async (req, res, next) => {
  try {
    const service = new DonHangService();

    const filterData = {
      id: req.query.id, // Lọc theo mã (?id=DH01)
      id_khach_hang: req.query.id_khach_hang, // Lọc theo khách hàng (?id_khach_hang=KH01)
      phuong_thuc_thanh_toan: req.query.phuong_thuc_thanh_toan,
      trang_thai_don_hang: req.query.trang_thai_don_hang, // Lọc trạng thái (?trang_thai_don_hang=HOAN_THANH)
      trang_thai_thanh_toan: req.query.trang_thai_thanh_toan,
    };

    const documents = await service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách đơn hàng"));
  }
};

// ============================== 3. Cập nhật Đơn Hàng theo mã ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(
      new ApiError(
        400,
        "Dữ liệu cập nhật không được để trống không được để trống",
      ),
    );
  }

  try {
    const service = new DonHangService();
    const document = await service.update(req.params.id, req.body);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy đơn hàng cần cập nhật"));
    }

    return res.send({
      message: "Cập nhật đơn hàng thành công",
      data: document,
    });
  } catch (error) {
    console.error("lỗi:", error);
    if (error.code === "P2003") {
      return next(
        new ApiError(
          404,
          "Khách hàng, Nhân viên hoặc Phiếu giảm giá cập nhật không tồn tại",
        ),
      );
    }

    return next(
      new ApiError(500, `Lỗi khi cập nhật đơn hàng với mã = ${req.params.id}`),
    );
  }
};

// ============================== 4. Xóa một Đơn Hàng theo mã ==================================
exports.delete = async (req, res, next) => {
  try {
    const service = new DonHangService();
    const document = await service.delete(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy đơn hàng cần xóa"));
    }

    return res.send({ message: "Đã xóa đơn hàng thành công" });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa đơn hàng với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Xóa tất cả Đơn Hàng ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const service = new DonHangService();
    const deletedCount = await service.deleteAll();
    return res.send({
      message: `Đã xóa thành công ${deletedCount} đơn hàng khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình dọn dẹp đơn hàng"),
    );
  }
};

// ============================== 6. Tìm một Đơn Hàng theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const service = new DonHangService();
    const document = await service.findById(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy đơn hàng"));
    }

    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(500, `Lỗi khi truy vấn đơn hàng với mã = ${req.params.id}`),
    );
  }
};

// ============================== Duyệt Đơn Hàng ==================================
exports.approve = async (req, res, next) => {
  try {
    // Khởi tạo service và gọi hàm xử lý
    const service = new DonHangService();
    const result = await service.duyetDonHang(req.params.id, req.body);

    // Trả kết quả về cho Vue Frontend
    return res.status(200).json({
      success: true,
      message: "Duyệt đơn hàng và tạo vận đơn GHN thành công!",
      data: result,
    });
  } catch (error) {
    console.error(
      "Lỗi khi duyệt đơn hàng:",
      error.response?.data || error.message,
    );
    if (error.message === "KHONG_TIM_THAY_DON_HANG") {
      return next(new ApiError(400, "không tìm thấy đơn hàng cần duyệt!"));
    }

    if (error.message === "DON_HANG_KHONG_O_TRANG_THAI_CHO_DUYET") {
      return next(
        new ApiError(
          400,
          "Đơn hàng này không ở trạng thái chờ duyệt nên không thể duyệt!",
        ),
      );
    }

    if (error.message === "DON_HANG_DA_CO_MA_VAN_DON") {
      return next(new ApiError(400, "Đơn hàng này đã có đơn hàng GHN rồi!"));
    }

    return next(
      new ApiError(
        500,
        error.message ||
          error.response?.data?.message ||
          "Đã xảy ra lỗi khi hủy đơn hàng với mã = ${req.params.id}.",
      ),
    );
  }
};

// ============================== Hủy Đơn Hàng bởi nhân viên ==================================
exports.cancelByNhanVien = async (req, res, next) => {
  try {
    const service = new DonHangService();

    const result = await service.huyDonBoiNhanVien(req.params.id, req.body);

    if (!result) {
      return next(new ApiError(404, "Không tìm thấy đơn hàng cần hủy"));
    }

    return res.send({
      message:
        "Đã hủy đơn hàng, hoàn trả lại số lượng vào kho và hoàn trả phiểu giảm giá thành công",
      data: result,
    });
  } catch (error) {
    if (error.message === "DON_HANG_KHONG_THE_HUY") {
      return next(
        new ApiError(
          400,
          "Đơn hàng này không ở trạng thái chờ duyệt nên không thể hủy!",
        ),
      );
    }

    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi hủy đơn hàng với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== Hủy Đơn Hàng bởi khách hàng ==================================
exports.cancelByKhachHang = async (req, res, next) => {
  try {
    const service = new DonHangService();

    const result = await service.huyDonBoiKhachHang(req.params.id, req.body);

    if (!result) {
      return next(new ApiError(404, "Không tìm thấy đơn hàng cần hủy"));
    }

    return res.send({
      message:
        "Đã hủy đơn hàng, hoàn trả lại số lượng vào kho và hoàn trả phiểu giảm giá thành công",
      data: result,
    });
  } catch (error) {
    if (error.message === "DON_HANG_KHONG_THE_HUY") {
      return next(
        new ApiError(
          400,
          "Đơn hàng này không ở trạng thái chờ duyệt nên không thể hủy!",
        ),
      );
    }

    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi hủy đơn hàng với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== Chuyển trạng thái đơn hàng sang đang giao hàng ==================================
exports.toDelivering = async (req, res, next) => {
  try {
    // Khởi tạo service và gọi hàm xử lý
    const service = new DonHangService();
    const result = await service.chuyenTTDangVanChuyen(req.params.id);

    // Trả kết quả về cho Vue Frontend
    return res.status(200).json({
      success: true,
      message: "Chuyển trạng thái đơn hàng thành Đang giao hàng thành công!",
      data: result,
    });
  } catch (error) {
    console.error(
      "Lỗi khi chuyển trạng thái đơn hàng thành Đang giao hàng:",
      error.response?.data || error.message,
    );
    if (error.message === "KHONG_TIM_THAY_DON_HANG") {
      return next(
        new ApiError(400, "không tìm thấy đơn hàng cần chuyển trạng thái!"),
      );
    }

    if (error.message === "DON_HANG_KHONG_O_TRANG_THAI_DA_XAC_NHAN") {
      return next(
        new ApiError(
          400,
          "Đơn hàng này không ở trạng thái đã xác nhận nên không thể chuyển trạng thái!",
        ),
      );
    }

    return next(
      new ApiError(
        500,
        error.message ||
          error.response?.data?.message ||
          "Đã xảy ra lỗi khi chuyển trạng thái đơn hàng với mã = ${req.params.id}.",
      ),
    );
  }
};

// ============================== Chuyển trạng thái đơn hàng sang đang giao hàng ==================================
exports.toDelivered = async (req, res, next) => {
  try {
    // Khởi tạo service và gọi hàm xử lý
    const service = new DonHangService();
    const result = await service.chuyenTTHoanThanh(req.params.id);

    // Trả kết quả về cho Vue Frontend
    return res.status(200).json({
      success: true,
      message: "Chuyển trạng thái đơn hàng thành Đã hoàn thành thành công!",
      data: result,
    });
  } catch (error) {
    console.error(
      "Lỗi khi chuyển trạng thái đơn hàng thành Đã hoàn thành hàng:",
      error.response?.data || error.message,
    );
    if (error.message === "KHONG_TIM_THAY_DON_HANG") {
      return next(
        new ApiError(400, "không tìm thấy đơn hàng cần chuyển trạng thái!"),
      );
    }

    if (
      error.message ===
      "DON_HANG_KHONG_O_TRANG_DA_XAC_NHAN_HOAC_DANG_VAN_CHUYEN"
    ) {
      return next(
        new ApiError(
          400,
          "Đơn hàng này không ở trạng thái đã xác nhận hoặc Đang giao hàng nên không thể chuyển trạng thái!",
        ),
      );
    }

    return next(
      new ApiError(
        500,
        error.message ||
          error.response?.data?.message ||
          "Đã xảy ra lỗi khi chuyển trạng thái đơn hàng với mã = ${req.params.id}.",
      ),
    );
  }
};

// ============================== Thanh toán lại Đơn Hàng ==================================
exports.updateSLTTandNgayDat = async (req, res, next) => {
  try {
    const service = new DonHangService();

    const result = await service.updateSLTTandNgayDat(req.params.id);

    if (!result) {
      return next(
        new ApiError(404, "Không tìm thấy đơn hàng cần thanh toán lại"),
      );
    }

    return res.send({
      message: "Đã làm mới thời gian thanh toán đơn hàng thành công",
      data: result,
    });
  } catch (error) {
    if (error.message === "DON_HANG_KHONG_HOP_LE_THANH_TOAN_LAI") {
      return next(
        new ApiError(
          400,
          "Đơn hàng này không hợp lệ để thanh toán lại (phải là đơn QR Code, chưa thanh toán và đang chờ duyệt)!",
        ),
      );
    }

    if (error.message === "VUOT_QUA_SO_LAN_THANH_TOAN_LAI") {
      return next(
        new ApiError(
          400,
          "Bạn đã vượt quá số lần cho phép thanh toán lại cho đơn hàng này!",
        ),
      );
    }

    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi thanh toán lại đơn hàng với mã = ${req.params.id}`,
      ),
    );
  }
};
