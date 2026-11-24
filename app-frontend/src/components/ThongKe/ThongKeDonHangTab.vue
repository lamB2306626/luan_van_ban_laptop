<template>
  <div>
    <!-- ==================== 1. HÀNG CHỈ SỐ VẬN HÀNH NHANH ==================== -->
    <div class="row g-3 mb-4">
      <div class="col-md-3 col-sm-6">
        <div class="card shadow-sm border-0 bg-light h-100">
          <div class="card-body">
            <div class="text-muted small fw-bold text-uppercase mb-1">
              Đơn đang xử lý
            </div>
            <h5 class="fw-bold text-primary mb-1">
              {{ tongQuan.so_don_dang_xu_ly || 0 }} đơn
            </h5>
            <small class="text-muted">Chờ duyệt, Đã xác nhận, Đang giao</small>
          </div>
        </div>
      </div>

      <div class="col-md-3 col-sm-6">
        <div class="card shadow-sm border-0 bg-light h-100">
          <div class="card-body">
            <div class="text-muted small fw-bold text-uppercase mb-1">
              Thời gian giao TB
            </div>
            <h5 class="fw-bold text-info mb-1">
              {{ tongQuan.thoi_gian_giao_trung_binh_gio || 0 }} giờ
            </h5>
            <small class="text-muted"
              >Tính trên các đơn đã giao thành công</small
            >
          </div>
        </div>
      </div>

      <div class="col-md-3 col-sm-6">
        <div class="card shadow-sm border-0 bg-light h-100">
          <div class="card-body">
            <div class="text-muted small fw-bold text-uppercase mb-1">
              Tỷ lệ Khách / Admin hủy
            </div>
            <h5 class="fw-bold text-warning mb-1">
              {{ tongQuan.ty_le_khach_huy || 0 }}% /
              {{ tongQuan.ty_le_nv_huy || 0 }}%
            </h5>
            <small class="text-muted">
              KH hủy: {{ tongQuan.so_don_khach_huy || 0 }} | Admin hủy:
              {{ tongQuan.so_don_nv_huy || 0 }}
            </small>
          </div>
        </div>
      </div>

      <div class="col-md-3 col-sm-6">
        <div class="card shadow-sm border-0 bg-light h-100">
          <div class="card-body">
            <div class="text-muted small fw-bold text-uppercase mb-1">
              Tỷ lệ Giao thất bại (Boom hàng)
            </div>
            <h5 class="fw-bold text-danger mb-1">
              {{ tongQuan.ty_le_giao_that_bai || 0 }}%
            </h5>
            <small class="text-muted">
              {{ tongQuan.so_don_giao_that_bai || 0 }} đơn hoàn hàng sau khi
              xuất kho
            </small>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 2. HAI BIỂU ĐỒ TRÒN DONUT (DÙNG COMPONENT CHUNG) ==================== -->
    <div class="row g-4 mb-4">
      <div class="col-lg-7">
        <DonutChartCard
          title="Tỷ lệ Đơn hàng theo Trạng thái"
          title-class="text-primary"
          icon="fas fa-chart-pie"
          legend-position="right"
          unit-label="đơn"
          :height="260"
          :items="trangThaiChartItems"
          empty-text="Không có dữ liệu đơn hàng trong khoảng thời gian này."
        />
      </div>

      <div class="col-lg-5">
        <DonutChartCard
          title="Phương thức Thanh toán"
          title-class="text-info"
          icon="fas fa-credit-card"
          legend-position="bottom"
          unit-label="đơn"
          :height="200"
          :items="thanhToanChartItems"
          empty-text="Chưa có dữ liệu thanh toán."
        />
      </div>
    </div>

    <!-- ==================== 3. PHÂN TÍCH CHI TIẾT LÝ DO HỦY / GIAO THẤT BẠI ==================== -->
    <div class="card shadow-sm mb-4">
      <div
        class="card-header bg-white d-flex flex-wrap justify-content-between align-items-center py-3"
      >
        <div>
          <h6 class="mb-0 fw-bold text-danger">
            <i class="fas fa-exclamation-circle me-2"></i>Phân tích Lý do Hủy
            đơn & Giao thất bại
          </h6>
          <small class="text-muted">
            Tách biệt rõ nguyên nhân từ phía khách hàng, quản trị viên và khâu
            vận chuyển
          </small>
        </div>

        <div class="btn-group btn-group-sm mt-2 mt-sm-0" role="group">
          <button
            type="button"
            class="btn"
            :class="
              activeCancelTab === 'khach_huy'
                ? 'btn-secondary'
                : 'btn-outline-secondary'
            "
            @click="activeCancelTab = 'khach_huy'"
          >
            Khách hàng hủy ({{ tongQuan.so_don_khach_huy || 0 }})
          </button>
          <button
            type="button"
            class="btn"
            :class="
              activeCancelTab === 'nhan_vien_huy'
                ? 'btn-warning'
                : 'btn-outline-warning'
            "
            @click="activeCancelTab = 'nhan_vien_huy'"
          >
            Admin không duyệt ({{ tongQuan.so_don_nv_huy || 0 }})
          </button>
          <button
            type="button"
            class="btn"
            :class="
              activeCancelTab === 'giao_that_bai'
                ? 'btn-danger'
                : 'btn-outline-danger'
            "
            @click="activeCancelTab = 'giao_that_bai'"
          >
            Giao thất bại ({{ tongQuan.so_don_giao_that_bai || 0 }})
          </button>
        </div>
      </div>

      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0 align-middle">
            <thead class="table-light">
              <tr>
                <th style="width: 70px" class="text-center">#</th>
                <th>Lý do ghi nhận</th>
                <th style="width: 150px" class="text-center">Số lượng đơn</th>
                <th style="width: 220px">Tỷ trọng trong nhóm</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in currentLyDoList" :key="index">
                <td class="text-center fw-bold text-muted">{{ index + 1 }}</td>
                <td>{{ item.ly_do }}</td>
                <td class="text-center">
                  <span class="badge bg-dark">{{ item.so_luong }} đơn</span>
                </td>
                <td>
                  <div class="d-flex align-items-center">
                    <div class="progress flex-grow-1 me-2" style="height: 8px">
                      <div
                        class="progress-bar"
                        :class="cancelProgressBarClass"
                        role="progressbar"
                        :style="{
                          width: calcCancelPercent(item.so_luong) + '%',
                        }"
                      ></div>
                    </div>
                    <small class="fw-semibold" style="width: 48px">
                      {{ calcCancelPercent(item.so_luong) }}%
                    </small>
                  </div>
                </td>
              </tr>

              <tr v-if="currentLyDoList.length === 0">
                <td colspan="4" class="text-center py-4 text-muted">
                  Không có đơn hàng nào thuộc nhóm này trong khoảng thời gian đã
                  chọn.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import DonutChartCard from "@/components/ThongKe/DonutChartCard.vue";

