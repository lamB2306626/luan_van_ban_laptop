const ChiTietKhuyenMaiService = require("../services/chi-tiet-khuyen-mai.service");
const ApiError = require("../api-error");

// ============================== 1. Thêm Chi Tiết Khuyến Mãi mới ==================================
exports.create = async (req, res, next) => {
  const {
    id_dot_km,
    id_san_pham,
    danh_sach_id_san_pham,
    loai_giam_gia,
    gia_tri_giam,
  } = req.body;

  // Validate các trường cơ bản bắt buộc
  if (!id_dot_km || !loai_giam_gia || gia_tri_giam === undefined) {
    return next(
      new ApiError(
        400,
        "Vui lòng nhập đầy đủ: id_dot_km, loai_giam_gia, gia_tri_giam",
      ),
    );
  }

  // Validate ít nhất phải có 1 trong 2: id_san_pham lẻ hoặc danh_sach_id_san_pham
  if (
    !id_san_pham &&
    (!Array.isArray(danh_sach_id_san_pham) ||
      danh_sach_id_san_pham.length === 0)
  ) {
    return next(
      new ApiError(400, "Phải cung cấp id_san_pham hoặc danh_sach_id_san_pham"),
    );
  }

  try {
    const service = new ChiTietKhuyenMaiService();
    const result = await service.create(req.body);

    if (result.totalCreated !== undefined) {
      return res.status(201).send({
        message: `Đã thêm thành công ${result.totalCreated} sản phẩm vào đợt khuyến mãi`,
        data: result,
      });
    }

    return res.status(201).send({
      message: "Thêm sản phẩm vào đợt khuyến mãi thành công",
      data: result,
    });
  } catch (error) {
    console.error("Lỗi Checkout Chi Tiết:", error);
    if (error.message === "SAN_PHAM_DA_CO_TRONG_DOT_KHUYEN_MAI") {
      return next(
        new ApiError(
          400,
          "Có sản phẩm đã tồn tại sẵn trong đợt khuyến mãi này!",
        ),
      );
    }

    if (error.message === "DOT_KHUYEN_MAI_HOAC_SAN_PHAM_KHONG_TON_TAI") {
      return next(
        new ApiError(
          404,
          "Mã đợt khuyến mãi hoặc có mã sản phẩm không tồn tại",
        ),
      );
    }

    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi trong quá trình thêm Chi Tiết Khuyến Mãi",
      ),
    );
  }
};

// =================== 2. Lấy danh sách Chi Tiết Khuyến Mãi (Lọc theo mã đợt, mã sản phẩm) =================
exports.findAll = async (req, res, next) => {
  try {
    const service = new ChiTietKhuyenMaiService();

    const filterData = {
      id: req.query.id,
      id_dot_km: req.query.id_dot_km,
      id_san_pham: req.query.id_san_pham,
    };

    const documents = await service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách Chi Tiết Khuyến Mãi"),
    );
  }
};

// ============================== 3. Cập nhật Chi Tiết Khuyến Mãi theo id ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const service = new ChiTietKhuyenMaiService();
    const document = await service.update(req.params.id, req.body);

    if (!document) {
      return next(
        new ApiError(404, "Không tìm thấy Chi Tiết Khuyến Mãi cần cập nhật"),
      );
    }

    return res.send({
      message: "Cập nhật Chi Tiết Khuyến Mãi thành công",
      document,
    });
  } catch (error) {
    if (error.message === "SAN_PHAM_DA_CO_TRONG_DOT_KHUYEN_MAI") {
      return next(
        new ApiError(400, "Sản phẩm này đã tồn tại trong đợt khuyến mãi!"),
      );
    }

    if (error.message === "DOT_KHUYEN_MAI_HOAC_SAN_PHAM_KHONG_TON_TAI") {
      return next(
        new ApiError(404, "Mã đợt khuyến mãi hoặc mã sản phẩm không tồn tại"),
      );
    }

    return next(
      new ApiError(
        500,
        `Lỗi khi cập nhật Chi Tiết Khuyến Mãi với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 4. Xóa một Chi Tiết Khuyến Mãi theo id ==================================
exports.delete = async (req, res, next) => {
  try {
    const service = new ChiTietKhuyenMaiService();
    const document = await service.delete(req.params.id);

    if (!document) {
      return next(
        new ApiError(404, "Không tìm thấy Chi Tiết Khuyến Mãi cần xóa"),
      );
    }

    return res.send({
      message: "Đã xóa sản phẩm khỏi đợt khuyến mãi thành công",
    });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi xóa Chi Tiết Khuyến Mãi với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Xóa tất cả Chi Tiết theo Mã Đợt Khuyến Mãi ==================================
exports.deleteByDotKm = async (req, res, next) => {
  const { id_dot_km } = req.params;

  try {
    const service = new ChiTietKhuyenMaiService();
    const deletedCount = await service.deleteByDotKm(id_dot_km);

    return res.send({
      message: `Đã xóa thành công ${deletedCount} sản phẩm thuộc đợt khuyến mãi ${id_dot_km}`,
    });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi dọn dẹp danh sách sản phẩm của đợt khuyến mãi = ${id_dot_km}`,
      ),
    );
  }
};

// ============================== 6. Tìm một Chi Tiết Khuyến Mãi theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const service = new ChiTietKhuyenMaiService();
    const document = await service.findById(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Chi Tiết Khuyến Mãi"));
    }

    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi truy vấn Chi Tiết Khuyến Mãi với mã = ${req.params.id}`,
      ),
    );
  }
};
