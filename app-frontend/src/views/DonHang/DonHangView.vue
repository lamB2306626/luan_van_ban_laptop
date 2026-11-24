<template>
  <div class="container mt-3">
    <h4>Quản lý Đơn Hàng</h4>
    <table class="table table-bordered table-striped align-middle">
      <thead class="table-dark">
        <tr>
          <th>Mã Đơn Hàng</th>
          <th>Mã Khách Hàng</th>
          <th>Ngày Đặt</th>
          <th>Tổng Tiền</th>
          <th>Trạng Thái Đơn Hàng</th>
          <th>PTTT</th>
          <th>Mã vận đơn</th>
          <th>Hành động</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="donHang in donHangs" :key="donHang.id">
          <!-- Mã đơn hàng -->
          <td>{{ donHang.id }}</td>
          <!-- Mã khách hàng -->
          <td>{{ donHang.id_khach_hang }}-{{ donHang.khach_hang?.ho_ten }}</td>
          <!-- Ngày đặt -->
          <td>{{ formatDate(donHang.ngay_dat) }}</td>
          <!-- Tổng tiền thanh toán -->
          <td>{{ formatCurrency(donHang.tong_tien_thanh_toan) }}</td>

          <!-- Trạng thái đơn hàng (Có xét điều kiện QR_CODE & CHUA_THANH_TOAN) -->
          <td>
            <span class="badge" :class="getDisplayOrderStatusClass(donHang)">
              {{ getDisplayOrderStatusText(donHang) }}
            </span>
          </td>

          <!-- Phương thức thanh toán -->
          <td>
            <span
              class="badge mb-1 d-block"
              :class="getPTTTClass(donHang.phuong_thuc_thanh_toan)"
            >
              {{ getPTTTText(donHang.phuong_thuc_thanh_toan) }}
            </span>
          </td>

          <!-- Mã vận đơn -->
          <td>
            {{ donHang.ma_van_don || "Chưa có" }}
          </td>

          <!-- Hành động -->
          <td>
            <div class="d-flex flex-wrap gap-1">
              <!-- Nút xem chi tiết -->
              <button
                class="btn btn-sm btn-primary"
                title="Xem chi tiết"
                @click="goToDetailDonHang(donHang.id)"
              >
                <i class="fas fa-eye"></i>
              </button>

              <!-- Chờ duyệt (COD): Hiện trực tiếp Duyệt & Không duyệt -->
              <template
                v-if="
                  donHang.trang_thai_don_hang === 'CHO_DUYET' &&
                  donHang.phuong_thuc_thanh_toan === 'COD'
                "
              >
                <button
                  class="btn btn-sm btn-success"
                  :disabled="loadingId === donHang.id"
                  @click="approveDonHang(donHang)"
                >
                  <i class="fas fa-check"></i> Duyệt đơn
                </button>
                <button
                  class="btn btn-sm btn-danger"
                  :disabled="loadingId === donHang.id"
                  @click="openRejectModal(donHang)"
                >
                  <i class="fas fa-times"></i> Không duyệt
                </button>
              </template>

              <!-- Đã xác nhận: Chuyển sang Đang vận chuyển -->
              <button
                v-if="donHang.trang_thai_don_hang === 'DA_XAC_NHAN'"
                class="btn btn-sm btn-info text-dark"
                :disabled="loadingId === donHang.id"
                @click="moveToDangVanChuyen(donHang)"
              >
                <i class="fas fa-shipping-fast"></i> Đang vận chuyển
              </button>

              <!-- Đang vận chuyển: Chuyển sang Hoàn thành -->
              <button
                v-if="donHang.trang_thai_don_hang === 'DANG_VAN_CHUYEN'"
                class="btn btn-sm btn-success"
                :disabled="loadingId === donHang.id"
                @click="moveToHoanThanh(donHang)"
              >
                <i class="fas fa-check-double"></i> Hoàn thành
              </button>
            </div>
          </td>
        </tr>

        <!-- Hiển thị khi danh sách rỗng -->
        <tr v-if="donHangs.length === 0">
          <td colspan="8" class="text-center">Không có đơn hàng nào.</td>
        </tr>
      </tbody>
    </table>

    <!-- ==================== MODAL NHẬP LÝ DO KHÔNG DUYỆT ==================== -->
    <div
      v-if="showRejectModal"
      class="modal fade show d-block"
      tabindex="-1"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Không duyệt đơn hàng</h5>
            <button
              type="button"
              class="btn-close"
              @click="closeRejectModal"
            ></button>
          </div>
          <div class="modal-body">
            <p class="mb-2">
              Đơn hàng: <strong>{{ selectedDonHang?.id }}</strong>
            </p>
            <label for="lyDoKhongDuyet" class="form-label">
              Lý do không duyệt đơn hàng:
            </label>
            <textarea
              id="lyDoKhongDuyet"
              v-model.trim="rejectReason"
              class="form-control"
              rows="3"
              placeholder="Ví dụ: Hết hàng, thông tin nhận hàng chưa rõ ràng..."
            ></textarea>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="closeRejectModal"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              class="btn btn-danger"
              :disabled="loadingId === selectedDonHang?.id"
              @click="confirmCancelByNhanVien"
            >
              <i class="fas fa-times"></i> Xác nhận không duyệt
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import DonHangService from "@/services/don-hang.service";

