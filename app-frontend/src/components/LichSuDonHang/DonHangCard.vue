<template>
  <div class="card shadow-sm border-0 rounded-3 overflow-hidden mb-3">
    <!-- HEADER CARD: MÃ ĐƠN, NGÀY ĐẶT & TRẠNG THÁI -->
    <div
      class="card-header bg-light py-2 px-3 d-flex flex-wrap justify-content-between align-items-center gap-2 border-bottom-0"
    >
      <div class="d-flex align-items-center gap-2">
        <span class="fw-bold text-dark small">
          Đơn hàng: <span class="text-primary">#{{ order.id }}</span>
        </span>
        <span class="text-muted extra-small">
          <i class="far fa-clock me-1"></i>{{ formatDate(order.ngay_dat) }}
        </span>
      </div>

      <div class="d-flex align-items-center gap-2">
        {{ order.phuong_thuc_thanh_toan }}
        <!-- Badge Trạng thái Đơn hàng -->
        <span :class="getOrderStatusBadgeClass(order.trang_thai_don_hang)">
          {{ formatOrderStatus(order.trang_thai_don_hang) }}
        </span>
        <!-- Badge Trạng thái Thanh toán -->

        <span :class="getPaymentStatusBadgeClass(order.trang_thai_thanh_toan)">
          {{ formatPaymentStatus(order.trang_thai_thanh_toan) }}
        </span>
      </div>
    </div>

    <!-- BODY CARD: SẢN PHẨM ĐẠI DIỆN ĐẦU TIÊN & THÔNG TIN -->
    <div class="card-body p-3 border-top border-bottom">
      <!-- 1. SẢN PHẨM ĐẠI DIỆN -->
      <div
        v-if="firstItem"
        class="d-flex align-items-center justify-content-between gap-3"
      >
        <div class="d-flex align-items-center gap-3">
          <img
            :src="getAnh(firstItem)"
            alt="Ảnh sản phẩm"
            class="rounded border object-fit-cover flex-shrink-0"
            style="width: 60px; height: 60px"
            @error="onImageError"
          />
          <div>
            <h6
              class="fw-bold text-dark mb-1 small text-truncate"
              style="max-width: 320px"
            >
              {{
                firstItem.bien_the?.san_pham?.ten_san_pham || "Sản phẩm Laptop"
              }}
            </h6>
            <div class="extra-small text-secondary">
              {{ firstItem.bien_the?.mau_sac?.ten_mau_sac || "" }}
              <span v-if="firstItem.bien_the?.cpu"
                >| {{ firstItem.bien_the.cpu.ten_cpu }}</span
              >
              <span v-if="firstItem.bien_the?.dung_luong_ram"
                >| {{ firstItem.bien_the.dung_luong_ram.dung_luong_ram }}</span
              >
              <span v-if="firstItem.bien_the?.dung_luong_rom"
                >| {{ firstItem.bien_the.dung_luong_rom.dung_luong_rom }}</span
              >
            </div>
            <div class="mt-1 d-flex align-items-center gap-2">
              <span class="badge bg-light text-dark border extra-small"
                >x{{ firstItem.so_luong }}</span
              >
              <span
                v-if="otherItemsCount > 0"
                class="text-primary fw-semibold extra-small"
              >
                + {{ otherItemsCount }} sản phẩm khác
              </span>
            </div>
          </div>
        </div>

        <div class="text-end flex-shrink-0">
          <div class="fw-bold text-dark small">
            {{ formatCurrency(firstItem.don_gia_ap_dung) }}
          </div>
        </div>
      </div>

      <!-- 2. THÔNG TIN PHIẾU GIẢM GIÁ VÀ ĐỊA CHỈ -->
      <div class="row mt-3 pt-2 border-top g-2 extra-small text-secondary">
        <div class="col-md-8 text-truncate">
          <i class="fas fa-map-marker-alt text-danger me-1"></i>
          <span class="text-dark">{{ order.dia_chi }}</span>
        </div>
        <div class="col-md-4 text-md-end" v-if="order.phieu_giam_gia">
          <i class="fas fa-ticket-alt text-warning me-1"></i>
          <span
            class="badge bg-warning-subtle text-warning-emphasis border border-warning"
          >
            {{ order.phieu_giam_gia.ten_phieu }}
          </span>
        </div>
      </div>
    </div>

    <!-- FOOTER CARD: TỔNG TIỀN VÀ HÀNH ĐỘNG -->
    <div
      class="card-footer bg-white py-2 px-3 d-flex justify-content-between align-items-center"
    >
      <div class="small">
        <span class="text-secondary me-1">Tổng cộng:</span>
        <span class="fw-bold text-danger fs-6">{{
          formatCurrency(order.tong_tien_thanh_toan)
        }}</span>
      </div>

      <div class="d-flex align-items-center gap-2">
        <!-- Nút Chi tiết -->
        <button
          class="btn btn-outline-primary btn-sm px-3 fw-semibold extra-small"
          @click="$emit('detail', order.id)"
        >
          Chi tiết
        </button>

        <!-- TRƯỜNG HỢP 1: Còn trong hạn và chưa quá 3 lần -> Hiển thị nút Thanh toán lại kèm số lần & đếm ngược -->
        <button
          v-if="canPayAgain"
          class="btn btn-success btn-sm px-3 fw-semibold extra-small d-flex align-items-center gap-1"
          @click="$emit('payment', order.id)"
        >
          <span>Thanh toán lại ({{ order.so_lan_thanh_toan_lai || 0 }}/3)</span>
          <span v-if="countdownText" class="badge bg-white text-success ms-1">
            {{ countdownText }}
          </span>
        </button>

        <!-- TRƯỜNG HỢP 2: Đã dùng hết 3 lần thanh toán lại -->
        <span
          v-else-if="isEligibleOrder && isMaxRetries"
          class="text-warning fw-semibold extra-small px-2 py-1 bg-light border rounded"
        >
          Đã thanh toán lại tối đa (3/3)
        </span>

        <!-- TRƯỜNG HỢP 3: Đã quá 15 phút (hết thời gian) -->
        <span
          v-else-if="isEligibleOrder && isTimeExpired"
          class="text-danger fw-semibold extra-small px-2 py-1 bg-light border rounded"
        >
          Hết thời gian thanh toán
        </span>

        <!-- Nút Hủy đơn (Chỉ hiện khi đơn đang CHO_DUYET) -->
        <button
          v-if="order.trang_thai_don_hang === 'CHO_DUYET'"
          class="btn btn-outline-danger btn-sm px-3 fw-semibold extra-small"
          @click="$emit('cancel', order.id)"
        >
          Hủy đơn
        </button>

        <!-- Nút Liên hệ shop -->
        <button
          class="btn btn-outline-secondary btn-sm px-3 fw-semibold extra-small"
          @click="$emit('lien-he', order.id)"
        >
          Liên hệ shop
        </button>
      </div>
    </div>
  </div>
