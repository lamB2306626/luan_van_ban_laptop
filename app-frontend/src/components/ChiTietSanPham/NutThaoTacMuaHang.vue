<template>
  <div class="action-buttons-container mt-auto pt-3 border-top">
    <!-- 1. CHỌN SỐ LƯỢNG MUA (Chỉ hiện khi biến thể hợp lệ & còn hàng) -->
    <div class="d-flex align-items-center gap-3 mb-3" v-if="coTheDatHang">
      <label class="fw-bold fs-7 text-dark mb-0">Số lượng:</label>
      <div class="input-group quantity-selector shadow-sm" style="width: 140px">
        <button
          class="btn btn-outline-secondary px-3"
          type="button"
          @click="giamSoLuong"
          :disabled="soLuongMua <= 1"
        >
          <i class="fas fa-minus fs-8"></i>
        </button>
        <input
          type="text"
          class="form-control text-center fw-bold bg-white"
          v-model.number="soLuongMua"
          readonly
        />
        <button
          class="btn btn-outline-secondary px-3"
          type="button"
          @click="tangSoLuong"
          :disabled="soLuongMua >= getMaxQuantity"
        >
          <i class="fas fa-plus fs-8"></i>
        </button>
      </div>
    </div>

    <!-- THÔNG BÁO LÝ DO KHÔNG THỂ ĐẶT HÀNG -->
    <div v-if="thongBaoKhongTheDat" class="alert alert-warning py-2 mb-0 small">
      <i class="fas fa-info-circle me-1"></i> {{ thongBaoKhongTheDat }}
    </div>

    <!-- 2. CỤM NÚT THAO TÁC CHÍNH (GIỐNG MẪU) -->
    <div class="d-flex gap-2 mb-2 mt-2">
      <!-- Nút Thêm vào giỏ hàng -->
      <button
        class="btn btn-light border py-2 px-3 fw-bold flex-grow-1 text-dark shadow-sm"
        :disabled="!coTheDatHang"
        @click="handleThemVaoGio"
      >
        <i class="fas fa-cart-plus me-2 text-primary"></i> Thêm vào giỏ
      </button>

      <!-- Nút Mua ngay (Màu đen/xanh đậm nổi bật) -->
      <button
        class="btn btn-primary py-2 px-3 fw-bold flex-grow-1 shadow-sm ml-2"
        :disabled="!coTheDatHang"
        @click="handleMuaNgay"
      >
        <i class="fas fa-bolt me-2"></i> Mua ngay
      </button>
    </div>

    <!-- 3. THANH LIÊN HỆ VỚI SHOP / HỖ TRỢ KỸ THUẬT (Nằm ở dưới giống mẫu) -->
    <div
      class="contact-shop-bar py-2 px-3 bg-light border rounded text-center cursor-pointer transition-all"
      @click="handleLienHe"
    >
      <span class="small text-dark fw-medium">
        <i class="fas fa-headset me-2 text-primary"></i> Liên hệ với shop / Tư
        vấn
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: "NutThaoTacMuaHang",
  props: {
    bienTheSelected: {
      type: Object,
      default: null,
    },
  },
  emits: ["lien-he", "them-vao-gio", "mua-ngay"],
  data() {
    return {
      soLuongMua: 1,
      MAX_QUANTITY_SYSTEM: 3,
    };
  },
  computed: {
    // 1. Kiểm tra cờ is_delete (Sản phẩm gốc hoặc biến thể bị xóa)
    isDeleted() {
      if (!this.bienTheSelected) return false;
      const isSanPhamDeleted =
        this.bienTheSelected.san_pham?.is_delete === true;
      const isBienTheDeleted = this.bienTheSelected.is_delete === true;
      return isSanPhamDeleted || isBienTheDeleted;
    },

    // 2. Kiểm tra trạng thái kinh doanh (Sản phẩm hoặc biến thể ngừng kinh doanh)
    isDiscontinued() {
      if (!this.bienTheSelected) return false;

      const sanPhamTrangThai = this.bienTheSelected.san_pham?.trang_thai;
      const bienTheTrangThai = this.bienTheSelected.trang_thai;

      const isSanPhamNgung =
        sanPhamTrangThai && sanPhamTrangThai !== "DANG_KINH_DOANH";
      const isBienTheNgung =
        bienTheTrangThai === false || bienTheTrangThai === "NGUNG_KINH_DOANH";

      return isSanPhamNgung || isBienTheNgung;
    },

    // 3. Kiểm tra xem có đủ điều kiện đặt hàng hoàn toàn hay không
    coTheDatHang() {
      if (!this.bienTheSelected) return false;
      if (this.isDeleted) return false;
      if (this.isDiscontinued) return false;
      if (Number(this.bienTheSelected.so_luong) <= 0) return false;

      return true;
    },

    // 4. Hiển thị thông báo lý do không thể đặt hàng theo đúng thứ tự ưu tiên
    thongBaoKhongTheDat() {
      if (!this.bienTheSelected) return "Vui lòng chọn cấu hình sản phẩm.";

      if (this.isDeleted) {
        return "Sản phẩm này đã ngừng hỗ trợ / đã bị xóa, không thể đặt mua.";
      }

      if (this.isDiscontinued) {
        return "Sản phẩm này đã ngừng kinh doanh, không thể đặt mua.";
      }

      if (Number(this.bienTheSelected.so_luong) <= 0) {
        return "Sản phẩm này hiện đang hết hàng.";
      }

      return ""; // Nếu hợp lệ hết thì trả về chuỗi rỗng -> Ẩn khung thông báo
    },

    // Tính số lượng tối đa được phép mua (nhỏ nhất giữa 3 và số lượng tồn kho của biến thể)
    getMaxQuantity() {
      const tonKho = this.bienTheSelected?.so_luong || 0;
      return Math.min(this.MAX_QUANTITY_SYSTEM, tonKho);
    },
  },
  watch: {
    // Tự động reset số lượng về 1 khi người dùng đổi biến thể khác
    bienTheSelected: {
      deep: true,
      handler() {
        this.soLuongMua = 1;
      },
    },
  },
  methods: {
    tangSoLuong() {
      if (
        this.bienTheSelected &&
        this.soLuongMua < this.bienTheSelected.so_luong
      ) {
        this.soLuongMua++;
      }
    },
    giamSoLuong() {
      if (this.soLuongMua > 1) {
        this.soLuongMua--;
      }
    },
    handleLienHe() {
      this.$emit("lien-he");
    },
    handleThemVaoGio() {
      if (!this.coTheDatHang) return;
      this.$emit("them-vao-gio", {
        bienThe: this.bienTheSelected,
        soLuong: this.soLuongMua,
      });
    },
    handleMuaNgay() {
      if (!this.coTheDatHang) return;
      this.$emit("mua-ngay", {
        bienThe: this.bienTheSelected,
        soLuong: this.soLuongMua,
      });
    },
  },
};
</script>

