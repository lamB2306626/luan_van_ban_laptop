<template>
  <Form @submit="submitNhaCungCap" :validation-schema="nhaCungCapFormSchema">
    <!-- Mã Nhà Cung Cấp: Chỉ hiển thị khi Cập nhật (isEdit = true) và ở trạng thái disabled -->
    <div v-if="isEdit" class="form-group mb-3">
      <label for="id">Mã Nhà Cung Cấp:</label>
      <Field
        name="id"
        type="text"
        class="form-control"
        v-model="nhaCungCapLocal.id"
        disabled
      />
      <ErrorMessage name="id" class="text-danger small" />
    </div>

    <!-- Tên Nhà Cung Cấp -->
    <div class="form-group mb-3">
      <label for="ten_ncc">
        Tên Nhà Cung Cấp <span class="text-danger">*</span>:
      </label>
      <Field
        name="ten_ncc"
        type="text"
        class="form-control"
        v-model="nhaCungCapLocal.ten_ncc"
        placeholder="Nhập tên nhà cung cấp..."
      />
      <ErrorMessage name="ten_ncc" class="text-danger small" />
    </div>

    <!-- Số Điện Thoại -->
    <div class="form-group mb-3">
      <label for="so_dien_thoai">
        Số Điện Thoại <span class="text-danger">*</span>:
      </label>
      <Field
        name="so_dien_thoai"
        type="text"
        class="form-control"
        v-model="nhaCungCapLocal.so_dien_thoai"
        placeholder="Nhập số điện thoại (VD: 0901234567)..."
      />
      <ErrorMessage name="so_dien_thoai" class="text-danger small" />
    </div>

    <!-- Email -->
    <div class="form-group mb-3">
      <label for="email">Email:</label>
      <Field
        name="email"
        type="email"
        class="form-control"
        v-model="nhaCungCapLocal.email"
        placeholder="Nhập email (VD: ncc@gmail.com)..."
      />
      <ErrorMessage name="email" class="text-danger small" />
    </div>

    <!-- Địa Chỉ -->
    <div class="form-group mb-3">
      <label for="dia_chi">
        Địa Chỉ <span class="text-danger">*</span>:
      </label>
      <Field
        name="dia_chi"
        as="textarea"
        rows="2"
        class="form-control"
        v-model="nhaCungCapLocal.dia_chi"
        placeholder="Nhập địa chỉ nhà cung cấp..."
      />
      <ErrorMessage name="dia_chi" class="text-danger small" />
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
  name: "NhaCungCapForm",
  components: {
    Form,
    Field,
    ErrorMessage,
  },
  props: {
    nhaCungCap: {
      type: Object,
      default: () => ({
        ten_ncc: "",
        so_dien_thoai: "",
        email: "",
        dia_chi: "",
      }),
    },
    isEdit: { type: Boolean, default: false },
  },
  emits: ["submit:nhaCungCap"],
  data() {
    // Định dạng Regex kiểm tra số điện thoại Việt Nam đơn giản (10-11 chữ số)
    const phoneRegExp = /^(0[3|5|7|8|9])+([0-9]{8})\b$/;

    // Validation schema kiểm tra dữ liệu đầu vào bằng Yup
    const nhaCungCapFormSchema = yup.object().shape({
      ten_ncc: yup
        .string()
        .required("Tên nhà cung cấp không được để trống.")
        .min(2, "Tên nhà cung cấp phải có ít nhất 2 ký tự.")
        .max(50, "Tên nhà cung cấp không được vượt quá 50 ký tự."),
      so_dien_thoai: yup
        .string()
        .required("Số điện thoại không được để trống.")
        .matches(phoneRegExp, "Số điện thoại không hợp lệ (VD: 0901234567).")
        .max(20, "Số điện thoại tối đa 20 ký tự."),
      email: yup
        .string()
        .nullable()
        .notRequired()
        .email("Email không hợp lệ.")
        .max(50, "Email tối đa 50 ký tự."),
      dia_chi: yup
        .string()
        .required("Địa chỉ không được để trống.")
        .max(255, "Địa chỉ tối đa 255 ký tự."),
    });

    return {
      nhaCungCapLocal: { ...this.nhaCungCap },
      nhaCungCapFormSchema,
    };
  },
  watch: {
    // Cập nhật lại dữ liệu local khi props `nhaCungCap` thay đổi (khi load dữ liệu edit)
    nhaCungCap: {
      handler(newVal) {
        this.nhaCungCapLocal = { ...newVal };
      },
      deep: true,
    },
  },
  methods: {
    // Bắn sự kiện gửi dữ liệu form ra ngoài cho component cha
    submitNhaCungCap() {
      this.$emit("submit:nhaCungCap", this.nhaCungCapLocal);
    },
    cancel() {
      // Phát sự kiện cancel ra ngoài thay vì tự chuyển trang
      this.$emit("cancel");
    },
  },
};
</script>