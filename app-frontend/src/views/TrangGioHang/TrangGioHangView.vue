<template>
  <div class="container my-4">
    <!-- TIÊU ĐỀ TRANG -->
    <div class="d-flex align-items-center justify-content-between mb-4">
      <h3 class="fw-bold text-dark m-0">
        <i class="fas fa-shopping-cart text-primary me-2"></i>Giỏ hàng của bạn
      </h3>
      <div>
        <span class="badge bg-primary fs-6" v-if="cartItems.length > 0">
          {{ totalItemsCount }} sản phẩm trong giỏ
        </span>
        <br />
        <span class="badge bg-primary fs-6">
          Đã chọn {{ selectedItemIds.length }}/{{ MAX_SELECT_ITEMS }} phân loại
          tối đa cho mỗi đơn hàng
        </span>
      </div>
    </div>

    <!-- DANH SÁCH SẢN PHẨM TRONG GIỎ -->
    <div class="row g-4" v-if="cartItems.length > 0">
      <!-- CỘT BÊN TRÁI: DANH SÁCH ITEM -->
      <div class="col-lg-8">
        <div class="card shadow-sm border-0">
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table align-middle mb-0">
                <thead class="bg-light">
                  <tr>
                    <!-- CHECKBOX CHỌN TẤT CẢ -->
                    <th
                      scope="col"
                      class="ps-3 py-3 text-center"
                      style="width: 40px"
                    >
                      <input
                        type="checkbox"
                        class="form-check-input cursor-pointer"
                        :checked="isSelectAll"
                        @change="toggleSelectAll"
                      />
                    </th>
                    <th scope="col" class="py-3">Sản phẩm</th>
                    <th scope="col" class="text-center py-3">Đơn giá</th>
                    <th scope="col" class="text-center py-3">Số lượng</th>
                    <th scope="col" class="text-end py-3">Thành tiền</th>
                    <th
                      scope="col"
                      class="text-center py-3"
                      style="width: 50px"
                    ></th>
                  </tr>
                </thead>
                <tbody>
                  <GioHangItem
                    v-for="item in cartItems"
                    :key="item.id"
                    :item="item"
                    :is-selected="selectedItemIds.includes(item.id)"
                    :is-disabled-select="
                      !selectedItemIds.includes(item.id) &&
                      selectedItemIds.length >= MAX_SELECT_ITEMS
                    "
                    @toggle-select="onToggleSelect"
                    @update-quantity="onUpdateQuantity"
                    @remove-item="onRemoveItem"
                    @view-detail="goToDetail"
                  />
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- NÚT TIẾP TỤC MUA SẮM -->
        <div class="mt-3">
          <router-link
            :to="{ name: 'trang-chu.home' }"
            class="btn btn-outline-secondary"
          >
            <i class="fas fa-arrow-left me-1"></i> Tiếp tục mua sắm
          </router-link>
        </div>
      </div>

      <!-- CỘT BÊN PHẢI: COMPONENT TÓM TẮT ĐƠN HÀNG (Dữ liệu tính từ Computed) -->
      <div class="col-lg-4">
        <!-- CHỌN PHIẾU GIẢM GIÁ -->
        <PhieuGiamGiaSelector
          v-model="selectedVoucherId"
          :vouchers="vouchers"
          :sub-total="rawSubTotal"
          @change-discount="voucherDiscountAmount = $event"
        />

        <!-- TÓM TẮT ĐƠN HÀNG -->
        <TomTatGioHang
          :summary="calculatedSummary"
          :can-checkout="canCheckout"
          :selected-count="selectedItemIds.length"
          @checkout="goToCheckout"
        />
      </div>
    </div>

    <!-- HIỂN THỊ KHU VỰC RỖNG -->
    <div v-else class="text-center py-5 shadow-sm bg-light rounded">
      <i class="fas fa-shopping-cart fa-4x text-muted mb-3 opacity-50"></i>
      <h5 class="text-secondary mb-3">Giỏ hàng của bạn đang trống!</h5>
      <router-link
        :to="{ name: 'trang-chu.home' }"
        class="btn btn-primary px-4 fw-bold"
      >
        <i class="fas fa-cart-plus me-1"></i> Khám phá sản phẩm ngay
      </router-link>
    </div>
  </div>
</template>

<script>
import GioHangItem from "@/components/TrangGioHang/GioHangItem.vue";
import TomTatGioHang from "@/components/TrangGioHang/TomTatGioHang.vue";
import PhieuGiamGiaSelector from "@/components/TrangDatHang/PhieuGiamGiaSelector.vue";

