<template>
  <Form @submit="submitThuongHieu" :validation-schema="thuongHieuFormSchema">
    <!-- Mã Thương Hiệu: Chỉ hiển thị khi Cập nhật (isEdit = true) và ở trạng thái disabled -->
    <div v-if="isEdit" class="form-group mb-3">
      <label for="id">Mã Thương Hiệu:</label>
      <Field
        name="id"
        type="text"
        class="form-control"
        v-model="thuongHieuLocal.id"
        disabled
      />
      <ErrorMessage name="id" class="text-danger small" />
    </div>

    <!-- Tên Thương Hiệu -->
    <div class="form-group mb-3">
      <label for="ten_thuong_hieu">
        Tên Thương Hiệu <span class="text-danger">*</span>:
      </label>
      <Field
        name="ten_thuong_hieu"
        type="text"
        class="form-control"
        v-model="thuongHieuLocal.ten_thuong_hieu"
        placeholder="Nhập tên thương hiệu (VD: Asus, Dell, Apple...)..."
      />
      <ErrorMessage name="ten_thuong_hieu" class="text-danger small" />
    </div>

    <!-- Upload Logo / Hình ảnh -->
    <div class="form-group mb-3">
      <label for="lo_go">Logo Thương Hiệu:</label>
      <input
        type="file"
        id="lo_go"
        class="form-control"
        accept="image/*"
        @change="handleFileChange"
      />

      <!-- Khung xem trước (Preview) ảnh -->
      <div v-if="previewImage" class="mt-2 text-center">
        <img
          :src="previewImage"
          alt="Preview Logo"
          class="img-thumbnail"
          style="max-height: 120px; object-fit: contain"
        />
      </div>
    </div>

    <!-- Mô tả -->
    <div class="form-group mb-3">
      <label for="mo_ta">Mô tả:</label>
      <Field
        name="mo_ta"
        as="textarea"
        rows="3"
        class="form-control"
        v-model="thuongHieuLocal.mo_ta"
        placeholder="Nhập mô tả cho thương hiệu (nếu có)..."
      />
      <ErrorMessage name="mo_ta" class="text-danger small" />
    </div>

    <!-- Các nút hành động -->
    <div class="form-group">
      <button class="btn btn-primary">
        <i class="fas fa-save"></i> Lưu lại
      </button>
      <button type="button" class="btn btn-secondary ms-2" @click="cancel">
        <i class="fas fa-times"></i> Hủy
      </button>
    </div>
  </Form>
</template>

<script>
import * as yup from "yup";
import { Form, Field, ErrorMessage } from "vee-validate";
// Trong Vite, bạn gọi qua import.meta.env
const API_URL = import.meta.env.VITE_API_BASE_URL;

export default {
  name: "ThuongHieuForm",
  components: {
    Form,
    Field,
    ErrorMessage,
  },
  props: {
    thuongHieu: {
      type: Object,
      default: () => ({ ten_thuong_hieu: "", lo_go: "", mo_ta: "" }),
    },
    isEdit: { type: Boolean, default: false },
  },
  emits: ["submit:thuongHieu"],
  data() {
    // Validation schema kiểm tra dữ liệu đầu vào bằng Yup
    const thuongHieuFormSchema = yup.object().shape({
      ten_thuong_hieu: yup
        .string()
        .required("Tên thương hiệu không được để trống.")
        .min(2, "Tên thương hiệu phải có ít nhất 2 ký tự.")
        .max(50, "Tên thương hiệu không được vượt quá 50 ký tự."),
      lo_go: yup
        .mixed()
        .test("check-logo", "Vui lòng chọn logo cho thương hiệu.", () => {
          // Nếu đang Sửa (isEdit) thì không bắt buộc chọn file mới (vì đã có ảnh cũ)
          if (this.isEdit) return true;
          // Nếu là Thêm mới thì bắt buộc phải chọn file
          return !!this.selectedFile;
        }),
      mo_ta: yup.string().max(500, "Mô tả tối đa 500 ký tự."),
    });

    return {
      thuongHieuLocal: { ...this.thuongHieu },
      selectedFile: null, // File hình ảnh được chọn từ máy
      previewImage: this.thuongHieu?.lo_go
        ? `${API_URL}/uploads/ThuongHieu/${this.thuongHieu.lo_go}`
        : null, // Ảnh hiển thị preview
      thuongHieuFormSchema,
    };
  },
  watch: {
    // Cập nhật lại dữ liệu local khi props `thuongHieu` thay đổi
    thuongHieu: {
      handler(newVal) {
        this.thuongHieuLocal = { ...newVal };
        if (newVal?.lo_go && !this.selectedFile) {
          this.previewImage = `${API_URL}/uploads/ThuongHieu/${newVal.lo_go}`; //previewImage sẽ tự cập nhật
        }
      },
      deep: true,
    },
  },

  methods: {
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
    submitThuongHieu() {
      const formData = new FormData();
      formData.append(
        "ten_thuong_hieu",
        this.thuongHieuLocal.ten_thuong_hieu || "",
      );
      formData.append("mo_ta", this.thuongHieuLocal.mo_ta || "");

      // CHỈ append file được chọn từ máy tính
      if (this.selectedFile) {
        formData.append("lo_go", this.selectedFile);
      }

      if (this.isEdit && this.thuongHieuLocal.id) {
        formData.append("id", this.thuongHieuLocal.id);
      }

      this.$emit("submit:thuongHieu", formData);
    },

    cancel() {
      // Phát sự kiện cancel ra ngoài thay vì tự chuyển trang
      this.$emit("cancel");
    },
  },
};
</script>
