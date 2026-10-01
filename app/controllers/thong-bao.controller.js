const ThongBaoService = require("../services/thong-bao.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo Thông Báo mới ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.tieu_de) {
    return next(new ApiError(400, "tieu_de không được để trống"));
  }
  if (!req.body?.noi_dung) {
    return next(new ApiError(400, "noi_dung không được để trống"));
  }

  try {
    const Service = new ThongBaoService();
    const document = await Service.create(req.body);
    return res.status(201).send({
      message: "Tạo thông báo mới thành công",
      data: document,
    });
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình tạo thông báo mới"),
    );
  }
};

// =================== 2. Lấy danh sách Thông Báo (kèm bộ lọc) =================
exports.findAll = async (req, res, next) => {
  try {
    const Service = new ThongBaoService();

    const filterData = {
      id: req.query.id, // Lọc theo mã (?id=TB01)
      tieu_de: req.query.title, // Lọc theo tiêu đề (?title=KhuyenMai)
    };

    const documents = await Service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách thông báo"));
  }
};

// ============================== 3. Tìm một Thông Báo theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const Service = new ThongBaoService();
    const document = await Service.findById(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy thông báo"));
    }

    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(500, `Lỗi khi truy vấn thông báo với mã = ${req.params.id}`),
    );
  }
};

// ============================== 4. Cập nhật Thông Báo theo id ==================================
exports.update = async (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const Service = new ThongBaoService();
    const document = await Service.update(req.params.id, req.body);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy thông báo cần cập nhật"));
    }

    return res.send({
      message: "Cập nhật thông báo thành công",
      data: document,
    });
  } catch (error) {
    return next(
      new ApiError(500, `Lỗi khi cập nhật thông báo với mã = ${req.params.id}`),
    );
  }
};

// ============================== 5. Xóa một Thông Báo theo id ==================================
exports.delete = async (req, res, next) => {
  try {
    const Service = new ThongBaoService();
    const document = await Service.delete(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy thông báo cần xóa"));
    }

    return res.send({ message: "Đã xóa thông báo thành công" });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa thông báo với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 6. Xóa tất cả Thông Báo ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const Service = new ThongBaoService();
    const deletedCount = await Service.deleteAll();
    return res.send({
      message: `Đã xóa thành công ${deletedCount} thông báo khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình dọn dẹp các thông báo"),
    );
  }
};
