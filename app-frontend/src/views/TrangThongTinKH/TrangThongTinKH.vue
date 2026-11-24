<template>
  <div class="container my-5 col-md-9 col-lg-8">
    <div class="card shadow">
      <!-- Header Trang Quản Lý Thông Tin Cá Nhân -->
      <div class="card-header bg-primary text-white text-center py-3">
        <h4 class="mb-0 fw-bold">
          <i class="fas fa-user-circle me-2"></i>Thông Tin Cá Nhân
        </h4>
        <small class="text-white-50">
          Quản lý hồ sơ tài khoản và phiếu giảm giá của bạn
        </small>
      </div>

      <!-- Body Trang -->
      <div class="card-body p-4">
        <!-- Thanh chuyển 2 Tab -->
        <ul class="nav nav-tabs nav-fill mb-4" role="tablist">
          <li class="nav-item" role="presentation">
            <button
              class="nav-link fw-semibold"
              :class="{ active: activeTab === 'thong-tin-ca-nhan' }"
              type="button"
              @click="activeTab = 'thong-tin-ca-nhan'"
            >
              <i class="fas fa-user-edit me-2"></i>Thông Tin Cá Nhân
            </button>
          </li>

          <li class="nav-item" role="presentation">
            <button
              class="nav-link fw-semibold"
              :class="{ active: activeTab === 'phieu-giam-gia' }"
              type="button"
              @click="activeTab = 'phieu-giam-gia'"
            >
              <i class="fas fa-ticket-alt me-2"></i>Phiếu Giảm Giá
            </button>
          </li>
        </ul>

        <!-- Nội dung từng Tab -->
        <div class="tab-content">
          <!-- TAB 1: THÔNG TIN CÁ NHÂN -->
          <div v-show="activeTab === 'thong-tin-ca-nhan'">
            <KhachHangProfileForm
              v-if="khachHangData"
              :khachHang="khachHangData"
              @submit:profile="updateKhachHang"
              @cancel="goBack"
            />

            <div v-else-if="!message" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Đang tải...</span>
              </div>
              <p class="text-muted mt-2">Đang tải thông tin cá nhân...</p>
            </div>

            <div v-if="message" class="alert alert-info mt-3 mb-0" role="alert">
              <i class="fas fa-info-circle me-2"></i>{{ message }}
            </div>
          </div>

          <!-- TAB 2: PHIẾU GIẢM GIÁ -->
          <div v-show="activeTab === 'phieu-giam-gia'">
            <KhachHangVoucherList :idKhachHang="id" />

            <div class="mt-4 text-start">
              <button
                type="button"
                class="btn btn-outline-secondary"
                @click="goBack"
              >
                <i class="fas fa-arrow-left me-1"></i> Quay lại
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import KhachHangProfileForm from "@/components/TrangThongTinKH/KhachHangProfileForm.vue";
import KhachHangVoucherList from "@/components/TrangThongTinKH/KhachHangVoucherList.vue";
import KhachHangService from "@/services/khach-hang.service";

export default {
  name: "TrangThongTinKH",
  components: {
    KhachHangProfileForm,
    KhachHangVoucherList,
  },
  props: {
    id: { type: String, required: true },
  },
  data() {
    return {
      activeTab: "thong-tin-ca-nhan",
      khachHangData: null,
      message: "",
    };
  },
  methods: {
    async getKhachHang(id) {
      try {
        this.khachHangData = await KhachHangService.get(id);
      } catch (error) {
        console.error(error);
        this.message = "Không tìm thấy dữ liệu thông tin cá nhân này.";
      }
    },

    async updateKhachHang(data) {
      try {
        await KhachHangService.update(this.id, data);
        this.message = "Cập nhật thông tin cá nhân thành công!";

        // Cập nhật lại thông tin trong localStorage nếu khách hàng đang sửa chính tài khoản của mình
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (currentUser && String(currentUser.id) === String(this.id)) {
          const updatedUser = await KhachHangService.get(this.id);

          if (updatedUser && updatedUser.id) {
            const mergedUser = {
              ...currentUser,
              ...updatedUser,
            };
            localStorage.setItem("user", JSON.stringify(mergedUser));
          }
        }

        setTimeout(() => {
          this.goBack();
        }, 1000);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Đã xảy ra lỗi khi cập nhật thông tin.";
        this.message = errorMessage;
      }
    },

    goBack() {
      if (window.history.length > 1) {
        this.$router.back();
      } else {
        this.$router.push({ name: "home" });
      }
    },
  },
  created() {
    this.getKhachHang(this.id);
  },
};
</script>

<style scoped>
.card {
  border-radius: 10px;
  border: none;
}
.card-header {
  border-top-left-radius: 10px !important;
  border-top-right-radius: 10px !important;
}
</style>
