<template>
  <div class="card border-0 shadow-sm p-4 h-100">
    <h5 class="fw-bold pb-2 border-bottom">
      <i class="fas fa-microchip me-2"></i>Thông số kỹ thuật
    </h5>

    <!-- Hiện bảng nếu có dữ liệu thongSo -->
    <div v-if="thongSo" class="table-responsive mt-3">
      <table class="table table-striped table-hover align-middle mb-0">
        <tbody>
          <tr v-if="thongSo.kich_thuoc_man_hinh">
            <th scope="row" class="text-muted w-40">Màn hình</th>
            <td>{{ thongSo.kich_thuoc_man_hinh }}</td>
          </tr>
          <tr v-if="thongSo.do_phan_giai">
            <th scope="row" class="text-muted">Độ phân giải</th>
            <td>{{ thongSo.do_phan_giai }}</td>
          </tr>
          <tr v-if="thongSo.dung_luong_pin">
            <th scope="row" class="text-muted">Dung lượng Pin</th>
            <td>{{ thongSo.dung_luong_pin }}</td>
          </tr>
          <tr v-if="thongSo.cong_xuat_sac">
            <th scope="row" class="text-muted">Công suất sạc</th>
            <td>{{ thongSo.cong_xuat_sac }}</td>
          </tr>
          <tr v-if="thongSo.cong_ket_noi">
            <th scope="row" class="text-muted">Cổng kết nối</th>
            <td>{{ thongSo.cong_ket_noi }}</td>
          </tr>
          <tr v-if="thongSo.chuan_wifi_bluetooth">
            <th scope="row" class="text-muted">Kết nối không dây</th>
            <td>{{ thongSo.chuan_wifi_bluetooth }}</td>
          </tr>
          <tr v-if="thongSo.trong_luong">
            <th scope="row" class="text-muted">Trọng lượng</th>
            <td>{{ thongSo.trong_luong }}</td>
          </tr>
          <tr v-if="thongSo.chat_lieu_vo">
            <th scope="row" class="text-muted">Chất liệu vỏ</th>
            <td>{{ thongSo.chat_lieu_vo }}</td>
          </tr>
          <tr v-if="thongSo.he_dieu_hanh">
            <th scope="row" class="text-muted">Hệ điều hành</th>
            <td>{{ thongSo.he_dieu_hanh }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Hiện thông báo nếu thongSo bị null hoặc trống -->
    <div v-else class="text-center py-4 text-muted">
      <i class="fas fa-info-circle me-1"></i> Chưa có thông số kỹ thuật cho sản
      phẩm này.
    </div>
  </div>
</template>

<script>
export default {
  name: "ThongSoKyThuatTable",
  props: {
    thongSo: {
      type: Object,
      default: () => null,
    },
  },
};
</script>

<style scoped>
.w-40 {
  width: 40%;
}
</style>
