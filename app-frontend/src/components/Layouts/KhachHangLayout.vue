<template>
  <div id="client-layout">
    <!-- Component Toast thông báo -->
    <NotificationToast
      :show="toastNotification.show"
      :title="toastNotification.title"
      :message="toastNotification.message"
      @close="closeToast"
      @click-body="goToChat"
    />

    <!-- Thanh điều hướng (Navbar) Tone Trắng Sáng Sang Trọng -->
    <nav
      class="navbar navbar-expand-lg navbar-light bg-white sticky-top main-navbar shadow-sm py-2"
    >
      <!-- Dùng container để giới hạn độ rộng cân bằng 100% với trang chủ 90% bên dưới -->
      <div class="container-fluid mx-auto" style="max-width: 90%">
        <!-- 1. BÊN TRÁI: Logo + Links -->
        <div class="d-flex align-items-center">
          <!-- Logo với Gradient hoặc Icon đẹp mắt -->
          <router-link
            :to="{ name: 'trang-chu.home' }"
            class="navbar-brand fw-bold text-primary fs-4 me-4 d-flex align-items-center gap-2"
          >
            <span class="brand-text">Laptop Store</span>
          </router-link>

          <button
            class="navbar-toggler me-2 border-0 shadow-none"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#clientNavbarNav"
          >
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse" id="clientNavbarNav">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0 gap-1">
              <li class="nav-item">
                <router-link
                  :to="{ name: 'trang-chu.home' }"
                  class="nav-link custom-nav-link fw-semibold px-3"
                >
                  <i class="fas fa-home me-1"></i>Trang Chủ
                </router-link>
              </li>

              <li class="nav-item">
                <router-link
                  :to="{ name: 'lich-su-don-hang.home' }"
                  class="nav-link custom-nav-link fw-semibold px-3 text-nowrap"
                >
                  <i class="fas fa-history me-1"></i>Lịch sử mua
                </router-link>
              </li>
            </ul>
          </div>
        </div>

        <!-- 2. Ở GIỮA: Thanh tìm kiếm Bo tròn Pill-shaped chuẩn E-commerce -->
        <div
          class="search-bar-nav flex-grow-1 mx-lg-4 my-2 my-lg-0"
          style="max-width: 520px"
        >
          <div
            class="search-pill-wrapper d-flex align-items-center px-3 py-2"
            @click="openSearchModal"
          >
            <i class="fas fa-search text-primary me-2 fs-6"></i>
            <span class="search-placeholder text-muted fs-7 text-truncate">
              Bạn muốn tìm laptop gì hôm nay?...
            </span>
          </div>
        </div>

        <!-- 3. BÊN PHẢI: Giỏ hàng + Thông báo + Người dùng -->
        <div class="d-flex align-items-center gap-3 ms-auto">
          <!-- Nút Thông Báo (Chuông) -->
          <button
            type="button"
            class="btn icon-btn position-relative"
            title="Thông báo"
            @click="goToThongBao"
          >
            <i class="fas fa-bell fs-5 text-secondary"></i>
            <span
              v-if="unreadNotificationCount > 0"
              class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
              style="font-size: 0.7rem"
            >
              {{
                unreadNotificationCount > 99 ? "99+" : unreadNotificationCount
              }}
            </span>
          </button>

          <!-- Nút Giỏ Hàng -->
          <router-link
            :to="{ name: 'gio-hang.home' }"
            class="btn icon-btn position-relative"
            title="Giỏ hàng"
          >
            <i class="fas fa-shopping-cart fs-5 text-secondary"></i>
            <span
              v-if="cartCount > 0"
              class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
              style="font-size: 0.7rem"
            >
              {{ cartCount > 99 ? "99+" : cartCount }}
            </span>
          </router-link>

          <div
            class="vr mx-1 my-auto text-secondary opacity-25 d-none d-sm-block"
            style="height: 24px"
          ></div>

          <!-- Menu Người dùng (Avatar & Dropdown) -->
          <div class="d-flex align-items-center">
            <KHDropdownMenu
              :user="currentUser"
              :is-open="isDropdownOpen"
              @toggle="toggleDropdown"
              @close="closeDropdown"
              @update-profile="goToUpdateKhachHang"
              @logout="handleLogout"
            />
          </div>
        </div>
      </div>
    </nav>

    <!-- Nơi các trang con hiển thị -->
    <div class="mt-3">
      <router-view />
    </div>

    <!-- MODAL HIỂN THỊ BỘ LỌC TÌM KIẾM -->
    <div
      v-if="showSearchModal"
      class="modal fade show d-block search-modal-backdrop"
      tabindex="-1"
      @click.self="closeSearchModal"
    >
      <div
        class="modal-dialog modal-xl modal-dialog-scrollable custom-modal-width mt-4"
      >
        <div class="modal-content border-0 shadow-lg rounded-4">
          <div class="modal-header border-0 pb-0 px-4 pt-4">
            <h5
              class="modal-title fw-bold text-primary d-flex align-items-center gap-2"
            >
              <i class="fas fa-search mr-1"></i>Tìm kiếm sản phẩm
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="closeSearchModal"
            ></button>
          </div>
          <div class="modal-body p-4">
            <SanPhamSearchTT
              v-model="searchFilter"
              @submit="handleSearchSubmit"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- NÚT CSKH NỔI GÓC DƯỚI BÊN PHẢI -->
    <div
      class="position-fixed"
      style="bottom: 100px; right: 24px; z-index: 1050"
    >
      <router-link
        :to="{ name: 'trang-lien-he.home', query: { type: 'general' } }"
        class="btn btn-primary rounded-circle shadow-lg d-flex align-items-center justify-content-center position-relative style-cskh-btn"
        style="width: 56px; height: 56px"
        @click="clearUnreadMessageCount"
        title="Hỗ trợ CSKH"
      >
        <i class="fas fa-comments fa-lg text-white"></i>
        <span
          v-if="unreadMessageCount > 0"
          class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow-sm"
        >
          {{ unreadMessageCount > 99 ? "99+" : unreadMessageCount }}
        </span>
      </router-link>
    </div>

    <!-- NÚT CHATBOT NỔI GÓC DƯỚI BÊN PHẢI -->
    <div
      class="position-fixed"
      style="bottom: 24px; right: 24px; z-index: 1050"
    >
      <router-link
        :to="{ name: 'tu-van-ai.home' }"
        class="btn btn-primary rounded-circle shadow-lg d-flex align-items-center justify-content-center position-relative style-cskh-btn"
        style="width: 56px; height: 56px"
        title="Tư vấn Chatbot"
      >
        <i class="fas fa-robot fa-lg text-white"></i>
      </router-link>
    </div>
  </div>
