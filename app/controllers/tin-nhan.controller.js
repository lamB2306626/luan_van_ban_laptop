const TinNhanService = require("../services/tin-nhan.service");
const ApiError = require("../api-error");

// =================== 1. Khách hàng gửi tin nhắn (Tạo hoặc Mở lại cuộc trò chuyện) ===================
exports.guiTinNhanKhachHang = async (req, res, next) => {
  const { id_khach_hang, noi_dung } = req.body;

  if (!id_khach_hang || !noi_dung) {
    return next(
      new ApiError(
        400,
        "Mã khách hàng và nội dung tin nhắn không được để trống",
      ),
    );
  }

  try {
    const io = req.app.get("io");
    const Service = new TinNhanService();
    const result = await Service.guiTinNhanKhachHang(req.body, io);

    return res.send({
      message: "Gửi tin nhắn thành công",
      data: result,
    });
  } catch (error) {
    console.error(error);
    return next(
      new ApiError(500, "Đã xảy ra lỗi khi gửi tin nhắn từ khách hàng"),
    );
  }
};

// ========================== 2. Nhân viên / Admin gửi tin nhắn trả lời ==========================
exports.guiTinNhanNhanVien = async (req, res, next) => {
  const { id_cuoc_tro_truyen, id_nhan_vien, noi_dung } = req.body;

  if (!id_cuoc_tro_truyen || !id_nhan_vien || !noi_dung) {
    return next(
      new ApiError(
        400,
        "Mã cuộc trò chuyện, mã nhân viên và nội dung tin nhắn không được để trống",
      ),
    );
  }

  try {
    const io = req.app.get("io");
    const Service = new TinNhanService();
    const document = await Service.guiTinNhanNhanVien(req.body, io);

    if (!document) {
      return next(
        new ApiError(404, "Không tìm thấy cuộc trò chuyện để trả lời"),
      );
    }

    return res.send({
      message: "Trả lời tin nhắn thành công",
      data: document,
    });
  } catch (error) {
    console.error("LỖI LÀ: ", error);
    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi trong quá trình nhân viên trả lời tin nhắn",
      ),
    );
  }
};
