<template>
  <div class="container mt-3">
    <h4>Quản lý Sản Phẩm</h4>

    <!-- Component Tìm kiếm Sản phẩm -->
    <SanPhamSearch v-model="filter" @submit="retrieveSanPhams" />

    <button class="btn btn-primary mb-3" @click="goToAddSanPham">
      <i class="fas fa-plus"></i> Thêm mới Sản Phẩm
    </button>

    <button class="btn btn-danger mb-3 ms-2" @click="deleteAllSanPhams">
      <i class="fas fa-trash"></i> Xóa tất cả Sản Phẩm
    </button>

    <table class="table table-bordered table-striped align-middle">
      <thead class="table-dark">
        <tr>
          <th>Mã SP</th>
          <th>Tên Sản Phẩm</th>
          <th>Thương Hiệu</th>
          <th>Danh Mục</th>
          <th>Nhà Cung Cấp</th>
          <th>Mô Tả</th>
          <th>Trạng Thái</th>
          <th style="width: 200px">Hành động</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="sanPham in sanPhams" :key="sanPham.id">
          <td>{{ sanPham.id }}</td>
          <td><strong>{{ sanPham.ten_san_pham }}</strong></td>
          <td>{{ sanPham.thuong_hieu?.ten_thuong_hieu}}</td>
          <td>{{ sanPham.danh_muc?.ten_danh_muc}}</td>
          <td>{{ sanPham.nha_cung_cap?.ten_ncc}}</td>
          <td>{{ sanPham.mo_ta || "Chưa có mô tả" }}</td>
          <td class="text-center">
            <span v-if="sanPham.trang_thai" class="badge bg-success">Đang kinh doanh</span>
            <span v-else class="badge bg-secondary">Ngừng kinh doanh</span>
          </td>
          <td>
            <button
              class="btn btn-sm btn-secondary me-2"
              @click="goToViewDetailSanPham(sanPham.id)"
            >
              <i class="fas fa-info"></i> Chi tiết
            </button>

            <button
              class="btn btn-sm btn-danger"
              @click="deleteSanPham(sanPham.id)"
            >
              <i class="fas fa-trash"></i> Xóa
            </button>
          </td>
        </tr>

        <!-- Hiển thị khi danh sách rỗng -->
        <tr v-if="sanPhams.length === 0">
          <td colspan="8" class="text-center">
            Không tìm thấy sản phẩm nào phù hợp.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import SanPhamSearch from "@/components/SanPham/SanPhamSearch.vue";
import SanPhamService from "@/services/san-pham.service";

export default {
  name: "SanPhamView",
  components: {
    SanPhamSearch,
  },
  data() {
    return {
      sanPhams: [],
      filter: {
        id: "",
        name: "",
      },
    };
  },

  methods: {
    // ==================== 1. Lấy danh sách Sản Phẩm theo bộ lọc ====================
    async retrieveSanPhams() {
      try {
        this.sanPhams = await SanPhamService.getAll(this.filter);
      } catch (error) {
        console.error("Lỗi khi tải danh sách sản phẩm:", error);
      }
    },

    // ==================== 2. Điều hướng tới Form Thêm Mới ====================
    goToAddSanPham() {
      this.$router.push({ name: "san-pham.add" });
    },

    // ==================== 3. Điều hướng tới Form Cập Nhật ====================
    goToViewDetailSanPham(id) {
      this.$router.push({
        name: "san-pham.detail",
        params: { id: id },
      });
    },

    // ==================== 4. Xóa một Sản Phẩm đơn lẻ ====================
    async deleteSanPham(id) {
      if (confirm(`Bạn có chắc chắn muốn xóa Sản Phẩm có mã "${id}" không?`)) {
        try {
          await SanPhamService.delete(id);
          alert("Xóa Sản Phẩm thành công!");
          this.retrieveSanPhams();
        } catch (error) {
          console.error(error);

          const errorMessage =
            error.response?.data?.message ||
            error.response?.data ||
            `Có lỗi xảy ra khi xóa sản phẩm ${id}`;

          alert(errorMessage);
        }
      }
    },

    // ==================== 5. Xóa tất cả Sản Phẩm ====================
    async deleteAllSanPhams() {
      const confirm1 = confirm(
        "CẢNH BÁO: Bạn có chắc chắn muốn xóa TẤT CẢ Sản Phẩm không? Hành động này không thể hoàn tác!"
      );

      if (confirm1) {
        const confirm2 = confirm(
          "BẠN CÓ THỰC SỰ CHẮC CHẮN? Tất cả dữ liệu Sản Phẩm sẽ bị xóa sạch hoàn toàn!"
        );

        if (confirm2) {
          try {
            await SanPhamService.deleteAll();
            alert("Đã xóa thành công tất cả Sản Phẩm khỏi hệ thống!");
            this.retrieveSanPhams();
          } catch (error) {
            console.error(error);

            const errorMessage =
              error.response?.data?.message ||
              error.response?.data ||
              "Đã xảy ra lỗi khi xóa tất cả Sản Phẩm.";

            alert(errorMessage);
          }
        }
      }
    },
  },

  mounted() {
    this.retrieveSanPhams();
  },
};
</script>