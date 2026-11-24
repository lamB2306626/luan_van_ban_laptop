<template>
  <div class="container my-5 col-md-6 col-lg-5">
    <div class="card shadow">
      <!-- Header Trang Đăng Nhập -->
      <div class="card-header bg-primary text-white text-center py-3">
        <h4 class="mb-0 fw-bold">
          <i class="fas fa-sign-in-alt me-2"></i>Đăng Nhập Khách Hàng
        </h4>
        <small class="text-white-50"
          >Chào mừng bạn quay trở lại với Laptop Store</small
        >
      </div>

      <!-- Body Trang Đăng Nhập -->
      <div class="card-body p-4">
        <!-- 1. Form Đăng nhập Thường -->
        <KhachHangLoginForm @submit:login="handleLogin" @cancel="goBack" />

        <!-- 2. Đường phân cách OR -->
        <div class="d-flex align-items-center my-3">
          <hr class="flex-grow-1" />
          <span class="px-2 text-muted small">HOẶC</span>
          <hr class="flex-grow-1" />
        </div>

        <!-- 3. Nút Đăng nhập Mạng xã hội (Google & Facebook) -->
        <div class="d-flex flex-column align-items-center gap-2">
          <!-- Nút Google (Tự động render từ Google SDK) -->
          <div id="google-btn"></div>

          <!-- Nút Facebook -->
          <button
            type="button"
            class="btn btn-facebook w-100 py-2 fw-semibold d-flex align-items-center justify-content-center"
            style="max-width: 300px"
            @click="loginWithFacebook"
          >
            <i class="fab fa-facebook-f me-2 fs-5"></i>
            Đăng nhập bằng Facebook
          </button>
        </div>

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

      <!-- Footer Trang Đăng Nhập -->
      <div class="card-footer text-center py-3 bg-light">
        <span class="text-muted">Chưa có tài khoản? </span>
        <router-link
          :to="{ name: 'khach-hang.register' }"
          class="text-primary fw-bold text-decoration-none"
        >
          Đăng ký ngay
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import KhachHangLoginForm from "@/components/KhachHang/LoginForm.vue";
import KhachHangService from "@/services/khach-hang.service";

export default {
  name: "KhachHangLogin",
  components: {
    KhachHangLoginForm,
  },
  data() {
    return {
      message: "",
      isError: false,
    };
  },
  mounted() {
    // Tự động tải SDK và khởi tạo cho cả Google & Facebook khi vào trang
    this.loadGoogleSDK();
    this.initFacebookLogin();
  },
  methods: {
    // ================= 1. ĐĂNG NHẬP THƯỜNG (EMAIL & PASSWORD) =================
    async handleLogin(credentials) {
      try {
        this.message = "";
        this.isError = false;

        const response = await KhachHangService.login(credentials);

        const rawUser = response?.user || response;
        const userData = { ...rawUser, role: "khachhang" };

        localStorage.setItem("user", JSON.stringify(userData));
        if (response.token) {
          localStorage.setItem("userToken", response.token);
        }

        this.message = "Đăng nhập thành công! Đang chuyển hướng...";
        setTimeout(() => {
          const redirectPath = this.$route.query.redirect;
          if (redirectPath) {
            this.$router.push(redirectPath);
          } else {
            this.$router.push({ name: "trang-chu.home" });
          }
        }, 1000);
      } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        this.isError = true;
        this.message =
          error.response?.data?.message ||
          "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!";
      }
    },

    goBack() {
      this.$router.push({ name: "san-pham.home" });
    },

    // ================= 2. CẤU HÌNH GOOGLE SIGN-IN =================
    loadGoogleSDK() {
      if (window.google && window.google.accounts) {
        this.initGoogleLogin();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.initGoogleLogin();
      };
      document.head.appendChild(script);
    },

    initGoogleLogin() {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id:
            "123250462571-d7bggil4n0be4kpp5pkgcor11mssntgc.apps.googleusercontent.com",
          callback: this.handleGoogleCallback,
          auto_select: false,
          ux_mode: "popup",
        });

        window.google.accounts.id.renderButton(
          document.getElementById("google-btn"),
          {
            theme: "outline",
            size: "large",
            text: "signin_with",
            width: "300",
          },
        );
      }
    },

    async handleGoogleCallback(response) {
      try {
        this.message = "";
        this.isError = false;

        const googleToken = response.credential;
        const res = await KhachHangService.loginWithGoogle({
          token: googleToken,
        });

        const rawUser = res?.user || res;
        const userData = { ...rawUser, role: "khachhang" };

        localStorage.setItem("user", JSON.stringify(userData));
        if (res.token) {
          localStorage.setItem("userToken", res.token);
        }

        this.message = "Đăng nhập Google thành công! Đang chuyển hướng...";
        setTimeout(() => {
          const redirectPath = this.$route.query.redirect;
          if (redirectPath) {
            this.$router.push(redirectPath);
          } else {
            this.$router.push({ name: "trang-chu.home" });
          }
        }, 1000);
      } catch (error) {
        console.error("Lỗi đăng nhập Google:", error);
        this.isError = true;
        this.message =
          error.response?.data?.message || "Đăng nhập bằng Google thất bại!";
      }
    },

    // ================= 3. CẤU HÌNH FACEBOOK LOGIN =================
    initFacebookLogin() {
      window.fbAsyncInit = function () {
        window.FB.init({
          appId: "1487746406528992", // App ID Facebook của bạn
          cookie: true,
          xfbml: true,
          version: "v19.0",
        });
      };

      (function (d, s, id) {
        var js,
          fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s);
        js.id = id;
        js.src = "https://connect.facebook.net/vi_VN/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      })(document, "script", "facebook-jssdk");
    },

    loginWithFacebook() {
      if (!window.FB) {
        this.isError = true;
        this.message =
          "Facebook SDK chưa tải xong, vui lòng chờ trong giây lát!";
        return;
      }

      window.FB.login(
        (response) => {
          if (response.authResponse) {
            const facebookToken = response.authResponse.accessToken;
            this.handleFacebookCallback(facebookToken);
          } else {
            console.log("Người dùng đã hủy đăng nhập Facebook.");
          }
        },
        { scope: "public_profile,email" }, // Đã thêm xin quyền email
      );
    },

    async handleFacebookCallback(facebookToken) {
      try {
        this.message = "";
        this.isError = false;

        const res = await KhachHangService.loginWithFacebook({
          token: facebookToken,
        });

        const rawUser = res?.user || res;
        if (!rawUser || !rawUser.id) {
          throw new Error("Không lấy được thông tin tài khoản từ hệ thống!");
        }

        const userData = { ...rawUser, role: "khachhang" };

        localStorage.setItem("user", JSON.stringify(userData));
        if (res.token) {
          localStorage.setItem("userToken", res.token);
        }

        this.message = "Đăng nhập Facebook thành công! Đang chuyển hướng...";
        setTimeout(() => {
          const redirectPath = this.$route.query.redirect;
          if (redirectPath) {
            this.$router.push(redirectPath);
          } else {
            this.$router.push({ name: "trang-chu.home" });
          }
        }, 1000);
      } catch (error) {
        console.error("Lỗi đăng nhập Facebook:", error);
        this.isError = true;
        this.message =
          error.response?.data?.message ||
          error.message ||
          "Đăng nhập bằng Facebook thất bại!";
      }
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

/* Nút bấm Facebook chuẩn giao diện */
.btn-facebook {
  background-color: #1877f2;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  transition: background-color 0.2s ease-in-out;
}

.btn-facebook:hover {
  background-color: #166fe5;
  color: #ffffff;
}
</style>