import GioHangService from "@/services/gio-hang.service";
import ChiTietGioHangService from "@/services/chi-tiet-gio-hang.service";
import PhieuKhachHangService from "@/services/phieu-khach-hang.service";

export default {
  name: "TrangGioHangView",
  components: {
    GioHangItem,
    TomTatGioHang,
    PhieuGiamGiaSelector,
  },
  data() {
    return {
      gioHangData: null,
      cartItems: [],
      selectedItemIds: [], // Ban đầu mảng rỗng (bỏ tick tất cả)
      vouchers: [],
      selectedVoucherId: "",
      voucherDiscountAmount: 0,
      MAX_SELECT_ITEMS: 5, // Hằng số giới hạn tối đa 5 phân loại/đơn hàng
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

    selectableItems() {
      return this.cartItems.filter((item) => this.isItemSelectable(item));
    },

    totalItemsCount() {
      return this.cartItems.reduce((acc, item) => acc + item.so_luong, 0);
    },

    // Kiểm tra xem đã tick chọn tất cả các sản phẩm hợp lệ chưa
    isSelectAll() {
      if (this.selectableItems.length === 0) return false;
      // Số lượng tối đa có thể chọn (nhỏ nhất giữa 5 và tổng số item hợp lệ trong giỏ)
      const maxCanSelect = Math.min(
        this.MAX_SELECT_ITEMS,
        this.selectableItems.length,
      );
      return this.selectedItemIds.length >= maxCanSelect;
    },

    canCheckout() {
      return (
        this.selectedItemIds.length > 0 &&
        this.selectedItemIds.length <= this.MAX_SELECT_ITEMS
      );
    },

    // Tổng tiền hàng tạm tính (sau KM sản phẩm) cho PhieuGiamGiaSelector
    rawSubTotal() {
      const selectedItems = this.cartItems.filter((item) =>
        this.selectedItemIds.includes(item.id),
      );

      return selectedItems.reduce((acc, item) => {
        const qty = Number(item.so_luong) || 0;
        const donGiaApDung = Number(item.bien_the?.don_gia_ap_dung) || 0;
        return acc + donGiaApDung * qty;
      }, 0);
    },

    // --- TÍNH TOÁN BẢNG TỔNG TIỀN CUỐI CÙNG CHO TomTatGioHang ---
    calculatedSummary() {
      const selectedItems = this.cartItems.filter((item) =>
        this.selectedItemIds.includes(item.id),
      );

      let tongTienGoc = 0;
      let tongTienSauKM = 0;

      selectedItems.forEach((item) => {
        const qty = Number(item.so_luong) || 0;
        const donGiaApDung = Number(item.bien_the?.don_gia_ap_dung) || 0;
        const giaGoc = Number(item.bien_the?.gia);

        tongTienGoc += giaGoc * qty;
        tongTienSauKM += donGiaApDung * qty;
      });

      // Tiền thanh toán cuối cùng = Tiền sau KM SP - Tiền giảm Voucher
      const tongTienSauDungPGG = Math.max(
        0,
        tongTienSauKM - this.voucherDiscountAmount,
      );

      return {
        tong_tien_goc: tongTienGoc,
        tong_tien_giam_km: tongTienGoc - tongTienSauKM, // Tổng tiết kiệm (Khuyến mãi)
        tong_tien_sau_dung_PGG: tongTienSauDungPGG,
        voucher_discount: this.voucherDiscountAmount, // Truyền thêm để hiển thị dòng voucher nếu TomTatGioHang có hỗ trợ
      };
    },
  },

  methods: {
    // 1. Tải giỏ hàng
    async retrieveGioHang() {
      if (!this.currentUser || !this.currentUser.id) {
        alert("Vui lòng đăng nhập để xem giỏ hàng!");
        this.$router.push({ name: "login" });
        return;
      }

      try {
        const response = await GioHangService.getAll({
          id_khach_hang: this.currentUser.id,
        });

        const cart = Array.isArray(response) ? response[0] : response;

        if (cart) {
          this.gioHangData = cart;
          this.cartItems = cart.chi_tiet_gio_hang || [];
        } else {
          this.gioHangData = null;
          this.cartItems = [];
        }

        // ==================== MẶC ĐỊNH TICK CHỌN SẴN CHI TIẾT GIỎ HÀNG (nếu có truyền item_ids) ====================
        const querySelectedItems = this.$route.query.item_ids;

        if (querySelectedItems) {
          // Ép kiểu về mảng string (trường hợp truyền chuỗi cách nhau bởi dấu phẩy)
          const targetIds = String(querySelectedItems).split(",");

          // Chỉ tick các sản phẩm có tồn tại trong cartItems và hợp lệ để checkout
          this.selectedItemIds = targetIds.filter((id) =>
            this.cartItems.some(
              (item) => item.id === id && this.isItemSelectable(item),
            ),
          );
        }

        // ==================== MẶC ĐỊNH CHỌN SẴN PHIẾU GIẢM GIÁ (nếu có truyền voucher_id) ====================
        const querySelectedVoucher = this.$route.query.voucher_id;
        if (querySelectedVoucher) {
          this.selectedVoucherId = querySelectedVoucher;
        }
      } catch (error) {
        console.error("Lỗi khi tải giỏ hàng:", error);
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

    // 2. Click tick/untick từng dòng
    onToggleSelect(item) {
      const index = this.selectedItemIds.indexOf(item.id);

      if (index > -1) {
        // Nếu đã tick rồi -> Cho phép bỏ tick thoải mái
        this.selectedItemIds.splice(index, 1);
      } else {
        // Nếu chưa tick -> Kiểm tra xem đã đạt trần 5 món chưa
        if (this.selectedItemIds.length >= this.MAX_SELECT_ITEMS) {
          alert(
            `Mỗi đơn hàng chỉ được chọn tối đa ${this.MAX_SELECT_ITEMS} phân loại sản phẩm!`,
          );
          return;
        }
        this.selectedItemIds.push(item.id);
      }
    },

    // 3. Tick/Untick tất cả (Tối đa 5 món hợp lệ đầu tiên)
    toggleSelectAll() {
      if (this.isSelectAll) {
        // Đang chọn đủ mức tối đa -> Bỏ chọn tất cả
        this.selectedItemIds = [];
      } else {
        // Chọn tối đa 5 sản phẩm hợp lệ đầu tiên trong giỏ
        this.selectedItemIds = this.selectableItems
          .slice(0, this.MAX_SELECT_ITEMS)
          .map((item) => item.id);
      }
    },

    // 4. Cập nhật số lượng
    async onUpdateQuantity({ item, newQuantity }) {
      try {
        // Cập nhật giao diện lập tức
        item.so_luong = newQuantity;

        // Cập nhật xuống database
        await ChiTietGioHangService.update(item.id, {
          so_luong: newQuantity,
        });
        // window.dispatchEvent(new Event("cart-updated"));
      } catch (error) {
        console.error("Lỗi khi cập nhật số lượng:", error);
        this.retrieveGioHang();
      }
    },

    // 5. Xóa sản phẩm
    async onRemoveItem(item) {
      if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?")) {
        try {
          await ChiTietGioHangService.delete(item.id);
          this.selectedItemIds = this.selectedItemIds.filter(
            (id) => id !== item.id,
          );
          window.dispatchEvent(new Event("cart-updated"));
          await this.retrieveGioHang();
        } catch (error) {
          console.error("Lỗi khi xóa sản phẩm khỏi giỏ hàng:", error);
        }
      }
    },

    isItemSelectable(item) {
      // Chưa bị xóa mềm (isDelete phải là false hoặc null/undefined)
      const isNotDeleted = !Boolean(item.bien_the?.isDelete);
      const isKinhDoanh = Boolean(item.bien_the?.trang_thai ?? true);
      const qtyInCart = Number(item.so_luong);
      const stockQty = Number(item.bien_the?.so_luong);

      return (
        isKinhDoanh && isNotDeleted && stockQty > 0 && qtyInCart <= stockQty
      );
    },

    goToCheckout() {
      if (this.canCheckout) {
        sessionStorage.setItem(
          "checkout_items",
          JSON.stringify(this.selectedItemIds),
        );

        // Lưu lại voucher đã chọn để trang Thanh toán tự động gắn sẵn
        if (this.selectedVoucherId) {
          sessionStorage.setItem("selected_voucher_id", this.selectedVoucherId);
        } else {
          sessionStorage.removeItem("selected_voucher_id");
        }

        this.$router.push({ name: "dat-hang.preview" });
      }
    },
  },

  mounted() {
    this.retrieveGioHang();
    this.fetchVouchers();
  },
};
</script>
