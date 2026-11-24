<template>
  <ul class="nav nav-pills nav-fill mb-4 bg-white p-2 rounded shadow-sm border">
    <li class="nav-item" v-for="tab in tabs" :key="tab.value">
      <button
        class="nav-link fw-semibold"
        :class="{ active: modelValue === tab.value }"
        @click="selectTab(tab.value)"
      >
        {{ tab.label }}
      </button>
    </li>
  </ul>
</template>

<script>
export default {
  name: "TrangThaiOrderTabs",
  props: {
    // Nhận trạng thái tab đang chọn thông qua v-model
    modelValue: {
      type: String,
      default: "ALL",
    },
  },
  emits: ["update:modelValue", "change-tab"],
  data() {
    return {
      tabs: [
        { label: "Tất cả", value: "ALL" },
        { label: "Chờ duyệt", value: "CHO_DUYET" },
        { label: "Đang giao", value: "DANG_VAN_CHUYEN" },
        { label: "Hoàn tất", value: "HOAN_THANH" },
        { label: "Nhân viên hủy", value: "NV_HUY" },
        { label: "Khách hàng hủy", value: "KH_HUY" },
        { label: "Giao thất bại", value: "GIAO_THAT_BAI" },
      ],
    };
  },
  methods: {
    selectTab(tabValue) {
      if (this.modelValue !== tabValue) {
        // // Cập nhật giá trị v-model
        // this.$emit("update:modelValue", tabValue);
        // Phát sự kiện change-tab để trang cha gọi API refetch lại dữ liệu
        this.$emit("change-tab", tabValue);
      }
    },
  },
};
</script>

<style scoped>
.nav-pills .nav-link {
  border-radius: 0.375rem;
  color: #495057;
}
.nav-pills .nav-link.active {
  background-color: #0d6efd;
  color: #fff;
}
</style>
