const NhaCungCapService = require("../services/nha-cung-cap.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo và lưu Nhà cung cấp mới ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.ten_ncc) {
    return next(new ApiError(400, "ten_ncc không được để trống"));
  }

  if (!req.body?.so_dien_thoai) {
    return next(new ApiError(400, "so_dien_thoai không được để trống"));
  }

  if (!req.body?.dia_chi) {
    return next(new ApiError(400, "dia_chi không được để trống"));
  }

  try {
    const Service = new NhaCungCapService();
    const document = await Service.create(req.body);
    return res.send({
      message: "Nhà cung cấp đã được tạo thành công",
      data: document,
    });
  } catch (error) {
    // Kiểm tra nếu là lỗi trùng tên nhà cung cấp
    if (error.message === "TEN_NHA_CUNG_CAP_DA_TON_TAI") {
      return next(
        new ApiError(400, "Tên nhà cung cấp này đã tồn tại trong hệ thống"),
      );
    }

    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình thêm Nhà cung cấp mới"),
    );
  }
};

// =================== 2. Lấy danh sách Nhà cung cấp kết hợp bộ lọc (Mã, Tên) =================
exports.findAll = async (req, res, next) => {
  try {
    const Service = new NhaCungCapService();

    const filterData = {
      id: req.query.id,
      ten_nha_cung_cap: req.query.name, 
    };

    const documents = await Service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách Nhà cung cấp"),
    );
  }
};

// ============================== 3. Cập nhật Nhà cung cấp theo mã ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const Service = new NhaCungCapService();
    const document = await Service.update(req.params.id, req.body);

    if (!document) {
      return next(
        new ApiError(404, "Không tìm thấy Nhà cung cấp cần cập nhật"),
      );
    }

    return res.send({ message: "Cập nhật Nhà cung cấp thành công", document });
  } catch (error) {
    if (error.message === "TEN_NHA_CUNG_CAP_DA_TON_TAI") {
      return next(
        new ApiError(400, "Tên nhà cung cấp này đã tồn tại trong hệ thống"),
      );
    }

    return next(
      new ApiError(
        500,
        `Lỗi khi cập nhật Nhà cung cấp với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 4. Xóa một Nhà cung cấp theo mã ==================================
exports.delete = async (req, res, next) => {
  try {
    const Service = new NhaCungCapService();
    const document = await Service.delete(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Nhà cung cấp cần xóa"));
    }

    return res.send({ message: "Đã xóa Nhà cung cấp thành công" });
  } catch (error) {
    if (error.message === "NHA_CUNG_CAP_DANG_CO_PHIEU_NHAP") {
      return next(
        new ApiError(
          400,
          "Không thể xóa Nhà cung cấp này vì đang có Phiếu nhập liên kết!"
        )
      );
    }

    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa Nhà cung cấp với mã = ${req.params.id}`
      )
    );
  }
};

// ============================== 5. Xóa tất cả Nhà cung cấp rỗng ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const Service = new NhaCungCapService();
    const deletedCount = await Service.deleteAll();
    return res.send({
      message: `Đã xóa thành công ${deletedCount} Nhà cung cấp trống (không chứa phiếu nhập) khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi trong quá trình dọn dẹp các Nhà cung cấp"
      )
    );
  }
};

// ============================== 6. Tìm một Nhà cung cấp theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const Service = new NhaCungCapService();
    const document = await Service.findById(req.params.id);
    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Nhà cung cấp"));
    }
    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi truy vấn Nhà cung cấp với mã = ${req.params.id}`,
      ),
    );
  }
};
