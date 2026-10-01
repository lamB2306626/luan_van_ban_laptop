import createApiClient from "./api.service";

class NhanVienService {
  constructor(baseUrl = "/api/nhan-vien") {
    this.api = createApiClient(baseUrl);
  }

  // 1. Lấy danh sách nhân viên có kết hợp bộ lọc (id, name)
  async getAll(params = {}) {
    return (await this.api.get("/", { params })).data;
  }

  // 2. Lấy thông tin chi tiết 1 nhân viên theo ID
  async get(id) {
    return (await this.api.get(`/${id}`)).data;
  }

  // 3. Tạo mới một nhân viên
  async create(formData) {
    return (
      await this.api.post("/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
    ).data;
  }

  // 4. Cập nhật thông tin nhân viên theo ID
  async update(id, formData) {
    return (
      await this.api.put(`/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
    ).data;
  }

  // 5. Xóa 1 nhân viên theo ID
  async delete(id) {
    return (await this.api.delete(`/${id}`)).data;
  }

  // 6. Xóa tất cả nhân viên
  async deleteAll() {
    return (await this.api.delete("/")).data;
  }

  // 7. Đăng nhập tài khoản nhân viên
  async login(data) {
    return (await this.api.post("/login", data)).data;
  }
}

export default new NhanVienService();
