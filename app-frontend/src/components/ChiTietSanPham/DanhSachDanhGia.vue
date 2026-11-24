<template>
  <div class="card border-0 shadow-sm p-4">
    <!-- TIÊU ĐỀ THỐNG KÊ -->
    <div
      class="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom"
    >
      <h5 class="fw-bold text-dark mb-0">
        <i class="fas fa-comments mr-2"></i>Đánh giá sản phẩm
      </h5>
      <div class="d-flex align-items-center gap-1">
        <div class="text-warning">
          <i class="fas fa-star"></i>
        </div>
        <span class="fw-bold text-dark">
          <strong>{{ thongKeDanhGia?.trung_binh_sao || 0 }}</strong>
        </span>
        <strong>/5</strong>
        <span class="text-muted small">
          ({{ thongKeDanhGia?.tong_so_danh_gia || 0 }} đánh giá)
        </span>
      </div>
    </div>

    <!-- KHU VỰC LỌC THEO SỐ SAO (ĐÃ CẬP NHẬT GIAO DIỆN GIỐNG MẪU NGANG) -->
    <div class="d-flex gap-2 mb-4 flex-wrap align-items-center">
      <!-- Nút Tất cả (có thể giữ lại tổng số lượng tổng hoặc bỏ tùy ý) -->
      <button
        class="btn btn-sm px-3 filter-pill filter-btn"
        :class="filterSao === 0 ? 'btn-dark' : 'btn-light border text-dark'"
        @click="filterSao = 0"
      >
        Tất cả ({{ thongKeDanhGia?.tong_so_danh_gia || 0 }})
      </button>

      <!-- Các nút lọc theo số sao (5, 4, 3, 2, 1) -->
      <button
        v-for="sao in [5, 4, 3, 2, 1]"
        :key="sao"
        class="btn btn-sm px-3 filter-pill filter-btn d-flex align-items-center gap-1 ml-2"
        :class="
          filterSao === sao
            ? 'btn-dark text-white fw-bold'
            : 'btn-light border text-dark'
        "
        @click="filterSao = sao"
      >
        <span>{{ sao }}</span>
        <i class="fas fa-star text-warning"></i>
      </button>
    </div>

    <!-- TRẠNG THÁI ĐANG TẢI -->
    <div v-if="loading" class="text-center py-4">
      <div
        class="spinner-border spinner-border-sm text-primary"
        role="status"
      ></div>
      <span class="ms-2 text-muted small">Đang tải đánh giá...</span>
    </div>

    <!-- DANH SÁCH ĐÁNH GIÁ TRỐNG -->
    <div
      v-else-if="filteredDanhGia.length === 0"
      class="text-center py-4 bg-light rounded text-muted"
    >
      <p class="mb-0 small">Chưa có đánh giá nào cho bộ lọc này.</p>
    </div>

    <!-- DANH SÁCH ĐÁNH GIÁ (ĐÃ PHÂN TRANG) -->
    <div v-else class="review-list">
      <DanhGiaCard
        v-for="item in pagedDanhGia"
        :key="item.id"
        :item="item"
        :is-my-review="isMyReview(item)"
        @edit-review="$emit('edit-review', $event)"
      />

      <!-- THANH PHÂN TRANG (PAGINATION) -->
      <div
        v-if="totalPages > 1"
        class="d-flex justify-content-between align-items-center mt-4 pt-3 border-top"
      >
        <nav aria-label="Page navigation">
          <ul class="pagination pagination-sm mb-0">
            <!-- Nút Trang trước -->
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <button
                class="page-link"
                @click="changePage(currentPage - 1)"
                :disabled="currentPage === 1"
              >
                <i class="fas fa-chevron-left"></i>
              </button>
            </li>

            <!-- Số trang (1, 2, 3...) -->
            <li
              v-for="page in totalPages"
              :key="page"
              class="page-item"
              :class="{ active: currentPage === page }"
            >
              <button class="page-link" @click="changePage(page)">
                {{ page }}
              </button>
            </li>

            <!-- Nút Trang sau -->
            <li
              class="page-item"
              :class="{ disabled: currentPage === totalPages }"
            >
              <button
                class="page-link"
                @click="changePage(currentPage + 1)"
                :disabled="currentPage === totalPages"
              >
                <i class="fas fa-chevron-right"></i>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>
</template>

<script>
import DanhGiaService from "@/services/danh-gia.service";
import DanhGiaCard from "./DanhGiaCard.vue";

