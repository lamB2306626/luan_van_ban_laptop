<template>
  <div class="container mt-3">
    <!-- Tiêu đề & Nút quay lại -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4>
        <i class="fas fa-tags text-primary me-2"></i>
        Chi Tiết Đợt Khuyến Mãi:
        <span class="text-primary">{{ dotKhuyenMai?.ten_dot || dotKhuyenMai?.id }}</span>
      </h4>
      <button class="btn btn-outline-secondary btn-sm" @click="goBack">
        <i class="fas fa-arrow-left me-1"></i> Quay lại danh sách
      </button>
    </div>

    <!-- Thanh chuyển Tab (Nav Tabs) -->
    <ul class="nav nav-tabs nav-fill mb-4" id="dotKhuyenMaiTab" role="tablist">
      <!-- Tab 1: Thông tin đợt khuyến mãi -->
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          :class="{ active: activeTab === 'thong-tin-chung' }"
          type="button"
          @click="activeTab = 'thong-tin-chung'"
        >
          <i class="fas fa-info-circle me-2"></i>Thông Tin Đợt Khuyến Mãi
        </button>
      </li>

      <!-- Tab 2: Quản lý chi tiết khuyến mãi -->
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          :class="{ active: activeTab === 'quan-ly-chi-tiet' }"
          type="button"
          @click="activeTab = 'quan-ly-chi-tiet'"
        >
          <i class="fas fa-percent me-2"></i>Quản Lý Chi Tiết Khuyến Mãi
        </button>
      </li>
    </ul>

    <!-- Nội dung hiển thị theo từng Tab -->
    <div class="tab-content border rounded p-4 bg-white shadow-sm">
      <!-- TAB 1: THÔNG TIN ĐỢT KHUYẾN MÃI -->
      <div v-if="activeTab === 'thong-tin-chung'">
        <!-- Chỉ render Form khi đã lấy xong dữ liệu dotKhuyenMai từ API -->
        <DotKhuyenMaiForm
          v-if="dotKhuyenMai"
          :dotKhuyenMai="dotKhuyenMai"
          :isEdit="true"
          @submit:dotKhuyenMai="handleUpdateDotKhuyenMai"
        />
        <div v-else class="text-center py-3">
          <span class="spinner-border spinner-border-sm me-2"></span>
          Đang tải dữ liệu đợt khuyến mãi...
        </div>

        <p v-if="messageTab1" class="mt-3 alert alert-info py-2 mb-0">
          {{ messageTab1 }}
        </p>
      </div>

      <!-- TAB 2: QUẢN LÝ CHI TIẾT KHUYẾN MÃI -->
      <div v-if="activeTab === 'quan-ly-chi-tiet'">
        <ChiTietKhuyenMaiList
          :idDotKm="id"
          @refreshDotKhuyenMai="getDotKhuyenMaiDetail"
        />
      </div>
    </div>
  </div>
</template>

<script>
import DotKhuyenMaiForm from "@/components/DotKhuyenMai/DotKhuyenMaiForm.vue";
import ChiTietKhuyenMaiList from "@/components/ChiTietKhuyenMai/ChiTietKhuyenMaiList.vue";
import DotKhuyenMaiService from "@/services/dot-khuyen-mai.service";

export default {
  name: "DotKhuyenMaiDetailView",
  components: {
    DotKhuyenMaiForm,
    ChiTietKhuyenMaiList,
  },
  props: {
    id: { type: String, required: true }, // Mã đợt khuyến mãi (KM01, KM02...) truyền từ Router
  },
  data() {
    return {
      activeTab: "thong-tin-chung", // Tab mặc định khi mở trang
      dotKhuyenMai: null,
      messageTab1: "", // Thông báo cho Tab 1
    };
  },
  methods: {
    // Lấy thông tin chi tiết của Đợt Khuyến Mãi
    async getDotKhuyenMaiDetail() {
      try {
        if (DotKhuyenMaiService) {
          this.dotKhuyenMai = await DotKhuyenMaiService.get(this.id);
        }
      } catch (error) {
        console.error("Lỗi khi tải thông tin đợt khuyến mãi:", error);
      }
    },

    // Hàm cập nhật dữ liệu khi người dùng bấm Submit ở Tab 1
    async handleUpdateDotKhuyenMai(data) {
      try {
        await DotKhuyenMaiService.update(this.id, data);
        this.messageTab1 = "Cập nhật thông tin đợt khuyến mãi thành công!";
        await this.getDotKhuyenMaiDetail(); // Tải lại thông tin mới nhất
      } catch (error) {
        console.error("Lỗi khi cập nhật đợt khuyến mãi:", error);
        this.messageTab1 =
          error.response?.data?.message ||
          "Cập nhật thất bại. Vui lòng thử lại!";
      }
    },

    // Quay lại trang danh sách đợt khuyến mãi
    goBack() {
      this.$router.push({ name: "dot-khuyen-mai.home" });
    },
  },
  created() {
    this.getDotKhuyenMaiDetail();
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