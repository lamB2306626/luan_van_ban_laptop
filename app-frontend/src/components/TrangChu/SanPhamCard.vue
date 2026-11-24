<template>
  <div class="card product-card border-0 shadow-sm rounded-3 p-3 mb-4">
    <!-- KHỐI NỘI DUNG CHÍNH (Nằm gọn ở trên) -->
    <div>
      <!-- Header: Thương hiệu + Nút yêu thích -->
      <div class="d-flex justify-content-between align-items-center px-1 mb-1">
        <div
          class="text-secondary small fw-medium text-truncate me-2"
          style="font-size: 12px"
        >
          <span>{{ sanPham.thuong_hieu?.ten_thuong_hieu || "ASUS" }}</span>
          <span class="mx-1">•</span>
          <span>{{ sanPham.danh_muc?.ten_danh_muc || "Gaming" }}</span>
        </div>

        <div
          v-if="sanPham.id"
          class="like-badge-wrapper flex-shrink-0"
          style="z-index: 6"
          @click.stop
        >
          <LikeButton
            :san-pham-id="sanPham.id"
            :so-luot-yeu-thich="sanPham.tong_luot_yeu_thich"
            @update:so-luot-yeu-thich="
              (val) => (sanPham.tong_luot_yeu_thich = val)
            "
          />
        </div>
      </div>

      <!-- Khung ảnh sản phẩm -->
      <div
        class="product-img-wrapper position-relative rounded-3 p-2 text-center mb-2"
      >
        <div
          v-if="danhSachTenKhuyenMai.length > 0"
          class="position-absolute top-0 start-0 m-2 d-flex flex-column gap-1 align-items-start"
          style="z-index: 5; max-width: 80%"
        >
          <span
            v-for="(tenKM, index) in danhSachTenKhuyenMai.slice(0, 2)"
            :key="index"
            class="promo-badge-item"
            :title="`Khuyến mãi: ${tenKM}`"
          >
            <i class="fas fa-gift mr-1 text-primary"></i>{{ tenKM }}
          </span>
        </div>

        <img
          :src="getAnh(sanPham)"
          class="img-fluid object-fit-contain my-1"
          :alt="sanPham.ten_san_pham"
          style="height: 150px; max-width: 100%"
        />
      </div>

      <!-- Nội dung thông tin sản phẩm -->
      <div class="card-body p-0">
        <!-- Tên sản phẩm -->
        <h6
          class="card-title product-title fw-bold text-dark mb-1 line-clamp-2"
          :title="sanPham.ten_san_pham"
          @click="$emit('view-detail', sanPham.id)"
          style="cursor: pointer"
        >
          {{ sanPham.ten_san_pham }}
        </h6>

        ĐIỂM SỐ: {{ sanPham.score }}

        <!-- Đánh giá và số sao -->
        <div
          class="d-flex align-items-center gap-1 mb-1"
          style="font-size: 12px"
        >
          <i class="fas fa-star text-warning"></i>
          <span class="fw-bold text-warning">
            {{ sanPham.thong_ke_danh_gia?.trung_binh_sao || "4.8" }}
          </span>
          <span class="text-muted">
            ({{ sanPham.thong_ke_danh_gia?.tong_so_danh_gia || 0 }} đánh giá)
          </span>
        </div>

        <!-- CÁC THẺ CẤU HÌNH -->
        <div class="text-secondary small mb-1" style="font-size: 11.5px">
          Cấu hình từ:
        </div>
        <div class="spec-grid mb-2" v-if="sanPham.bien_the_dai_dien">
          <div class="spec-item">
            <i class="fas fa-microchip text-primary"></i>
            <span class="spec-text">{{
              sanPham.bien_the_dai_dien.cpu?.ten_cpu || "N/A"
            }}</span>
          </div>
          <div class="spec-item">
            <i class="fas fa-gamepad text-success"></i>
            <span class="spec-text">{{
              sanPham.bien_the_dai_dien.gpu?.ten_gpu || "N/A"
            }}</span>
          </div>
          <div class="spec-item">
            <i class="fas fa-memory text-warning"></i>
            <span class="spec-text">{{
              sanPham.bien_the_dai_dien.dung_luong_ram?.dung_luong_ram || "N/A"
            }}</span>
          </div>
          <div class="spec-item">
            <i class="fas fa-hdd text-info"></i>
            <span class="spec-text">{{
              sanPham.bien_the_dai_dien.dung_luong_rom?.dung_luong_rom || "N/A"
            }}</span>
          </div>
        </div>

        <!-- Khung Giá sản phẩm -->
        <div class="mt-1">
          <div class="text-secondary small mb-0" style="font-size: 11.5px">
            Giá từ:
          </div>
          <div class="d-flex align-items-baseline gap-2 flex-wrap">
            <span class="price-highlight">
              {{
                formatCurrency(
                  sanPham.bien_the_dai_dien?.don_gia_ap_dung ||
                    sanPham.bien_the_dai_dien?.gia,
                )
              }}
            </span>
            <span
              v-if="
                sanPham.bien_the_dai_dien?.gia >
                sanPham.bien_the_dai_dien?.don_gia_ap_dung
              "
              class="price-old ml-1"
            >
              {{ formatCurrency(sanPham.bien_the_dai_dien.gia) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 2 NÚT HÀNH ĐỘNG (Dùng mt-auto để bám sát nội dung phía trên, không bị khoảng trắng thừa) -->
    <div class="product-actions mt-1 pt-2">
      <button
        @click="$emit('view-detail', sanPham.id)"
        class="btn btn-outline-secondary action-btn"
      >
        Chi tiết
      </button>
      <button
        v-if="sanPham.bien_the_dai_dien.so_luong >= 1"
        @click="$emit('buy-now', sanPham.bien_the_dai_dien)"
        class="btn btn-primary action-btn"
      >
        Mua ngay
      </button>

      <button v-else disabled class="btn btn-secondary action-btn">
        Hết hàng
      </button>
    </div>
  </div>
</template>

<script>
import LikeButton from "@/components/ChiTietSanPham/LikeButton.vue";
const API_URL = import.meta.env.VITE_API_BASE_URL;

export default {
  name: "SanPhamCard",
  components: {
    LikeButton,
  },
  data() {
    return {
      API_URL,
    };
  },
  props: {
    sanPham: {
      type: Object,
      required: true,
    },
  },
  computed: {
    danhSachTenKhuyenMai() {
      const danhSachKM = this.sanPham?.top_1_khuyen_mai;

      if (!Array.isArray(danhSachKM) || danhSachKM.length === 0) {
        return [];
      }

      const tenKhuyenMais = danhSachKM
        .map((item) => item?.dot_khuyen_mai?.ten_dot)
        .filter((ten) => !!ten);

      return [...new Set(tenKhuyenMais)];
    },

    giaGoc() {
      return this.sanPham?.bien_the_dai_dien?.gia || 0;
    },
    giaHienTai() {
      return this.sanPham?.bien_the_dai_dien?.don_gia_ap_dung || this.giaGoc;
    },
    phanTramGiamGia() {
      if (this.giaGoc > this.giaHienTai && this.giaGoc > 0) {
        return Math.round(
          ((this.giaGoc - this.giaHienTai) / this.giaGoc) * 100,
        );
      }
      return 0;
    },
  },
  methods: {
    // Lấy ảnh của sản phẩm (ưu tiên biến thể đại diện, nếu không có thì lấy ảnh chính của sản phẩm)
    getAnh(sp) {
      // 1. Kiểm tra xem biến thể đại diện có ảnh hay không
      const anhBienThe = sp.bien_the_dai_dien?.duong_dan_anh;
      if (anhBienThe) {
        return `${API_URL}/uploads/BienThe/${anhBienThe}`;
      }

      // 2. Nếu không có ảnh biến thể, tìm ảnh chính trong mảng anh_san_pham của sản phẩm
      const anhChinhSanPham =
        sp.anh_san_pham?.find((img) => img.la_anh_chinh)?.duong_dan_anh ||
        sp.anh_san_pham?.[0]?.duong_dan_anh;

      if (anhChinhSanPham) {
        return `${API_URL}/uploads/AnhSanPham/${anhChinhSanPham}`;
      }

      // 3. Nếu cả hai đều không có, trả về ảnh mặc định
      return `${API_URL}/images/placeholder-laptop.png`;
    },

    formatCurrency(value) {
      if (!value || isNaN(value)) return "Liên hệ";
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value);
    },
  },
};
</script>

<style scoped>
.product-card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  background-color: #ffffff;
  user-select: none;
  /* ĐẢM BẢO KHÔNG DÙNG height: 100% Ở ĐÂY ĐỂ TRÁNH BỊ KÉO GIÃN THỪA */
}

.product-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08) !important;
}

.product-img-wrapper {
  background-color: #f8f9fa;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.3;
  height: 2.6rem; /* Cố định chuẩn 2 dòng để các card đều nhau */
}

.promo-badge-item {
  background-color: #e0f2fe;
  color: #0369a1;
  font-size: 10.5px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  border: 1px solid #bae6fd;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.spec-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
}

.spec-item {
  background-color: #f1f5f9;
  border-radius: 4px;
  padding: 4px 6px;
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
}

.spec-item i {
  font-size: 12px;
  flex-shrink: 0;
}

.spec-text {
  font-size: 11.5px;
  font-weight: 500;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.price-highlight {
  color: #c81e1e;
  font-size: 1.15rem;
  font-weight: 500;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.price-old {
  color: #8c8c8c;
  text-decoration: line-through;
  font-size: 0.825rem;
  font-weight: 400;
}

/* Khối 2 nút bấm sẽ tự động nằm ngay dưới giá tiền với khoảng cách mt-3 vừa đẹp */
.product-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  font-size: 12.5px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 6px;
  transition: all 0.2s ease-in-out;
}

.action-btn.btn-primary {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.action-btn.btn-outline-secondary {
  color: #495057;
  border-color: #ced4da;
}
</style>