</template>

<script>
import KHDropdownMenu from "@/components/Common/KHDropdownMenu.vue";
import NotificationToast from "@/components/Common/NotificationToast.vue";
import SanPhamSearchTT from "@/components/TrangChu/SanPhamSearchTT.vue";
import socketService from "@/services/socket.service";
import LichSuTroTruyenService from "@/services/lich-su-tro-truyen.service";
import GioHangService from "@/services/gio-hang.service";
import ThongBaoService from "@/services/thong-bao.service";

export default {
  name: "KhachHangLayout",
  components: {
    KHDropdownMenu,
    NotificationToast,
    SanPhamSearchTT,
  },
  data() {
    return {
      currentUser: null,
      isDropdownOpen: false,
      cartCount: 0,
      unreadNotificationCount: 0,
      unreadMessageCount: 0,
      toastNotification: {
        show: false,
        title: "",
        message: "",
      },
      toastTimeout: null,

      showSearchModal: false,
      searchFilter: {
        name: "",
        id_thuong_hieu: "",
        id_danh_muc: "",
        id_cpu: "",
        id_gpu: "",
        id_ram: "",
        id_rom: "",
        id_mau_sac: "",
        gia_tu: "",
        gia_den: "",
      },
    };
  },
  computed: {
    // Kiểm tra xem khách có đang ở trang chat /trang-lien-he không
    isChatPage() {
      const currentPath = this.$route.path || "";
      const currentRouteName = (this.$route.name || "").toString();

      return (
        currentPath.includes("trang-lien-he") ||
        currentRouteName.includes("trang-lien-he")
      );
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
      const user = localStorage.getItem("user");
      if (user) {
        try {
          const parsedUser = JSON.parse(user);
          // Nếu đổi tài khoản khách hàng khác -> Kết nối lại Socket & Lấy lại số tin chưa đọc
          if (this.currentUser?.id !== parsedUser.id) {
            this.currentUser = parsedUser;
            this.fetchCartCount();
            this.fetchUnreadNotificationCount();
            this.initSocketConnection();
            this.fetchUnreadMessageCount();
          }
        } catch (e) {
          this.currentUser = null;
        }
      } else {
        if (this.currentUser?.id) {
          socketService.leaveUserRoom(this.currentUser.id);
        }
        this.currentUser = null;
      }
    },

    async fetchCartCount() {
      if (!this.currentUser?.id) {
        this.cartCount = 0;
        return;
      }

      try {
        const res = await GioHangService.countByKhachHangId(
          this.currentUser.id,
        );
        // Dùng tong_so_luong nếu muốn đếm tổng số lượng sản phẩm,
        // hoặc đổi thành res?.so_mat_hang nếu muốn đếm số dòng biến thể
        this.cartCount = Number(res?.so_mat_hang ?? 0);
      } catch (error) {
        console.error("Lỗi khi tải số lượng giỏ hàng:", error);
      }
    },

    handleCartUpdated() {
      this.fetchCartCount();
    },

    async fetchUnreadNotificationCount() {
      if (!this.currentUser?.id) {
        this.unreadNotificationCount = 0;
        return;
      }

      try {
        const res = await ThongBaoService.countUnreadByKhachHangId(
          this.currentUser.id,
        );
        this.unreadNotificationCount = Number(res?.so_chua_doc ?? 0);
      } catch (error) {
        console.error("Lỗi khi tải số lượng tin nhắn chưa đọc:", error);
      }
    },

    handleNotificationUpdated() {
      this.fetchUnreadNotificationCount();
    },

    // -------------------------------------------------------------
    // GỌI API LẤY SỐ TIN NHẮN CHƯA ĐỌC BAN ĐẦU CỦA KHÁCH HÀNG
    // -------------------------------------------------------------
    async fetchUnreadMessageCount() {
      if (!this.currentUser?.id) return;

      // Nếu đang mở trang chat -> Luôn giữ bằng 0
      if (this.isChatPage) {
        this.clearUnreadMessageCount();
        return;
      }

      try {
        const res = await LichSuTroTruyenService.getUnreadByKhachhang(
          this.currentUser.id,
        );
        this.unreadMessageCount = res?.count || 0;
      } catch (error) {
        console.error(
          "Lỗi khi tải số tin nhắn chưa đọc của Khách hàng:",
          error,
        );
      }
    },

    handleLogout() {
      if (this.currentUser?.id) {
        socketService.leaveUserRoom(this.currentUser.id);
      }
      this.isDropdownOpen = false;
      localStorage.removeItem("user");
      this.currentUser = null;
      this.cartCount = 0;
      this.unreadNotificationCount = 0;
      this.unreadMessageCount = 0;
      this.$router.push({ name: "khach-hang.login" });
    },

    goToUpdateKhachHang() {
      this.isDropdownOpen = false;
      this.$router.push({
        name: "trang-thong-tin-kh.home",
        params: { id: this.currentUser.id },
      });
    },

    // -------------------------------------------------------------
    // LOGIC KẾT NỐI SOCKET VÀ XỬ LÝ THÔNG BÁO CHO KHÁCH HÀNG
    // -------------------------------------------------------------
    initSocketConnection() {
      if (!this.currentUser?.id) return;

      // 1. Kết nối và Join vào phòng cá nhân của khách user_<id>
      socketService.connect();
      socketService.joinUserRoom(this.currentUser.id);

      // 2. Lắng nghe sự kiện global_notification từ server
      socketService.off("global_notification", this.handleGlobalNotification);
      socketService.on("global_notification", this.handleGlobalNotification);
    },

    handleGlobalNotification(data) {
      // Nếu khách ĐANG Ở TRANG CHAT (/trang-lien-he) -> Bỏ qua không tăng đếm và không hiện Toast
      if (this.isChatPage) {
        this.clearUnreadMessageCount();
        return;
      }

      // Tăng số lượng tin nhắn chưa đọc
      this.unreadMessageCount += 1;

      // Hiển thị Toast góc màn hình
      this.showToast(
        data.tieu_de || "Phản hồi từ CSKH",
        data.noi_dung || "Nhân viên vừa trả lời tin nhắn của bạn.",
      );
    },

    clearUnreadMessageCount() {
      this.unreadMessageCount = 0;
    },

    showToast(title, message) {
      this.toastNotification = {
        show: true,
        title,
        message,
      };

      // Tự đóng Popup Toast sau 5s
      if (this.toastTimeout) clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => {
        this.closeToast();
      }, 5000);
    },

    closeToast() {
      this.toastNotification.show = false;
    },

    goToChat() {
      this.closeToast();
      this.clearUnreadMessageCount();
      // Điều hướng người dùng về trang chat /trang-lien-he
      this.$router.push({ name: "trang-lien-he.home" });
    },

    goToThongBao() {
      this.$router.push({
        name: "trang-thong-bao.home",
      });
    },

    openSearchModal() {
      this.showSearchModal = true;
    },
    closeSearchModal() {
      this.showSearchModal = false;
    },
    handleSearchSubmit() {
      this.closeSearchModal();
      // Chuyển hướng sang trang chủ (nếu đang ở trang khác) và truyền query param
      this.$router.push({
        name: "trang-chu.home",
        query: { ...this.searchFilter },
      });
    },
  },

  created() {
    this.loadUser();
    this.fetchCartCount();
    this.fetchUnreadNotificationCount();
    this.initSocketConnection();
    this.fetchUnreadMessageCount();

    // lắng nghe sự kiện cart-updated để cập nhật lại giao diện chấm đỏ trên nút giỏ hàng
    window.addEventListener("cart-updated", this.handleCartUpdated);
    // lắng nghe sự kiện notification-updated để cập nhật lại giao diện chấm đỏ trên nút chuông thông báo
    window.addEventListener(
      "notification-updated",
      this.handleNotificationUpdated,
    );
  },

  watch: {
    $route() {
      this.isDropdownOpen = false;
      this.loadUser();

      // Nếu khách hàng bấm vào trang Chat -> Đặt lại đếm chưa đọc = 0
      if (this.isChatPage) {
        this.clearUnreadMessageCount();
      }
    },

    "$route.query": {
      immediate: true,
      handler(newQuery) {
        // Cập nhật lại các trường trong searchFilter khớp với URL hiện tại
        // Giúp khi người dùng chọn bộ lọc nhanh ở trang chủ, Navbar sẽ tự cập nhật theo
        this.searchFilter = {
          name: newQuery.name || "",
          id_thuong_hieu: newQuery.id_thuong_hieu || "",
          id_danh_muc: newQuery.id_danh_muc || "",
          id_cpu: newQuery.id_cpu || "",
          id_gpu: newQuery.id_gpu || "",
          id_ram: newQuery.id_ram || "",
          id_rom: newQuery.id_rom || "",
          id_mau_sac: newQuery.id_mau_sac || "",
          gia_tu: newQuery.gia_tu || "",
          gia_den: newQuery.gia_den || "",
        };
      },
    },
  },

  unmounted() {
    window.removeEventListener("cart-updated", this.handleCartUpdated);
    window.removeEventListener(
      "notification-updated",
      this.handleNotificationUpdated,
    );

    if (this.currentUser?.id) {
      socketService.leaveUserRoom(this.currentUser.id);
      socketService.off("global_notification", this.handleGlobalNotification);
    }
  },
};
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.toast {
  min-width: 320px;
}

