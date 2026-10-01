const PhieuHangThanhVienService = require("../services/phieu-hang-thanh-vien.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo Quy tắc Tặng Phiếu cho Hạng Thành Viên ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.id_hang_thanh_vien) {
    return next(new ApiError(400, "id_hang_thanh_vien không được để trống"));
  }

  if (!req.body?.id_phieu_giam_gia) {
    return next(new ApiError(400, "id_phieu_giam_gia không được để trống"));
  }

  try {
    const service = new PhieuHangThanhVienService();
    const document = await service.create(req.body);
    return res.status(201).send({
      message: "Tạo quy tắc tặng phiếu cho hạng thành viên thành công",
      data: document,
    });
  } catch (error) {
    if (error.message === "HANG_THANH_VIEN_HOAC_PHIEU_GIAM_GIA_KHONG_TON_TAI") {
      return next(
        new ApiError(
          404,
          "Hạng thành viên hoặc Phiếu giảm giá không tồn tại trong hệ thống",
        ),
      );
    }

    if (error.message === "QUY_TAC_TANG_PHIEU_CHO_HANG_NAY_DA_TON_TAI") {
      return next(
        new ApiError(
          400,
          "Phiếu giảm giá này đã được thiết lập cho hạng thành viên từ trước",
        ),
      );
    }

    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi khi tạo quy tắc tặng phiếu cho hạng thành viên",
      ),
    );
  }
};

// =================== 2. Lấy danh sách Quy tắc Tặng Phiếu kết hợp bộ lọc =================
exports.findAll = async (req, res, next) => {
  try {
    const service = new PhieuHangThanhVienService();

    const filterData = {
      id: req.query.id, // Lọc theo mã (?id=PHTV01)
      id_hang_thanh_vien: req.query.id_hang_thanh_vien, // Lọc phiếu được tặng của 1 hạng (?id_hang_thanh_vien=HTV01)
      id_phieu_giam_gia: req.query.id_phieu_giam_gia, // Lọc hạng nào được tặng 1 phiếu (?id_phieu_giam_gia=PGG01)
    };

    const documents = await service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi khi lấy danh sách quy tắc tặng phiếu hạng thành viên",
      ),
    );
  }
};

// ============================== 3. Tìm một Quy tắc Tặng Phiếu theo mã id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const service = new PhieuHangThanhVienService();
    const document = await service.findById(req.params.id);

    if (!document) {
      return next(
        new ApiError(404, "Không tìm thấy quy tắc tặng phiếu hạng thành viên"),
      );
    }

    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi truy vấn quy tắc tặng phiếu với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 4. Cập nhật Quy tắc Tặng Phiếu theo mã id ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const service = new PhieuHangThanhVienService();
    const document = await service.update(req.params.id, req.body);

    if (!document) {
      return next(
        new ApiError(
          404,
          "Không tìm thấy quy tắc tặng phiếu hạng thành viên cần cập nhật",
        ),
      );
    }

    return res.send({
      message: "Cập nhật quy tắc tặng phiếu hạng thành viên thành công",
      data: document,
    });
  } catch (error) {
    if (error.message === "HANG_THANH_VIEN_HOAC_PHIEU_GIAM_GIA_KHONG_TON_TAI") {
      return next(
        new ApiError(
          404,
          "Hạng thành viên hoặc Phiếu giảm giá không tồn tại trong hệ thống",
        ),
      );
    }

    if (error.message === "QUY_TAC_TANG_PHIEU_CHO_HANG_NAY_DA_TON_TAI") {
      return next(
        new ApiError(
          400,
          "Phiếu giảm giá này đã được thiết lập cho hạng thành viên từ trước",
        ),
      );
    }

    return next(
      new ApiError(
        500,
        `Lỗi khi cập nhật quy tắc tặng phiếu với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Xóa một Quy tắc Tặng Phiếu theo mã id ==================================
exports.delete = async (req, res, next) => {
  try {
    const service = new PhieuHangThanhVienService();
    const document = await service.delete(req.params.id);

    if (!document) {
      return next(
        new ApiError(
          404,
          "Không tìm thấy quy tắc tặng phiếu hạng thành viên cần xóa",
        ),
      );
    }

    return res.send({
      message: "Đã xóa quy tắc tặng phiếu hạng thành viên thành công",
    });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa quy tắc tặng phiếu với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 6. Xóa tất cả các Quy tắc Tặng Phiếu ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const service = new PhieuHangThanhVienService();
    const deletedCount = await service.deleteAll();
    return res.send({
      message: `Đã xóa thành công ${deletedCount} quy tắc tặng phiếu hạng thành viên khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi trong quá trình dọn dẹp danh sách quy tắc tặng phiếu hạng thành viên",
      ),
    );
  }
};
