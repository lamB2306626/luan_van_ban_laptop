import createApiClient from "./api.service";

class DiaChiService {
  constructor(baseUrl = "/api/dia-chi") {
    this.api = createApiClient(baseUrl);
  }

  // 1. Lấy danh sách địa chỉ có kết hợp bộ lọc (id, name)
  async getAll(params = {}) {
    return (await this.api.get("/", { params })).data;
  }

  // 2. Lấy thông tin chi tiết 1 địa chỉ theo ID
  async get(id) {
    return (await this.api.get(`/${id}`)).data;
  }

  // 3. Tạo mới một địa chỉ
  async create(data) {
    return (await this.api.post("/", data)).data;
  }

  // 4. Cập nhật thông tin địa chỉ theo ID
  async update(id, data) {
    return (await this.api.put(`/${id}`, data)).data;
  }

  // 5. Xóa 1 địa chỉ theo ID
  async delete(id) {
    return (await this.api.delete(`/${id}`)).data;
  }

  // 6. Xóa tất cả địa chỉ
  async deleteAll() {
    return (await this.api.delete("/")).data;
  }
}

export default new DiaChiService();
