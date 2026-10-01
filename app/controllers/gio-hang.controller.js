const GioHangService = require("../services/gio-hang.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo Giỏ Hàng mới ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.id_khach_hang) {
    return next(new ApiError(400, "id_khach_hang không được để trống"));
  }

  try {
    const service = new GioHangService();
    const document = await service.create(req.body);
    return res.status(201).send({
      message: "Tạo giỏ hàng thành công",
      data: document,
    });
  } catch (error) {
    if (error.message === "KHACH_HANG_KHONG_TON_TAI") {
      return next(new ApiError(404, "Khách hàng không tồn tại trong hệ thống"));
    }

    if (error.message === "KHACH_HANG_DA_CO_GIO_HANG") {
      return next(new ApiError(400, "Khách hàng này đã có giỏ hàng rồi"));
    }

    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình tạo Giỏ Hàng mới"),
    );
  }
};

// =================== 2. Lấy danh sách Giỏ Hàng kết hợp bộ lọc (id, id_khach_hang) =================
exports.findAll = async (req, res, next) => {
  try {
    const service = new GioHangService();

    const filterData = {
      id: req.query.id, // Lọc theo mã giỏ hàng (?id=GH01)
      id_khach_hang: req.query.id_khach_hang, // Lọc theo khách hàng (?id_khach_hang=KH01)
    };

    const documents = await service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách Giỏ Hàng"));
  }
};

// ============================== 3. Cập nhật Giỏ Hàng theo mã id ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const service = new GioHangService();
    const document = await service.update(req.params.id, req.body);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Giỏ Hàng cần cập nhật"));
    }

    return res.send({ message: "Cập nhật Giỏ Hàng thành công", document });
  } catch (error) {
    return next(
      new ApiError(500, `Lỗi khi cập nhật Giỏ Hàng với mã = ${req.params.id}`),
    );
  }
};

// ============================== 4. Xóa một Giỏ Hàng theo mã id ==================================
exports.delete = async (req, res, next) => {
  try {
    const service = new GioHangService();
    const document = await service.delete(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Giỏ Hàng cần xóa"));
    }

    return res.send({ message: "Đã xóa Giỏ Hàng thành công" });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa Giỏ Hàng với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Xóa tất cả Giỏ Hàng ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const service = new GioHangService();
    const deletedCount = await service.deleteAll();
    return res.send({
      message: `Đã xóa thành công ${deletedCount} Giỏ Hàng khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình dọn dẹp các Giỏ Hàng"),
    );
  }
};

// ============================== 6. Tìm một Giỏ Hàng theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const service = new GioHangService();
    const document = await service.findById(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Giỏ Hàng"));
    }

    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(500, `Lỗi khi truy vấn Giỏ Hàng với mã = ${req.params.id}`),
    );
  }
};

// ============================== 7. Tìm Giỏ Hàng theo id_khach_hang ==================================
exports.findByKhachHang = async (req, res, next) => {
  try {
    const service = new GioHangService();
    const document = await service.findByKhachHangId(req.params.idKhachHang);

    if (!document) {
      return next(new ApiError(404, "Khách hàng này chưa có giỏ hàng"));
    }

    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi lấy giỏ hàng của khách hàng = ${req.params.idKhachHang}`,
      ),
    );
  }
};
