import createApiClient from "./api.service";

class KhachHangService {
  constructor(baseUrl = "/api/khach-hang") {
    this.api = createApiClient(baseUrl);
  }

  // 1. Lấy danh sách khách hàng có kết hợp bộ lọc (id, name)
  async getAll(params = {}) {
    return (await this.api.get("/", { params })).data;
  }

  // 2. Lấy thông tin chi tiết 1 khách hàng theo ID
  async get(id) {
    return (await this.api.get(`/${id}`)).data;
  }

  // 3. Tạo mới một khách hàng
  async create(data) {
    return (await this.api.post("/", data)).data;
  }

  // 4. Cập nhật thông tin khách hàng theo ID
  async update(id, formData) {
    return (
      await this.api.put(`/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
    ).data;
  }

  // 5. Xóa 1 khách hàng theo ID
  async delete(id) {
    return (await this.api.delete(`/${id}`)).data;
  }

  // 5. Khôi phục 1 khách hàng theo ID
  async restore(id) {
    return (await this.api.patch(`/${id}/restore`)).data;
  }

  // 6. Xóa tất cả khách hàng
  async deleteAll() {
    return (await this.api.delete("/")).data;
  }

  // 7. Đăng nhập tài khoản khách hàng
  async login(data) {
    return (await this.api.post("/login", data)).data;
  }

  // 8. Đăng nhập google
  async loginWithGoogle(data) {
    return (await this.api.post("/google-login", data)).data;
  }
  // 9. Đăng nhập facebook
  async loginWithFacebook(data) {
    return (await this.api.post("/facebook-login", data)).data;
  }
}

export default new KhachHangService();
