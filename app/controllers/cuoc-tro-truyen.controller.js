const CuocTroTruyenService = require("../services/cuoc-tro-truyen.service");
const ApiError = require("../api-error");

// ============================== 1. Tạo và lưu cuộc trò truyện mới ==================================
exports.create = async (req, res, next) => {
  try {
    const { id_khach_hang, id_san_pham, id_don_hang, tieu_de } = req.body;

    const Service = new CuocTroTruyenService();
    const result = await Service.create({
      id_khach_hang,
      id_san_pham,
      id_don_hang,
      tieu_de,
    });
    return res.send({
      message: "Cuộc trò truyện đã được tạo thành công",
      data: result,
    });
  } catch (error) {
    console.error("LỖI NÀY LÀ: ", error);
    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi trong quá trình thêm cuộc trò truyện mới",
      ),
    );
  }
};