</template>

<script>
const API_URL = import.meta.env.VITE_API_BASE_URL;

export default {
  name: "DonHangCard",
  props: {
    order: {
      type: Object,
      required: true,
    },
  },
  emits: ["lien-he", "cancel", "detail", "payment"],
  data() {
    return {
      currentTime: Date.now(),
      timer: null,
    };
  },
  computed: {
    // Lấy sản phẩm đầu tiên làm đại diện
    firstItem() {
      return this.order.chi_tiet_don_hang?.[0] || null;
    },
    // Số lượng sản phẩm còn lại trong đơn
    otherItemsCount() {
      const items = this.order.chi_tiet_don_hang || [];
      return items.length > 1 ? items.length - 1 : 0;
    },

    //================= Ô thời gian trong nút thanh toán lại ===============
    // 1. Kiểm tra đơn hàng có đúng điều kiện thanh toán online không (QR, chưa thanh toán, chờ duyệt)
    isEligibleOrder() {
      return (
        this.order.phuong_thuc_thanh_toan === "QR_CODE" &&
        this.order.trang_thai_thanh_toan === "CHUA_THANH_TOAN" &&
        this.order.trang_thai_don_hang === "CHO_DUYET"
      );
    },

    // Tính thời gian đã trôi qua kể từ ngay_dat (ms)
    elapsedTime() {
      const ngayDatTime = new Date(this.order.ngay_dat).getTime();
      return this.currentTime - ngayDatTime;
    },

    // 2. Kiểm tra xem đã hết 15 phút chưa
    isTimeExpired() {
      const fifteenMinutes = 15 * 60 * 1000;
      return this.elapsedTime >= fifteenMinutes;
    },

    // 3. Kiểm tra xem đã đạt tối đa 3 lần thanh toán lại chưa
    isMaxRetries() {
      return (this.order.so_lan_thanh_toan_lai || 0) >= 3;
    },

    // 4. Điều kiện hiển thị nút thanh toán lại (Còn hạn + Chưa quá 3 lần + Đúng loại đơn)
    canPayAgain() {
      return this.isEligibleOrder && !this.isTimeExpired && !this.isMaxRetries;
    },

    // Tạo chuỗi đồng hồ đếm ngược (VD: "14:25")
    countdownText() {
      const fifteenMinutes = 15 * 60 * 1000;
      const timeLeft = fifteenMinutes - this.elapsedTime;

      if (timeLeft <= 0) return "";

      const totalSeconds = Math.floor(timeLeft / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    },
  },
  mounted() {
    // Cập nhật lại thời gian hiện tại mỗi giây để đồng hồ đếm ngược chạy mượt mà
    this.timer = setInterval(() => {
      this.currentTime = Date.now();
    }, 1000);
  },
  unmounted() {
    // Xóa interval khi component bị hủy để tránh rò rỉ bộ nhớ (memory leak)
    if (this.timer) clearInterval(this.timer);
  },
  methods: {
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
        CHO_DUYET: "badge bg-warning text-dark",
        DA_XAC_NHAN: "badge bg-primary",
        DANG_VAN_CHUYEN: "badge bg-info text-dark",
        HOAN_THANH: "badge bg-success",
        NV_HUY: "badge bg-danger",
        KH_HUY: "badge bg-danger",
        GIAO_THAT_BAI: "badge bg-danger",
      };

      return map[status] || "badge bg-secondary";
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

    // Lấy ảnh của sản phẩm (ưu tiên biến thể đại diện, nếu không có thì lấy ảnh chính của sản phẩm)
    getAnh(item) {
      // 1. Kiểm tra xem biến thể đại diện có ảnh hay không
      const anhBienThe = item.bien_the?.duong_dan_anh;
      if (anhBienThe) {
        return `${API_URL}/uploads/BienThe/${anhBienThe}`;
      }

      // 2. Nếu không có ảnh biến thể, tìm ảnh chính trong mảng anh_san_pham của sản phẩm
      const anhChinhSanPham =
        item.bien_the.san_pham?.anh_san_pham?.find((img) => img.la_anh_chinh)
          ?.duong_dan_anh ||
        item.bien_the.san_pham?.anh_san_pham?.[0]?.duong_dan_anh;

      if (anhChinhSanPham) {
        return `${API_URL}/uploads/AnhSanPham/${anhChinhSanPham}`;
      }

      // 3. Nếu cả hai đều không có, trả về ảnh mặc định
      return `${API_URL}/images/placeholder-laptop.png`;
    },

    onImageError(e) {
      e.target.src = `${API_URL}/images/placeholder-laptop.png`;
    },
  },
};
</script>

<style scoped>
.object-fit-cover {
  object-fit: cover;
}
.extra-small {
  font-size: 0.785rem;
}
</style>
