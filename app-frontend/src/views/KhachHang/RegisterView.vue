<template>
  <div class="container my-5 col-md-6 col-lg-5">
    <div class="card shadow">
      <!-- Header Trang Đăng Ký -->
      <div class="card-header bg-primary text-white text-center py-3">
        <h4 class="mb-0 fw-bold">
          <i class="fas fa-user-plus me-2"></i>Đăng Ký Tài Khoản
        </h4>
        <small class="text-white-50"
          >Tạo tài khoản để mua sắm Laptop giá tốt nhất</small
        >
      </div>

      <!-- Body Trang Đăng Ký -->
      <div class="card-body p-4">
        <!-- Nhúng Component Form Đăng Ký Khách Hàng -->
        <KhachHangRegisterForm
          @submit:khachHang="registerKhachHang"
          @cancel="goBack"
        />

        <!-- Thông báo Trạng thái (Thành công / Lỗi) -->
        <div
          v-if="message"
          class="alert mt-3 mb-0 alert-dismissible fade show"
          :class="isError ? 'alert-danger' : 'alert-success'"
          role="alert"
        >
          <i
            :class="
              isError
                ? 'fas fa-exclamation-circle me-2'
                : 'fas fa-check-circle me-2'
            "
          ></i>
          {{ message }}
        </div>
      </div>

      <!-- Footer Trang Đăng Ký -->
      <div class="card-footer text-center py-3 bg-light">
        <span class="text-muted">Đã có tài khoản? </span>
        <router-link
          :to="{ name: 'khach-hang.login' }"
          class="text-primary fw-bold text-decoration-none"
        >
          Đăng nhập ngay
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import KhachHangRegisterForm from "@/components/KhachHang/RegisterForm.vue";
import KhachHangService from "@/services/khach-hang.service";

export default {
  name: "KhachHangRegister",
  components: {
    KhachHangRegisterForm,
  },
  data() {
    return {
      message: "",
      isError: false,
    };
  },
  methods: {
    async registerKhachHang(data) {
      try {
        this.message = "";
        this.isError = false;

        // Gọi API Đăng ký khách hàng (truyền JSON data)
        await KhachHangService.create(data);

        this.message =
          "Đăng ký tài khoản thành công! Đang chuyển hướng đăng nhập...";

        // Tự động chuyển qua trang Đăng nhập sau 1.5s
        setTimeout(() => {
          this.$router.push({ name: "khach-hang.login" });
        }, 1500);
      } catch (error) {
        console.error("Lỗi đăng ký:", error);
        this.isError = true;

        // Bắt câu thông báo lỗi trả về từ Express/Node.js backend
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin!";

        this.message = errorMessage;
      }
    },

    goBack() {
      // Quay lại trang chủ hoặc trang trước đó
      this.$router.push({ name: "home" });
    },
  },
};
</script>

<style scoped>
.card {
  border-radius: 10px;
  border: none;
}
.card-header {
  border-top-left-radius: 10px !important;
  border-top-right-radius: 10px !important;
}
</style>
