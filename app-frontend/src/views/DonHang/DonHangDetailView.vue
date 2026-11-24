<template>
  <div class="container my-4">
    <!-- Tiêu đề & Nút quay lại -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4>
        <i class="fas fa-box-open text-primary me-2"></i>
        Chi Tiết Đơn Hàng:
        <span class="text-primary">#{{ orderId }}</span>
      </h4>
      <p class="text-secondary small mb-0" v-if="orderData">
        Ngày đặt hàng: {{ formatDate(orderData.ngay_dat) }}
      </p>
      <button class="btn btn-outline-secondary btn-sm" @click="$router.go(-1)">
        <i class="fas fa-arrow-left me-1"></i> Quay lại danh sách
      </button>
    </div>

    <!-- SPINNER LOADING -->
    <div v-if="loading" class="text-center py-5">
      <div
        class="spinner-border text-primary"
        role="status"
        style="width: 3rem; height: 3rem"
      >
        <span class="visually-hidden">Đang tải...</span>
      </div>
      <p class="mt-3 text-secondary">Đang tải thông tin chi tiết đơn hàng...</p>
    </div>

    <!-- NỘI DUNG ĐƠN HÀNG -->
    <div v-else-if="orderData" class="row g-4">
      <!-- CỘT BÊN TRÁI (7 CỘT): THÔNG TIN GIAO HÀNG & SẢN PHẨM -->
      <div class="col-lg-7">
        <!-- THÔNG TIN NHẬN HÀNG VÀ PHƯƠNG THỨC THANH TOÁN-->
        <ThongTinDonHangCard :order-data="orderData" />

        <!-- DANH SÁCH SẢN PHẨM TRONG ĐƠN HÀNG -->
        <DSChiTietDonHang
          :chi-tiet-don-hang="orderData.chi_tiet_don_hang || []"
          :trang-thai-don-hang="orderData.trang_thai_don_hang"
          :is-kh="false"
          @view-detail="goToViewDetailSanPham"
          @open-review="openReviewModal"
        />
      </div>

      <!-- CỘT BÊN PHẢI (5 CỘT): TRẠNG THÁI & TỔNG CỘNG ĐƠN HÀNG -->
      <div class="col-lg-5">
        <!-- 1. TRẠNG THÁI ĐƠN HÀNG -->
        <div class="card shadow-sm border-0 mb-4">
          <div class="card-header bg-white py-3 border-bottom">
            <h5 class="fw-bold mb-0 text-dark">
              <i class="fas fa-info-circle text-primary me-2"></i>Trạng thái đơn
              hàng
            </h5>
          </div>
          <div class="card-body p-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="text-secondary small">Trạng thái xử lý:</span>
              <span
                :class="getOrderStatusBadgeClass(orderData.trang_thai_don_hang)"
              >
                {{ formatOrderStatus(orderData.trang_thai_don_hang) }}
              </span>
            </div>
            <div class="d-flex justify-content-between align-items-center">
              <span class="text-secondary small">Thanh toán:</span>
              <span
                :class="
                  getPaymentStatusBadgeClass(orderData.trang_thai_thanh_toan)
                "
              >
                {{ formatPaymentStatus(orderData.trang_thai_thanh_toan) }}
              </span>
            </div>

            <!-- Nút duyệt và nút không duyệt đơn hàng nếu đang chờ duyệt -->
            <div
              v-if="orderData.trang_thai_don_hang === 'CHO_DUYET'"
              class="mt-4 pt-3 border-top"
            >
              <button
                class="btn btn-outline-success w-100 fw-bold"
                @click="approveDonHang"
              >
                Duyệt đơn
              </button>

              <button
                class="btn btn-outline-secondary w-100 fw-bold"
                @click="cancelByNhanVien"
              >
                <i class="fas fa-times-circle me-1"></i> Không duyệt đơn này
              </button>
            </div>
          </div>
        </div>

        <!-- 2. TỔNG CỘNG ĐƠN HÀNG -->
        <div class="card shadow-sm border-0">
          <div class="card-header bg-white py-3 border-bottom">
            <h5 class="fw-bold mb-0 text-dark">Tổng cộng đơn hàng</h5>
          </div>
          <div class="card-body p-4">
            <div class="d-flex justify-content-between mb-2">
              <span class="text-secondary">Tổng tiền hàng (Gốc):</span>
              <span class="fw-bold">{{
                formatCurrency(orderData.tong_tien_goc)
              }}</span>
            </div>

            <div class="d-flex justify-content-between mb-2 text-success">
              <span>Tiết kiệm sản phẩm:</span>
              <span class="fw-bold"
                >-{{ formatCurrency(orderData.tong_tien_giam_km) }}</span
              >
            </div>

            <div
              v-if="voucherDiscountAmount > 0"
              class="d-flex justify-content-between mb-3 text-success"
            >
              <span>Giảm giá Voucher:</span>
              <span class="fw-bold"
                >-{{ formatCurrency(voucherDiscountAmount) }}</span
              >
            </div>

            <div class="d-flex justify-content-between mb-3">
              <span>Phí vận chuyển:</span>
              <span class="fw-bold"
                >+{{ formatCurrency(orderData.tien_van_chuyen) }}</span
              >
            </div>

            <hr class="my-3" />

            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="fw-bold fs-6 text-dark">Tổng thanh toán:</span>
              <span class="fw-bold fs-4 text-danger">{{
                formatCurrency(orderData.tong_tien_thanh_toan)
              }}</span>
            </div>
            <div class="text-end text-muted extra-small">(Đã bao gồm VAT)</div>
          </div>
        </div>
      </div>
    </div>

    <!-- KHÔNG TÌM THẤY ĐƠN HÀNG -->
    <div v-else class="text-center py-5 bg-light rounded shadow-sm">
      <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
      <h5 class="text-secondary">Không tìm thấy thông tin đơn hàng này!</h5>
      <router-link :to="{ name: 'don-hang.home' }" class="btn btn-primary mt-2">
        Quay lại quản lý đơn hàng
      </router-link>
    </div>
  </div>
