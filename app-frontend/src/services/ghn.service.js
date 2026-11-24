import createApiClient from "./api.service";

class GHNService {
  constructor(baseUrl = "/api/ghn") {
    this.api = createApiClient(baseUrl);
  }

  // 1. Lấy danh sách Tỉnh / Thành
  async getProvinces() {
    return (await this.api.get("/provinces")).data;
  }

  // 2. Lấy danh sách Quận / Huyện theo ID Tỉnh/Thành
  async getDistricts(provinceId) {
    return (await this.api.get(`/districts/${provinceId}`)).data;
  }

  // 3. Lấy danh sách Phường / Xã theo ID Quận/Huyện
  async getWards(districtId) {
    return (await this.api.get(`/wards/${districtId}`)).data;
  }

  // 4. Tính phí vận chuyển (Gửi payload chứa toDistrictId, toWardCode,...)
  async calculateFee(data) {
    return (await this.api.post("/calculate-fee", data)).data;
  }

  // 7. Duyệt đơn hàng theo ID
  async duyetDonVaTaoDonGHN(id, data) {
    return (await this.api.patch(`/${id}/create-order-ghn`, data)).data;
  }
}

export default new GHNService();
