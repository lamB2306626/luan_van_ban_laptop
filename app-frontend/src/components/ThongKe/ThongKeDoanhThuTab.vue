<template>
  <div>
    <!-- ==================== 1. BIỂU ĐỒ DOANH THU - GIÁ VỐN - LỢI NHUẬN ==================== -->
    <div class="mb-4">
      <BarLineChartCard
        title="Biểu đồ Doanh thu, Giá vốn & Lợi nhuận gộp"
        subtitle="So sánh trực quan hiệu quả kinh doanh theo từng mốc thời gian"
        title-class="text-primary"
        icon="fas fa-chart-bar"
        value-format="currency"
        :height="380"
        :labels="chartLabels"
        :datasets="chartDatasets"
        empty-text="Không có đơn hàng hoàn thành nào trong khoảng thời gian này."
      >
        <!-- Nhúng 3 nút chuyển đổi Ngày / Tháng / Năm vào góc phải Header -->
        <template #header-actions>
          <div class="btn-group btn-group-sm" role="group">
            <button
              type="button"
              class="btn"
              :class="
                loaiThoiGian === 'day' ? 'btn-primary' : 'btn-outline-primary'
              "
              @click="$emit('change-group-by', 'day')"
            >
              Theo ngày
            </button>
            <button
              type="button"
              class="btn"
              :class="
                loaiThoiGian === 'month' ? 'btn-primary' : 'btn-outline-primary'
              "
              @click="$emit('change-group-by', 'month')"
            >
              Theo tháng
            </button>
            <button
              type="button"
              class="btn"
              :class="
                loaiThoiGian === 'year' ? 'btn-primary' : 'btn-outline-primary'
              "
              @click="$emit('change-group-by', 'year')"
            >
              Theo năm
            </button>
          </div>
        </template>
      </BarLineChartCard>
    </div>

    <!-- ==================== 2. CÁC CHỈ SỐ CHI PHÍ & CHIẾT KHẤU PHỤ TRỢ ==================== -->
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <div class="card shadow-sm h-100 border-0 bg-light">
          <div class="card-body">
            <div class="text-muted small fw-bold text-uppercase mb-1">
              Tổng tiền thực thu (gồm Ship)
            </div>
            <h5 class="fw-bold text-dark mb-1">
              {{ formatCurrency(tongQuan.tong_tien_thanh_toan) }}
            </h5>
            <small class="text-muted">
              Tổng giá trị khách hàng đã thanh toán cho
              {{ tongQuan.tong_don_hang || 0 }} đơn
            </small>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="card shadow-sm h-100 border-0 bg-light">
          <div class="card-body">
            <div class="text-muted small fw-bold text-uppercase mb-1">
              Tổng giá vốn hàng bán (COGS)
            </div>
            <h5 class="fw-bold text-secondary mb-1">
              {{ formatCurrency(tongQuan.tong_gia_von) }}
            </h5>
            <small class="text-muted">
              Tính theo giá nhập bình quân gia quyền từ phiếu nhập
            </small>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="card shadow-sm h-100 border-0 bg-light">
          <div class="card-body">
            <div class="text-muted small fw-bold text-uppercase mb-1">
              Chi phí Khuyến mãi & Vận chuyển
            </div>
            <div class="d-flex justify-content-between align-items-center mt-2">
              <div>
                <span class="small text-muted d-block"
                  >Giảm giá KM / Voucher:</span
                >
                <strong class="text-warning">
                  -{{ formatCurrency(tongQuan.tong_tien_giam_km) }}
                </strong>
              </div>
              <div class="text-end">
                <span class="small text-muted d-block"
                  >Phí vận chuyển (GHN):</span
                >
                <strong class="text-info">
                  {{ formatCurrency(tongQuan.tong_phi_van_chuyen) }}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 3. BẢNG SỐ LIỆU CHI TIẾT THEO MỐC THỜI GIAN ==================== -->
    <div class="card shadow-sm">
      <div class="card-header bg-white py-3">
        <h6 class="mb-0 fw-bold">
          <i class="fas fa-table me-2 text-secondary"></i>Bảng kê chi tiết Doanh
          thu & Lợi nhuận
        </h6>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover table-bordered mb-0 align-middle">
            <thead class="table-light">
              <tr>
                <th>Mốc thời gian</th>
                <th class="text-center">Số đơn hoàn thành</th>
                <th class="text-end">Doanh thu thuần</th>
                <th class="text-end">Giá vốn hàng bán</th>
                <th class="text-end">Lợi nhuận gộp</th>
                <th class="text-end">Tiền giảm KM</th>
                <th class="text-center">Tỷ suất LN</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in bieuDoList" :key="item.thoi_gian">
                <td class="fw-semibold">
                  {{ formatLabelThoiGian(item.thoi_gian) }}
                </td>
                <td class="text-center">{{ item.so_don_hang }}</td>
                <td class="text-end text-primary fw-semibold">
                  {{ formatCurrency(item.doanh_thu) }}
                </td>
                <td class="text-end text-secondary">
                  {{ formatCurrency(item.gia_von) }}
                </td>
                <td
                  class="text-end fw-bold"
                  :class="
                    item.loi_nhuan_gop >= 0 ? 'text-success' : 'text-danger'
                  "
                >
                  {{ formatCurrency(item.loi_nhuan_gop) }}
                </td>
                <td class="text-end text-warning">
                  {{ formatCurrency(item.tien_giam_km) }}
                </td>
                <td class="text-center">
                  <span
                    class="badge"
                    :class="
                      calcMargin(item.loi_nhuan_gop, item.doanh_thu) >= 15
                        ? 'bg-success'
                        : 'bg-secondary'
                    "
                  >
                    {{ calcMargin(item.loi_nhuan_gop, item.doanh_thu) }}%
                  </span>
                </td>
              </tr>

              <!-- Dòng tổng cộng cuối bảng -->
              <tr v-if="bieuDoList.length > 0" class="table-secondary fw-bold">
                <td>TỔNG CỘNG</td>
                <td class="text-center">{{ tongQuan.tong_don_hang || 0 }}</td>
                <td class="text-end text-primary">
                  {{ formatCurrency(tongQuan.tong_doanh_thu) }}
                </td>
                <td class="text-end">
                  {{ formatCurrency(tongQuan.tong_gia_von) }}
                </td>
                <td class="text-end text-success">
                  {{ formatCurrency(tongQuan.tong_loi_nhuan_gop) }}
                </td>
                <td class="text-end text-warning">
                  {{ formatCurrency(tongQuan.tong_tien_giam_km) }}
                </td>
                <td class="text-center">
                  <span class="badge bg-primary">
                    {{ tongQuan.ty_suat_loi_nhuan || 0 }}%
                  </span>
                </td>
              </tr>

              <tr v-if="bieuDoList.length === 0">
                <td colspan="7" class="text-center py-4 text-muted">
                  Chưa có dữ liệu phát sinh trong khoảng thời gian đã chọn.
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
import BarLineChartCard from "@/components/ThongKe/BarLineChartCard.vue";

