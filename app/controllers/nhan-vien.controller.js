const NhanVienService = require("../services/nhan-vien.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo và lưu Nhân Viên mới ==================================
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
  if (!req.body?.id_vai_tro) {
    return next(new ApiError(400, "id_vai_tro không được để trống"));
  }

  try {
    // Lưu đường dẫn file relative vào database
    req.body.avatar = `${req.file.filename}`;

    const Service = new NhanVienService();
    const document = await Service.create(req.body);
    return res.send({
      message: "Nhân Viên đã được tạo thành công",
      data: document,
    });
  } catch (error) {
    if (error.message === "EMAIL_DA_TON_TAI") {
      return next(
        new ApiError(400, "Email này đã được sử dụng bởi nhân viên khác"),
      );
    }
    if (error.message === "VAI_TRO_KHONG_TON_TAI") {
      return next(new ApiError(400, "Mã vai trò không tồn tại trong hệ thống"));
    }

    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình thêm Nhân Viên mới"),
    );
  }
};

// =================== 2. Lấy danh sách Nhân Viên kết hợp bộ lọc =================
exports.findAll = async (req, res, next) => {
  try {
    const Service = new NhanVienService();

    const filterData = {
      id: req.query.id, // Lọc theo mã (?id=NV01)
      ho_ten: req.query.name, // Lọc theo tên (?name=Nguyen)
      id_vai_tro: req.query.id_vai_tro,
      trang_thai:
        req.query.trang_thai !== undefined
          ? req.query.trang_thai === "true"
          : undefined,
    };

    const documents = await Service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách Nhân Viên"));
  }
};

// ============================== 3. Cập nhật Nhân Viên theo mã ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    // NẾU NGƯỜI DÙNG CÓ UPLOAD FILE MỚI -> MỚI CẬP NHẬT TRƯỜNG lo_go
    if (req.file) {
      // Chỉ lưu tên file vào DB theo cấu hình cũ của bạn
      req.body.avatar = req.file.filename;
    }

    const Service = new NhanVienService();
    const document = await Service.update(req.params.id, req.body);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Nhân Viên cần cập nhật"));
    }

    return res.send({ message: "Cập nhật Nhân Viên thành công", document });
  } catch (error) {
    if (error.message === "EMAIL_DA_TON_TAI") {
      return next(
        new ApiError(400, "Email này đã được sử dụng bởi nhân viên khác"),
      );
    }
    if (error.message === "VAI_TRO_KHONG_TON_TAI") {
      return next(
        new ApiError(400, "Mã vai trò mới không tồn tại trong hệ thống"),
      );
    }

    return next(
      new ApiError(500, `Lỗi khi cập nhật Nhân Viên với mã = ${req.params.id}`),
    );
  }
};

// ============================== 4. Xóa (khóa) một Nhân Viên theo mã ==================================
exports.delete = async (req, res, next) => {
  try {
    const Service = new NhanVienService();
    const document = await Service.delete(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Nhân Viên cần xóa"));
    }

    return res.send({ message: "Đã xóa Nhân Viên thành công" });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa Nhân Viên với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 4. Khôi phục một Nhân Viên theo mã ==================================
exports.restore = async (req, res, next) => {
  try {
    const Service = new NhanVienService();
    const document = await Service.restore(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Nhân Viên cần khôi phục"));
    }

    return res.send({ message: "Đã khôi phục Nhân Viên thành công" });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi khôi phục Nhân Viên với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Xóa (khóa) tất cả Nhân Viên ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const Service = new NhanVienService();
    const deletedCount = await Service.deleteAll();
    return res.send({
      message: `Đã xóa thành công ${deletedCount} Nhân Viên khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình dọn dẹp các Nhân Viên"),
    );
  }
};

// ============================== 6. Tìm một Nhân Viên theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const Service = new NhanVienService();
    const document = await Service.findById(req.params.id);
    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Nhân Viên"));
    }
    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(500, `Lỗi khi truy vấn Nhân Viên với mã = ${req.params.id}`),
    );
  }
};

// ============================== 7. Đăng nhập Nhân Viên ==================================
exports.login = async (req, res, next) => {
  const { email, mat_khau } = req.body;

  // 1. Kiểm tra đầu vào
  if (!email) {
    return next(new ApiError(400, "Email không được để trống"));
  }
  if (!mat_khau) {
    return next(new ApiError(400, "Mật khẩu không được để trống"));
  }

  try {
    const Service = new NhanVienService();
    // Gọi service kiểm tra thông tin đăng nhập
    const nhanVien = await Service.login(email, mat_khau);

    if (!nhanVien) {
      return next(new ApiError(401, "Email hoặc mật khẩu không chính xác"));
    }

    // 2. Kiểm tra trạng thái tài khoản (nếu bị khóa)
    if (!nhanVien.trang_thai) {
      return next(
        new ApiError(
          403,
          "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên",
        ),
      );
    }

    // 3. Ẩn mật khẩu trước khi trả về Client
    const { mat_khau: _, ...userWithoutPassword } = nhanVien;

    return res.send({
      message: "Đăng nhập thành công",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Lỗi: ", error);

    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình xử lý đăng nhập"),
    );
  }
};
