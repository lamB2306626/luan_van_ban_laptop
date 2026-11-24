import createApiClient from "./api.service";

class LichSuTroTruyenService {
  constructor(baseUrl = "/api/lich-su-tro-truyen") {
    this.api = createApiClient(baseUrl);
  }

  // 1. Lấy danh sách cuộc trò truyện có kết hợp bộ lọc (id, name)
  async getAll(params = {}) {
    return (await this.api.get("/", { params })).data;
  }

  // 2. Lấy danh sách cuộc trò truyện cho 1 khách hàng
  async getByKhachHang(idKhachHang) {
    return (await this.api.get(`/khach-hang/${idKhachHang}`)).data;
  }

  // 3. Lấy thông tin chi tiết 1 cuộc trò truyện theo ID
  async get(id) {
    return (await this.api.get(`/${id}`)).data;
  }

  // 4. Đánh dấu đã dọc 1 cuộc trò truyện
  async markAsRead(id, data) {
    return (await this.api.patch(`/${id}/doc-tin-nhan`, data)).data;
  }

  // 5. Xóa 1 cuộc trò truyện theo ID
  async delete(id) {
    return (await this.api.delete(`/${id}`)).data;
  }

  // 6. Lấy thống kê tin nhắn chưa đọc của từng lịch sử trò truyện
  async getUnreadSummary() {
    return (await this.api.get(`/tin-chua-doc`)).data;
  }

  // 6. Lấy tin nhắn chưa đọc của 1 khách hàng
  async getUnreadByKhachhang(idKhachHang) {
    return (await this.api.get(`/tin-chua-doc/khach-hang/${idKhachHang}`)).data;
  }
}

export default new LichSuTroTruyenService();
