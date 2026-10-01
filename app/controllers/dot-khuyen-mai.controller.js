const DotKhuyenMaiService = require("../services/dot-khuyen-mai.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo và lưu Đợt Khuyến Mãi mới ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.ten_dot) {
    return next(new ApiError(400, "ten_dot không được để trống"));
  }

  if (!req.body?.ngay_bat_dau || !req.body?.ngay_ket_thuc) {
    return next(
      new ApiError(400, "ngay_bat_dau và ngay_ket_thuc không được để trống"),
    );
  }

  try {
    const Service = new DotKhuyenMaiService();
    const document = await Service.create(req.body);
    return res.status(201).send({
      message: "Đợt khuyến mãi đã được tạo thành công",
      data: document,
    });
  } catch (error) {
    if (error.message === "NGAY_KET_THUC_PHAI_LON_HON_NGAY_BAT_DAU") {
      return next(new ApiError(400, "Ngày kết thúc phải lớn hơn ngày bắt đầu"));
    }

    if (error.message === "DOT_KHUYEN_MAI_DA_TON_TAI") {
      return next(
        new ApiError(400, "Đợt khuyến mãi này đã tồn tại trong hệ thống"),
      );
    }

    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi trong quá trình thêm Đợt Khuyến Mãi mới",
      ),
    );
  }
};

// =================== 2. Lấy danh sách Đợt Khuyến Mãi kết hợp bộ lọc (Mã, Tên, Ngày, Khả dụng) =================
exports.findAll = async (req, res, next) => {
  try {
    const Service = new DotKhuyenMaiService();

    let khaDungFilter = undefined;

    // Chỉ thực hiện ép kiểu Boolean khi req.query.kha_dung có giá trị khác rỗng ("true" hoặc "false")
    if (req.query.kha_dung !== undefined && req.query.kha_dung !== "") {
      khaDungFilter = req.query.kha_dung === "true";
    }

    const filterData = {
      id: req.query.id, // Lọc theo mã (?id=DKM01)
      ten_dot: req.query.name || req.query.ten_dot, // Lọc theo tên (?name=BlackFriday)
      kha_dung: khaDungFilter, // Nếu chọn Tất cả -> khaDungFilter = undefined (bỏ qua lọc)
      tu_ngay: req.query.tu_ngay, // Lọc khoảng thời gian bắt đầu
      den_ngay: req.query.den_ngay, // Lọc khoảng thời gian kết thúc
    };

    const documents = await Service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách Đợt Khuyến Mãi"),
    );
  }
};

// ============================== 3. Cập nhật Đợt Khuyến Mãi theo mã ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const Service = new DotKhuyenMaiService();
    const document = await Service.update(req.params.id, req.body);

    if (!document) {
      return next(
        new ApiError(404, "Không tìm thấy Đợt khuyến mãi cần cập nhật"),
      );
    }

    return res.send({
      message: "Cập nhật Đợt khuyến mãi thành công",
      document,
    });
  } catch (error) {
    if (error.message === "NGAY_KET_THUC_PHAI_LON_HON_NGAY_BAT_DAU") {
      return next(new ApiError(400, "Ngày kết thúc phải lớn hơn ngày bắt đầu"));
    }

    return next(
      new ApiError(
        500,
        `Lỗi khi cập nhật Đợt khuyến mãi với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 4. Xóa một Đợt Khuyến Mãi theo mã ==================================
exports.delete = async (req, res, next) => {
  try {
    const Service = new DotKhuyenMaiService();
    const document = await Service.delete(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Đợt khuyến mãi cần xóa"));
    }

    return res.send({ message: "Đã xóa Đợt khuyến mãi thành công" });
  } catch (error) {
    if (error.message === "DOT_KHUYEN_MAI_DANG_DUOC_SU_DUNG") {
      return next(
        new ApiError(
          400,
          "Không thể xóa Đợt khuyến mãi này vì đang chứa sản phẩm áp dụng!",
        ),
      );
    }

    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa Đợt khuyến mãi với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Tìm một Đợt Khuyến Mãi theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const Service = new DotKhuyenMaiService();
    const document = await Service.findById(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Đợt khuyến mãi"));
    }

    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi truy vấn Đợt khuyến mãi với mã = ${req.params.id}`,
      ),
    );
  }
};
