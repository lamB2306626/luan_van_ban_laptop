<template>
  <div
    class="card h-100 border product-mini-card overflow-hidden"
    @click="$emit('select', item)"
  >
    <!-- 1. KHU VỰC ẢNH BIẾN THỂ -->
    <div
      class="position-relative bg-light text-center border-bottom product-img-wrapper"
    >
      <img
        :src="getAnh(item)"
        :alt="item.ten_san_pham"
        class="product-mini-img"
        @error="handleImageError"
      />
      <!-- Badge thương hiệu & tồn kho đè gọn gàng ở góc ảnh -->
      <span
        class="badge bg-dark bg-opacity-75 position-absolute top-0 start-0 m-1"
        style="font-size: 0.65rem"
      >
        {{ item.thuong_hieu }}
      </span>
      <span
        class="badge bg-success position-absolute top-0 end-0 m-1"
        style="font-size: 0.65rem"
      >
        Còn {{ item.so_luong }}
      </span>
    </div>

    <!-- 2. NỘI DUNG THÔNG SỐ BIẾN THỂ -->
    <div class="card-body p-2 d-flex flex-column justify-content-between">
      <div>
        <h6
          class="card-title fw-bold text-dark mb-1 text-truncate small"
          :title="item.ten_san_pham"
        >
          {{ item.ten_san_pham }}
        </h6>

        <!-- Hiển thị Màu sắc -->
        <div v-if="item.mau_sac" class="mb-1">
          <span
            class="badge bg-light text-dark border fw-normal"
            style="font-size: 0.68rem"
          >
            <i class="fas fa-palette text-primary me-1"></i>Màu:
            {{ item.mau_sac }}
          </span>
        </div>

        <!-- Hiển thị CPU, RAM, SSD -->
        <p
          class="card-text text-muted mb-1 text-truncate"
          style="font-size: 0.73rem"
          :title="`${item.cpu} • ${item.ram} • ${item.rom}`"
        >
          <i class="fas fa-microchip me-1 text-secondary"></i>{{ item.cpu }} •
          {{ item.ram }} • {{ item.rom }}
        </p>

        <!-- Hiển thị Card đồ họa (GPU) -->
        <p
          v-if="item.gpu"
          class="card-text text-muted mb-1 text-truncate"
          style="font-size: 0.73rem"
          :title="item.gpu"
        >
          <i class="fas fa-gamepad me-1 text-secondary"></i>{{ item.gpu }}
        </p>
      </div>

      <!-- 3. GIÁ BÁN & NÚT XEM CHI TIẾT -->
      <div
        class="d-flex justify-content-between align-items-center mt-2 pt-1 border-top"
      >
        <span class="fw-bold text-danger small">
          {{ formatCurrency(item.gia_ban) }}
        </span>
        <span class="text-primary fw-semibold" style="font-size: 0.72rem">
          Chi tiết <i class="fas fa-arrow-right"></i>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default {
  name: "SanPhamGoiYCard",
  props: {
    item: {
      type: Object,
      required: true,
    },
  },
  emits: ["select"],
  methods: {
    // Lấy ảnh của biến thể sản phẩm
    getAnh(item) {
      const anhBienThe = item?.duong_dan_anh_bt;
      if (anhBienThe) {
        return `${API_URL}/uploads/BienThe/${anhBienThe}`;
      }

      const anhSanPham = item?.duong_dan_anh_sp;
      if (anhSanPham) {
        return `${API_URL}/uploads/AnhSanPham/${anhSanPham}`;
      }

      // Trả về ảnh mặc định nếu không có đường dẫn ảnh
      return `${API_URL}/images/placeholder-laptop.png`;
    },

    // Xử lý dự phòng nếu file ảnh bị lỗi không tải được
    handleImageError(event) {
      event.target.src = `${API_URL}/images/placeholder-laptop.png`;
    },

    formatCurrency(value) {
      if (!value || isNaN(value)) return "Liên hệ";
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value);
    },
  },
};
</script>

<style scoped>
.product-mini-card {
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.product-mini-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #0d6efd !important;
}

.product-img-wrapper {
  height: 115px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
}

.product-mini-img {
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
}
</style>
