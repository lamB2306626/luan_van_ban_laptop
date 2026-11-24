<template>
  <div class="card shadow-sm border-0 sticky-top" style="top: 20px">
    <div class="card-header bg-white py-3 border-bottom">
      <h5 class="fw-bold mb-0 text-dark">Tổng cộng đơn hàng</h5>
    </div>
    <div class="card-body p-4">
      <!-- 1. TỔNG TIỀN GỐC -->
      <div class="d-flex justify-content-between mb-2">
        <span class="text-secondary">Tổng tiền hàng (Gốc):</span>
        <span class="fw-bold text-dark">
          {{ formatCurrency(summary?.tong_tien_goc) }}
        </span>
      </div>

      <!-- 2. TIẾT KIỆM KHUYẾN MÃI SP -->
      <div
        class="d-flex justify-content-between mb-2 text-success"
        v-if="summary?.tong_tien_giam_km > 0"
      >
        <span>Tiết kiệm sản phẩm:</span>
        <span class="fw-bold">
          - {{ formatCurrency(summary?.tong_tien_giam_km) }}
        </span>
      </div>

      <!-- 3. TIẾT KIỆM VOUCHER (NẾU CÓ CHỌN) -->
      <div
        class="d-flex justify-content-between mb-2 text-primary"
        v-if="voucherDiscount > 0"
      >
        <span>Voucher giảm giá:</span>
        <span class="fw-bold"> - {{ formatCurrency(voucherDiscount) }} </span>
      </div>

      <!-- 4. PHÍ VẬN CHUYỂN (GHN) -->
      <div class="d-flex justify-content-between mb-2">
        <span class="text-secondary">Phí vận chuyển:</span>
        <span class="fw-bold text-dark">
          + {{ formatCurrency(shippingFee) }}
        </span>
      </div>

      <hr />

      <!-- 5. TỔNG THANH TOÁN CUỐI CÙNG (Dùng trực tiếp prop finalTotal từ cha) -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <span class="fw-bold fs-6 text-dark d-block">Tổng thanh toán:</span>
          <span class="small text-muted">(Đã bao gồm VAT)</span>
        </div>
        <span class="fw-bold text-danger fs-3">
          {{ formatCurrency(finalTotal) }}
        </span>
      </div>

      <!-- 6. NÚT XÁC NHẬN ĐẶT HÀNG -->
      <button
        class="btn btn-danger btn-lg w-100 fw-bold py-3"
        :disabled="submitting || isCodExceedLimit"
        @click="$emit('submit-order')"
      >
        <span v-if="submitting">
          <span
            class="spinner-border spinner-border-sm me-2"
            role="status"
          ></span>
          Đang xử lý đặt hàng...
        </span>
        <span v-else>
          <i class="fas fa-check-circle me-2"></i>XÁC NHẬN ĐẶT HÀNG
        </span>
      </button>

      <!-- THÔNG BÁO KHI CHỌN COD NHƯNG VƯỢT HẠN MỨC 45 TRIỆU -->
      <div
        v-if="isCodExceedLimit"
        class="alert alert-danger small mt-3 mb-0 py-2 px-3"
      >
        <i class="fas fa-exclamation-triangle me-1"></i>
        Không thể đặt hàng với phương thức <strong>COD</strong> do tổng thanh
        toán vượt quá hạn mức <strong>45.000.000₫</strong>. Vui lòng chuyển sang
        thanh toán <strong>QR Code</strong>.
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TomTatThanhToan",
  props: {
    summary: {
      type: Object,
      default: () => ({
        tong_tien_goc: 0,
        tong_tien_giam_km: 0,
        tong_tien_sau_km: 0,
      }),
    },
    voucherDiscount: {
      type: Number,
      default: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
    },
    // Tổng thanh toán cuối cùng nhận trực tiếp từ trang cha
    finalTotal: {
      type: Number,
      default: 0,
    },
    // Trạng thái đang xử lý API đặt hàng
    submitting: {
      type: Boolean,
      default: false,
    },
    // Cờ báo hiệu đang chọn COD và vượt quá hạn mức 45 triệu
    isCodExceedLimit: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["submit-order"],
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
