const DanhMucService = require("../services/danh-muc.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo và lưu Danh Mục mới ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.ten_danh_muc) {
    return next(new ApiError(400, "ten_danh_muc không được để trống"));
  }

  try {
    const Service = new DanhMucService();
    const document = await Service.create(req.body);
    return res.send({
      message: "Danh mục đã được tạo thành công",
      data: document,
    });
  } catch (error) {
    // Kiểm tra nếu là lỗi trùng tên danh mục
    if (error.message === "TEN_DANH_MUC_DA_TON_TAI") {
      return next(
        new ApiError(400, "Tên danh mục này đã tồn tại trong hệ thống"),
      );
    }

    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình thêm Danh Mục mới"),
    );
  }
};

// =================== 2. Lấy danh sách Danh Mục kết hợp bộ lọc (Mã, Tên) =================
exports.findAll = async (req, res, next) => {
  try {
    const Service = new DanhMucService();

    const filterData = {
      id: req.query.id, // Lọc theo mã (?id=DM01)
      ten_danh_muc: req.query.name, // Lọc theo tên (?name=Gaming)
    };

    const documents = await Service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách Danh Mục"));
  }
};

// ============================== 3. Cập nhật Danh Mục theo mã ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const Service = new DanhMucService();
    const document = await Service.update(req.params.id, req.body);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Danh mục cần cập nhật"));
    }

    return res.send({ message: "Cập nhật Danh mục thành công", document });
  } catch (error) {
    if (error.message === "TEN_DANH_MUC_DA_TON_TAI") {
      return next(
        new ApiError(400, "Tên danh mục này đã tồn tại trong hệ thống"),
      );
    }

    return next(
      new ApiError(500, `Lỗi khi cập nhật Danh mục với mã = ${req.params.id}`),
    );
  }
};

// ============================== 4. Xóa một Danh Mục theo mã ==================================
exports.delete = async (req, res, next) => {
  try {
    const Service = new DanhMucService();
    const document = await Service.delete(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Danh mục cần xóa"));
    }

    return res.send({ message: "Đã xóa Danh mục thành công" });
  } catch (error) {
    if (error.message === "DANH_MUC_DANG_CO_SAN_PHAM") {
      return next(
        new ApiError(
          400,
          "Không thể xóa Danh mục này vì đang có Sản phẩm liên kết!",
        ),
      );
    }

    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa Danh mục với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Xóa tất cả Danh Mục rỗng ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const Service = new DanhMucService();
    const deletedCount = await Service.deleteAll();
    return res.send({
      message: `Đã xóa thành công ${deletedCount} Danh mục trống (không chứa sản phẩm) khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình dọn dẹp các danh mục"),
    );
  }
};

// ============================== 6. Tìm một Danh Mục theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const Service = new DanhMucService();
    const document = await Service.findById(req.params.id);
    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Danh mục"));
    }
    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(500, `Lỗi khi truy vấn Danh mục với mã = ${req.params.id}`),
    );
  }
};
