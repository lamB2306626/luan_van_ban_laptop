<template>
  <div>
    <!-- ==================== 1. THANH TÙY CHỈNH NGƯỠNG CẢNH BÁO KHO ==================== -->
    <div class="card shadow-sm border-0 bg-light mb-4">
      <div
        class="card-body d-flex flex-wrap justify-content-between align-items-center gap-3 py-3"
      >
        <div class="d-flex flex-wrap align-items-center gap-3">
          <div>
            <label class="form-label small fw-bold text-muted mb-1 d-block">
              Ngưỡng cảnh báo sắp hết:
            </label>
            <select
              :value="nguongSapHet"
              class="form-select form-select-sm form-control"
              style="width: 170px"
              @change="
                $emit('change-filter', {
                  nguong_sap_het: Number($event.target.value),
                  so_ngay_ton_dong: soNgayTonDong,
                })
              "
            >
              <option :value="3">Dưới 3 máy</option>
              <option :value="5">Dưới 5 máy (Mặc định)</option>
              <option :value="10">Dưới 10 máy</option>
            </select>
          </div>

          <div>
            <label class="form-label small fw-bold text-muted mb-1 d-block">
              Thời gian xét tồn đọng:
            </label>
            <select
              :value="soNgayTonDong"
              class="form-select form-select-sm form-control"
              style="width: 190px"
              @change="
                $emit('change-filter', {
                  nguong_sap_het: nguongSapHet,
                  so_ngay_ton_dong: Number($event.target.value),
                })
              "
            >
              <!-- <option :value="1">1 ngày không có đơn</option> -->
              <option :value="1">1 ngày không có đơn</option>
              <option :value="2">2 ngày không có đơn</option>
              <option :value="3">3 ngày không có đơn</option>
              <option :value="30">30 ngày không có đơn</option>
              <option :value="45">45 ngày không có đơn</option>
              <option :value="60">60 ngày không có đơn</option>
            </select>
          </div>
        </div>

        <div class="text-end small text-muted">
          <i class="fas fa-info-circle me-1 text-primary"></i>
          Dữ liệu tồn kho được tính tại thời điểm hiện tại trên các sản phẩm
          đang kinh doanh.
        </div>
      </div>
    </div>

    <!-- ==================== 2. HÀNG 4 THẺ CHỈ SỐ TỒN KHO ==================== -->
    <div class="row g-3 mb-4">
      <div class="col-xl-3 col-md-6">
        <div class="card border-start border-primary border-4 shadow-sm h-100">
          <div class="card-body">
            <div class="text-uppercase small fw-bold text-primary mb-1">
              Tổng giá trị vốn tồn kho
            </div>
            <h5 class="fw-bold mb-1">
              {{ formatCurrency(tongQuan.tong_gia_tri_ton_von) }}
            </h5>
            <small class="text-muted">
              Tổng tồn:
              <strong>{{ tongQuan.tong_so_luong_ton || 0 }}</strong> máy ({{
                tongQuan.tong_bien_the_dang_quan_ly || 0
              }}
              cấu hình)
            </small>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-md-6">
        <div class="card border-start border-info border-4 shadow-sm h-100">
          <div class="card-body">
            <div class="text-uppercase small fw-bold text-info mb-1">
              Giá trị bán lẻ ước tính
            </div>
            <h5 class="fw-bold mb-1">
              {{ formatCurrency(tongQuan.tong_gia_tri_ton_ban_le) }}
            </h5>
            <small class="text-muted">
              Tính theo giá niêm yết hiện tại của toàn bộ kho
            </small>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-md-6">
        <div class="card border-start border-danger border-4 shadow-sm h-100">
          <div class="card-body">
            <div class="text-uppercase small fw-bold text-danger mb-1">
              Cảnh báo thiếu hàng
            </div>
            <h5 class="fw-bold mb-1 text-danger">
              {{ tongQuan.so_bien_the_sap_het || 0 }} cấu hình
            </h5>
            <small class="text-muted">
              Trong đó có
              <strong class="text-danger">{{
                tongQuan.so_bien_the_het_hang || 0
              }}</strong>
              cấu hình đã hết sạch (0 máy)
            </small>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-md-6">
        <div class="card border-start border-warning border-4 shadow-sm h-100">
          <div class="card-body">
            <div class="text-uppercase small fw-bold text-warning mb-1">
              Vốn đọng hàng bán chậm
            </div>
            <h5 class="fw-bold mb-1 text-dark">
              {{ formatCurrency(tongQuan.tong_von_ton_dong) }}
            </h5>
            <small class="text-muted">
              Thuộc
              <strong>{{ tongQuan.so_bien_the_ton_dong || 0 }}</strong> cấu hình
              tồn đọng trên {{ soNgayTonDong }} ngày
            </small>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 3. PHÂN BỔ VỐN TỒN KHO THEO THƯƠNG HIỆU ==================== -->
    <div class="row g-4 mb-4">
      <div class="col-lg-6">
        <DonutChartCard
          title="Cơ cấu Giá trị vốn tồn kho theo Thương hiệu"
          title-class="text-primary"
          icon="fas fa-warehouse"
          legend-position="right"
          unit-label="VNĐ"
          :height="240"
          :items="thuongHieuTonKhoItems"
          empty-text="Chưa có dữ liệu tồn kho theo thương hiệu."
        />
      </div>

      <div class="col-lg-6">
        <div class="card shadow-sm h-100">
          <div class="card-header bg-white py-3">
            <h6 class="mb-0 fw-bold text-secondary">
              <i class="fas fa-list-ol me-2"></i>Chi tiết Tồn kho theo Hãng
            </h6>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive" style="max-height: 290px">
              <table class="table table-hover mb-0 align-middle small">
                <thead class="table-light sticky-top">
                  <tr>
                    <th>Thương hiệu</th>
                    <th class="text-center">Số lượng tồn</th>
                    <th class="text-end">Giá trị vốn</th>
                    <th class="text-center">Tỷ trọng vốn</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="th in tonKhoTheoThuongHieuList"
                    :key="th.ten_thuong_hieu"
                  >
                    <td class="fw-bold">{{ th.ten_thuong_hieu }}</td>
                    <td class="text-center">{{ th.so_luong_ton }} máy</td>
                    <td class="text-end fw-semibold text-primary">
                      {{ formatCurrency(th.gia_tri_von) }}
                    </td>
                    <td class="text-center">
                      <span class="badge bg-secondary"
                        >{{ th.ty_le_von }}%</span
                      >
                    </td>
                  </tr>
                  <tr v-if="tonKhoTheoThuongHieuList.length === 0">
                    <td colspan="4" class="text-center py-4 text-muted">
                      Không có dữ liệu tồn kho.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 4. BẢNG CẢNH BÁO SẮP HẾT HÀNG (LOW STOCK) ==================== -->
    <div class="card shadow-sm mb-4 border-danger border-opacity-25">
      <div
        class="card-header bg-white d-flex flex-wrap justify-content-between align-items-center py-3"
      >
        <div>
          <h6 class="mb-0 fw-bold text-danger">
            <i class="fas fa-exclamation-triangle me-2"></i>Cảnh báo Sắp hết
            hàng & Cần nhập thêm
          </h6>
          <small class="text-muted">
            Ưu tiên hiển thị các cấu hình có sức bán cao trong 30 ngày qua nhưng
            tồn kho dưới {{ nguongSapHet }} máy
          </small>
        </div>

        <button
          class="btn btn-sm btn-outline-danger mt-2 mt-sm-0"
          @click="goToNhapKho"
        >
          <i class="fas fa-plus-circle me-1"></i> Tạo phiếu nhập kho
        </button>
      </div>

      <div class="card-body p-0">
        <div class="table-responsive">
          <table
            class="table table-hover table-bordered mb-0 align-middle small"
          >
            <thead class="table-light">
              <tr>
                <th style="width: 90px">Mã BT</th>
                <th>Sản phẩm & Cấu hình</th>
                <th class="text-center" style="width: 110px">Tồn kho</th>
                <th class="text-center" style="width: 120px">Đã bán (30d)</th>
                <th class="text-end" style="width: 135px">Giá nhập TB</th>
                <th class="text-center" style="width: 140px">
                  Mức độ cảnh báo
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in canhBaoSapHetList" :key="item.id_bien_the">
                <td class="fw-bold text-muted">{{ item.id_bien_the }}</td>
                <td>
                  <img
                    :src="getAnh(item)"
                    alt="Ảnh biến thể"
                    class="rounded border object-fit-cover"
                    style="width: 55px; height: 55px"
                    @error="onImageError"
                  />
                  <div class="fw-bold text-dark">
                    {{ item.ten_san_pham }}
                    <span class="badge bg-light text-dark border ms-1">{{
                      item.thuong_hieu
                    }}</span>
                  </div>
                  <div class="text-muted" style="font-size: 0.78rem">
                    {{ item.cau_hinh_tom_tat }}
                  </div>
                </td>
                <td
                  class="text-center fw-bold fs-6"
                  :class="item.so_luong_ton === 0 ? 'text-danger' : 'text-dark'"
                >
                  {{ item.so_luong_ton }}
                </td>
                <td class="text-center">
                  <span class="badge bg-info text-dark"
                    >{{ item.da_ban_30_ngay }} máy</span
                  >
                </td>
                <td class="text-end">{{ formatCurrency(item.gia_nhap_tb) }}</td>
                <td class="text-center">
                  <span
                    v-if="item.muc_do_canh_bao === 'HET_HANG'"
                    class="badge bg-danger"
                  >
                    <i class="fas fa-ban me-1"></i>Hết hàng
                  </span>
                  <span
                    v-else-if="item.muc_do_canh_bao === 'KHAN_CAP'"
                    class="badge bg-danger bg-opacity-75"
                  >
                    <i class="fas fa-fire me-1"></i>Khẩn cấp
                  </span>
                  <span v-else class="badge bg-warning text-dark">
                    <i class="fas fa-exclamation me-1"></i>Sắp hết
                  </span>
                </td>
              </tr>

              <tr v-if="canhBaoSapHetList.length === 0">
                <td
                  colspan="6"
                  class="text-center py-4 text-success fw-semibold"
                >
                  <i class="fas fa-check-circle me-1"></i>
                  Tất cả cấu hình đang kinh doanh đều có số lượng tồn kho ở mức
                  an toàn!
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ==================== 5. BẢNG CẢNH BÁO HÀNG TỒN ĐỌNG (DEAD STOCK) ==================== -->
    <div class="card shadow-sm border-warning border-opacity-50">
      <div class="card-header bg-white py-3">
        <h6 class="mb-0 fw-bold text-warning">
          <i class="fas fa-box-open me-2"></i>Danh sách Hàng tồn đọng / Bán chậm
          (Dead Stock)
        </h6>
        <small class="text-muted">
          Các cấu hình nhập về trên {{ soNgayTonDong }} ngày nhưng chưa phát
          sinh đơn hàng nào trong kỳ (sắp xếp theo giá trị vốn đọng cao nhất)
        </small>
      </div>

      <div class="card-body p-0">
        <div class="table-responsive">
          <table
            class="table table-hover table-bordered mb-0 align-middle small"
          >
            <thead class="table-light">
              <tr>
                <th style="width: 90px">Mã BT</th>
                <th>Sản phẩm & Cấu hình</th>
                <th class="text-center" style="width: 100px">SL Tồn</th>
                <th class="text-end" style="width: 135px">Giá nhập TB</th>
                <th class="text-end" style="width: 145px">Tổng vốn đọng</th>
                <th class="text-center" style="width: 150px">Tình trạng</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in hangTonDongList" :key="item.id_bien_the">
                <td class="fw-bold text-muted">{{ item.id_bien_the }}</td>
                <td>
                  <img
                    :src="getAnh(item)"
                    alt="Ảnh biến thể"
                    class="rounded border object-fit-cover"
                    style="width: 55px; height: 55px"
                    @error="onImageError"
                  />
                  <div class="fw-bold text-dark">
                    {{ item.ten_san_pham }}
                    <span class="badge bg-light text-dark border ms-1">{{
                      item.thuong_hieu
                    }}</span>
                  </div>
                  <div class="text-muted" style="font-size: 0.78rem">
                    {{ item.cau_hinh_tom_tat }}
                  </div>
                </td>
                <td class="text-center fw-bold">{{ item.so_luong_ton }} máy</td>
                <td class="text-end">{{ formatCurrency(item.gia_nhap_tb) }}</td>
                <td class="text-end fw-bold text-danger">
                  {{ formatCurrency(item.tong_von_dong) }}
                </td>
                <td class="text-center">
                  <span class="badge bg-warning text-dark">
                    Tồn > {{ item.so_ngay_khong_phat_sinh_don }} ngày
                  </span>
                </td>
              </tr>

              <tr v-if="hangTonDongList.length === 0">
                <td colspan="6" class="text-center py-4 text-muted">
                  Không ghi nhận mẫu laptop nào bị tồn đọng quá
                  {{ soNgayTonDong }} ngày.
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

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default {
  name: "ThongKeTonKhoTab",
  components: {
    DonutChartCard,
  },
  props: {
    data: {
      type: Object,
      default: () => null,
    },
    nguongSapHet: {
      type: Number,
      default: 5,
    },
    soNgayTonDong: {
      type: Number,
      default: 45,
    },
  },
  emits: ["change-filter"],
  computed: {
    tongQuan() {
      return this.data?.tong_quan || {};
    },
    tonKhoTheoThuongHieuList() {
      return this.data?.ton_kho_theo_thuong_hieu || [];
    },
    canhBaoSapHetList() {
      return this.data?.canh_bao_sap_het_hang || [];
    },
    hangTonDongList() {
      return this.data?.hang_ton_dong || [];
    },
    thuongHieuTonKhoItems() {
      return this.tonKhoTheoThuongHieuList.map((item) => ({
        label: item.ten_thuong_hieu,
        value: item.gia_tri_von,
        subText: `${item.ty_le_von}% • ${item.so_luong_ton} máy`,
      }));
    },
  },
  methods: {
    formatCurrency(value) {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value || 0);
    },

    // Điều hướng nhanh sang trang tạo Phiếu nhập (bạn chỉnh lại name route cho khớp router bên bạn nhé)
    goToNhapKho() {
      this.$router.push({ name: "phieu-nhap.add" }).catch(() => {
        alert("Vui lòng điều hướng tới trang Quản lý Phiếu nhập kho!");
      });
    },

    // Lấy ảnh của biến thể sản phẩm
    getAnh(item) {
      const anhBienThe = item?.duong_dan_anh_bt;
      if (anhBienThe) {
        return `${API_URL}/uploads/BienThe/${anhBienThe}`;
      }

      const anhSanPham = item?.duong_dan_anh_sp;
      if (anhSanPham) {
        return `${API_URL}/uploads/AnhSanPham/${anhSanPham}`;
      }

      // Trả về ảnh mặc định nếu không có đường dẫn ảnh
      return `${API_URL}/images/placeholder-laptop.png`;
    },
  },
};
</script>
