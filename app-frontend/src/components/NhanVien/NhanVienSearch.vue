<template>
  <div class="row g-2 mb-3 align-items-end">
    <!-- Ô nhập Mã Nhân Viên -->
    <div class="col-md-3">
      <label class="form-label small fw-bold text-secondary mb-1"
        >Mã Nhân Viên:</label
      >
      <input
        type="text"
        class="form-control"
        placeholder="Nhập mã NV..."
        :value="modelValue.id"
        @input="updateField('id', $event.target.value)"
        @keyup.enter="submit"
      />
    </div>

    <!-- Ô nhập Tên Nhân Viên -->
    <div class="col-md-3">
      <label class="form-label small fw-bold text-secondary mb-1"
        >Tên Nhân Viên:</label
      >
      <input
        type="text"
        class="form-control"
        placeholder="Nhập tên nhân viên..."
        :value="modelValue.name"
        @input="updateField('name', $event.target.value)"
        @keyup.enter="submit"
      />
    </div>

    <!-- Ô nhập Vai Trò -->
    <div class="col-md-3">
      <label class="form-label small fw-bold text-secondary mb-1"
        >Vai Trò:</label
      >
      <select
        class="form-control form-select"
        :value="modelValue.id_vai_tro"
        @change="updateField('id_vai_tro', $event.target.value)"
      >
        <option value="">-- Chọn Vai Trò --</option>
        <option v-for="item in danhSachVaiTro" :key="item.id" :value="item.id">
          {{ item.ten_vai_tro }}
        </option>
      </select>
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
import VaiTroService from "@/services/vai-tro.service";

export default {
  name: "NhanVienSearch",
  props: {
    // modelValue dạng Object chứa 3 trường: id, ho_ten, id_vai_tro
    modelValue: {
      type: Object,
      default: () => ({
        id: "",
        name: "",
        id_vai_tro: "",
      }),
    },
  },
  emits: ["submit", "update:modelValue"],
  data() {
    return {
      danhSachVaiTro: [],
    };
  },
  methods: {
    // Cập nhật từng trường vào object cha khi người dùng nhập
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

    async loadSelectData() {
      try {
        this.danhSachVaiTro = await VaiTroService.getAll();
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu bổ trợ cho bộ lọc:", error);
      }
    },
  },
  created() {
    this.loadSelectData();
  },
};
</script>
