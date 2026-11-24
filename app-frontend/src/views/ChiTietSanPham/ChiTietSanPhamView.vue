<template>
  <!-- <div class="container-fluid px-4 my-4" style="max-width: 94%"> -->
  <div class="container my-4">
    <!-- State: Loading -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Đang tải...</span>
      </div>
      <p class="mt-2 text-muted">Đang tải thông tin sản phẩm...</p>
    </div>

    <!-- State: Error / Not Found -->
    <div v-else-if="!sanPham" class="text-center py-5">
      <i class="fas fa-exclamation-circle text-warning fs-1 mb-3"></i>
      <h4>Không tìm thấy sản phẩm!</h4>
      <p class="text-muted">Sản phẩm không tồn tại.</p>
      <button class="btn btn-primary" @click="$router.go(-1)">
        <i class="fas fa-arrow-left me-1"></i> Quay lại
      </button>
    </div>

    <!-- State: Main Content -->
    <div v-else class="product-detail-container">
      <!-- Breadcrumb chỉ đường -->
      <nav aria-label="breadcrumb" class="mb-3">
        <ol class="breadcrumb custom-breadcrumb bg-transparent p-0 mb-0">
          <!-- Trang chủ có icon nhà -->
          <li class="breadcrumb-item">
            <a href="#" class="text-decoration-none text-secondary">
              <i class="fas fa-home mr-1"></i>Trang chủ
            </a>
          </li>
          <!-- Danh mục -->
          <li class="breadcrumb-item">
            <a href="#" class="text-decoration-none text-secondary">
              {{ sanPham.danh_muc?.ten_danh_muc }}
            </a>
          </li>
          <!-- Tên sản phẩm hiện tại -->
          <li
            class="breadcrumb-item active fw-bold text-dark"
            aria-current="page"
          >
            {{ sanPham.ten_san_pham }}
          </li>
        </ol>
      </nav>

      <div class="row g-4">
        <!-- 1. BÊN TRÁI: BỘ SƯU TẬP HÌNH ẢNH SẢN PHẨM (san-pham-id giúp ô yêu thích trong HinhAnhSanPham có thể hoạt động)-->
        <div class="col-lg-5">
          <HinhAnhSanPham
            :san-pham-id="sanPham.id"
            :ten-san-pham="sanPham.ten_san_pham"
            :anh-mac-dinh="anhHienTai"
            :danh-sach-anh="sanPham.anh_san_pham"
            :so-luot-yeu-thich="sanPham.tong_luot_yeu_thich"
            @update:so-luot-yeu-thich="
              (val) => (sanPham.tong_luot_yeu_thich = val)
            "
          />
        </div>

        <!-- 2. BÊN PHẢI: THÔNG TIN TỔNG QUAN -->
        <div class="col-lg-7">
          <!-- THÔNG TIN TỔNG QUAN PHÍA TRÊN (ĐÃ CHỈNH GIỐNG MẪU) -->
          <div class="card border-0 shadow-sm p-4 h-100">
            <!-- 1. Dải Badge thông tin trên cùng (Thương hiệu, Danh mục, Nhà cung cấp, Trạng thái) -->
            <div class="d-flex align-items-center flex-wrap gap-2 mb-2">
              <span class="badge bg-primary text-white fw-bold px-2 py-1 mr-2">
                {{ sanPham.thuong_hieu?.ten_thuong_hieu || "MacBook" }}
              </span>
              <span class="badge bg-light text-secondary border px-2 py-1">
                {{ sanPham.danh_muc?.ten_danh_muc || "Văn phòng" }}
              </span>
            </div>

            <!-- 2. Tên sản phẩm chính -->
            <h2 class="fw-bold text-dark mb-2 product-title-custom">
              {{ sanPham.ten_san_pham }}
            </h2>

            <!-- 3. Khu vực Đánh giá sao & các liên kết phụ (Viết đánh giá, Hỏi đáp kỹ thuật) -->
            <div
              class="d-flex align-items-center flex-wrap gap-2 mb-3 text-muted small"
            >
              <div class="text-warning d-flex align-items-center gap-1">
                <template v-for="i in 5" :key="i">
                  <i
                    class="fas fa-star"
                    :class="
                      i <=
                      Math.round(sanPham.thong_ke_danh_gia?.trung_binh_sao || 5)
                        ? 'text-warning'
                        : 'text-muted'
                    "
                  ></i>
                </template>
              </div>
              <span class="fw-bold text-dark">
                {{ sanPham.thong_ke_danh_gia?.trung_binh_sao || "5.0" }}
              </span>
              <span class="text-muted">
                ({{ sanPham.thong_ke_danh_gia?.tong_so_danh_gia || 0 }} đánh
                giá)
              </span>
            </div>

            <!-- KHU VỰC KHUYẾN MÃI (Giữ nguyên của bạn) -->
            <div
              v-if="danhSachKhuyenMai.length > 0"
              class="promotion-box p-2 px-3 border border-primary-subtle rounded bg-subtle mb-3"
            >
              <div
                v-for="km in danhSachKhuyenMai"
                :key="km.id"
                class="d-flex justify-content-between align-items-center flex-wrap gap-2"
              >
                <!-- Bên trái: Icon, Tên đợt -->
                <div class="d-flex align-items-center gap-2">
                  <span
                    class="badge bg-primary text-white p-2 rounded-circle d-flex align-items-center justify-content-center"
                    style="width: 28px; height: 28px"
                  >
                    <i class="fas fa-fire fs-7"></i>
                  </span>
                  <span class="fw-bold text-primary fs-7 ml-1"
                    ><strong>{{ km.ten_dot }}</strong></span
                  >
                </div>

                <!-- Bên phải: Thời gian áp dụng -->
                <div class="text-muted small">
                  <i class="far fa-clock mr-1 text-primary"></i>
                  <span
                    >Áp dụng từ: <strong>{{ km.ngay_bat_dau }}</strong> đến
                    <strong>{{ km.ngay_ket_thuc }}</strong></span
                  >
                </div>
              </div>
            </div>
            <!-- Chỗ trống cho Danh sách biến thể -->
            <BienTheSelector
              :danh-sach-bien-the="sanPham.bien_the"
              :default-variant-id="bienTheDaiDien"
              @select-variant="onSelectVariant"
            />

            <!-- Nút thao tác -->
            <NutThaoTacMuaHang
              :bien-the-selected="bienTheSelected"
              @lien-he="onLienHe"
              @them-vao-gio="onThemVaoGio"
              @mua-ngay="onMuaNgay"
            />
          </div>
        </div>
      </div>

      <!-- 3. PHẦN DƯỚI: MÔ TẢ VÀ THÔNG SỐ KỸ THUẬT CHI TIẾT -->
      <div class="row mt-4 g-4">
        <!-- Mô tả sản phẩm -->
        <div class="col-lg-7">
          <div class="card border-0 shadow-sm p-4 h-100">
            <h5 class="fw-bold pb-2 border-bottom">
              <i class="fas fa-align-left me-2"></i>Mô tả sản phẩm
            </h5>
            <div class="product-description mt-3 lh-lg text-secondary">
              <div v-if="sanPham.mo_ta" v-html="formattedMoTa"></div>
              <p v-else class="text-muted italic">
                Đang cập nhật bài viết mô tả chi tiết cho sản phẩm này...
              </p>
            </div>
          </div>
        </div>

        <!-- Bảng Thông số kỹ thuật chi tiết -->
        <div class="col-lg-5">
          <ThongSoKyThuatTable :thong-so="sanPham.thong_so" />
        </div>
      </div>

      <!-- 4. PHẦN DANH SÁCH ĐÁNH GIÁ -->
      <div class="row mt-4 g-4">
        <div class="col-12">
          <DanhSachDanhGia
            :san-pham-id="sanPham.id"
            :current-user-id="currentUser ? currentUser.id : null"
            :thong-ke-danh-gia="sanPham.thong_ke_danh_gia"
            @edit-review="openReviewModal"
          />
        </div>
      </div>

      <!-- Hiển thị lưới sản phẩm tương tự nếu có dữ liệu -->
      <div class="mt-4 mb-4">
        <div class="d-flex align-items-center mb-3">
          <h4 class="fw-bold m-0">Sản phẩm tương tự</h4>
        </div>
      </div>
      <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-xl-4 g-4">
        <div class="col" v-for="sanPham in dsSanPhamTuongTu" :key="sanPham.id">
          <SanPhamCard
            :san-pham="sanPham"
            @view-detail="goToViewDetailSanPham(sanPham)"
          />
        </div>
      </div>
    </div>
  </div>

  <ReviewModal ref="reviewModalRef" @submit="handleSaveReview" />
