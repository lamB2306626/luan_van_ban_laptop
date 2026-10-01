<template>
  <Form @submit="submitPhieuGiamGia" :validation-schema="phieuGiamGiaFormSchema">
    <!-- Mã Phiếu Giảm Giá: Cho phép nhập khi Thêm Mới, hiển thị disabled khi Cập Nhật -->
    <div v-if = "isEdit" class="form-group mb-3">
      <label for="id">Mã Phiếu Giảm Giá <span class="text-danger">*</span>:</label>
      <Field
        name="id"
        type="text"
        class="form-control"
        v-model="phieuGiamGiaLocal.id"
        placeholder="Nhập mã phiếu (VD: LAPTOP50K, SUMMERSALE)..."
      />
      <ErrorMessage name="id" class="text-danger small" />
    </div>

    <!-- Tên Phiếu Giảm Giá -->
    <div class="form-group mb-3">
      <label for="ten_phieu">Tên Phiếu Giảm Giá <span class="text-danger">*</span>:</label>
      <Field
        name="ten_phieu"
        type="text"
        class="form-control"
        v-model="phieuGiamGiaLocal.ten_phieu"
        placeholder="Nhập tên phiếu (VD: Giảm 50k cho đơn từ 2 triệu)..."
      />
      <ErrorMessage name="ten_phieu" class="text-danger small" />
    </div>

    <div class="row">
      <!-- Loại Phiếu Giảm Giá -->
      <div class="col-md-6 form-group mb-3">
        <label for="loai_phieu">Loại Giảm Giá <span class="text-danger">*</span>:</label>
        <Field
          name="loai_phieu"
          as="select"
          class="form-select form-control"
          v-model="phieuGiamGiaLocal.loai_phieu"
        >
          <option value="PHAN_TRAM">Giảm theo phần trăm (%)</option>
          <option value="CO_DINH">Giảm theo số tiền cố định (VNĐ)</option>
        </Field>
        <ErrorMessage name="loai_phieu" class="text-danger small" />
      </div>

      <!-- Giá Trị Giảm -->
      <div class="col-md-6 form-group mb-3">
        <label for="gia_tri_giam">
          Giá Trị Giảm <span class="text-danger">*</span> 
          <small class="text-muted">
            ({{ phieuGiamGiaLocal.loai_phieu === 'PHAN_TRAM' ? '%' : 'VNĐ' }})
          </small>:
        </label>
        <Field
          name="gia_tri_giam"
          type="number"
          class="form-control"
          v-model.number="phieuGiamGiaLocal.gia_tri_giam"
          placeholder="Nhập giá trị giảm..."
        />
        <ErrorMessage name="gia_tri_giam" class="text-danger small" />
      </div>
    </div>

    <div class="row">
      <!-- Đơn Tối Thiểu -->
      <div class="col-md-6 form-group mb-3">
        <label for="don_toi_thieu">Đơn Hàng Tối Thiểu (VNĐ):</label>
        <Field
          name="don_toi_thieu"
          type="number"
          class="form-control"
          v-model.number="phieuGiamGiaLocal.don_toi_thieu"
          placeholder="VD: 500000 (Được để trống nếu không yêu cầu)"
        />
        <ErrorMessage name="don_toi_thieu" class="text-danger small" />
      </div>

      <!-- Giảm Tối Đa (Chỉ áp dụng khi chọn giảm theo phần trăm) -->
      <div class="col-md-6 form-group mb-3">
        <label for="giam_toi_da">Mức Giảm Tối Đa (VNĐ):</label>
        <Field
          name="giam_toi_da"
          type="number"
          class="form-control"
          v-model.number="phieuGiamGiaLocal.giam_toi_da"
          :disabled="phieuGiamGiaLocal.loai_phieu === 'CO_DINH'"
          placeholder="VD: 200000 (Để trống nếu không giới hạn)"
        />
        <ErrorMessage name="giam_toi_da" class="text-danger small" />
      </div>
    </div>

    <div class="row">
      <!-- Ngày Bắt Đầu -->
      <div class="col-md-6 form-group mb-3">
        <label for="ngay_bat_dau">Ngày Bắt Đầu <span class="text-danger">*</span>:</label>
        <Field
          name="ngay_bat_dau"
          type="date"
          class="form-control"
          v-model="phieuGiamGiaLocal.ngay_bat_dau"
        />
        <ErrorMessage name="ngay_bat_dau" class="text-danger small" />
      </div>

      <!-- Ngày Hết Hạn -->
      <div class="col-md-6 form-group mb-3">
        <label for="ngay_het_han">Ngày Hết Hạn <span class="text-danger">*</span>:</label>
        <Field
          name="ngay_het_han"
          type="date"
          class="form-control"
          v-model="phieuGiamGiaLocal.ngay_het_han"
        />
        <ErrorMessage name="ngay_het_han" class="text-danger small" />
      </div>
    </div>

    <!-- Trạng Thái Kích Hoạt -->
    <!-- <div class="form-group mb-3">
      <div class="form-check form-switch">
        <input
          id="trang_thai"
          type="checkbox"
          class="form-check-input"
          v-model="phieuGiamGiaLocal.trang_thai"
        />
        <label class="form-check-label fw-bold" for="trang_thai">
          Kích hoạt phiếu giảm giá ngay lập tức
        </label>
      </div>
    </div> -->

    <!-- Các nút hành động -->
    <div class="form-group">
      <button class="btn btn-primary" type="submit">
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
  name: "PhieuGiamGiaForm",
  components: {
    Form,
    Field,
    ErrorMessage,
  },
  props: {
    phieuGiamGia: {
      type: Object,
      default: () => ({
        ten_phieu: "",
        loai_phieu: "PHAN_TRAM",
        gia_tri_giam: 0,
        don_toi_thieu: null,
        giam_toi_da: null,
        ngay_bat_dau: "",
        ngay_het_han: "",
        trang_thai: true,
      }),
    },
    isEdit: { type: Boolean, default: false },
  },
  emits: ["submit:phieuGiamGia", "cancel"],
  data() {
    // Validation schema kiểm tra dữ liệu đầu vào bằng Yup
    const phieuGiamGiaFormSchema = yup.object().shape({
      ten_phieu: yup
        .string()
        .required("Tên phiếu giảm giá không được để trống.")
        .min(2, "Tên phiếu phải có ít nhất 2 ký tự.")
        .max(30, "Tên phiếu không được vượt quá 30 ký tự."),
      loai_phieu: yup
        .string()
        .required("Vui lòng chọn loại phiếu giảm giá."),
      gia_tri_giam: yup
        .number()
        .required("Giá trị giảm không được để trống.")
        .typeError("Giá trị giảm phải là số.")
        .positive("Giá trị giảm phải lớn hơn 0.")
        .when("loai_phieu", {
          is: "PHAN_TRAM",
          then: (schema) => schema.max(100, "Giảm theo phần trăm không được vượt quá 100%."),
        }),
      don_toi_thieu: yup
        .number()
        .nullable()
        .transform((value, originalValue) => (originalValue === "" ? null : value))
        .min(0, "Giá trị đơn tối thiểu không được âm."),
      giam_toi_da: yup
        .number()
        .nullable()
        .transform((value, originalValue) => (originalValue === "" ? null : value))
        .min(0, "Mức giảm tối đa không được âm."),
      ngay_bat_dau: yup
        .date()
        .required("Vui lòng chọn ngày bắt đầu.")
        .typeError("Ngày bắt đầu không hợp lệ."),
      ngay_het_han: yup
        .date()
        .required("Vui lòng chọn ngày hết hạn.")
        .typeError("Ngày hết hạn không hợp lệ.")
        .min(
          yup.ref("ngay_bat_dau"),
          "Ngày hết hạn phải lớn hơn hoặc bằng ngày bắt đầu."
        ),
    });

    return {
      phieuGiamGiaLocal: this.formatDataForForm(this.phieuGiamGia),
      phieuGiamGiaFormSchema,
    };
  },
  watch: {
    // Cập nhật lại dữ liệu local khi props `phieuGiamGia` thay đổi
    phieuGiamGia: {
      handler(newVal) {
        this.phieuGiamGiaLocal = this.formatDataForForm(newVal);
      },
      deep: true,
    },
  },
  methods: {
    // Chuyển định dạng ISO Date từ backend (2026-09-28T00:00:00.000Z) sang chuỗi YYYY-MM-DD để hiển thị chuẩn trên <input type="date">
    formatDataForForm(data) {
      if (!data) return {};
      const formatted = { ...data };
      if (formatted.ngay_bat_dau) {
        formatted.ngay_bat_dau = new Date(formatted.ngay_bat_dau)
          .toISOString()
          .split("T")[0];
      }
      if (formatted.ngay_het_han) {
        formatted.ngay_het_han = new Date(formatted.ngay_het_han)
          .toISOString()
          .split("T")[0];
      }
      return formatted;
    },

    // Bắn sự kiện gửi dữ liệu form ra ngoài cho component cha
    submitPhieuGiamGia() {
      this.$emit("submit:phieuGiamGia", this.phieuGiamGiaLocal);
    },

    // Phát sự kiện cancel ra ngoài
    cancel() {
      this.$emit("cancel");
    },
  },
};
</script>