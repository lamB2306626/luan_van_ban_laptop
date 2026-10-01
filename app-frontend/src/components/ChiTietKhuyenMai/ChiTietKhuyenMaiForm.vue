<template>
  <Form @submit="submitChiTiet" :validation-schema="chiTietFormSchema">
    <!-- Mã Chi Tiết & Mã Đợt KM (Hiển thị disabled khi Edit) -->
    <div v-if="isEdit" class="row">
      <div class="col-md-6 form-group mb-3">
        <label for="id">Mã Chi Tiết:</label>
        <Field
          name="id"
          type="text"
          class="form-control"
          v-model="chiTietLocal.id"
          disabled
        />
      </div>

      <div class="col-md-6 form-group mb-3">
        <label for="id_dot_km">Mã Đợt Khuyến Mãi:</label>
        <Field
          name="id_dot_km"
          type="text"
          class="form-control"
          v-model="chiTietLocal.id_dot_km"
          disabled
        />
      </div>
    </div>

    <!-- Chọn danh sách Sản Phẩm - Sử dụng BaseMultiSearchSelect chọn danh sách sản phẩm-->
    <div class="row">
      <div class="col-md-12 form-group mb-3">
        <label
          >Danh sách sản phẩm áp dụng <span class="text-danger">*</span>:</label
        >

        <Field
          name="danh_sach_id_san_pham"
          v-model="chiTietLocal.danh_sach_id_san_pham"
          v-slot="{ errors }"
        >
          <BaseMultiSearchSelect
            v-if="!isEdit"
            v-model="chiTietLocal.danh_sach_id_san_pham"
            :options="dsSanPham"
            label-key="ten_san_pham"
            value-key="id"
            placeholder="Nhập tên hoặc mã sản phẩm để tìm..."
            :invalid="errors.length > 0"
          />
          <BaseSearchSelect
          v-else
            v-model="chiTietLocal.id_san_pham"
            :options="dsSanPham"
            label-key="ten_san_pham"
            value-key="id"
            placeholder="Nhập tên hoặc mã Sản Phẩm để tìm.kkkkkk.."
          >

            <!-- Custom lại cách hiển thị danh sách dạng [MÃ] TÊN -->
            <template #option="{ item }">
              <span class="fw-bold text-secondary">[{{ item.id }}]</span>
              {{ item.ten_san_pham }}
            </template>
          </BaseSearchSelect>
        </Field>

        <ErrorMessage name="danh_sach_id_san_pham" class="text-danger small" />
      </div>
    </div>

    <!-- Loại Giảm Giá & Giá Trị Giảm -->
    <div class="row">
      <div class="col-md-6 form-group mb-3">
        <label for="loai_giam_gia">
          Loại Giảm Giá <span class="text-danger">*</span>:
        </label>
        <Field
          name="loai_giam_gia"
          as="select"
          class="form-control form-select"
          v-model="chiTietLocal.loai_giam_gia"
        >
          <option value="PHAN_TRAM">Giảm Theo Phần Trăm (%)</option>
          <option value="CO_DINH">Giảm Số Tiền Cố Định (VNĐ)</option>
        </Field>
        <ErrorMessage name="loai_giam_gia" class="text-danger small" />
      </div>

      <div class="col-md-6 form-group mb-3">
        <label for="gia_tri_giam">
          Mức Giảm Giá <span class="text-danger">*</span>:
        </label>
        <div class="input-group">
          <Field
            name="gia_tri_giam"
            type="number"
            class="form-control"
            v-model="chiTietLocal.gia_tri_giam"
            placeholder="Nhập mức giảm"
          />
          <span class="input-group-text">
            {{ chiTietLocal.loai_giam_gia === "PERCENT" ? "%" : "₫" }}
          </span>
        </div>
        <ErrorMessage name="gia_tri_giam" class="text-danger small" />
      </div>
    </div>

    <!-- Các nút hành động -->
    <div class="form-group mt-4 text-end">
      <button type="button" class="btn btn-secondary me-2" @click="cancel">
        <i class="fas fa-times me-1"></i> Hủy
      </button>
      <button type="submit" class="btn btn-primary">
        <i class="fas fa-save me-1"></i>
        {{ isEdit ? "Cập nhật chi tiết" : "Thêm vào đợt khuyến mãi" }}
      </button>
    </div>
  </Form>
