const PhieuNhapService = require("../services/phieu-nhap.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo và lưu Phiếu Nhập mới ==================================
exports.create = async (req, res, next) => {
  // if (!req.body?.id_ncc) {
  //   return next(new ApiError(400, "id_ncc không được để trống"));
  // }

  if (!req.body?.id_nhan_vien) {
    return next(new ApiError(400, "id_nhan_vien không được để trống"));
  }

  try {
    const Service = new PhieuNhapService();
    const document = await Service.create(req.body);
    return res.send({
      message: "Phiếu Nhập đã được tạo thành công",
      data: document,
    });
  } catch (error) {
    if (error.message === "KHOA_NGOAI_KHONG_TON_TAI") {
      return next(
        new ApiError(
          400,
          "Mã nhà cung cấp hoặc mã nhân viên không tồn tại trong hệ thống",
        ),
      );
    }

    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình thêm Phiếu Nhập mới"),
    );
  }
};

// =================== 2. Lấy danh sách Phiếu Nhập kết hợp bộ lọc (Mã, NCC, Nhân viên) =================
exports.findAll = async (req, res, next) => {
  try {
    const Service = new PhieuNhapService();

    const filterData = {
      id: req.query.id, // Lọc theo mã phiếu nhập (?id=PN01)
      // id_ncc: req.query.id_ncc, // Lọc theo mã nhà cung cấp (?id_ncc=NCC01)
      // id_nhan_vien: req.query.id_nhan_vien, // Lọc theo mã nhân viên (?id_nhan_vien=NV01)
      tu_ngay: req.query.tu_ngay,
      den_ngay: req.query.den_ngay,
    };

    const documents = await Service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách Phiếu Nhập"),
    );
  }
};

// ============================== 3. Cập nhật Phiếu Nhập theo mã ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const Service = new PhieuNhapService();
    const document = await Service.update(req.params.id, req.body);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Phiếu Nhập cần cập nhật"));
    }

    return res.send({ message: "Cập nhật Phiếu Nhập thành công", document });
  } catch (error) {
    if (error.message === "KHOA_NGOAI_KHONG_TON_TAI") {
      return next(
        new ApiError(
          400,
          "Mã nhà cung cấp hoặc mã nhân viên không tồn tại trong hệ thống",
        ),
      );
    }

    return next(
      new ApiError(
        500,
        `Lỗi khi cập nhật Phiếu Nhập với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 4. Xóa một Phiếu Nhập theo mã ==================================
exports.delete = async (req, res, next) => {
  try {
    const Service = new PhieuNhapService();
    const document = await Service.delete(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Phiếu Nhập cần xóa"));
    }

    return res.send({ message: "Đã xóa Phiếu Nhập thành công" });
  } catch (error) {
    if (error.message === "PHIEU_NHAP_DANG_CO_CHI_TIET") {
      return next(
        new ApiError(
          400,
          "Không thể xóa Phiếu Nhập này vì đang có Chi tiết phiếu nhập liên kết!",
        ),
      );
    }

    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa Phiếu Nhập với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Xóa tất cả Phiếu Nhập ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const Service = new PhieuNhapService();
    const deletedCount = await Service.deleteAll();
    return res.send({
      message: `Đã xóa thành công ${deletedCount} Phiếu Nhập khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình dọn dẹp các Phiếu Nhập"),
    );
  }
};

// ============================== 6. Tìm một Phiếu Nhập theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const Service = new PhieuNhapService();
    const document = await Service.findById(req.params.id);
    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Phiếu Nhập"));
    }
    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi truy vấn Phiếu Nhập với mã = ${req.params.id}`,
      ),
    );
  }
};
