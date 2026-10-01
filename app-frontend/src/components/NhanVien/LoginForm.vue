<template>
  <Form @submit="submitLogin" :validation-schema="loginFormSchema">
    <!-- Email -->
    <div class="form-group mb-3">
      <label for="email" class="form-label">
        Email <span class="text-danger">*</span>:
      </label>
      <div class="input-group">
        <span class="input-group-text"><i class="fas fa-envelope"></i></span>
        <Field
          name="email"
          type="email"
          class="form-control"
          v-model="loginLocal.email"
          placeholder="Nhập email nhân viên (VD: nhanvien@gmail.com)..."
        />
      </div>
      <ErrorMessage name="email" class="text-danger small mt-1 d-block" />
    </div>

    <!-- Mật khẩu -->
    <div class="form-group mb-3">
      <label for="mat_khau" class="form-label">
        Mật khẩu <span class="text-danger">*</span>:
      </label>
      <div class="input-group">
        <span class="input-group-text"><i class="fas fa-lock"></i></span>
        <Field
          name="mat_khau"
          :type="showPassword ? 'text' : 'password'"
          class="form-control"
          v-model="loginLocal.mat_khau"
          placeholder="Nhập mật khẩu..."
        />
        <button
          type="button"
          class="btn btn-outline-secondary"
          @click="showPassword = !showPassword"
        >
          <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
        </button>
      </div>
      <ErrorMessage name="mat_khau" class="text-danger small mt-1 d-block" />
    </div>

    <!-- Các nút hành động -->
    <div class="form-group d-grid gap-2 mt-4">
      <button type="submit" class="btn btn-primary btn-block">
        <i class="fas fa-sign-in-alt me-1"></i> Đăng nhập
      </button>
    </div>
  </Form>
</template>

<script>
import * as yup from "yup";
import { Form, Field, ErrorMessage } from "vee-validate";

export default {
  name: "LoginForm",
  components: {
    Form,
    Field,
    ErrorMessage,
  },
  props: {
    // Nhận dữ liệu ban đầu nếu có (mặc định để trống)
    loginData: {
      type: Object,
      default: () => ({
        email: "",
        mat_khau: "",
      }),
    },
  },
  emits: ["submit:login"],
  data() {
    // Validation schema kiểm tra dữ liệu đầu vào bằng Yup
    const loginFormSchema = yup.object().shape({
      email: yup
        .string()
        .required("Email không được để trống.")
        .email("Email không đúng định dạng."),
      mat_khau: yup
        .string()
        .required("Mật khẩu không được để trống.")
        .min(6, "Mật khẩu phải có ít nhất 6 ký tự."),
    });

    return {
      loginLocal: { ...this.loginData },
      loginFormSchema,
      showPassword: false, // Trạng thái ẩn/hiện mật khẩu
    };
  },
  watch: {
    loginData: {
      handler(newVal) {
        this.loginLocal = { ...newVal };
      },
      deep: true,
    },
  },
  methods: {
    // Bắn sự kiện gửi dữ liệu đăng nhập ra ngoài cho component cha
    submitLogin() {
      this.$emit("submit:login", this.loginLocal);
    },
  },
};
</script>

<style scoped>
.input-group-text {
  background-color: #f8f9fa;
}
</style>