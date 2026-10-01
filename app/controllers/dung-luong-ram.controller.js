const DungLuongRamService = require("../services/dung-luong-ram.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo và lưu Dung Lượng RAM mới ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.dung_luong_ram) {
    return next(new ApiError(400, "dung_luong_ram không được để trống"));
  }

  try {
    const Service = new DungLuongRamService();
    const document = await Service.create(req.body);
    return res.send({
      message: "Dung lượng RAM đã được tạo thành công",
      data: document,
    });
  } catch (error) {
    // Kiểm tra nếu là lỗi trùng dung lượng RAM
    if (error.message === "DUNG_LUONG_RAM_DA_TON_TAI") {
      return next(
        new ApiError(400, "Dung lượng RAM này đã tồn tại trong hệ thống"),
      );
    }

    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi trong quá trình thêm Dung Lượng RAM mới",
      ),
    );
  }
};

// =================== 2. Lấy danh sách Dung Lượng RAM kết hợp bộ lọc (Mã, Giá trị) =================
exports.findAll = async (req, res, next) => {
  try {
    const Service = new DungLuongRamService();

    const filterData = {
      id: req.query.id, // Lọc theo mã (?id=RAM01)
      dung_luong_ram: req.query.name, // Lọc theo giá trị (?name=8GB)
    };

    const documents = await Service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách Dung Lượng RAM"),
    );
  }
};

// ============================== 3. Cập nhật Dung Lượng RAM theo mã ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const Service = new DungLuongRamService();
    const document = await Service.update(req.params.id, req.body);

    if (!document) {
      return next(
        new ApiError(404, "Không tìm thấy Dung lượng RAM cần cập nhật"),
      );
    }

    return res.send({
      message: "Cập nhật Dung lượng RAM thành công",
      document,
    });
  } catch (error) {
    if (error.message === "DUNG_LUONG_RAM_DA_TON_TAI") {
      return next(
        new ApiError(400, "Dung lượng RAM này đã tồn tại trong hệ thống"),
      );
    }

    return next(
      new ApiError(
        500,
        `Lỗi khi cập nhật Dung lượng RAM với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 4. Xóa một Dung Lượng RAM theo mã ==================================
exports.delete = async (req, res, next) => {
  try {
    const Service = new DungLuongRamService();
    const document = await Service.delete(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Dung lượng RAM cần xóa"));
    }

    return res.send({ message: "Đã xóa Dung lượng RAM thành công" });
  } catch (error) {
    if (error.message === "RAM_DANG_DUOC_SU_DUNG") {
      return next(
        new ApiError(
          400,
          "Không thể xóa Dung lượng RAM này vì đang được sử dụng ở Biến thể sản phẩm!",
        ),
      );
    }

    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa Dung lượng RAM với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Xóa tất cả Dung Lượng RAM chưa được sử dụng ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const Service = new DungLuongRamService();
    const deletedCount = await Service.deleteAll();
    return res.send({
      message: `Đã xóa thành công ${deletedCount} Dung lượng RAM chưa được sử dụng khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi trong quá trình dọn dẹp các dung lượng RAM",
      ),
    );
  }
};

// ============================== 6. Tìm một Dung Lượng RAM theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const Service = new DungLuongRamService();
    const document = await Service.findById(req.params.id);
    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Dung lượng RAM"));
    }
    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi truy vấn Dung lượng RAM với mã = ${req.params.id}`,
      ),
    );
  }
};