export default {
  name: "DonHangView",

  data() {
    return {
      donHangs: [],
      selectedDonHang: null,
      showRejectModal: false,
      rejectReason: "",
      loadingId: null,
    };
  },

  computed: {
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
    // Mở modal nhập lý do không duyệt
    openRejectModal(donHang) {
      this.selectedDonHang = donHang;
      this.rejectReason = "";
      this.showRejectModal = true;
    },

    // Đóng modal không duyệt
    closeRejectModal() {
      this.showRejectModal = false;
      this.selectedDonHang = null;
      this.rejectReason = "";
    },

    // Lấy danh sách Đơn Hàng
    async retrieveDonHangs() {
      try {
        this.donHangs = await DonHangService.getAll();
      } catch (error) {
        console.error("Lỗi khi tải danh sách đơn hàng:", error);
      }
    },

    // Định dạng ngày
    formatDate(date) {
      if (!date) return "Chưa giao";
      return new Date(date).toLocaleDateString("vi-VN");
    },

    // Định dạng tiền
    formatCurrency(value) {
      if (value === null || value === undefined) {
        return "0 ₫";
      }
      return Number(value).toLocaleString("vi-VN") + " ₫";
    },

    // Hiển thị trạng thái đơn hàng gốc từ DB
    getOrderStatusText(status) {
      const statusMap = {
        CHO_DUYET: "Chờ duyệt",
        DA_XAC_NHAN: "Đã xác nhận",
        DANG_VAN_CHUYEN: "Đang giao",
        HOAN_THANH: "Đã giao",
        NV_HUY: "Đã hủy (bởi Admin)",
        KH_HUY: "Đã hủy (bởi Khách Hàng)",
        GIAO_THAT_BAI: "Giao hàng thất bại",
      };
      return statusMap[status] || status;
    },

    // Màu trạng thái đơn hàng gốc từ DB
    getOrderStatusClass(status) {
      const classMap = {
        CHO_DUYET: "bg-warning text-dark",
        DA_XAC_NHAN: "bg-primary",
        DANG_VAN_CHUYEN: "bg-info text-dark",
        HOAN_THANH: "bg-success",
        NV_HUY: "bg-danger",
        KH_HUY: "bg-danger",
        GIAO_THAT_BAI: "bg-danger",
      };
      return classMap[status] || "bg-secondary";
    },

    // Xét điều kiện hiển thị trạng thái đơn hàng
    getDisplayOrderStatusText(donHang) {
      if (
        donHang.phuong_thuc_thanh_toan === "QR_CODE" &&
        donHang.trang_thai_thanh_toan === "CHUA_THANH_TOAN"
      ) {
        return "Chờ khách thanh toán";
      }
      return this.getOrderStatusText(donHang.trang_thai_don_hang);
    },

    getDisplayOrderStatusClass(donHang) {
      if (
        donHang.phuong_thuc_thanh_toan === "QR_CODE" &&
        donHang.trang_thai_thanh_toan === "CHUA_THANH_TOAN"
      ) {
        return "bg-info text-dark";
      }
      return this.getOrderStatusClass(donHang.trang_thai_don_hang);
    },

    // Hiển thị phương thức thanh toán
    getPTTTText(status) {
      const statusMap = {
        COD: "COD",
        QR_CODE: "Chuyển khoản QR",
      };
      return statusMap[status] || status;
    },

    // Màu phương thức thanh toán
    getPTTTClass(status) {
      const classMap = {
        COD: "bg-secondary",
        QR_CODE: "bg-primary",
      };
      return classMap[status] || "bg-secondary";
    },

    // Điều hướng tới trang Chi tiết Đơn Hàng
    goToDetailDonHang(id) {
      this.$router.push({
        name: "don-hang.detail",
        params: { id: id },
      });
    },

    // Duyệt đơn trực tiếp
    async approveDonHang(donHang) {
      this.loadingId = donHang.id;
      try {
        await DonHangService.approve(donHang.id, {
          id_nhan_vien: this.currentUser?.id,
          type: "NV_DUYET",
        });
        alert("Duyệt đơn hàng thành công!");
        await this.retrieveDonHangs();
      } catch (error) {
        console.error("Lỗi khi duyệt đơn hàng:", error);
        alert(error.response?.data?.message || "Không thể duyệt đơn hàng!");
      } finally {
        this.loadingId = null;
      }
    },

    // Xác nhận không duyệt đơn từ Modal
    async confirmCancelByNhanVien() {
      if (!this.selectedDonHang) return;

      this.loadingId = this.selectedDonHang.id;
      try {
        await DonHangService.cancelByNhanVien(this.selectedDonHang.id, {
          ly_do_huy: this.rejectReason || "Admin không duyệt",
          id_nhan_vien_huy_don: this.currentUser?.id,
        });
        alert("Hủy đơn hàng thành công!");
        await this.retrieveDonHangs();
        this.closeRejectModal();
      } catch (error) {
        console.error("Lỗi khi hủy đơn hàng:", error);
        alert(error.response?.data?.message || "Không thể hủy đơn hàng!");
      } finally {
        this.loadingId = null;
      }
    },

    // Chuyển sang Đang vận chuyển
    async moveToDangVanChuyen(donHang) {
      this.loadingId = donHang.id;
      try {
        await DonHangService.toDangVanChuyen({
          order_code: donHang.ma_van_don,
          status: "delivering",
        });
        alert("Đã chuyển đơn hàng sang trạng thái Đang vận chuyển!");
        await this.retrieveDonHangs();
      } catch (error) {
        console.error("Lỗi khi chuyển sang đang vận chuyển:", error);
        alert(
          error.response?.data?.message ||
            "Không thể chuyển sang trạng thái Đang vận chuyển!",
        );
      } finally {
        this.loadingId = null;
      }
    },

    // Chuyển sang Hoàn thành
    async moveToHoanThanh(donHang) {
      this.loadingId = donHang.id;
      try {
        await DonHangService.toHoanThanh({
          order_code: donHang.ma_van_don,
          status: "delivered",
        });
        alert("Đã đánh dấu đơn hàng Hoàn thành!");
        await this.retrieveDonHangs();
      } catch (error) {
        console.error("Lỗi khi cập nhật hoàn thành:", error);
        alert(
          error.response?.data?.message ||
            "Không thể cập nhật trạng thái Hoàn thành!",
        );
      } finally {
        this.loadingId = null;
      }
    },
  },

  mounted() {
    this.retrieveDonHangs();
  },
};
</script>
