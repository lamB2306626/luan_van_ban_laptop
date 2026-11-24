<template>
  <Form @submit="submitProfile" :validation-schema="profileFormSchema">
    <!-- Phần Avatar -->
    <div class="form-group mb-3">
      <label for="avatar">Ảnh avatar:</label>
      <input
        type="file"
        id="avatar"
        class="form-control"
        accept="image/*"
        @change="handleFileChange"
      />

      <!-- Khung xem trước (Preview) ảnh -->
      <div v-if="previewImage" class="mt-2 text-center">
        <img
          :src="previewImage"
          alt="Preview Image"
          class="img-thumbnail"
          style="max-height: 120px; object-fit: contain"
        />
      </div>
    </div>

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

    <!-- Email (Thường để readonly hoặc disabled vì định danh tài khoản, cho phép hiển thị) -->
    <div class="form-group mb-3">
      <label for="email"> Email <span class="text-danger">*</span>: </label>
      <Field
        name="email"
        type="email"
        class="form-control"
        v-model="khachHangLocal.email"
        placeholder="VD: nguyenvana@gmail.com"
        disabled
      />
      <small class="form-text text-muted"
        >Email đăng nhập không thể thay đổi.</small
      >
      <ErrorMessage name="email" class="text-danger small" />
    </div>

    <!-- Số Điện Thoại -->
    <div class="form-group mb-3">
      <label for="so_dien_thoai"> Số Điện Thoại: </label>
      <Field
        name="so_dien_thoai"
        type="text"
        class="form-control"
        v-model="khachHangLocal.so_dien_thoai"
        placeholder="VD: 0912345678"
      />
      <ErrorMessage name="so_dien_thoai" class="text-danger small" />
    </div>

    <!-- Ngày Sinh -->
    <div class="form-group mb-3">
      <label for="ngay_sinh"> Ngày Sinh: </label>
      <Field
        name="ngay_sinh"
        type="date"
        class="form-control"
        v-model="khachHangLocal.ngay_sinh"
      />
      <ErrorMessage name="ngay_sinh" class="text-danger small" />
    </div>

    <hr class="my-4" />
    <h5 class="mb-3 text-secondary">
      Đổi Mật Khẩu (Bỏ trống nếu không muốn thay đổi)
    </h5>

    <!-- Mật khẩu mới -->
    <div class="form-group mb-3">
      <label for="mat_khau_moi"> Mật Khẩu Mới: </label>
      <div class="input-group">
        <Field
          name="mat_khau_moi"
          :type="showPassword ? 'text' : 'password'"
          class="form-control"
          v-model="khachHangLocal.mat_khau_moi"
          placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự nếu muốn đổi)"
        />
        <button
          type="button"
          class="btn btn-outline-secondary"
          @click="toggleShowPassword"
        >
          <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
        </button>
      </div>
      <ErrorMessage name="mat_khau_moi" class="text-danger small" />
    </div>

    <!-- Xác nhận mật khẩu mới -->
    <div class="form-group mb-3">
      <label for="xac_nhan_mat_khau_moi"> Xác Nhận Mật Khẩu Mới: </label>
      <Field
        name="xac_nhan_mat_khau_moi"
        type="password"
        class="form-control"
        v-model="khachHangLocal.xac_nhan_mat_khau_moi"
        placeholder="Nhập lại mật khẩu mới"
      />
      <ErrorMessage name="xac_nhan_mat_khau_moi" class="text-danger small" />
    </div>

    <!-- Nút Cập nhật & Quay lại -->
    <div
      class="form-group mt-4 d-flex justify-content-between align-items-center"
    >
      <button type="button" class="btn btn-outline-secondary" @click="cancel">
        <i class="fas fa-arrow-left me-1"></i> Quay lại
      </button>

      <button class="btn btn-primary" :disabled="isSubmitting">
        <i class="fas fa-save me-1"></i>
        {{ isSubmitting ? "Đang cập nhật..." : "Lưu Thay Đổi" }}
      </button>
    </div>
  </Form>
</template>