export default {
  name: "DanhSachDanhGia",
  components: {
    DanhGiaCard,
  },
  props: {
    sanPhamId: {
      type: [String, Number],
      required: true,
    },
    currentUserId: {
      type: String,
      default: null,
    },
    thongKeDanhGia: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      danhSachDanhGia: [],
      loading: false,
      filterSao: 0, // 0: Tất cả, 1-5: Lọc theo số sao tương ứng

      // --- KHAI BÁO PHÂN TRANG ---
      currentPage: 1, // Trang mặc định ban đầu là 1
      pageSize: 5, // Hiển thị 5 đánh giá trên mỗi trang
    };
  },
  computed: {
    // Tự động lọc theo sao VÀ sắp xếp đẩy đánh giá của chính mình lên ĐẦU TIÊN
    filteredDanhGia() {
      let list = [...this.danhSachDanhGia];

      // 1. Lọc theo số sao
      if (this.filterSao !== 0) {
        list = list.filter((item) => Number(item.so_sao) === this.filterSao);
      }

      // 2. Sắp xếp đưa đánh giá của mình (isMyReview) lên đầu danh sách
      if (this.currentUserId) {
        list.sort((a, b) => {
          const isA = this.isMyReview(a);
          const isB = this.isMyReview(b);
          if (isA && !isB) return -1; // a lên trước
          if (!isA && isB) return 1; // b lên trước
          return 0; // Giữ nguyên thứ tự theo thời gian
        });
      }

      return list;
    },

    // 2. TỔNG SỐ TRANG
    totalPages() {
      return Math.ceil(this.filteredDanhGia.length / this.pageSize) || 1;
    },

    // 3. DANH SÁCH ĐÁNH GIÁ ĐÃ CẮT THEO TRANG (Đây là mảng dùng để render ra UI)
    pagedDanhGia() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredDanhGia.slice(start, end);
    },
  },
  methods: {
    async fetchDanhGia() {
      if (!this.sanPhamId) return;
      try {
        this.loading = true;
        const response = await DanhGiaService.getAll({
          id_san_pham: this.sanPhamId,
        });

        this.danhSachDanhGia = Array.isArray(response)
          ? response
          : response.data || [];
      } catch (error) {
        console.error("Lỗi khi tải danh sách đánh giá:", error);
        this.danhSachDanhGia = [];
      } finally {
        this.loading = false;
      }
    },

    isMyReview(item) {
      if (!this.currentUserId || !item.id_khach_hang) return false;
      return String(item.id_khach_hang) === String(this.currentUserId);
    },

    // Hàm chuyển trang
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
      }
    },
  },
  watch: {
    // Khi chọn bộ lọc sao khác, tự động reset về Trang 1
    filterSao() {
      this.currentPage = 1;
    },
    sanPhamId: {
      immediate: true,
      handler(newId) {
        if (newId) {
          this.currentPage = 1;
          this.fetchDanhGia();
        }
      },
    },
  },
};
</script>

<style scoped>
/* ==================== TÙY CHỈNH THANH PHÂN TRANG (PAGINATION) ==================== */
.pagination {
  gap: 4px; /* Tạo khoảng cách nhỏ đều nhau giữa các nút trang */
}

.pagination .page-item .page-link {
  color: #333;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px !important; /* Bo góc nhẹ vuông vức hiện đại giống mẫu */
  padding: 6px 12px;
  font-size: 0.85rem;
  font-weight: 500;
  box-shadow: none !important;
  transition: all 0.2s ease-in-out;
}

/* Hiệu ứng khi rê chuột vào nút trang */
.pagination .page-item .page-link:hover {
  background-color: #e9ecef;
  border-color: #ced4da;
  color: #000;
}

/* Trang đang được chọn (Active) - Dùng màu xanh dương thương hiệu */
.pagination .page-item.active .page-link {
  background-color: #2563eb !important;
  border-color: #2563eb !important;
  color: #fff !important;
}

/* Trạng thái vô hiệu hóa (Disabled) cho nút điều hướng đầu/cuối */
.pagination .page-item.disabled .page-link {
  background-color: #f8f9fa;
  border-color: #dee2e6;
  color: #adb5bd;
  opacity: 0.7;
}

/* Các style CSS cũ của bạn giữ nguyên bên dưới */
.filter-btn {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  color: #333;
  font-size: 0.85rem;
  padding: 6px 14px;
  transition: all 0.2s ease-in-out;
}

.filter-btn:hover {
  background-color: #e9ecef;
  border-color: #ced4da;
}

.filter-btn.btn-dark {
  background-color: #2563eb !important;
  border-color: #2563eb !important;
  color: #fff !important;
}

.filter-btn .fa-star {
  font-size: 0.8rem;
}

.review-list > :last-child {
  border-bottom: none !important;
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
}

.filter-pill {
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  padding: 5px 12px;
  border: none;
  transition: all 0.2s ease;
}
</style>
