<template>
  <div
    class="variant-selector-container my-3"
    v-if="danhSachBienTheHienThi && danhSachBienTheHienThi.length > 0"
  >
    <!-- 1. TIÊU ĐỀ -->
    <div class="d-flex justify-content-between align-items-center mb-2">
      <label class="fw-bold text-dark fs-6">
        <i class="fas fa-sliders-h text-primary me-2"></i>Chọn cấu hình & Màu
        sắc:
      </label>
      <span class="text-muted small">
        {{ danhSachBienTheHienThi.length }} lựa chọn
      </span>
    </div>

    <!-- 2. DANH SÁCH CÁC Ô BIẾN THỂ (LƯỚI 2 CỘT) -->
    <div class="variant-grid mb-3">
      <div
        v-for="bienThe in danhSachBienTheHienThi"
        :key="bienThe.id"
        class="variant-card p-2 px-3 border rounded cursor-pointer position-relative transition-all"
        :class="{
          'selected-variant': bienTheSelected?.id === bienThe.id,
          'border-secondary-subtle bg-white':
            bienTheSelected?.id !== bienThe.id,
          'disabled-variant opacity-75':
            !isVariantAvailable(bienThe) || bienThe.so_luong <= 0,
        }"
        @click="selectVariant(bienThe)"
      >
        <!-- Hàng 1: Tên màu & Tên CPU (In đậm rõ ràng) -->
        <div class="d-flex justify-content-between align-items-start mb-1">
          <div class="fw-bolder text-dark text-truncate pe-1 fs-7">
            <strong>{{ bienThe.mau_sac?.ten_mau_sac }} </strong>
            <strong>|</strong>
            <strong>{{ bienThe.cpu?.ten_cpu || "" }}</strong>
          </div>

          <!-- Hiển thị trực tiếp thông tin số lượng/trạng thái ngay trên góc phải ô -->
          <span v-if="isDeleted(bienThe)" class="badge bg-secondary fs-8"
            >Ngừng hỗ trợ</span
          >
          <span v-else-if="isDiscontinued(bienThe)" class="badge bg-danger fs-8"
            >Ngừng bán</span
          >
          <span
            v-else-if="bienThe.so_luong <= 0"
            class="badge bg-light text-secondary border fs-8"
            >Hết hàng</span
          >
          <span v-else class="badge bg-success-subtle text-success fs-8 fw-bold"
            >Còn {{ bienThe.so_luong }}</span
          >
        </div>

        <!-- Hàng 2: Thông số GPU, RAM, ROM (GPU được in đậm để nổi bật) -->
        <div class="text-muted mb-1 fs-8">
          {{ bienThe.gpu?.ten_gpu || "" }}
          • {{ bienThe.dung_luong_ram?.dung_luong_ram || "" }} •
          {{ bienThe.dung_luong_rom?.dung_luong_rom || "" }}
        </div>

        <!-- Hàng 3: Giá tiền và Icon check khi chọn -->
        <div class="d-flex justify-content-between align-items-center mt-1">
          <span class="fw-bold text-primary fs-7">
            {{ formatCurrency(bienThe.gia) }}
          </span>

          <i
            v-if="bienTheSelected?.id === bienThe.id"
            class="fas fa-check-circle text-primary fs-7"
          ></i>
        </div>
      </div>
    </div>

    <!-- 3. KHỐI HIỂN THỊ GIÁ VÀ TRẠNG THÁI CHI TIẾT CỦA BIẾN THỂ ĐƯỢC CHỌN -->
  </div>

  <!-- Khi không có biến thể -->
  <div v-else class="alert alert-warning small my-3" role="alert">
    <i class="fas fa-exclamation-triangle me-1"></i> Sản phẩm này hiện chưa có
    biến thể cấu hình nào sẵn có!
  </div>
</template>

