<template>
  <div class="row g-2 mb-3 align-items-end">
    <!-- Ô nhập Mã Màu Sắc -->
    <div class="col-md-3">
      <input
        type="text"
        class="form-control"
        placeholder="Nhập mã màu..."
        :value="modelValue.id"
        @input="updateField('id', $event.target.value)"
        @keyup.enter="submit"
      />
    </div>

    <!-- Ô nhập Tên Màu Sắc -->
    <div class="col-md-6">
      <input
        type="text"
        class="form-control"
        placeholder="Nhập tên màu cần tìm..."
        :value="modelValue.name"
        @input="updateField('name', $event.target.value)"
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
        <i class="fas fa-search"></i> Tìm kiếm
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "MauSacSearch",
  props: {
    // modelValue dạng Object chứa 2 trường dữ liệu 'id' và 'name'
    modelValue: {
      type: Object,
      default: () => ({ id: "", name: "" }),
    },
  },
  emits: ["submit", "update:modelValue"],
  methods: {
    // Cập nhật từng trường vào object cha khi người dùng gõ phím
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