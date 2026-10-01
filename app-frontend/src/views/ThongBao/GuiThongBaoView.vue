<template>
  <div class="container mt-3">
    <!-- Nút Quay lại & Tiêu đề -->
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h4><i class="fas fa-bullhorn me-2"></i>Gửi Thông Báo</h4>
    </div>

    <div class="card shadow-sm">
      <div class="card-body">
        <Form @submit="handleSubmit" :validation-schema="phanPhatSchema">
          <!-- 1. CHỌN THÔNG BÁO -->
          <div class="form-group mb-3">
            <label class="fw-bold mb-1">
              Thông Báo <span class="text-danger">*</span>:
            </label>

            <!-- Nếu URL có truyền ID thông báo -> Giữ cố định -->
            <template v-if="fixedThongBao">
              <input
                type="text"
                class="form-control"
                :value="`[${fixedThongBao.id}] ${fixedThongBao.tieu_de}`"
                disabled
              />
              <!-- Hidden Field giúp VeeValidate không bị bỏ sót data -->
              <Field
                type="hidden"
                name="id_thong_bao"
                v-model="formData.id_thong_bao"
              />
            </template>

            <!-- Nếu không có ID thông báo trên URL -> Cho chọn qua BaseSearchSelect -->
            <template v-else>
              <Field
                name="id_thong_bao"
                v-model="formData.id_thong_bao"
                v-slot="{ errors }"
              >
                <BaseSearchSelect
                  v-model="formData.id_thong_bao"
                  :options="dsThongBao"
                  label-key="tieu_de"
                  value-key="id"
                  placeholder="Nhập tiêu đề hoặc mã thông báo để chọn..."
                  :invalid="errors.length > 0"
                />
              </Field>
            </template>

            <ErrorMessage name="id_thong_bao" class="text-danger small" />
          </div>

          <hr class="my-4" />

          <!-- 2. PHƯƠNG THỨC CHỌN KHÁCH HÀNG (sử dụng CustomerSelector)-->
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
              <i class="fas fa-paper-plane me-1"></i> Gửi Thông Báo
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

import ThongBaoService from "@/services/thong-bao.service";
import KhachHangService from "@/services/khach-hang.service";
import ChiTietThongBaoService from "@/services/chi-tiet-thong-bao.service";

export default {
  name: "PhanPhatThongBaoView",
  components: {
    Form,
    Field,
    ErrorMessage,
    BaseSearchSelect,
    BaseMultiSearchSelect,
    CustomerSelector,
  },
  props: {
    id: { type: String, required: false, default: null }, // Nhận :id thông báo truyền qua router props (nếu có)
  },
  data() {
    return {
      isSubmitting: false,
      dsThongBao: [],
      fixedThongBao: null,
      formData: {
        id_thong_bao: "",
        type: "GROUP",
        ds_khach_hang_id: [],
      },
    };
  },
  computed: {
    phanPhatSchema() {
      return yup.object().shape({
        id_thong_bao: yup
          .string()
          .required("Vui lòng chọn thông báo cần phân phát."),
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
    // 1. Tải đồng thời Danh sách Thông báo, Khách hàng và Hạng Thành Viên
    await this.fetchThongBao();

    // 2. Nếu có truyền id thông báo từ URL sang
    if (this.id) {
      this.fixedThongBao = await ThongBaoService.get(this.id);
      this.formData.id_thong_bao = this.id;
    }
  },

  methods: {
    async fetchThongBao() {
      try {
        this.dsThongBao = await ThongBaoService.getAll({});
      } catch (err) {
        console.error("Lỗi nạp danh sách thông báo:", err);
      }
    },

    handleCustomerChange({ type, ids }) {
      this.formData.type = type;
      this.formData.ds_khach_hang_id = ids;
    },

    async handleSubmit() {
      if (this.formData.ds_khach_hang_id.length === 0) {
        alert("Không tìm thấy khách hàng phù hợp để gửi thông báo!");
        return;
      }

      // Khớp với cấu trúc chi_tiet_thong_bao
      const payload = {
        id_thong_bao: this.formData.id_thong_bao,
        danh_sach_id_khach_hang: this.formData.ds_khach_hang_id,
        da_doc: false,
      };

      try {
        this.isSubmitting = true;
        const res = await ChiTietThongBaoService.create(payload);
        alert(res.data?.message || "Gửi thông báo thành công!");
        this.goBack();
      } catch (error) {
        console.error("Lỗi phân phát thông báo:", error);
        alert("Có lỗi xảy ra khi gửi thông báo!");
      } finally {
        this.isSubmitting = false;
      }
    },

    goBack() {
      this.$router.push({ name: "thong-bao.home" });
    },
  },
};
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
