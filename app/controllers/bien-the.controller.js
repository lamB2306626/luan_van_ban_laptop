const BienTheService = require("../services/bien-the.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo và lưu Biến Thể mới ==================================
exports.create = async (req, res, next) => {
  // Validate các trường bắt buộc theo schema (id_san_pham, gia, so_luong)
  if (!req.body?.id_san_pham) {
    return next(new ApiError(400, "id_san_pham không được để trống"));
  }
  if (req.body?.gia === undefined) {
    return next(new ApiError(400, "gia không được để trống"));
  }
  if (req.body?.id_mau_sac === undefined) {
    return next(new ApiError(400, "id_mau_sac không được để trống"));
  }
  if (req.body?.id_cpu === undefined) {
    return next(new ApiError(400, "id_cpu không được để trống"));
  }
  if (req.body?.id_gpu === undefined) {
    return next(new ApiError(400, "id_gpu không được để trống"));
  }
  if (req.body?.id_ram === undefined) {
    return next(new ApiError(400, "id_ram không được để trống"));
  }
  if (req.body?.id_rom === undefined) {
    return next(new ApiError(400, "id_rom không được để trống"));
  }

  try {
    // Lưu đường dẫn file relative vào database
    req.body.duong_dan_anh = `${req.file.filename}`;

    const Service = new BienTheService();
    const document = await Service.create(req.body);
    return res.send({
      message: "Biến thể đã được tạo thành công",
      data: document,
    });
  } catch (error) {
    console.error("lỗi: ", error);
    // Kiểm tra nếu khóa ngoại liên kết không tồn tại trong hệ thống
    if (error.message === "KHOA_NGOAI_KHONG_TON_TAI") {
      return next(
        new ApiError(
          400,
          "Mã màu sắc, CPU, GPU, RAM hoặc ROM không tồn tại trong hệ thống",
        ),
      );
    }

    // Kiểm tra nếu biến thể (tổ hợp màu sắc, CPU, GPU, RAM, ROM) đã tồn tại trong hệ thống
    if (error.message === "BIEN_THE_DA_TON_TAI") {
      return next(new ApiError(400, "Biến thể này đã tổn tại trong hệ thống"));
    }

    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình thêm Biến Thể mới"),
    );
  }
};

// =================== 2. Lấy danh sách Biến Thể kết hợp bộ lọc (Mã BT, Mã Sản Phẩm) =================
exports.findAll = async (req, res, next) => {
  try {
    const Service = new BienTheService();

    const filterData = {
      id: req.query.id, // Lọc theo mã biến thể (?id=BT01)
      id_san_pham: req.query.id_san_pham, // Lọc theo mã sản phẩm (?id_san_pham=SP01)
      // Lọc theo trạng thái
      trang_thai:
        req.query.trang_thai !== undefined
          ? req.query.trang_thai === "true"
          : undefined,
    };

    const documents = await Service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách Biến Thể"));
  }
};

// ============================== 3. Cập nhật Biến Thể theo mã ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    // NẾU NGƯỜI DÙNG CÓ UPLOAD FILE MỚI -> MỚI CẬP NHẬT TRƯỜNG lo_go
    if (req.file) {
      // Chỉ lưu tên file vào DB theo cấu hình cũ của bạn
      req.body.duong_dan_anh = req.file.filename;
    }

    const Service = new BienTheService();
    const document = await Service.update(req.params.id, req.body);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Biến thể cần cập nhật"));
    }

    return res.send({ message: "Cập nhật Biến thể thành công", document });
  } catch (error) {
    if (error.message === "KHOA_NGOAI_KHONG_TON_TAI") {
      return next(
        new ApiError(
          400,
          "Mã màu sắc, CPU, GPU, RAM hoặc ROM không tồn tại trong hệ thống",
        ),
      );
    }

    // Kiểm tra nếu biến thể (tổ hợp màu sắc, CPU, GPU, RAM, ROM) đã tồn tại trong hệ thống
    if (error.message === "BIEN_THE_DA_TON_TAI") {
      return next(new ApiError(400, "Biến thể này đã tổn tại trong hệ thống"));
    }

    return next(
      new ApiError(500, `Lỗi khi cập nhật Biến thể với mã = ${req.params.id}`),
    );
  }
};

// ============================== 4. Xóa (khóa) một Biến Thể theo mã ==================================
exports.delete = async (req, res, next) => {
  try {
    const Service = new BienTheService();
    const document = await Service.delete(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Biến thể cần xóa"));
    }

    return res.send({ message: "Đã xóa Biến thể thành công" });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa Biến thể với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Khôi phục một Biến thể theo mã ==============================
exports.restore = async (req, res, next) => {
  try {
    const service = new BienTheService();
    const document = await service.restore(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Biến thể cần khôi phục"));
    }

    return res.send({
      message: "Đã khôi phục Biến thể thành công",
      data: document,
    });
  } catch (error) {
    if (error.message === "SAN_PHAM_DANG_NGUNG_KINH_DOANH") {
      return next(
        new ApiError(
          400,
          "Không thể khôi phục biến thể vì Sản phẩm cha hiện đang ngừng kinh doanh!",
        ),
      );
    }

    return next(
      new ApiError(500, `Lỗi khi khôi phục Biến thể với mã = ${req.params.id}`),
    );
  }
};

// ============================== 6. Xóa (khóa) tất cả Biến Thể ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const Service = new BienTheService();
    const deletedCount = await Service.deleteAll();
    return res.send({
      message: `Đã xóa sạch thành công ${deletedCount} Biến thể khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình xóa toàn bộ Biến thể"),
    );
  }
};

// ============================== 7. Tìm một Biến Thể theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const Service = new BienTheService();
    const document = await Service.findById(req.params.id);
    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Biến thể"));
    }
    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(500, `Lỗi khi truy vấn Biến thể với mã = ${req.params.id}`),
    );
  }
};
