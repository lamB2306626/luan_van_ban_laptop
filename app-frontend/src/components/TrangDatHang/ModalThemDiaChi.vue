<template>
  <!-- Modal Bootstrap -->
  <div
    class="modal fade"
    :class="{ show: show, 'd-block': show }"
    tabindex="-1"
    style="background-color: rgba(0, 0, 0, 0.5)"
    v-if="show"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content border-0 shadow">
        <div class="modal-header bg-light py-3">
          <h5 class="modal-title fw-bold text-dark">
            <i class="fas fa-map-marker-alt text-primary me-2"></i>Thêm địa chỉ
            giao hàng mới
          </h5>
          <button
            type="button"
            class="btn-close"
            @click="closeModal"
            :disabled="loading"
          ></button>
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="modal-body p-4">
            <div class="row g-3">
              <!-- TÊN NGƯỜI NHẬN -->
              <div class="col-12">
                <label class="form-label fw-semibold">
                  Tên người nhận <span class="text-danger">*</span>
                </label>
                <input
                  type="text"
                  class="form-control"
                  v-model.trim="formData.ten_nguoi_nhan"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  required
                />
              </div>

              <!-- SỐ ĐIỆN THOẠI -->
              <div class="col-12">
                <label class="form-label fw-semibold">
                  Số điện thoại <span class="text-danger">*</span>
                </label>
                <input
                  type="tel"
                  class="form-control"
                  v-model.trim="formData.sdt_nguoi_nhan"
                  placeholder="Ví dụ: 0912345678"
                  required
                />
              </div>

              <!-- ĐỊA CHỈ CHI TIẾT -->
              <div class="col-12">
                <label class="form-label fw-semibold">
                  Địa chỉ chi tiết <span class="text-danger">*</span>
                </label>
                <textarea
                  class="form-control"
                  rows="3"
                  v-model.trim="formData.dia_chi"
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/TP..."
                  required
                ></textarea>
              </div>

              <!-- ĐẶT LÀM MẶC ĐỊNH -->
              <div class="col-12">
                <div class="form-check">
                  <input
                    class="form-check-input cursor-pointer"
                    type="checkbox"
                    id="la_mac_dinh"
                    v-model="formData.la_mac_dinh"
                  />
                  <label
                    class="form-check-label cursor-pointer text-dark"
                    for="la_mac_dinh"
                  >
                    Đặt làm địa chỉ mặc định
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer bg-light py-2">
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              @click="closeModal"
              :disabled="loading"
            >
              Hủy
            </button>
            <button
              type="submit"
              class="btn btn-primary btn-sm fw-bold px-3"
              :disabled="loading"
            >
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-1"
                role="status"
              ></span>
              Lưu địa chỉ
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import DiaChiService from "@/services/dia-chi.service";

export default {
  name: "ModalThemDiaChi",
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: String,
      required: true,
    },
  },
  emits: ["close", "success"],
  data() {
    return {
      loading: false,
      formData: {
        ten_nguoi_nhan: "",
        sdt_nguoi_nhan: "",
        dia_chi: "",
        la_mac_dinh: false,
      },
    };
  },
  watch: {
    show(newVal) {
      if (newVal) {
        this.resetForm();
      }
    },
  },
  methods: {
    resetForm() {
      this.formData = {
        ten_nguoi_nhan: "",
        sdt_nguoi_nhan: "",
        dia_chi: "",
        la_mac_dinh: false,
      };
    },
    closeModal() {
      this.$emit("close");
    },
    async handleSubmit() {
      if (
        !this.formData.ten_nguoi_nhan ||
        !this.formData.sdt_nguoi_nhan ||
        !this.formData.dia_chi
      ) {
        alert("Vui lòng điền đầy đủ các thông tin bắt buộc!");
        return;
      }

      this.loading = true;

      try {
        const payload = {
          id_khach_hang: this.userId,
          ten_nguoi_nhan: this.formData.ten_nguoi_nhan,
          sdt_nguoi_nhan: this.formData.sdt_nguoi_nhan,
          dia_chi: this.formData.dia_chi,
          la_mac_dinh: this.formData.la_mac_dinh,
        };

        const newAddress = await DiaChiService.create(payload);
        alert("Thêm địa chỉ thành công!");
        this.$emit("success", newAddress);
        this.closeModal();
      } catch (error) {
        console.error("Lỗi khi thêm địa chỉ:", error);
        alert(
          error.response?.data?.message ||
            "Không thể thêm địa chỉ. Vui lòng thử lại!",
        );
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
