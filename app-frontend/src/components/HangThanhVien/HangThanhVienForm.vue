<template>
  <Form @submit="submitHangThanhVien" :validation-schema="hangThanhVienFormSchema">
    <!-- Mã Hạng Thành Viên: Chỉ hiển thị khi Cập nhật (isEdit = true) và ở trạng thái disabled -->
    <div v-if="isEdit" class="form-group mb-3">
      <label for="id" class="fw-bold">Mã Hạng Thành Viên:</label>
      <Field
        name="id"
        type="text"
        class="form-control"
        v-model="hangThanhVienLocal.id"
        disabled
      />
      <ErrorMessage name="id" class="text-danger small" />
    </div>

    <!-- Tên Hạng Thành Viên -->
    <div class="form-group mb-3">
      <label for="ten_hang" class="fw-bold">Tên Hạng Thành Viên <span class="text-danger">*</span>:</label>
      <Field
        name="ten_hang"
        type="text"
        class="form-control"
        v-model="hangThanhVienLocal.ten_hang"
        placeholder="Nhập tên hạng (VD: Đồng, Bạc, Vàng, Kim Cương...)"
      />
      <ErrorMessage name="ten_hang" class="text-danger small" />
    </div>

    <!-- Mốc Chi Tiêu Để Đạt Hạng -->
    <div class="form-group mb-3">
      <label for="moc_chi_tieu" class="fw-bold">Mốc Chi Tiêu (VNĐ) <span class="text-danger">*</span>:</label>
      <Field
        name="moc_chi_tieu"
        type="number"
        min="0"
        step="1000"
        class="form-control"
        v-model.number="hangThanhVienLocal.moc_chi_tieu"
        placeholder="VD: 5000000"
      />
      <ErrorMessage name="moc_chi_tieu" class="text-danger small" />
    </div>

    <!-- Chọn danh sách Phiếu Giảm Giá gán cho Hạng Thành Viên này -->
    <div class="form-group mb-3">
      <label class="fw-bold">Phiếu Giảm Giá Thuộc Hạng Thành Viên này:</label>
      <Field
        name="danh_sach_id_phieu_giam_gia"
        v-model="hangThanhVienLocal.danh_sach_id_phieu_giam_gia"
        v-slot="{ errors }"
      >
        <BaseMultiSearchSelect
          v-model="hangThanhVienLocal.danh_sach_id_phieu_giam_gia"
          :options="dsPhieuGiamGia"
          label-key="ten_phieu"
          value-key="id"
          placeholder="Nhập tên hoặc mã phiếu giảm giá để chọn..."
          :invalid="errors.length > 0"
        />
      </Field>
      <ErrorMessage name="danh_sach_id_phieu_giam_gia" class="text-danger small mt-1 d-block" />
    </div>

    <!-- Các nút hành động -->
    <div class="form-group text-end mt-4">
      <button type="button" class="btn btn-secondary me-2" @click="cancel">
        <i class="fas fa-times me-1"></i> Hủy
      </button>
      <button class="btn btn-primary">
        <i class="fas fa-save me-1"></i> {{ isEdit ? "Cập nhật hạng" : "Thêm mới hạng" }}
      </button>
    </div>
  </Form>
</template>

<script>
import * as yup from "yup";
import { Form, Field, ErrorMessage } from "vee-validate";
import BaseMultiSearchSelect from "@/components/Common/BaseMultiSearchSelect.vue";
import PhieuGiamGiaService from "@/services/phieu-giam-gia.service"; // Điều chỉnh đường dẫn Service theo dự án của bạn

export default {
  name: "HangThanhVienForm",
  components: {
    Form,
    Field,
    ErrorMessage,
    BaseMultiSearchSelect,
  },
  props: {
    hangThanhVien: {
      type: Object,
      default: () => ({
        ten_hang: "",
        moc_chi_tieu: 0,
        danh_sach_id_phieu_giam_gia: [],
      }),
    },
    isEdit: { type: Boolean, default: false },
  },
  emits: ["submit:hangThanhVien", "cancel"],
  data() {
    // Validation schema kiểm tra dữ liệu đầu vào bằng Yup
    const hangThanhVienFormSchema = yup.object().shape({
      ten_hang: yup
        .string()
        .required("Tên hạng thành viên không được để trống.")
        .min(2, "Tên hạng phải có ít nhất 2 ký tự.")
        .max(20, "Tên hạng không được vượt quá 20 ký tự."),
      moc_chi_tieu: yup
        .number()
        .typeError("Mốc chi tiêu phải là chữ số.")
        .required("Vui lòng nhập mốc chi tiêu.")
        .min(0, "Mốc chi tiêu không được nhỏ hơn 0."),
      danh_sach_id_phieu_giam_gia: yup.array().of(yup.string()),
    });

    return {
      hangThanhVienLocal: this.formatInputData(this.hangThanhVien),
      dsPhieuGiamGia: [],
      hangThanhVienFormSchema,
    };
  },
  watch: {
    // Cập nhật lại dữ liệu local khi props `hangThanhVien` thay đổi
    hangThanhVien: {
      handler(newVal) {
        this.hangThanhVienLocal = this.formatInputData(newVal);
      },
      deep: true,
    },
  },
  methods: {
    // Map mảng id phiếu giảm giá từ relation `phieu_hang_thanh_vien` 
    formatInputData(data) {
      let listIds = data.danh_sach_id_phieu_giam_gia || [];
      if (Array.isArray(data.phieu_hang_thanh_vien)) {
        listIds = data.phieu_hang_thanh_vien.map((item) => item.id_phieu_giam_gia);
      }
      return {
        ...data,
        danh_sach_id_phieu_giam_gia: listIds,
      };
    },

    // Tải danh sách tất cả các phiếu giảm giá cho dropdown
    async fetchPhieuGiamGia() {
      try {
        if (PhieuGiamGiaService) {
          const res = await PhieuGiamGiaService.getAll({});
          this.dsPhieuGiamGia = res || [];
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách phiếu giảm giá:", error);
      }
    },

    // Bắn sự kiện gửi dữ liệu form ra ngoài cho component cha
    submitHangThanhVien() {
      this.$emit("submit:hangThanhVien", this.hangThanhVienLocal);
    },

    cancel() {
      this.$emit("cancel");
    },
  },
  async mounted() {
    await this.fetchPhieuGiamGia();
  },
};
</script>