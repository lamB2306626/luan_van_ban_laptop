<template>
  <div class="container mt-3">
    <!-- Nút Quay lại & Tiêu đề Trang -->
    <div class="d-flex align-items-center mb-3">
      <button class="btn btn-outline-secondary me-3" @click="goBack">
        <i class="fas fa-arrow-left me-1"></i> Quay lại
      </button>
      <h4 class="mb-0">
        Chi Tiết Đợt Khuyến Mãi: <span class="text-primary">{{ idDotKM }}</span>
      </h4>
    </div>

    <!-- Khung thông tin tổng quan Đợt Khuyến Mãi -->
    <div class="card mb-4 shadow-sm" v-if="dotKhuyenMai">
      <div class="card-body bg-light">
        <div class="row align-items-center">
          <div class="col-md-4">
            <strong>Tên đợt:</strong>
            <span class="ms-1 fw-bold text-dark">{{ dotKhuyenMai.ten_dot }}</span>
          </div>
          <div class="col-md-3">
            <strong>Từ ngày:</strong>
            <span class="ms-1">{{ formatDate(dotKhuyenMai.ngay_bat_dau) }}</span>
          </div>
          <div class="col-md-3">
            <strong>Đến ngày:</strong>
            <span class="ms-1">{{ formatDate(dotKhuyenMai.ngay_ket_thuc) }}</span>
          </div>
          <div class="col-md-2 text-end">
            <span
              class="badge px-3 py-2"
              :class="isKhaDung(dotKhuyenMai) ? 'bg-success' : 'bg-secondary'"
            >
              {{ isKhaDung(dotKhuyenMai) ? 'Đang diễn ra' : 'Hết hiệu lực' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Thanh công cụ: Tiêu đề & Nút Thêm sản phẩm vào đợt khuyến mãi -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0 text-secondary">
        <i class="fas fa-tags me-2"></i>Danh Sách Sản Phẩm Áp Dụng
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
      id="chiTietModal"
      tabindex="-1"
      ref="chiTietModal"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ isEdit ? "Chỉnh Sửa Mức Giảm Giá" : "Thêm Sản Phẩm Vào Đợt Khuyến Mãi" }}
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
import ChiTietKhuyenMaiTable from "@/components/ChiTietKhuyenMai/ChiTietKhuyenMaiTable.vue";
import ChiTietKhuyenMaiForm from "@/components/ChiTietKhuyenMai/ChiTietKhuyenMaiForm.vue";
import ChiTietKhuyenMaiService from "@/services/chi-tiet-khuyen-mai.service";
import DotKhuyenMaiService from "@/services/dot-khuyen-mai.service";

import { Modal } from "bootstrap";

export default {
  name: "ChiTietKhuyenMaiView",
  components: {
    ChiTietKhuyenMaiTable,
    ChiTietKhuyenMaiForm,
  },
  props: {
    id: { type: String, required: true }, // Nhận mã đợt khuyến mãi từ router params (:id)
  },
  data() {
    return {
      idDotKM: this.id,
      dotKhuyenMai: null,
      dsChiTiet: [],
      selectedChiTiet: null,
      isEdit: false,
      showForm: false,
      message: "",
      modalInstance: null,
    };
  },
  methods: {
    // Định dạng ngày tháng
    formatDate(dateString) {
      if (!dateString) return "";
      return new Date(dateString).toLocaleDateString("vi-VN");
    },

    // Kiểm tra đợt khuyến mãi có khả dụng hay không
    isKhaDung(dot) {
      if (!dot?.ngay_bat_dau || !dot?.ngay_ket_thuc) return false;
      const now = new Date();
      return new Date(dot.ngay_bat_dau) <= now && now <= new Date(dot.ngay_ket_thuc);
    },

    // Quay lại danh sách Đợt Khuyến Mãi
    goBack() {
      this.$router.push({ name: "dot-khuyen-mai.home" });
    },

    // Lấy thông tin chung của Đợt Khuyến Mãi
    async fetchDotKhuyenMaiInfo() {
      try {
        if (DotKhuyenMaiService) {
          this.dotKhuyenMai = await DotKhuyenMaiService.get(this.idDotKM);
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin đợt khuyến mãi:", error);
      }
    },

    // Lấy danh sách chi tiết khuyến mãi theo ID Đợt Khuyến Mãi
    async fetchChiTietList() {
      try {
        if (ChiTietKhuyenMaiService) {
          this.dsChiTiet = await ChiTietKhuyenMaiService.getAll({
            id_dot_km: this.idDotKM,
          });
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách chi tiết khuyến mãi:", error);
      }
    },

    // Mở Modal Thêm sản phẩm khuyến mãi mới
    openAddModal() {
      this.isEdit = false;
      this.selectedChiTiet = {
        id_dot_km: this.idDotKM,
        id_san_pham: "",
        loai_giam_gia: "PERCENT",
        gia_tri_giam: 0,
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
          id_dot_km: this.idDotKM,
          id_san_pham: data.id_san_pham,
          loai_giam_gia: data.loai_giam_gia,
          gia_tri_giam: Number(data.gia_tri_giam),
        };

        if (this.isEdit) {
          await ChiTietKhuyenMaiService.update(data.id, payload);
          this.message = "Cập nhật chi tiết khuyến mãi thành công!";
        } else {
          await ChiTietKhuyenMaiService.create(payload);
          this.message = "Thêm sản phẩm vào đợt khuyến mãi thành công!";
        }

        this.closeModal();
        await this.fetchChiTietList(); // Tải lại danh sách chi tiết
      } catch (error) {
        console.error("Lỗi khi lưu chi tiết khuyến mãi:", error);
        this.message =
          error.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại.";
      }
    },

    // Xóa sản phẩm khỏi đợt khuyến mãi
    async handleDelete(chiTiet) {
      if (confirm(`Bạn có chắc chắn muốn xóa sản phẩm này khỏi đợt khuyến mãi không?`)) {
        try {
          await ChiTietKhuyenMaiService.delete(chiTiet.id);
          this.message = "Đã xóa sản phẩm khỏi đợt khuyến mãi!";
          await this.fetchChiTietList();
        } catch (error) {
          console.error("Lỗi khi xóa chi tiết khuyến mãi:", error);
          this.message = "Xóa thất bại.";
        }
      }
    },
  },
  async mounted() {
    await this.fetchDotKhuyenMaiInfo();
    await this.fetchChiTietList();
  },
};
</script>