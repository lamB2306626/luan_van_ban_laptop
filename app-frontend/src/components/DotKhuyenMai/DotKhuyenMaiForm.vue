<template>
  <Form @submit="submitDotKhuyenMai" :validation-schema="dotKhuyenMaiFormSchema">
    <!-- Mã Đợt Khuyến Mãi: Chỉ hiển thị khi Cập nhật (isEdit = true) và ở trạng thái disabled -->
    <div v-if="isEdit" class="form-group mb-3">
      <label for="id">Mã Đợt Khuyến Mãi:</label>
      <Field
        name="id"
        type="text"
        class="form-control"
        v-model="dotKhuyenMaiLocal.id"
        disabled
      />
      <ErrorMessage name="id" class="text-danger small" />
    </div>

    <!-- Tên Đợt Khuyến Mãi -->
    <div class="form-group mb-3">
      <label for="ten_dot">Tên Đợt Khuyến Mãi <span class="text-danger">*</span>:</label>
      <Field
        name="ten_dot"
        type="text"
        class="form-control"
        v-model="dotKhuyenMaiLocal.ten_dot"
        placeholder="Nhập tên đợt khuyến mãi (VD: Black Friday 2026)..."
      />
      <ErrorMessage name="ten_dot" class="text-danger small" />
    </div>

    <!-- Ngày Bắt Đầu -->
    <div class="form-group mb-3">
      <label for="ngay_bat_dau">Ngày Bắt Đầu <span class="text-danger">*</span>:</label>
      <Field
        name="ngay_bat_dau"
        type="date"
        class="form-control"
        v-model="dotKhuyenMaiLocal.ngay_bat_dau"
      />
      <ErrorMessage name="ngay_bat_dau" class="text-danger small" />
    </div>

    <!-- Ngày Kết Thúc -->
    <div class="form-group mb-3">
      <label for="ngay_ket_thuc">Ngày Kết Thúc <span class="text-danger">*</span>:</label>
      <Field
        name="ngay_ket_thuc"
        type="date"
        class="form-control"
        v-model="dotKhuyenMaiLocal.ngay_ket_thuc"
      />
      <ErrorMessage name="ngay_ket_thuc" class="text-danger small" />
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
  name: "DotKhuyenMaiForm",
  components: {
    Form,
    Field,
    ErrorMessage,
  },
  props: {
    dotKhuyenMai: {
      type: Object,
      default: () => ({
        ten_dot: "",
        ngay_bat_dau: "",
        ngay_ket_thuc: "",
      }),
    },
    isEdit: { type: Boolean, default: false },
  },
  emits: ["submit:dotKhuyenMai", "cancel"],
  data() {
    // Validation schema kiểm tra dữ liệu đầu vào bằng Yup
    const dotKhuyenMaiFormSchema = yup.object().shape({
      ten_dot: yup
        .string()
        .required("Tên đợt khuyến mãi không được để trống.")
        .min(2, "Tên đợt khuyến mãi phải có ít nhất 2 ký tự.")
        .max(50, "Tên đợt khuyến mãi không được vượt quá 50 ký tự."),
      ngay_bat_dau: yup
        .date()
        .required("Vui lòng chọn ngày bắt đầu.")
        .typeError("Ngày bắt đầu không hợp lệ."),
      ngay_ket_thuc: yup
        .date()
        .required("Vui lòng chọn ngày kết thúc.")
        .typeError("Ngày kết thúc không hợp lệ.")
        .min(
          yup.ref("ngay_bat_dau"),
          "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu."
        ),
    });

    return {
      dotKhuyenMaiLocal: this.formatDataForForm(this.dotKhuyenMai),
      dotKhuyenMaiFormSchema,
    };
  },
  watch: {
    // Cập nhật lại dữ liệu local khi props `dotKhuyenMai` thay đổi (khi load dữ liệu edit về)
    dotKhuyenMai: {
      handler(newVal) {
        this.dotKhuyenMaiLocal = this.formatDataForForm(newVal);
      },
      deep: true,
    },
  },
  methods: {
    // Chuyển định dạng ISO Date từ backend (2026-09-24T00:00:00.000Z) sang chuỗi YYYY-MM-DD để hiển thị chuẩn trên <input type="date">
    formatDataForForm(data) {
      if (!data) return {};
      const formatted = { ...data };
      if (formatted.ngay_bat_dau) {
        formatted.ngay_bat_dau = new Date(formatted.ngay_bat_dau)
          .toISOString()
          .split("T")[0];
      }
      if (formatted.ngay_ket_thuc) {
        formatted.ngay_ket_thuc = new Date(formatted.ngay_ket_thuc)
          .toISOString()
          .split("T")[0];
      }
      return formatted;
    },

    // Bắn sự kiện gửi dữ liệu form ra ngoài cho component cha
    submitDotKhuyenMai() {
      this.$emit("submit:dotKhuyenMai", this.dotKhuyenMaiLocal);
    },

    // Phát sự kiện cancel ra ngoài
    cancel() {
      this.$emit("cancel");
    },
  },
};
</script>