const STATUS_COLOR_MAP = {
  CHO_DUYET: "#ffc107", // Vàng
  DA_XAC_NHAN: "#0dcaf0", // Xanh ngọc
  DANG_VAN_CHUYEN: "#0d6efd", // Xanh dương
  HOAN_THANH: "#198754", // Xanh lá
  KH_HUY: "#6c757d", // Xám
  NV_HUY: "#fd7e14", // Cam
  GIAO_THAT_BAI: "#dc3545", // Đỏ
};

export default {
  name: "ThongKeDonHangTab",
  components: {
    DonutChartCard,
  },
  props: {
    data: {
      type: Object,
      default: () => null,
    },
  },
  data() {
    return {
      activeCancelTab: "khach_huy",
    };
  },
  computed: {
    tongQuan() {
      return this.data?.tong_quan || {};
    },
    // Chuẩn hóa dữ liệu truyền vào DonutChartCard 1
    trangThaiChartItems() {
      const list = this.data?.theo_trang_thai_don || [];
      return list.map((item) => ({
        label: item.ten_trang_thai,
        value: item.so_luong,
        subText: `${item.ty_le_phan_tram}%`,
        color: STATUS_COLOR_MAP[item.ma_trang_thai] || "#adb5bd",
      }));
    },
    // Chuẩn hóa dữ liệu truyền vào DonutChartCard 2
    thanhToanChartItems() {
      const list = this.data?.theo_phuong_thuc_thanh_toan || [];
      return list.map((item) => ({
        label: item.phuong_thuc,
        value: item.so_luong,
        subText: `${item.ty_le_phan_tram}% • ${this.formatCurrency(item.tong_gia_tri)}`,
      }));
    },
    currentLyDoList() {
      const chiTiet = this.data?.chi_tiet_ly_do_huy || {};
      return chiTiet[this.activeCancelTab] || [];
    },
    currentCancelGroupTotal() {
      return this.currentLyDoList.reduce((sum, item) => sum + item.so_luong, 0);
    },
    cancelProgressBarClass() {
      if (this.activeCancelTab === "nhan_vien_huy") return "bg-warning";
      if (this.activeCancelTab === "giao_that_bai") return "bg-danger";
      return "bg-secondary";
    },
  },
  methods: {
    formatCurrency(value) {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value || 0);
    },
    calcCancelPercent(soLuong) {
      if (!this.currentCancelGroupTotal) return 0;
      return Number(
        ((soLuong / this.currentCancelGroupTotal) * 100).toFixed(1),
      );
    },
  },
};
</script>
