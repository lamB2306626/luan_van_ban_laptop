<template>
  <Form @submit="submitDanhMuc" :validation-schema="danhMucFormSchema">
    <!-- Mã Danh Mục: Chỉ hiển thị khi Cập nhật (isEdit = true) và ở trạng thái disabled -->
    <div v-if="isEdit" class="form-group mb-3">
      <label for="id">Mã Danh Mục:</label>
      <Field
        name="id"
        type="text"
        class="form-control"
        v-model="danhMucLocal.id"
        disabled
      />
      <ErrorMessage name="id" class="text-danger small" />
    </div>

    <!-- Tên Danh Mục -->
    <div class="form-group mb-3">
      <label for="ten_danh_muc">Tên Danh Mục <span class="text-danger">*</span>:</label>
      <Field
        name="ten_danh_muc"
        type="text"
        class="form-control"
        v-model="danhMucLocal.ten_danh_muc"
        placeholder="Nhập tên danh mục..."
      />
      <ErrorMessage name="ten_danh_muc" class="text-danger small" />
    </div>

    <!-- Mô tả -->
    <div class="form-group mb-3">
      <label for="mo_ta">Mô tả:</label>
      <Field
        name="mo_ta"
        as="textarea"
        rows="3"
        class="form-control"
        v-model="danhMucLocal.mo_ta"
        placeholder="Nhập mô tả cho danh mục (nếu có)..."
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

export default {
  name: "DanhMucForm",
  components: {
    Form,
    Field,
    ErrorMessage,
  },
  props: {
    danhMuc: { type: Object, default: () => ({ ten_danh_muc: "", mo_ta: "" }) },
    isEdit: { type: Boolean, default: false },
  },
  emits: ["submit:danhMuc"],
  data() {
    // Validation schema kiểm tra dữ liệu đầu vào bằng Yup
    const danhMucFormSchema = yup.object().shape({
      ten_danh_muc: yup
        .string()
        .required("Tên danh mục không được để trống.")
        .min(2, "Tên danh mục phải có ít nhất 2 ký tự.")
        .max(100, "Tên danh mục không được vượt quá 100 ký tự."),
      mo_ta: yup.string().max(500, "Mô tả tối đa 500 ký tự."),
    });

    return {
      danhMucLocal: { ...this.danhMuc },
      danhMucFormSchema,
    };
  },
  watch: {
    // Cập nhật lại dữ liệu local khi props `danhMuc` thay đổi (khi load dữ liệu edit về)
    danhMuc: {
      handler(newVal) {
        this.danhMucLocal = { ...newVal };
      },
      deep: true,
    },
  },
  methods: {
    // Bắn sự kiện gửi dữ liệu form ra ngoài cho component cha
    submitDanhMuc() {
      this.$emit("submit:danhMuc", this.danhMucLocal);
    },
    cancel() {
      // Phát sự kiện cancel ra ngoài thay vì tự chuyển trang
      this.$emit("cancel");
    },
  },
};
</script>