<template>
  <div class="container my-4">
    <!-- 1. KHU VỰC BỘ LỌC TRANG CHỦ (CHỈ HIỆN KHI KHÔNG TÌM KIẾM DÙM NAVBAR) -->
    <div class="mb-4">
      <SanPhamFilterTT v-model="filter" @submit="applyFilterFromPage" />
    </div>

    <!-- 2. DANH SÁCH SẢN PHẨM NỔI BẬT & BÁN CHẠY (CHỈ HIỆN KHI KHÔNG TÌM KIẾM) -->
    <div class="mb-5" v-if="!isSearching && popularProducts.length > 0">
      <div class="d-flex align-items-center mb-3">
        <h4 class="fw-bold m-0 text-danger">🔥 Sản phẩm nổi bật & Bán chạy</h4>
      </div>
      <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-xl-4 g-4">
        <div class="col" v-for="sanPham in popularProducts" :key="sanPham.id">
          <SanPhamCard
            :san-pham="sanPham"
            @view-detail="goToViewDetailSanPham(sanPham)"
            @buy-now="onMuaNgay"
          />
        </div>
      </div>
    </div>

    <!-- 3. DANH SÁCH KẾT QUẢ TÌM KIẾM HOẶC GỢI Ý CÁ NHÂN HÓA -->
    <div class="mb-4">
      <div class="d-flex align-items-center mb-3">
        <h4
          class="fw-bold m-0"
          :class="isSearching ? 'text-dark' : 'text-primary'"
        >
          {{
            isSearching ? "🔍 Kết quả tìm kiếm" : "🌟 Gợi ý dành riêng cho bạn"
          }}
        </h4>
      </div>

      <!-- Hiển thị lưới sản phẩm nếu có dữ liệu -->
      <div
        class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-xl-4 g-4"
        v-if="displayedProducts.length > 0"
      >
        <div class="col" v-for="sanPham in displayedProducts" :key="sanPham.id">
          <SanPhamCard
            :san-pham="sanPham"
            @view-detail="goToViewDetailSanPham(sanPham)"
            @buy-now="onMuaNgay"
          />
        </div>
      </div>

      <!-- Hiển thị khi danh sách rỗng -->
      <div v-else class="text-center py-5 shadow-sm bg-light rounded">
        <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
        <h5 class="text-secondary">
          {{
            isSearching
              ? "Không tìm thấy sản phẩm nào phù hợp với các tiêu chí của bạn."
              : "Hiện chưa có sản phẩm gợi ý nào."
          }}
        </h5>
      </div>
    </div>
  </div>
</template>

<script>
import SanPhamFilterTT from "@/components/TrangChu/SanPhamFilterTT.vue";
import SanPhamCard from "@/components/TrangChu/SanPhamCard.vue";
import SanPhamService from "@/services/san-pham.service";
import GoiYService from "@/services/goi-y.service";
import LichSuTimKiemService from "@/services/lich-su-tim-kiem.service";
import chiTietGioHangService from "@/services/chi-tiet-gio-hang.service";

