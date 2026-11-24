<template>
  <div class="card shadow-sm border-0 mb-4">
    <div class="card-header bg-white py-3 border-bottom">
      <h5 class="fw-bold mb-0 text-dark">
        <i class="fas fa-credit-card text-primary me-2"></i>Phương thức thanh
        toán
      </h5>
    </div>
    <div class="card-body p-4">
      <!-- 1. THANH TOÁN COD -->
      <div
        class="form-check mb-3 p-3 border rounded"
        :class="{
          'border-primary bg-light': modelValue === 'COD' && allowCod,
          'cursor-pointer hover-border': allowCod,
          'bg-light opacity-75 cursor-not-allowed': !allowCod,
        }"
        @click="updateMethod('COD')"
      >
        <input
          class="form-check-input mt-1"
          :class="allowCod ? 'cursor-pointer' : 'cursor-not-allowed'"
          type="radio"
          name="paymentMethod"
          id="cod"
          value="COD"
          :checked="modelValue === 'COD'"
          :disabled="!allowCod"
          @change="updateMethod('COD')"
        />
        <label class="form-check-label ms-2 cursor-pointer w-100" for="cod">
          <strong class="d-block text-dark"
            >Thanh toán khi nhận hàng (COD)</strong
          >
          <span class="small text-secondary d-block">
            Bạn sẽ thanh toán bằng tiền mặt khi shipper giao hàng đến.
          </span>
          <span
            v-if="!allowCod"
            class="small text-danger fw-semibold d-block mt-1"
          >
            <i class="fas fa-exclamation-circle me-1"></i>
            Đơn hàng hiện tại vượt quá 45.000.000₫, không hỗ trợ thanh toán COD.
          </span>
        </label>
      </div>

      <!-- 2. CHUYỂN KHOẢN NGÂN HÀNG -->
      <div
        class="form-check p-3 border rounded cursor-pointer hover-border"
        :class="{ 'border-primary bg-light': modelValue === 'QR_CODE' }"
        @click="updateMethod('QR_CODE')"
      >
        <input
          class="form-check-input mt-1 cursor-pointer"
          type="radio"
          name="paymentMethod"
          id="banking"
          value="QR_CODE"
          :checked="modelValue === 'QR_CODE'"
          @change="updateMethod('QR_CODE')"
        />
        <label class="form-check-label ms-2 cursor-pointer w-100" for="banking">
          <strong class="d-block text-dark">
            Chuyển khoản ngân hàng (QR Code)
          </strong>
          <span class="small text-secondary">
            Quét mã QR chuyển khoản trực tiếp sau khi xác nhận đơn hàng.
          </span>
        </label>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "PTThanhToanSelector",
  props: {
    modelValue: {
      type: String,
      default: "COD",
    },
    // Prop nhận điều kiện cho phép chọn COD từ trang cha
    allowCod: {
      type: Boolean,
      default: true,
    },
  },
  emits: ["update:modelValue"],
  methods: {
    updateMethod(value) {
      // Chặn triệt để nếu người dùng click vào vùng div của COD khi đang bị khóa
      if (value === "COD" && !this.allowCod) {
        return;
      }
      this.$emit("update:modelValue", value);
    },
  },
};
</script>

<style scoped>
.hover-border:hover {
  border-color: #0d6efd !important;
}
.cursor-pointer {
  cursor: pointer;
}
.cursor-not-allowed {
  cursor: not-allowed;
}
</style>
