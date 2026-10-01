const KhachHangService = require("../services/khach-hang.service");
const ApiError = require("../api-error");

// 1. Tạo Khách Hàng mới
exports.create = async (req, res, next) => {
  if (!req.body?.ho_ten) {
    return next(new ApiError(400, "ho_ten không được để trống"));
  }
  if (!req.body?.email) {
    return next(new ApiError(400, "email không được để trống"));
  }
  if (!req.body?.mat_khau) {
    return next(new ApiError(400, "mat_khau không được để trống"));
  }

  try {
    const Service = new KhachHangService();
    const document = await Service.create(req.body);
    return res.send({
      message: "Khách hàng đã được tạo thành công",
      data: document,
    });
  } catch (error) {
    if (error.message === "EMAIL_KHONG_HOP_LE_HOAC_DA_TON_TAI") {
      return next(new ApiError(400, "Email này đã được sử dụng"));
    }
    if (error.message === "HANG_THANH_VIEN_KHONG_TON_TAI") {
      return next(new ApiError(400, "Mã hạng thành viên không tồn tại"));
    }

    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình thêm Khách hàng mới"),
    );
  }
};

// 2. Lấy danh sách Khách Hàng theo bộ lọc
exports.findAll = async (req, res, next) => {
  try {
    const Service = new KhachHangService();

    const filterData = {
      id: req.query.id,
      ho_ten: req.query.name,
      email: req.query.email,
      so_dien_thoai: req.query.phone,
      id_hang_thanh_vien: req.query.id_hang_thanh_vien,

      trang_thai:
        req.query.trang_thai !== undefined
          ? req.query.trang_thai === "true"
          : undefined,
    };

    const documents = await Service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách Khách hàng"),
    );
  }
};

// 3. Cập nhật thông tin Khách Hàng theo mã
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const Service = new KhachHangService();
    const document = await Service.update(req.params.id, req.body);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Khách hàng cần cập nhật"));
    }

    return res.send({
      message: "Cập nhật Khách hàng thành công",
      data: document,
    });
  } catch (error) {
    if (error.message === "EMAIL_KHONG_HOP_LE_HOAC_DA_TON_TAI") {
      return next(new ApiError(400, "Email này đã được sử dụng"));
    }
    if (error.message === "HANG_THANH_VIEN_KHONG_TON_TAI") {
      return next(new ApiError(400, "Mã hạng thành viên không tồn tại"));
    }

    return next(
      new ApiError(
        500,
        `Lỗi khi cập nhật Khách hàng với mã = ${req.params.id}`,
      ),
    );
  }
};

// 4. Xóa (khóa) một Khách Hàng
exports.delete = async (req, res, next) => {
  try {
    const Service = new KhachHangService();
    const document = await Service.delete(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Khách hàng cần xóa"));
    }

    return res.send({ message: "Đã xóa Khách hàng thành công" });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa Khách hàng với mã = ${req.params.id}`,
      ),
    );
  }
};

// 5. Khôi phục một Khách Hàng
exports.restore = async (req, res, next) => {
  try {
    const Service = new KhachHangService();
    const document = await Service.restore(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Khách hàng cần khôi phục"));
    }

    return res.send({ message: "Đã khôi phục Khách hàng thành công" });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi khôi phục Khách hàng với mã = ${req.params.id}`,
      ),
    );
  }
};

// 6. Xóa (khóa) tất cả Khách Hàng
exports.deleteAll = async (req, res, next) => {
  try {
    const Service = new KhachHangService();
    const deletedCount = await Service.deleteAll();
    return res.send({
      message: `Đã xóa thành công ${deletedCount} Khách hàng khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình xóa tất cả Khách hàng"),
    );
  }
};

// 7. Tìm một Khách Hàng theo ID
exports.findOne = async (req, res, next) => {
  try {
    const Service = new KhachHangService();
    const document = await Service.findById(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Khách hàng"));
    }

    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi truy vấn Khách hàng với mã = ${req.params.id}`,
      ),
    );
  }
};
