<template>
  <div class="container my-4">
    <div class="mb-4">
      <h3 class="fw-bold text-dark mb-1">
        <i class="fas fa-file-invoice-dollar text-primary me-2"></i>Thanh toán
        đơn hàng
      </h3>
      <p class="text-secondary small mb-0">
        Vui lòng kiểm tra lại danh sách sản phẩm và thông tin giao hàng trước
        khi xác nhận.
      </p>
    </div>

    <!-- SPINNER LOADING KHI ĐANG FETCH PREVIEW -->
    <div v-if="loading" class="text-center py-5">
      <div
        class="spinner-border text-primary"
        role="status"
        style="width: 3rem; height: 3rem"
      >
        <span class="visually-hidden">Đang tải...</span>
      </div>
      <p class="mt-3 text-secondary">Đang tính toán thông tin đơn hàng...</p>
    </div>

    <div v-else-if="previewData" class="row g-4">
      <!-- CỘT BÊN TRÁI: THÔNG TIN GIAO HÀNG & PHƯƠNG THỨC THANH TOÁN -->
      <div class="col-lg-7">
        <!-- 1. THÔNG TIN NGƯỜI NHẬN -->
        <ThongTinNhanHang
          v-model="shippingInfo"
          :user-id="currentUser ? currentUser.id : ''"
        />

        <!-- 2. PHƯƠNG THỨC THANH TOÁN -->
        <PTThanhToanSelector
          v-model="paymentMethod"
          :allow-cod="isCodAllowed"
        />

        <!-- 3. CHỌN PHIẾU GIẢM GIÁ (MỚI THÊM) -->
        <PhieuGiamGiaSelector
          v-model="selectedVoucherId"
          :vouchers="vouchers"
          :sub-total="previewData.tong_tien_sau_km"
          @change-discount="voucherDiscountAmount = $event"
        />

        <!-- 4. DANH SÁCH SẢN PHẨM XEM TRƯỚC -->
        <DSSanPhamThanhToan
          :order-items="orderItems"
          :selected-voucher-id="selectedVoucherId"
        />
      </div>

      <!-- CỘT BÊN PHẢI: TÓM TẮT BẢNG GIÁ VÀ XÁC NHẬN ĐẶT HÀNG -->
      <div class="col-lg-5">
        <TomTatDonHang
          :summary="previewData"
          :voucher-discount="voucherDiscountAmount"
          :shipping-fee="shippingFeeAmount"
          :final-total="finalOrderTotal"
          :is-cod-exceed-limit="isCodExceedLimit"
          :submitting="submitting"
          @submit-order="handleCreateOrder"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from "vue";
import axios from "axios";

const loading = ref(false);

import ThongTinNhanHang from "@/components/TrangDatHang/ThongTinNhanHang.vue";
import PTThanhToanSelector from "@/components/TrangDatHang/PTThanhToanSelector.vue";
import DSSanPhamThanhToan from "@/components/TrangDatHang/DSSanPhamThanhToan.vue";
import PhieuGiamGiaSelector from "@/components/TrangDatHang/PhieuGiamGiaSelector.vue";
import TomTatDonHang from "@/components/TrangDatHang/TomTatDonHang.vue";

import DonHangService from "@/services/don-hang.service";
import PhieuKhachHangService from "@/services/phieu-khach-hang.service";

