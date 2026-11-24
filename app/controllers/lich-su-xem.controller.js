const LichSuXemService = require("../services/lich-su-xem.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo hoặc ghi nhận lịch sử xem mới ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.id_khach_hang || !req.body?.id_san_pham) {
    return next(
      new ApiError(400, "id_khach_hang và id_san_pham không được để trống"),
    );
  }

  try {
    const Service = new LichSuXemService();
    const document = await Service.create(req.body);
    return res.send({
      message: "Ghi nhận lịch sử xem thành công",
      data: document,
    });
  } catch (error) {
    console.error(error);
    if (error.message === "ID_KHACH_HANG_KHONG_TON_TAI") {
      return next(new ApiError(400, "id khách hàng không tồn tại"));
    }
    if (error.message === "ID_SAN_PHAM_KHONG_TON_TAI") {
      return next(new ApiError(400, "id sản phảm không tồn tại"));
    }
    if (error.message === "KHONG_TIM_THAY_KHACH_HANG_HOAC_SAN_PHAM") {
      return next(new ApiError(400, "Không tìm thấy khách hàng hoặc sản phẩm"));
    }
    if (error.message === "LICH_SU_XEM_DA_TON_TAI") {
      return next(new ApiError(400, "Bản ghi lịch sử xem đã tồn tại"));
    }

    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình ghi nhận lịch sử xem"),
    );
  }
};

// =================== 2. Lấy danh sách Lịch Sử Xem kết hợp bộ lọc (id, id_khach_hang, id_san_pham) =================
exports.findAll = async (req, res, next) => {
  try {
    const Service = new LichSuXemService();

    const filterData = {
      id: req.query.id, // Lọc theo mã lịch sử xem
      id_khach_hang: req.query.id_khach_hang, // Lọc theo mã khách hàng (?id_khach_hang=KH01)
      id_san_pham: req.query.id_san_pham, // Lọc theo mã sản phẩm (?id_san_pham=SP01)
    };

    const documents = await Service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách lịch sử xem"),
    );
  }
};

// ============================== 3. Cập nhật Lịch Sử Xem theo mã ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const Service = new LichSuXemService();
    const document = await Service.update(req.params.id, req.body);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy lịch sử xem cần cập nhật"));
    }

    return res.send({ message: "Cập nhật lịch sử xem thành công", document });
  } catch (error) {
    if (error.message === "LICH_SU_XEM_BI_TRUNG") {
      return next(new ApiError(400, "Dữ liệu lịch sử xem bị trùng lặp"));
    }

    return next(
      new ApiError(
        500,
        `Lỗi khi cập nhật lịch sử xem với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 4. Xóa một Lịch Sử Xem theo mã ==================================
exports.delete = async (req, res, next) => {
  try {
    const Service = new LichSuXemService();
    const document = await Service.delete(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy lịch sử xem cần xóa"));
    }

    return res.send({ message: "Đã xóa lịch sử xem thành công" });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa lịch sử xem với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Xóa tất cả Lịch Sử Xem (có thể lọc theo khách hàng) ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const Service = new LichSuXemService();
    const filterData = {
      id_khach_hang: req.query.id_khach_hang, // Cho phép xóa toàn bộ lịch sử của 1 khách hàng cụ thể nếu truyền query
    };

    const deletedCount = await Service.deleteAll(filterData);
    return res.send({
      message: `Đã xóa thành công ${deletedCount} bản ghi lịch sử xem khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình dọn dẹp lịch sử xem"),
    );
  }
};

// ============================== 6. Tìm một Lịch Sử Xem theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const Service = new LichSuXemService();
    const document = await Service.findById(req.params.id);
    if (!document) {
      return next(new ApiError(404, "Không tìm thấy lịch sử xem"));
    }
    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi truy vấn lịch sử xem với mã = ${req.params.id}`,
      ),
    );
  }
};
