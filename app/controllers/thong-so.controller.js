const ThongSoService = require("../services/thong-so.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo và lưu Thông Số mới ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.id_san_pham) {
    return next(new ApiError(400, "id_san_pham không được để trống"));
  }

  try {
    const Service = new ThongSoService();
    const document = await Service.create(req.body);
    return res.send({
      message: "Thông số kỹ thuật đã được tạo thành công",
      data: document,
    });
  } catch (error) {
    if (error.message === "SAN_PHAM_DA_CO_THONG_SO") {
      return next(
        new ApiError(
          400,
          "Sản phẩm này đã có thông số kỹ thuật trong hệ thống",
        ),
      );
    }
    if (error.message === "ID_SAN_PHAM_KHONG_TON_TAI") {
      return next(new ApiError(404, "Mã sản phẩm truyền vào không tồn tại"));
    }

    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình thêm Thông Số mới"),
    );
  }
};

// =================== 2. Lấy danh sách Thông Số kết hợp bộ lọc (Mã TS, Mã SP) =================
exports.findAll = async (req, res, next) => {
  try {
    const Service = new ThongSoService();

    const filterData = {
      id: req.query.id, // Lọc theo mã thông số (?id=TS01)
      id_san_pham: req.query.id_san_pham, // Lọc theo mã sản phẩm (?id_san_pham=SP01)
    };

    const documents = await Service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách Thông Số"));
  }
};

// ============================== 3. Cập nhật Thông Số theo mã ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const Service = new ThongSoService();
    const document = await Service.update(req.params.id, req.body);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Thông số cần cập nhật"));
    }

    return res.send({ message: "Cập nhật Thông số thành công", document });
  } catch (error) {
    if (error.message === "SAN_PHAM_DA_CO_THONG_SO") {
      return next(
        new ApiError(400, "Sản phẩm này đã liên kết với một thông số khác"),
      );
    }
    if (error.message === "ID_SAN_PHAM_KHONG_TON_TAI") {
      return next(new ApiError(404, "Mã sản phẩm mới không tồn tại"));
    }

    return next(
      new ApiError(500, `Lỗi khi cập nhật Thông số với mã = ${req.params.id}`),
    );
  }
};

// ============================== 4. Xóa một Thông Số theo mã ==================================
exports.delete = async (req, res, next) => {
  try {
    const Service = new ThongSoService();
    const document = await Service.delete(req.params.id);
    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Thông số cần xóa"));
    }
    return res.send({ message: "Đã xóa Thông số thành công" });
  } catch (error) {
    return next(
      new ApiError(
        400,
        error.message || `Không thể xóa Thông số với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Xóa sạch tất cả Thông Số ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const Service = new ThongSoService();
    const deletedCount = await Service.deleteAll();
    return res.send({
      message: `Đã xóa sạch thành công ${deletedCount} Thông số khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(
        400,
        error.message || "Đã xảy ra lỗi khi xóa toàn bộ thông số",
      ),
    );
  }
};

// ============================== 6. Tìm một Thông Số theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const Service = new ThongSoService();
    const document = await Service.findById(req.params.id);
    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Thông số"));
    }
    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(500, `Lỗi khi truy vấn Thông số với mã = ${req.params.id}`),
    );
  }
};