<script>
export default {
  name: "BienTheSelector",
  props: {
    danhSachBienThe: {
      type: Array,
      default: () => [],
    },
    defaultVariantId: {
      type: [String, Number],
      default: null,
    },
  },
  emits: ["select-variant"],
  data() {
    return {
      bienTheSelected: null,
    };
  },
  computed: {
    // Chỉ lọc ra các biến thể ĐANG KINH DOANH
    // trường hợp đặt biết nếu biến thể mặc định được truyền vào là NGỪNG KINH DOANH thì vẫn sẽ thêm biến thể này vào danhSachBienThe
    danhSachBienTheHienThi() {
      if (!Array.isArray(this.danhSachBienThe)) return [];

      return this.danhSachBienThe.filter((item) => {
        // 1. Luôn hiển thị các biến thể đang kinh doanh (trang_thai === true)
        if (
          Boolean(
            item.trang_thai &&
            item.san_pham.trang_thai === "DANG_KINH_DOANH" &&
            !item.is_delete &&
            !item.san_pham.is_delete,
          )
        )
          return true;

        // 2. Ngoại lệ: Nếu biến thể này có trang_thai = false NHƯNG trùng với defaultVariantId (được truyền từ Đơn hàng) thì VẪN HIỂN THỊ
        if (
          this.defaultVariantId &&
          String(item.id) === String(this.defaultVariantId)
        ) {
          return true;
        }

        return false;
      });
    },

    // Tự động tính đơn giá áp dụng
    donGiaApDung() {
      if (!this.bienTheSelected) return 0;
      return this.bienTheSelected.don_gia_ap_dung ?? this.bienTheSelected.gia;
    },

    // Kiểm tra xem biến thể đang chọn có được giảm giá hay không
    laCoGiamGia() {
      if (!this.bienTheSelected || !this.bienTheSelected.gia) return false;
      return Number(this.bienTheSelected.gia) > Number(this.donGiaApDung);
    },
  },
  watch: {
    // Lắng nghe danh sách biến thể sau khi được lọc
    danhSachBienTheHienThi: {
      immediate: true,
      deep: true,
      handler(newList) {
        if (Array.isArray(newList) && newList.length > 0) {
          // Ưu tiên 1: Chọn theo URL query param nếu có
          const defaultItem = newList.find(
            (item) => String(item.id) === String(this.defaultVariantId),
          );

          // Ưu tiên 2: Chọn biến thể đầu tiên CÒN HÀNG
          const availableItem = newList.find(
            (item) => Number(item.so_luong) > 0,
          );

          // Chọn biến thể hợp lệ nhất (Nếu không có còn hàng thì chọn phần tử đầu tiên)
          this.selectVariant(defaultItem || availableItem || newList[0]);
        } else {
          this.bienTheSelected = null;
        }
      },
    },
  },

  methods: {
    selectVariant(bienThe) {
      if (!bienThe) return;

      this.bienTheSelected = bienThe;
      // Bắn sự kiện lên component cha
      this.$emit("select-variant", bienThe);
    },

    formatCurrency(value) {
      if (!value || isNaN(value)) return "Liên hệ";
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value);
    },

    isDeleted(bienThe) {
      if (!bienThe) return false;
      const isSanPhamDeleted = bienThe.san_pham?.is_delete === true;
      const isBienTheDeleted = bienThe.is_delete === true; // Hoặc bienThe.isdelete tùy tên cột DB của bạn
      return isSanPhamDeleted || isBienTheDeleted;
    },

    // 2. Kiểm tra trạng thái kinh doanh (Sản phẩm hoặc biến thể ngừng kinh doanh)
    isDiscontinued(bienThe) {
      if (!bienThe) return false;

      const sanPhamTrangThai = bienThe.san_pham?.trang_thai;
      const bienTheTrangThai = bienThe.trang_thai; // Có thể là boolean hoặc chuỗi tùy thiết kế của bạn

      // Điều kiện: Sản phẩm khác "DANG_KINH_DOANH" hoặc biến thể mang trạng thái false/ngừng kinh doanh
      const isSanPhamNgung =
        sanPhamTrangThai && sanPhamTrangThai !== "DANG_KINH_DOANH";
      const isBienTheNgung =
        bienTheTrangThai === false || bienTheTrangThai === "NGUNG_KINH_DOANH";

      return isSanPhamNgung || isBienTheNgung;
    },

    // 3. Tổng hợp kiểm tra xem biến thể có hợp lệ hoàn toàn để đặt hàng hay không
    isVariantAvailable(bienThe) {
      if (!bienThe) return false;
      if (this.isDeleted(bienThe)) return false;
      if (this.isDiscontinued(bienThe)) return false;
      if (bienThe.so_luong <= 0) return false;
      return true;
    },
  },
};
</script>

<style scoped>
.variant-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.variant-card {
  user-select: none;
  background-color: #fff;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  transition: all 0.2s ease-in-out;
}

.selected-variant {
  border: 1.5px solid #0d6efd !important;
  background-color: #f4f8ff !important;
}

.variant-card:hover:not(.selected-variant) {
  border-color: #0d6efd;
}

.cursor-pointer {
  cursor: pointer;
}

.transition-all {
  transition: all 0.2s ease-in-out;
}

.disabled-variant {
  background-color: #f8f9fa;
}

.fs-7 {
  font-size: 0.85rem;
}

.fs-8 {
  font-size: 0.72rem;
}

@media (max-width: 576px) {
  .variant-grid {
    grid-template-columns: 1fr;
  }
}
</style>
