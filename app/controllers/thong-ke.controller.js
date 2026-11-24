const ThongKeService = require("../services/thong-ke.service");
const ApiError = require("../api-error");

// =================== 1. Thống kê Doanh thu & Lợi nhuận gộp (Tài chính) =================
exports.getDoanhThuLoiNhuan = async (req, res, next) => {
  try {
    const { tu_ngay, den_ngay, loai_thoi_gian } = req.query;

    // Kiểm tra định dạng ngày nếu client có truyền lên
    if (tu_ngay && isNaN(Date.parse(tu_ngay))) {
      return next(new ApiError(400, "Định dạng tu_ngay không hợp lệ"));
    }

    if (den_ngay && isNaN(Date.parse(den_ngay))) {
      return next(new ApiError(400, "Định dạng den_ngay không hợp lệ"));
    }

    if (tu_ngay && den_ngay && new Date(tu_ngay) > new Date(den_ngay)) {
      return next(
        new ApiError(
          400,
          "Ngày bắt đầu (tu_ngay) không được lớn hơn ngày kết thúc (den_ngay)",
        ),
      );
    }

    // Kiểm tra loại gom nhóm thời gian hợp lệ
    const validGroupBy = ["day", "month", "year"];
    if (loai_thoi_gian && !validGroupBy.includes(loai_thoi_gian)) {
      return next(
        new ApiError(
          400,
          "loai_thoi_gian chỉ chấp nhận các giá trị: day, month, year",
        ),
      );
    }

    const Service = new ThongKeService();
    const filterData = {
      tu_ngay,
      den_ngay,
      loai_thoi_gian,
    };

    const result = await Service.thongKeDoanhThuLoiNhuan(filterData);
    return res.send(result);
  } catch (error) {
    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi khi lấy thống kê doanh thu và lợi nhuận",
      ),
    );
  }
};

// =================== 2. Thống kê Tình trạng & Hiệu suất xử lý Đơn hàng =================
exports.getThongKeDonHang = async (req, res, next) => {
  try {
    const { tu_ngay, den_ngay } = req.query;

    if (tu_ngay && isNaN(Date.parse(tu_ngay))) {
      return next(new ApiError(400, "Định dạng tu_ngay không hợp lệ"));
    }

    if (den_ngay && isNaN(Date.parse(den_ngay))) {
      return next(new ApiError(400, "Định dạng den_ngay không hợp lệ"));
    }

    if (tu_ngay && den_ngay && new Date(tu_ngay) > new Date(den_ngay)) {
      return next(
        new ApiError(
          400,
          "Ngày bắt đầu (tu_ngay) không được lớn hơn ngày kết thúc (den_ngay)",
        ),
      );
    }

    const Service = new ThongKeService();
    const filterData = {
      tu_ngay,
      den_ngay,
    };

    const result = await Service.thongKeDonHang(filterData);
    return res.send(result);
  } catch (error) {
    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi khi lấy thống kê tình trạng và hiệu suất đơn hàng",
      ),
    );
  }
};

// =================== 3. Thống kê Top Sản phẩm & Cấu hình bán chạy =================
exports.getThongKeSanPhamCauHinh = async (req, res, next) => {
  try {
    const { tu_ngay, den_ngay, limit } = req.query;

    if (tu_ngay && isNaN(Date.parse(tu_ngay))) {
      return next(new ApiError(400, "Định dạng tu_ngay không hợp lệ"));
    }

    if (den_ngay && isNaN(Date.parse(den_ngay))) {
      return next(new ApiError(400, "Định dạng den_ngay không hợp lệ"));
    }

    if (tu_ngay && den_ngay && new Date(tu_ngay) > new Date(den_ngay)) {
      return next(
        new ApiError(
          400,
          "Ngày bắt đầu (tu_ngay) không được lớn hơn ngày kết thúc (den_ngay)",
        ),
      );
    }

    if (limit && (isNaN(parseInt(limit, 10)) || parseInt(limit, 10) <= 0)) {
      return next(new ApiError(400, "Tham số limit phải là số nguyên dương"));
    }

    const Service = new ThongKeService();
    const filterData = {
      tu_ngay,
      den_ngay,
      limit,
    };

    const result = await Service.thongKeSanPhamCauHinh(filterData);
    return res.send(result);
  } catch (error) {
    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi khi lấy thống kê sản phẩm và cấu hình bán chạy",
      ),
    );
  }
};

// =================== 4. Thống kê Tồn kho & Cảnh báo nhập hàng =================
exports.getThongKeTonKho = async (req, res, next) => {
  try {
    const { nguong_sap_het, so_ngay_ton_dong } = req.query;

    if (
      nguong_sap_het !== undefined &&
      (isNaN(parseInt(nguong_sap_het, 10)) || parseInt(nguong_sap_het, 10) < 1)
    ) {
      return next(
        new ApiError(400, "Tham số nguong_sap_het phải là số nguyên lớn hơn 0"),
      );
    }

    if (
      so_ngay_ton_dong !== undefined &&
      (isNaN(parseInt(so_ngay_ton_dong, 10)) ||
        parseInt(so_ngay_ton_dong, 10) < 1)
    ) {
      return next(
        new ApiError(
          400,
          "Tham số so_ngay_ton_dong phải là số nguyên lớn hơn 0",
        ),
      );
    }

    const Service = new ThongKeService();
    const filterData = {
      nguong_sap_het,
      so_ngay_ton_dong,
    };

    const result = await Service.thongKeTonKho(filterData);
    return res.send(result);
  } catch (error) {
    return next(
      new ApiError(
        500,
        "Đã xảy ra lỗi khi lấy thống kê tồn kho và cảnh báo nhập hàng",
      ),
    );
  }
};
