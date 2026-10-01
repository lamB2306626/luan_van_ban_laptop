<template>
  <div>
    <!-- Thanh công cụ: Tiêu đề & Nút Thêm mới -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0 text-secondary">
        <i class="fas fa-tags me-2"></i>Danh Sách Sản Phẩm Áp Dụng Khuyến Mãi
      </h5>
      <button class="btn btn-success btn-sm" @click="openAddModal">
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
  methods: {
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
      this.isEdit = false;
      this.selectedChiTiet = {
        id_dot_km: this.idDotKm,
        id_san_pham: "",
        loai_giam_gia: "PERCENT", // Hoặc 'FIXED' tùy định dạng hệ thống của bạn
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
      if (
        confirm(`Bạn có chắc muốn xóa sản phẩm này khỏi đợt khuyến mãi?`)
      ) {
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