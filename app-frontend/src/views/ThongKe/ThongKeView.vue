<template>
  <div class="container-fluid mt-3 mb-5">
    <!-- Tiêu đề & Nút làm mới -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="mb-0">
        <i class="fas fa-chart-line me-2 text-primary"></i>Thống Kê & Báo Cáo
        Quản Trị
      </h4>
      <button
        class="btn btn-outline-primary btn-sm"
        :disabled="isLoading"
        @click="fetchAllThongKe"
      >
        <i class="fas fa-sync-alt" :class="{ 'fa-spin': isLoading }"></i> Làm
        mới dữ liệu
      </button>
    </div>

    <!-- Cảnh báo nếu tài khoản không có quyền xem thống kê -->
    <div v-if="!canViewThongKe" class="alert alert-warning">
      <i class="fas fa-exclamation-triangle me-2"></i>
      Bạn không có quyền truy cập vào trang Thống kê hệ thống. Vui lòng liên hệ
      Quản trị viên!
    </div>

    <div v-else>
      <!-- ==================== 1. BỘ LỌC THỜI GIAN DÙNG CHUNG ==================== -->
      <div class="card shadow-sm mb-4">
        <div class="card-body">
          <div class="row g-3 align-items-end">
            <!-- Các nút chọn nhanh khoảng thời gian -->
            <div class="col-lg-5 col-md-12">
              <label class="form-label fw-bold small text-muted"
                >Chọn nhanh thời gian:</label
              >
              <div class="btn-group d-flex" role="group">
                <button
                  type="button"
                  class="btn btn-sm"
                  :class="
                    quickRange === '7days'
                      ? 'btn-primary'
                      : 'btn-outline-secondary'
                  "
                  @click="applyQuickRange('7days')"
                >
                  7 ngày qua
                </button>
                <button
                  type="button"
                  class="btn btn-sm"
                  :class="
                    quickRange === '30days'
                      ? 'btn-primary'
                      : 'btn-outline-secondary'
                  "
                  @click="applyQuickRange('30days')"
                >
                  30 ngày qua
                </button>
                <button
                  type="button"
                  class="btn btn-sm"
                  :class="
                    quickRange === 'thisMonth'
                      ? 'btn-primary'
                      : 'btn-outline-secondary'
                  "
                  @click="applyQuickRange('thisMonth')"
                >
                  Tháng này
                </button>
                <button
                  type="button"
                  class="btn btn-sm"
                  :class="
                    quickRange === 'thisYear'
                      ? 'btn-primary'
                      : 'btn-outline-secondary'
                  "
                  @click="applyQuickRange('thisYear')"
                >
                  Năm nay
                </button>
              </div>
            </div>

            <!-- Chọn ngày bắt đầu -->
            <div class="col-lg-2 col-md-4 col-sm-6">
              <label class="form-label fw-bold small text-muted"
                >Từ ngày:</label
              >
              <input
                v-model="filter.tu_ngay"
                type="date"
                class="form-control form-control-sm"
                @change="quickRange = 'custom'"
              />
            </div>

            <!-- Chọn ngày kết thúc -->
            <div class="col-lg-2 col-md-4 col-sm-6">
              <label class="form-label fw-bold small text-muted"
                >Đến ngày:</label
              >
              <input
                v-model="filter.den_ngay"
                type="date"
                class="form-control form-control-sm"
                @change="quickRange = 'custom'"
              />
            </div>

            <!-- Nút áp dụng lọc -->
            <div class="col-lg-3 col-md-4">
              <button
                class="btn btn-primary btn-sm w-100"
                :disabled="isLoading"
                @click="fetchAllThongKe"
              >
                <i class="fas fa-filter me-1"></i> Áp dụng bộ lọc
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== 2. HÀNG 4 THẺ KPI TỔNG QUAN ==================== -->
      <div class="row g-3 mb-4">
        <!-- Card 1: Tổng Doanh Thu Thuần -->
        <div class="col-xl-3 col-md-6">
          <div
            class="card border-start border-primary border-4 shadow-sm h-100"
          >
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="text-uppercase small fw-bold text-primary mb-1">
                    Doanh thu thuần
                  </div>
                  <h5 class="fw-bold mb-1">
                    {{
                      formatCurrency(
                        doanhThuData?.tong_quan?.tong_doanh_thu || 0,
                      )
                    }}
                  </h5>
                  <small class="text-muted">
                    Đã bán:
                    <strong>{{
                      doanhThuData?.tong_quan?.tong_san_pham_ban_ra || 0
                    }}</strong>
                    máy
                  </small>
                </div>
                <div class="fs-2 text-primary opacity-50">
                  <i class="fas fa-coins"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 2: Lợi Nhuận Gộp -->
        <div class="col-xl-3 col-md-6">
          <div
            class="card border-start border-success border-4 shadow-sm h-100"
          >
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="text-uppercase small fw-bold text-success mb-1">
                    Lợi nhuận gộp
                  </div>
                  <h5 class="fw-bold mb-1">
                    {{
                      formatCurrency(
                        doanhThuData?.tong_quan?.tong_loi_nhuan_gop || 0,
                      )
                    }}
                  </h5>
                  <small class="text-muted">
                    Tỷ suất:
                    <span class="badge bg-success-subtle text-success">
                      {{ doanhThuData?.tong_quan?.ty_suat_loi_nhuan || 0 }}%
                    </span>
                  </small>
                </div>
                <div class="fs-2 text-success opacity-50">
                  <i class="fas fa-chart-pie"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 3: Tổng Đơn Hàng & Tỷ lệ thành công -->
        <div class="col-xl-3 col-md-6">
          <div class="card border-start border-info border-4 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="text-uppercase small fw-bold text-info mb-1">
                    Tổng đơn hàng
                  </div>
                  <h5 class="fw-bold mb-1">
                    {{ donHangData?.tong_quan?.tong_so_don || 0 }} đơn
                  </h5>
                  <small class="text-muted">
                    Thành công:
                    <strong class="text-success">
                      {{ donHangData?.tong_quan?.so_don_thanh_cong || 0 }}
                      ({{ donHangData?.tong_quan?.ty_le_thanh_cong || 0 }}%)
                    </strong>
                  </small>
                </div>
                <div class="fs-2 text-info opacity-50">
                  <i class="fas fa-shopping-bag"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 4: Cảnh báo Đơn hủy & Giao thất bại -->
        <div class="col-xl-3 col-md-6">
          <div class="card border-start border-danger border-4 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="text-uppercase small fw-bold text-danger mb-1">
                    Giao thất bại / Hủy
                  </div>
                  <h5 class="fw-bold mb-1">
                    {{ donHangData?.tong_quan?.so_don_giao_that_bai || 0 }} thất
                    bại
                  </h5>
                  <small class="text-muted">
                    KH hủy:
                    <strong>{{
                      donHangData?.tong_quan?.so_don_khach_huy || 0
                    }}</strong>
                    | Admin hủy:
                    <strong>{{
                      donHangData?.tong_quan?.so_don_nv_huy || 0
                    }}</strong>
                  </small>
                </div>
                <div class="fs-2 text-danger opacity-50">
                  <i class="fas fa-times-circle"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== 3. THANH CHUYỂN TAB CHUYÊN BIỆT ==================== -->
      <ul class="nav nav-tabs mb-4">
        <li class="nav-item">
          <button
            class="nav-link fw-semibold"
            :class="{ active: activeTab === 'doanh-thu' }"
            @click="activeTab = 'doanh-thu'"
          >
            <i class="fas fa-money-bill-wave me-2"></i>1. Tài chính & Lợi nhuận
          </button>
        </li>
        <li class="nav-item">
          <button
            class="nav-link fw-semibold"
            :class="{ active: activeTab === 'don-hang' }"
            @click="activeTab = 'don-hang'"
          >
            <i class="fas fa-truck me-2"></i>2. Vận hành & Đơn hàng
          </button>
        </li>
        <li class="nav-item">
          <button
            class="nav-link fw-semibold"
            :class="{ active: activeTab === 'san-pham' }"
            @click="activeTab = 'san-pham'"
          >
            <i class="fas fa-laptop me-2"></i>3. Sản phẩm & Cấu hình Laptop
          </button>
        </li>
        <li class="nav-item">
          <button
            class="nav-link fw-semibold"
            :class="{ active: activeTab === 'ton-kho' }"
            @click="activeTab = 'ton-kho'"
          >
            <i class="fas fa-boxes me-2"></i>4. Tồn kho & Nhập hàng
            <span
              v-if="tonKhoData?.tong_quan?.so_bien_the_sap_het > 0"
              class="badge bg-danger ms-1"
            >
              {{ tonKhoData.tong_quan.so_bien_the_sap_het }}
            </span>
          </button>
        </li>
      </ul>

      <!-- Trạng thái Loading -->
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Đang tải dữ liệu...</span>
        </div>
        <p class="mt-2 text-muted">Đang tổng hợp dữ liệu báo cáo...</p>
      </div>

      <!-- Nội dung từng Tab (Gọi các Component con tương ứng) -->
      <div v-else>
        <ThongKeDoanhThuTab
          v-if="activeTab === 'doanh-thu'"
          :data="doanhThuData"
          :loai-thoi-gian="filter.loai_thoi_gian"
          @change-group-by="handleChangeGroupBy"
        />

        <ThongKeDonHangTab
          v-if="activeTab === 'don-hang'"
          :data="donHangData"
        />

        <ThongKeSanPhamTab
          v-if="activeTab === 'san-pham'"
          :data="sanPhamData"
          :limit="filter.limit"
          @change-limit="handleChangeLimit"
        />

        <ThongKeTonKhoTab
          v-if="activeTab === 'ton-kho'"
          :data="tonKhoData"
          :nguong-sap-het="filter.nguong_sap_het"
          :so-ngay-ton-dong="filter.so_ngay_ton_dong"
          @change-filter="handleChangeTonKhoFilter"
        />
      </div>
    </div>
  </div>
