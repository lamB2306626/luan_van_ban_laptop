const DiaChiService = require("../services/dia-chi.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo và lưu Địa Chỉ mới ==================================
exports.create = async (req, res, next) => {
  if (!req.body?.id_khach_hang) {
    return next(new ApiError(400, "id_khach_hang không được để trống"));
  }
  if (!req.body?.ten_nguoi_nhan) {
    return next(new ApiError(400, "ten_nguoi_nhan không được để trống"));
  }
  if (!req.body?.sdt_nguoi_nhan) {
    return next(new ApiError(400, "sdt_nguoi_nhan không được để trống"));
  }
  if (!req.body?.dia_chi) {
    return next(new ApiError(400, "dia_chi không được để trống"));
  }

  try {
    const Service = new DiaChiService();
    const document = await Service.create(req.body);
    return res.send({
      message: "Địa chỉ đã được tạo thành công",
      data: document,
    });
  } catch (error) {
    if (error.message === "KHACH_HANG_KHONG_TON_TAI") {
      return next(
        new ApiError(400, "Mã khách hàng không tồn tại trong hệ thống"),
      );
    }

    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình thêm Địa Chỉ mới"),
    );
  }
};

// =================== 2. Lấy danh sách Địa Chỉ kết hợp bộ lọc (Mã, KH, SĐT, Tên) =================
exports.findAll = async (req, res, next) => {
  try {
    const Service = new DiaChiService();

    const filterData = {
      id: req.query.id, // Lọc theo mã địa chỉ (?id=DC01)
      id_khach_hang: req.query.customer_id, // Lọc theo mã khách hàng (?customer_id=KH01)
      ten_nguoi_nhan: req.query.name, // Lọc theo tên người nhận (?name=Nguyen)
      sdt_nguoi_nhan: req.query.phone, // Lọc theo SĐT (?phone=090)
    };

    const documents = await Service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách Địa Chỉ"));
  }
};

// ============================== 3. Cập nhật Địa Chỉ theo mã ==================================
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const Service = new DiaChiService();
    const document = await Service.update(req.params.id, req.body);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Địa chỉ cần cập nhật"));
    }

    return res.send({ message: "Cập nhật Địa chỉ thành công", data: document });
  } catch (error) {
    if (error.message === "KHACH_HANG_KHONG_TON_TAI") {
      return next(
        new ApiError(
          400,
          "Mã khách hàng liên kết không tồn tại trong hệ thống",
        ),
      );
    }

    return next(
      new ApiError(500, `Lỗi khi cập nhật Địa chỉ với mã = ${req.params.id}`),
    );
  }
};

// ============================== 4. Xóa một Địa Chỉ theo mã ==================================
exports.delete = async (req, res, next) => {
  try {
    const Service = new DiaChiService();
    const document = await Service.delete(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Địa chỉ cần xóa"));
    }

    return res.send({ message: "Đã xóa Địa chỉ thành công" });
  } catch (error) {
    if (error.message === "DIA_CHI_DANG_DUOC_SU_DUNG") {
      return next(
        new ApiError(
          400,
          "Không thể xóa Địa chỉ này vì đang liên kết với đơn hàng trong hệ thống!",
        ),
      );
    }

    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa Địa chỉ với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Xóa tất cả Địa Chỉ ==================================
exports.deleteAll = async (req, res, next) => {
  try {
    const Service = new DiaChiService();
    const deletedCount = await Service.deleteAll();
    return res.send({
      message: `Đã xóa thành công ${deletedCount} Địa chỉ khỏi hệ thống`,
    });
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình dọn dẹp các Địa chỉ"),
    );
  }
};

// ============================== 6. Tìm một Địa Chỉ theo id ==================================
exports.findOne = async (req, res, next) => {
  try {
    const Service = new DiaChiService();
    const document = await Service.findById(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Địa chỉ"));
    }

    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(500, `Lỗi khi truy vấn Địa chỉ với mã = ${req.params.id}`),
    );
  }
};
