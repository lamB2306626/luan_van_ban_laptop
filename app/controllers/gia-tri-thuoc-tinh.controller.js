const GiaTriThuocTinhService = require("../services/gia-tri-thuoc-tinh.service");
const ApiError = require("../api-error");

// 1. Tạo Giá Trị Thuộc Tính mới
exports.create = async (req, res, next) => {
  if (!req.body?.id_thuoc_tinh) {
    return next(new ApiError(400, "id_thuoc_tinh không được để trống"));
  }
  if (!req.body?.gia_tri) {
    return next(new ApiError(400, "gia_tri không được để trống"));
  }

  try {
    const service = new GiaTriThuocTinhService();
    const document = await service.create(req.body);
    return res.send({
      message: "Giá trị thuộc tính đã được tạo thành công",
      data: document,
    });
  } catch (error) {
    if (error.message === "ID_THUOC_TINH_KHONG_TON_TAI") {
      return next(
        new ApiError(
          404,
          "Mã thuộc tính (id_thuoc_tinh) truyền vào không tồn tại trong hệ thống",
        ),
      );
    }
    if (error.message === "GIA_TRI_THUOC_TINH_DA_TON_TAI") {
      return next(
        new ApiError(
          400,
          "Giá trị thuộc tính này đã tồn tại cho thuộc tính tương ứng",
        ),
      );
    }
    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi trong quá trình thêm Giá trị thuộc tính mới",
      ),
    );
  }
};

// 2. Lấy danh sách Giá Trị Thuộc Tính (hỗ trợ lọc theo id, id_thuoc_tinh, gia_tri)
exports.findAll = async (req, res, next) => {
  try {
    const service = new GiaTriThuocTinhService();
    const filterData = {
      id: req.query.id,
      id_thuoc_tinh: req.query.id_thuoc_tinh,
      gia_tri: req.query.gia_tri,
    };

    const documents = await service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách Giá trị thuộc tính"),
    );
  }
};

// 3. Tìm một Giá Trị Thuộc Tính theo ID
exports.findOne = async (req, res, next) => {
  try {
    const service = new GiaTriThuocTinhService();
    const document = await service.findById(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Giá trị thuộc tính"));
    }
    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi lấy Giá trị thuộc tính với id=${req.params.id}`,
      ),
    );
  }
};

// 4. Cập nhật Giá Trị Thuộc Tính
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const service = new GiaTriThuocTinhService();
    const document = await service.update(req.params.id, req.body);

    if (!document) {
      return next(
        new ApiError(404, "Không tìm thấy Giá trị thuộc tính cần cập nhật"),
      );
    }

    return res.send({
      message: "Cập nhật Giá trị thuộc tính thành công",
      data: document,
    });
  } catch (error) {
    if (error.message === "ID_THUOC_TINH_KHONG_TON_TAI") {
      return next(
        new ApiError(
          404,
          "Mã thuộc tính (id_thuoc_tinh) mới không tồn tại trong hệ thống",
        ),
      );
    }
    if (error.message === "GIA_TRI_THUOC_TINH_DA_TON_TAI") {
      return next(
        new ApiError(400, "Giá trị thuộc tính này bị trùng lặp dữ liệu"),
      );
    }
    return next(
      new ApiError(
        500,
        `Lỗi khi cập nhật Giá trị thuộc tính với id=${req.params.id}`,
      ),
    );
  }
};

// ============================== Xóa một Giá Trị Thuộc Tính theo ID ==============================
exports.delete = async (req, res, next) => {
  try {
    const Service = new GiaTriThuocTinhService();
    const document = await Service.delete(req.params.id);

    if (!document) {
      return next(
        new ApiError(404, "Không tìm thấy Giá trị thuộc tính cần xóa"),
      );
    }

    return res.send({ message: "Đã xóa Giá trị thuộc tính thành công" });
  } catch (error) {
    if (error.message === "GIA_TRI_THUOC_TINH_DANG_DUOC_SU_DUNG") {
      return next(
        new ApiError(
          400,
          "Không thể xóa Giá trị thuộc tính này vì đang có Biến thể sản phẩm sử dụng!",
        ),
      );
    }

    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa Giá trị thuộc tính với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== Xóa tất cả Giá Trị Thuộc Tính rỗng ==============================
exports.deleteAll = async (req, res, next) => {
  try {
    const Service = new GiaTriThuocTinhService();
    const deletedCount = await Service.deleteAll();
    return res.send({
      message: `Đã xóa thành công ${deletedCount} Giá trị thuộc tính trống (chưa liên kết với biến thể nào) khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi trong quá trình dọn dẹp các Giá trị thuộc tính",
      ),
    );
  }
};
