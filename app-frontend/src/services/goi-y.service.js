import createApiClient from "./api.service";

class GoiYService {
  constructor(baseUrl = "/api/goi-y") {
    this.api = createApiClient(baseUrl);
  }

  // 1. Lấy danh sách danh mục có kết hợp bộ lọc (id, name)
  async getPersonalized(params = {}) {
    return (await this.api.get(`/ca-nhan`, { params })).data;
  }
  // 2. Lấy thông tin chi tiết 1 danh mục theo ID
  async getPopular(params = {}) {
    return (await this.api.get(`/noi-bat`, { params })).data;
  }
  // 3. Lấy danh sách sản phẩm tương tự
  async getSimilarProducts(params = {}) {
    return (await this.api.get(`/tuong-tu`, { params })).data;
  }
}

export default new GoiYService();
