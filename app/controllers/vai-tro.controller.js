const VaiTroService = require("../services/vai-tro.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo và lưu Vai Trò mới ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.ten_vai_tro) {
    return next(new ApiError(400, "ten_vai_tro không được để trống"));
  }

  try {
    const Service = new VaiTroService();
    const document = await Service.create(req.body);
    return res.send({
      message: "Vai Trò đã được tạo thành công",
      data: document,
    });
  } catch (error) {
    // Kiểm tra nếu là lỗi trùng tên Vai Trò
    if (error.message === "TEN_VAI_TRO_DA_TON_TAI") {
      return next(
        new ApiError(400, "Tên Vai Trò này đã tồn tại trong hệ thống"),
      );
    }

    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình thêm Vai Trò mới"),
    );
  }
};

// =================== 2. Lấy danh sách Vai Trò kết hợp bộ lọc (Mã, Tên) =================
exports.findAll = async (req, res, next) => {
  try {
    const Service = new VaiTroService();

    const filterData = {
      id: req.query.id, // Lọc theo mã (?id=VT01)
      ten_vai_tro: req.query.name, // Lọc theo tên (?name=Admin)
    };

    const documents = await Service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách Vai Trò"));
  }
};

// ============================== 3. Cập nhật Vai Trò theo mã ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const Service = new VaiTroService();
    const document = await Service.update(req.params.id, req.body);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Vai Trò cần cập nhật"));
    }

    return res.send({ message: "Cập nhật Vai Trò thành công", document });
  } catch (error) {
    if (error.message === "TEN_VAI_TRO_DA_TON_TAI") {
      return next(
        new ApiError(400, "Tên Vai Trò này đã tồn tại trong hệ thống"),
      );
    }

    return next(
      new ApiError(500, `Lỗi khi cập nhật Vai Trò với mã = ${req.params.id}`),
    );
  }
};

// ============================== 4. Xóa một Vai Trò theo mã ==================================
exports.delete = async (req, res, next) => {
  try {
    const Service = new VaiTroService();
    const document = await Service.delete(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Vai Trò cần xóa"));
    }

    return res.send({ message: "Đã xóa Vai Trò thành công" });
  } catch (error) {
    if (error.message === "VAI_TRO_DANG_CO_NHAN_VIEN") {
      return next(
        new ApiError(
          400,
          "Không thể xóa Vai Trò này vì đang có Nhân viên sử dụng!",
        ),
      );
    }

    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa Vai Trò với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Xóa tất cả Vai Trò rỗng ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const Service = new VaiTroService();
    const deletedCount = await Service.deleteAll();
    return res.send({
      message: `Đã xóa thành công ${deletedCount} Vai Trò trống (không chứa nhân viên nào) khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình dọn dẹp các Vai Trò"),
    );
  }
};

// ============================== 6. Tìm một Vai Trò theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const Service = new VaiTroService();
    const document = await Service.findById(req.params.id);
    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Vai Trò"));
    }
    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(500, `Lỗi khi truy vấn Vai Trò với mã = ${req.params.id}`),
    );
  }
};
