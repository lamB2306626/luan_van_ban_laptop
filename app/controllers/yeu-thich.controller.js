const YeuThichService = require("../services/yeu-thich.service");
const ApiError = require("../api-error");

// ============================== 1. Thêm Sản phẩm vào Yêu Thích ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.id_san_pham) {
    return next(new ApiError(400, "id_san_pham không được để trống"));
  }

  if (!req.body?.id_khach_hang) {
    return next(new ApiError(400, "id_khach_hang không được để trống"));
  }

  try {
    const service = new YeuThichService();
    const document = await service.create(req.body);
    return res.status(201).send({
      message: "Đã thêm sản phẩm vào danh sách yêu thích thành công",
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

    if (error.message === "SAN_PHAM_DA_CO_TRONG_DANH_SACH_YEU_THICH") {
      return next(
        new ApiError(
          400,
          "Sản phẩm này đã có trong danh sách yêu thích của khách hàng",
        ),
      );
    }

    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi khi thêm sản phẩm vào danh sách yêu thích",
      ),
    );
  }
};

// =================== 2. Lấy danh sách Yêu Thích kết hợp bộ lọc (id, id_khach_hang, id_san_pham) =================
exports.findAll = async (req, res, next) => {
  try {
    const service = new YeuThichService();

    const filterData = {
      id: req.query.id, // Lọc theo mã yêu thích (?id=YT01)
      id_khach_hang: req.query.id_khach_hang, // Lọc sản phẩm yêu thích của 1 khách hàng (?id_khach_hang=KH01)
      id_san_pham: req.query.id_san_pham, // Lọc khách hàng đã thích 1 sản phẩm (?id_san_pham=SP01)
    };

    const documents = await service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách sản phẩm yêu thích"),
    );
  }
};

// ============================== 3. Tìm một bản ghi Yêu Thích theo mã id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const service = new YeuThichService();
    const document = await service.findById(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy bản ghi yêu thích"));
    }

    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi truy vấn bản ghi yêu thích với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 4. Xóa một bản ghi Yêu Thích theo mã id ==================================
exports.delete = async (req, res, next) => {
  try {
    const service = new YeuThichService();
    const document = await service.delete(req.params.id);

    if (!document) {
      return next(
        new ApiError(404, "Không tìm thấy bản ghi yêu thích cần xóa"),
      );
    }

    return res.send({
      message: "Đã xóa sản phẩm khỏi danh sách yêu thích thành công",
    });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa bản ghi yêu thích với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Bỏ thích sản phẩm theo Cặp (id_khach_hang & id_san_pham) ==================================
exports.deleteByCustomerAndProduct = async (req, res, next) => {
  const { id_khach_hang, id_san_pham } = req.params;

  if (!id_khach_hang || !id_san_pham) {
    return next(
      new ApiError(
        400,
        "Vui lòng cung cấp đầy đủ id_khach_hang và id_san_pham",
      ),
    );
  }

  try {
    const service = new YeuThichService();
    const document = await service.deleteByCustomerAndProduct(
      id_khach_hang,
      id_san_pham,
    );

    if (!document) {
      return next(
        new ApiError(
          404,
          "Sản phẩm này chưa từng được lưu trong danh sách yêu thích của khách hàng",
        ),
      );
    }

    return res.send({ message: "Đã bỏ yêu thích sản phẩm thành công" });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi bỏ yêu thích sản phẩm ${id_san_pham} của khách hàng ${id_khach_hang}`,
      ),
    );
  }
};

// ============================== 6. Xóa tất cả các bản ghi Yêu Thích ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const service = new YeuThichService();
    const deletedCount = await service.deleteAll();
    return res.send({
      message: `Đã xóa thành công ${deletedCount} bản ghi yêu thích khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi trong quá trình dọn dẹp danh sách yêu thích",
      ),
    );
  }
};
