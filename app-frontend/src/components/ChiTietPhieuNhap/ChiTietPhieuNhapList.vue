<template>
  <div>
    <!-- Thanh công cụ: Tiêu đề & Nút Thêm mới -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0 text-secondary">
        <i class="fas fa-boxes-packing me-2"></i>Danh Sách Chi Tiết Phiếu Nhập
      </h5>
      <button class="btn btn-success btn-sm" @click="openAddModal">
        <i class="fas fa-plus me-1"></i> Thêm Sản Phẩm Vào Phiếu
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

    <!-- Bảng danh sách chi tiết phiếu nhập -->
    <ChiTietPhieuNhapTable
      :dsChiTiet="dsChiTiet"
      @edit:chiTiet="openEditModal"
      @delete:chiTiet="handleDelete"
    />

    <!-- MODAL POPUP: FORM THÊM / SỬA CHI TIẾT PHIẾU NHẬP -->
    <div
      class="modal fade"
      id="chiTietPhieuNhapModal"
      tabindex="-1"
      ref="chiTietPhieuNhapModal"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{
                isEdit
                  ? "Chỉnh Sửa Chi Tiết Nhập"
                  : "Thêm Sản Phẩm Vào Phiếu Nhập"
              }}
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="closeModal"
            ></button>
          </div>
          <div class="modal-body">
            <ChiTietPhieuNhapForm
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
import ChiTietPhieuNhapTable from "./ChiTietPhieuNhapTable.vue";
import ChiTietPhieuNhapForm from "./ChiTietPhieuNhapForm.vue";
import ChiTietPhieuNhapService from "@/services/chi-tiet-phieu-nhap.service";

import { Modal } from "bootstrap";

export default {
  name: "ChiTietPhieuNhapList",
  components: {
    ChiTietPhieuNhapTable,
    ChiTietPhieuNhapForm,
  },
  props: {
    idPhieuNhap: { type: String, required: true }, // Mã phiếu nhập cha
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
    // Lấy danh sách chi tiết phiếu nhập theo idPhieuNhap
    async fetchChiTietList() {
      try {
        if (ChiTietPhieuNhapService) {
          this.dsChiTiet = await ChiTietPhieuNhapService.getAll({
            id_phieu_nhap: this.idPhieuNhap,
          });
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách chi tiết phiếu nhập:", error);
      }
    },

    // Mở Modal Thêm mới
    openAddModal() {
      this.isEdit = false;
      this.selectedChiTiet = {
        id_phieu_nhap: this.idPhieuNhap,
        id_bien_the: "",
        so_luong_nhap: 1,
        gia_nhap: 0,
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
      if (!this.modalInstance && this.$refs.chiTietPhieuNhapModal) {
        this.modalInstance = new Modal(this.$refs.chiTietPhieuNhapModal);
      }
      return this.modalInstance;
    },

    // Lưu chi tiết phiếu nhập (Create / Update)
    async handleSave(data) {
      try {
        // Gán hoặc đảm bảo id_phieu_nhap luôn chính xác
        const payload = {
          ...data,
          id_phieu_nhap: this.idPhieuNhap,
        };

        if (this.isEdit) {
          await ChiTietPhieuNhapService.update(payload.id, payload);
          this.message = "Cập nhật chi tiết phiếu nhập thành công!";
        } else {
          await ChiTietPhieuNhapService.create(payload);
          this.message = "Thêm sản phẩm vào phiếu nhập thành công!";
        }

        this.closeModal();
        await this.fetchChiTietList(); // Tải lại danh sách
        this.$emit("refreshPhieuNhap"); // Phát sự kiện để cập nhật lại Tổng Tiền ở phiếu nhập cha (nếu cần)
      } catch (error) {
        console.error("Lỗi khi lưu chi tiết phiếu nhập:", error);
        this.message =
          error.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại.";
      }
    },

    // Xóa sản phẩm khỏi phiếu nhập
    async handleDelete(chiTiet) {
      if (
        confirm(`Bạn có chắc muốn xóa chi tiết sản phẩm này khỏi phiếu nhập?`)
      ) {
        try {
          await ChiTietPhieuNhapService.delete(chiTiet.id);
          this.message = "Đã xóa thành công!";
          await this.fetchChiTietList();
          this.$emit("refreshPhieuNhap"); // Phát sự kiện để cập nhật lại Tổng Tiền ở phiếu nhập cha
        } catch (error) {
          console.error("Lỗi khi xóa chi tiết phiếu nhập:", error);
          this.message = "Xóa chi tiết phiếu nhập thất bại.";
        }
      }
    },
  },
  mounted() {
    this.fetchChiTietList();
  },
};
</script>