/* Main Navbar Styling */
.main-navbar {
  border-bottom: 1px solid #f1f5f9;
  backdrop-filter: blur(8px);
  background-color: rgba(255, 255, 255, 0.95) !important;
}

.brand-text {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  letter-spacing: -0.3px;
}

/* Nav links styling */
.custom-nav-link {
  color: #475569 !important;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-size: 14.5px;
}

.custom-nav-link:hover,
.router-link-active.custom-nav-link {
  color: #2563eb !important;
  background-color: #eff6ff;
}

/* Thanh tìm kiếm giả bo tròn dạng Pill */
.search-pill-wrapper {
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.search-pill-wrapper:hover {
  background-color: #ffffff;
  border-color: #2563eb;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.12);
}

.search-placeholder {
  font-size: 13.5px;
}

/* Nút Icon Chuông & Giỏ hàng tròn xinh xắn */
.icon-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background-color: #f8fafc;
  border: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background-color: #eff6ff;
  border-color: #bfdbfe;
}

.icon-btn:hover i {
  color: #2563eb !important;
}

/* Nút CSKH nổi hiệu ứng hover */
.style-cskh-btn {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.style-cskh-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4) !important;
}

/* Modal Popup tìm kiếm */
.search-modal-backdrop {
  background-color: rgba(15, 23, 42, 0.6);
  z-index: 1060;
}
</style>
