<template>
  <div
    class="border rounded p-3 cursor-pointer position-relative address-card"
    :class="{
      'border-primary bg-light-subtle shadow-sm': isSelected,
    }"
    @click="$emit('select', address)"
  >
    <div class="form-check m-0">
      <input
        class="form-check-input cursor-pointer"
        type="radio"
        name="shippingAddress"
        :id="'addr-' + address.id"
        :value="address.id"
        :checked="isSelected"
        @change="$emit('select', address)"
      />
      <label
        class="form-check-label w-100 cursor-pointer ps-2"
        :for="'addr-' + address.id"
      >
        <div class="d-flex align-items-center gap-2 mb-1">
          <strong class="text-dark fs-6">{{ address.ten_nguoi_nhan }}</strong>
          <span class="text-secondary small"
            >({{ address.sdt_nguoi_nhan }})</span
          >
          <span
            v-if="address.la_mac_dinh"
            class="badge bg-danger-subtle text-danger small ms-auto"
          >
            Mặc định
          </span>
        </div>
        <div class="text-secondary small text-break">
          <i class="fas fa-map-marker-alt text-muted me-1"></i
          >{{ address.ten_tinh }}, {{ address.ten_huyen }},
          {{ address.ten_xa }}, {{ address.dia_chi_cu_the }}
        </div>
      </label>
    </div>
  </div>
</template>

<script>
export default {
  name: "DiaChiCard",
  props: {
    address: {
      type: Object,
      required: true,
    },
    isSelected: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["select"],
};
</script>

<style scoped>
.address-card {
  transition: all 0.2s ease-in-out;
}
.address-card:hover {
  border-color: #0d6efd !important;
}
.cursor-pointer {
  cursor: pointer;
}
</style>
