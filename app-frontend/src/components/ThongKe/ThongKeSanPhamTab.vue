<template>
  <div>
    <!-- ==================== 1. HÀNG TỔNG QUAN & CHỌN SỐ LƯỢNG TOP ==================== -->
    <div class="card shadow-sm border-0 bg-light mb-4">
      <div
        class="card-body d-flex flex-wrap justify-content-between align-items-center gap-3 py-3"
      >
        <div class="d-flex flex-wrap gap-4">
          <div>
            <span class="text-muted small text-uppercase fw-bold d-block">
              Tổng số Laptop đã giao
            </span>
            <h5 class="fw-bold text-primary mb-0">
              {{ tongQuan.tong_so_may_ban_ra || 0 }} máy
            </h5>
          </div>

          <div class="border-start ps-4">
            <span class="text-muted small text-uppercase fw-bold d-block">
              Doanh thu thuần sản phẩm
            </span>
            <h5 class="fw-bold text-dark mb-0">
              {{ formatCurrency(tongQuan.tong_doanh_thu_san_pham) }}
            </h5>
          </div>

          <div class="border-start ps-4">
            <span class="text-muted small text-uppercase fw-bold d-block">
              Tổng lợi nhuận gộp
            </span>
            <h5
              class="fw-bold mb-0"
              :class="
                (tongQuan.tong_loi_nhuan_san_pham || 0) >= 0
                  ? 'text-success'
                  : 'text-danger'
              "
            >
              {{ formatCurrency(tongQuan.tong_loi_nhuan_san_pham) }}
            </h5>
          </div>

          <div v-if="tongQuan.so_san_pham_ban_lo > 0" class="border-start ps-4">
            <span class="text-muted small text-uppercase fw-bold d-block">
              Cảnh báo bán lỗ
            </span>
            <h5 class="fw-bold text-danger mb-0">
              {{ tongQuan.so_san_pham_ban_lo }} dòng máy
            </h5>
          </div>
        </div>

        <!-- Nút chuyển nhanh Top 5 / Top 10 / Top 15 -->
        <div class="d-flex align-items-center">
          <span class="small fw-semibold text-muted me-2">Hiển thị:</span>
          <div class="btn-group btn-group-sm" role="group">
            <button
              type="button"
              class="btn"
              :class="limit === 5 ? 'btn-primary' : 'btn-outline-primary'"
              @click="$emit('change-limit', 5)"
            >
              Top 5
            </button>
            <button
              type="button"
              class="btn"
              :class="limit === 10 ? 'btn-primary' : 'btn-outline-primary'"
              @click="$emit('change-limit', 10)"
            >
              Top 10
            </button>
            <button
              type="button"
              class="btn"
              :class="limit === 15 ? 'btn-primary' : 'btn-outline-primary'"
              @click="$emit('change-limit', 15)"
            >
              Top 15
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 2. TOP SẢN PHẨM BÁN CHẠY (THEO SỐ LƯỢNG) ==================== -->
    <div class="mb-4">
      <BarLineChartCard
        :title="`Top ${limit} Dòng Laptop bán chạy nhất`"
        subtitle="Xếp hạng theo tổng số lượng máy đã giao thành công"
        title-class="text-primary"
        icon="fas fa-trophy"
        index-axis="x"
        value-format="number"
        unit-label="máy"
        :height="360"
        :labels="topSanPhamLabels"
        :datasets="topSanPhamDatasets"
        empty-text="Chưa có dữ liệu sản phẩm bán ra trong kỳ."
      />
    </div>

    <!-- ==================== 3. TOP SẢN PHẨM LỢI NHUẬN CAO NHẤT (THEO TIỀN LỜI) ==================== -->
    <div class="mb-4">
      <BarLineChartCard
        :title="`Top ${limit} Dòng Laptop mang lại Lợi nhuận gộp cao nhất`"
        subtitle="Đã trừ giá vốn bình quân và phân bổ giảm giá/voucher của đơn hàng"
        title-class="text-success"
        icon="fas fa-hand-holding-usd"
        index-axis="x"
        value-format="currency"
        :height="360"
        :labels="topLoiNhuanLabels"
        :datasets="topLoiNhuanDatasets"
        empty-text="Chưa có dữ liệu lợi nhuận sản phẩm trong kỳ."
      />
    </div>

    <!-- ==================== 4. BẢNG PHÂN TÍCH LỜI / LỖ CHI TIẾT TỪNG SẢN PHẨM ==================== -->
    <div class="card shadow-sm mb-4">
      <div
        class="card-header bg-white d-flex flex-wrap justify-content-between align-items-center gap-2 py-3"
      >
        <div>
          <h6 class="mb-0 fw-bold text-dark">
            <i class="fas fa-balance-scale me-2 text-primary"></i>Bảng phân tích
            Lời / Lỗ chi tiết theo từng Sản phẩm
          </h6>
          <small class="text-muted">
            Theo dõi biên lợi nhuận thực tế để phát hiện các mẫu bán lỗ hoặc lãi
            mỏng
          </small>
        </div>

        <div class="d-flex flex-wrap align-items-center gap-2">
          <!-- Ô tìm nhanh tên sản phẩm -->
          <input
            v-model="searchTenSanPham"
            type="text"
            class="form-control form-control-sm"
            style="width: 200px"
            placeholder="Tìm tên laptop..."
          />

          <!-- Nút lọc trạng thái Lời / Lỗ -->
          <div class="btn-group btn-group-sm" role="group">
            <button
              type="button"
              class="btn"
              :class="
                profitFilter === 'all' ? 'btn-dark' : 'btn-outline-secondary'
              "
              @click="profitFilter = 'all'"
            >
              Tất cả ({{ bangLoiNhuanList.length }})
            </button>
            <button
              type="button"
              class="btn"
              :class="
                profitFilter === 'profit'
                  ? 'btn-success'
                  : 'btn-outline-success'
              "
              @click="profitFilter = 'profit'"
            >
              Có lời
            </button>
            <button
              type="button"
              class="btn"
              :class="
                profitFilter === 'low_or_loss'
                  ? 'btn-danger'
                  : 'btn-outline-danger'
              "
              @click="profitFilter = 'low_or_loss'"
            >
              Lỗ / Lãi mỏng (&lt;5%)
            </button>
          </div>
        </div>
      </div>

      <div class="card-body p-0">
        <div class="table-responsive" style="max-height: 420px">
          <table
            class="table table-hover table-bordered mb-0 align-middle small"
          >
            <thead class="table-light sticky-top">
              <tr>
                <th style="width: 50px" class="text-center">#</th>
                <th>Sản phẩm & Thương hiệu</th>
                <th class="text-center" style="width: 90px">Đã bán</th>
                <th class="text-end" style="width: 145px">Doanh thu thuần</th>
                <th class="text-end" style="width: 145px">Tổng giá vốn</th>
                <th class="text-end" style="width: 150px">Lợi nhuận gộp</th>
                <th class="text-end" style="width: 135px">Lãi TB / máy</th>
                <th class="text-center" style="width: 120px">Tỷ suất LN</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(sp, idx) in filteredBangLoiNhuan"
                :key="sp.id_san_pham"
              >
                <td class="text-center fw-bold text-muted">{{ idx + 1 }}</td>
                <td>
                  <img
                    :src="getAnhSP(sp)"
                    alt="Ảnh biến thể"
                    class="rounded border object-fit-cover"
                    style="width: 55px; height: 55px"
                    @error="onImageError"
                  />
                  <div class="fw-bold text-dark">{{ sp.ten_san_pham }}</div>
                  <small class="text-muted">
                    {{ sp.thuong_hieu }} • {{ sp.danh_muc }}
                  </small>
                </td>
                <td class="text-center fw-semibold">
                  {{ sp.so_luong_ban }} máy
                </td>
                <td class="text-end text-primary fw-semibold">
                  {{ formatCurrency(sp.doanh_thu) }}
                </td>
                <td class="text-end text-secondary">
                  {{ formatCurrency(sp.gia_von) }}
                </td>
                <td
                  class="text-end fw-bold"
                  :class="
                    sp.loi_nhuan_gop >= 0 ? 'text-success' : 'text-danger'
                  "
                >
                  {{ sp.loi_nhuan_gop > 0 ? "+" : ""
                  }}{{ formatCurrency(sp.loi_nhuan_gop) }}
                </td>
                <td
                  class="text-end"
                  :class="
                    sp.loi_nhuan_trung_binh_may >= 0
                      ? 'text-dark'
                      : 'text-danger'
                  "
                >
                  {{ formatCurrency(sp.loi_nhuan_trung_binh_may) }}
                </td>
                <td class="text-center">
                  <span v-if="sp.loi_nhuan_gop < 0" class="badge bg-danger">
                    Lỗ ({{ sp.ty_suat_loi_nhuan }}%)
                  </span>
                  <span
                    v-else-if="sp.ty_suat_loi_nhuan < 5"
                    class="badge bg-warning text-dark"
                  >
                    Mỏng ({{ sp.ty_suat_loi_nhuan }}%)
                  </span>
                  <span v-else class="badge bg-success">
                    {{ sp.ty_suat_loi_nhuan }}%
                  </span>
                </td>
              </tr>

              <tr v-if="filteredBangLoiNhuan.length === 0">
                <td colspan="8" class="text-center py-4 text-muted">
                  Không tìm thấy sản phẩm nào phù hợp với điều kiện lọc hiện
                  tại.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ==================== 5. BẢNG TOP CẤU HÌNH BIẾN THỂ CỤ THỂ ==================== -->
    <div class="mb-4">
      <div class="card shadow-sm h-100">
        <div class="card-header bg-white py-3">
          <h6 class="mb-0 fw-bold text-success">
            <i class="fas fa-microchip me-2"></i>Top {{ limit }} Cấu hình Biến
            thể được chốt đơn
          </h6>
          <small class="text-muted">
            Chi tiết tới từng phiên bản CPU / RAM / SSD / GPU / Màu sắc
          </small>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive" style="max-height: 390px">
            <table class="table table-hover mb-0 align-middle small">
              <thead class="table-light sticky-top">
                <tr>
                  <th style="width: 45px" class="text-center">#</th>
                  <th>Sản phẩm & Cấu hình</th>
                  <th style="width: 90px" class="text-center">Đã bán</th>
                  <th style="width: 140px" class="text-end">Doanh thu thuần</th>
                  <th style="width: 140px" class="text-end">Lợi nhuận gộp</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(bt, idx) in topBienTheList" :key="bt.id_bien_the">
                  <td class="text-center fw-bold">
                    <span v-if="idx === 0" class="badge bg-warning text-dark"
                      >1</span
                    >
                    <span v-else-if="idx === 1" class="badge bg-secondary"
                      >2</span
                    >
                    <span v-else-if="idx === 2" class="badge bg-info text-dark"
                      >3</span
                    >
                    <span v-else>{{ idx + 1 }}</span>
                  </td>
                  <td>
                    <img
                      :src="getAnhBT(bt)"
                      alt="Ảnh biến thể"
                      class="rounded border object-fit-cover"
                      style="width: 55px; height: 55px"
                      @error="onImageError"
                    />
                    <div class="fw-bold text-dark">{{ bt.ten_san_pham }}</div>
                    <div class="text-muted" style="font-size: 0.78rem">
                      {{ bt.cau_hinh_tom_tat }}
                    </div>
                  </td>
                  <td class="text-center">
                    <span class="badge bg-primary"
                      >{{ bt.so_luong_ban }} máy</span
                    >
                  </td>
                  <td class="text-end fw-semibold text-primary">
                    {{ formatCurrency(bt.doanh_thu) }}
                  </td>
                  <td
                    class="text-end fw-bold"
                    :class="
                      (bt.loi_nhuan_gop || 0) >= 0
                        ? 'text-success'
                        : 'text-danger'
                    "
                  >
                    {{ formatCurrency(bt.loi_nhuan_gop) }}
                  </td>
                </tr>

                <tr v-if="topBienTheList.length === 0">
                  <td colspan="5" class="text-center py-5 text-muted">
                    Chưa có dữ liệu biến thể bán ra trong kỳ.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 6. THỊ PHẦN THƯƠNG HIỆU & DANH MỤC (DONUT CHARTS) ==================== -->
    <div class="row g-4 mb-4">
      <div class="col-lg-6">
        <DonutChartCard
          title="Thị phần doanh số theo Thương hiệu"
          title-class="text-primary"
          icon="fas fa-tags"
          legend-position="right"
          unit-label="máy"
          :height="240"
          :items="thuongHieuChartItems"
          empty-text="Chưa có dữ liệu thương hiệu."
        />
      </div>

      <div class="col-lg-6">
        <DonutChartCard
          title="Thị phần doanh số theo Danh mục Laptop"
          title-class="text-info"
          icon="fas fa-layer-group"
          legend-position="right"
          unit-label="máy"
          :height="240"
          :items="danhMucChartItems"
          empty-text="Chưa có dữ liệu danh mục."
        />
      </div>
    </div>

    <!-- ==================== 7. XU HƯỚNG LỰA CHỌN CẤU HÌNH PHẦN CỨNG ==================== -->
    <h6 class="fw-bold text-secondary text-uppercase mb-3 mt-2">
      <i class="fas fa-sliders-h me-2"></i>Phân tích Xu hướng Cấu hình Phần cứng
      ưa chuộng
    </h6>

    <div class="row g-4">
      <div class="col-lg-6">
        <BarLineChartCard
          title="Xu hướng chọn Dung lượng RAM"
          subtitle="Tỷ trọng khách hàng lựa chọn các mức RAM"
          title-class="text-dark"
          icon="fas fa-memory"
          value-format="number"
          unit-label="máy"
          :height="240"
          :labels="ramLabels"
          :datasets="ramDatasets"
        />
      </div>

      <div class="col-lg-6">
        <BarLineChartCard
          title="Xu hướng chọn Ổ cứng (ROM / SSD)"
          subtitle="Tỷ trọng dung lượng lưu trữ được mua nhiều nhất"
          title-class="text-dark"
          icon="fas fa-hdd"
          value-format="number"
          unit-label="máy"
          :height="240"
          :labels="romLabels"
          :datasets="romDatasets"
        />
      </div>

      <div class="col-lg-6">
        <BarLineChartCard
          title="Top Vi xử lý (CPU) bán chạy"
          subtitle="Các dòng chip xử lý được khách hàng ưa chuộng"
          title-class="text-dark"
          icon="fas fa-microchip"
          index-axis="x"
          value-format="number"
          unit-label="máy"
          :height="260"
          :labels="cpuLabels"
          :datasets="cpuDatasets"
        />
      </div>

      <div class="col-lg-6">
        <BarLineChartCard
          title="Top Card đồ họa (GPU) bán chạy"
          subtitle="Nhu cầu đồ họa tích hợp vs card rời"
          title-class="text-dark"
          icon="fas fa-tv"
          index-axis="x"
          value-format="number"
          unit-label="máy"
          :height="260"
          :labels="gpuLabels"
          :datasets="gpuDatasets"
        />
      </div>
    </div>
  </div>
