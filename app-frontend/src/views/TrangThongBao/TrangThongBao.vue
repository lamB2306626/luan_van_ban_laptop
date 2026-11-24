<template>
  <div class="container my-4">
    <!-- TIÊU ĐỀ TRANG & NÚT ĐỌC TẤT CẢ -->
    <div class="d-flex align-items-center justify-content-between mb-4">
      <h3 class="fw-bold text-dark m-0">
        <i class="fas fa-bell text-primary me-2"></i>Thông báo của tôi
      </h3>
      <div
        class="d-flex align-items-center gap-2"
        v-if="notifications.length > 0"
      >
        <span class="badge bg-danger fs-6" v-if="unreadCount > 0">
          {{ unreadCount }} chưa đọc
        </span>
        <button
          v-if="unreadCount > 0"
          class="btn btn-sm btn-outline-primary fw-semibold"
          @click="handleMarkAllAsRead"
        >
          <i class="fas fa-check-double me-1"></i>Đánh dấu đã đọc tất cả
        </button>
      </div>
    </div>

    <!-- TÁP LỌC TRẠNG THÁI (TẤT CẢ / CHƯA ĐỌC) -->
    <div class="btn-group mb-4" role="group">
      <button
        type="button"
        class="btn btn-outline-primary"
        :class="{ active: filterTab === 'ALL' }"
        @click="onTabChange('ALL')"
      >
        Tất cả
      </button>
      <button
        type="button"
        class="btn btn-outline-primary"
        :class="{ active: filterTab === 'UNREAD' }"
        @click="onTabChange('UNREAD')"
      >
        Chưa đọc
      </button>
    </div>

    <!-- TRẠNG THÁI LOADING -->
    <div v-if="loading" class="text-center py-5">
      <div
        class="spinner-border text-primary"
        role="status"
        style="width: 3rem; height: 3rem"
      >
        <span class="visually-hidden">Đang tải...</span>
      </div>
      <p class="mt-3 text-secondary">Đang tải danh sách thông báo...</p>
    </div>

    <!-- DANH SÁCH THÔNG BÁO -->
    <div
      v-else-if="filteredNotifications.length > 0"
      class="list-group shadow-sm rounded"
    >
      <div
        v-for="item in filteredNotifications"
        :key="item.id"
        class="list-group-item list-group-item-action p-3 transition-all cursor-pointer"
        :class="{ 'bg-light-unread': !item.da_doc }"
        @click="handleNotificationClick(item)"
      >
        <div class="d-flex w-100 justify-content-between align-items-start">
          <!-- ICON VÀ NỘI DUNG -->
          <div class="d-flex gap-3 align-items-start">
            <div class="notification-icon mt-1">
              <i class="fa-lg fas fa-shopping-bag text-primary"></i>
            </div>
            <div>
              <h6
                class="mb-1 fw-bold text-dark"
                :class="{ 'text-primary': !item.da_doc }"
              >
                {{ item.thong_bao?.tieu_de }}
                <span
                  v-if="!item.da_doc"
                  class="badge bg-danger ms-2 rounded-pill fs-7"
                  >Mới</span
                >
              </h6>
              <p class="mb-1 text-secondary text-break fs-6">
                {{ item.thong_bao?.noi_dung }}
              </p>
              <small class="text-muted">
                <i class="far fa-clock me-1"></i>{{ formatDate(item.ngay_tao) }}
              </small>
            </div>
          </div>

          <!-- NÚT THAO TÁC / CHI TIẾT -->
          <div class="ms-2 text-nowrap">
            <i class="fas fa-chevron-right text-muted fs-7"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- KHÔNG CÓ THÔNG BÁO NÀO -->
    <div v-else class="text-center py-5 shadow-sm bg-light rounded">
      <i class="fas fa-bell-slash fa-4x text-muted mb-3 opacity-50"></i>
      <h5 class="text-secondary mb-3">
        {{
          filterTab === "UNREAD"
            ? "Bạn không có thông báo chưa đọc nào!"
            : "Bạn chưa có thông báo nào!"
        }}
      </h5>
      <router-link
        :to="{ name: 'trang-chu.home' }"
        class="btn btn-primary px-4 fw-bold"
      >
        <i class="fas fa-shopping-bag me-1"></i> Khám phá sản phẩm ngay
      </router-link>
    </div>
  </div>