</template>

<script>
import ThongKeService from "@/services/thong-ke.service";
// Import 3 component con cho từng Tab (sẽ tạo ở bước tiếp theo)
import ThongKeDoanhThuTab from "@/components/ThongKe/ThongKeDoanhThuTab.vue";
import ThongKeDonHangTab from "@/components/ThongKe/ThongKeDonHangTab.vue";
import ThongKeSanPhamTab from "@/components/ThongKe/ThongKeSanPhamTab.vue";
import ThongKeTonKhoTab from "@/components/ThongKe/ThongKeTonKhoTab.vue";

const ALLOWED_THONG_KE_ROLES = ["Quản trị viên"];

export default {
  name: "ThongKeView",
  components: {
    ThongKeDoanhThuTab,
    ThongKeDonHangTab,
    ThongKeSanPhamTab,
    ThongKeTonKhoTab,
  },
  data() {
    return {
      isLoading: false,
      activeTab: "doanh-thu", // 'doanh-thu' | 'don-hang' | 'san-pham'
      quickRange: "30days",

      // Bộ lọc dùng chung cho toàn trang
      filter: {
        tu_ngay: "",
        den_ngay: "",
        loai_thoi_gian: "day", // Dùng cho Tab Doanh thu ('day' | 'month' | 'year')
        limit: 10, // Dùng cho Tab Top sản phẩm

        nguong_sap_het: 5, // Mới thêm
        so_ngay_ton_dong: 45, // Mới thêm
      },

      // Dữ liệu nhận từ 3 API Backend
      doanhThuData: null,
      donHangData: null,
      sanPhamData: null,
      tonKhoData: null,
    };
  },

  computed: {
    currentAdminUser() {
      try {
        const userStr = localStorage.getItem("adminUser");
        return userStr ? JSON.parse(userStr) : null;
      } catch (e) {
        return null;
      }
    },

    adminRole() {
      if (!this.currentAdminUser) return null;
      return this.currentAdminUser.vai_tro?.ten_vai_tro;
    },

    canViewThongKe() {
      return (
        !!this.adminRole && ALLOWED_THONG_KE_ROLES.includes(this.adminRole)
      );
    },
  },

  methods: {
    // Format tiền tệ VNĐ
    formatCurrency(value) {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value || 0);
    },

    // Chuyển Date object thành chuỗi YYYY-MM-DD cho input[type="date"]
    formatDateInput(dateObj) {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    },

    // Áp dụng các mốc thời gian chọn nhanh
    applyQuickRange(rangeType) {
      this.quickRange = rangeType;
      const today = new Date();
      let start = new Date();

      if (rangeType === "7days") {
        start.setDate(today.getDate() - 7);
        this.filter.loai_thoi_gian = "day";
      } else if (rangeType === "30days") {
        start.setDate(today.getDate() - 30);
        this.filter.loai_thoi_gian = "day";
      } else if (rangeType === "thisMonth") {
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        this.filter.loai_thoi_gian = "day";
      } else if (rangeType === "thisYear") {
        start = new Date(today.getFullYear(), 0, 1);
        this.filter.loai_thoi_gian = "month";
      }

      this.filter.tu_ngay = this.formatDateInput(start);
      this.filter.den_ngay = this.formatDateInput(today);

      this.fetchAllThongKe();
    },

    // Gọi song song cả 3 API thống kê để đồng bộ dữ liệu toàn trang
    async fetchAllThongKe() {
      if (!this.canViewThongKe) return;

      if (
        this.filter.tu_ngay &&
        this.filter.den_ngay &&
        new Date(this.filter.tu_ngay) > new Date(this.filter.den_ngay)
      ) {
        alert("Ngày bắt đầu không được lớn hơn ngày kết thúc!");
        return;
      }

      this.isLoading = true;
      try {
        const baseParams = {
          tu_ngay: this.filter.tu_ngay,
          den_ngay: this.filter.den_ngay,
        };

        const [resDoanhThu, resDonHang, resSanPham, resTonKho] =
          await Promise.all([
            ThongKeService.getDoanhThuLoiNhuan({
              ...baseParams,
              loai_thoi_gian: this.filter.loai_thoi_gian,
            }),
            ThongKeService.getThongKeDonHang(baseParams),
            ThongKeService.getThongKeSanPhamCauHinh({
              ...baseParams,
              limit: this.filter.limit,
            }),
            ThongKeService.getThongKeTonKho({
              nguong_sap_het: this.filter.nguong_sap_het,
              so_ngay_ton_dong: this.filter.so_ngay_ton_dong,
            }),
          ]);

        this.doanhThuData = resDoanhThu;
        this.donHangData = resDonHang;
        this.sanPhamData = resSanPham;
        this.tonKhoData = resTonKho;
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu thống kê:", error);
        const errorMessage =
          error.response?.data?.message ||
          "Đã xảy ra lỗi khi tải dữ liệu thống kê!";
        alert(errorMessage);
      } finally {
        this.isLoading = false;
      }
    },

    // Xử lý khi component Tab Doanh thu yêu cầu đổi gom nhóm (Ngày / Tháng / Năm)
    async handleChangeGroupBy(newGroupBy) {
      this.filter.loai_thoi_gian = newGroupBy;
      try {
        this.doanhThuData = await ThongKeService.getDoanhThuLoiNhuan({
          tu_ngay: this.filter.tu_ngay,
          den_ngay: this.filter.den_ngay,
          loai_thoi_gian: this.filter.loai_thoi_gian,
        });
      } catch (error) {
        console.error("Lỗi khi cập nhật biểu đồ doanh thu:", error);
      }
    },

    // Xử lý khi component Tab Sản phẩm yêu cầu đổi số lượng Top (Top 5 / Top 10)
    async handleChangeLimit(newLimit) {
      this.filter.limit = newLimit;
      try {
        this.sanPhamData = await ThongKeService.getThongKeSanPhamCauHinh({
          tu_ngay: this.filter.tu_ngay,
          den_ngay: this.filter.den_ngay,
          limit: this.filter.limit,
        });
      } catch (error) {
        console.error("Lỗi khi cập nhật top sản phẩm:", error);
      }
    },

    // Xử lý khi component Tab Tồn kho thay đổi ngưỡng lọc
    // async handleChangeTonKhoFilter(newFilter) {
    //   this.filter.nguong_sap_het = newFilter.nguong_sap_het;
    //   this.filter.so_ngay_ton_dong = newFilter.so_ngay_ton_dong;
    //   try {
    //     this.tonKhoData = await ThongKeService.getThongKeTonKho({
    //       nguong_sap_het: this.filter.nguong_sap_het,
    //       so_ngay_ton_dong: this.filter.so_ngay_ton_dong,
    //     });
    //   } catch (error) {
    //     console.error("Lỗi khi cập nhật thống kê tồn kho:", error);
    //   }
    // },

    async handleChangeTonKhoFilter(newFilter) {
      if (this.isUpdatingTonKho) return;
      this.isUpdatingTonKho = true;
      this.filter.nguong_sap_het = newFilter.nguong_sap_het;
      this.filter.so_ngay_ton_dong = newFilter.so_ngay_ton_dong;
      try {
        this.tonKhoData = await ThongKeService.getThongKeTonKho({
          nguong_sap_het: this.filter.nguong_sap_het,
          so_ngay_ton_dong: this.filter.so_ngay_ton_dong,
        });
      } catch (error) {
        console.error("Lỗi khi cập nhật thống kê tồn kho:", error);
      } finally {
        this.isUpdatingTonKho = false;
      }
    },
  },

  mounted() {
    if (!this.canViewThongKe) {
      window.dispatchEvent(
        new CustomEvent("admin-access-denied", {
          detail: { message: "Bạn không có quyền xem trang Thống kê!" },
        }),
      );
      return;
    }

    // Mặc định tải dữ liệu 30 ngày gần nhất khi mở trang
    this.applyQuickRange("30days");
  },
};
</script>
