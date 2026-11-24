import createApiClient from "./api.service";

class TinNhanService {
  constructor(baseUrl = "/api/tin-nhan") {
    this.api = createApiClient(baseUrl);
  }

  // Khách hàng gửi tin nhắn
  async guiTinNhanKH(data) {
    return (await this.api.post("/khach-hang/gui-tin-nhan", data)).data;
  }

  // Nhân viên gửi tin nhắn
  async guiTinNhanNV(data) {
    return (await this.api.post("/nhan-vien/gui-tin-nhan", data)).data;
  }
}

export default new TinNhanService();