export default {
  name: "XemTruocDonHangView",
  components: {
    ThongTinNhanHang,
    PTThanhToanSelector,
    DSSanPhamThanhToan,
    PhieuGiamGiaSelector,
    TomTatDonHang,
  },
  data() {
    return {
      loading: true,
      submitting: false,
      previewData: null,
      orderItems: [],
      paymentMethod: "COD",
      vouchers: [],
      selectedVoucherId: "", // Lưu ID phiếu giảm giá người dùng chọn
      voucherDiscountAmount: 0, // Số tiền được giảm từ Voucher
      shippingInfo: {
        ho_ten: "",
        so_dien_thoai: "",
        dia_chi: "",
        province_id: "",
        district_id: "",
        ward_code: "",
        ghi_chu: "",
      },
      // Biến lưu phí ship GHN trả về
      shippingFeeAmount: 0,
      MAX_COD_AMOUNT: 45000000, // Hạn mức tối đa cho thanh toán COD (45 triệu)
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

    // 1. Tính tổng thanh toán cuối cùng duy nhất tại trang cha
    finalOrderTotal() {
      if (!this.previewData) return 0;
      const subTotal = Number(this.previewData.tong_tien_sau_km || 0);
      const discount = Number(this.voucherDiscountAmount || 0);
      const shipFee = Number(this.shippingFeeAmount || 0);

      const total = subTotal - discount + shipFee;
      return total < 0 ? 0 : total;
    },

    // 2. Kiểm tra đơn hàng có hợp lệ để dùng COD không (<= 45 triệu)
    isCodAllowed() {
      return this.finalOrderTotal <= this.MAX_COD_AMOUNT;
    },

    // 3. Cờ báo hiệu: Đang chọn COD NHƯNG lại vượt quá 45 triệu -> Khóa nút đặt hàng
    isCodExceedLimit() {
      return this.paymentMethod === "COD" && !this.isCodAllowed;
    },
  },
  watch: {
    // Khi người dùng chọn địa chỉ khác trong ThongTinNhanHang (district_id hoặc ward_code đổi) -> tính lại tiền vận chuyển
    "shippingInfo.district_id"(newVal) {
      if (newVal) {
        this.fetchShippingFee();
      }
    },
    "shippingInfo.ward_code"(newVal) {
      if (newVal) {
        this.fetchShippingFee();
      }
    },

    // Khi người dùng thay đổi chọn Voucher -> tính lại tiền vận chuyển
    selectedVoucherId(newVal) {
      this.fetchShippingFee();
    },
  },

  methods: {
    // 1. Lấy dữ liệu preview đơn hàng từ DonHangService.preview
    async fetchPreviewOrder() {
      if (!this.currentUser || !this.currentUser.id) {
        alert("Vui lòng đăng nhập để thực hiện thanh toán!");
        this.$router.push({ name: "login" });
        return;
      }
      // Lấy danh sách sản phẩm được chọn đã lưu từ giỏ hàng
      const storedItemsStr = sessionStorage.getItem("checkout_items");
      if (!storedItemsStr) {
        this.loading = false;
        return;
      }
      // Lấy phiếu giảm giá được chọn đã lưu từ giỏ hàng
      const savedVoucherId = sessionStorage.getItem("selected_voucher_id");
      if (savedVoucherId) {
        this.selectedVoucherId = savedVoucherId;
      }
      try {
        const selectedItems = JSON.parse(storedItemsStr);
        if (!Array.isArray(selectedItems) || selectedItems.length === 0) {
          this.loading = false;
          return;
        }
        // Gọi API preview tính toán hóa đơn
        const response = await DonHangService.previewCheckout({
          id_khach_hang: this.currentUser.id,
          items: selectedItems,
        });
        if (response) {
          this.previewData = response;
          // Lấy chi tiết danh sách đơn hàng từ kết quả preview
          this.orderItems = response.chi_tiet_don_hang;
        }
      } catch (error) {
        console.error("Lỗi khi xem trước đơn hàng:", error);
        alert("Không thể tải thông tin đơn hàng. Vui lòng thử lại!");
      } finally {
        this.loading = false;
      }
    },

    // 2. Tải danh sách phiếu giảm giá của người dùng
    async fetchVouchers() {
      if (!this.currentUser?.id) return;
      try {
        const response = await PhieuKhachHangService.getAll({
          id_khach_hang: this.currentUser.id,
          trang_thai: true, // Phiếu chưa dùng
          kha_dung: true, // Còn hạn dùng
          trang_thai_khoa: true, // trang thái của phiếu giảm giá là đang hoạt động
        });
        this.vouchers = response || [];
      } catch (error) {
        console.error("Lỗi khi tải danh sách phiếu giảm giá:", error);
      }
    },

    // ==================== 1. HÀM KIỂM TRA ĐIỀU KIỆN ĐỊA CHỈ (VALIDATE) ====================
    validateShippingInfo() {
      // Validate thông tin nhập tay
      if (!this.shippingInfo.ho_ten?.trim()) {
        alert("Vui lòng nhập họ tên người nhận!");
        return false;
      }
      if (!this.shippingInfo.so_dien_thoai?.trim()) {
        alert("Vui lòng nhập số điện thoại nhận hàng!");
        return false;
      }
      if (!this.shippingInfo.dia_chi_cu_the?.trim()) {
        alert("Vui lòng nhập địa chỉ giao hàng!");
        return false;
      }

      return true;
    },

    // Gọi API tính phí ship từ Backend
    async fetchShippingFee() {
      // Kiểm tra xem người dùng đã chọn đủ Quận/Huyện và Phường/Xã chưa
      if (!this.shippingInfo.district_id || !this.shippingInfo.ward_code) {
        this.shippingFeeAmount = 0;
        return;
      }

      try {
        // Chuẩn bị danh sách items từ previewData để gửi sang GHN tính trọng lượng
        const itemsPayload = (this.orderItems || []).map((item) => ({
          ten_san_pham: item.san_pham?.ten_san_pham,
          so_luong: item.so_luong,
          trong_luong: item.san_pham?.trong_luong,
        }));

        // Tính toán tổng tiền thực tế sau khi đã trừ voucher để tính tiền ship dựa trên giá trị này
        const subTotal = Number(this.previewData?.tong_tien_sau_km);
        const discount = Number(this.voucherDiscountAmount || 0);
        const finalTotal = subTotal - discount;

        const response = await axios.post(
          "http://localhost:5000/api/ghn/calculate-fee",
          {
            to_district_id: this.shippingInfo.district_id,
            to_ward_code: this.shippingInfo.ward_code,
            tong_tien: finalTotal > 0 ? finalTotal : 0,
            items: itemsPayload,
          },
        );
        if (response.data && response.data.success) {
          this.shippingFeeAmount = response.data.phi_van_chuyen;
        }
      } catch (error) {
        console.error("Lỗi khi tính phí vận chuyển:", error);
        this.shippingFeeAmount = 0;
      }
    },

    // ==================== 3. HÀM CHÍNH: XỬ LÝ ĐẶT HÀNG (LUỒNG CHÍNH) ====================
    async handleCreateOrder() {
      // 1. Kiểm tra thông tin người nhận và đơn hàng có đang vượt quá giá trị với PTTT COD
      if (!this.validateShippingInfo()) return;
      if (this.isCodExceedLimit) return;

      // 2. Lấy mảng danh sách ID chi tiết giỏ hàng từ this.orderItems
      const selectedItemIds = this.orderItems.map((item) => item.id);
      this.submitting = true;

      try {
        // 4. Chuẩn bị payload và gọi API tạo đơn hàng
        const orderPayload = {
          id_khach_hang: this.currentUser.id,
          so_dien_thoai: this.shippingInfo.so_dien_thoai,
          dia_chi: `${this.shippingInfo.ho_ten} - ${this.shippingInfo.ten_tinh}, ${this.shippingInfo.ten_huyen}, ${this.shippingInfo.ten_xa}, ${this.shippingInfo.dia_chi_cu_the}`,
          ghi_chu: this.shippingInfo.ghi_chu || "",
          phuong_thuc_thanh_toan: this.paymentMethod,
          id_phieu_giam_gia: this.selectedVoucherId || null,
          tien_van_chuyen: this.shippingFeeAmount,
          items: selectedItemIds,

          province_id: this.shippingInfo.province_id,
          district_id: this.shippingInfo.district_id,
          ward_code: this.shippingInfo.ward_code,
        };

        const result = await DonHangService.checkout(orderPayload);
        const orderId = result.data?.id;
        window.dispatchEvent(new Event("cart-updated"));

        // 5. Dọn dẹp cache
        sessionStorage.removeItem("checkout_items");
        sessionStorage.removeItem("selected_voucher_id");

        // ==================== 6. XỬ LÝ THEO PHƯƠNG THỨC THANH TOÁN ====================
        // Kiểm tra nếu chọn thanh toán VNPAY (Online)
        if (result.data.phuong_thuc_thanh_toan === "QR_CODE") {
          // Gọi API Backend Node.js để tạo link thanh toán VNPAY
          const payRes = await axios.post(
            "http://localhost:5000/api/thanh-toan/create_payment_url",
            {
              orderId: orderId,
              amount: result.data.tong_tien_thanh_toan,
              orderInfo: `Thanh toan don hang ${orderId}`,
            },
          );

          if (payRes.data && payRes.data.paymentUrl) {
            // Chuyển hướng trình duyệt sang cổng VNPAY
            window.location.href = payRes.data.paymentUrl;
          } else {
            alert("Không thể khởi tạo đường dẫn thanh toán VNPAY!");
          }
        } else {
          // Trường hợp COD (Thanh toán khi nhận hàng)
          alert("Đặt hàng thành công! Cảm ơn bạn đã mua sắm.");

          this.$router.push({
            name: "trang-chu.home",
            params: { id: orderId },
          });
        }
      } catch (error) {
        console.error("Lỗi khi tạo đơn hàng:", error);
        alert(
          error.response?.data?.message ||
            "Đặt hàng thất bại. Vui lòng thử lại!",
        );
      } finally {
        this.submitting = false;
      }
    },

    formatCurrency(value) {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value || 0);
    },
  },

  mounted() {
    this.fetchPreviewOrder();
    this.fetchVouchers();
  },
};
</script>

<style scoped>
.hover-border:hover {
  border-color: #0d6efd !important;
}
.cursor-pointer {
  cursor: pointer;
}
.object-fit-cover {
  object-fit: cover;
}
</style>
