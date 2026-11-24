<template>
  <div id="admin-layout">
    <!-- Component Toast Thông báo dùng chung -->
    <NotificationToast
      :show="toastNotification.show"
      :title="toastNotification.title"
      :message="toastNotification.message"
      @close="closeToast"
      @click-body="goToChat"
    />

    <!-- Thanh điều hướng (Navbar) dành riêng cho Admin -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark px-3">
      <div class="container-fluid">
        <router-link :to="{ name: 'admin.home' }" class="navbar-brand">
          Ứng Dụng Quản Lý (Admin)
        </router-link>

        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#adminNavbarNav"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="adminNavbarNav">
          <!-- Danh sách Menu động theo nhóm chức năng hiện tại -->
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <!-- <li v-if="!isAdminHome" class="nav-item">
              <router-link :to="{ name: 'admin.home' }" class="nav-link">
                <i class="fas fa-th-large me-1"></i>Trung tâm quản trị
              </router-link>
            </li> -->

            <li
              v-for="item in visibleNavItems"
              :key="item.routeName"
              class="nav-item"
            >
              <router-link
                :to="{ name: item.routeName }"
                class="nav-link"
                :class="{
                  'position-relative d-inline-flex align-items-center':
                    item.showUnreadBadge,
                }"
              >
                <i v-if="item.icon" :class="[item.icon, 'me-1']"></i>
                <span>{{ item.label }}</span>
                <span
                  v-if="item.showUnreadBadge && unreadCount > 0"
                  class="badge rounded-pill bg-danger ms-2"
                >
                  {{ unreadCount > 99 ? "99+" : unreadCount }}
                </span>
              </router-link>
            </li>
          </ul>

          <!-- Phần thông tin tài khoản Admin ở góc phải -->
          <div class="d-flex align-items-center">
            <NVDropdownMenu
              :user="currentUser"
              :is-open="isDropdownOpen"
              @toggle="toggleDropdown"
              @close="closeDropdown"
              @update-profile="goToUpdateNhanVienOne"
              @logout="handleLogout"
            />
          </div>
        </div>
      </div>
    </nav>

    <div
      v-if="accessDeniedMessage"
      class="alert alert-warning alert-dismissible fade show shadow-lg border-warning position-fixed top-0 start-50 translate-middle-x mt-3"
      style="z-index: 1080; min-width: 340px; max-width: 90vw"
      role="alert"
    >
      <i class="fas fa-exclamation-triangle me-2"></i>
      <strong>Không đủ quyền:</strong> {{ accessDeniedMessage }}
      <button
        type="button"
        class="btn-close"
        @click="accessDeniedMessage = ''"
      ></button>
    </div>

    <!-- Nơi các trang con của Admin hiển thị -->
    <div class="container mt-3">
      <router-view />
    </div>
  </div>
</template>

<script>
import NVDropdownMenu from "@/components/Common/NVDropdownMenu.vue";
import NotificationToast from "@/components/Common/NotificationToast.vue";
import socketService from "@/services/socket.service";
import LichSuTroTruyenService from "@/services/lich-su-tro-truyen.service"; // Import service gọi API unread summary

const ADMIN_NAV_GROUPS = {
  "product-config": [
    { routeName: "san-pham.home", label: "Quản lý Sản Phẩm" },
    { routeName: "danh-muc.home", label: "Quản lý Danh Mục" },
    { routeName: "thuong-hieu.home", label: "Quản lý Thương Hiệu" },
    { routeName: "mau-sac.home", label: "Quản lý Màu Sắc" },
    { routeName: "cpu.home", label: "Quản lý CPU" },
    { routeName: "gpu.home", label: "Quản lý GPU" },
    { routeName: "ram.home", label: "Quản lý ram" },
    { routeName: "rom.home", label: "Quản lý rom" },
  ],
  warehouse: [
    { routeName: "phieu-nhap.home", label: "Quản lý Phiếu Nhập" },
    { routeName: "nha-cung-cap.home", label: "Quản lý Nhà Cung Cấp" },
  ],
  "order-cskh": [
    { routeName: "don-hang.home", label: "Quản lý Đơn Hàng" },
    { routeName: "khach-hang.home", label: "Quản lý Khách Hàng" },
    {
      routeName: "lich-su-tro-truyen.home",
      label: "Quản lý tin nhắn",
      icon: "fas fa-comments",
      showUnreadBadge: true,
    },
  ],
  "promotion-media": [
    { routeName: "dot-khuyen-mai.home", label: "Quản lý Đợt Khuyến Mãi" },
    { routeName: "phieu-giam-gia.home", label: "Quản lý Phiếu Giảm Giá" },
    { routeName: "thong-bao.home", label: "Quản lý Thông Báo" },
    { routeName: "hang-thanh-vien.home", label: "Quản lý Hạng thành viên" },
  ],
  staff: [{ routeName: "nhan-vien.home", label: "Quản lý Nhân Viên" }],
};

