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

    // Ẩn mật khẩu trước khi trả về Client
    const { mat_khau: _, ...userWithoutPassword } = document;

    return res.send({
      message: "Khách hàng đã được tạo thành công",
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error(error);
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
    return next(
      new ApiError(
        400,
        "Dữ liệu cập nhật không được để trống không được để trống",
      ),
    );
  }

  try {
    // NẾU NGƯỜI DÙNG CÓ UPLOAD FILE MỚI -> MỚI CẬP NHẬT TRƯỜNG lo_go
    if (req.file) {
      // Chỉ lưu tên file vào DB theo cấu hình cũ của bạn
      req.body.avatar = req.file.filename;
    }

    console.log(req.body);

    const Service = new KhachHangService();
    const document = await Service.update(req.params.id, req.body);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Khách hàng cần cập nhật"));
    }

    // Ẩn mật khẩu trước khi trả về Client
    const { mat_khau: _, ...userWithoutPassword } = document;

    return res.send({
      message: "Cập nhật Khách hàng thành công",
      data: userWithoutPassword,
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

    // Ẩn mật khẩu trước khi trả về Client
    const { mat_khau: _, ...userWithoutPassword } = document;

    return res.send(userWithoutPassword);
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi truy vấn Khách hàng với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 7. Đăng nhập Khách Hàng ==================================
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
    const Service = new KhachHangService();
    // Gọi service kiểm tra thông tin đăng nhập
    const khachHang = await Service.login(email, mat_khau);

    if (!khachHang) {
      return next(new ApiError(401, "Email hoặc mật khẩu không chính xác"));
    }

    // 2. Kiểm tra trạng thái tài khoản (nếu bị khóa)
    if (!khachHang.trang_thai) {
      return next(
        new ApiError(
          403,
          "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên",
        ),
      );
    }

    // 3. Ẩn mật khẩu trước khi trả về Client
    const { mat_khau: _, ...userWithoutPassword } = khachHang;

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

exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Thiếu Google Token trong request payload!",
      });
    }

    const khachHangService = new KhachHangService();
    const khachHang = await khachHangService.loginWithGoogle(token);

    // 3. Ẩn mật khẩu trước khi trả về Client
    const { mat_khau: _, ...userWithoutPassword } = khachHang;

    return res.status(200).json({
      success: true,
      message: "Đăng nhập bằng Google thành công!",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Lỗi Controller googleLogin:", error);

    if (error.message === "TOKEN_INVALID") {
      return res.status(401).json({
        success: false,
        message: "Token Google không hợp lệ hoặc đã hết hạn!",
      });
    }

    if (error.message === "TAI_KHOAN_BI_KHOA") {
      return res.status(401).json({
        success: false,
        message:
          "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên!",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi hệ thống khi đăng nhập bằng Google.",
    });
  }
};

exports.loginWithFacebook = async (req, res) => {
  try {
    // 1. Lấy biến 'token' từ req.body (khớp với Frontend gửi lên { token: facebookToken })
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Thiếu Facebook Token trong request payload!",
      });
    }

    const khachHangService = new KhachHangService();

    // 2. Truyền đúng biến 'token' vừa lấy ở trên vào Service
    const khachHang = await khachHangService.loginWithFacebook(token);

    // 3. Ẩn mật khẩu trước khi trả về Client
    const { mat_khau: _, ...userWithoutPassword } = khachHang;

    return res.status(200).json({
      success: true,
      message: "Đăng nhập bằng Facebook thành công!",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Lỗi Controller loginWithFacebook:", error);

    if (error.message === "XAC_THUC_FACEBOOK_THAT_BAI") {
      return res.status(401).json({
        success: false,
        message: "Token Facebook không hợp lệ hoặc đã hết hạn!",
      });
    }

    if (error.message === "TAI_KHOAN_BI_KHOA") {
      return res.status(401).json({
        success: false,
        message:
          "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên!",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi hệ thống khi đăng nhập bằng Facebook.",
    });
  }
};
