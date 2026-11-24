<template>
  <div id="auth-admin-layout">
    <!-- Thanh điều hướng (Navbar) dành riêng cho Admin -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark px-3">
      <div class="container-fluid">
        <router-link :to="{ name: 'admin.home' }" class="navbar-brand">
          Ứng Dụng Quản Lý (Admin)
        </router-link>

        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#adminNavbarNav"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
      </div>
    </nav>

    <!-- Nơi các trang con của Admin hiển thị -->
    <div class="container mt-3">
      <router-view />
    </div>
  </div>
</template>

<script>
export default {
  name: "AuthAdminLayout",
};
</script>
