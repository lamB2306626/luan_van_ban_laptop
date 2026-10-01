const ChiTietGioHangService = require("../services/chi-tiet-gio-hang.service");
const ApiError = require("../api-error");

// ============================== 1. Thêm biến thể vào Chi Tiết Giỏ Hàng ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.id_gio_hang) {
    return next(new ApiError(400, "id_gio_hang không được để trống"));
  }

  if (!req.body?.id_bien_the) {
    return next(new ApiError(400, "id_bien_the không được để trống"));
  }

    if (!req.body?.so_luong) {
      return next(new ApiError(400, "so_luong không được để trống"));
    }

  try {
    const service = new ChiTietGioHangService();
    const document = await service.create(req.body);
    return res.status(201).send({
      message: "Thêm sản phẩm vào giỏ hàng thành công",
      data: document,
    });
  } catch (error) {
    if (error.message === "GIO_HANG_HOAC_BIEN_THE_KHONG_TON_TAI") {
      return next(
        new ApiError(
          404,
          "Giỏ hàng hoặc Biến thể sản phẩm không tồn tại trong hệ thống",
        ),
      );
    }

    if (error.message === "BIEN_THE_DA_CO_TRONG_GIO_HANG") {
      return next(new ApiError(400, "Sản phẩm này đã có trong giỏ hàng rồi"));
    }

    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi trong quá trình thêm sản phẩm vào giỏ hàng",
      ),
    );
  }
};

// =================== 2. Lấy danh sách Chi Tiết Giỏ Hàng theo bộ lọc (id, id_gio_hang, id_bien_the) =================
exports.findAll = async (req, res, next) => {
  try {
    const service = new ChiTietGioHangService();

    const filterData = {
      id: req.query.id, // Lọc theo mã chi tiết (?id=CTGH01)
      id_gio_hang: req.query.id_gio_hang, // Lọc theo giỏ hàng (?id_gio_hang=GH01)
      id_bien_the: req.query.id_bien_the, // Lọc theo biến thể (?id_bien_the=BT01)
      danh_sach_id: req.query.danh_sach_id,
    };

    const documents = await service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách Chi Tiết Giỏ Hàng"),
    );
  }
};

// ============================== 3. Cập nhật Chi Tiết Giỏ Hàng theo mã id ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const service = new ChiTietGioHangService();
    const document = await service.update(req.params.id, req.body);

    if (!document) {
      return next(
        new ApiError(404, "Không tìm thấy Chi Tiết Giỏ Hàng cần cập nhật"),
      );
    }

    return res.send({
      message: "Cập nhật Chi Tiết Giỏ Hàng thành công",
      document,
    });
  } catch (error) {
    if (error.message === "GIO_HANG_HOAC_BIEN_THE_KHONG_TON_TAI") {
      return next(
        new ApiError(
          404,
          "Giỏ hàng hoặc Biến thể sản phẩm cập nhật không tồn tại",
        ),
      );
    }

    return next(
      new ApiError(
        500,
        `Lỗi khi cập nhật Chi Tiết Giỏ Hàng với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 4. Xóa một sản phẩm khỏi Giỏ Hàng theo mã id ==================================
exports.delete = async (req, res, next) => {
  try {
    const service = new ChiTietGioHangService();
    const document = await service.delete(req.params.id);

    if (!document) {
      return next(
        new ApiError(404, "Không tìm thấy Chi Tiết Giỏ Hàng cần xóa"),
      );
    }

    return res.send({ message: "Đã xóa sản phẩm khỏi giỏ hàng thành công" });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa Chi Tiết Giỏ Hàng với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Xóa toàn bộ sản phẩm trong một Giỏ Hàng theo id_gio_hang ==================================
exports.deleteByGioHang = async (req, res, next) => {
  try {
    const service = new ChiTietGioHangService();
    const deletedCount = await service.deleteByGioHangId(req.params.id_Gio_Hang);

    return res.send({
      message: `Đã làm sạch giỏ hàng (${deletedCount} sản phẩm đã xóa)`,
    });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi làm sạch giỏ hàng với mã giỏ = ${req.params.id_Gio_Hang}`,
      ),
    );
  }
};

// ============================== 6. Tìm một Chi Tiết Giỏ Hàng theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const service = new ChiTietGioHangService();
    const document = await service.findById(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Chi Tiết Giỏ Hàng"));
    }

    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi truy vấn Chi Tiết Giỏ Hàng với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== Thêm sản phẩm vào giỏ hàng ==================================
exports.addToCart = async (req, res, next) => {
  const { id_khach_hang, id_bien_the, so_luong } = req.body;

  if (!id_khach_hang || !id_bien_the) {
    return next(new ApiError(400, "id_khach_hang và id_bien_the không được để trống"));
  }

  try {
    const service = new ChiTietGioHangService();
    const result = await service.addToCart({
      id_khach_hang,
      id_bien_the,
      so_luong: so_luong || 1,
    });

    return res.status(200).send({
      message: "Thêm sản phẩm vào giỏ hàng thành công",
      data: result,
    });
  } catch (error) {
    if (error.message === "BIEN_THE_KHONG_TON_TAI") {
      return next(new ApiError(404, "Biến thể sản phẩm không tồn tại"));
    }
    if (error.message === "VUOT_QUA_SO_LUONG_TON_KHO") {
      return next(new ApiError(400, "Số lượng thêm vào vượt quá số lượng tồn kho hiện có"));
    }
    if (error.message === "SO_LUONG_KHONG_HOP_LE") {
      return next(new ApiError(400, "Số lượng không hợp lệ"));
    }

    return next(new ApiError(500, "Đã xảy ra lỗi khi thêm sản phẩm vào giỏ hàng"));
  }
};
