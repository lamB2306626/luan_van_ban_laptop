import createApiClient from "./api.service";

class ThanhToanService {
  constructor(baseUrl = "/api/thanh-toan") {
    this.api = createApiClient(baseUrl);
  }

  // 1. Gửi yêu cầu khởi tạo đường dẫn thanh toán VNPAY
  async createPaymentUrl(data) {
    return (await this.api.post("/create_payment_url", data)).data;
  }

  // 2. Gửi các tham số VNPAY trả về để xác thực và cập nhật CSDL
  async processVnpayReturn(queryParams) {
    return (await this.api.post("/vnpay_return", queryParams)).data;
  }

  // 3. Lấy danh sách lịch sử thanh toán (có thể truyền params bộ lọc)
  async getAll(params = {}) {
    return (await this.api.get("/", { params })).data;
  }

  // 4. Lấy chi tiết 1 giao dịch thanh toán theo ID
  async get(id) {
    return (await this.api.get(`/${id}`)).data;
  }

  // 5. Xóa 1 bản ghi thanh toán theo ID
  async delete(id) {
    return (await this.api.delete(`/${id}`)).data;
  }

  // 6. Xóa tất cả lịch sử thanh toán
  async deleteAll() {
    return (await this.api.delete("/")).data;
  }
}

export default new ThanhToanService();
