const HangThanhVienService = require("../services/hang-thanh-vien.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo và lưu Hạng Thành Viên mới ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.ten_hang) {
    return next(new ApiError(400, "ten_hang không được để trống"));
  }

  if (req.body?.moc_chi_tieu === undefined || req.body?.moc_chi_tieu === null) {
    return next(new ApiError(400, "moc_chi_tieu không được để trống"));
  }

  try {
    const Service = new HangThanhVienService();
    const document = await Service.create(req.body);
    return res.send({
      message: "Hạng Thành Viên đã được tạo thành công",
      data: document,
    });
  } catch (error) {
    // Kiểm tra nếu là lỗi trùng tên Hạng Thành Viên
    if (error.message === "TEN_HANG_THANH_VIEN_DA_TON_TAI") {
      return next(
        new ApiError(400, "Tên Hạng Thành Viên này đã tồn tại trong hệ thống"),
      );
    }

    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi trong quá trình thêm Hạng Thành Viên mới",
      ),
    );
  }
};

// =================== 2. Lấy danh sách Hạng Thành Viên kết hợp bộ lọc (Mã, Tên) =================
exports.findAll = async (req, res, next) => {
  try {
    const Service = new HangThanhVienService();

    const filterData = {
      id: req.query.id, // Lọc theo mã (?id=HTV01)
      ten_hang: req.query.name, // Lọc theo tên (?name=Vàng)
    };

    const documents = await Service.find(filterData);
    return res.send(documents);
  } catch (error) {
    console.error("Lỗi; ", error);
    return next(
      new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách Hạng Thành Viên"),
    );
  }
};

// ============================== 3. Cập nhật Hạng Thành Viên theo mã ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const Service = new HangThanhVienService();
    const document = await Service.update(req.params.id, req.body);

    if (!document) {
      return next(
        new ApiError(404, "Không tìm thấy Hạng Thành Viên cần cập nhật"),
      );
    }

    return res.send({
      message: "Cập nhật Hạng Thành Viên thành công",
      data: document,
    });
  } catch (error) {
    console.error("Lỗi là:", error);
    if (error.message === "TEN_HANG_THANH_VIEN_DA_TON_TAI") {
      return next(
        new ApiError(400, "Tên Hạng Thành Viên này đã tồn tại trong hệ thống"),
      );
    }

    return next(
      new ApiError(
        500,
        `Lỗi khi cập nhật Hạng Thành Viên với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 4. Xóa một Hạng Thành Viên theo mã ==================================
exports.delete = async (req, res, next) => {
  try {
    const Service = new HangThanhVienService();
    const document = await Service.delete(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Hạng Thành Viên cần xóa"));
    }

    return res.send({ message: "Đã xóa Hạng Thành Viên thành công" });
  } catch (error) {
    // Kiểm tra nếu là lỗi do đang chứa khách hàng
    if (error.message === "HANG_THANH_VIEN_DANG_CO_KHACH_HANG") {
      return next(
        new ApiError(
          400,
          "Không thể xóa Hạng thành viên này vì đang có Khách hàng thuộc hạng!",
        ),
      );
    }

    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa Hạng Thành Viên với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Xóa tất cả Hạng Thành Viên rỗng ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const Service = new HangThanhVienService();
    const deletedCount = await Service.deleteAll();
    return res.send({
      message: `Đã xóa thành công ${deletedCount} Hạng Thành Viên trống (không chứa khách hàng) khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi trong quá trình dọn dẹp các Hạng Thành Viên",
      ),
    );
  }
};

// ============================== 6. Tìm một Hạng Thành Viên theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const Service = new HangThanhVienService();
    const document = await Service.findById(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Hạng Thành Viên"));
    }

    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi truy vấn Hạng Thành Viên với mã = ${req.params.id}`,
      ),
    );
  }
};
