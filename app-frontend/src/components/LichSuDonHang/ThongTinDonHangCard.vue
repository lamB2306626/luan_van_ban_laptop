<template>
  <div>
    <!-- 1. THÔNG TIN NHẬN HÀNG -->
    <div class="card shadow-sm border-0 mb-4">
      <div class="card-header bg-white py-3 border-bottom">
        <h5 class="fw-bold mb-0 text-dark">
          <i class="fas fa-shipping-fast text-primary me-2"></i>Thông tin nhận
          hàng
        </h5>
      </div>
      <div class="card-body p-4">
        <div class="border rounded p-3 bg-light-subtle">
          <div class="d-flex align-items-center gap-2 mb-2">
            <strong class="text-dark fs-6">
              {{ orderData.khach_hang?.ho_ten || "Người nhận" }}
            </strong>
          </div>
          <div class="text-secondary small text-break">
            <i class="fas fa-map-marker-alt text-danger me-2"></i
            >{{ orderData.dia_chi }}
          </div>
        </div>

        <!-- GHI CHÚ ĐƠN HÀNG -->
        <div class="mt-3 pt-2 border-top" v-if="orderData.ghi_chu">
          <label class="form-label fw-semibold text-secondary small"
            >Ghi chú đơn hàng:</label
          >
          <div class="p-2 bg-light rounded text-dark small">
            {{ orderData.ghi_chu }}
          </div>
        </div>
      </div>
    </div>

    <!-- 2. PHƯƠNG THỨC THANH TOÁN & VOUCHER -->
    <div class="card shadow-sm border-0 mb-4">
      <div class="card-header bg-white py-3 border-bottom">
        <h5 class="fw-bold mb-0 text-dark">
          <i class="fas fa-wallet text-primary me-2"></i>Thanh toán & Ưu đãi
        </h5>
      </div>
      <div class="card-body p-4">
        <!-- Phương thức thanh toán -->
        <div class="mb-3">
          <span class="text-secondary small d-block mb-1"
            >Phương thức thanh toán:</span
          >
          <span class="fw-bold text-dark">
            {{
              orderData.phuong_thuc_thanh_toan === "QR_CODE"
                ? "Chuyển khoản ngân hàng (QR Code)"
                : "Thanh toán khi nhận hàng (COD)"
            }}
          </span>
        </div>

        <!-- Phiếu giảm giá đã dùng -->
        <div v-if="orderData.phieu_giam_gia" class="pt-3 border-top">
          <span class="text-secondary small d-block mb-1"
            >Mã giảm giá áp dụng:</span
          >
          <div class="d-flex align-items-center gap-2">
            <span
              class="badge bg-warning-subtle text-warning-emphasis border border-warning px-3 py-2 fs-6"
            >
              <i class="fas fa-ticket-alt me-1"></i
              >{{ orderData.phieu_giam_gia.ten_phieu }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ThongTinDonHangCard",
  props: {
    orderData: {
      type: Object,
      required: true,
    },
  },
};
</script>
