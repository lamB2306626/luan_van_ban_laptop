const ChiTietDonHangService = require("../services/chi-tiet-don-hang.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo Chi Tiết Đơn Hàng mới ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.id_don_hang) {
    return next(new ApiError(400, "id_don_hang không được để trống"));
  }
  if (!req.body?.id_bien_the) {
    return next(new ApiError(400, "id_bien_the không được để trống"));
  }
  if (req.body?.so_luong === undefined || req.body.so_luong <= 0) {
    return next(new ApiError(400, "so_luong phải lớn hơn 0"));
  }

  try {
    const service = new ChiTietDonHangService();
    const document = await service.create(req.body);
    return res.status(201).send({
      message: "Chi tiết đơn hàng đã được tạo thành công",
      data: document,
    });
  } catch (error) {
    if (error.message === "SO_LUONG_TON_KHO_KHONG_DU") {
      return next(
        new ApiError(
          400,
          "Số lượng sản phẩm trong kho không đủ để thực hiện giao dịch!",
        ),
      );
    }

    if (error.message === "BIEN_THE_DA_TON_TAI_TRONG_DON_HANG") {
      return next(
        new ApiError(400, "Biến thể sản phẩm này đã tồn tại trong đơn hàng!"),
      );
    }
    if (error.message === "DON_HANG_HOAC_BIEN_THE_KHONG_TON_TAI") {
      return next(
        new ApiError(
          404,
          "Đơn hàng hoặc Biến thể sản phẩm truyền vào không tồn tại trong hệ thống",
        ),
      );
    }

    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi trong quá trình thêm Chi Tiết Đơn Hàng mới",
      ),
    );
  }
};

// =================== 2. Lấy danh sách Chi Tiết Đơn Hàng kết hợp bộ lọc =================
exports.findAll = async (req, res, next) => {
  try {
    const service = new ChiTietDonHangService();

    const filterData = {
      id: req.query.id, // Lọc theo mã CTDH (?id=CTDH01)
      id_don_hang: req.query.id_don_hang, // Lọc theo đơn hàng (?id_don_hang=DH01)
      id_bien_the: req.query.id_bien_the, // Lọc theo biến thể (?id_bien_the=BT01)
    };

    const documents = await service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách Chi Tiết Đơn Hàng"),
    );
  }
};

// ============================== 3. Cập nhật Chi Tiết Đơn Hàng theo mã ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const service = new ChiTietDonHangService();
    const document = await service.update(req.params.id, req.body);

    if (!document) {
      return next(
        new ApiError(404, "Không tìm thấy Chi tiết đơn hàng cần cập nhật"),
      );
    }

    return res.send({
      message: "Cập nhật Chi tiết đơn hàng thành công",
      data: document,
    });
  } catch (error) {
    if (error.message === "BIEN_THE_DA_TON_TAI_TRONG_DON_HANG") {
      return next(
        new ApiError(400, "Biến thể sản phẩm này đã tồn tại trong đơn hàng!"),
      );
    }
    if (error.message === "DON_HANG_HOAC_BIEN_THE_KHONG_TON_TAI") {
      return next(
        new ApiError(
          404,
          "Đơn hàng hoặc Biến thể sản phẩm cập nhật không tồn tại",
        ),
      );
    }

    return next(
      new ApiError(
        500,
        `Lỗi khi cập nhật Chi tiết đơn hàng với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 4. Xóa một Chi Tiết Đơn Hàng theo mã ==================================
exports.delete = async (req, res, next) => {
  try {
    const service = new ChiTietDonHangService();
    const document = await service.delete(req.params.id);

    if (!document) {
      return next(
        new ApiError(404, "Không tìm thấy Chi tiết đơn hàng cần xóa"),
      );
    }

    return res.send({ message: "Đã xóa Chi tiết đơn hàng thành công" });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa Chi tiết đơn hàng với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Xóa tất cả Chi Tiết Đơn Hàng ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const service = new ChiTietDonHangService();
    const deletedCount = await service.deleteAll();
    return res.send({
      message: `Đã xóa thành công ${deletedCount} Chi tiết đơn hàng khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi trong quá trình dọn dẹp các chi tiết đơn hàng",
      ),
    );
  }
};

// ============================== 6. Tìm một Chi Tiết Đơn Hàng theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const service = new ChiTietDonHangService();
    const document = await service.findById(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Chi tiết đơn hàng"));
    }

    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi truy vấn Chi tiết đơn hàng với mã = ${req.params.id}`,
      ),
    );
  }
};