</template>

<script>
import DonutChartCard from "@/components/ThongKe/DonutChartCard.vue";
import BarLineChartCard from "@/components/ThongKe/BarLineChartCard.vue";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default {
  name: "ThongKeSanPhamTab",
  components: {
    DonutChartCard,
    BarLineChartCard,
  },
  props: {
    data: {
      type: Object,
      default: () => null,
    },
    limit: {
      type: Number,
      default: 10,
    },
  },
  emits: ["change-limit"],
  data() {
    return {
      profitFilter: "all", // 'all' | 'profit' | 'low_or_loss'
      searchTenSanPham: "",
    };
  },
  computed: {
    tongQuan() {
      return this.data?.tong_quan || {};
    },
    topSanPhamList() {
      return this.data?.top_san_pham || [];
    },
    topLoiNhuanList() {
      return this.data?.top_san_pham_loi_nhuan || [];
    },
    bangLoiNhuanList() {
      return this.data?.bang_loi_nhuan_san_pham || [];
    },
    topBienTheList() {
      return this.data?.top_bien_the_cau_hinh || [];
    },
    xuHuongCauHinh() {
      return this.data?.xu_huong_cau_hinh || {};
    },

    // Lọc bảng Lời/Lỗ theo trạng thái và từ khóa tìm kiếm
    filteredBangLoiNhuan() {
      return this.bangLoiNhuanList.filter((sp) => {
        const matchKeyword =
          !this.searchTenSanPham.trim() ||
          sp.ten_san_pham
            .toLowerCase()
            .includes(this.searchTenSanPham.trim().toLowerCase());

        if (!matchKeyword) return false;

        if (this.profitFilter === "profit") {
          return sp.loi_nhuan_gop > 0;
        }
        if (this.profitFilter === "low_or_loss") {
          return sp.loi_nhuan_gop < 0 || sp.ty_suat_loi_nhuan < 5;
        }
        return true;
      });
    },

    // 1. Biểu đồ Top Dòng Laptop bán chạy (Số lượng)
    topSanPhamLabels() {
      return this.topSanPhamList.map((sp) => sp.ten_san_pham);
    },
    topSanPhamDatasets() {
      if (!this.topSanPhamList.length) return [];
      return [
        {
          label: "Số lượng bán",
          data: this.topSanPhamList.map((sp) => sp.so_luong_ban),
          backgroundColor: "rgba(13, 110, 253, 0.8)",
          borderRadius: 4,
        },
      ];
    },

    // 2. Biểu đồ Top Dòng Laptop Lợi nhuận cao nhất (VNĐ)
    topLoiNhuanLabels() {
      return this.topLoiNhuanList.map((sp) => sp.ten_san_pham);
    },
    topLoiNhuanDatasets() {
      if (!this.topLoiNhuanList.length) return [];
      return [
        {
          label: "Lợi nhuận gộp",
          data: this.topLoiNhuanList.map((sp) => sp.loi_nhuan_gop),
          backgroundColor: this.topLoiNhuanList.map((sp) =>
            sp.loi_nhuan_gop >= 0
              ? "rgba(25, 135, 84, 0.82)"
              : "rgba(220, 53, 69, 0.82)",
          ),
          borderRadius: 4,
        },
      ];
    },

    // 3. Dữ liệu Donut Thương hiệu
    thuongHieuChartItems() {
      const list = this.data?.thi_phan_thuong_hieu || [];
      return list.map((item) => ({
        label: item.ten_thuong_hieu,
        value: item.so_luong_ban,
        subText: `${item.ty_le_so_luong}%`,
      }));
    },

    // 4. Dữ liệu Donut Danh mục
    danhMucChartItems() {
      const list = this.data?.thi_phan_danh_muc || [];
      return list.map((item) => ({
        label: item.ten_danh_muc,
        value: item.so_luong_ban,
        subText: `${item.ty_le_so_luong}%`,
      }));
    },

    // 5. Dữ liệu biểu đồ RAM
    ramLabels() {
      return (this.xuHuongCauHinh.ram || []).map((i) => i.dung_luong_ram);
    },
    ramDatasets() {
      const list = this.xuHuongCauHinh.ram || [];
      if (!list.length) return [];
      return [
        {
          label: "Số máy bán ra",
          data: list.map((i) => i.so_luong_ban),
          backgroundColor: "rgba(25, 135, 84, 0.8)",
          borderRadius: 4,
        },
      ];
    },

    // 6. Dữ liệu biểu đồ SSD (ROM)
    romLabels() {
      return (this.xuHuongCauHinh.rom || []).map((i) => i.dung_luong_rom);
    },
    romDatasets() {
      const list = this.xuHuongCauHinh.rom || [];
      if (!list.length) return [];
      return [
        {
          label: "Số máy bán ra",
          data: list.map((i) => i.so_luong_ban),
          backgroundColor: "rgba(13, 202, 240, 0.85)",
          borderRadius: 4,
        },
      ];
    },

    // 7. Dữ liệu biểu đồ CPU
    cpuLabels() {
      return (this.xuHuongCauHinh.cpu || []).map((i) => i.ten_cpu);
    },
    cpuDatasets() {
      const list = this.xuHuongCauHinh.cpu || [];
      if (!list.length) return [];
      return [
        {
          label: "Số máy bán ra",
          data: list.map((i) => i.so_luong_ban),
          backgroundColor: "rgba(111, 66, 193, 0.8)",
          borderRadius: 4,
        },
      ];
    },

    // 8. Dữ liệu biểu đồ GPU
    gpuLabels() {
      return (this.xuHuongCauHinh.gpu || []).map((i) => i.ten_gpu);
    },
    gpuDatasets() {
      const list = this.xuHuongCauHinh.gpu || [];
      if (!list.length) return [];
      return [
        {
          label: "Số máy bán ra",
          data: list.map((i) => i.so_luong_ban),
          backgroundColor: "rgba(253, 126, 20, 0.8)",
          borderRadius: 4,
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

    // // Lấy ảnh của sản phẩm
    getAnhSP(item) {
      const anhSanPham = item?.anh_dai_dien_sp;
      if (anhSanPham) {
        return `${API_URL}/uploads/AnhSanPham/${anhSanPham}`;
      }

      // Trả về ảnh mặc định nếu không có đường dẫn ảnh
      return `${API_URL}/images/placeholder-laptop.png`;
    },

    // Lấy ảnh của biến thể sản phẩm
    getAnhBT(item) {
      const anhBienThe = item?.anh_dai_dien_bt;
      if (anhBienThe) {
        return `${API_URL}/uploads/BienThe/${anhBienThe}`;
      }

      const anhSanPham = item?.anh_dai_dien_sp;
      if (anhSanPham) {
        return `${API_URL}/uploads/AnhSanPham/${anhSanPham}`;
      }

      // Trả về ảnh mặc định nếu không có đường dẫn ảnh
      return `${API_URL}/images/placeholder-laptop.png`;
    },
  },
};
</script>
