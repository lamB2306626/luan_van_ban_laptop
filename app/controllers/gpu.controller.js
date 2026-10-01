const GpuService = require("../services/gpu.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo và lưu GPU mới ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.ten_gpu) {
    return next(new ApiError(400, "ten_gpu không được để trống"));
  }

  try {
    const Service = new GpuService();
    const document = await Service.create(req.body);
    return res.send({
      message: "GPU đã được tạo thành công",
      data: document,
    });
  } catch (error) {
    // Kiểm tra nếu là lỗi trùng tên GPU
    if (error.message === "TEN_GPU_DA_TON_TAI") {
      return next(new ApiError(400, "Tên GPU này đã tồn tại trong hệ thống"));
    }

    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình thêm GPU mới"),
    );
  }
};

// =================== 2. Lấy danh sách GPU kết hợp bộ lọc (Mã, Tên) =================
exports.findAll = async (req, res, next) => {
  try {
    const Service = new GpuService();

    const filterData = {
      id: req.query.id, // Lọc theo mã (?id=GPU01)
      ten_gpu: req.query.name, // Lọc theo tên (?name=i7)
    };

    const documents = await Service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách GPU"));
  }
};

// ============================== 3. Cập nhật GPU theo mã ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const Service = new GpuService();
    const document = await Service.update(req.params.id, req.body);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy GPU cần cập nhật"));
    }

    return res.send({ message: "Cập nhật GPU thành công", document });
  } catch (error) {
    if (error.message === "TEN_GPU_DA_TON_TAI") {
      return next(new ApiError(400, "Tên GPU này đã tồn tại trong hệ thống"));
    }

    return next(
      new ApiError(500, `Lỗi khi cập nhật GPU với mã = ${req.params.id}`),
    );
  }
};

// ============================== 4. Xóa một GPU theo mã ==================================
exports.delete = async (req, res, next) => {
  try {
    const Service = new GpuService();
    const document = await Service.delete(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy GPU cần xóa"));
    }

    return res.send({ message: "Đã xóa GPU thành công" });
  } catch (error) {
    if (error.message === "GPU_DANG_DUOC_SU_DUNG") {
      return next(
        new ApiError(
          400,
          "Không thể xóa GPU này vì đang được sử dụng ở Biến thể sản phẩm!",
        ),
      );
    }

    return next(
      new ApiError(500, `Đã xảy ra lỗi khi xóa GPU với mã = ${req.params.id}`),
    );
  }
};

// ============================== 5. Xóa tất cả GPU chưa được sử dụng ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const Service = new GpuService();
    const deletedCount = await Service.deleteAll();
    return res.send({
      message: `Đã xóa thành công ${deletedCount} GPU chưa được sử dụng khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình dọn dẹp các GPU"),
    );
  }
};

// ============================== 6. Tìm một GPU theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const Service = new GpuService();
    const document = await Service.findById(req.params.id);
    if (!document) {
      return next(new ApiError(404, "Không tìm thấy GPU"));
    }
    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(500, `Lỗi khi truy vấn GPU với mã = ${req.params.id}`),
    );
  }
};
