<template>
  <div class="container my-4">
    <!-- TIÊU ĐỀ VÀ NÚT QUAY LẠI -->
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div>
        <h3 class="fw-bold text-dark mb-1">
          <i class="fas fa-file-invoice text-primary me-2"></i>Chi tiết đơn hàng
          #{{ orderId }}
        </h3>
        <p class="text-secondary small mb-0" v-if="orderData">
          Ngày đặt hàng: {{ formatDate(orderData.ngay_dat) }}
        </p>
      </div>
      <router-link
        :to="{ name: 'lich-su-don-hang.home' }"
        class="btn btn-outline-secondary btn-sm"
      >
        <i class="fas fa-arrow-left me-1"></i> Trở về danh sách
      </router-link>
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
          :is-kh="true"
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

            <!-- Nút hủy đơn hàng nếu đang chờ duyệt -->
            <div
              v-if="orderData.trang_thai_don_hang === 'CHO_DUYET'"
              class="mt-4 pt-3 border-top"
            >
              <button
                class="btn btn-outline-danger w-100 fw-bold"
                @click="cancelByKhachHang"
              >
                <i class="fas fa-times-circle me-1"></i> Không duyệt đơn
              </button>
            </div>

            <!-- Nút Liên hệ shop -->
            <button
              class="btn btn-outline-secondary w-100 fw-bold"
              @click="goToLienHe"
            >
              Liên hệ shop
            </button>
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
      <router-link
        :to="{ name: 'lich-su-don-hang.home' }"
        class="btn btn-primary mt-2"
      >
        Quay lại lịch sử đơn hàng
      </router-link>
    </div>
  </div>

  <ReviewModal ref="reviewModalRef" @submit="handleSaveReview" />
</template>

<script>
import ReviewModal from "@/components/LichSuDonHang/ReviewModal.vue";
import ThongTinDonHangCard from "@/components/LichSuDonHang/ThongTinDonHangCard.vue";
import DSChiTietDonHang from "@/components/LichSuDonHang/DSChiTietDonHang.vue";
import DonHangService from "@/services/don-hang.service";
import DanhGiaService from "@/services/danh-gia.service";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default {
  name: "ChiTietDonHangView",
  components: { ReviewModal, ThongTinDonHangCard, DSChiTietDonHang },
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
        const userStr = localStorage.getItem("user");
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

    getAnh(item) {
      const anhChinhSanPham =
        item.bien_the.san_pham.anh_san_pham?.find((img) => img.la_anh_chinh)
          ?.duong_dan_anh || item.anh_san_pham?.[0]?.duong_dan_anh;

      if (anhChinhSanPham) {
        return `${API_URL}/uploads/AnhSanPham/${anhChinhSanPham}`;
      }
      return `${API_URL}/images/placeholder-laptop.png`;
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

    async cancelByKhachHang() {
      const lyDo = prompt("Nhập lý do bạn muốn hủy đơn hàng này:");
      if (lyDo !== null) {
        try {
          await DonHangService.cancelByKhachHang(this.orderId, {
            ly_do_huy: lyDo || "Khách hàng tự hủy",
            type: "KH_HUY",
          });
          alert("Hủy đơn hàng thành công!");
          this.fetchOrderDetail();
        } catch (error) {
          console.error("Lỗi khi hủy đơn hàng:", error);
          alert(error.response?.data?.message || "Không thể hủy đơn hàng!");
        }
      }
    },

    goToLienHe() {
      this.$router.push({
        name: "trang-lien-he.home",
        query: { order_id: this.orderId },
      });
    },

    //========================== Xử lý đánh giá cho đơn hàng ============================//
    // Mở modal
    openReviewModal(item) {
      const reviewData = {
        id_san_pham: item.bien_the.id_san_pham,
        id_chi_tiet_don_hang: item.id,
        id_khach_hang: this.currentUser.id,
        ten_san_pham: item.bien_the.san_pham.ten_san_pham,
        ten_bien_the: `${item.bien_the.mau_sac?.ten_mau_sac} |
          ${item.bien_the.cpu?.ten_cpu} |
          ${item.bien_the.gpu?.ten_gpu} |
          ${item.bien_the.dung_luong_ram?.dung_luong_ram} |
          ${item.bien_the.dung_luong_rom?.dung_luong_rom}`,
        duong_dan_anh: this.getAnh(item),
      };

      // Gọi hàm openModal trong component con thông qua $refs
      this.$refs.reviewModalRef.openModal(reviewData);
    },

    // Xử lý lưu đánh giá
    async handleSaveReview(payload, isEdit, onSuccess) {
      try {
        if (isEdit) {
          // Trường hợp CẬP NHẬT (Update)
          await DanhGiaService.update(payload);

          alert("Cập nhật đánh giá thành công!");
        } else {
          // Trường hợp THÊM MỚI (nếu bạn muốn tận dụng luôn ở trang khác)
          await DanhGiaService.create(payload);
          alert("Gửi đánh giá thành công!");
        }

        // Gọi callback để đóng modal
        if (onSuccess) onSuccess();

        // Tải lại trang chi tiết hoặc gọi lại API lấy danh sách đánh giá để UI cập nhật ngay lập tức
        this.fetchOrderDetail();
      } catch (error) {
        console.error("Lỗi khi lưu đánh giá:", error);
        const msg =
          error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!";
        alert(msg);
      }
    },
    // ===================================================================================//

    // 3. Chi tiết
    goToViewDetailSanPham(idSanPham, idBienThe) {
      this.$router.push({
        name: "chi-tiet-san-pham.home",
        params: { id: idSanPham },
        query: { variant: idBienThe }, // Thêm ID của biến thể đại diện lên URL
        // để trang chi tiết chọn được biến thể đại diện này làm mặc định hiển thị đầu tiên
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
