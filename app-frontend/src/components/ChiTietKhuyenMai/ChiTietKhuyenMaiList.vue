<template>
  <div>
    <!-- Thanh công cụ: Tiêu đề & Nút Thêm mới -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0 text-secondary">
        <i class="fas fa-tags me-2"></i>Danh Sách Sản Phẩm Áp Dụng Khuyến Mãi
      </h5>
      <button
        class="btn btn-success btn-sm"
        :class="{ 'btn-permission-muted': !canManageDotKhuyenMai }"
        @click="openAddModal"
      >
        <i class="fas fa-plus me-1"></i> Thêm Sản Phẩm Khuyến Mãi
      </button>
    </div>

    <!-- Thông báo lỗi / thành công (nếu có) -->
    <div
      v-if="message"
      class="alert alert-info alert-dismissible fade show py-2 mb-3"
      role="alert"
    >
      {{ message }}
      <button
        type="button"
        class="btn-close py-2"
        @click="message = ''"
      ></button>
    </div>

    <!-- Bảng danh sách chi tiết khuyến mãi -->
    <ChiTietKhuyenMaiTable
      :dsChiTiet="dsChiTiet"
      :canManageDotKhuyenMai="canManageDotKhuyenMai"
      @edit:chiTiet="openEditModal"
      @delete:chiTiet="handleDelete"
    />

    <!-- MODAL POPUP: FORM THÊM / SỬA CHI TIẾT KHUYẾN MÃI -->
    <div
      class="modal fade"
      id="chiTietKhuyenMaiModal"
      tabindex="-1"
      ref="chiTietKhuyenMaiModal"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{
                isEdit
                  ? "Chỉnh Sửa Chi Tiết Khuyến Mãi"
                  : "Thêm Sản Phẩm Vào Đợt Khuyến Mãi"
              }}
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="closeModal"
            ></button>
          </div>
          <div class="modal-body">
            <ChiTietKhuyenMaiForm
              v-if="showForm"
              :dsIdSanPhamDaApDung="existingProductIds"
              :chiTiet="selectedChiTiet"
              :isEdit="isEdit"
              @submit:chiTiet="handleSave"
              @cancel="closeModal"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ChiTietKhuyenMaiTable from "./ChiTietKhuyenMaiTable.vue";
import ChiTietKhuyenMaiForm from "./ChiTietKhuyenMaiForm.vue";
import ChiTietKhuyenMaiService from "@/services/chi-tiet-khuyen-mai.service";

import { Modal } from "bootstrap";

export default {
  name: "ChiTietKhuyenMaiList",
  components: {
    ChiTietKhuyenMaiTable,
    ChiTietKhuyenMaiForm,
  },
  props: {
    idDotKm: { type: String, required: true }, // Mã đợt khuyến mãi cha
    canManageDotKhuyenMai: {
      type: Boolean,
      default: false, // người dùng hiện tại có quyền thêm/sửa sản phẩm hay không
    },
  },
  data() {
    return {
      dsChiTiet: [],
      selectedChiTiet: null,
      isEdit: false,
      showForm: false,
      message: "",
      modalInstance: null,
    };
  },
  computed: {
    // Tự động quét mảng chi tiết hiện có để gom ra danh sách các ID sản phẩm đã được thêm vào đợt KM này
    // sau đó truyền vào form thêm mới chi tiết khuyến mãi để form này disable các sản phẩm đã chọn tránh chọn lại sản phẩm
    existingProductIds() {
      if (!Array.isArray(this.dsChiTiet)) return [];
      // Giả sử mỗi item trong dsChiTiet có chứa id_san_pham
      return this.dsChiTiet.map((item) => item.id_san_pham);
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

    // Lấy danh sách chi tiết khuyến mãi theo idDotKm
    async fetchChiTietList() {
      try {
        if (ChiTietKhuyenMaiService) {
          this.dsChiTiet = await ChiTietKhuyenMaiService.getAll({
            id_dot_km: this.idDotKm,
          });
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách chi tiết khuyến mãi:", error);
      }
    },

    // Mở Modal Thêm mới
    openAddModal() {
      if (!this.canManageDotKhuyenMai) {
        this.notifyAccessDenied();
        return;
      }

      this.isEdit = false;
      this.selectedChiTiet = {
        id_dot_km: this.idDotKm,
        danh_sach_id_san_pham: [],
        loai_giam_gia: "PHAN_TRAM", // Hoặc 'FIXED' tùy định dạng hệ thống của bạn
        gia_tri_giam: 0,
      };
      this.showForm = true;
      this.getModalInstance().show();
    },

    // Mở Modal Chỉnh sửa
    openEditModal(chiTiet) {
      this.isEdit = true;
      this.selectedChiTiet = { ...chiTiet };
      this.showForm = true;
      this.getModalInstance().show();
    },

    // Đóng Modal
    closeModal() {
      this.showForm = false;
      this.getModalInstance().hide();
    },

    // Khởi tạo instance của Bootstrap Modal
    getModalInstance() {
      if (!this.modalInstance && this.$refs.chiTietKhuyenMaiModal) {
        this.modalInstance = new Modal(this.$refs.chiTietKhuyenMaiModal);
      }
      return this.modalInstance;
    },

    // Lưu chi tiết khuyến mãi (Create / Update)
    async handleSave(data) {
      try {
        // Gán hoặc đảm bảo id_dot_km luôn chính xác
        const payload = {
          ...data,
          id_dot_km: this.idDotKm,
        };

        if (this.isEdit) {
          await ChiTietKhuyenMaiService.update(payload.id, payload);
          this.message = "Cập nhật chi tiết khuyến mãi thành công!";
        } else {
          await ChiTietKhuyenMaiService.create(payload);
          this.message = "Thêm sản phẩm vào đợt khuyến mãi thành công!";
        }

        this.closeModal();
        await this.fetchChiTietList(); // Tải lại danh sách
        this.$emit("refreshDotKhuyenMai"); // Phát sự kiện để cập nhật lại Đợt khuyến mãi cha nếu cần
      } catch (error) {
        console.error("Lỗi khi lưu chi tiết khuyến mãi:", error);
        this.message =
          error.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại.";
      }
    },

    // Xóa sản phẩm khỏi đợt khuyến mãi
    async handleDelete(chiTiet) {
      if (confirm(`Bạn có chắc muốn xóa sản phẩm này khỏi đợt khuyến mãi?`)) {
        try {
          await ChiTietKhuyenMaiService.delete(chiTiet.id);
          this.message = "Đã xóa thành công!";
          await this.fetchChiTietList();
          this.$emit("refreshDotKhuyenMai");
        } catch (error) {
          console.error("Lỗi khi xóa chi tiết khuyến mãi:", error);
          this.message = "Xóa chi tiết khuyến mãi thất bại.";
        }
      }
    },
  },
  mounted() {
    this.fetchChiTietList();
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
