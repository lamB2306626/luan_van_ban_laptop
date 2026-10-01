const DanhGiaService = require("../services/danh-gia.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo và lưu Đánh Giá mới ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.id_san_pham) {
    return next(new ApiError(400, "id_san_pham không được để trống"));
  }

  if (!req.body?.id_khach_hang) {
    return next(new ApiError(400, "id_khach_hang không được để trống"));
  }

  if (req.body?.so_sao === undefined || req.body?.so_sao === null) {
    return next(new ApiError(400, "so_sao không được để trống"));
  }

  const soSao = parseInt(req.body.so_sao, 10);
  if (isNaN(soSao) || soSao < 1 || soSao > 5) {
    return next(new ApiError(400, "so_sao phải là số nguyên từ 1 đến 5"));
  }

  try {
    const service = new DanhGiaService();
    const document = await service.create(req.body);
    return res.status(201).send({
      message: "Đã gửi đánh giá sản phẩm thành công",
      data: document,
    });
  } catch (error) {
    if (error.message === "SAN_PHAM_HOAC_KHACH_HANG_KHONG_TON_TAI") {
      return next(
        new ApiError(
          404,
          "Sản phẩm hoặc Khách hàng không tồn tại trong hệ thống",
        ),
      );
    }

    if (error.message === "KHACH_HANG_DA_DANH_GIA_SAN_PHAM_NAY") {
      return next(
        new ApiError(
          400,
          "Khách hàng này đã gửi đánh giá cho sản phẩm này rồi",
        ),
      );
    }

    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình thêm Đánh Giá mới"),
    );
  }
};

// =================== 2. Lấy danh sách Đánh Giá kết hợp bộ lọc (id, id_san_pham, id_khach_hang, so_sao) =================
exports.findAll = async (req, res, next) => {
  try {
    const service = new DanhGiaService();

    const filterData = {
      id: req.query.id, // Lọc theo mã đánh giá (?id=DG01)
      id_san_pham: req.query.id_san_pham, // Lọc theo sản phẩm (?id_san_pham=SP01)
      id_khach_hang: req.query.id_khach_hang, // Lọc theo khách hàng (?id_khach_hang=KH01)
      so_sao: req.query.so_sao, // Lọc theo số sao (?so_sao=5)
    };

    const documents = await service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách Đánh Giá"));
  }
};

// ============================== 3. Cập nhật Đánh Giá theo mã id ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  if (req.body.so_sao !== undefined) {
    const soSao = parseInt(req.body.so_sao, 10);
    if (isNaN(soSao) || soSao < 1 || soSao > 5) {
      return next(new ApiError(400, "so_sao phải là số nguyên từ 1 đến 5"));
    }
  }

  try {
    const service = new DanhGiaService();
    const document = await service.update(req.params.id, req.body);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Đánh Giá cần cập nhật"));
    }

    return res.send({ message: "Cập nhật Đánh Giá thành công", document });
  } catch (error) {
    return next(
      new ApiError(500, `Lỗi khi cập nhật Đánh Giá với mã = ${req.params.id}`),
    );
  }
};

// ============================== 4. Xóa một Đánh Giá theo mã id ==================================
exports.delete = async (req, res, next) => {
  try {
    const service = new DanhGiaService();
    const document = await service.delete(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Đánh Giá cần xóa"));
    }

    return res.send({ message: "Đã xóa Đánh Giá thành công" });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa Đánh Giá với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Xóa tất cả Đánh Giá ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const service = new DanhGiaService();
    const deletedCount = await service.deleteAll();
    return res.send({
      message: `Đã xóa thành công ${deletedCount} Đánh Giá khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình dọn dẹp các Đánh Giá"),
    );
  }
};

// ============================== 6. Tìm một Đánh Giá theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const service = new DanhGiaService();
    const document = await service.findById(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Đánh Giá"));
    }

    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(500, `Lỗi khi truy vấn Đánh Giá với mã = ${req.params.id}`),
    );
  }
};
