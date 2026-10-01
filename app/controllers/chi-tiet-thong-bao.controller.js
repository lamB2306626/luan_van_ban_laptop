const ChiTietThongBaoService = require("../services/chi-tiet-thong-bao.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo/Phân phối Chi Tiết Thông Báo ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.id_thong_bao) {
    return next(new ApiError(400, "id_thong_bao không được để trống"));
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
    const service = new ChiTietThongBaoService();
    const result = await service.create(req.body);

    let message = "Phân phối thông báo thành công";

    // Đối với phân phối thông báo hàng loại sẽ có gửi thêm totalCreated (số lương đã phân phối) và sẽ in ra để người dùng thấy được
    if (result && result.totalCreated !== undefined) {
      message = `Đã phân phối thành công ${result.totalCreated} thông báo`;
    }

    return res.status(201).send({
      message: message,
      data: result,
    });
  } catch (error) {
    if (error.message === "TAT_CA_THONG_BAO_DA_DUOC_GUI_TRUOC_DO") {
      return next(
        new ApiError(
          400,
          "Tất cả khách hàng trong danh sách đã nhận thông báo này rồi",
        ),
      );
    }

    if (error.message === "THONG_BAO_HOAC_KHACH_HANG_KHONG_TON_TAI") {
      return next(new ApiError(404, "Thông báo hoặc Khách hàng không tồn tại"));
    }

    if (error.message === "THONG_BAO_DA_DUOC_GUI_CHO_KHACH_HANG_NAY") {
      return next(
        new ApiError(409, "Thông báo này đã được gửi cho khách hàng trước đó"),
      );
    }
    return next(new ApiError(500, "Đã xảy ra lỗi khi tạo chi tiết thông báo"));
  }
};

// =================== 2. Lấy danh sách Chi Tiết Thông Báo (Bộ lọc query) =================
exports.findAll = async (req, res, next) => {
  try {
    const service = new ChiTietThongBaoService();

    const filterData = {
      id: req.query.id,
      id_thong_bao: req.query.id_thong_bao,
      id_khach_hang: req.query.id_khach_hang,
      da_doc:
        req.query.da_doc !== undefined
          ? req.query.da_doc === "true"
          : undefined,
    };

    const documents = await service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách chi tiết thông báo"),
    );
  }
};

// ============================== 3. Tìm một Chi Tiết Thông Báo theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const service = new ChiTietThongBaoService();
    const document = await service.findById(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy chi tiết thông báo"));
    }

    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi truy vấn chi tiết thông báo với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 4. Cập nhật Chi Tiết Thông Báo theo id ==================================
exports.update = async (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const service = new ChiTietThongBaoService();
    const document = await service.update(req.params.id, req.body);

    if (!document) {
      return next(
        new ApiError(404, "Không tìm thấy chi tiết thông báo cần cập nhật"),
      );
    }

    return res.send({
      message: "Cập nhật chi tiết thông báo thành công",
      data: document,
    });
  } catch (error) {
    if (error.message === "THONG_BAO_HOAC_KHACH_HANG_KHONG_TON_TAI") {
      return next(
        new ApiError(404, "Thông báo hoặc Khách hàng liên kết không tồn tại"),
      );
    }
    return next(
      new ApiError(
        500,
        `Lỗi khi cập nhật chi tiết thông báo với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Xóa một Chi Tiết Thông Báo theo id ==================================
exports.delete = async (req, res, next) => {
  try {
    const service = new ChiTietThongBaoService();
    const document = await service.delete(req.params.id);

    if (!document) {
      return next(
        new ApiError(404, "Không tìm thấy chi tiết thông báo cần xóa"),
      );
    }

    return res.send({ message: "Đã xóa chi tiết thông báo thành công" });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi xóa chi tiết thông báo với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 6. Xóa tất cả Chi Tiết Thông Báo ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const service = new ChiTietThongBaoService();
    const deletedCount = await service.deleteAll();
    return res.send({
      message: `Đã xóa thành công ${deletedCount} bản ghi chi tiết thông báo`,
    });
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi khi xóa tất cả chi tiết thông báo"),
    );
  }
};

// ============================== 7. Đánh dấu TẤT CẢ thông báo của 1 Khách hàng là ĐÃ ĐỌC ==================================
exports.markAllAsRead = async (req, res, next) => {
  const { id_khach_hang } = req.params;

  if (!id_khach_hang) {
    return next(new ApiError(400, "id_khach_hang không được để trống"));
  }

  try {
    const service = new ChiTietThongBaoService();
    const count = await service.markAllAsRead(id_khach_hang);

    return res.send({
      message: `Đã đánh dấu ${count} thông báo là đã đọc`,
      updatedCount: count,
    });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi đánh dấu đã đọc thông báo cho khách hàng = ${id_khach_hang}`,
      ),
    );
  }
};

// ============================== 8. Đếm số lượng thông báo CHƯA ĐỌC của 1 Khách hàng ==================================
exports.countUnread = async (req, res, next) => {
  const { id_khach_hang } = req.params;

  if (!id_khach_hang) {
    return next(new ApiError(400, "id_khach_hang không được để trống"));
  }

  try {
    const service = new ChiTietThongBaoService();
    const unreadCount = await service.countUnread(id_khach_hang);

    return res.send({
      id_khach_hang,
      unreadCount,
    });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi đếm thông báo chưa đọc của khách hàng = ${id_khach_hang}`,
      ),
    );
  }
};
