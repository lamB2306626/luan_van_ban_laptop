const ThuocTinhBienTheService = require("../services/thuoc-tinh-bien-the.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo và lưu Thuộc tính biến thể mới ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.id_bien_the) {
    return next(new ApiError(400, "id_bien_the không được để trống"));
  }
  if (!req.body?.id_gia_tri_thuoc_tinh) {
    return next(new ApiError(400, "id_gia_tri_thuoc_tinh không được để trống"));
  }

  try {
    const Service = new ThuocTinhBienTheService();
    const document = await Service.create(req.body);
    return res.send({
      message: "Liên kết thuộc tính - biến thể đã được tạo thành công",
      data: document,
    });
  } catch (error) {
    if (error.message === "LIEN_KET_DA_TON_TAI") {
      return next(
        new ApiError(400, "Giá trị thuộc tính này đã tồn tại trong biến thể"),
      );
    }
    if (error.message === "KHOA_NGOAI_KHONG_TON_TAI") {
      return next(
        new ApiError(
          400,
          "Mã biến thể hoặc mã giá trị thuộc tính không tồn tại trong hệ thống",
        ),
      );
    }

    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi trong quá trình thêm Thuộc tính biến thể mới",
      ),
    );
  }
};

// =================== 2. Lấy danh sách Thuộc tính biến thể kết hợp bộ lọc =================
exports.findAll = async (req, res, next) => {
  try {
    const Service = new ThuocTinhBienTheService();

    const filterData = {
      id: req.query.id, // Lọc theo mã liên kết (?id=TTBT01)
      id_bien_the: req.query.id_bien_the, // Lọc theo mã biến thể (?id_bien_the=BT01)
      id_gia_tri_thuoc_tinh: req.query.id_gia_tri_thuoc_tinh, // Lọc theo mã giá trị thuộc tính
    };

    const documents = await Service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách Thuộc tính biến thể"),
    );
  }
};

// ============================== 3. Cập nhật Thuộc tính biến thể theo mã ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const Service = new ThuocTinhBienTheService();
    const document = await Service.update(req.params.id, req.body);

    if (!document) {
      return next(
        new ApiError(404, "Không tìm thấy Thuộc tính biến thể cần cập nhật"),
      );
    }

    return res.send({
      message: "Cập nhật Thuộc tính biến thể thành công",
      document,
    });
  } catch (error) {
    if (error.message === "LIEN_KET_DA_TON_TAI") {
      return next(
        new ApiError(400, "Giá trị thuộc tính này đã tồn tại trong biến thể"),
      );
    }
    if (error.message === "KHOA_NGOAI_KHONG_TON_TAI") {
      return next(
        new ApiError(
          400,
          "Mã biến thể hoặc mã giá trị thuộc tính mới không tồn tại trong hệ thống",
        ),
      );
    }

    return next(
      new ApiError(
        500,
        `Lỗi khi cập nhật Thuộc tính biến thể với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 4. Xóa một Thuộc tính biến thể theo mã ==================================
exports.delete = async (req, res, next) => {
  try {
    const Service = new ThuocTinhBienTheService();
    const document = await Service.delete(req.params.id);

    if (!document) {
      return next(
        new ApiError(404, "Không tìm thấy Thuộc tính biến thể cần xóa"),
      );
    }

    return res.send({ message: "Đã xóa Thuộc tính biến thể thành công" });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa Thuộc tính biến thể với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Xóa tất cả Thuộc tính biến thể ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const Service = new ThuocTinhBienTheService();
    const deletedCount = await Service.deleteAll();
    return res.send({
      message: `Đã xóa thành công ${deletedCount} Thuộc tính biến thể khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi trong quá trình dọn dẹp các Thuộc tính biến thể",
      ),
    );
  }
};

// ============================== 6. Tìm một Thuộc tính biến thể theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const Service = new ThuocTinhBienTheService();
    const document = await Service.findById(req.params.id);
    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Thuộc tính biến thể"));
    }
    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi truy vấn Thuộc tính biến thể với mã = ${req.params.id}`,
      ),
    );
  }
};