</template>

<script>
import BienTheSelector from "@/components/ChiTietSanPham/BienTheSelector.vue";
import ThongSoKyThuatTable from "@/components/ChiTietSanPham/ThongSoKyThuatTable.vue";
import HinhAnhSanPham from "@/components/ChiTietSanPham/HinhAnhSanPham.vue";
import NutThaoTacMuaHang from "@/components/ChiTietSanPham/NutThaoTacMuaHang.vue";
import DanhSachDanhGia from "@/components/ChiTietSanPham/DanhSachDanhGia.vue";
import SanPhamCard from "@/components/TrangChu/SanPhamCard.vue";
import ReviewModal from "@/components/LichSuDonHang/ReviewModal.vue";

import sanPhamService from "@/services/san-pham.service";
import danhGiaService from "@/services/danh-gia.service";
import chiTietGioHangService from "@/services/chi-tiet-gio-hang.service";
import LichSuXemService from "@/services/lich-su-xem.service";
import GoiYService from "@/services/goi-y.service";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default {
  components: {
    BienTheSelector,
    ThongSoKyThuatTable,
    HinhAnhSanPham,
    NutThaoTacMuaHang,
    DanhSachDanhGia,
    SanPhamCard,
    ReviewModal,
  },
  name: "ChiTietSanPhamView",
  props: {
    // Nhận id từ Route params nếu khai báo props: true trong Vue Router
    id: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      API_URL,
      sanPham: null,
      loading: true,
      anhHienTai: "",
      bienTheSelected: null,
      bienTheDaiDien: null,
      dsSanPhamTuongTu: null,
    };
  },

  computed: {
    // Định dạng lại mô tả sản phẩm (xuống dòng chuẩn HTML)
    formattedMoTa() {
      if (!this.sanPham?.mo_ta) return "";
      return this.sanPham.mo_ta.replace(/\n/g, "<br>");
    },

    // Lấy danh sách tên các đợt khuyến mãi áp dụng cho sản phẩm này
    // Lấy danh sách đầy đủ thông tin các đợt khuyến mãi
    danhSachKhuyenMai() {
      const danhSachKM = this.sanPham?.chi_tiet_khuyen_mai;
      if (!Array.isArray(danhSachKM) || danhSachKM.length === 0) {
        return [];
      }

      // Hàm format ngày (dd/mm/yyyy)
      const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("vi-VN");
      };

      // Lọc lấy danh sách các đợt khuyến mãi hợp lệ
      const listPromos = danhSachKM
        .map((item) => item?.dot_khuyen_mai)
        .filter((dot) => !!dot);

      // Loại bỏ các đợt bị trùng id
      const uniquePromos = Array.from(
        new Map(listPromos.map((item) => [item.id, item])).values(),
      );

      return uniquePromos.map((dot) => ({
        id: dot.id,
        ten_dot: dot.ten_dot,
        ngay_bat_dau: formatDate(dot.ngay_bat_dau),
        ngay_ket_thuc: formatDate(dot.ngay_ket_thuc),
      }));
    },

    currentUser() {
      try {
        const userStr = localStorage.getItem("user");
        return userStr ? JSON.parse(userStr) : null;
      } catch (e) {
        console.error("Lỗi parse user từ localStorage:", e);
        return null;
      }
    },
  },

  watch: {
    // Theo dõi khi ID sản phẩm trên URL thay đổi (ví dụ từ SP 1 sang SP 2 khi người dùng chọn xem sản phẩm tương tự)
    "$route.params.id": {
      handler(newId, oldId) {
        if (newId && newId !== oldId) {
          // 1. Reset lại ảnh của sản phẩm cũ
          this.anhHienTai = "";
          // this.bienTheSelected = null;

          // 2. Gọi lại hàm tải dữ liệu sản phẩm và danh sách sản phẩm tương tự mới
          this.fetchChiTietSanPham();
          this.fetchSanPhamTuongTu();

          // 3. Cuộn mượt lên đầu trang
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      },
    },
  },

  methods: {
    // Gọi API lấy dữ liệu chi tiết sản phẩm
    async fetchChiTietSanPham() {
      // 1. Lấy ID an toàn từ route hoặc this.id
      const productId = this.id;
      if (!productId) return;

      try {
        this.loading = true;

        // 2. Gọi service
        const response = await sanPhamService.get(productId);

        // 3. Bóc tách dữ liệu đúng cấu trúc
        this.sanPham = response;

        // 4. GHI NHẬN LỊCH SỬ XEM (Có kiểm tra thời gian 5 phút để chống F5 spam)
        if (this.currentUser) {
          const storageKey = `last_view_${this.currentUser.id}_${productId}`;
          const lastViewTime = sessionStorage.getItem(storageKey);
          const now = new Date().getTime();
          const FIVE_MINUTES = 5 * 60 * 1000; // 5 phút tính bằng mili-giây

          // Nếu chưa từng xem HOẶC thời gian lần xem trước cách hiện tại > 5 phút mới gọi API
          if (
            !lastViewTime ||
            now - parseInt(lastViewTime, 10) > FIVE_MINUTES
          ) {
            const payload = {
              id_khach_hang: this.currentUser.id,
              id_san_pham: productId,
            };

            await LichSuXemService.create(payload);

            // Lưu lại mốc thời gian xem mới nhất vào sessionStorage
            sessionStorage.setItem(storageKey, now.toString());
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải thông tin sản phẩm:", error);
        this.sanPham = null;
      } finally {
        this.loading = false;
      }
    },

    // Gọi API lấy danh sách sản phẩm tương tự cho sản phẩm hiện tại
    async fetchSanPhamTuongTu() {
      // 1. Lấy ID an toàn từ route hoặc this.id
      const productId = this.id;
      if (!productId) return;

      try {
        this.loading = true;

        const result = await GoiYService.getSimilarProducts({
          id_san_pham: productId,
          limit: 8,
        });

        this.dsSanPhamTuongTu = result.data || [];
      } catch (error) {
        console.error("Lỗi khi tải danh sách sản phẩm tương tự:", error);
        this.dsSanPhamTuongTu = null;
      } finally {
        this.loading = false;
      }
    },

    // Hàm nhận sự kiện khi chọn biến thể
    onSelectVariant(bienThe) {
      this.bienTheSelected = bienThe;

      // Nếu biến thể có ảnh riêng (duong_dan_anh), bạn có thể đổi ngay ảnh đại diện chính!
      if (bienThe.duong_dan_anh) {
        this.anhHienTai = `${this.API_URL}/uploads/BienThe/${bienThe.duong_dan_anh}`;
      }
    },

    onLienHe() {
      this.$router.push({
        name: "trang-lien-he.home",
        query: { product_id: this.sanPham.id },
      });
    },

    async onThemVaoGio({ bienThe, soLuong }) {
      // Kiểm tra người dùng đã đăng nhập chưa
      if (!this.currentUser || !this.currentUser.id) {
        alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
        this.$router.push({ name: "khach-hang.login" });
        return;
      }

      // Chuẩn bị dữ liệu gửi lên API
      const cartData = {
        id_khach_hang: this.currentUser.id,
        id_bien_the: bienThe.id,
        so_luong: soLuong,
      };

      try {
        const response = await chiTietGioHangService.addToCart(cartData);
        alert("Thêm vào giỏ hàng thành công!");
      } catch (error) {
        console.error("Lỗi khi thêm vào giỏ hàng:", error);

        const errorMessage =
          error.response?.data?.message ||
          "Có lỗi xảy ra khi thêm vào giỏ hàng!";
        alert(errorMessage);
      }
    },

    async onMuaNgay({ bienThe, soLuong }) {
      // Kiểm tra người dùng đã đăng nhập chưa
      if (!this.currentUser || !this.currentUser.id) {
        alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
        this.$router.push({ name: "khach-hang.login" });
        return;
      }

      // Chuẩn bị dữ liệu gửi lên API
      const cartData = {
        id_khach_hang: this.currentUser.id,
        id_bien_the: bienThe.id,
        so_luong: soLuong,
        is_buy_now: true,
      };

      try {
        // 1. thêm biến thể này vào chi tiết giỏ hàng
        const response = await chiTietGioHangService.addToCart(cartData);
        const selectedItemIds = response.data.id;

        // 2. Chuyển hướng sang trang Giỏ hàng và truyền id cần tick chọn
        this.$router.push({
          name: "gio-hang.home",
          query: { item_ids: selectedItemIds },
        });
      } catch (error) {
        console.error("Lỗi khi đặt hàng:", error);

        const errorMessage =
          error.response?.data?.message || "Có lỗi xảy ra khi thêm đặt hàng!";
        alert(errorMessage);
      }
    },

    //========================== Xử lý đánh giá cho đơn hàng ============================//
    // Mở modal (tương tự cách bạn gọi openAddModal)
    openReviewModal(item) {
      const reviewData = {
        id_san_pham: item.id_san_pham,
        id_chi_tiet_don_hang: item.id_chi_tiet_don_hang,
        id_khach_hang: item.id_khach_hang,
        ten_san_pham: item.san_pham.ten_san_pham,
        ten_bien_the: `${item.chi_tiet_don_hang.bien_the.mau_sac?.ten_mau_sac} |
          ${item.chi_tiet_don_hang.bien_the.cpu?.ten_cpu} |
          ${item.chi_tiet_don_hang.bien_the.gpu?.ten_gpu} |
          ${item.chi_tiet_don_hang.bien_the.dung_luong_ram?.dung_luong_ram} |
          ${item.chi_tiet_don_hang.bien_the.dung_luong_rom?.dung_luong_rom}`,
        duong_dan_anh: this.getAnh(this.sanPham),
      };

      // Gọi hàm openModal trong component con thông qua $refs
      this.$refs.reviewModalRef.openEditModal(reviewData, item);
    },

    // Xử lý lưu đánh giá
    async handleSaveReview(payload, isEdit, onSuccess) {
      try {
        if (isEdit) {
          // Trường hợp CẬP NHẬT (Update)
          await danhGiaService.update(payload.id, payload);

          alert("Cập nhật đánh giá thành công!");
        } else {
          // Trường hợp THÊM MỚI (nếu bạn muốn tận dụng luôn ở trang khác)
          await danhGiaService.create(payload);
          alert("Gửi đánh giá thành công!");
        }

        // Gọi callback để đóng modal
        if (onSuccess) onSuccess();

        // Tải lại trang chi tiết hoặc gọi lại API lấy danh sách đánh giá để UI cập nhật ngay lập tức
        this.fetchChiTietSanPham();
      } catch (error) {
        console.error("Lỗi khi lưu đánh giá:", error);
        const msg =
          error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!";
        alert(msg);
      }
    },

    // Lấy ảnh của sản phẩm (lấy ảnh chính của sản phẩm)
    getAnh(sanPham) {
      // 2. Nếu không có ảnh biến thể, tìm ảnh chính trong mảng anh_san_pham của sản phẩm
      const anhChinhSanPham =
        sanPham.anh_san_pham?.find((img) => img.la_anh_chinh)?.duong_dan_anh ||
        sanPham.bien_the?.san_pham.anh_san_pham?.[0]?.duong_dan_anh;

      if (anhChinhSanPham) {
        return `${API_URL}/uploads/AnhSanPham/${anhChinhSanPham}`;
      }

      // 3. Nếu cả hai đều không có, trả về ảnh mặc định
      return `${API_URL}/images/placeholder-laptop.png`;
    },
    // ===================================================================================//

    goToViewDetailSanPham(sanPham) {
      const variantId = sanPham.bien_the_dai_dien?.id;

      this.$router.push({
        name: "chi-tiet-san-pham.home",
        params: { id: sanPham.id },
        query: { variant: variantId },
      });
    },
  },

  mounted() {
    // 1. Lấy variant ID từ query param trên URL (?variant=BT102)
    this.bienTheDaiDien = this.$route.query.variant || null;

    // 2. Gọi API lấy thông tin sản phẩm bình thường và lấy danh sách sản phẩm tương tự
    this.fetchChiTietSanPham();
    this.fetchSanPhamTuongTu();
  },
};
</script>

<style scoped>
.bg-subtle {
  background-color: #e0f2fe;
  border: 1px solid #bae6fd;
}

.fs-7 {
  font-size: 0.85rem;
}

.fs-8 {
  font-size: 0.72rem;
}

/* Tùy chỉnh thanh Breadcrumb giống mẫu thiết kế */
.custom-breadcrumb {
  font-size: 0.9rem;
}

/* Tùy chỉnh dấu phân cách giữa các mục thành dấu › */
.custom-breadcrumb .breadcrumb-item + .breadcrumb-item::before {
  content: "›";
  color: #6c757d;
  font-weight: 600;
  padding: 0 8px;
}

.custom-breadcrumb .breadcrumb-item a:hover {
  color: #0d6efd !important;
}
</style>
