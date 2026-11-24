import createApiClient from "./api.service";

class CuocTroTruyenService {
  constructor(baseUrl = "/api/cuoc-tro-truyen") {
    this.api = createApiClient(baseUrl);
  }

  // Tạo mới một cuộc trò truyện
  async create(data) {
    return (await this.api.post("/", data)).data;
  }
}

export default new CuocTroTruyenService();
