<template>
  <div class="container mt-3">
    <!-- Nút Quay lại & Tiêu đề -->
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h4><i class="fas fa-gift me-2"></i>Tặng Phiếu Giảm Giá</h4>
    </div>

    <div class="card shadow-sm">
      <div class="card-body">
        <Form @submit="handleSubmit" :validation-schema="tangPhieuSchema">
          <!-- 1. CHỌN PHIẾU GIẢM GIÁ -->
          <div class="form-group mb-3">
            <label class="fw-bold mb-1">
              Phiếu Giảm Giá <span class="text-danger">*</span>:
            </label>

            <!-- Nếu URL có truyền ID phiếu -> Giữ cố định -->
            <template v-if="fixedPhieu">
              <input
                type="text"
                class="form-control"
                :value="`[${fixedPhieu.id}] ${fixedPhieu.ten_phieu}`"
                disabled
              />
              <!-- Thẻ Hidden Field giúp VeeValidate không bị sót data -->
              <Field
                type="hidden"
                name="id_phieu_giam_gia"
                v-model="formData.id_phieu_giam_gia"
              />
            </template>

            <!-- Nếu không có ID phiếu trên URL -> Cho chọn qua BaseSearchSelect -->
            <template v-else>
              <Field
                name="id_phieu_giam_gia"
                v-model="formData.id_phieu_giam_gia"
                v-slot="{ errors }"
              >
                <BaseSearchSelect
                  v-model="formData.id_phieu_giam_gia"
                  :options="dsPhieuGiamGia"
                  label-key="ten_phieu"
                  value-key="id"
                  placeholder="Nhập tên hoặc mã phiếu để chọn..."
                  :invalid="errors.length > 0"
                />
              </Field>
            </template>

            <ErrorMessage name="id_phieu_giam_gia" class="text-danger small" />
          </div>

          <hr class="my-4" />

          <!-- 2. PHƯƠNG THỨC CHỌN KHÁCH HÀNG (sử dụng CustomerSelector) -->
          <CustomerSelector @update:selectedIds="handleCustomerChange" />

          <!-- NÚT BẤM CỦA TRANG -->
          <div class="mt-4 text-end">
            <button
              type="button"
              class="btn btn-secondary me-2"
              @click="goBack"
            >
              <i class="fas fa-times me-1"></i> Hủy bỏ
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="isSubmitting"
            >
              <i class="fas fa-paper-plane me-1"></i> Xác Nhận Tặng Phiếu
            </button>
          </div>
        </Form>
      </div>
    </div>
  </div>
</template>

<script>
import * as yup from "yup";
import { Form, Field, ErrorMessage } from "vee-validate";
import BaseSearchSelect from "@/components/Common/BaseSearchSelect.vue";
import BaseMultiSearchSelect from "@/components/Common/BaseMultiSearchSelect.vue";
import CustomerSelector from "@/components/Common/CustomerSelector.vue";

import PhieuGiamGiaService from "@/services/phieu-giam-gia.service";
import PhieuKhachHangService from "@/services/phieu-khach-hang.service";

export default {
  name: "TangPhieuView",
  components: {
    Form,
    Field,
    ErrorMessage,
    BaseSearchSelect,
    BaseMultiSearchSelect,
    CustomerSelector,
  },
  props: {
    id: { type: String, required: false, default: null }, // Nhận :id truyền trực tiếp qua router props
  },
  data() {
    return {
      isSubmitting: false,
      dsPhieuGiamGia: [],
      fixedPhieu: null,
      formData: {
        id_phieu_giam_gia: "",
        type: "GROUP",
        hang_khach_hang: "",
        ds_khach_hang_id: [],
      },
    };
  },
  computed: {
    tangPhieuSchema() {
      return yup.object().shape({
        id_phieu_giam_gia: yup
          .string()
          .required("Vui lòng chọn phiếu giảm giá."),
        hang_khach_hang: yup.string().when("type", {
          is: "GROUP",
          then: (schema) => schema.required("Vui lòng chọn hạng khách hàng."),
        }),
        ds_khach_hang_id: yup.array().when("type", {
          is: "CUSTOM",
          then: (schema) =>
            schema.min(1, "Vui lòng chọn ít nhất 1 khách hàng."),
        }),
      });
    },
  },
  async mounted() {
    await this.fetchPhieuGiamGia();

    // 2. Nếu có param id truyền từ route props sang
    if (this.id) {
      this.fixedPhieu = await PhieuGiamGiaService.get(this.id);
      this.formData.id_phieu_giam_gia = this.id;
    }
  },

  methods: {
    async fetchPhieuGiamGia() {
      try {
        this.dsPhieuGiamGia = await PhieuGiamGiaService.getAll({});
      } catch (err) {
        console.error("Lỗi nạp danh sách phiếu:", err);
      }
    },

    handleCustomerChange({ type, ids }) {
      this.formData.type = type;
      this.formData.ds_khach_hang_id = ids;
    },

    async handleSubmit() {
      if (this.formData.ds_khach_hang_id.length === 0) {
        alert("Không tìm thấy khách hàng phù hợp để tặng!");
        return;
      }

      const payload = {
        id_phieu_giam_gia: this.formData.id_phieu_giam_gia,
        danh_sach_id_khach_hang: this.formData.ds_khach_hang_id,
        trang_thai: true,
      };

      try {
        this.isSubmitting = true;
        const res = await PhieuKhachHangService.create(payload);
        alert(res.data?.message || "Tặng phiếu giảm giá thành công!");
        this.goBack();
      } catch (error) {
        console.error("Lỗi tặng phiếu:", error);
        alert("Có lỗi xảy ra khi tặng phiếu!");
      } finally {
        this.isSubmitting = false;
      }
    },
    goBack() {
      this.$router.push("/phieu-giam-gia"); // Chuyển về lại trang quản lý
    },
  },
};
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
