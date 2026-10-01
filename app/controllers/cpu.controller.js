const CpuService = require("../services/cpu.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo và lưu CPU mới ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.ten_cpu) {
    return next(new ApiError(400, "ten_cpu không được để trống"));
  }

  try {
    const Service = new CpuService();
    const document = await Service.create(req.body);
    return res.send({
      message: "CPU đã được tạo thành công",
      data: document,
    });
  } catch (error) {
    // Kiểm tra nếu là lỗi trùng tên CPU
    if (error.message === "TEN_CPU_DA_TON_TAI") {
      return next(new ApiError(400, "Tên CPU này đã tồn tại trong hệ thống"));
    }

    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình thêm CPU mới"),
    );
  }
};

// =================== 2. Lấy danh sách CPU kết hợp bộ lọc (Mã, Tên) =================
exports.findAll = async (req, res, next) => {
  try {
    const Service = new CpuService();

    const filterData = {
      id: req.query.id, // Lọc theo mã (?id=CPU01)
      ten_cpu: req.query.name, // Lọc theo tên (?name=i7)
    };

    const documents = await Service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách CPU"));
  }
};

// ============================== 3. Cập nhật CPU theo mã ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const Service = new CpuService();
    const document = await Service.update(req.params.id, req.body);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy CPU cần cập nhật"));
    }

    return res.send({ message: "Cập nhật CPU thành công", document });
  } catch (error) {
    if (error.message === "TEN_CPU_DA_TON_TAI") {
      return next(new ApiError(400, "Tên CPU này đã tồn tại trong hệ thống"));
    }

    return next(
      new ApiError(500, `Lỗi khi cập nhật CPU với mã = ${req.params.id}`),
    );
  }
};

// ============================== 4. Xóa một CPU theo mã ==================================
exports.delete = async (req, res, next) => {
  try {
    const Service = new CpuService();
    const document = await Service.delete(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy CPU cần xóa"));
    }

    return res.send({ message: "Đã xóa CPU thành công" });
  } catch (error) {
    if (error.message === "CPU_DANG_DUOC_SU_DUNG") {
      return next(
        new ApiError(
          400,
          "Không thể xóa CPU này vì đang được sử dụng ở Biến thể sản phẩm!",
        ),
      );
    }

    return next(
      new ApiError(500, `Đã xảy ra lỗi khi xóa CPU với mã = ${req.params.id}`),
    );
  }
};

// ============================== 5. Xóa tất cả CPU chưa được sử dụng ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const Service = new CpuService();
    const deletedCount = await Service.deleteAll();
    return res.send({
      message: `Đã xóa thành công ${deletedCount} CPU chưa được sử dụng khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình dọn dẹp các CPU"),
    );
  }
};

// ============================== 6. Tìm một CPU theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const Service = new CpuService();
    const document = await Service.findById(req.params.id);
    if (!document) {
      return next(new ApiError(404, "Không tìm thấy CPU"));
    }
    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(500, `Lỗi khi truy vấn CPU với mã = ${req.params.id}`),
    );
  }
};