<script>
import * as yup from "yup";
import { Form, Field, ErrorMessage } from "vee-validate";
const API_URL = import.meta.env.VITE_API_BASE_URL;

export default {
  name: "KhachHangProfileForm",
  components: {
    Form,
    Field,
    ErrorMessage,
  },
  props: {
    khachHang: {
      type: Object,
      default: () => ({
        ho_ten: "",
        email: "",
        so_dien_thoai: "",
        ngay_sinh: "",
        avatar: "",
        mat_khau_moi: "",
        xac_nhan_mat_khau_moi: "",
      }),
    },
  },
  emits: ["submit:profile", "cancel"],
  data() {
    // Định nghĩa Schema validate bằng Yup cho trang Profile
    const profileFormSchema = yup.object().shape({
      avatar: yup.mixed().nullable().notRequired(),

      ho_ten: yup
        .string()
        .required("Họ và tên không được để trống.")
        .max(50, "Họ tên tối đa 50 ký tự."),

      email: yup
        .string()
        .email("Email không đúng định dạng.")
        .max(50, "Email tối đa 50 ký tự."),

      so_dien_thoai: yup
        .string()
        .matches(/^[0-9]{10,11}$/, "Số điện thoại phải từ 10-11 chữ số.")
        .nullable()
        .notRequired(),

      ngay_sinh: yup.date().typeError("Ngày sinh không hợp lệ."),

      mat_khau_moi: yup
        .string()
        .test(
          "len",
          "Mật khẩu tối thiểu 6 ký tự.",
          (val) => !val || val.length >= 6,
        )
        .max(50, "Mật khẩu tối đa 50 ký tự."),

      xac_nhan_mat_khau_moi: yup
        .string()
        .oneOf(
          [yup.ref("mat_khau_moi"), null],
          "Xác nhận mật khẩu mới không trùng khớp.",
        ),
    });

    return {
      khachHangLocal: this.formatDataForForm(this.khachHang),
      profileFormSchema,
      isSubmitting: false,
      showPassword: false,

      selectedFile: null, // File hình ảnh được chọn từ máy
      previewImage: this.khachHang?.avatar
        ? `${API_URL}/public/uploads/KhachHang/${this.khachHang.avatar}`
        : null,
    };
  },
  watch: {
    khachHang: {
      handler(newVal) {
        this.khachHangLocal = this.formatDataForForm(newVal);

        if (newVal?.avatar && !this.selectedFile) {
          this.previewImage = `${API_URL}/uploads/NhanVien/${newVal.avatar}`;
        }
      },
      deep: true,
    },
  },
  methods: {
    formatDataForForm(data) {
      if (!data) return {};
      const formatted = { ...data };
      if (formatted.ngay_sinh) {
        formatted.ngay_sinh = new Date(formatted.ngay_sinh)
          .toISOString()
          .split("T")[0];
      }
      return formatted;
    },

    toggleShowPassword() {
      this.showPassword = !this.showPassword;
    },

    // Xử lý khi chọn file từ máy tính
    handleFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.selectedFile = file;
        // Tạo URL xem trước ảnh bằng FileReader
        const reader = new FileReader();
        reader.onload = (e) => {
          this.previewImage = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    },

    // Phát sự kiện submit kèm dữ liệu FormData ra cho Component cha
    submitProfile() {
      const formData = new FormData();
      formData.append("ho_ten", this.khachHangLocal.ho_ten || "");
      if (this.khachHangLocal.mat_khau && this.khachHangLocal.mat_khau != "") {
        formData.append("matkhau", this.khachHangLocal.mat_khau);
      }
      formData.append("so_dien_thoai", this.khachHangLocal.so_dien_thoai || "");
      formData.append("ngay_sinh", this.khachHangLocal.ngay_sinh || "");

      // CHỈ append file được chọn từ máy tính
      if (this.selectedFile) {
        formData.append("image", this.selectedFile);
      }

      if (this.isEdit && this.khachHangLocal.id) {
        formData.append("id", this.khachHangLocal.id);
      }

      this.$emit("submit:profile", formData);
    },

    cancel() {
      this.$emit("cancel");
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
