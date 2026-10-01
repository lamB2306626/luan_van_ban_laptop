const ThuocTinhService = require("../services/thuoc-tinh.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo và lưu Thuộc Tính mới ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.ten_thuoc_tinh) {
    return next(new ApiError(400, "ten_thuoc_tinh không được để trống"));
  }

  try {
    const Service = new ThuocTinhService();
    const document = await Service.create(req.body);
    return res.send({
      message: "Thuộc Tính đã được tạo thành công",
      data: document,
    });
  } catch (error) {
    // Kiểm tra nếu là lỗi trùng tên Thuộc Tính
    if (error.message === "TEN_THUOC_TINH_DA_TON_TAI") {
      return next(
        new ApiError(400, "Tên Thuộc Tính này đã tồn tại trong hệ thống"),
      );
    }

    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình thêm Thuộc Tính mới"),
    );
  }
};

// =================== 2. Lấy danh sách Thuộc Tính kết hợp bộ lọc (Mã, Tên) =================
exports.findAll = async (req, res, next) => {
  try {
    const Service = new ThuocTinhService();

    const filterData = {
      id: req.query.id, // Lọc theo mã (?id=DM01)
      ten_thuoc_tinh: req.query.name, // Lọc theo tên (?name=Gaming)
    };

    const documents = await Service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách Thuộc Tính"),
    );
  }
};

// ============================== 3. Cập nhật Thuộc Tính theo mã ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const Service = new ThuocTinhService();
    const document = await Service.update(req.params.id, req.body);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Thuộc Tính cần cập nhật"));
    }

    return res.send({ message: "Cập nhật Thuộc Tính thành công", document });
  } catch (error) {
    if (error.message === "TEN_THUOC_TINH_DA_TON_TAI") {
      return next(
        new ApiError(400, "Tên Thuộc Tính này đã tồn tại trong hệ thống"),
      );
    }

    return next(
      new ApiError(
        500,
        `Lỗi khi cập nhật Thuộc Tính với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 4. Xóa một Thuộc Tính theo mã ==================================
exports.delete = async (req, res, next) => {
  try {
    const Service = new ThuocTinhService();
    const document = await Service.delete(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Thuộc Tính cần xóa"));
    }

    return res.send({ message: "Đã xóa Thuộc Tính thành công" });
  } catch (error) {
    if (error.message === "THUOC_TINH_DANG_CO_GIA_TRI") {
      return next(
        new ApiError(
          400,
          "Không thể xóa Thuộc Tính này vì đang có Giá trị thuộc tính liên kết!",
        ),
      );
    }

    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa Thuộc Tính với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Xóa tất cả Thuộc Tính rỗng ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const Service = new ThuocTinhService();
    const deletedCount = await Service.deleteAll();
    return res.send({
      message: `Đã xóa thành công ${deletedCount} Thuộc Tính trống (không chứa giá trị thuộc tính) khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình dọn dẹp các Thuộc Tính"),
    );
  }
};

// ============================== 6. Tìm một Thuộc Tính theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const Service = new ThuocTinhService();
    const document = await Service.findById(req.params.id);
    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Thuộc Tính"));
    }
    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi truy vấn Thuộc Tính với mã = ${req.params.id}`,
      ),
    );
  }
};
