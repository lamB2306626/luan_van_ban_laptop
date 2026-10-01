<template>
  <Form @submit="submitROM" :validation-schema="romFormSchema">
    <!-- Mã ROM: Chỉ hiển thị khi Cập nhật (isEdit = true) và ở trạng thái disabled -->
    <div v-if="isEdit" class="form-group mb-3">
      <label for="id">Mã ROM:</label>
      <Field
        name="id"
        type="text"
        class="form-control"
        v-model="romLocal.id"
        disabled
      />
      <ErrorMessage name="id" class="text-danger small" />
    </div>

    <!-- Dung Lượng ROM -->
    <div class="form-group mb-3">
      <label for="dung_luong_rom">
        Dung Lượng ROM <span class="text-danger">*</span>:
      </label>
      <Field
        name="dung_luong_rom"
        type="text"
        class="form-control"
        v-model="romLocal.dung_luong_rom"
        placeholder="Nhập dung lượng ROM (VD: 8GB, 16GB, 32GB)..."
      />
      <ErrorMessage name="dung_luong_rom" class="text-danger small" />
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
  name: "ROMForm",
  components: {
    Form,
    Field,
    ErrorMessage,
  },
  props: {
    rom: {
      type: Object,
      default: () => ({
        dung_luong_rom: "",
      }),
    },
    isEdit: { type: Boolean, default: false },
  },
  emits: ["submit:rom"],
  data() {
    // Validation schema kiểm tra dữ liệu đầu vào bằng Yup
    const romFormSchema = yup.object().shape({
      dung_luong_rom: yup
        .string()
        .required("Dung lượng ROM không được để trống.")
        .min(2, "Dung lượng ROM phải có ít nhất 2 ký tự.")
        .max(20, "Dung lượng ROM không được vượt quá 20 ký tự."),
    });

    return {
      romLocal: { ...this.rom },
      romFormSchema,
    };
  },
  watch: {
    // Cập nhật lại dữ liệu local khi props `rom` thay đổi (khi load dữ liệu edit)
    rom: {
      handler(newVal) {
        this.romLocal = { ...newVal };
      },
      deep: true,
    },
  },
  methods: {
    // Bắn sự kiện gửi dữ liệu form ra ngoài cho component cha
    submitROM() {
      this.$emit("submit:rom", this.romLocal);
    },
    cancel() {
      // Phát sự kiện cancel ra ngoài thay vì tự chuyển trang
      this.$emit("cancel");
    },
  },
};
</script>