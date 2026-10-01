<template>
  <Form @submit="submitMauSac" :validation-schema="mauSacFormSchema">
    <!-- Mã Màu Sắc: Chỉ hiển thị khi Cập nhật (isEdit = true) và ở trạng thái disabled -->
    <div v-if="isEdit" class="form-group mb-3">
      <label for="id">Mã Màu Sắc:</label>
      <Field
        name="id"
        type="text"
        class="form-control"
        v-model="mauSacLocal.id"
        disabled
      />
      <ErrorMessage name="id" class="text-danger small" />
    </div>

    <!-- Tên Màu Sắc -->
    <div class="form-group mb-3">
      <label for="ten_mau_sac">
        Tên Màu Sắc <span class="text-danger">*</span>:
      </label>
      <Field
        name="ten_mau_sac"
        type="text"
        class="form-control"
        v-model="mauSacLocal.ten_mau_sac"
        placeholder="Nhập tên màu sắc (VD: Đỏ, Xanh lá, Đen)..."
      />
      <ErrorMessage name="ten_mau_sac" class="text-danger small" />
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
  name: "MauSacForm",
  components: {
    Form,
    Field,
    ErrorMessage,
  },
  props: {
    mauSac: {
      type: Object,
      default: () => ({
        ten_mau_sac: "",
      }),
    },
    isEdit: { type: Boolean, default: false },
  },
  emits: ["submit:mauSac"],
  data() {
    // Validation schema kiểm tra dữ liệu đầu vào bằng Yup
    const mauSacFormSchema = yup.object().shape({
      ten_mau_sac: yup
        .string()
        .required("Tên màu sắc không được để trống.")
        .min(2, "Tên màu sắc phải có ít nhất 2 ký tự.")
        .max(30, "Tên màu sắc không được vượt quá 30 ký tự."),
    });

    return {
      mauSacLocal: { ...this.mauSac },
      mauSacFormSchema,
    };
  },
  watch: {
    // Cập nhật lại dữ liệu local khi props `mauSac` thay đổi (khi load dữ liệu edit)
    mauSac: {
      handler(newVal) {
        this.mauSacLocal = { ...newVal };
      },
      deep: true,
    },
  },
  methods: {
    // Bắn sự kiện gửi dữ liệu form ra ngoài cho component cha
    submitMauSac() {
      this.$emit("submit:mauSac", this.mauSacLocal);
    },
    cancel() {
      // Phát sự kiện cancel ra ngoài thay vì tự chuyển trang
      this.$emit("cancel");
    },
  },
};
</script>
