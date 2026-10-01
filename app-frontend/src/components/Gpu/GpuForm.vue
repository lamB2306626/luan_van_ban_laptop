<template>
  <Form @submit="submitGpu" :validation-schema="gpuFormSchema">
    <!-- Mã GPU: Chỉ hiển thị khi Cập nhật (isEdit = true) và ở trạng thái disabled -->
    <div v-if="isEdit" class="form-group mb-3">
      <label for="id">Mã GPU:</label>
      <Field
        name="id"
        type="text"
        class="form-control"
        v-model="gpuLocal.id"
        disabled
      />
      <ErrorMessage name="id" class="text-danger small" />
    </div>

    <!-- Tên GPU -->
    <div class="form-group mb-3">
      <label for="ten_gpu">
        Tên GPU <span class="text-danger">*</span>:
      </label>
      <Field
        name="ten_gpu"
        type="text"
        class="form-control"
        v-model="gpuLocal.ten_gpu"
        placeholder="Nhập tên GPU"
      />
      <ErrorMessage name="ten_gpu" class="text-danger small" />
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
  name: "GpuForm",
  components: {
    Form,
    Field,
    ErrorMessage,
  },
  props: {
    gpu: {
      type: Object,
      default: () => ({
        ten_gpu: "",
      }),
    },
    isEdit: { type: Boolean, default: false },
  },
  emits: ["submit:gpu"],
  data() {
    // Validation schema kiểm tra dữ liệu đầu vào bằng Yup
    const gpuFormSchema = yup.object().shape({
      ten_gpu: yup
        .string()
        .required("Tên GPU không được để trống.")
        .min(2, "Tên GPU phải có ít nhất 2 ký tự.")
        .max(50, "Tên GPU không được vượt quá 50 ký tự."),
    });

    return {
      gpuLocal: { ...this.gpu },
      gpuFormSchema,
    };
  },
  watch: {
    // Cập nhật lại dữ liệu local khi props `gpu` thay đổi (khi load dữ liệu edit)
    gpu: {
      handler(newVal) {
        this.gpuLocal = { ...newVal };
      },
      deep: true,
    },
  },
  methods: {
    // Bắn sự kiện gửi dữ liệu form ra ngoài cho component cha
    submitGpu() {
      this.$emit("submit:gpu", this.gpuLocal);
    },
    cancel() {
      // Phát sự kiện cancel ra ngoài thay vì tự chuyển trang
      this.$emit("cancel");
    },
  },
};
</script>