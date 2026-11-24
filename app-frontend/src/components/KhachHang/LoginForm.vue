<template>
  <Form @submit="submitLogin" :validation-schema="loginFormSchema">
    <!-- Email -->
    <div class="form-group mb-3">
      <label for="email"> Email <span class="text-danger">*</span>: </label>
      <Field
        name="email"
        type="email"
        class="form-control"
        v-model="loginLocal.email"
        placeholder="VD: nguyenvana@gmail.com"
      />
      <ErrorMessage name="email" class="text-danger small" />
    </div>

    <!-- Mật khẩu -->
    <div class="form-group mb-3">
      <div class="d-flex justify-content-between align-items-center">
        <label for="mat_khau">
          Mật Khẩu <span class="text-danger">*</span>:
        </label>
        <!-- Thêm link Quên mật khẩu nếu sau này bạn mở rộng -->
        <a
          href="#"
          class="small text-decoration-none text-muted"
          @click.prevent="forgotPassword"
        >
          Quên mật khẩu?
        </a>
      </div>
      <div class="input-group">
        <Field
          name="mat_khau"
          :type="showPassword ? 'text' : 'password'"
          class="form-control"
          v-model="loginLocal.mat_khau"
          placeholder="Nhập mật khẩu của bạn"
        />
        <button
          type="button"
          class="btn btn-outline-secondary"
          @click="toggleShowPassword"
        >
          <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
        </button>
      </div>
      <ErrorMessage name="mat_khau" class="text-danger small" />
    </div>

    <!-- Ghi nhớ đăng nhập (Checkbox tùy chọn) -->
    <div class="form-check mb-3">
      <input
        class="form-check-input"
        type="checkbox"
        id="rememberMe"
        v-model="loginLocal.rememberMe"
      />
      <label class="form-check-label small" for="rememberMe">
        Ghi nhớ đăng nhập
      </label>
    </div>

    <!-- Nút Đăng nhập & Hủy -->
    <div
      class="form-group mt-4 d-flex justify-content-between align-items-center"
    >
      <button type="button" class="btn btn-outline-secondary" @click="cancel">
        <i class="fas fa-arrow-left me-1"></i> Trở về
      </button>

      <button class="btn btn-primary px-4" :disabled="isSubmitting">
        <i class="fas fa-sign-in-alt me-1"></i>
        {{ isSubmitting ? "Đang xử lý..." : "Đăng Nhập" }}
      </button>
    </div>
  </Form>

  <!-- 🟢 Đường phân cách (Divider) -->
  <div class="divider my-4">
    <span>HOẶC ĐĂNG NHẬP BẰNG</span>
  </div>

  <!-- 🟢 Khối nút Social Login (Google & Facebook) -->
  <div class="social-login-container d-flex flex-column gap-3">
    <!-- Nút Google (Khung chứa Google SDK Render) -->
    <div id="google-btn" class="google-btn-wrapper"></div>

    <!-- Nút Facebook chuẩn thiết kế -->
  </div>
</template>

<script>
import * as yup from "yup";
import { Form, Field, ErrorMessage } from "vee-validate";

export default {
  name: "KhachHangLoginForm",
  components: {
    Form,
    Field,
    ErrorMessage,
  },
  props: {
    loginData: {
      type: Object,
      default: () => ({
        email: "",
        mat_khau: "",
        rememberMe: false,
      }),
    },
  },
  emits: ["submit:login", "cancel", "forgot-password"],
  data() {
    // Schema validate cho Đăng nhập
    const loginFormSchema = yup.object().shape({
      email: yup
        .string()
        .required("Vui lòng nhập Email đăng nhập.")
        .email("Email không đúng định dạng."),
      mat_khau: yup.string().required("Vui lòng nhập mật khẩu."),
    });

    return {
      loginLocal: { ...this.loginData },
      loginFormSchema,
      isSubmitting: false,
      showPassword: false,
    };
  },
  methods: {
    toggleShowPassword() {
      this.showPassword = !this.showPassword;
    },

    submitLogin() {
      this.isSubmitting = true;

      const dataToSubmit = {
        email: this.loginLocal.email,
        mat_khau: this.loginLocal.mat_khau,
        rememberMe: this.loginLocal.rememberMe,
      };

      this.$emit("submit:login", dataToSubmit);

      setTimeout(() => {
        this.isSubmitting = false;
      }, 1000);
    },

    cancel() {
      this.$emit("cancel");
    },

    forgotPassword() {
      this.$emit("forgot-password");
    },
  },
};
</script>

<style scoped>
.input-group .btn {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
</style>
