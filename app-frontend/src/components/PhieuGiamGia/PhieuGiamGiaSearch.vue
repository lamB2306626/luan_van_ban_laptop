<template>
  <div class="row g-2 mb-3 align-items-end">
    <!-- 1. Ô nhập Mã Phiếu Giảm Giá -->
    <div class="col-md-2">
      <label class="form-label fw-bold small text-muted mb-1">Mã phiếu</label>
      <input
        type="text"
        class="form-control"
        placeholder="Nhập mã phiếu..."
        :value="modelValue.ma_phieu"
        @input="updateField('ma_phieu', $event.target.value)"
        @keyup.enter="submit"
      />
    </div>

    <!-- 2. Ô nhập Tên Phiếu -->
    <div class="col-md-2">
      <label class="form-label fw-bold small text-muted mb-1">Tên phiếu giảm giá</label>
      <input
        type="text"
        class="form-control"
        placeholder="Nhập tên phiếu..."
        :value="modelValue.ten_phieu"
        @input="updateField('ten_phieu', $event.target.value)"
        @keyup.enter="submit"
      />
    </div>

    <!-- 3. Lọc Từ Ngày -->
    <div class="col-md-2">
      <label class="form-label fw-bold small text-muted mb-1">Từ ngày</label>
      <input
        type="date"
        class="form-control"
        :value="modelValue.tu_ngay"
        @input="updateField('tu_ngay', $event.target.value)"
      />
    </div>

    <!-- 4. Lọc Đến Ngày -->
    <div class="col-md-2">
      <label class="form-label fw-bold small text-muted mb-1">Đến ngày</label>
      <input
        type="date"
        class="form-control"
        :value="modelValue.den_ngay"
        @input="updateField('den_ngay', $event.target.value)"
      />
    </div>

    <!-- 5. Lọc Trạng Thái Khả Dụng (True / False) -->
    <div class="col-md-1">
      <label class="form-label fw-bold small text-muted mb-1">Hiệu lực</label>
      <select
        class="form-select form-control"
        :value="modelValue.kha_dung"
        @change="updateField('kha_dung', $event.target.value)"
      >
        <option value="">Tất cả</option>
        <option value="true">Còn hiệu lực</option>
        <option value="false">Hết hiệu lực</option>
      </select>
    </div>

    <!-- 6. Lọc Trạng Thái Khóa/Hoạt Động (True / False) -->
    <div class="col-md-2">
      <label class="form-label fw-bold small text-muted mb-1">Trạng thái khóa</label>
      <select
        class="form-select form-control"
        :value="modelValue.trang_thai"
        @change="updateField('trang_thai', $event.target.value)"
      >
        <option value="">-- Tất cả --</option>
        <option value="true">Hoạt động</option>
        <option value="false">Đã khóa</option>
      </select>
    </div>

    <!-- 7. Nút Thao tác (Tìm kiếm & Đặt lại) -->
    <div class="col-md-1 d-flex gap-1">
      <button
        class="btn btn-primary w-100"
        type="button"
        title="Tìm kiếm"
        @click="submit"
      >
        <i class="fas fa-search"></i>
      </button>
      <button
        class="btn btn-outline-secondary"
        type="button"
        title="Đặt lại bộ lọc"
        @click="resetSearch"
      >
        <i class="fas fa-undo"></i>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "PhieuGiamGiaSearch",
  props: {
    // modelValue dạng Object chứa thông tin tìm kiếm phiếu giảm giá
    modelValue: {
      type: Object,
      default: () => ({
        ma_phieu: "",
        ten_phieu: "",
        tu_ngay: "",
        den_ngay: "",
        kha_dung: "",   
        trang_thai: "", 
      }),
    },
  },
  emits: ["submit", "reset", "update:modelValue"],
  methods: {
    // Cập nhật từng trường vào object cha khi người dùng nhập/chọn
    updateField(key, value) {
      this.$emit("update:modelValue", {
        ...this.modelValue,
        [key]: value,
      });
    },
    // Phát sự kiện tìm kiếm
    submit() {
      this.$emit("submit");
    },
    // Đặt lại dữ liệu về trạng thái trống ban đầu
    resetSearch() {
      const defaultState = {
        ma_phieu: "",
        ten_phieu: "",
        tu_ngay: "",
        den_ngay: "",
        kha_dung: "",
        trang_thai: "",
      };
      this.$emit("update:modelValue", defaultState);
      this.$emit("reset");
    },
  },
};
</script>