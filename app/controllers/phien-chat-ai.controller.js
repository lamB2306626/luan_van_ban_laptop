const PhienChatAIService = require("../services/phien-chat-ai.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo Phiên Chat mới ==================================
exports.create = async (req, res, next) => {
  try {
    const Service = new PhienChatAIService();
    // req.body có thể truyền { id_khach_hang, tieu_de } hoặc để trống {} nếu là khách vãng lai
    const document = await Service.create(req.body || {});
    return res.send({
      message: "Phiên chat đã được tạo thành công",
      data: document,
    });
  } catch (error) {
    if (error.message === "KHACH_HANG_KHONG_TON_TAI") {
      return next(
        new ApiError(400, "Mã khách hàng không tồn tại trong hệ thống"),
      );
    }

    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình tạo Phiên chat mới"),
    );
  }
};

// =================== 2. Lấy danh sách Phiên Chat kết hợp bộ lọc (Mã phiên, Mã khách hàng) =================
exports.findAll = async (req, res, next) => {
  try {
    const Service = new PhienChatAIService();

    const filterData = {
      id: req.query.id, // Lọc theo mã phiên (?id=PC000001)
      id_khach_hang: req.query.id_khach_hang, // Lọc theo khách hàng (?id_khach_hang=KH01)
    };

    const documents = await Service.find(filterData);
    return res.send(documents);
  } catch (error) {
    return next(
      new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách Phiên chat"),
    );
  }
};

// ============================== 3. Cập nhật Phiên Chat theo mã (Đổi tiêu đề) ==================================
exports.update = async (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
  }

  try {
    const Service = new PhienChatAIService();
    const document = await Service.update(req.params.id, req.body);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Phiên chat cần cập nhật"));
    }

    return res.send({
      message: "Cập nhật Phiên chat thành công",
      data: document,
    });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi cập nhật Phiên chat với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 4. Xóa một Phiên Chat theo mã ==================================
exports.delete = async (req, res, next) => {
  try {
    const Service = new PhienChatAIService();
    const document = await Service.delete(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Phiên chat cần xóa"));
    }

    return res.send({ message: "Đã xóa Phiên chat thành công" });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa Phiên chat với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Tìm chi tiết một Phiên Chat kèm toàn bộ tin nhắn ==================================
exports.findOne = async (req, res, next) => {
  try {
    const Service = new PhienChatAIService();
    const document = await Service.findById(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy Phiên chat"));
    }

    return res.send(document);
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Lỗi khi truy vấn Phiên chat với mã = ${req.params.id}`,
      ),
    );
  }
};
