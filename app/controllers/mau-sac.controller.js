const MauSacService = require("../services/mau-sac.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo và lưu Màu Sắc mới ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.ten_mau_sac) {
    return next(new ApiError(400, "ten_mau_sac không được để trống"));
  }

  try {
    const Service = new MauSacService();
    const document = await Service.create(req.body);
    return res.send({
      message: "Màu sắc đã được tạo thành công",
      data: document,
    });
  } catch (error) {
    // Kiểm tra nếu là lỗi trùng tên màu sắc
    if (error.message === "TEN_MAU_SAC_DA_TON_TAI") {
      return next(
        new ApiError(400, "Tên màu sắc này đã tồn tại trong hệ thống"),
      );
    }

    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình thêm Màu Sắc mới"),
    );
  }
};

// =================== 2. Lấy danh sách Màu Sắc kết hợp bộ lọc (Mã, Tên) =================
exports.findAll = async (req, res, next) => {
  try {
    const Service = new MauSacService();

    const filterData = {
      id: req.query.id, // Lọc theo mã (?id=MS01)
      ten_mau_sac: req.query.name, // Lọc theo tên (?name=Đỏ)
    };

    const documents = await Service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách Màu Sắc"));
  }
};

// ============================== 3. Cập nhật Màu Sắc theo mã ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const Service = new MauSacService();
    const document = await Service.update(req.params.id, req.body);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Màu sắc cần cập nhật"));
    }

    return res.send({ message: "Cập nhật Màu sắc thành công", document });
  } catch (error) {
    if (error.message === "TEN_MAU_SAC_DA_TON_TAI") {
      return next(
        new ApiError(400, "Tên màu sắc này đã tồn tại trong hệ thống"),
      );
    }

    return next(
      new ApiError(500, `Lỗi khi cập nhật Màu sắc với mã = ${req.params.id}`),
    );
  }
};

// ============================== 4. Xóa một Màu Sắc theo mã ==================================
exports.delete = async (req, res, next) => {
  try {
    const Service = new MauSacService();
    const document = await Service.delete(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Màu sắc cần xóa"));
    }

    return res.send({ message: "Đã xóa Màu sắc thành công" });
  } catch (error) {
    if (error.message === "MAU_SAC_DANG_DUC_SU_DUNG") {
      return next(
        new ApiError(
          400,
          "Không thể xóa Màu sắc này vì đang được sử dụng ở Biến thể sản phẩm!",
        ),
      );
    }

    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa Màu sắc với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Xóa tất cả Màu Sắc chưa được sử dụng ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const Service = new MauSacService();
    const deletedCount = await Service.deleteAll();
    return res.send({
      message: `Đã xóa thành công ${deletedCount} Màu sắc chưa được sử dụng khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình dọn dẹp các màu sắc"),
    );
  }
};

// ============================== 6. Tìm một Màu Sắc theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const Service = new MauSacService();
    const document = await Service.findById(req.params.id);
    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Màu sắc"));
    }
    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(500, `Lỗi khi truy vấn Màu sắc với mã = ${req.params.id}`),
    );
  }
};