export default {
  name: "ThongKeDoanhThuTab",
  components: {
    BarLineChartCard,
  },
  props: {
    data: {
      type: Object,
      default: () => null,
    },
    loaiThoiGian: {
      type: String,
      default: "day",
    },
  },
  emits: ["change-group-by"],
  computed: {
    tongQuan() {
      return this.data?.tong_quan || {};
    },
    bieuDoList() {
      return this.data?.bieu_do || [];
    },
    // Chuẩn hóa nhãn trục X cho BarLineChartCard
    chartLabels() {
      return this.bieuDoList.map((item) =>
        this.formatLabelThoiGian(item.thoi_gian),
      );
    },
    // Chuẩn hóa 3 bộ dữ liệu truyền vào BarLineChartCard
    chartDatasets() {
      if (!this.bieuDoList.length) return [];
      return [
        {
          type: "line",
          label: "Lợi nhuận gộp",
          data: this.bieuDoList.map((item) => item.loi_nhuan_gop),
          borderColor: "#198754",
          backgroundColor: "#198754",
          borderWidth: 3,
          tension: 0.3,
          pointRadius: 4,
          order: 1,
        },
        {
          type: "bar",
          label: "Doanh thu thuần",
          data: this.bieuDoList.map((item) => item.doanh_thu),
          backgroundColor: "rgba(13, 110, 253, 0.75)",
          borderRadius: 4,
          order: 2,
        },
        {
          type: "bar",
          label: "Giá vốn hàng bán",
          data: this.bieuDoList.map((item) => item.gia_von),
          backgroundColor: "rgba(108, 117, 125, 0.55)",
          borderRadius: 4,
          order: 3,
        },
      ];
    },
  },
  methods: {
    formatCurrency(value) {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value || 0);
    },

    formatLabelThoiGian(key) {
      if (!key) return "";
      const parts = key.split("-");
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      if (parts.length === 2) return `Tháng ${parts[1]}/${parts[0]}`;
      return `Năm ${key}`;
    },

    calcMargin(loiNhuan, doanhThu) {
      if (!doanhThu || doanhThu <= 0) return 0;
      return Number(((loiNhuan / doanhThu) * 100).toFixed(1));
    },
  },
};
</script>
