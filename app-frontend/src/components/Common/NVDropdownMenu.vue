<template>
  <div
    v-if="user"
    class="dropdown position-relative"
    v-click-outside="closeDropdown"
  >
    <a
      class="d-flex align-items-center text-white text-decoration-none cursor-pointer"
      id="userDropdown"
      role="button"
      @click="toggleDropdown"
    >
      <div class="d-none d-md-block text-start me-2">
        <div class="fw-bold fs-6 lh-1">{{ user.ho_ten }}</div>
        <small class="text-white-50" style="font-size: 0.75rem">
          {{ user.vai_tro?.ten_vai_tro || "Nhân viên" }}
        </small>
      </div>

      <!-- Avatar -->
      <UserAvatar
        :avatar-file-name="user.avatar"
        :name="user.ho_ten"
        user-type="NHAN_VIEN"
        :size="50"
      />
    </a>

    <!-- Menu thả xuống -->
    <ul
      class="dropdown-menu dropdown-menu-end shadow"
      :class="{ show: isOpen }"
      style="position: absolute; right: 0; top: 100%; margin-top: 0.5rem"
    >
      <li>
        <button class="dropdown-item text-danger" @click="onUpdateProfile">
          <i class="fas fa-user me-2"></i>Thông tin tài khoản
        </button>
      </li>
      <li><hr class="dropdown-divider" /></li>
      <li>
        <button class="dropdown-item text-danger" @click="onLogout">
          <i class="fas fa-sign-out-alt me-2"></i>Đăng xuất
        </button>
      </li>
    </ul>
  </div>

  <!-- Trạng thái: CHƯA ĐĂNG NHẬP -->
  <router-link
    v-else
    :to="{ name: 'admin.login' }"
    class="btn btn-outline-light btn-sm"
  >
    <i class="fas fa-sign-in-alt me-1"></i> Đăng nhập
  </router-link>
</template>

<script>
import UserAvatar from "@/components/Common/UserAvatar.vue";

export default {
  name: "NVDropdownMenu",
  components: {
    UserAvatar,
  },
  props: {
    user: {
      type: Object,
      default: null,
    },
    isOpen: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["toggle", "close", "logout", "update-profile"],
  methods: {
    toggleDropdown() {
      this.$emit("toggle");
    },
    closeDropdown() {
      this.$emit("close");
    },
    onUpdateProfile() {
      this.$emit("update-profile");
    },
    onLogout() {
      this.$emit("logout");
    },
  },
};
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
