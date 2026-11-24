<template>
  <Form @submit="submitKhachHang" :validation-schema="khachHangFormSchema">
    <!-- Họ và Tên -->
    <div class="form-group mb-3">
      <label for="ho_ten">
        Họ Và Tên <span class="text-danger">*</span>:
      </label>
      <Field
        name="ho_ten"
        type="text"
        class="form-control"
        v-model="khachHangLocal.ho_ten"
        placeholder="VD: Nguyễn Văn A"
      />
      <ErrorMessage name="ho_ten" class="text-danger small" />
    </div>

    <!-- Email -->
    <div class="form-group mb-3">
      <label for="email"> Email <span class="text-danger">*</span>: </label>
      <Field
        name="email"
        type="email"
        class="form-control"
        v-model="khachHangLocal.email"
        placeholder="VD: nguyenvana@gmail.com"
      />
      <ErrorMessage name="email" class="text-danger small" />
    </div>

    <!-- Mật khẩu -->
    <div class="form-group mb-3">
      <label for="mat_khau">
        Mật Khẩu <span class="text-danger">*</span>:
      </label>
      <div class="input-group">
        <Field
          name="mat_khau"
          :type="showPassword ? 'text' : 'password'"
          class="form-control"
          v-model="khachHangLocal.mat_khau"
          placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
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

    <!-- Xác nhận mật khẩu (Chỉ dùng kiểm tra trên Form, không gửi xuống DB) -->
    <div class="form-group mb-3">
      <label for="xac_nhan_mat_khau">
        Xác Nhận Mật Khẩu <span class="text-danger">*</span>:
      </label>
      <Field
        name="xac_nhan_mat_khau"
        type="password"
        class="form-control"
        v-model="khachHangLocal.xac_nhan_mat_khau"
        placeholder="Nhập lại mật khẩu"
      />
      <ErrorMessage name="xac_nhan_mat_khau" class="text-danger small" />
    </div>

    <!-- Nút Đăng ký & Hủy -->
    <div
      class="form-group mt-4 d-flex justify-content-between align-items-center"
    >
      <button type="button" class="btn btn-outline-secondary" @click="cancel">
        <i class="fas fa-arrow-left me-1"></i> Quay lại
      </button>

      <button class="btn btn-primary" :disabled="isSubmitting">
        <i class="fas fa-user-plus me-1"></i>
        {{ isSubmitting ? "Đang xử lý..." : "Đăng Ký Tài Khoản" }}
      </button>
    </div>
  </Form>
</template>

<script>
import * as yup from "yup";
import { Form, Field, ErrorMessage } from "vee-validate";

export default {
  name: "KhachHangRegisterForm",
  components: {
    Form,
    Field,
    ErrorMessage,
  },
  props: {
    // Nhận prop từ component cha nếu muốn truyền dữ liệu sẵn (mặc định để trống)
    khachHang: {
      type: Object,
      default: () => ({
        ho_ten: "",
        email: "",
        mat_khau: "",
        xac_nhan_mat_khau: "",
      }),
    },
  },
  emits: ["submit:khachHang", "cancel"],
  data() {
    // Schema validate dữ liệu bằng Yup cho Khách hàng
    const khachHangFormSchema = yup.object().shape({
      ho_ten: yup
        .string()
        .required("Họ và tên không được để trống.")
        .max(50, "Họ tên tối đa 50 ký tự."),

      email: yup
        .string()
        .required("Email không được để trống.")
        .email("Email không đúng định dạng.")
        .max(50, "Email tối đa 50 ký tự."),

      mat_khau: yup
        .string()
        .required("Mật khẩu không được để trống.")
        .min(6, "Mật khẩu tối thiểu 6 ký tự.")
        .max(50, "Mật khẩu tối đa 50 ký tự."),

      xac_nhan_mat_khau: yup
        .string()
        .required("Vui lòng xác nhận lại mật khẩu.")
        .oneOf([yup.ref("mat_khau")], "Xác nhận mật khẩu không trùng khớp."),
    });

    return {
      khachHangLocal: { ...this.khachHang },
      khachHangFormSchema,
      isSubmitting: false,
      showPassword: false, // Trạng thái ẩn/hiện mật khẩu
    };
  },
  methods: {
    // Toggle ẩn/hiện mật khẩu
    toggleShowPassword() {
      this.showPassword = !this.showPassword;
    },

    // Phát sự kiện submit dữ liệu ra ngoài cho Component Cha
    submitKhachHang() {
      this.isSubmitting = true;

      // Đăng ký khách hàng gửi dạng JSON object thay vì FormData
      // (Vì không có file Upload như ở NhanVienForm)
      const dataToSubmit = {
        ho_ten: this.khachHangLocal.ho_ten,
        email: this.khachHangLocal.email,
        mat_khau: this.khachHangLocal.mat_khau,
      };

      this.$emit("submit:khachHang", dataToSubmit);

      // Reset trạng thái sau khi emit
      setTimeout(() => {
        this.isSubmitting = false;
      }, 1000);
    },

    cancel() {
      this.$emit("cancel");
    },
  },
};
</script>

<style scoped>
/* Tuỳ chỉnh nhỏ cho nút ẩn hiện mật khẩu nằm cùng hàng input */
.input-group .btn {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
</style>
