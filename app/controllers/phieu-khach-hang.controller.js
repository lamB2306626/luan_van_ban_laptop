const PhieuKhachHangService = require("../services/phieu-khach-hang.service");
const ApiError = require("../api-error");

// ============================== 1. Gán Phiếu Giảm Giá cho Khách Hàng ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.id_phieu_giam_gia) {
    return next(new ApiError(400, "id_phieu_giam_gia không được để trống"));
  }

  // Kiểm tra phải có id_khach_hang HOẶC danh_sach_id_khach_hang
  const hasSingleCustomer = !!req.body?.id_khach_hang;
  const hasMultipleCustomers =
    Array.isArray(req.body?.danh_sach_id_khach_hang) &&
    req.body.danh_sach_id_khach_hang.length > 0;

  if (!hasSingleCustomer && !hasMultipleCustomers) {
    return next(
      new ApiError(
        400,
        "Vui lòng cung cấp id_khach_hang hoặc danh_sach_id_khach_hang",
      ),
    );
  }

  try {
    const service = new PhieuKhachHangService();
    const result = await service.create(req.body);

    let message = "Gán phiếu giảm giá cho khách hàng thành công";

    if (result && result.totalCreated !== undefined) {
      message = `Đã gán thành công phiếu giảm giá cho ${result.totalCreated} khách hàng`;
    }

    return res.status(201).send({
      message: message,
      data: result,
    });
  } catch (error) {
    if (error.message === "KHACH_HANG_HOAC_PHIEU_GIAM_GIA_KHONG_TON_TAI") {
      return next(
        new ApiError(
          404,
          "Khách hàng hoặc Phiếu giảm giá không tồn tại trong hệ thống",
        ),
      );
    }

    return next(
      new ApiError(500, "Đã xảy ra lỗi khi gán phiếu giảm giá cho khách hàng"),
    );
  }
};

// =================== 2. Lấy danh sách Phiếu Khách Hàng kết hợp bộ lọc =================
exports.findAll = async (req, res, next) => {
  try {
    const service = new PhieuKhachHangService();

    let trangThaiFilter;
    if (req.query.trang_thai !== undefined) {
      trangThaiFilter = req.query.trang_thai === "true";
    }

    const filterData = {
      id: req.query.id, // Lọc theo mã (?id=PKH01)
      id_khach_hang: req.query.id_khach_hang, // Lọc theo khách hàng (?id_khach_hang=KH01)
      id_phieu_giam_gia: req.query.id_phieu_giam_gia, // Lọc theo phiếu (?id_phieu_giam_gia=PGG01)
      trang_thai: trangThaiFilter, // Lọc phiếu chưa dùng/đã dùng (?trang_thai=true)
    };

    const documents = await service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách phiếu của khách hàng"),
    );
  }
};

// ============================== 3. Tìm một bản ghi Phiếu Khách Hàng theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const service = new PhieuKhachHangService();
    const document = await service.findById(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy bản ghi phiếu khách hàng"));
    }

    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi truy vấn phiếu khách hàng với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 4. Cập nhật Phiếu Khách Hàng ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const service = new PhieuKhachHangService();
    const document = await service.update(req.params.id, req.body);

    if (!document) {
      return next(
        new ApiError(
          404,
          "Không tìm thấy bản ghi phiếu khách hàng cần cập nhật",
        ),
      );
    }

    return res.send({
      message: "Cập nhật phiếu khách hàng thành công",
      data: document,
    });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi cập nhật phiếu khách hàng với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Xóa một bản ghi Phiếu Khách Hàng theo mã id ==================================
exports.delete = async (req, res, next) => {
  try {
    const service = new PhieuKhachHangService();
    const document = await service.delete(req.params.id);

    if (!document) {
      return next(
        new ApiError(404, "Không tìm thấy bản ghi phiếu khách hàng cần xóa"),
      );
    }

    return res.send({
      message: "Đã thu hồi phiếu giảm giá của khách hàng thành công",
    });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa bản ghi phiếu khách hàng với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 6. Xóa tất cả các bản ghi Phiếu Khách Hàng ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const service = new PhieuKhachHangService();
    const deletedCount = await service.deleteAll();
    return res.send({
      message: `Đã dọn dẹp thành công ${deletedCount} bản ghi phiếu khách hàng khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi trong quá trình dọn dẹp danh sách phiếu khách hàng",
      ),
    );
  }
};
