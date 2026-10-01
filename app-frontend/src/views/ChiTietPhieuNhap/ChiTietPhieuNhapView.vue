<template>
  <div class="container mt-3">
    <!-- Nút Quay lại & Tiêu đề Trang -->
    <div class="d-flex align-items-center mb-3">
      <button class="btn btn-outline-secondary me-3" @click="goBack">
        <i class="fas fa-arrow-left me-1"></i> Quay lại
      </button>
      <h4 class="mb-0">
        Chi Tiết Phiếu Nhập: <span class="text-primary">{{ idPhieuNhap }}</span>
      </h4>
    </div>

    <!-- Khung thông tin tổng quan Phiếu nhập -->
    <div class="card mb-4 shadow-sm" v-if="phieuNhap">
      <div class="card-body bg-light">
        <div class="row">
          <div class="col-md-4">
            <strong>Nhân viên lập:</strong>
            <span class="ms-1">{{ phieuNhap.nhan_vien?.ho_ten || phieuNhap.id_nhan_vien }}</span>
          </div>
          <div class="col-md-4">
            <strong>Ngày nhập:</strong>
            <span class="ms-1">{{ formatDate(phieuNhap.ngay_nhap) }}</span>
          </div>
          <div class="col-md-4">
            <strong>Tổng tiền:</strong>
            <span class="ms-1 fw-bold text-danger fs-6">{{ formatCurrency(phieuNhap.tong_tien) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Thanh công cụ: Tiêu đề & Nút Thêm sản phẩm vào phiếu -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0 text-secondary">
        <i class="fas fa-list me-2"></i>Danh Sách Sản Phẩm Nhập
      </h5>
      <button class="btn btn-success btn-sm" @click="openAddModal">
        <i class="fas fa-plus me-1"></i> Thêm Sản Phẩm Vao Phiếu
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
      id="chiTietModal"
      tabindex="-1"
      ref="chiTietModal"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ isEdit ? "Chỉnh Sửa Chi Tiết Phiếu Nhập" : "Thêm Sản Phẩm Vào Phiếu Nhập" }}
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
import ChiTietPhieuNhapTable from "@/components/ChiTietPhieuNhap/ChiTietPhieuNhapTable.vue";
import ChiTietPhieuNhapForm from "@/components/ChiTietPhieuNhap/ChiTietPhieuNhapForm.vue";
import ChiTietPhieuNhapService from "@/services/chi-tiet-phieu-nhap.service";
import PhieuNhapService from "@/services/phieu-nhap.service";

import { Modal } from "bootstrap";

export default {
  name: "ChiTietPhieuNhapView",
  components: {
    ChiTietPhieuNhapTable,
    ChiTietPhieuNhapForm,
  },
  props: {
    id: { type: String, required: true }, // Nhận mã phiếu nhập từ router params (:id)
  },
  data() {
    return {
      idPhieuNhap: this.id,
      phieuNhap: null,
      dsChiTiet: [],
      selectedChiTiet: null,
      isEdit: false,
      showForm: false,
      message: "",
      modalInstance: null,
    };
  },
  methods: {
    // Định dạng tiền tệ VNĐ
    formatCurrency(value) {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value || 0);
    },

    // Định dạng ngày tháng
    formatDate(dateString) {
      if (!dateString) return "";
      return new Date(dateString).toLocaleString("vi-VN");
    },

    // Quay lại danh sách Phiếu nhập
    goBack() {
      this.$router.push({ name: "phieu-nhap.home" });
    },

    // Lấy thông tin chung của Phiếu Nhập (để hiển thị tiêu đề, tổng tiền)
    async fetchPhieuNhapInfo() {
      try {
        if (PhieuNhapService) {
          this.phieuNhap = await PhieuNhapService.get(this.idPhieuNhap);
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin phiếu nhập:", error);
      }
    },

    // Lấy danh sách chi tiết phiếu nhập theo ID Phiếu Nhập
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

    // Mở Modal Thêm sản phẩm mới
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
      this.selectedChiTiet = {
        ...chiTiet,
      };
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
      if (!this.modalInstance && this.$refs.chiTietModal) {
        this.modalInstance = new Modal(this.$refs.chiTietModal);
      }
      return this.modalInstance;
    },

    // Lưu chi tiết (Thêm / Sửa)
    async handleSave(data) {
      try {
        const payload = {
          id_phieu_nhap: this.idPhieuNhap,
          id_bien_the: data.id_bien_the,
          so_luong_nhap: Number(data.so_luong_nhap),
          gia_nhap: Number(data.gia_nhap),
        };

        if (this.isEdit) {
          await ChiTietPhieuNhapService.update(data.id, payload);
          this.message = "Cập nhật chi tiết phiếu nhập thành công!";
        } else {
          await ChiTietPhieuNhapService.create(payload);
          this.message = "Thêm sản phẩm vào phiếu nhập thành công!";
        }

        this.closeModal();
        await this.fetchChiTietList(); // Tải lại danh sách chi tiết
        await this.fetchPhieuNhapInfo(); // Tải lại tổng tiền mới của phiếu
      } catch (error) {
        console.error("Lỗi khi lưu chi tiết phiếu nhập:", error);
        this.message =
          error.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại.";
      }
    },

    // Xóa chi tiết phiếu nhập
    async handleDelete(chiTiet) {
      if (confirm(`Bạn có chắc chắn muốn xóa sản phẩm này khỏi phiếu nhập không?`)) {
        try {
          await ChiTietPhieuNhapService.delete(chiTiet.id);
          this.message = "Đã xóa sản phẩm khỏi phiếu nhập!";
          await this.fetchChiTietList();
          await this.fetchPhieuNhapInfo();
        } catch (error) {
          console.error("Lỗi khi xóa chi tiết phiếu nhập:", error);
          this.message = "Xóa thất bại.";
        }
      }
    },
  },
  async mounted() {
    await this.fetchPhieuNhapInfo();
    await this.fetchChiTietList();
  },
};
</script>