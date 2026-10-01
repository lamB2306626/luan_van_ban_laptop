const PhieuGiamGiaService = require("../services/phieu-giam-gia.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo và lưu Phiếu Giảm Giá mới ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.ten_phieu) {
    return next(new ApiError(400, "ten_phieu không được để trống"));
  }

  if (!req.body?.loai_phieu) {
    return next(new ApiError(400, "loai_phieu không được để trống"));
  }

  if (req.body?.gia_tri_giam === undefined || req.body?.gia_tri_giam === null) {
    return next(new ApiError(400, "gia_tri_giam không được để trống"));
  }

  if (!req.body?.ngay_bat_dau || !req.body?.ngay_het_han) {
    return next(
      new ApiError(400, "ngay_bat_dau và ngay_het_han không được để trống"),
    );
  }

  if (new Date(req.body.ngay_bat_dau) >= new Date(req.body.ngay_het_han)) {
    return next(
      new ApiError(400, "ngay_het_han phải diễn ra sau ngay_bat_dau"),
    );
  }

  try {
    const service = new PhieuGiamGiaService();
    const document = await service.create(req.body);
    return res.status(201).send({
      message: "Phiếu Giảm Giá đã được tạo thành công",
      data: document,
    });
  } catch (error) {
    if (error.message === "TEN_PHIEU_DA_TON_TAI") {
      return next(
        new ApiError(400, "Tên phiếu giảm giá này đã tồn tại trong hệ thống"),
      );
    }

    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi trong quá trình thêm Phiếu Giảm Giá mới",
      ),
    );
  }
};

// =================== 2. Lấy danh sách Phiếu Giảm Giá kết hợp bộ lọc =================
exports.findAll = async (req, res, next) => {
  try {
    const service = new PhieuGiamGiaService();

    let khaDungFilter = undefined;
    // Chỉ thực hiện ép kiểu Boolean khi req.query.kha_dung có giá trị khác rỗng ("true" hoặc "false")
    if (req.query.kha_dung !== undefined && req.query.kha_dung !== "") {
      khaDungFilter = req.query.kha_dung === "true";
    }

    const filterData = {
      id: req.query.id,
      ten_phieu: req.query.ten_phieu,
      loai_phieu: req.query.loai_phieu,
      trang_thai:
        req.query.trang_thai !== undefined
          ? req.query.trang_thai === "true"
          : undefined,
      kha_dung: khaDungFilter,
      tu_ngay: req.query.tu_ngay,
      den_ngay: req.query.den_ngay,
    };

    const documents = await service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách Phiếu Giảm Giá"),
    );
  }
};

// ============================== 3. Cập nhật Phiếu Giảm Giá theo mã ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  if (req.body.ngay_bat_dau && req.body.ngay_het_han) {
    if (new Date(req.body.ngay_bat_dau) >= new Date(req.body.ngay_het_han)) {
      return next(
        new ApiError(400, "ngay_het_han phải diễn ra sau ngay_bat_dau"),
      );
    }
  }

  try {
    const service = new PhieuGiamGiaService();
    const document = await service.update(req.params.id, req.body);

    if (!document) {
      return next(
        new ApiError(404, "Không tìm thấy Phiếu Giảm Giá cần cập nhật"),
      );
    }

    return res.send({
      message: "Cập nhật Phiếu Giảm Giá thành công",
      data: document,
    });
  } catch (error) {
    if (error.message === "TEN_PHIEU_DA_TON_TAI") {
      return next(
        new ApiError(400, "Tên phiếu giảm giá này đã tồn tại trong hệ thống"),
      );
    }

    return next(
      new ApiError(
        500,
        `Lỗi khi cập nhật Phiếu Giảm Giá với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 4. Xóa (vô hiệu hóa) một Phiếu Giảm Giá theo mã ==================================
exports.delete = async (req, res, next) => {
  try {
    const service = new PhieuGiamGiaService();
    const document = await service.delete(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Phiếu Giảm Giá cần xóa"));
    }

    return res.send({ message: "Đã xóa Phiếu Giảm Giá thành công" });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa Phiếu Giảm Giá với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Bật một Phiếu Giảm Giá theo mã ==================================
exports.restore = async (req, res, next) => {
  try {
    const service = new PhieuGiamGiaService();
    const document = await service.restore(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Phiếu Giảm Giá cần bật"));
    }

    return res.send({ message: "Đã bật Phiếu Giảm Giá thành công" });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi bật Phiếu Giảm Giá với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 6. Xóa (Vô hiệu hóa) tất cả Phiếu Giảm Giá ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const service = new PhieuGiamGiaService();
    const deletedCount = await service.deleteAll();
    return res.send({
      message: `Đã xóa thành công ${deletedCount} Phiếu Giảm Giá khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi trong quá trình dọn dẹp tất cả Phiếu Giảm Giá",
      ),
    );
  }
};

// ============================== 7. Tìm một Phiếu Giảm Giá theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const service = new PhieuGiamGiaService();
    const document = await service.findById(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Phiếu Giảm Giá"));
    }

    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi truy vấn Phiếu Giảm Giá với mã = ${req.params.id}`,
      ),
    );
  }
};
