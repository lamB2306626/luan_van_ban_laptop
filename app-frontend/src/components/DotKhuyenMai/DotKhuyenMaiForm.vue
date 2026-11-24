<template>
  <Form
    @submit="submitDotKhuyenMai"
    :validation-schema="dotKhuyenMaiFormSchema"
  >
    <!-- Mã Đợt Khuyến Mãi: Chỉ hiển thị khi Cập nhật -->
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
      <label for="ten_dot"
        >Tên Đợt Khuyến Mãi <span class="text-danger">*</span>:</label
      >
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
      <label for="ngay_bat_dau"
        >Ngày Bắt Đầu <span class="text-danger">*</span>:</label
      >
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
      <label for="ngay_ket_thuc"
        >Ngày Kết Thúc <span class="text-danger">*</span>:</label
      >
      <Field
        name="ngay_ket_thuc"
        type="date"
        class="form-control"
        v-model="dotKhuyenMaiLocal.ngay_ket_thuc"
      />
      <ErrorMessage name="ngay_ket_thuc" class="text-danger small" />
    </div>

    <!-- 🌟 BẢNG DANH SÁCH CHI TIẾT KHUYẾN MÃI TẠM THỜI (CHỈ HIỂN THỊ KHI THÊM MỚI) -->
    <div v-if="!isEdit" class="border rounded p-3 mb-4 bg-light">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h6 class="fw-bold mb-0 text-primary">
          <i class="fas fa-list me-1"></i> Danh Sách Sản Phẩm Áp Dụng Khuyến Mãi
        </h6>
        <button
          type="button"
          class="btn btn-sm btn-success"
          @click="openAddChiTietModal"
        >
          <i class="fas fa-plus me-1"></i> Thêm Sản Phẩm Khuyến Mãi
        </button>
      </div>

      <!-- Bảng hiển thị danh sách chi tiết tạm -->
      <ChiTietKhuyenMaiTable
        :dsChiTiet="dsChiTietTam"
        canManageDotKhuyenMai="canManageDotKhuyenMai"
        @edit:chi-tiet="openEditModal"
        @delete:chiTiet="handleRemoveChiTietTam"
      />
    </div>

    <!-- MODAL POPUP CHỨA FORM CHI TIẾT KHUYẾN MÃI -->
    <div
      v-if="!isEdit"
      class="modal fade"
      id="modalChiTietKM"
      tabindex="-1"
      ref="modalChiTietKM"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{
                isEditChiTiet
                  ? "Chỉnh Sửa Chi Tiết Khuyến Mãi"
                  : "Thêm Sản Phẩm Vào Đợt Khuyến Mãi"
              }}
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="closeChiTietModal"
            ></button>
          </div>
          <div class="modal-body">
            <ChiTietKhuyenMaiForm
              v-if="showChiTietModal"
              :chiTiet="selectedChiTiet"
              :dsIdSanPhamDaApDung="existingProductIds"
              :isEdit="isEditChiTiet"
              @submit:chiTiet="handleSaveChiTietTam"
              @cancel="closeChiTietModal"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Các nút hành động -->
    <div class="form-group mt-4">
      <button
        class="btn btn-primary"
        :class="{ 'btn-permission-muted': !canManageDotKhuyenMai }"
      >
        <i class="fas fa-save me-1"></i> Lưu lại
      </button>
      <button type="button" class="btn btn-secondary ms-2" @click="cancel">
        <i class="fas fa-times me-1"></i> Hủy
      </button>
    </div>
  </Form>
</template>

<script>
import * as yup from "yup";
import { Form, Field, ErrorMessage } from "vee-validate";
import { Modal } from "bootstrap";

// Import các component con liên quan
import ChiTietKhuyenMaiTable from "@/components/ChiTietKhuyenMai/ChiTietKhuyenMaiTable.vue";
import ChiTietKhuyenMaiForm from "@/components/ChiTietKhuyenMai/ChiTietKhuyenMaiForm.vue";

