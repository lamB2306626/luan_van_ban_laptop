<template>
  <div class="card shadow-sm border-0">
    <!-- HEADER BẢNG -->
    <div
      class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center"
    >
      <h5 class="fw-bold mb-0 text-dark">
        <i class="fas fa-box text-primary me-2"></i>Sản phẩm thanh toán ({{
          orderItems.length
        }})
      </h5>
      <div class="btn btn-sm btn-outline-primary" @click="goToCart">
        <i class="fas fa-edit me-1"></i>Sửa giỏ hàng
      </div>
    </div>

    <!-- BODY BẢNG -->
    <div class="card-body p-0">
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead class="bg-light">
            <tr>
              <th scope="col" class="ps-3 py-2">Sản phẩm</th>
              <th scope="col" class="text-center py-2">Đơn giá</th>
              <th scope="col" class="text-center py-2">SL</th>
              <th scope="col" class="text-end pe-3 py-2">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in orderItems" :key="item.id">
              <!-- 1. THÔNG TIN SẢN PHẨM & BIẾN THỂ -->
              <td class="ps-3 py-3">
                <div class="d-flex align-items-center gap-3">
                  <img
                    :src="getAnh(item)"
                    alt="Ảnh biến thể"
                    class="rounded border object-fit-cover"
                    style="width: 55px; height: 55px"
                    @error="onImageError"
                  />
                  <div>
                    <h6 class="fw-bold text-dark mb-1 small">
                      {{ item.bien_the?.san_pham?.ten_san_pham || "Sản phẩm" }}
                    </h6>
                    <div class="small text-secondary">
                      {{ item.bien_the?.mau_sac?.ten_mau_sac || "" }}
                      <span v-if="item.bien_the?.cpu"
                        >| {{ item.bien_the.cpu.ten_cpu }}</span
                      >
                      <span v-if="item.bien_the?.dung_luong_ram"
                        >|
                        {{ item.bien_the.dung_luong_ram.dung_luong_ram }}</span
                      >
                      <span v-if="item.bien_the?.dung_luong_rom"
                        >|
                        {{ item.bien_the.dung_luong_rom.dung_luong_rom }}</span
                      >
                    </div>
                  </div>
                </div>
              </td>

              <!-- 2. ĐƠN GIÁ -->
              <td class="text-center small">
                <div
                  v-if="getGiaGoc(item) && getDonGia(item) < getGiaGoc(item)"
                >
                  <span
                    class="text-decoration-line-through text-muted small me-1"
                  >
                    {{ formatCurrency(getGiaGoc(item)) }}
                  </span>
                  <br />
                  <span class="text-danger fw-semibold">{{
                    formatCurrency(getDonGia(item))
                  }}</span>
                </div>
                <div v-else>
                  {{ formatCurrency(getDonGia(item)) }}
                </div>
              </td>

              <!-- 3. SỐ LƯỢNG -->
              <td class="text-center fw-bold small">x{{ item.so_luong }}</td>

              <!-- 4. THÀNH TIỀN -->
              <td class="text-end pe-3 fw-bold text-danger small">
                {{ formatCurrency(getDonGia(item) * item.so_luong) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
const API_URL = import.meta.env.VITE_API_BASE_URL;

export default {
  name: "DSSanPhamThanhToan",
  props: {
    // Mảng danh sách các chi tiết đơn hàng truyền từ trang cha
    orderItems: {
      type: Array,
      default: () => [],
    },
    // id của phiếu giảm giá đang áp dụng, hỗ trợ việc chọn sẵn id phiếu giảm giá hiện tại khi quay lại trang giỏ hàng
    selectedVoucherId: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      API_URL,
    };
  },
  methods: {
    getDonGia(item) {
      return Number(
        item.don_gia_ap_dung ??
          item.bien_the?.don_gia_ap_dung ??
          item.bien_the?.gia ??
          0,
      );
    },
    getGiaGoc(item) {
      return Number(
        item.gia_goc ?? item.bien_the?.gia_goc ?? item.bien_the?.gia ?? 0,
      );
    },
    formatCurrency(value) {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value || 0);
    },

    // Lấy ảnh của sản phẩm (ưu tiên biến thể đại diện, nếu không có thì lấy ảnh chính của sản phẩm)
    getAnh(item) {
      // 1. Kiểm tra xem biến thể đại diện có ảnh hay không
      const anhBienThe = item.bien_the?.duong_dan_anh;
      if (anhBienThe) {
        return `${API_URL}/uploads/BienThe/${anhBienThe}`;
      }

      // 2. Nếu không có ảnh biến thể, tìm ảnh chính trong mảng anh_san_pham của sản phẩm
      const anhChinhSanPham =
        item.bien_the?.san_pham.anh_san_pham?.find((img) => img.la_anh_chinh)
          ?.duong_dan_anh ||
        item.bien_the?.san_pham.anh_san_pham?.[0]?.duong_dan_anh;

      if (anhChinhSanPham) {
        return `${API_URL}/uploads/AnhSanPham/${anhChinhSanPham}`;
      }

      // 3. Nếu cả hai đều không có, trả về ảnh mặc định
      return `${API_URL}/images/placeholder-laptop.png`;
    },

    goToCart() {
      // 3. Lấy mảng danh sách ID chi tiết giỏ hàng từ this.orderItems
      const selectedItemIds = this.orderItems.map((item) => item.id);

      this.$router.push({
        name: "gio-hang.home",
        query: {
          item_ids: selectedItemIds,
          voucher_id: this.selectedVoucherId,
        },
      });
    },
  },
};
</script>

<style scoped>
.object-fit-cover {
  object-fit: cover;
}
</style>
