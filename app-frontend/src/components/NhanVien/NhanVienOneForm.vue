<template>
  <Form @submit="submitNhanVien" :validation-schema="nhanVienFormSchema">
    <!-- Mã Nhân Viên & Họ và Tên -->
    <div v-if="isEdit" class="form-group mb-3">
      <label for="id">Mã số Nhân Viên:</label>
      <Field
        name="id"
        type="text"
        class="form-control"
        v-model="nhanVienLocal.id"
        disabled
      />
      <ErrorMessage name="id" class="text-danger small" />
    </div>

    <div class="row">
      <div class="col-md-12 form-group mb-3">
        <label for="ho_ten"
          >Họ Và Tên <span class="text-danger">*</span>:</label
        >
        <Field
          name="ho_ten"
          type="text"
          class="form-control"
          v-model="nhanVienLocal.ho_ten"
          placeholder="VD: Nguyễn Văn A"
        />
        <ErrorMessage name="ho_ten" class="text-danger small" />
      </div>
    </div>

    <!-- Email & Vai Trò -->
    <div class="row">
      <div class="col-md-6 form-group mb-3">
        <label for="email">Email <span class="text-danger">*</span>:</label>
        <Field
          name="email"
          type="email"
          class="form-control"
          v-model="nhanVienLocal.email"
          placeholder="VD: nv.a@gmail.com"
        />
        <ErrorMessage name="email" class="text-danger small" />
      </div>

      <div class="col-md-6 form-group mb-3">
        <label for="id_vai_tro"
          >Vai Trò <span class="text-danger">*</span>:</label
        >
        <Field
          name="id_vai_tro"
          type="text"
          class="form-control"
          v-model="nhanVienLocal.vai_tro.ten_vai_tro"
          disabled
        />
        <ErrorMessage name="id_vai_tro" class="text-danger small" />
      </div>
    </div>

    <!-- Mật khẩu (Thêm mới bắt buộc nhập, Chỉnh sửa có thể bỏ trống nếu không đổi) -->
    <div v-if="!isEdit" class="row">
      <div class="col-md-12 form-group mb-3">
        <label for="mat_khau">
          Mật Khẩu <span v-if="!isEdit" class="text-danger">*</span>
          <small v-else class="text-muted"
            >(Để trống nếu không muốn đổi mật khẩu)</small
          >:
        </label>
        <Field
          name="mat_khau"
          type="password"
          class="form-control"
          v-model="nhanVienLocal.mat_khau"
          placeholder="••••••••"
        />
        <ErrorMessage name="mat_khau" class="text-danger small" />
      </div>
    </div>

    <!-- Upload Logo / Hình ảnh -->
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

    <!-- Số điện thoại-->
    <div class="row">
      <div class="col-md-12 form-group mb-3">
        <label for="so_dien_thoai">Số điện thoại:</label>
        <Field
          name="so_dien_thoai"
          type="text"
          class="form-control"
          v-model="nhanVienLocal.so_dien_thoai"
          placeholder="VD: 0901234567"
        />
        <ErrorMessage name="so_dien_thoai" class="text-danger small" />
      </div>
    </div>

    <div class="form-group mb-3">
      <label for="ngay_sinh">Ngày Bắt Đầu:</label>
      <Field
        name="ngay_sinh"
        type="date"
        class="form-control"
        v-model="nhanVienLocal.ngay_sinh"
      />
      <ErrorMessage name="ngay_sinh" class="text-danger small" />
    </div>

    <!-- Các nút hành động -->
    <div class="form-group mt-4 text-end">
      <button type="button" class="btn btn-secondary me-2" @click="cancel">
        <i class="fas fa-times me-1"></i> Hủy
      </button>
      <button class="btn btn-primary" :disabled="isSubmitting">
        <i class="fas fa-save me-1"></i>
        {{ "Lưu nhân viên" }}
      </button>
    </div>
  </Form>
</template>

<script>
import * as yup from "yup";
import { Form, Field, ErrorMessage } from "vee-validate";

