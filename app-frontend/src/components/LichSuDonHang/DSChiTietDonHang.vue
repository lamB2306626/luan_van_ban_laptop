<template>
  <div class="card shadow-sm border-0">
    <div class="card-header bg-white py-3 border-bottom">
      <h5 class="fw-bold mb-0 text-dark">
        <i class="fas fa-box text-primary me-2"></i>Sản phẩm đã đặt ({{
          chiTietDonHang.length
        }})
      </h5>
    </div>
    <div class="card-body p-0">
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead class="bg-light">
            <tr>
              <th scope="col" class="ps-3 py-2">Sản phẩm</th>
              <th scope="col" class="text-center py-2">Đơn giá</th>
              <th scope="col" class="text-center py-2">SL</th>
              <th scope="col" class="text-end pe-3 py-2">Thành tiền</th>
              <th scope="col" class="text-end pe-3 py-2">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in chiTietDonHang" :key="item.id">
              <!-- Ảnh & Tên biến thể -->
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
                      {{
                        item.bien_the?.san_pham?.ten_san_pham ||
                        "Sản phẩm Laptop"
                      }}
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

              <!-- Đơn giá -->
              <td class="text-center small">
                <div v-if="Number(item.gia_goc) > Number(item.don_gia_ap_dung)">
                  <span
                    class="text-decoration-line-through text-muted small me-1"
                  >
                    {{ formatCurrency(item.gia_goc) }}
                  </span>
                  <br />
                  <span class="text-danger fw-semibold">{{
                    formatCurrency(item.don_gia_ap_dung)
                  }}</span>
                </div>
                <div v-else>
                  {{ formatCurrency(item.don_gia_ap_dung) }}
                </div>
              </td>

              <!-- Số lượng -->
              <td class="text-center fw-bold small">x{{ item.so_luong }}</td>

              <!-- Thành tiền -->
              <td class="text-end pe-3 fw-bold text-danger small">
                {{
                  formatCurrency(Number(item.don_gia_ap_dung) * item.so_luong)
                }}
              </td>

              <!-- Hành động (Xem chi tiết / Đánh giá) -->
              <td class="text-end pe-3">
                <div class="d-flex flex-column align-items-end gap-1">
                  <button
                    class="btn btn-sm btn-outline-primary py-1 px-2"
                    style="font-size: 11px"
                    @click="$emit('view-detail', item.bien_the.id_san_pham)"
                  >
                    <i class="fas fa-info-circle me-1"></i> Chi tiết
                  </button>

                  <div v-if="isKH">
                    <div v-if="item.danh_gia && item.danh_gia.length > 0">
                      <span class="badge bg-success" style="font-size: 10px">
                        <i class="fas fa-check-circle me-1"></i> Đã đánh giá
                      </span>
                    </div>

                    <div v-else-if="trangThaiDonHang === 'HOAN_THANH'">
                      <button
                        class="btn btn-sm btn-primary py-1 px-2"
                        style="font-size: 11px"
                        @click="$emit('open-review', item)"
                      >
                        Đánh giá
                      </button>
                    </div>
                  </div>
                </div>
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
  name: "DanhSachSanPhamDonHang",
  props: {
    chiTietDonHang: {
      type: Array,
      default: () => [],
    },
    trangThaiDonHang: {
      type: String,
      default: "",
    },
    isKH: {
      type: String,
      default: "false",
    },
  },
  methods: {
    formatCurrency(value) {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value || 0);
    },

    // Lấy ảnh của sản phẩm (ưu tiên biến thể đại diện, nếu không có thì lấy ảnh chính của sản phẩm)
    getAnh(item) {
      // 1. Kiểm tra xem biến thể đại diện có ảnh hay không
      // const anhBienThe = item.bien_the?.duong_dan_anh;
      // if (anhBienThe) {
      //   return `${API_URL}/uploads/BienThe/${anhBienThe}`;
      // }

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

    onImageError(e) {
      e.target.src = `${API_URL}/images/placeholder-laptop.png`;
    },
  },
};
</script>
