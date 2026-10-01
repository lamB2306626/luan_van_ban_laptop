<template>
  <Form @submit="submitRam" :validation-schema="ramFormSchema">
    <!-- Mã RAM: Chỉ hiển thị khi Cập nhật (isEdit = true) và ở trạng thái disabled -->
    <div v-if="isEdit" class="form-group mb-3">
      <label for="id">Mã RAM:</label>
      <Field
        name="id"
        type="text"
        class="form-control"
        v-model="ramLocal.id"
        disabled
      />
      <ErrorMessage name="id" class="text-danger small" />
    </div>

    <!-- Dung Lượng RAM -->
    <div class="form-group mb-3">
      <label for="dung_luong_ram">
        Dung Lượng RAM <span class="text-danger">*</span>:
      </label>
      <Field
        name="dung_luong_ram"
        type="text"
        class="form-control"
        v-model="ramLocal.dung_luong_ram"
        placeholder="Nhập dung lượng RAM (VD: 8GB, 16GB, 32GB)..."
      />
      <ErrorMessage name="dung_luong_ram" class="text-danger small" />
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
  name: "RamForm",
  components: {
    Form,
    Field,
    ErrorMessage,
  },
  props: {
    ram: {
      type: Object,
      default: () => ({
        dung_luong_ram: "",
      }),
    },
    isEdit: { type: Boolean, default: false },
  },
  emits: ["submit:ram"],
  data() {
    // Validation schema kiểm tra dữ liệu đầu vào bằng Yup
    const ramFormSchema = yup.object().shape({
      dung_luong_ram: yup
        .string()
        .required("Dung lượng RAM không được để trống.")
        .min(2, "Dung lượng RAM phải có ít nhất 2 ký tự.")
        .max(20, "Dung lượng RAM không được vượt quá 20 ký tự."),
    });

    return {
      ramLocal: { ...this.ram },
      ramFormSchema,
    };
  },
  watch: {
    // Cập nhật lại dữ liệu local khi props `ram` thay đổi (khi load dữ liệu edit)
    ram: {
      handler(newVal) {
        this.ramLocal = { ...newVal };
      },
      deep: true,
    },
  },
  methods: {
    // Bắn sự kiện gửi dữ liệu form ra ngoài cho component cha
    submitRam() {
      this.$emit("submit:ram", this.ramLocal);
    },
    cancel() {
      // Phát sự kiện cancel ra ngoài thay vì tự chuyển trang
      this.$emit("cancel");
    },
  },
};
</script>