export default {
  name: "DotKhuyenMaiForm",
  components: {
    Form,
    Field,
    ErrorMessage,
    ChiTietKhuyenMaiTable,
    ChiTietKhuyenMaiForm,
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
    canManageDotKhuyenMai: {
      type: Boolean,
      default: false, // người dùng hiện tại có quyền thêm/sửa sản phẩm hay không
    },
    isEdit: { type: Boolean, default: false },
  },
  emits: ["submit:dotKhuyenMai", "cancel"],
  data() {
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
          "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.",
        ),
    });

    return {
      dotKhuyenMaiLocal: this.formatDataForForm(this.dotKhuyenMai),
      dotKhuyenMaiFormSchema,

      // Các biến quản lý chi tiết khuyến mãi tạm thời
      dsChiTietTam: [],
      showChiTietModal: false,
      modalChiTietInstance: null,
      isEditChiTiet: false,
      selectedChiTiet: null,
    };
  },
  watch: {
    dotKhuyenMai: {
      handler(newVal) {
        this.dotKhuyenMaiLocal = this.formatDataForForm(newVal);
      },
      deep: true,
    },
  },
  computed: {
    // Lấy mảng danh sách ID sản phẩm (trong danh sách tạm) đã áp dụng đợt khuyến mãi này
    existingProductIds() {
      if (!Array.isArray(this.dsChiTietTam)) return [];
      return this.dsChiTietTam.map((item) => item.id_san_pham);
    },
  },
  methods: {
    // ==================== Phát tín hiệu không có quyền thực hiện thao tác ====================
    notifyAccessDenied(message = "Bạn không có quyền thực hiện thao tác này!") {
      window.dispatchEvent(
        new CustomEvent("admin-access-denied", {
          detail: { message },
        }),
      );
    },

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

    // ======================== QUẢN LÝ MODAL & MẢNG TẠM CHI TIẾT KM ========================
    openAddChiTietModal() {
      this.isEditChiTiet = false;
      this.selectedChiTiet = {
        loai_giam_gia: "PHAN_TRAM",
        gia_tri_giam: 0,
        danh_sach_id_san_pham: [],
      };
      this.showChiTietModal = true;
      this.$nextTick(() => {
        if (!this.modalChiTietInstance && this.$refs.modalChiTietKM) {
          this.modalChiTietInstance = new Modal(this.$refs.modalChiTietKM);
        }
        this.modalChiTietInstance?.show();
      });
    },

    closeChiTietModal() {
      this.modalChiTietInstance?.hide();
      this.showChiTietModal = false;
    },

    handleSaveChiTietTam(dataChiTiet) {
      if (this.isEditChiTiet) {
        // Trường hợp Cập nhật (Sửa một dòng cụ thể)
        const index = this.dsChiTietTam.findIndex(
          (item) => item.id === this.selectedChiTiet.id,
        );
        if (index !== -1) {
          this.dsChiTietTam[index] = {
            ...this.dsChiTietTam[index],
            ...dataChiTiet,
          };
        }
      } else {
        const danhSachMoi = dataChiTiet.ds_chi_tiet || [];

        danhSachMoi.forEach((item) => {
          this.dsChiTietTam.push({
            ...item,
            id: `KM_TAM_${Date.now()}_${Math.random()}`, // Tạo ID tạm cho bảng
          });
        });
      }

      this.closeChiTietModal();
    },

    openEditModal(itemSua) {
      this.isEditChiTiet = true;
      this.selectedChiTiet = { ...itemSua };
      this.showChiTietModal = true;
      this.modalChiTietInstance?.show();
    },

    handleRemoveChiTietTam(itemXoa) {
      this.dsChiTietTam = this.dsChiTietTam.filter(
        (item) => item.id !== itemXoa.id,
      );
    },
    // ===================================================================================

    submitDotKhuyenMai() {
      if (!this.canManageDotKhuyenMai) {
        this.notifyAccessDenied();
        return;
      }

      if (!this.isEdit && this.dsChiTietTam.length === 0) {
        alert("Vui lòng thêm ít nhất 1 sản phẩm áp dụng khuyến mãi!");
        return;
      }

      const payload = { ...this.dotKhuyenMaiLocal };

      // Đính kèm mảng chi tiết tạm vào payload khi thêm mới
      if (!this.isEdit) {
        payload.ds_chi_tiet = this.dsChiTietTam;
      }

      this.$emit("submit:dotKhuyenMai", payload);
    },

    cancel() {
      this.$emit("cancel");
    },
  },
};
</script>

<style scoped>
.btn-permission-muted {
  opacity: 0.45;
  cursor: pointer;
}

.btn-permission-muted:hover {
  opacity: 0.65;
}
</style>
