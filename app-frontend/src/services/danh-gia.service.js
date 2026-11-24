import createApiClient from "./api.service";

class DanhGiaService {
  constructor(baseUrl = "/api/danh-gia") {
    this.api = createApiClient(baseUrl);
  }

  // 1. Lấy danh sách đánh giá có kết hợp bộ lọc (id, name)
  async getAll(params = {}) {
    return (await this.api.get("/", { params })).data;
  }

  // 2. Lấy thông tin chi tiết 1 đánh giá theo ID
  async get(id) {
    return (await this.api.get(`/${id}`)).data;
  }

  // 3. Tạo mới một đánh giá
  async create(data) {
    return (await this.api.post("/", data)).data;
  }

  // 4. Cập nhật thông tin đánh giá theo ID
  async update(id, data) {
    return (await this.api.put(`/${id}`, data)).data;
  }

  // 5. Xóa 1 đánh giá theo ID
  async delete(id) {
    return (await this.api.delete(`/${id}`)).data;
  }

  // 6. Xóa tất cả đánh giá
  async deleteAll() {
    return (await this.api.delete("/")).data;
  }
}

export default new DanhGiaService();
