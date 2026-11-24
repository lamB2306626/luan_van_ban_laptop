<template>
  <div id="auth-client-layout">
    <!-- Thanh điều hướng (Navbar) Tone Trắng Sáng Sang Trọng -->
    <nav
      class="navbar navbar-expand-lg navbar-light bg-white sticky-top main-navbar shadow-sm py-2"
    >
      <!-- Dùng container để giới hạn độ rộng cân bằng 100% với trang chủ 90% bên dưới -->
      <div class="container-fluid mx-auto" style="max-width: 90%">
        <!-- 1. BÊN TRÁI: Logo + Links -->
        <div class="d-flex align-items-center">
          <!-- Logo với Gradient hoặc Icon đẹp mắt -->
          <router-link
            :to="{ name: 'trang-chu.home' }"
            class="navbar-brand fw-bold text-primary fs-4 me-4 d-flex align-items-center gap-2"
          >
            <span class="brand-text">Laptop Store</span>
          </router-link>

          <button
            class="navbar-toggler me-2 border-0 shadow-none"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#clientNavbarNav"
          >
            <span class="navbar-toggler-icon"></span>
          </button>
        </div>
      </div>
    </nav>

    <!-- Nơi các trang con hiển thị -->
    <div class="mt-3">
      <router-view />
    </div>
  </div>
</template>

<script>
export default {
  name: "AuthKHLayout",
};
</script>

<style scoped>
/* Main Navbar Styling */
.main-navbar {
  border-bottom: 1px solid #f1f5f9;
  backdrop-filter: blur(8px);
  background-color: rgba(255, 255, 255, 0.95) !important;
}

.brand-text {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  letter-spacing: -0.3px;
}

.custom-nav-link:hover,
.router-link-active.custom-nav-link {
  color: #2563eb !important;
  background-color: #eff6ff;
}
</style>
