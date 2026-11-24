<template>
  <div class="card shadow-sm border-0 mb-4">
    <div
      class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center"
    >
      <h5 class="fw-bold mb-0 text-dark">
        <i class="fas fa-ticket-alt text-primary me-2"></i>Phiếu giảm giá
        (Voucher)
      </h5>
      <span
        class="badge bg-primary-subtle text-primary fw-semibold"
        v-if="vouchers.length > 0"
      >
        {{ validVouchersCount }}/{{ vouchers.length }} phiếu đủ điều kiện
      </span>
    </div>

    <div class="card-body p-4">
      <!-- TRƯỜNG HỢP KHÔNG CÓ PHIẾU NÀO -->
      <div
        v-if="!vouchers || vouchers.length === 0"
        class="text-secondary small italic"
      >
        <i class="fas fa-info-circle me-1"></i>Bạn hiện không có phiếu giảm giá
        nào.
      </div>

      <!-- DANH SÁCH CHỌN PHIẾU -->
      <div v-else>
        <div class="mb-3">
          <label class="form-label fw-semibold text-secondary small">
            Chọn mã giảm giá áp dụng cho đơn hàng:
          </label>
          <select
            class="form-select form-control border-primary-subtle"
            :value="modelValue"
            @change="onChangeVoucher($event.target.value)"
          >
            <option value="">-- Không sử dụng phiếu giảm giá --</option>
            <option
              v-for="item in processedVouchers"
              :key="item.id"
              :value="item.id"
              :disabled="!item.isEligible"
            >
              {{ item.ten_phieu }} - {{ item.discountText }}
              {{
                !item.isEligible
                  ? `(Chưa đủ điều kiện: Đơn từ ${formatCurrency(item.don_toi_thieu)})`
                  : ""
              }}
            </option>
          </select>
        </div>

        <!-- CHI TIẾT PHIẾU ĐANG CHỌN -->
        <div
          v-if="selectedVoucherInfo"
          class="alert alert-success d-flex align-items-center justify-content-between m-0 py-2 px-3 small"
        >
          <div>
            <i class="fas fa-check-circle me-2"></i>
            <strong>{{ selectedVoucherInfo.ten_phieu }}</strong
            >: Được giảm
            <span class="fw-bold text-danger">{{
              formatCurrency(discountAmount)
            }}</span>
            <span
              v-if="selectedVoucherInfo.giam_toi_da && isMaxDiscountReached"
              class="text-muted ms-1"
            >
              (Đã áp dụng giảm tối đa)
            </span>
          </div>
          <button
            type="button"
            class="btn-close btn-sm"
            title="Bỏ chọn"
            @click="onChangeVoucher('')"
          ></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "PhieuGiamGiaSelector",
  props: {
    modelValue: {
      type: String,
      default: "",
    },
    vouchers: {
      type: Array,
      default: () => [],
    },
    subTotal: {
      type: Number,
      default: 0,
    },
  },
  emits: ["update:modelValue", "change-discount"],
  computed: {
    // Chuẩn hóa và tính toán tính hợp lệ cho từng voucher
    processedVouchers() {
      return this.vouchers.map((v) => {
        const phieu = v.phieu_giam_gia || v;
        const donToiThieu = Number(phieu.don_toi_thieu) || 0;
        const giamToiDa = Number(phieu.giam_toi_da) || 0;
        const giaTriGiam = Number(phieu.gia_tri_giam) || 0;
        const isEligible = this.subTotal >= donToiThieu;

        // Tạo chuỗi hiển thị mô tả voucher
        let discountText = "";
        if (phieu.loai_phieu === "PHAN_TRAM") {
          discountText = `Giảm ${giaTriGiam}%`;
          if (giamToiDa) {
            discountText += ` (Tối đa ${this.formatCurrency(giamToiDa)})`;
          }
        } else {
          discountText = `Giảm ${this.formatCurrency(giaTriGiam)}`;
        }

        return {
          id: phieu.id,
          ten_phieu: phieu.ten_phieu,
          loai_phieu: phieu.loai_phieu,
          gia_tri_giam: giaTriGiam,
          don_toi_thieu: donToiThieu,
          giam_toi_da: giamToiDa,
          isEligible: isEligible,
          discountText: discountText,
        };
      });
    },

    // Đếm số lượng phiếu đủ điều kiện
    validVouchersCount() {
      return this.processedVouchers.filter((v) => v.isEligible).length;
    },

    // Lấy thông tin chi tiết voucher đang chọn
    selectedVoucherInfo() {
      if (!this.modelValue) return null;
      return (
        this.processedVouchers.find((v) => v.id === this.modelValue) || null
      );
    },

    // Kiểm tra xem mức giảm % có chạm trần giam_toi_da không
    // trả về true có nghĩa là đã chạm mức giảm tối đa => hiển thị thông báo cho người dùng biết
    isMaxDiscountReached() {
      if (!this.selectedVoucherInfo || !this.selectedVoucherInfo.giam_toi_da)
        return false;
      const { loai_phieu, gia_tri_giam, giam_toi_da } =
        this.selectedVoucherInfo;
      if (loai_phieu === "PHAN_TRAM") {
        const rawDiscount = (this.subTotal * gia_tri_giam) / 100;
        return rawDiscount >= giam_toi_da;
      }
      return false;
    },

    // Tính số tiền được giảm giá thực tế (có chặn giam_toi_da)
    // trả về số tiền được giảm giá để hiển thị ở ô "Được giảm"
    discountAmount() {
      if (!this.selectedVoucherInfo || !this.selectedVoucherInfo.isEligible)
        return 0;

      const { loai_phieu, gia_tri_giam, giam_toi_da } =
        this.selectedVoucherInfo;
      let calculatedDiscount = 0;

      if (loai_phieu === "PHAN_TRAM") {
        calculatedDiscount = (this.subTotal * gia_tri_giam) / 100;
        // Nếu có khống chế giam_toi_da thì không cho vượt quá
        if (giam_toi_da && calculatedDiscount > giam_toi_da) {
          calculatedDiscount = giam_toi_da;
        }
      } else {
        calculatedDiscount = gia_tri_giam;
      }

      return calculatedDiscount;
    },
  },

  watch: {
    discountAmount: {
      immediate: true,
      handler(newDiscount) {
        this.$emit("change-discount", newDiscount);
      },
    },
  },

  methods: {
    onChangeVoucher(val) {
      this.$emit("update:modelValue", val);
    },
    formatCurrency(value) {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value || 0);
    },
  },
};
</script>
