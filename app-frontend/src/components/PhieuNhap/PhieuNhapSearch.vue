<template>
  <div class="row g-2 mb-3 align-items-end">
    <!-- Ô nhập Mã Phiếu Nhập -->
    <div class="col-md-3">
      <label class="form-label small fw-bold text-secondary mb-1">Mã Phiếu Nhập:</label>
      <input
        type="text"
        class="form-control"
        placeholder="Nhập mã phiếu..."
        :value="modelValue.id"
        @input="updateField('id', $event.target.value)"
        @keyup.enter="submit"
      />
    </div>

    <!-- Ô chọn Ngày Bắt Đầu -->
    <div class="col-md-3">
      <label class="form-label small fw-bold text-secondary mb-1">Từ Ngày:</label>
      <input
        type="date"
        class="form-control"
        :value="modelValue.tu_ngay"
        @input="updateField('tu_ngay', $event.target.value)"
        @keyup.enter="submit"
      />
    </div>

    <!-- Ô chọn Ngày Kết Thúc -->
    <div class="col-md-3">
      <label class="form-label small fw-bold text-secondary mb-1">Đến Ngày:</label>
      <input
        type="date"
        class="form-control"
        :value="modelValue.den_ngay"
        @input="updateField('den_ngay', $event.target.value)"
        @keyup.enter="submit"
      />
    </div>

    <!-- Nút Tìm kiếm -->
    <div class="col-md-3">
      <button
        class="btn btn-outline-secondary w-100"
        type="button"
        @click="submit"
      >
        <i class="fas fa-search me-1"></i> Tìm kiếm
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "PhieuNhapSearch",
  props: {
    // modelValue dạng Object chứa 3 trường dữ liệu: id, tu_ngay, den_ngay
    modelValue: {
      type: Object,
      default: () => ({
        id: "",
        tu_ngay: "",
        den_ngay: "",
      }),
    },
  },
  emits: ["submit", "update:modelValue"],
  methods: {
    // Cập nhật từng trường vào object cha khi người dùng thao tác
    updateField(key, value) {
      this.$emit("update:modelValue", {
        ...this.modelValue,
        [key]: value,
      });
    },
    // Phát sự kiện để gọi hàm tìm kiếm ở component cha
    submit() {
      this.$emit("submit");
    },
  },
};
</script>