</template>

<script>
import * as yup from "yup";
import { Form, Field, ErrorMessage } from "vee-validate";
import BaseMultiSearchSelect from "@/components/Common/BaseMultiSearchSelect.vue";
import BaseSearchSelect from "@/components/Common/BaseSearchSelect.vue";

// Import Service lấy danh sách Sản phẩm
import SanPhamService from "@/services/san-pham.service";

export default {
  name: "ChiTietKhuyenMaiForm",
  components: {
    Form,
    Field,
    ErrorMessage,
    BaseMultiSearchSelect,
    BaseSearchSelect,
  },
  props: {
    chiTiet: {
      type: Object,
      default: () => ({
        id_dot_km: "",
        id_san_pham: "",
        loai_giam_gia: "PERCENT",
        gia_tri_giam: 0,
        danh_sach_id_san_pham: [],
      }),
    },
    isEdit: { type: Boolean, default: false },
  },
  emits: ["submit:chiTiet", "cancel"],
  data() {
    // Schema kiểm tra tính hợp lệ dữ liệu
    const chiTietFormSchema = yup.object().shape({
      id_san_pham: yup.string().required("Vui lòng chọn sản phẩm."),
      loai_giam_gia: yup.string().required("Vui lòng chọn loại giảm giá."),
      gia_tri_giam: yup
        .number()
        .typeError("Mức giảm phải là chữ số.")
        .required("Mức giảm giá không được để trống.")
        .min(0, "Mức giảm không được nhỏ hơn 0.")
        .when("loai_giam_gia", {
          is: "PERCENT",
          then: (schema) =>
            schema.max(100, "Phần trăm giảm không được vượt quá 100%."),
        }),
      danh_sach_id_san_pham: yup
        .array()
        .min(1, "Vui lòng chọn ít nhất 1 sản phẩm áp dụng."),
    });

    return {
      chiTietLocal: { ...this.chiTiet },
      dsSanPham: [],
      chiTietFormSchema,
      danh_sach_id_san_pham: [],
    };
  },
  computed: {
    // Sửa 3: Đưa chiTietFormSchema vào computed và validate đúng danh_sach_id_san_pham dạng Mảng
    chiTietFormSchema() {
      return yup.object().shape({
        danh_sach_id_san_pham: yup
          .array()
          .min(1, "Vui lòng chọn ít nhất 1 sản phẩm áp dụng."),
        loai_giam_gia: yup.string().required("Vui lòng chọn loại giảm giá."),
        gia_tri_giam: yup
          .number()
          .typeError("Mức giảm phải là chữ số.")
          .required("Mức giảm giá không được để trống.")
          .min(0, "Mức giảm không được nhỏ hơn 0.")
          .when("loai_giam_gia", {
            is: "PERCENT",
            then: (schema) =>
              schema.max(100, "Phần trăm giảm không được vượt quá 100%."),
          }),
      });
    },
  },
  watch: {
    chiTiet: {
      handler(newVal) {
        this.chiTietLocal = { ...newVal };
      },
      deep: true,
    },
  },
  methods: {
    // Nạp danh sách sản phẩm cho dropdown
    async fetchDropdownData() {
      try {
        if (SanPhamService) {
          this.dsSanPham = await SanPhamService.getAll({});
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách Sản Phẩm:", error);
      }
    },

    submitChiTiet() {
      this.$emit("submit:chiTiet", this.chiTietLocal);
    },

    cancel() {
      this.$emit("cancel");
    },
  },
  async mounted() {
    // 1. Lấy dsSanPham thông qua fetchDropdownData
    await this.fetchDropdownData();

    // 2. Sau khi đã có dsSanPham, mới gán dữ liệu cho form Edit
    if (this.isEdit) {
      this.chiTietLocal = { ...this.chiTiet };
    }
  },
};
</script>
