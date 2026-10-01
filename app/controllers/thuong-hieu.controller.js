const ThuongHieuService = require("../services/thuong-hieu.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo và lưu Thương hiệu mới ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.ten_thuong_hieu) {
    return next(new ApiError(400, "ten_thuong_hieu không được để trống"));
  }

  if (!req.file) {
    return next(new ApiError(400, "lo_go không được để trống"));
  }

  try {
    // Lưu đường dẫn file relative vào database
    req.body.lo_go = `${req.file.filename}`;

    const Service = new ThuongHieuService();
    const document = await Service.create(req.body);
    return res.send({
      message: "Thương Hiệu đã được tạo thành công",
      data: document,
    });
  } catch (error) {
    if (error.message === "TEN_THUONG_HIEU_DA_TON_TAI") {
      return next(
        new ApiError(400, "Tên thương Hiệu này đã tồn tại trong hệ thống"),
      );
    }

    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình thêm Thương Hiệu mới"),
    );
  }
};

// =================== 2. Lấy danh sách Thương hiệu kết hợp bộ lọc (Mã, Tên) =================
exports.findAll = async (req, res, next) => {
  try {
    const Service = new ThuongHieuService();

    const filterData = {
      id: req.query.id, // Lọc theo mã (?id=DM01)
      ten_thuong_hieu: req.query.name, // Lọc theo tên (?name=Gaming)
    };

    const documents = await Service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách Thương hiệu"),
    );
  }
};

// ============================== 3. Cập nhật Danh Mục theo mã ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    // NẾU NGƯỜI DÙNG CÓ UPLOAD FILE MỚI -> MỚI CẬP NHẬT TRƯỜNG lo_go
    if (req.file) {
      // Chỉ lưu tên file vào DB theo cấu hình cũ của bạn
      req.body.lo_go = req.file.filename;
    }

    const Service = new ThuongHieuService();
    const document = await Service.update(req.params.id, req.body);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Thương hiệu cần cập nhật"));
    }

    return res.send({ message: "Cập nhật Thương hiệu thành công", document });
  } catch (error) {
    if (error.message === "TEN_THUONG_HIEU_DA_TON_TAI") {
      return next(
        new ApiError(400, "Tên thương Hiệu này đã tồn tại trong hệ thống"),
      );
    }

    return next(
      new ApiError(
        500,
        `Lỗi khi cập nhật Thương hiệu với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 4. Xóa một Thương hiệu theo mã ==================================
exports.delete = async (req, res, next) => {
  try {
    const Service = new ThuongHieuService();
    const document = await Service.delete(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Thương hiệu cần xóa"));
    }

    return res.send({ message: "Đã xóa Thương hiệu thành công" });
  } catch (error) {
    if (error.message === "THUONG_HIEU_DANG_CO_SAN_PHAM") {
      return next(
        new ApiError(
          400,
          "Không thể xóa Thương hiệu này vì đang có Sản phẩm liên kết!",
        ),
      );
    }

    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa Thương hiệu với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Xóa tất cả Thương hiệu rỗng ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const Service = new ThuongHieuService();
    const deletedCount = await Service.deleteAll();
    return res.send({
      message: `Đã xóa thành công ${deletedCount} Thương hiệu trống (không chứa sản phẩm) khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi trong quá trình dọn dẹp các Thương hiệu",
      ),
    );
  }
};

// ============================== 6. Tìm một Thương hiệu theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const Service = new ThuongHieuService();
    const document = await Service.findById(req.params.id);
    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Thương hiệu"));
    }
    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi truy vấn Thương hiệu với mã = ${req.params.id}`,
      ),
    );
  }
};
