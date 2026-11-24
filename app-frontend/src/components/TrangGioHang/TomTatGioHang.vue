<template>
  <div class="card shadow-sm border-0">
    <div class="card-body p-4">
      <h5
        class="fw-bold text-dark mb-3 pb-2 border-bottom d-flex justify-content-between align-items-center"
      >
        <span>Tóm tắt đơn hàng</span>
        <span
          class="badge bg-primary-subtle text-primary fs-7"
          v-if="selectedCount > 0"
        >
          Đã chọn {{ selectedCount }}
        </span>
      </h5>

      <!-- 1. TỔNG TIỀN GỐC -->
      <div class="d-flex justify-content-between mb-2">
        <span class="text-secondary">Tổng tiền gốc:</span>
        <span class="fw-bold text-dark">
          {{ formatCurrency(summary?.tong_tien_goc) }}
        </span>
      </div>

      <!-- 2. TỔNG TIỀN GIẢM KHUYẾN MÃI (SẢN PHẨM) -->
      <div
        class="d-flex justify-content-between mb-2"
        v-if="summary?.tong_tien_giam_km > 0"
      >
        <span class="text-secondary">Tiết kiệm (Sản phẩm):</span>
        <span class="fw-bold text-success">
          - {{ formatCurrency(summary?.tong_tien_giam_km) }}
        </span>
      </div>

      <!-- 3. GIẢM GIÁ TỪ PHIẾU GIẢM GIÁ (VOUCHER) -->
      <div
        class="d-flex justify-content-between mb-2"
        v-if="summary?.voucher_discount > 0"
      >
        <span class="text-secondary">Voucher giảm giá:</span>
        <span class="fw-bold text-primary">
          - {{ formatCurrency(summary?.voucher_discount) }}
        </span>
      </div>

      <hr />

      <!-- 4. TỔNG TIỀN THANH TOÁN -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <span class="fw-bold fs-6 text-dark">Tổng tiền thanh toán:</span>
        <span class="fw-bold text-danger fs-4">
          {{ formatCurrency(summary?.tong_tien_sau_dung_PGG) }}
        </span>
      </div>

      <!-- 5. NÚT THANH TOÁN -->
      <button
        class="btn btn-danger btn-lg w-100 fw-bold"
        :disabled="!canCheckout"
        @click="$emit('checkout')"
      >
        <i class="fas fa-credit-card me-2"></i> Tiến hành thanh toán
      </button>

      <!-- 6. CẢNH BÁO KHI CHƯA CHỌN SẢN PHẨM NÀO -->
      <div
        v-if="selectedCount === 0"
        class="alert alert-info p-2 mt-3 mb-0 small text-center"
      >
        <i class="fas fa-info-circle me-1"></i> Vui lòng tích chọn ít nhất 1 sản
        phẩm để thanh toán.
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TomTatGioHang",
  props: {
    summary: {
      type: Object,
      default: () => ({
        tong_tien_goc: 0,
        tong_tien_giam_km: 0,
        voucher_discount: 0,
        tong_tien_sau_dung_PGG: 0,
      }),
    },
    canCheckout: {
      type: Boolean,
      default: false,
    },
    selectedCount: {
      type: Number,
      default: 0,
    },
  },
  emits: ["checkout"],
  methods: {
    formatCurrency(value) {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value || 0);
    },
  },
};
</script>
