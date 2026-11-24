import createApiClient from "./api.service";

class LichSuTimKiemService {
  constructor(baseUrl = "/api/lich-su-tim-kiem") {
    this.api = createApiClient(baseUrl);
  }

  // 1. Lấy danh sách (bản ghi) lịch sử tìm kiếm có kết hợp bộ lọc (id, name)
  async getAll(params = {}) {
    return (await this.api.get("/", { params })).data;
  }

  // 2. Lấy thông tin chi tiết 1 (bản ghi) lịch sử tìm kiếm theo ID
  async get(id) {
    return (await this.api.get(`/${id}`)).data;
  }

  // 3. Tạo mới một (bản ghi) lịch sử tìm kiếm
  async create(data) {
    return (await this.api.post("/", data)).data;
  }

  // 4. Cập nhật thông tin (bản ghi) lịch sử tìm kiếm theo ID
  async update(id, data) {
    return (await this.api.put(`/${id}`, data)).data;
  }

  // 5. Xóa 1 (bản ghi) lịch sử tìm kiếm theo ID
  async delete(id) {
    return (await this.api.delete(`/${id}`)).data;
  }

  // 6. Xóa tất cả (bản ghi) lịch sử tìm kiếm
  async deleteAll() {
    return (await this.api.delete("/")).data;
  }
}

export default new LichSuTimKiemService();
