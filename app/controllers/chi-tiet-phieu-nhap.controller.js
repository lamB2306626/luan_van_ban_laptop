const ChiTietPhieuNhapService = require("../services/chi-tiet-phieu-nhap.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo và lưu Chi Tiết Phiếu Nhập mới ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.id_phieu_nhap) {
    return next(new ApiError(400, "id_phieu_nhap không được để trống"));
  }

  if (!req.body?.id_bien_the) {
    return next(new ApiError(400, "id_bien_the không được để trống"));
  }

  if (
    req.body?.so_luong_nhap === undefined ||
    req.body?.so_luong_nhap === null
  ) {
    return next(new ApiError(400, "so_luong_nhap không được để trống"));
  }

  if (req.body?.gia_nhap === undefined || req.body?.gia_nhap === null) {
    return next(new ApiError(400, "gia_nhap không được để trống"));
  }

  try {
    const Service = new ChiTietPhieuNhapService();
    const document = await Service.create(req.body);
    return res.send({
      message: "Chi Tiết Phiếu Nhập đã được tạo thành công",
      data: document,
    });
  } catch (error) {
    if (error.message === "KHOA_NGOAI_KHONG_TON_TAI") {
      return next(
        new ApiError(
          400,
          "Mã phiếu nhập hoặc mã biến thể không tồn tại trong hệ thống",
        ),
      );
    }

    if (error.message === "BIEN_THE_DA_TON_TAI_TRONG_PHIEU_NHAP") {
      return next(
        new ApiError(
          400,
          "Biến thể sản phẩm này đã tồn tại trong phiếu nhập. Vui lòng chỉnh sửa dòng hiện có!",
        ),
      );
    }

    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi trong quá trình thêm Chi Tiết Phiếu Nhập mới",
      ),
    );
  }
};

// =================== 2. Lấy danh sách Chi Tiết Phiếu Nhập kết hợp bộ lọc =================
exports.findAll = async (req, res, next) => {
  try {
    const Service = new ChiTietPhieuNhapService();

    const filterData = {
      id: req.query.id, // Lọc theo mã chi tiết (?id=CTPN01)
      id_phieu_nhap: req.query.id_phieu_nhap, // Lọc theo mã phiếu nhập (?id_phieu_nhap=PN01)
    };

    const documents = await Service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách Chi Tiết Phiếu Nhập"),
    );
  }
};

// ============================== 3. Cập nhật Chi Tiết Phiếu Nhập theo mã ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const Service = new ChiTietPhieuNhapService();
    const document = await Service.update(req.params.id, req.body);

    if (!document) {
      return next(
        new ApiError(404, "Không tìm thấy Chi Tiết Phiếu Nhập cần cập nhật"),
      );
    }

    return res.send({
      message: "Cập nhật Chi Tiết Phiếu Nhập thành công",
      document,
    });
  } catch (error) {
    if (error.message === "KHOA_NGOAI_KHONG_TON_TAI") {
      return next(
        new ApiError(
          400,
          "Mã phiếu nhập hoặc mã biến thể không tồn tại trong hệ thống",
        ),
      );
    }

    return next(
      new ApiError(
        500,
        `Lỗi khi cập nhật Chi Tiết Phiếu Nhập với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 4. Xóa một Chi Tiết Phiếu Nhập theo mã ==================================
exports.delete = async (req, res, next) => {
  try {
    const Service = new ChiTietPhieuNhapService();
    const document = await Service.delete(req.params.id);

    if (!document) {
      return next(
        new ApiError(404, "Không tìm thấy Chi Tiết Phiếu Nhập cần xóa"),
      );
    }

    return res.send({ message: "Đã xóa Chi Tiết Phiếu Nhập thành công" });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa Chi Tiết Phiếu Nhập với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Xóa tất cả Chi Tiết Phiếu Nhập ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const Service = new ChiTietPhieuNhapService();
    const deletedCount = await Service.deleteAll();
    return res.send({
      message: `Đã xóa thành công ${deletedCount} Chi Tiết Phiếu Nhập khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi trong quá trình dọn dẹp các Chi Tiết Phiếu Nhập",
      ),
    );
  }
};

// ============================== 6. Tìm một Chi Tiết Phiếu Nhập theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const Service = new ChiTietPhieuNhapService();
    const document = await Service.findById(req.params.id);
    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Chi Tiết Phiếu Nhập"));
    }
    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi truy vấn Chi Tiết Phiếu Nhập với mã = ${req.params.id}`,
      ),
    );
  }
};
