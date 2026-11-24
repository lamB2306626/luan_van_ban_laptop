const LichSuTimKiemService = require("../services/lich-su-tim-kiem.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo hoặc ghi nhận lịch sử tìm kiếm mới ==================================
exports.create = async (req, res, next) => {
  // Kiểm tra điều kiện tối thiểu: Phải có id_khach_hang và (có tu_khoa hoặc có danh_sach)
  if (!req.body?.id_khach_hang) {
    return next(new ApiError(400, "id_khach_hang không được để trống"));
  }

  if (!req.body?.tu_khoa && !req.body?.danh_sach) {
    return next(
      new ApiError(400, "danh_sach (hoặc tu_khoa) không được để trống"),
    );
  }

  try {
    const Service = new LichSuTimKiemService();
    const document = await Service.create(req.body);
    return res.send({
      message: "Ghi nhận lịch sử tìm kiếm thành công",
      data: document,
    });
  } catch (error) {
    console.error(error);
    if (error.message === "THIEU_THONG_TIN_KHACH_HANG_HOAC_TU_KHOA") {
      return next(
        new ApiError(400, "Thiếu thông tin khách hàng hoặc từ khóa tìm kiếm"),
      );
    }
    if (error.message === "THIEU_THONG_TIN_KHACH_HANG") {
      return next(new ApiError(400, "id_khach_hang không được để trống"));
    }
    if (error.message === "ID_KHACH_HANG_KHONG_TON_TAI") {
      return next(new ApiError(400, "id khách hàng không tồn tại"));
    }
    if (error.message === "LICH_SU_TIM_KIEM_DA_TON_TAI") {
      return next(new ApiError(400, "Bản ghi lịch sử tìm kiếm đã tồn tại"));
    }

    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi trong quá trình ghi nhận lịch sử tìm kiếm",
      ),
    );
  }
};

// =================== 2. Lấy danh sách Lịch Sử Tìm Kiếm kết hợp bộ lọc (id, id_khach_hang, loai_tim_kiem, tu_khoa) =================
exports.findAll = async (req, res, next) => {
  try {
    const Service = new LichSuTimKiemService();

    const filterData = {
      id: req.query.id, // Lọc theo mã lịch sử tìm kiếm
      id_khach_hang: req.query.id_khach_hang, // Lọc theo mã khách hàng (?id_khach_hang=KH01)
      loai_tim_kiem: req.query.loai_tim_kiem, // Lọc theo loại (?loai_tim_kiem=THUONGHIEU)
      tu_khoa: req.query.tu_khoa, // Lọc theo từ khóa
    };

    const documents = await Service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách lịch sử tìm kiếm"),
    );
  }
};

// ============================== 3. Cập nhật Lịch Sử Tìm Kiếm theo mã ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const Service = new LichSuTimKiemService();
    const document = await Service.update(req.params.id, req.body);

    if (!document) {
      return next(
        new ApiError(404, "Không tìm thấy lịch sử tìm kiếm cần cập nhật"),
      );
    }

    return res.send({
      message: "Cập nhật lịch sử tìm kiếm thành công",
      document,
    });
  } catch (error) {
    if (error.message === "LICH_SU_TIM_KIEM_BI_TRUNG") {
      return next(new ApiError(400, "Dữ liệu lịch sử tìm kiếm bị trùng lặp"));
    }

    return next(
      new ApiError(
        500,
        `Lỗi khi cập nhật lịch sử tìm kiếm với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 4. Xóa một Lịch Sử Tìm Kiếm theo mã ==================================
exports.delete = async (req, res, next) => {
  try {
    const Service = new LichSuTimKiemService();
    const document = await Service.delete(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy lịch sử tìm kiếm cần xóa"));
    }

    return res.send({ message: "Đã xóa lịch sử tìm kiếm thành công" });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa lịch sử tìm kiếm với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Xóa tất cả Lịch Sử Tìm Kiếm (có thể lọc theo khách hàng) ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const Service = new LichSuTimKiemService();
    const filterData = {
      id_khach_hang: req.query.id_khach_hang, // Cho phép xóa toàn bộ lịch sử tìm kiếm của 1 khách hàng cụ thể nếu truyền query
    };

    const deletedCount = await Service.deleteAll(filterData);
    return res.send({
      message: `Đã xóa thành công ${deletedCount} bản ghi lịch sử tìm kiếm khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi trong quá trình dọn dẹp lịch sử tìm kiếm",
      ),
    );
  }
};

// ============================== 6. Tìm một Lịch Sử Tìm Kiếm theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const Service = new LichSuTimKiemService();
    const document = await Service.findById(req.params.id);
    if (!document) {
      return next(new ApiError(404, "Không tìm thấy lịch sử tìm kiếm"));
    }
    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi truy vấn lịch sử tìm kiếm với mã = ${req.params.id}`,
      ),
    );
  }
};
