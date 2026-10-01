<template>
  <div class="container mt-3">
    <!-- Tiêu đề & Nút quay lại -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4>
        <i class="fas fa-box-open text-primary me-2"></i>
        Chi Tiết Sản Phẩm:
        <span class="text-primary">{{ sanPham?.ten_san_pham }}</span>
      </h4>
      <button class="btn btn-outline-secondary btn-sm" @click="goBack">
        <i class="fas fa-arrow-left me-1"></i> Quay lại danh sách
      </button>
    </div>

    <!-- Thanh chuyển Tab (Nav Tabs) -->
    <ul class="nav nav-tabs nav-fill mb-4" id="sanPhamTab" role="tablist">
      <!-- Tab 1: Thông tin chung -->
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          :class="{ active: activeTab === 'thong-tin-chung' }"
          type="button"
          @click="activeTab = 'thong-tin-chung'"
        >
          <i class="fas fa-info-circle me-2"></i>Thông Tin Chung
        </button>
      </li>

      <!-- Tab 2: Thông số kỹ thuật -->
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          :class="{ active: activeTab === 'thong-so-ky-thuat' }"
          type="button"
          @click="activeTab = 'thong-so-ky-thuat'"
        >
          <i class="fas fa-sliders-h me-2"></i>Thông Số Kỹ Thuật
        </button>
      </li>

      <!-- Tab 3: Quản lý biến thể -->
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          :class="{ active: activeTab === 'quan-ly-bien-the' }"
          type="button"
          @click="activeTab = 'quan-ly-bien-the'"
        >
          <i class="fas fa-layer-group me-2"></i>Quản Lý Biến Thể
        </button>
      </li>
    </ul>

    <!-- Nội dung hiển thị theo từng Tab -->
    <div class="tab-content border rounded p-4 bg-white shadow-sm">
      <!-- TAB 1: THÔNG TIN CHUNG -->
      <div v-if="activeTab === 'thong-tin-chung'">
        <!-- Chỉ render Form khi đã lấy xong dữ liệu sanPham từ API -->
        <SanPhamForm
          v-if="sanPham"
          :sanPham="sanPham"
          :isEdit="true"
          @submit:sanPham="handleUpdateSanPham"
        />
        <div v-else class="text-center py-3">
          <span class="spinner-border spinner-border-sm me-2"></span>
          Đang tải dữ liệu...
        </div>

        <p v-if="messageTab1" class="mt-3 alert alert-info py-2">
          {{ messageTab1 }}
        </p>
      </div>

      <!-- TAB 2: THÔNG SỐ KỸ THUẬT -->
      <div v-if="activeTab === 'thong-so-ky-thuat'">
        <ThongSoForm
          v-if="sanPham"
          :thongSo="thongSoData"
          :isEdit="!!thongSoData?.id"
          @submit:thongSo="handleSaveThongSo"
          @cancel="goBack"
        />
        <div v-else class="text-center py-3">
          <span class="spinner-border spinner-border-sm me-2"></span>
          Đang tải thông số kỹ thuật...
        </div>

        <p v-if="messageTab2" class="mt-3 alert alert-info py-2">
          {{ messageTab2 }}
        </p>
      </div>

      <!-- TAB 3: QUẢN LÝ BIẾN THỂ -->
      <div v-if="activeTab === 'quan-ly-bien-the'">
        <BienTheList :idSanPham="id" />
      </div>
    </div>
  </div>
</template>

<script>
import SanPhamForm from "@/components/SanPham/SanPhamForm.vue";
import ThongSoForm from "@/components/ThongSoKyThuat/ThongSoForm.vue";
import BienTheList from "@/components/BienThe/BienTheList.vue";
import SanPhamService from "@/services/san-pham.service";
import ThongSoService from "@/services/thong-so.service";

export default {
  name: "SanPhamDetailView",
  components: {
    SanPhamForm,
    ThongSoForm,
    BienTheList,
  },
  props: {
    id: { type: String, required: true }, // Mã sản phẩm được truyền từ Router
  },
  data() {
    return {
      activeTab: "thong-tin-chung", // Tab mặc định khi mở trang
      sanPham: null,
      messageTab1: "", // Thông báo thành công/thất bại cho Tab 1
      messageTab2: "",
    };
  },
  methods: {
    // Lấy thông tin cơ bản sản phẩm để hiển thị tiêu đề
    async getSanPhamDetail() {
      try {
        this.sanPham = await SanPhamService.get(this.id);
        // lấy `thong_so` đã có sẵn trong SanPhamService.get
        this.thongSoData = this.sanPham.thong_so;
      } catch (error) {
        console.error("Lỗi khi tải thông tin sản phẩm:", error);
      }
    },

    // Hàm cập nhật dữ liệu khi người dùng submit form ở Tab 1 (thông tin sản phẩm chung)
    async handleUpdateSanPham(data) {
      try {
        await SanPhamService.update(this.id, data);
        this.messageTab1 = "Cập nhật thông tin chung thành công!";
        this.getSanPhamDetail(); // Tải lại thông tin mới nhất
      } catch (error) {
        console.error(error);
        this.messageTab1 =
          error.response?.data?.message ||
          "Cập nhật thất bại. Vui lòng thử lại!";
      }
    },

    // Hàm cập nhật dữ liệu khi người dùng submit form ở Tab 2 (Thông số kỹ thuật)
    async handleSaveThongSo(data) {
      try {
        const payload = { ...data, id_san_pham: this.id };

        if (data.id) {
          // Nếu đã có id -> Cập nhật (UPDATE)
          await ThongSoService.update(data.id, payload);
          this.messageTab2 = "Cập nhật thông số kỹ thuật thành công!";
        } else {
          // Nếu chưa có id -> Tạo mới (CREATE)
          await ThongSoService.create(payload);
          this.messageTab2 = "Thêm mới thông số kỹ thuật thành công!";
        }

        this.getSanPhamDetail(); // Refresh lại dữ liệu
      } catch (error) {
        console.error(error);
        this.messageTab2 =
          error.response?.data?.message ||
          "Đã xảy ra lỗi khi lưu thông số kỹ thuật!";
      }
    },

    // Quay lại trang danh sách sản phẩm
    goBack() {
      this.$router.push({ name: "san-pham.home" });
    },
  },
  created() {
    this.getSanPhamDetail();
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