export default {
  name: "AdminLayout",
  components: {
    NVDropdownMenu,
    NotificationToast,
  },
  data() {
    return {
      currentUser: null,
      isDropdownOpen: false,
      unreadMap: {}, // Dạng: { "LS01": 2, "LS02": 1 }
      toastNotification: {
        show: false,
        title: "",
        message: "",
        historyId: null,
      },
      toastTimeout: null,

      accessDeniedMessage: "", // thông báo từ chối đăng nhập do không đủ quyền
      accessDeniedTimeout: null,
    };
  },

  computed: {
    unreadCount() {
      return Object.values(this.unreadMap).reduce(
        (sum, count) => sum + count,
        0,
      );
    },
    isAdminHome() {
      return this.$route.name === "admin.home";
    },
    currentModuleGroup() {
      // Ưu tiên lấy moduleGroup khai báo trong route meta (nếu có)
      const metaGroup = [...this.$route.matched]
        .reverse()
        .find((record) => record.meta?.moduleGroup)?.meta?.moduleGroup;

      if (metaGroup) return metaGroup;

      // Fallback: tự nhận diện theo routeName nếu bạn chưa kịp gắn meta vào route
      const currentName = this.$route.name;
      if (!currentName) return null;

      for (const [groupKey, items] of Object.entries(ADMIN_NAV_GROUPS)) {
        if (items.some((item) => item.routeName === currentName)) {
          return groupKey;
        }
      }
      return null;
    },
    visibleNavItems() {
      if (this.isAdminHome || !this.currentModuleGroup) return [];
      return ADMIN_NAV_GROUPS[this.currentModuleGroup] || [];
    },
  },

  methods: {
    toggleDropdown() {
      this.isDropdownOpen = !this.isDropdownOpen;
    },
    closeDropdown() {
      this.isDropdownOpen = false;
    },

    loadUser() {
      const user = localStorage.getItem("adminUser");
      if (user) {
        try {
          const parsedUser = JSON.parse(user);
          // Nếu đổi tài khoản Nhân viên khác -> Kết nối lại Socket Kênh Tổng
          if (this.currentUser?.id !== parsedUser.id) {
            this.currentUser = parsedUser;
            this.initSocketConnection();
            this.fetchUnreadSummary();
          }
        } catch (e) {
          this.currentUser = null;
        }
      } else {
        if (this.currentUser?.id) {
          socketService.leaveStaffRoom();
        }
        this.currentUser = null;
      }
    },

    // -------------------------------------------------------------
    // KHỞI TẠO UNREAD MAP TỪ BACKEND
    // -------------------------------------------------------------
    async fetchUnreadSummary() {
      if (!this.currentUser?.id) return;
      try {
        // Gọi API lấy object thống kê dạng { "LS01": 2, "LS02": 1 }
        const summaryData = await LichSuTroTruyenService.getUnreadSummary();
        this.unreadMap = summaryData || {};

        // Nếu hiện tại Nhân viên đang đứng sẵn ở trang xem chi tiết 1 chat -> Xóa đếm của chat đó
        const currentOpenHistoryId = this.$route.params.id;
        if (currentOpenHistoryId) {
          this.clearUnreadByHistoryId(currentOpenHistoryId);
        }
      } catch (error) {
        console.error("Lỗi khi tải thống kê tin nhắn chưa đọc:", error);
      }
    },

    handleLogout() {
      if (this.currentUser?.id) {
        socketService.leaveStaffRoom();
      }
      this.isDropdownOpen = false;
      localStorage.removeItem("adminUser");
      this.currentUser = null;
      this.unreadMap = {};
      this.$router.push({ name: "admin.login" });
    },

    goToUpdateNhanVienOne() {
      this.isDropdownOpen = false;
      this.$router.push({
        name: "nhan-vien.edit-one",
        params: { id: this.currentUser.id },
      });
    },

    // -------------------------------------------------------------
    // LOGIC KẾT NỐI SOCKET VÀ XỬ LÝ THÔNG BÁO CHO NHÂN VIÊN (STAFF)
    // -------------------------------------------------------------
    initSocketConnection() {
      if (!this.currentUser?.id) return;

      // 1. Kết nối Socket và Join vào Kênh Tổng dành cho Staff
      socketService.connect();
      socketService.joinStaffRoom();

      // 2. Lắng nghe sự kiện staff_notification từ server
      socketService.off("staff_notification", this.handleStaffNotification);
      socketService.on("staff_notification", this.handleStaffNotification);
    },

    handleStaffNotification(data) {
      const historyId = data.history_id;
      const currentOpenHistoryId = this.$route.params.id;

      // Nếu Nhân viên đang mở ĐÚNG khung chat của khách hàng này -> Bỏ qua không cộng đếm & không hiện Toast
      if (currentOpenHistoryId && currentOpenHistoryId === historyId) {
        return;
      }

      // Tăng đếm riêng cho history_id đó trong unreadMap
      if (historyId) {
        const currentCount = this.unreadMap[historyId] || 0;
        this.unreadMap = {
          ...this.unreadMap,
          [historyId]: currentCount + 1,
        };
      }

      // Chuẩn bị thông tin hiển thị Toast góc màn hình
      const tenKhach = data.khach_hang?.ho_ten || "Khách hàng";
      const title = `Tin nhắn từ ${tenKhach}`;
      const message = data.noi_dung || "Vừa gửi một tin nhắn mới.";

      this.showToast(title, message, historyId);
    },

    showToast(title, message, historyId = null) {
      this.toastNotification = {
        show: true,
        title,
        message,
        historyId,
      };

      if (this.toastTimeout) clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => {
        this.closeToast();
      }, 5000);
    },

    closeToast() {
      this.toastNotification.show = false;
    },

    goToChat() {
      const historyId = this.toastNotification.historyId;
      this.closeToast();

      if (historyId) {
        // Xóa đếm chưa đọc của historyId này
        this.clearUnreadByHistoryId(historyId);

        this.$router.push({
          name: "lich-su-tro-truyen.detail",
          params: { id: historyId },
        });
      } else {
        this.$router.push({ name: "lich-su-tro-truyen.home" });
      }
    },

    // Xóa tin nhắn chưa đọc của một cuộc trò chuyện cụ thể
    clearUnreadByHistoryId(historyId) {
      if (this.unreadMap[historyId]) {
        const newMap = { ...this.unreadMap };
        delete newMap[historyId];
        this.unreadMap = newMap;
      }
    },

    // Thực hiện thông báo khi người dùng truy cập vào 1 trang mà họ không có đủ quyền
    handleAccessDenied(event) {
      this.accessDeniedMessage =
        event?.detail?.message || "Bạn không có quyền truy cập trang này!";

      if (this.accessDeniedTimeout) {
        clearTimeout(this.accessDeniedTimeout);
      }

      // Tự ẩn thông báo sau 5 giây (hoặc bạn có thể dùng SweetAlert2 / Toast có sẵn của dự án)
      this.accessDeniedTimeout = setTimeout(() => {
        this.accessDeniedMessage = "";
      }, 5000);
    },
  },

  created() {
    this.loadUser();
    this.initSocketConnection();
    this.fetchUnreadSummary();

    window.addEventListener("admin-access-denied", this.handleAccessDenied);

    // Trường hợp đăt biệt khi người dùng vào 1 trang trực tiếp bằng URL mà không có đủ quyền sẽ mặc định chuyển hướng
    // về trang danh mục mặc định và có lưu lại admin_access_denied_msg
    // thực hiện kiểm tra xem có session này không để hiện thông báo cho người dùng
    const pendingMsg = sessionStorage.getItem("admin_access_denied_msg");
    if (pendingMsg) {
      sessionStorage.removeItem("admin_access_denied_msg");
      this.handleAccessDenied({ detail: { message: pendingMsg } });
    }
  },

  watch: {
    $route(to) {
      this.isDropdownOpen = false;
      this.loadUser();

      // Nếu Nhân viên đang mở xem 1 cuộc trò chuyện cụ thể (có id trên URL) -> Xóa đếm chưa đọc của cuộc trò chuyện đó
      const historyId = to.params.id;
      if (historyId) {
        this.clearUnreadByHistoryId(historyId);
      }
    },
  },

  unmounted() {
    if (this.currentUser?.id) {
      socketService.leaveStaffRoom();
      socketService.off("staff_notification", this.handleStaffNotification);
    }

    // Đăng kí sự kiện từ chối đăng nhập do không đủ quyền (do index.js phát)
    window.removeEventListener("admin-access-denied", this.handleAccessDenied);
    if (this.accessDeniedTimeout) {
      clearTimeout(this.accessDeniedTimeout);
    }
  },
};
</script>
