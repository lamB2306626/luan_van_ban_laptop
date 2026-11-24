import createApiClient from "./api.service";

class ThongKeService {
  constructor(baseUrl = "/api/thong-ke") {
    this.api = createApiClient(baseUrl);
  }

  // 1. Lấy thống kê Doanh thu & Lợi nhuận gộp
  async getDoanhThuLoiNhuan(params = {}) {
    return (await this.api.get("/doanh-thu-loi-nhuan", { params })).data;
  }

  // 2. Lấy thống kê Tình trạng & Hiệu suất xử lý Đơn hàng
  async getThongKeDonHang(params = {}) {
    return (await this.api.get("/don-hang", { params })).data;
  }

  // 3. Lấy thống kê Top Sản phẩm & Cấu hình bán chạy
  async getThongKeSanPhamCauHinh(params = {}) {
    return (await this.api.get("/san-pham-cau-hinh", { params })).data;
  }

  // 4. Lấy thống kê Tồn kho & Cảnh báo nhập hàng
  async getThongKeTonKho(params = {}) {
    return (await this.api.get("/ton-kho", { params })).data;
  }
}

export default new ThongKeService();
