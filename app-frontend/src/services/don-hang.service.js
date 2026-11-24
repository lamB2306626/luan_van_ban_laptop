import createApiClient from "./api.service";

class DonHangService {
  constructor(baseUrl = "/api/don-hang") {
    this.api = createApiClient(baseUrl);
  }

  // 1. Lấy danh sách đơn hàng có kết hợp bộ lọc (id, name)
  async getAll(params = {}) {
    return (await this.api.get("/", { params })).data;
  }

  // 2. Lấy thông tin chi tiết 1 đơn hàng theo ID
  async get(id) {
    return (await this.api.get(`/${id}`)).data;
  }

  // 3. Tạo mới một đơn hàng (trống)
  async create(data) {
    return (await this.api.post("/", data)).data;
  }

  // 4. Tạo mới một đơn hàng với khách hang và các chi tiết giỏ hàng
  async checkout(data) {
    return (await this.api.post("/checkout", data)).data;
  }

  // 5. Xem trước một đơn hàng với khách hàng và các chi tiết giỏ hàng
  async previewCheckout(data) {
    return (await this.api.post("/preview", data)).data;
  }

  // 6. Cập nhật thông tin đơn hàng theo ID
  async update(id, data) {
    return (await this.api.put(`/${id}`, data)).data;
  }

  // 7. Duyệt đơn hàng theo ID
  async approve(id, data) {
    return (await this.api.patch(`/${id}/approve`, data)).data;
  }

  // 7. Hủy đơn hàng theo ID bởi nhân viên
  async cancelByNhanVien(id, data) {
    return (await this.api.patch(`/${id}/cancel-by-nv`, data)).data;
  }

  // 7. Hủy đơn hàng theo ID bới khách hàng
  async cancelByKhachHang(id, data) {
    return (await this.api.patch(`/${id}/cancel-by-kh`, data)).data;
  }

  // 7. Hủy đơn hàng theo ID bới khách hàng
  async cancelByKhachHang(id, data) {
    return (await this.api.patch(`/${id}/cancel-by-kh`, data)).data;
  }

  // 7. Hủy đơn hàng theo ID bới khách hàng
  async toDangVanChuyen(data) {
    return (
      await this.api.post(
        `https://status-mushy-antitoxic.ngrok-free.dev/api/ghn/webhook`,
        data,
      )
    ).data;
  }

  // 7. Hủy đơn hàng theo ID bới khách hàng
  async toHoanThanh(data) {
    return (
      await this.api.post(
        `https://status-mushy-antitoxic.ngrok-free.dev/api/ghn/webhook`,
        data,
      )
    ).data;
  }

  // 7. Cập nhật số lần thanh toán và ngày đặt hàng của đơn hàng (dùng khi thực hiện thanh toán lại)
  async updateSLTTandNgayDat(id) {
    return (await this.api.patch(`/${id}/updateSLTTandNgayDat`)).data;
  }

  // 8. Xóa 1 đơn hàng theo ID
  async delete(id) {
    return (await this.api.delete(`/${id}`)).data;
  }

  // 9. Xóa tất cả đơn hàng
  async deleteAll() {
    return (await this.api.delete("/")).data;
  }
}

export default new DonHangService();
