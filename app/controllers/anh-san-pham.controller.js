const AnhSanPhamService = require("../services/anh-san-pham.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo và lưu Ảnh Sản Phẩm mới ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.duong_dan_anh) {
    return next(new ApiError(400, "duong_dan_anh không được để trống"));
  }
  if (!req.body?.id_san_pham) {
    return next(new ApiError(400, "id_san_pham không được để trống"));
  }

  try {
    const Service = new AnhSanPhamService();
    const document = await Service.create(req.body);
    return res.send({
      message: "Ảnh sản phẩm đã được tạo thành công",
      data: document,
    });
  } catch (error) {
    if (error.message === "ID_SAN_PHAM_KHONG_TON_TAI") {
      return next(new ApiError(404, "Mã sản phẩm truyền vào không tồn tại"));
    }

    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình thêm Ảnh Sản Phẩm mới"),
    );
  }
};

// =================== 2. Lấy danh sách Ảnh Sản Phẩm kết hợp bộ lọc (Mã ảnh, Mã SP, Ảnh chính) =================
exports.findAll = async (req, res, next) => {
  try {
    const Service = new AnhSanPhamService();

    const filterData = {
      id: req.query.id, // Lọc theo mã ảnh (?id=ASP01)
      id_san_pham: req.query.id_san_pham, // Lọc theo mã sản phẩm (?id_san_pham=SP01)
      la_anh_chinh:
        req.query.la_anh_chinh !== undefined
          ? req.query.la_anh_chinh === "true"
          : undefined,
    };

    const documents = await Service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách Ảnh Sản Phẩm"),
    );
  }
};

// ============================== 3. Cập nhật Ảnh Sản Phẩm theo mã ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const Service = new AnhSanPhamService();
    const document = await Service.update(req.params.id, req.body);

    if (!document) {
      return next(
        new ApiError(404, "Không tìm thấy Ảnh sản phẩm cần cập nhật"),
      );
    }

    return res.send({ message: "Cập nhật Ảnh sản phẩm thành công", document });
  } catch (error) {
    if (error.message === "ID_SAN_PHAM_KHONG_TON_TAI") {
      return next(new ApiError(404, "Mã sản phẩm mới không tồn tại"));
    }

    return next(
      new ApiError(
        500,
        `Lỗi khi cập nhật Ảnh sản phẩm với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 4. Xóa một Ảnh Sản Phẩm theo mã ==================================
exports.delete = async (req, res, next) => {
  try {
    const Service = new AnhSanPhamService();
    const document = await Service.delete(req.params.id);
    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Ảnh sản phẩm cần xóa"));
    }
    return res.send({ message: "Đã xóa Ảnh sản phẩm thành công" });
  } catch (error) {
    return next(
      new ApiError(
        400,
        error.message || `Không thể xóa Ảnh sản phẩm với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Xóa sạch tất cả Ảnh Sản Phẩm ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const Service = new AnhSanPhamService();
    const deletedCount = await Service.deleteAll();
    return res.send({
      message: `Đã xóa sạch thành công ${deletedCount} Ảnh sản phẩm khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(
        400,
        error.message || "Đã xảy ra lỗi khi xóa toàn bộ ảnh sản phẩm",
      ),
    );
  }
};

// ============================== 6. Tìm một Ảnh Sản Phẩm theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const Service = new AnhSanPhamService();
    const document = await Service.findById(req.params.id);
    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Ảnh sản phẩm"));
    }
    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi truy vấn Ảnh sản phẩm với mã = ${req.params.id}`,
      ),
    );
  }
};