</template>

<script>
import ThongTinDonHangCard from "@/components/LichSuDonHang/ThongTinDonHangCard.vue";
import DSChiTietDonHang from "@/components/LichSuDonHang/DSChiTietDonHang.vue";
import DonHangService from "@/services/don-hang.service";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default {
  name: "ChiTietDonHangView",
  components: { ThongTinDonHangCard, DSChiTietDonHang },
  data() {
    return {
      API_URL,
      loading: true,
      orderData: null,
    };
  },
  computed: {
    orderId() {
      return this.$route.params.id;
    },
    // Tính tiền giảm từ voucher
    voucherDiscountAmount() {
      if (!this.orderData) return 0;
      const subTotalAfterKM =
        Number(this.orderData.tong_tien_goc) -
        Number(this.orderData.tong_tien_giam_km);
      const ship = Number(this.orderData.tien_van_chuyen);
      const discount =
        subTotalAfterKM + ship - Number(this.orderData.tong_tien_thanh_toan);
      return Math.max(0, discount);
    },

    currentUser() {
      try {
        const userStr = localStorage.getItem("adminUser");
        return userStr ? JSON.parse(userStr) : null;
      } catch (e) {
        return null;
      }
    },
  },

  methods: {
    async fetchOrderDetail() {
      if (!this.orderId) return;
      this.loading = true;
      try {
        const response = await DonHangService.get(this.orderId);
        // Trả về object đơn hàng
        this.orderData = response?.data || response;
      } catch (error) {
        console.error("Lỗi khi tải chi tiết đơn hàng:", error);
      } finally {
        this.loading = false;
      }
    },

    formatCurrency(value) {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value || 0);
    },

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

    formatOrderStatus(status) {
      const map = {
        CHO_DUYET: "Chờ duyệt",
        DA_XAC_NHAN: "Đã xác nhận",
        DANG_VAN_CHUYEN: "Đang giao",
        HOAN_THANH: "Hoàn thành",
        NV_HUY: "Đã hủy (bởi Admin)",
        KH_HUY: "Đã hủy (bởi Khách Hàng)",
        GIAO_THAT_BAI: "Giao hàng thất bại",
      };
      return map[status] || status;
    },

    getOrderStatusBadgeClass(status) {
      const map = {
        CHO_DUYET: "badge bg-warning text-dark px-3 py-2",
        DA_XAC_NHAN: "badge bg-primary px-3 py-2",
        DANG_VAN_CHUYEN: "badge bg-info text-dark px-3 py-2",
        HOAN_THANH: "badge bg-success px-3 py-2",
        NV_HUY: "badge bg-danger px-3 py-2",
        KH_HUY: "badge bg-danger px-3 py-2",
        GIAO_THAT_BAI: "badge bg-danger",
      };
      return map[status] || "badge bg-secondary px-3 py-2";
    },

    formatPaymentStatus(status) {
      const map = {
        CHUA_THANH_TOAN: "Chưa thanh toán",
        THANH_CONG: "Thanh toán thành công",
        THAT_BAI: "Thanh toán thất bại",
      };
      return map[status] || status;
    },
    getPaymentStatusBadgeClass(status) {
      const map = {
        CHUA_THANH_TOAN: "badge bg-warning text-dark",
        THANH_CONG: "badge bg-success",
        THAT_BAI: "badge bg-danger",
      };

      return map[status] || "badge bg-secondary";
    },

    async approveDonHang() {
      try {
        await DonHangService.approve(this.orderId, {
          id_nhan_vien: this.currentUser?.id,
          type: "NV_DUYET",
        });
        alert("Duyệt đơn hàng thành công!");
        this.fetchOrderDetail();
      } catch (error) {
        console.error("Lỗi khi duyệt đơn hàng:", error);
        alert(error.response?.data?.message || "Không thể duyệt đơn hàng!");
      }
    },

    async cancelByNhanVien() {
      const lyDo = prompt("Nhập lý do bạn không duyệt đơn hàng này:");
      if (lyDo !== null) {
        try {
          await DonHangService.cancelByNhanVien(this.orderId, {
            ly_do_huy: lyDo || "Admin không duyệt",
            id_nhan_vien_huy_don: this.currentUser.id,
          });
          alert("Hủy đơn hàng thành công!");
          this.fetchOrderDetail();
        } catch (error) {
          console.error("Lỗi khi hủy đơn hàng:", error);
          alert(error.response?.data?.message || "Không thể hủy đơn hàng!");
        }
      }
    },

    // 3. Chi tiết
    goToViewDetailSanPham(idSanPham, idBienThe) {
      this.$router.push({
        name: "san-pham.detail",
        params: { id: idSanPham },
        query: { isTrashInSanPham: false },
      });
    },
  },
  mounted() {
    this.fetchOrderDetail();
  },
};
</script>

<style scoped>
.object-fit-cover {
  object-fit: cover;
}
.extra-small {
  font-size: 0.8rem;
}
</style>
