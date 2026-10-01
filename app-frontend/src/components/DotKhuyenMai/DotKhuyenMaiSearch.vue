<template>
  <div class="row g-2 mb-3 align-items-end">
    <!-- Ô nhập Mã Đợt Khuyến Mãi -->
    <div class="col-md-2">
      <label class="form-label fw-bold small text-muted mb-1">Mã đợt</label>
      <input
        type="text"
        class="form-control"
        placeholder="Nhập mã đợt..."
        :value="modelValue.id"
        @input="updateField('id', $event.target.value)"
        @keyup.enter="submit"
      />
    </div>

    <!-- Ô nhập Tên Đợt Khuyến Mãi -->
    <div class="col-md-3">
      <label class="form-label fw-bold small text-muted mb-1">Tên đợt khuyến mãi</label>
      <input
        type="text"
        class="form-control"
        placeholder="Nhập tên đợt khuyến mãi..."
        :value="modelValue.name"
        @input="updateField('name', $event.target.value)"
        @keyup.enter="submit"
      />
    </div>

    <!-- Lọc Từ Ngày -->
    <div class="col-md-2">
      <label class="form-label fw-bold small text-muted mb-1">Từ ngày</label>
      <input
        type="date"
        class="form-control"
        :value="modelValue.tu_ngay"
        @input="updateField('tu_ngay', $event.target.value)"
      />
    </div>

    <!-- Lọc Đến Ngày -->
    <div class="col-md-2">
      <label class="form-label fw-bold small text-muted mb-1">Đến ngày</label>
      <input
        type="date"
        class="form-control"
        :value="modelValue.den_ngay"
        @input="updateField('den_ngay', $event.target.value)"
      />
    </div>

    <!-- Lọc Trạng Thái Khả Dụng -->
    <div class="col-md-2">
      <label class="form-label fw-bold small text-muted mb-1">Trạng thái</label>
      <select
        class="form-select form-control"
        :value="modelValue.kha_dung"
        @change="updateField('kha_dung', $event.target.value)"
      >
        <option value="">-- Tất cả --</option>
        <option value="true">Còn hiệu lực</option>
        <option value="false">Hết hiệu lực</option>
      </select>
    </div>

    <!-- Nút Tìm kiếm -->
    <div class="col-md-1">
      <button
        class="btn btn-outline-secondary w-100"
        type="button"
        title="Tìm kiếm"
        @click="submit"
      >
        <i class="fas fa-search"></i>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "SearchDotKhuyenMai",
  props: {
    // modelValue dạng Object chứa 5 trường dữ liệu khớp với Query Backend
    modelValue: {
      type: Object,
      default: () => ({
        id: "",
        name: "",
        tu_ngay: "",
        den_ngay: "",
        kha_dung: "",
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