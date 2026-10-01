const SanPhamService = require("../services/san-pham.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo và lưu Sản Phẩm mới ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.ten_san_pham) {
    return next(new ApiError(400, "ten_san_pham không được để trống"));
  }
  if (!req.body?.id_thuong_hieu) {
    return next(new ApiError(400, "id_thuong_hieu không được để trống"));
  }
  if (!req.body?.id_danh_muc) {
    return next(new ApiError(400, "id_danh_muc không được để trống"));
  }
  if (!req.body?.id_nha_cc) {
    return next(new ApiError(400, "id_ncc không được để trống"));
  }

  try {
    const Service = new SanPhamService();

    // Lấy danh sách các file được tải lên
    const files = req.files || [];
    const document = await Service.create(req.body, files);

    return res.send({
      message: "Sản phẩm đã được tạo thành công",
      data: document,
    });
  } catch (error) {
    console.error("Lỗi Checkout Chi Tiết:", error);

    if (error.message === "TEN_SAN_PHAM_DA_TON_TAI") {
      return next(
        new ApiError(400, "Tên sản phẩm này đã tồn tại trong hệ thống"),
      );
    }
    if (error.message === "ID_THUONG_HIEU_KHONG_TON_TAI") {
      return next(new ApiError(404, "Mã thương hiệu truyền vào không tồn tại"));
    }
    if (error.message === "ID_DANH_MUC_KHONG_TON_TAI") {
      return next(new ApiError(404, "Mã danh mục truyền vào không tồn tại"));
    }
    if (error.message === "ID_NHA_CUNG_CAP_KHONG_TON_TAI") {
      return next(
        new ApiError(404, "Mã nhà cung cấp truyền vào không tồn tại"),
      );
    }
    if (error.message === "ID_SAN_PHAM_KHONG_TON_TAI") {
      return next(
        new ApiError(400, "Sản phẩm này không tồn tại trong hệ thống"),
      );
    }

    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình thêm Sản Phẩm mới"),
    );
  }
};

// =================== Lấy danh sách Sản Phẩm kết hợp bộ lọc (Tên, Danh mục, Thương hiệu & Biến thể) =================
exports.findAll = async (req, res, next) => {
  try {
    const Service = new SanPhamService();

    const filterData = {
      // 1. Bộ lọc cơ bản của sản phẩm
      id: req.query.id, // (?id=SP01)
      ten_san_pham: req.query.name || req.query.ten_san_pham, // (?name=MacBook)
      id_thuong_hieu: req.query.id_thuong_hieu, // (?id_thuong_hieu=TH01)
      id_danh_muc: req.query.id_danh_muc, // (?id_danh_muc=DM01)
      id_nha_cc: req.query.id_nha_cc, // (?id_nha_cc=NCC01)
      trang_thai:
        req.query.trang_thai !== undefined
          ? req.query.trang_thai === "true"
          : undefined,

      // 2. Bộ lọc cấu hình biến thể bổ sung
      id_cpu: req.query.id_cpu, // (?id_cpu=CPU01 hoặc mảng)
      id_gpu: req.query.id_gpu, // (?id_gpu=GPU01)
      id_ram: req.query.id_ram, // (?id_ram=RAM01)
      id_rom: req.query.id_rom, // (?id_rom=ROM01)
      id_mau_sac: req.query.id_mau_sac, // (?id_mau_sac=MS01)

      // 3. Bộ lọc khoảng giá
      min_price: req.query.gia_tu, // (?min_price=10000000)
      max_price: req.query.gia_den, // (?max_price=30000000)
    };

    const documents = await Service.find(filterData);
    return res.send(documents);
  } catch (error) {
    console.error("Lỗi Checkout Chi Tiết:", error);
    return next(new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách Sản Phẩm"));
  }
};

// ============================== 3. Cập nhật Sản Phẩm theo mã ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const Service = new SanPhamService();
    // Lấy danh sách các file được tải lên
    const files = req.files || [];
    const document = await Service.update(req.params.id, req.body, files);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Sản phẩm cần cập nhật"));
    }

    return res.send({ message: "Cập nhật Sản phẩm thành công", document });
  } catch (error) {
    if (error.message === "TEN_SAN_PHAM_DA_TON_TAI") {
      return next(
        new ApiError(400, "Tên sản phẩm này đã tồn tại trong hệ thống"),
      );
    }
    if (error.message === "ID_THUONG_HIEU_KHONG_TON_TAI") {
      return next(new ApiError(404, "Mã thương hiệu mới không tồn tại"));
    }
    if (error.message === "ID_DANH_MUC_KHONG_TON_TAI") {
      return next(new ApiError(404, "Mã danh mục mới không tồn tại"));
    }
    if (error.message === "ID_NHA_CUNG_CAP_KHONG_TON_TAI") {
      return next(
        new ApiError(404, "Mã nhà cung cấp truyền vào không tồn tại"),
      );
    }
    if (error.message === "ID_SAN_PHAM_KHONG_TON_TAI") {
      return next(
        new ApiError(400, "Sản phẩm này không tồn tại trong hệ thống"),
      );
    }

    return next(
      new ApiError(500, `Lỗi khi cập nhật Sản phẩm với mã = ${req.params.id}`),
    );
  }
};

// ============================== 4. Xóa (khóa) một Sản Phẩm theo mã ==================================
exports.delete = async (req, res, next) => {
  try {
    const Service = new SanPhamService();
    const document = await Service.delete(req.params.id);
    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Sản phẩm cần xóa"));
    }
    return res.send({ message: "Đã xóa Sản phẩm thành công" });
  } catch (error) {
    return next(
      new ApiError(
        400,
        error.message || `Không thể xóa Sản phẩm với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Khôi phục Sản Phẩm theo mã ==================================
exports.restore = async (req, res, next) => {
  try {
    const service = new SanPhamService();
    const document = await service.restore(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Sản phẩm cần khôi phục"));
    }

    return res.send({
      message: "Đã khôi phục Sản phẩm và các biến thể liên quan thành công",
      data: document,
    });
  } catch (error) {
    return next(
      new ApiError(500, `Lỗi khi khôi phục Sản phẩm với mã = ${req.params.id}`),
    );
  }
};

// ============================== 6. Xóa (khóa) tất cả Sản Phẩm ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const Service = new SanPhamService();
    const deletedCount = await Service.deleteAll();
    return res.send({
      message: `Đã xóa sạch thành công ${deletedCount} Sản phẩm khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(
        400,
        error.message || "Đã xảy ra lỗi khi xóa toàn bộ sản phẩm",
      ),
    );
  }
};

// ============================== 7. Tìm một Sản Phẩm theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const Service = new SanPhamService();
    const document = await Service.findById(req.params.id);
    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Sản phẩm"));
    }
    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(500, `Lỗi khi truy vấn Sản phẩm với mã = ${req.params.id}`),
    );
  }
};