</template>

<script>
import ChiTietThongBaoService from "@/services/chi-tiet-thong-bao.service";

export default {
  name: "DanhSachThongBaoView",
  data() {
    return {
      loading: false,
      notifications: [], // Lưu danh sách chi tiết thông báo
      filterTab: "ALL", // 'ALL' hoặc 'UNREAD'
    };
  },

  computed: {
    currentUser() {
      try {
        const userStr = localStorage.getItem("user");
        return userStr ? JSON.parse(userStr) : null;
      } catch (e) {
        return null;
      }
    },

    // Đếm số thông báo chưa đọc
    unreadCount() {
      return this.notifications.filter((n) => !n.da_doc).length;
    },

    // Lọc thông báo dựa trên tab đang chọn
    filteredNotifications() {
      if (this.filterTab === "UNREAD") {
        return this.notifications.filter((n) => !n.da_doc);
      }
      return this.notifications;
    },
  },

  methods: {
    // Lấy danh sách thông báo từ Service
    async fetchNotifications() {
      if (!this.currentUser?.id) {
        alert("Vui lòng đăng nhập để xem thông báo!");
        this.$router.push({ name: "login" });
        return;
      }

      this.loading = true;

      try {
        // Gọi ChiTietThongBaoService.getAll theo đúng ID khách hàng
        const response = await ChiTietThongBaoService.getAll({
          id_khach_hang: this.currentUser.id,
        });

        // Đảm bảo dữ liệu trả về luôn là Mảng
        this.notifications = Array.isArray(response) ? response : [];
      } catch (error) {
        console.error("Lỗi khi tải danh sách thông báo:", error);
      } finally {
        this.loading = false;
      }
    },

    // Xử lý sự kiện bấm vào 1 thông báo
    async handleNotificationClick(item) {
      // 1. Cập nhật trạng thái 'da_doc' = true nếu chưa đọc
      if (!item.da_doc) {
        try {
          await ChiTietThongBaoService.markOneAsRead(item.id);
          item.da_doc = true; // Cập nhật trực tiếp trên UI

          // Phát tín hiệu để thanh nav đang lắng nghe cập nhật lại chấn đỏ trên nút thông báo
          window.dispatchEvent(new Event("notification-updated"));
        } catch (error) {
          console.error("Lỗi khi cập nhật trạng thái đã đọc:", error);
        }
      }

      // 2. Chuyển hướng liên kết nếu có dữ liệu ở field `lien_ket`
      if (item.thong_bao?.lien_ket) {
        // Nếu liên kết dạng đường dẫn router nội bộ (vd: /account/orders/123)
        if (item.thong_bao.lien_ket.startsWith("/")) {
          this.$router.push(item.thong_bao.lien_ket);
        } else {
          // Nếu liên kết bên ngoài
          window.location.href = item.thong_bao.lien_ket;
        }
      }
    },

    // Đánh dấu tất cả thông báo là đã đọc
    async handleMarkAllAsRead() {
      try {
        await ChiTietThongBaoService.markAllAsRead(this.currentUser.id);
        // Cập nhật giao diện toàn bộ thành đã đọc
        this.notifications.forEach((n) => (n.da_doc = true));
        // Phát tín hiệu để thanh nav đang lắng nghe cập nhật lại chấn đỏ trên nút thông báo
        window.dispatchEvent(new Event("notification-updated"));
      } catch (error) {
        console.error("Lỗi khi đánh dấu đã đọc tất cả:", error);
      }
    },

    // Đổi tab lọc thông báo
    onTabChange(tabValue) {
      this.filterTab = tabValue;
    },

    // Helper: Định dạng hiển thị ngày giờ
    formatDate(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    },
  },

  mounted() {
    this.fetchNotifications();
  },
};
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

/* Tô màu nền nhạt cho các thông báo chưa đọc */
.bg-light-unread {
  background-color: #f0f7ff !important;
}

.list-group-item:hover {
  background-color: #e9ecef;
  transition: background-color 0.2s ease-in-out;
}

.fs-7 {
  font-size: 0.75rem;
}
</style>
