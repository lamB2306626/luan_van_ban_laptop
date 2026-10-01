import createApiClient from "./api.service";

class SanPhamService {
  constructor(baseUrl = "/api/san-pham") {
    this.api = createApiClient(baseUrl);
  }

  // 1. Lấy danh sách danh mục có kết hợp bộ lọc (id, name)
  async getAll(params = {}) {
    return (await this.api.get("/", { params })).data;
  }

  // 2. Lấy thông tin chi tiết 1 danh mục theo ID
  async get(id) {
    return (await this.api.get(`/${id}`)).data;
  }

  // 3. Tạo mới một danh mục
  async create(data) {
    return (
      await this.api.post("/", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
    ).data;
  }

  // 4. Cập nhật thông tin danh mục theo ID
  async update(id, data) {
    return (
      await this.api.put(`/${id}`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
    ).data;
  }

  // 5. Xóa 1 danh mục theo ID
  async delete(id) {
    return (await this.api.delete(`/${id}`)).data;
  }

  // 6. Xóa tất cả danh mục
  async deleteAll() {
    return (await this.api.delete("/")).data;
  }
}

export default new SanPhamService();
