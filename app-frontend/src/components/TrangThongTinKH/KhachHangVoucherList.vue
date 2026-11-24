<template>
  <div>
    <!-- TIÊU ĐỀ & SỐ LƯỢNG PHIẾU -->
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h5 class="fw-bold text-dark m-0">
        <i class="fas fa-ticket-alt text-primary me-2"></i>Phiếu giảm giá của
        tôi
      </h5>
      <span v-if="vouchers.length > 0" class="badge bg-primary">
        {{ vouchers.length }} phiếu
      </span>
    </div>

    <!-- TAB LỌC TRẠNG THÁI (TẤT CẢ / KHẢ DỤNG) -->
    <div class="btn-group mb-4" role="group">
      <button
        type="button"
        class="btn btn-sm btn-outline-primary"
        :class="{ active: filterTab === 'ALL' }"
        @click="filterTab = 'ALL'"
      >
        Tất cả
      </button>
      <button
        type="button"
        class="btn btn-sm btn-outline-primary"
        :class="{ active: filterTab === 'AVAILABLE' }"
        @click="filterTab = 'AVAILABLE'"
      >
        Có thể sử dụng
      </button>
    </div>

    <!-- TRẠNG THÁI LOADING -->
    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Đang tải...</span>
      </div>
      <p class="mt-2 text-secondary small">
        Đang tải danh sách phiếu giảm giá...
      </p>
    </div>

    <!-- DANH SÁCH PHIẾU GIẢM GIÁ -->
    <div v-else-if="filteredVouchers.length > 0" class="row g-3">
      <div v-for="item in filteredVouchers" :key="item.id" class="col-md-6">
        <div
          class="card h-100 border shadow-sm"
          :class="{ 'opacity-75 bg-light': !isVoucherUsable(item) }"
        >
          <div class="card-body d-flex flex-column justify-content-between">
            <div>
              <div
                class="d-flex justify-content-between align-items-start mb-2"
              >
                <div>
                  <span class="badge bg-info text-dark me-1">
                    {{ getVoucherInfo(item).id }}
                  </span>
                  <span
                    class="badge"
                    :class="
                      isVoucherUsable(item) ? 'bg-success' : 'bg-secondary'
                    "
                  >
                    {{ getVoucherStatusText(item) }}
                  </span>
                </div>
                <span class="fw-bold text-danger fs-6">
                  {{ formatDiscountValue(getVoucherInfo(item)) }}
                </span>
              </div>

              <h6 class="fw-bold text-dark mb-1">
                {{ getVoucherInfo(item).ten_phieu }}
              </h6>

              <p class="small text-muted mb-2">
                <span v-if="getVoucherInfo(item).don_toi_thieu">
                  Đơn tối thiểu:
                  <strong>{{
                    formatCurrency(getVoucherInfo(item).don_toi_thieu)
                  }}</strong>
                </span>
                <span v-else>Không yêu cầu đơn tối thiểu</span>

                <span v-if="getVoucherInfo(item).giam_toi_da">
                  · Giảm tối đa:
                  <strong>{{
                    formatCurrency(getVoucherInfo(item).giam_toi_da)
                  }}</strong>
                </span>
              </p>
            </div>

            <div class="border-top pt-2 mt-2 small text-muted">
              <i class="far fa-calendar-alt me-1"></i>
              {{ formatDate(getVoucherInfo(item).ngay_bat_dau) }} -
              {{ formatDate(getVoucherInfo(item).ngay_het_han) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- KHI KHÔNG CÓ PHIẾU GIẢM GIÁ -->
    <div v-else class="text-center py-4 bg-light rounded border">
      <i class="fas fa-ticket-alt fa-3x text-muted mb-2 opacity-50"></i>
      <p class="text-secondary mb-3">
        {{
          filterTab === "AVAILABLE"
            ? "Hiện bạn không có phiếu giảm giá khả dụng nào."
            : "Bạn chưa có phiếu giảm giá nào."
        }}
      </p>
      <router-link
        :to="{ name: 'trang-chu.home' }"
        class="btn btn-sm btn-primary"
      >
        <i class="fas fa-laptop me-1"></i> Tiếp tục mua sắm
      </router-link>
    </div>
  </div>
</template>

<script>
import PhieuKhachHangService from "@/services/phieu-khach-hang.service";

export default {
  name: "KhachHangVoucherList",
  props: {
    idKhachHang: {
      type: [String, Number],
      default: null,
    },
  },
  data() {
    return {
      loading: false,
      vouchers: [],
      filterTab: "ALL", // 'ALL' hoặc 'AVAILABLE'
    };
  },
  computed: {
    targetUserId() {
      if (this.idKhachHang) return this.idKhachHang;
      try {
        const userStr = localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;
        return user?.id || null;
      } catch (e) {
        return null;
      }
    },

    filteredVouchers() {
      if (this.filterTab === "AVAILABLE") {
        return this.vouchers.filter((item) => this.isVoucherUsable(item));
      }
      return this.vouchers;
    },
  },
  methods: {
    // Lấy object phieu_giam_gia (hỗ trợ cả trường hợp backend trả lồng phieu_giam_gia hoặc phẳng)
    getVoucherInfo(item) {
      return item?.phieu_giam_gia || item || {};
    },

    async fetchVouchers() {
      if (!this.targetUserId) return;

      this.loading = true;
      try {
        const response = await PhieuKhachHangService.getAll({
          id_khach_hang: this.targetUserId,
        });
        this.vouchers = Array.isArray(response)
          ? response
          : response?.data || [];
      } catch (error) {
        console.error("Lỗi khi tải danh sách phiếu giảm giá:", error);
        this.vouchers = [];
      } finally {
        this.loading = false;
      }
    },

    isVoucherUsable(item) {
      const voucher = this.getVoucherInfo(item);
      const userVoucherActive = item?.trang_thai !== false;
      const voucherActive = voucher?.trang_thai !== false;

      const now = new Date();
      const start = voucher?.ngay_bat_dau
        ? new Date(voucher.ngay_bat_dau)
        : null;
      const end = voucher?.ngay_het_han ? new Date(voucher.ngay_het_han) : null;

      const isStarted = !start || now >= start;
      const isNotExpired = !end || now <= end;

      return userVoucherActive && voucherActive && isStarted && isNotExpired;
    },

    getVoucherStatusText(item) {
      if (item?.trang_thai === false) return "Đã sử dụng";
      const voucher = this.getVoucherInfo(item);
      if (voucher?.trang_thai === false) return "Ngừng áp dụng";

      const now = new Date();
      if (voucher?.ngay_bat_dau && now < new Date(voucher.ngay_bat_dau)) {
        return "Chưa bắt đầu";
      }
      if (voucher?.ngay_het_han && now > new Date(voucher.ngay_het_han)) {
        return "Hết hạn";
      }
      return "Khả dụng";
    },

    formatDiscountValue(voucher) {
      const val = Number(voucher?.gia_tri_giam || 0);
      if (voucher?.loai_phieu === "PHAN_TRAM") {
        return `-${val}%`;
      }
      return `-${this.formatCurrency(val)}`;
    },

    formatCurrency(amount) {
      if (amount === null || amount === undefined || amount === "") return "";
      return Number(amount).toLocaleString("vi-VN") + "đ";
    },

    formatDate(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    },
  },
  mounted() {
    this.fetchVouchers();
  },
};
</script>
