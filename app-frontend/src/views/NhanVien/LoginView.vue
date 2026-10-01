<template>
  <div class="container mt-5" style="max-width: 450px">
    <div class="card shadow-sm border-0 rounded-3">
      <div class="card-body p-4">
        <h3 class="text-center mb-4 text-primary font-weight-bold">
          <i class="fas fa-user-shield me-2"></i>ĐĂNG NHẬP NHÂN VIÊN
        </h3>

        <!-- Thông báo lỗi đăng nhập (nếu có) -->
        <div v-if="errorMessage" class="alert alert-danger py-2 small">
          {{ errorMessage }}
        </div>

        <LoginForm @submit:login="handleLogin" />
      </div>
    </div>
  </div>
</template>

<script>
import LoginForm from "@/components/NhanVien/LoginForm.vue";
import NhanVienService from "@/services/nhan-vien.service";

export default {
  name: "LoginView",
  components: {
    LoginForm,
  },
  data() {
    return {
      errorMessage: "",
    };
  },
  methods: {
    async handleLogin(credentials) {
      try {
        const response = await NhanVienService.login(credentials);
        // Lưu thông tin người dùng vào localStorage hoặc Vuex/Pinia
        localStorage.setItem("user", JSON.stringify(response.user));

        // Chuyển hướng sang trang quản trị / trang chủ
        this.$router.push({ name: "danh-muc.home" });
      } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        this.errorMessage =
          error.response?.data?.message ||
          "Đăng nhập thất bại. Vui lòng kiểm tra lại!";
      }
    },
  },
};
</script>
