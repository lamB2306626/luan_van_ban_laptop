<template>
  <div id="app">
    <!-- Thanh điều hướng (Header/Navbar) -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark px-3">
      <div class="container-fluid">
        <router-link :to="{ name: 'danh-muc.home' }" class="navbar-brand">
          Ứng Dụng Quản Lý
        </router-link>

        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarNav">
          <!-- Danh sách Menu chính -->
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <router-link :to="{ name: 'danh-muc.home' }" class="nav-link">
                Quản lý Danh Mục
              </router-link>
            </li>

            <li class="nav-item">
              <router-link :to="{ name: 'thuong-hieu.home' }" class="nav-link">
                Quản lý Thương Hiệu
              </router-link>
            </li>

            <!-- <li class="nav-item">
              <router-link :to="{ name: 'nha-cung-cap.home' }" class="nav-link">
                Quản lý Nhà Cung Cấp
              </router-link>
            </li> -->

            <li class="nav-item">
              <router-link :to="{ name: 'mau-sac.home' }" class="nav-link">
                Quản lý Màu Sắc
              </router-link>
            </li>

            <li class="nav-item">
              <router-link :to="{ name: 'san-pham.home' }" class="nav-link">
                Quản lý Sản Phẩm
              </router-link>
            </li>

            <li class="nav-item">
              <router-link :to="{ name: 'nhan-vien.home' }" class="nav-link">
                Quản lý Nhân Viên
              </router-link>
            </li>

            <li class="nav-item">
              <router-link :to="{ name: 'phieu-nhap.home' }" class="nav-link">
                Quản lý Phiếu Nhập
              </router-link>
            </li>

            <li class="nav-item">
              <router-link
                :to="{ name: 'dot-khuyen-mai.home' }"
                class="nav-link"
              >
                Quản lý Đợt Khuyến Mãi
              </router-link>
            </li>

            <li class="nav-item">
              <router-link
                :to="{ name: 'phieu-giam-gia.home' }"
                class="nav-link"
              >
                Quản lý Phiếu Giảm Giá
              </router-link>
            </li>

            <li class="nav-item">
              <router-link
                :to="{ name: 'hang-thanh-vien.home' }"
                class="nav-link"
              >
                Quản lý Hạng Thành Viên
              </router-link>
            </li>

            <li class="nav-item">
              <router-link
                :to="{ name: 'thong-bao.home' }"
                class="nav-link"
              >
                Quản lý Hạng Thông Báo
              </router-link>
            </li>
          </ul>

          <!-- KHOẢNG TÀI KHOẢN (GÓC PHẢI NAVBAR) -->
          <div class="d-flex align-items-center">
            <!-- Trạng thái 1: ĐÃ ĐĂNG NHẬP -->
            <div
              v-if="currentUser"
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
                  <div class="fw-bold fs-6 lh-1">{{ currentUser.ho_ten }}</div>
                  <small class="text-white-50" style="font-size: 0.75rem">
                    {{ currentUser.vai_tro?.ten_vai_tro || "Nhân viên" }}
                  </small>
                </div>

                <!-- Avatar: Hiện ảnh nếu có, ngược lại hiện chữ cái đầu -->
                <div
                  class="avatarr-circle mr-2 me-2 position-relative overflow-hidden"
                >
                  <img
                    v-if="currentUser.avatar"
                    :src="getAvatarUrl(currentUser.avatar)"
                    alt="Avatar"
                    class="w-100 h-100 rounded-circle"
                    style="object-fit: cover"
                    @error="handleAvatarError"
                  />
                  <span v-else>
                    {{ avatarrInitial }}
                  </span>
                </div>
              </a>

              <!-- Menu thả xuống (thêm class show khi isDropdownOpen = true) -->
              <ul
                class="dropdown-menu dropdown-menu-end shadow"
                :class="{ show: isDropdownOpen }"
                style="position: absolute; right: 0; top: 100%; mt-2"
              >
                <li>
                  <button
                    class="dropdown-item text-danger"
                    @click="goToUpdateNhanVienOne"
                  >
                    <i class="fas fa-user me-2"></i>Thông tin tài khoản
                  </button>
                </li>
                <li><hr class="dropdown-divider" /></li>
                <li>
                  <button
                    class="dropdown-item text-danger"
                    @click="handleLogout"
                  >
                    <i class="fas fa-sign-out-alt me-2"></i>Đăng xuất
                  </button>
                </li>
              </ul>
            </div>

            <!-- Trạng thái 2: CHƯA ĐĂNG NHẬP -->
            <router-link
              v-else
              :to="{ name: 'admin-login' }"
              class="btn btn-outline-light btn-sm"
            >
              <i class="fas fa-sign-in-alt me-1"></i> Đăng nhập
            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <!-- Nội dung hiển thị thay đổi theo Route -->
    <div class="container mt-3">
      <router-view />
    </div>
  </div>
</template>

<script>
const API_URL = import.meta.env.VITE_API_BASE_URL;

export default {
  name: "App",
  data() {
    return {
      currentUser: null,
      isDropdownOpen: false, // Biến kiểm soát ẩn/hiện menu
    };
  },
  computed: {
    avatarrInitial() {
      if (!this.currentUser?.ho_ten) return "U";
      const nameParts = this.currentUser.ho_ten.trim().split(" ");
      const lastName = nameParts[nameParts.length - 1];
      return lastName.charAt(0).toUpperCase();
    },
  },
  methods: {
    // Hàm tạo URL hiển thị ảnh avatar từ server
    getAvatarUrl(avatarFileName) {
      if (!avatarFileName) return "";
      // Nếu avatar đã là đường dẫn đầy đủ (http...) thì giữ nguyên
      if (avatarFileName.startsWith("http")) return avatarFileName;
      return `${API_URL}/uploads/NhanVien/${avatarFileName}`;
    },

    // Xử lý khi đường dẫn ảnh bị lỗi (404/hỏng) -> Tự động quay về hiện chữ cái đầu
    handleAvatarError(event) {
      this.currentUser.avatar = null;
    },

    toggleDropdown() {
      this.isDropdownOpen = !this.isDropdownOpen;
    },
    closeDropdown() {
      this.isDropdownOpen = false;
    },
    loadUser() {
      const user = localStorage.getItem("user");
      if (user) {
        try {
          this.currentUser = JSON.parse(user);
        } catch (e) {
          this.currentUser = null;
        }
      } else {
        this.currentUser = null;
      }
    },
    handleLogout() {
      this.isDropdownOpen = false;
      localStorage.removeItem("user");
      this.currentUser = null;
      this.$router.push({ name: "admin-login" });
    },

    goToUpdateNhanVienOne() {
      this.$router.push({
        name: "nhan-vien.edit-one",
        params: { id: this.currentUser.id },
      });
    },
  },
  created() {
    this.loadUser();
  },
  watch: {
    $route() {
      this.isDropdownOpen = false; // Đóng dropdown khi đổi trang
      this.loadUser();
    },
  },
};
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.avatarr-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background-color: #0d6efd; /* Màu nền khi hiển thị chữ cái */
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1rem;
}
</style>
