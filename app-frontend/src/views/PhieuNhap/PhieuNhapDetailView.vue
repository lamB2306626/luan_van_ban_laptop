<template>
  <div class="container mt-3">
    <!-- Tiêu đề & Nút quay lại -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4>
        <i class="fas fa-file-invoice-dollar text-primary me-2"></i>
        Chi Tiết Phiếu Nhập:
        <span class="text-primary">{{ phieuNhap?.id }}</span>
      </h4>
      <button class="btn btn-outline-secondary btn-sm" @click="goBack">
        <i class="fas fa-arrow-left me-1"></i> Quay lại danh sách
      </button>
    </div>

    <!-- Thanh chuyển Tab (Nav Tabs) -->
    <ul class="nav nav-tabs nav-fill mb-4" id="phieuNhapTab" role="tablist">
      <!-- Tab 1: Thông tin phiếu nhập -->
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          :class="{ active: activeTab === 'thong-tin-chung' }"
          type="button"
          @click="activeTab = 'thong-tin-chung'"
        >
          <i class="fas fa-info-circle me-2"></i>Thông Tin Phiếu Nhập
        </button>
      </li>

      <!-- Tab 2: Quản lý chi tiết phiếu nhập -->
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          :class="{ active: activeTab === 'quan-ly-chi-tiet' }"
          type="button"
          @click="activeTab = 'quan-ly-chi-tiet'"
        >
          <i class="fas fa-boxes-packing me-2"></i>Quản Lý Chi Tiết Phiếu Nhập
        </button>
      </li>
    </ul>

    <!-- Nội dung hiển thị theo từng Tab -->
    <div class="tab-content border rounded p-4 bg-white shadow-sm">
      <!-- TAB 1: THÔNG TIN PHIẾU NHẬP -->
      <div v-if="activeTab === 'thong-tin-chung'">
        <!-- Chỉ render Form khi đã lấy xong dữ liệu phieuNhap từ API -->
        <PhieuNhapForm
          v-if="phieuNhap"
          :phieuNhap="phieuNhap"
          :isEdit="true"
          @submit:phieuNhap="handleUpdatePhieuNhap"
        />
        <div v-else class="text-center py-3">
          <span class="spinner-border spinner-border-sm me-2"></span>
          Đang tải dữ liệu phiếu nhập...
        </div>

        <p v-if="messageTab1" class="mt-3 alert alert-info py-2 mb-0">
          {{ messageTab1 }}
        </p>
      </div>

      <!-- TAB 2: QUẢN LÝ CHI TIẾT PHIẾU NHẬP -->
      <div v-if="activeTab === 'quan-ly-chi-tiet'">
        <ChiTietPhieuNhapList
          :idPhieuNhap="id"
          @refreshPhieuNhap="getPhieuNhapDetail"
        />
      </div>
    </div>
  </div>
</template>

<script>
import PhieuNhapForm from "@/components/PhieuNhap/PhieuNhapForm.vue";
import ChiTietPhieuNhapList from "@/components/ChiTietPhieuNhap/ChiTietPhieuNhapList.vue";
import PhieuNhapService from "@/services/phieu-nhap.service";

export default {
  name: "PhieuNhapDetailView",
  components: {
    PhieuNhapForm,
    ChiTietPhieuNhapList,
  },
  props: {
    id: { type: String, required: true }, // Mã phiếu nhập (PN01, PN02...) truyền từ Router
  },
  data() {
    return {
      activeTab: "thong-tin-chung", // Tab mặc định khi mở trang
      phieuNhap: null,
      messageTab1: "", // Thông báo cho Tab 1
    };
  },
  methods: {
    // Lấy thông tin chi tiết của Phiếu Nhập
    async getPhieuNhapDetail() {
      try {
        if (PhieuNhapService) {
          this.phieuNhap = await PhieuNhapService.get(this.id);
        }
      } catch (error) {
        console.error("Lỗi khi tải thông tin phiếu nhập:", error);
      }
    },

    // Hàm cập nhật dữ liệu khi người dùng bấm Submit ở Tab 1
    async handleUpdatePhieuNhap(data) {
      try {
        await PhieuNhapService.update(this.id, data);
        this.messageTab1 = "Cập nhật thông tin phiếu nhập thành công!";
        await this.getPhieuNhapDetail(); // Tải lại thông tin mới nhất
      } catch (error) {
        console.error("Lỗi khi cập nhật phiếu nhập:", error);
        this.messageTab1 =
          error.response?.data?.message ||
          "Cập nhật thất bại. Vui lòng thử lại!";
      }
    },

    // Định dạng hiển thị tiền tệ VNĐ
    formatCurrency(value) {
      if (!value && value !== 0) return "0 ₫";
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value);
    },

    // Quay lại trang danh sách phiếu nhập
    goBack() {
      // Bạn điều chỉnh lại tên route danh sách phiếu nhập cho khớp với router dự án của bạn (ví dụ: 'phieu-nhap.home')
      this.$router.push({ name: "phieu-nhap.home" });
    },
  },
  created() {
    this.getPhieuNhapDetail();
  },
};
</script>

<style scoped>
.nav-tabs .nav-link {
  font-weight: 600;
  color: #495057;
  cursor: pointer;
}

.nav-tabs .nav-link.active {
  color: #0d6efd;
  border-bottom: 3px solid #0d6efd;
}
</style>