<template>
  <div class="container mt-3">
    <h4 class="text-danger">Thùng Rác Sản Phẩm (Đã Xóa Mềm)</h4>

    <button class="btn btn-secondary mb-3" @click="$router.go(-1)">
      <i class="fas fa-arrow-left"></i> Quay lại
    </button>

    <!-- Nhúng chung SanPhamTable nhưng bật cờ isTrash = true -->
    <SanPhamTable
      :sanPhams="sanPhams"
      :isTrash="true"
      :canManageSanPham="true"
      @view-detail="goToViewDetailSanPham"
      @delete-or-restore="restoreSanPham"
    />
  </div>
</template>

<script>
import SanPhamTable from "@/components/SanPham/SanPhamTable.vue";
import SanPhamService from "@/services/san-pham.service";

export default {
  name: "SanPhamTrashView",
  components: { SanPhamTable },
  data() {
    return { sanPhams: [] };
  },

  methods: {
    async retrieveSanPhams() {
      try {
        // Truyền da_xoa: true để lấy danh sách các sản phẩm đã bị xóa mềm
        this.sanPhams = await SanPhamService.getAll({ da_xoa: true });
      } catch (error) {
        console.error("Lỗi tải thùng rác:", error);
      }
    },

    goToViewDetailSanPham(id) {
      this.$router.push({
        name: "san-pham.detail",
        params: { id: id },
        query: { isTrashInSanPham: true },
      });
    },

    // ==================== 2. Khóa (Delete) / Mở khóa (Restore) Sản Phẩm ====================
    async restoreSanPham(sanPham) {
      {
        try {
          // Nếu sản phẩm đang hoạt động -> Gọi hàm delete để Khóa sản phẩm
          await SanPhamService.restore(sanPham.id);

          alert(`Khôi phục sản phẩm thành công!`);
          this.retrieveSanPhams();
        } catch (error) {
          console.error(error);
          const errorMessage =
            error.response?.data?.message ||
            error.response?.data ||
            `Có lỗi xảy ra khi khôi phục sản phẩm ${sanPham.id}`;

          alert(errorMessage);
        }
      }
    },
  },
  mounted() {
    this.retrieveSanPhams();
  },
};
</script>
