<template>
  <div class="row g-2 mb-3 align-items-end">
    <!-- 1. Mã Khách Hàng -->
    <div class="col-md-2">
      <label class="form-label small fw-bold text-secondary mb-1">Mã KH:</label>
      <input
        type="text"
        class="form-control"
        placeholder="Nhập mã KH..."
        :value="modelValue.id"
        @input="updateField('id', $event.target.value)"
        @keyup.enter="submit"
      />
    </div>

    <!-- 2. Tên Khách Hàng (Gửi lên backend là req.query.name) -->
    <div class="col-md-2">
      <label class="form-label small fw-bold text-secondary mb-1"
        >Tên KH:</label
      >
      <input
        type="text"
        class="form-control"
        placeholder="Nhập tên..."
        :value="modelValue.name"
        @input="updateField('name', $event.target.value)"
        @keyup.enter="submit"
      />
    </div>

    <!-- 3. Email (Gửi lên backend là req.query.email) -->
    <div class="col-md-2">
      <label class="form-label small fw-bold text-secondary mb-1">Email:</label>
      <input
        type="text"
        class="form-control"
        placeholder="Nhập email..."
        :value="modelValue.email"
        @input="updateField('email', $event.target.value)"
        @keyup.enter="submit"
      />
    </div>

    <!-- 4. Số Điện Thoại (Gửi lên backend là req.query.phone) -->
    <div class="col-md-2">
      <label class="form-label small fw-bold text-secondary mb-1"
        >Số điện thoại:</label
      >
      <input
        type="text"
        class="form-control"
        placeholder="Nhập SĐT..."
        :value="modelValue.phone"
        @input="updateField('phone', $event.target.value)"
        @keyup.enter="submit"
      />
    </div>

    <!-- 5. Hạng Thành Viên (Gửi lên backend là req.query.id_hang_thanh_vien) -->
    <div class="col-md-2">
      <label class="form-label small fw-bold text-secondary mb-1"
        >Hạng thành viên:</label
      >
      <select
        class="form-control form-select"
        :value="modelValue.id_hang_thanh_vien"
        @change="updateField('id_hang_thanh_vien', $event.target.value)"
      >
        <option value="">-- Tất cả --</option>
        <option
          v-for="item in danhSachHangThanhVien"
          :key="item.id"
          :value="item.id"
        >
          {{ item.ten_hang || item.ten_hang_thanh_vien }}
        </option>
      </select>
    </div>

    <!-- 6. Trạng Thái (Gửi lên backend dạng chuỗi "true" / "false") -->
    <div class="col-md-2">
      <label class="form-label small fw-bold text-secondary mb-1"
        >Trạng thái:</label
      >
      <select
        class="form-control form-select"
        :value="modelValue.trang_thai"
        @change="updateField('trang_thai', $event.target.value)"
      >
        <option value="">-- Tất cả --</option>
        <option value="true">Hoạt động</option>
        <option value="false">Đã khóa</option>
      </select>
    </div>

    <!-- 7. Nút Tìm kiếm -->
    <div class="col-12 mt-2 text-end">
      <button
        class="btn btn-outline-secondary px-4"
        type="button"
        @click="submit"
      >
        <i class="fas fa-search me-1"></i> Tìm kiếm
      </button>
    </div>
  </div>
</template>

<script>
import HangThanhVienService from "@/services/hang-thanh-vien.service";

export default {
  name: "KhachHangSearch",
  props: {
    // modelValue chứa đúng các thuộc tính tương ứng với req.query phía backend
    modelValue: {
      type: Object,
      default: () => ({
        id: "",
        name: "",
        email: "",
        phone: "",
        id_hang_thanh_vien: "",
      }),
    },
  },
  emits: ["submit", "update:modelValue"],
  data() {
    return {
      danhSachHangThanhVien: [],
    };
  },
  methods: {
    // Cập nhật từng trường vào object cha khi người dùng thao tác
    updateField(key, value) {
      this.$emit("update:modelValue", {
        ...this.modelValue,
        [key]: value,
      });
    },

    // Phát sự kiện tìm kiếm ra ngoài component cha
    submit() {
      this.$emit("submit");
    },

    // Lấy danh sách Hạng Thành Viên cho ô select
    async loadSelectData() {
      try {
        if (HangThanhVienService && HangThanhVienService.getAll) {
          this.danhSachHangThanhVien = await HangThanhVienService.getAll();
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách hạng thành viên:", error);
      }
    },
  },
  created() {
    this.loadSelectData();
  },
};
</script>
