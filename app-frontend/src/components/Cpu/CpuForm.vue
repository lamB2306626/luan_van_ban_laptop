<template>
  <Form @submit="submitCpu" :validation-schema="cpuFormSchema">
    <!-- Mã CPU: Chỉ hiển thị khi Cập nhật (isEdit = true) và ở trạng thái disabled -->
    <div v-if="isEdit" class="form-group mb-3">
      <label for="id">Mã CPU:</label>
      <Field
        name="id"
        type="text"
        class="form-control"
        v-model="cpuLocal.id"
        disabled
      />
      <ErrorMessage name="id" class="text-danger small" />
    </div>

    <!-- Tên CPU -->
    <div class="form-group mb-3">
      <label for="ten_cpu">
        Tên CPU <span class="text-danger">*</span>:
      </label>
      <Field
        name="ten_cpu"
        type="text"
        class="form-control"
        v-model="cpuLocal.ten_cpu"
        placeholder="Nhập tên CPU (VD: Intel Core i5 13400F, Apple M2)..."
      />
      <ErrorMessage name="ten_cpu" class="text-danger small" />
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
  name: "CpuForm",
  components: {
    Form,
    Field,
    ErrorMessage,
  },
  props: {
    cpu: {
      type: Object,
      default: () => ({
        ten_cpu: "",
      }),
    },
    isEdit: { type: Boolean, default: false },
  },
  emits: ["submit:cpu"],
  data() {
    // Validation schema kiểm tra dữ liệu đầu vào bằng Yup
    const cpuFormSchema = yup.object().shape({
      ten_cpu: yup
        .string()
        .required("Tên CPU không được để trống.")
        .min(2, "Tên CPU phải có ít nhất 2 ký tự.")
        .max(50, "Tên CPU không được vượt quá 50 ký tự."),
    });

    return {
      cpuLocal: { ...this.cpu },
      cpuFormSchema,
    };
  },
  watch: {
    // Cập nhật lại dữ liệu local khi props `cpu` thay đổi (khi load dữ liệu edit)
    cpu: {
      handler(newVal) {
        this.cpuLocal = { ...newVal };
      },
      deep: true,
    },
  },
  methods: {
    // Bắn sự kiện gửi dữ liệu form ra ngoài cho component cha
    submitCpu() {
      this.$emit("submit:cpu", this.cpuLocal);
    },
    cancel() {
      // Phát sự kiện cancel ra ngoài thay vì tự chuyển trang
      this.$emit("cancel");
    },
  },
};
</script>