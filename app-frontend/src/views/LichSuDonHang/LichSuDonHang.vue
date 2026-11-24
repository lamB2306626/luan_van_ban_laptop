<template>
  <div class="container my-4">
    <!-- TIÊU ĐỀ TRANG -->
    <div class="d-flex align-items-center justify-content-between mb-4">
      <h3 class="fw-bold text-dark m-0">
        <i class="fas fa-receipt text-primary me-2"></i>Đơn hàng của tôi
      </h3>
      <span class="badge bg-secondary fs-6" v-if="orders.length > 0">
        {{ orders.length }} đơn hàng
      </span>
    </div>

    <!-- TÁP LỌC TRẠNG THÁI ĐƠN HÀNG (DÙNG COMPONENT TÁCH RIÊNG) -->
    <TrangThaiOrderTabs v-model="currentTab" @change-tab="onTabChange" />

    <!-- TRẠNG THÁI LOADING -->
    <div v-if="loading" class="text-center py-5">
      <div
        class="spinner-border text-primary"
        role="status"
        style="width: 3rem; height: 3rem"
      >
        <span class="visually-hidden">Đang tải...</span>
      </div>
      <p class="mt-3 text-secondary">Đang tải danh sách đơn hàng...</p>
    </div>

    <!-- DANH SÁCH THẺ ĐƠN HÀNG -->
    <div v-else-if="orders.length > 0">
      <DonHangCard
        v-for="order in orders"
        :key="order.id"
        :order="order"
        @cancel="cancelByKhachHang"
        @payment="handlePayAgain"
        @detail="goToOrderDetail"
        @lien-he="goToLienHe"
      />
    </div>

    <!-- KHÔNG CÓ ĐƠN HÀNG NÀO -->
    <div v-else class="text-center py-5 shadow-sm bg-light rounded">
      <i class="fas fa-box-open fa-4x text-muted mb-3 opacity-50"></i>
      <h5 class="text-secondary mb-3">
        Bạn chưa có đơn hàng nào ở trạng thái này!
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
import { ref } from "vue";
import axios from "axios";

const loading = ref(false);
import TrangThaiOrderTabs from "@/components/LichSuDonHang/TrangThaiOrderTabs.vue";
import DonHangCard from "@/components/LichSuDonHang/DonHangCard.vue";
import DonHangService from "@/services/don-hang.service";

export default {
  name: "LichSuDonHangView",
  components: {
    TrangThaiOrderTabs,
    DonHangCard,
  },
  data() {
    return {
      loading: false,
      orders: [],
      currentTab: "ALL",
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
  },

  methods: {
    // Lấy danh sách đơn hàng từ API (Có truyền tham số trạng thái lọc)
    async fetchOrders() {
      if (!this.currentUser?.id) {
        alert("Vui lòng đăng nhập để xem lịch sử đơn hàng!");
        this.$router.push({ name: "login" });
        return;
      }

      this.loading = true;

      try {
        // Tạo query payload gửi lên backend
        const params = {
          id_khach_hang: this.currentUser.id,
        };

        // Nếu tab không phải "ALL", truyền thêm param trạng thái để API lọc
        if (this.currentTab && this.currentTab !== "ALL") {
          params.trang_thai_don_hang = this.currentTab;
        }

        const response = await DonHangService.getAll(params);
        this.orders = Array.isArray(response) ? response : [];
      } catch (error) {
        console.error("Lỗi khi tải lịch sử đơn hàng:", error);
      } finally {
        this.loading = false;
      }
    },

    // Sự kiện xảy ra khi người dùng bấm đổi tab
    onTabChange(tabValue) {
      this.currentTab = tabValue;
      this.fetchOrders(); // Gọi lại hàm fetchOrders theo đúng phong cách các trang khác
    },

    goToLienHe(donHangId) {
      this.$router.push({
        name: "trang-lien-he.home",
        query: { order_id: donHangId },
      });
    },

    goToOrderDetail(orderId) {
      this.$router.push({
        name: "lich-su-don-hang.detail",
        params: {
          id: orderId,
        },
      });
    },

    // ==================== XỬ LÝ THANH TOÁN LẠI ĐƠN HÀNG ====================
    async handlePayAgain(orderId) {
      try {
        // 1. Gọi API service backend để tăng số lần thanh toán lại và reset ngay_dat
        const res = await DonHangService.updateSLTTandNgayDat(orderId);
        const orderData = res.data;

        // 2. Gọi API tạo link thanh toán (QR Code / VNPAY)
        const payRes = await axios.post("/api/thanh-toan/create_payment_url", {
          orderId: orderId,
          amount: orderData.tong_tien_thanh_toan,
          orderInfo: `Thanh toan lai don hang ${orderId}`,
        });

        // 3. Chuyển hướng trình duyệt sang trang thanh toán
        if (payRes.data && payRes.data.paymentUrl) {
          window.location.href = payRes.data.paymentUrl;
        } else {
          alert("Không thể khởi tạo đường dẫn thanh toán!");
        }
      } catch (error) {
        console.error("Lỗi khi thanh toán lại:", error);
        // Hiển thị thông báo lỗi chi tiết trả về từ backend (ví dụ: vượt quá 3 lần, đơn không hợp lệ...)
        alert(
          error.response?.data?.message ||
            "Không thể thực hiện thanh toán lại đơn hàng này!",
        );
      }
    },

    // Xử lý Hủy đơn hàng
    async cancelByKhachHang(orderId) {
      const lyDo = prompt("Nhập lý do bạn muốn hủy đơn hàng này:");
      if (lyDo !== null) {
        try {
          await DonHangService.cancelByKhachHang(orderId, {
            ly_do_huy: lyDo || "Khách hàng tự hủy",
            type: "KH_HUY",
          });
          alert("Hủy đơn hàng thành công!");
          this.fetchOrders();
        } catch (error) {
          console.error("Lỗi khi hủy đơn hàng:", error);
          alert(error.response?.data?.message || "Không thể hủy đơn hàng!");
        }
      }
    },
  },

  mounted() {
    this.fetchOrders();
  },
};
</script>