// Import Service Vai Tro để nạp Dropdown
import VaiTroService from "@/services/vai-tro.service";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default {
  name: "NhanVienOneForm",
  components: {
    Form,
    Field,
    ErrorMessage,
  },
  props: {
    nhanVien: {
      type: Object,
      default: () => ({
        ho_ten: "",
        email: "",
        mat_khau: "",
        id_vai_tro: "",
        so_dien_thoai: "",
        ngay_sinh: "",
        avatar: "",
        trang_thai: true,
      }),
    },
    isEdit: { type: Boolean, default: false },
  },
  emits: ["submit:nhanVien", "cancel"],
  data() {
    // Định dạng Regex kiểm tra số điện thoại Việt Nam đơn giản (10-11 chữ số)
    const phoneRegExp = /^(0[3|5|7|8|9])+([0-9]{8})\b$/;

    // Schema kiểm tra dữ liệu bằng Yup
    const nhanVienFormSchema = yup.object().shape({
      ho_ten: yup
        .string()
        .required("Họ và tên không được để trống.")
        .max(50, "Họ tên tối đa 50 ký tự."),
      email: yup
        .string()
        .required("Email không được để trống.")
        .email("Email không hợp lệ.")
        .max(50, "Email tối đa 50 ký tự."),
      id_vai_tro: yup.string().required("Vui lòng chọn vai trò."),
      mat_khau: yup.string().when([], {
        is: () => !this.isEdit,
        then: (schema) =>
          schema
            .required("Mật khẩu không được để trống.")
            .min(6, "Mật khẩu tối thiểu 6 ký tự.")
            .max(50, "Mật khẩu tối đa 50 ký tự."),
        otherwise: (schema) =>
          schema
            .nullable()
            .transform((value) => (value === "" ? null : value))
            .min(6, "Mật khẩu mới phải tối thiểu 6 ký tự."),
      }),
      so_dien_thoai: yup
        .string()
        .matches(phoneRegExp, "Số điện thoại không hợp lệ (VD: 0901234567).")
        .max(20, "Số điện thoại tối đa 20 ký tự."),
      ngay_sinh: yup.string(),
      avatar: yup
        .mixed()
        .test("check-image", "Vui lòng chọn ảnh avatar.", () => {
          // Nếu đang Sửa (isEdit) thì không bắt buộc chọn file mới (vì đã có ảnh cũ)
          if (this.isEdit) return true;
          // Nếu là Thêm mới thì bắt buộc phải chọn file
          return !!this.selectedFile;
        }),
    });

    return {
      nhanVienLocal: { ...this.nhanVien, mat_khau: "" }, // Reset ô mật khẩu về rỗng khi load form
      dsVaiTro: [],
      isSubmitting: false,
      nhanVienFormSchema,

      selectedFile: null, // File hình ảnh được chọn từ máy
      previewImage: this.nhanVien?.avatar
        ? `${API_URL}/uploads/NhanVien/${this.nhanVien.avatar}`
        : null, // Ảnh hiển thị preview
    };
  },
  watch: {
    nhanVien: {
      handler(newVal) {
        let formattedDate = newVal.ngay_sinh;
        if (newVal.ngay_sinh) {
          // Format ISO string về dạng YYYY-MM-DD để khớp với ô input datetime-local
          formattedDate = new Date(newVal.ngay_sinh)
            .toISOString()
            .split("T")[0];
        }
        this.nhanVienLocal = {
          ...newVal,
          mat_khau: "",
          ngay_sinh: formattedDate,
        };

        if (newVal?.avatar && !this.selectedFile) {
          this.previewImage = `${API_URL}/uploads/NhanVien/${newVal.avatar}`; //previewImage sẽ tự cập nhật
        }
      },
      deep: true,
    },
  },
  methods: {
    // Tải danh sách Vai Trò cho ô Chọn Dropdown
    async fetchDropdownData() {
      try {
        if (VaiTroService) {
          const res = await VaiTroService.getAll({});
          this.dsVaiTro = res;
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách Vai Trò:", error);
      }
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

    // Hàm xử lý lưu và mã hóa BCRYPT trước khi gửi
    // async submitNhanVien() {
    //   this.isSubmitting = true;
    //   try {
    //     const payload = { ...this.nhanVienLocal };

    //     // Nếu để trống mật khẩu khi Edit -> xóa khỏi payload
    //     if (!payload.mat_khau || payload.mat_khau.trim() === "") {
    //       delete payload.mat_khau;
    //     }

    //     this.$emit("submit:nhanVien", payload);
    //   } catch (error) {
    //     console.error("Lỗi khi mã hóa mật khẩu:", error);
    //   } finally {
    //     this.isSubmitting = false;
    //   }
    // },

    // Phát sự kiện submit kèm dữ liệu FormData ra cho Component cha
    submitNhanVien() {
      const formData = new FormData();
      // formData.append("id_vai_tro", this.nhanVienLocal.id_vai_tro || "");
      formData.append("ho_ten", this.nhanVienLocal.ho_ten || "");
      // formData.append("email", this.nhanVienLocal.email || "");
      if (this.nhanVienLocal.mat_khau && this.nhanVienLocal.mat_khau != "") {
        formData.append("matkhau", this.nhanVienLocal.mat_khau);
      }
      formData.append("so_dien_thoai", this.nhanVienLocal.so_dien_thoai || "");
      formData.append("ngay_sinh", this.nhanVienLocal.ngay_sinh || "");
      // formData.append("trang_thai", this.nhanVienLocal.trang_thai || "");

      // CHỈ append file được chọn từ máy tính
      if (this.selectedFile) {
        formData.append("image", this.selectedFile);
      }

      if (this.isEdit && this.nhanVienLocal.id) {
        formData.append("id", this.nhanVienLocal.id);
      }

      this.$emit("submit:nhanVien", formData);
    },

    cancel() {
      this.$emit("cancel");
    },
  },
  async mounted() {
    await this.fetchDropdownData();
  },
};
</script>
