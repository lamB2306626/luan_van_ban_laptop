<template>
  <div class="user-avatar-wrapper d-inline-block">
    <!-- Trường hợp 1: Có file ảnh đại diện -->
    <img
      v-if="avatarFileName"
      :src="avatarUrl"
      :alt="name || 'Avatar'"
      class="rounded-circle object-fit-cover shadow-sm border"
      :style="avatarStyle"
    />

    <!-- Trường hợp 2: Không có ảnh -> Hiện chữ cái đại diện (Đổi màu nền tự động theo userType) -->
    <div
      v-else
      class="rounded-circle fw-bold d-flex align-items-center justify-content-center shadow-sm"
      :class="computedBgClass"
      :style="avatarStyle"
    >
      {{ initials }}
    </div>
  </div>
</template>

<script>
const API_URL = import.meta.env.VITE_API_BASE_URL || "";

export default {
  name: "UserAvatar",
  props: {
    avatarFileName: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      default: "",
    },
    // Khách hàng hoặc Nhân viên
    userType: {
      type: String,
      default: "KHACH_HANG",
    },
    size: {
      type: Number,
      default: 35,
    },
    // Cho phép tùy chỉnh màu nền riêng cho Khách Hàng (Mặc định: Xanh dương)
    bgKHClass: {
      type: String,
      default: "bg-primary text-white",
    },
    // Cho phép tùy chỉnh màu nền riêng cho Nhân Viên (Mặc định: Vàng / Warning)
    bgNVClass: {
      type: String,
      default: "bg-warning text-dark",
    },
    defaultInitials: {
      type: String,
      default: "U",
    },
  },
  computed: {
    // Tự động chọn class màu dựa trên userType
    computedBgClass() {
      if (this.userType === "NHAN_VIEN") {
        return this.bgNVClass;
      }
      return this.bgKHClass;
    },

    avatarUrl() {
      if (!this.avatarFileName) return "";
      if (this.userType === "NHAN_VIEN")
        return `${API_URL}/uploads/NhanVien/${this.avatarFileName}`;
      return `${API_URL}/public/uploads/KhachHang/${this.avatarFileName}`;
    },

    initials() {
      if (!this.name) return this.defaultInitials;
      const parts = this.name.trim().split(" ");
      return parts.length > 1
        ? parts[parts.length - 1].charAt(0).toUpperCase()
        : this.name.charAt(0).toUpperCase();
    },

    avatarStyle() {
      return {
        width: `${this.size}px`,
        height: `${this.size}px`,
        fontSize: `${Math.round(this.size * 0.4)}px`,
      };
    },
  },
};
</script>

<style scoped>
.object-fit-cover {
  object-fit: cover;
}
</style>