export default {
  name: "SanPhamView",
  components: {
    SanPhamFilterTT,
    SanPhamCard,
  },
  data() {
    return {
      searchResults: [],
      popularProducts: [],
      personalizedProducts: [],
      filter: {
        name: "",
        id_thuong_hieu: "",
        id_danh_muc: "",
        id_nha_cc: "",
        id_cpu: "",
        id_gpu: "",
        id_ram: "",
        id_rom: "",
        id_mau_sac: "",
        gia_tu: "",
        gia_den: "",
      },
      // Đã lược bỏ isSearching khỏi data vì chuyển sang computed bên dưới
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

    // --- 1. TỰ ĐỘNG XÁC ĐỊNH ĐANG TÌM KIẾM DỰA VÀO FILTER ---
    isSearching() {
      return Object.values(this.filter).some(
        (val) => val !== "" && val !== null && val !== undefined,
      );
    },

    displayedProducts() {
      return this.isSearching ? this.searchResults : this.personalizedProducts;
    },
  },

  watch: {
    // Lắng nghe sự thay đổi query trên URL (từ Modal Navbar hoặc khi bấm nút quay lại/chuyển trang)
    "$route.query": {
      immediate: true,
      handler(newQuery) {
        this.syncFilterFromQuery(newQuery);
      },
    },
  },

  methods: {
    // Đồng bộ các thông số từ URL query vào biến filter của trang
    syncFilterFromQuery(query) {
      this.filter = {
        name: query.name || "",
        id_thuong_hieu: query.id_thuong_hieu || "",
        id_danh_muc: query.id_danh_muc || "",
        id_nha_cc: query.id_nha_cc || "",
        id_cpu: query.id_cpu || "",
        id_gpu: query.id_gpu || "",
        id_ram: query.id_ram || "",
        id_rom: query.id_rom || "",
        id_mau_sac: query.id_mau_sac || "",
        gia_tu: query.gia_tu || "",
        gia_den: query.gia_den || "",
      };

      this.retrieveSanPhams();
    },

    // Thực hiện gọi API lọc hoặc lấy gợi ý mặc định
    async retrieveSanPhams() {
      try {
        if (this.isSearching) {
          // TRƯỜNG HỢP A: Đang tìm kiếm / lọc sản phẩm
          const queryParams = {
            ...this.filter,
            trang_thai: "DANG_KINH_DOANH",
            da_xoa: false,
            trang_thai_bien_the: true,
            da_xoa_bien_the: false,
          };

          this.searchResults = await SanPhamService.getAll(queryParams);

          // === BỔ SUNG: GHI NHẬN LỊCH SỬ TÌM KIẾM NGẦM ===
          try {
            if (this.currentUser) {
              const danhSachTimKiem = [];
              const filters = this.filter;

              if (filters.name && filters.name.trim() !== "") {
                danhSachTimKiem.push({
                  tu_khoa: filters.name.trim(),
                  loai_tim_kiem: "TU_KHOA",
                });
              }

              if (filters.id_thuong_hieu && filters.id_thuong_hieu !== "") {
                danhSachTimKiem.push({
                  tu_khoa: filters.id_thuong_hieu,
                  loai_tim_kiem: "THUONG_HIEU",
                });
              }

              if (filters.id_danh_muc && filters.id_danh_muc !== "") {
                danhSachTimKiem.push({
                  tu_khoa: filters.id_danh_muc,
                  loai_tim_kiem: "DANH_MUC",
                });
              }

              if (filters.id_cpu && filters.id_cpu !== "") {
                danhSachTimKiem.push({
                  tu_khoa: filters.id_cpu,
                  loai_tim_kiem: "CPU",
                });
              }

              if (filters.id_gpu && filters.id_gpu !== "") {
                danhSachTimKiem.push({
                  tu_khoa: filters.id_gpu,
                  loai_tim_kiem: "GPU",
                });
              }

              if (filters.id_ram && filters.id_ram !== "") {
                danhSachTimKiem.push({
                  tu_khoa: filters.id_ram,
                  loai_tim_kiem: "RAM",
                });
              }

              if (filters.id_rom && filters.id_rom !== "") {
                danhSachTimKiem.push({
                  tu_khoa: filters.id_rom,
                  loai_tim_kiem: "ROM",
                });
              }

              if (filters.id_mau_sac && filters.id_mau_sac !== "") {
                danhSachTimKiem.push({
                  tu_khoa: filters.id_mau_sac,
                  loai_tim_kiem: "MAU_SAC",
                });
              }

              const hasGiaTu =
                filters.gia_tu !== undefined &&
                filters.gia_tu !== "" &&
                filters.gia_tu !== null;
              const hasGiaDen =
                filters.gia_den !== undefined &&
                filters.gia_den !== "" &&
                filters.gia_den !== null;

              if (hasGiaTu || hasGiaDen) {
                const itemTimKiem = { loai_tim_kiem: "GIA" };
                if (hasGiaTu) itemTimKiem.gia_tu = filters.gia_tu;
                if (hasGiaDen) itemTimKiem.gia_den = filters.gia_den;
                danhSachTimKiem.push(itemTimKiem);
              }

              if (danhSachTimKiem.length > 0) {
                await LichSuTimKiemService.create({
                  id_khach_hang: this.currentUser.id,
                  danh_sach: danhSachTimKiem,
                });
              }
            }
          } catch (historyError) {
            console.error("Không thể lưu lịch sử tìm kiếm ngầm:", historyError);
          }
          // =============================================
        } else {
          // TRƯỜNG HỢP B: Giao diện Trang chủ mặc định (Không tìm kiếm)
          const customerId = this.currentUser ? this.currentUser.id : null;

          const result_1 = await GoiYService.getPopular({
            limit: 4,
          });
          this.popularProducts = result_1.data || [];

          const result_2 = await GoiYService.getPersonalized({
            id_khach_hang: customerId,
            limit: 60,
          });
          this.personalizedProducts = result_2.data || [];
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách sản phẩm:", error);
      }
    },

    // --- 2. HÀM ÁP DỤNG LỌC TẠI TRANG CHỦ (LỌC BỎ CÁC TRƯỜNG RỖNG TRƯỚC KHI PUSH URL) ---
    applyFilterFromPage() {
      const cleanQuery = {};
      Object.keys(this.filter).forEach((key) => {
        if (
          this.filter[key] !== "" &&
          this.filter[key] !== null &&
          this.filter[key] !== undefined
        ) {
          cleanQuery[key] = this.filter[key];
        }
      });

      this.$router.push({
        name: "trang-chu.home",
        query: cleanQuery,
      });
    },

    goToViewDetailSanPham(sanPham) {
      const variantId = sanPham.bien_the_dai_dien?.id;

      this.$router.push({
        name: "chi-tiet-san-pham.home",
        params: { id: sanPham.id },
        query: { variant: variantId },
      });
    },

    async onMuaNgay(bienThe) {
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
        so_luong: 1,
        is_buy_now: true,
      };

      try {
        // 1. thêm biến thể này vào chi tiết giỏ hàng
        const response = await chiTietGioHangService.addToCart(cartData);
        window.dispatchEvent(new Event("cart-updated"));
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
  },
};
</script>
