const LichSuTroTruyenService = require("../services/lich-su-tro-truyen.service");
const ApiError = require("../api-error");

// =================== 1. Lấy danh sách cuộc trò chuyện dành cho Admin (Bộ lọc: trạng thái, tiêu đề) ===================
exports.findAll = async (req, res, next) => {
  try {
    const Service = new LichSuTroTruyenService();

    const filterData = {
      id_khach_hang: req.query.id_khach_hang,
      tieu_de: req.query.tieu_de, // Lọc theo tiêu đề (?tieu_de=Dell)
    };

    const documents = await Service.find(filterData);
    return res.send(documents);
  } catch (error) {
    console.error(error);
    return next(
      new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách cuộc trò chuyện"),
    );
  }
};

// ================== 2. Lấy toàn bộ chi tiết tin nhắn trong cuộc trò chuyện theo id khách hàng ==================
exports.findByKhachHang = async (req, res, next) => {
  try {
    const Service = new LichSuTroTruyenService();
    const document = await Service.findByKhachHang(req.params.id_khach_hang);

    if (!document) {
      return null;
    }

    return res.send(document);
  } catch (error) {
    console.error("LỖI: ", error);
    return next(
      new ApiError(
        500,
        `Lỗi khi lấy chi tiết tin nhắn của cuộc trò chuyện mã = ${req.params.id_khach_hang}`,
      ),
    );
  }
};

// ================== 3. Lấy toàn bộ chi tiết tin nhắn trong cuộc trò chuyện theo ID ==================
exports.findOne = async (req, res, next) => {
  try {
    const Service = new LichSuTroTruyenService();
    const document = await Service.findById(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy cuộc trò chuyện"));
    }

    return res.send(document);
  } catch (error) {
    console.error("LỖI: ", error);
    return next(
      new ApiError(
        500,
        `Lỗi khi lấy chi tiết tin nhắn của cuộc trò chuyện mã = ${req.params.id}`,
      ),
    );
  }
};

// ======================= 4. Đánh dấu tất cả tin nhắn là Đã Đọc =======================
exports.markAsRead = async (req, res, next) => {
  const io = req.app.get("io");
  const { readerRole } = req.body;
  try {
    const Service = new LichSuTroTruyenService();
    const result = await Service.markAsRead(req.params.id, readerRole, io);

    return res.send({
      message: "Đã đánh dấu các tin nhắn thành đã đọc",
      count: result.count,
    });
  } catch (error) {
    console.error("LỖI NÈ: ", error);
    return next(
      new ApiError(
        500,
        `Lỗi khi đánh dấu đã đọc cho cuộc trò chuyện với mã = ${req.params.id}`,
      ),
    );
  }
};

// ============================== 5. Xóa một cuộc trò chuyện theo mã ==============================
exports.delete = async (req, res, next) => {
  try {
    const Service = new LichSuTroTruyenService();
    const document = await Service.delete(req.params.id);

    if (!document) {
      return next(new ApiError(404, "Không tìm thấy cuộc trò chuyện cần xóa"));
    }

    return res.send({ message: "Đã xóa cuộc trò chuyện thành công" });
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Đã xảy ra lỗi khi xóa cuộc trò chuyện với mã = ${req.params.id}`,
      ),
    );
  }
};

// =================== 6. Lấy thống kê số tin nhắn chưa đọc theo từng lịch sử trò chuyện  ===================
exports.getUnreadSummary = async (req, res, next) => {
  try {
    const Service = new LichSuTroTruyenService();
    const documents = await Service.getUnreadSummary();
    return res.send(documents);
  } catch (error) {
    console.error(error);
    return next(
      new ApiError(500, "Đã xảy ra lỗi khi thống kê số tin nhắn chưa đọc"),
    );
  }
};

// ================== 7. Lấy số tin nhắn chưa đọc của 1 khách hàng theo id khách hàng ==================
exports.getUnreadByKhachHang = async (req, res, next) => {
  try {
    const Service = new LichSuTroTruyenService();
    const document = await Service.getUnreadByKhachHang(
      req.params.id_khach_hang,
    );

    if (!document) {
      return null;
    }

    return res.send(document);
  } catch (error) {
    console.error("LỖI: ", error);
    return next(
      new ApiError(
        500,
        `Lỗi khi lấy số tin nhắn chưa đọc cho id_khach_hang = ${req.params.id_khach_hang}`,
      ),
    );
  }
};
