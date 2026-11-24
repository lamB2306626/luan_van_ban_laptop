const NhaCungCapSanPhamService = require("../services/nha-cung-cap-san-pham.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo/Liên kết Nhà Cung Cấp - Sản Phẩm ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.id_san_pham) {
    return next(new ApiError(400, "id_san_pham không được để trống"));
  }

  const hasSingleNCC = !!req.body?.id_nha_cc;
  const hasMultipleNCC =
    Array.isArray(req.body?.danh_sach_nha_cung_cap) &&
    req.body.danh_sach_nha_cung_cap.length > 0;

  if (!hasSingleNCC && !hasMultipleNCC) {
    return next(
      new ApiError(
        400,
        "Vui lòng cung cấp id_nha_cc hoặc danh_sach_nha_cung_cap",
      ),
    );
  }

  try {
    const service = new NhaCungCapSanPhamService();
    const result = await service.create(req.body);

    let message = "Tạo liên kết nhà cung cấp - sản phẩm thành công";
    if (result && result.totalCreated !== undefined) {
      message = `Đã liên kết thành công ${result.totalCreated} nhà cung cấp cho sản phẩm`;
    }

    return res.status(201).send({
      message: message,
      data: result,
    });
  } catch (error) {
    if (error.message === "TAT_CA_LIEN_KET_DA_TON_TAI_TRUOC_DO") {
      return next(
        new ApiError(
          400,
          "Tất cả nhà cung cấp trong danh sách đã được liên kết với sản phẩm này rồi",
        ),
      );
    }
    if (error.message === "NHA_CUNG_CAP_HOAC_SAN_PHAM_KHONG_TON_TAI") {
      return next(
        new ApiError(404, "Nhà cung cấp hoặc Sản phẩm không tồn tại"),
      );
    }
    if (error.message === "SAN_PHAM_DA_CO_NHA_CUNG_CAP_NAY") {
      return next(
        new ApiError(
          409,
          "Sản phẩm này đã được liên kết với nhà cung cấp này trước đó",
        ),
      );
    }
    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi khi tạo liên kết nhà cung cấp - sản phẩm",
      ),
    );
  }
};

// =================== 2. Lấy danh sách (Bộ lọc query) =================
exports.findAll = async (req, res, next) => {
  try {
    const service = new NhaCungCapSanPhamService();
    const filterData = {
      id: req.query.id,
      id_nha_cc: req.query.id_nha_cc,
      id_san_pham: req.query.id_san_pham,
    };

    const documents = await service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách liên kết"));
  }
};

// ============================== 3. Tìm một bản ghi theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const service = new NhaCungCapSanPhamService();
    // Nếu id của bạn là kiểu số nguyên (Int), nhớ ép kiểu: parseInt(req.params.id)
    const document = await service.findById(req.params.id);

    if (!document) {
      return next(
        new ApiError(404, "Không tìm thấy liên kết nhà cung cấp - sản phẩm"),
      );
    }

    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(500, `Lỗi khi truy vấn liên kết với mã = ${req.params.id}`),
    );
  }
};

// ============================== 4. Cập nhật theo id ==================================
exports.update = async (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return next(
      new ApiError(
        400,
        "Dữ liệu cập nhật không được để trống không được để trống",
      ),
    );
  }

  try {
    const service = new NhaCungCapSanPhamService();
    const document = await service.update(req.params.id, req.body);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy liên kết cần cập nhật"));
    }

    return res.send({
      message: "Cập nhật liên kết thành công",
      data: document,
    });
  } catch (error) {
    if (error.message === "NHA_CUNG_CAP_HOAC_SAN_PHAM_KHONG_TON_TAI") {
      return next(
        new ApiError(404, "Nhà cung cấp hoặc Sản phẩm liên kết không tồn tại"),
      );
    }
    if (error.message === "SAN_PHAM_DA_CO_NHA_CUNG_CAP_NAY") {
      return next(new ApiError(409, "Sản phẩm này đã có nhà cung cấp này rồi"));
    }
    return next(
      new ApiError(500, `Lỗi khi cập nhật liên kết với mã = ${req.params.id}`),
    );
  }
};

// ============================== 5. Xóa theo id ==================================
exports.delete = async (req, res, next) => {
  try {
    const service = new NhaCungCapSanPhamService();
    const document = await service.delete(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy liên kết cần xóa"));
    }

    return res.send({
      message: "Đã xóa liên kết nhà cung cấp - sản phẩm thành công",
    });
  } catch (error) {
    return next(
      new ApiError(500, `Lỗi khi xóa liên kết với mã = ${req.params.id}`),
    );
  }
};

// ============================== 6. Xóa tất cả ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const service = new NhaCungCapSanPhamService();
    const deletedCount = await service.deleteAll();
    return res.send({
      message: `Đã xóa thành công ${deletedCount} bản ghi liên kết`,
    });
  } catch (error) {
    return next(new ApiError(500, "Đã xảy ra lỗi khi xóa tất cả liên kết"));
  }
};