<style scoped>
.action-buttons-container {
  width: 100%;
}

/* Tùy chỉnh nút Thêm vào giỏ */
.btn-light {
  background-color: #fff;
  border-color: #dee2e6;
  transition: all 0.2s ease-in-out;
}
.btn-light:hover:not(:disabled) {
  background-color: #f8f9fa;
  border-color: #0d6efd;
  color: #0d6efd !important;
}

/* Thanh liên hệ shop ở dưới */
.contact-shop-bar {
  background-color: #f8f9fa !important;
  border-color: #e9ecef !important;
  user-select: none;
}
.contact-shop-bar:hover {
  background-color: #f1f3f5 !important;
  border-color: #ced4da !important;
}

.cursor-pointer {
  cursor: pointer;
}

.transition-all {
  transition: all 0.2s ease-in-out;
}

.fs-7 {
  font-size: 0.85rem;
}

/* Tinh chỉnh cụm chọn số lượng */
.quantity-selector {
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #ced4da;
}

.quantity-selector .btn {
  border: none;
  background-color: #f8f9fa;
  color: #333;
  transition: all 0.2s;
}

.quantity-selector .btn:hover:not(:disabled) {
  background-color: #e9ecef;
  color: #0d6efd;
}

.quantity-selector input {
  border: none;
  box-shadow: none !important;
  font-size: 0.95rem;
}

.fs-8 {
  font-size: 0.75rem;
}
</style>
