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
      <div class="d-none d-md-block text-start mr-2">
        <div class="fw-bold text-dark mr-2">{{ user.ho_ten }}</div>
        <small class="text-dark-50" style="font-size: 0.75rem">
          {{ user.hang_thanh_vien?.ten_hang }}
        </small>
      </div>

      <!-- Avatar -->
      <UserAvatar
        :avatar-file-name="user.avatar"
        :name="user.ho_ten"
        user-type="KHACH_HANG"
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
    :to="{ name: 'khach-hang.login' }"
    class="btn btn-secondary"
  >
    <i class="fas fa-sign-in-alt me-1"></i> Đăng nhập
  </router-link>
</template>

<script>
import UserAvatar from "@/components/Common/UserAvatar.vue";

export default {
  name: "KHDropdownMenu",
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
