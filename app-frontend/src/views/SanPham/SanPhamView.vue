<template>
  <div class="container mt-3">
    <h4>Quản lý Sản Phẩm</h4>

    <!-- Component Tìm kiếm Sản phẩm -->
    <SanPhamSearch v-model="filter" @submit="retrieveSanPhams" />

    <div class="mb-3">
      <button
        class="btn btn-primary"
        :class="{ 'btn-permission-muted': !canManageSanPham }"
        @click="goToAddSanPham"
      >
        <i class="fas fa-plus"></i> Thêm mới Sản Phẩm
      </button>

      <!-- Nút chuyển sang trang Thùng rác -->
      <button
        class="btn btn-secondary ms-2"
        :class="{ 'btn-permission-muted': !canManageSanPham }"
        @click="goToTrash"
      >
        <i class="fas fa-trash-alt"></i> Thùng rác sản phẩm
      </button>
    </div>

    <SanPhamTable
      :sanPhams="sanPhams"
      :canManageSanPham="canManageSanPham"
      :isTrash="false"
      @view-detail="goToViewDetailSanPham"
      @toggle-status="toggleStatussanPham"
      @delete-or-restore="deletesanPham"
    />
  </div>
</template>

<script>
import SanPhamSearch from "@/components/SanPham/SanPhamSearch.vue";
import SanPhamTable from "@/components/SanPham/SanPhamTable.vue";
import SanPhamService from "@/services/san-pham.service";

const ALLOWED_SAN_PHAM_ROLES = ["Nhân viên kho", "Quản trị viên"];

export default {
  name: "SanPhamView",
  components: {
    SanPhamSearch,
    SanPhamTable,
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

  computed: {
    currentAdminUser() {
      try {
        const userStr = localStorage.getItem("adminUser");
        return userStr ? JSON.parse(userStr) : null;
      } catch (e) {
        return null;
      }
    },

    adminRole() {
      if (!this.currentAdminUser) return null;
      return this.currentAdminUser.vai_tro.ten_vai_tro;
    },

    canManageSanPham() {
      return (
        !!this.adminRole && ALLOWED_SAN_PHAM_ROLES.includes(this.adminRole)
      );
    },
  },

  methods: {
    // ==================== Phát tín hiệu không có quyền thực hiện thao tác ====================
    notifyAccessDenied(message = "Bạn không có quyền thực hiện thao tác này!") {
      window.dispatchEvent(
        new CustomEvent("admin-access-denied", {
          detail: { message },
        }),
      );
    },

    // ==================== 1. Lấy danh sách Sản Phẩm theo bộ lọc ====================
    async retrieveSanPhams() {
      try {
        // Gộp thêm tham số da_xoa: false vào filter
        const queryParams = {
          ...this.filter,
          da_xoa: false,
        };
        this.sanPhams = await SanPhamService.getAll(queryParams);
      } catch (error) {
        console.error("Lỗi khi tải danh sách sản phẩm:", error);
      }
    },

    // ==================== 2. Điều hướng tới Form Thêm Mới ====================
    goToAddSanPham() {
      if (!this.canManageSanPham) {
        this.notifyAccessDenied();
        return;
      }
      this.$router.push({ name: "san-pham.add" });
    },

    goToTrash() {
      // Điều hướng sang component/route thùng rác sản phẩm
      this.$router.push({ name: "san-pham.trash" });
    },

    // ==================== 3. Điều hướng tới Form Cập Nhật ====================
    goToViewDetailSanPham(id) {
      this.$router.push({
        name: "san-pham.detail",
        params: { id: id },
        query: { isTrashInSanPham: false },
      });
    },

    // ==================== 2. Khóa (Delete) Sản Phẩm ====================
    async deletesanPham(sanPham) {
      if (!this.canManageSanPham) {
        this.notifyAccessDenied();
        return;
      }
      if (
        confirm(
          `Bạn có chắc chắn muốn xóa sản phẩm "${sanPham.ten_san_pham}" không?`,
        )
      ) {
        try {
          // Gọi hàm delete để Khóa sản phẩm
          await SanPhamService.delete(sanPham.id);

          alert(`Xóa sản phẩm thành công!`);
          this.retrieveSanPhams();
        } catch (error) {
          console.error(error);
          const errorMessage =
            error.response?.data?.message ||
            error.response?.data ||
            `Có lỗi xảy ra khi xóa sản phẩm ${sanPham.id}`;

          alert(errorMessage);
        }
      }
    },

    // ==================== 2. Đổi trạng thái qua lại giữa DANG_KINH_DOANH và NGUNG_KINH_DOANH ====================
    async toggleStatussanPham(sanPham) {
      if (!this.canManageSanPham) {
        this.notifyAccessDenied();
        return;
      }
      // Chặn không cho thao tác nếu đang ở trạng thái DANG_HOAN_THIEN
      if (sanPham.trang_thai === "DANG_HOAN_THIEN") {
        alert(
          "Sản phẩm đang trong quá trình hoàn thiện thông tin, không thể đổi trạng thái kinh doanh!",
        );
        return;
      }

      // Xác định trạng thái tiếp theo cần chuyển tới
      const nextStatus =
        sanPham.trang_thai === "DANG_KINH_DOANH"
          ? "NGUNG_KINH_DOANH"
          : "DANG_KINH_DOANH";
      const actionText =
        nextStatus === "NGUNG_KINH_DOANH"
          ? "NGỪNG KINH DOANH"
          : "ĐANG KINH DOANH";

      if (
        confirm(
          `Bạn có chắc chắn muốn chuyển sản phẩm "${sanPham.ten_san_pham}" sang trạng thái ${actionText} không?`,
        )
      ) {
        try {
          // Gọi hàm update truyền vào trang_thai mới thông qua SanPhamService
          await SanPhamService.update(sanPham.id, {
            trang_thai: nextStatus,
          });

          alert(`Cập nhật trạng thái thành công!`);
          this.retrieveSanPhams(); // Tải lại danh sách
        } catch (error) {
          console.error(error);
          const errorMessage =
            error.response?.data?.message ||
            error.response?.data ||
            `Có lỗi xảy ra khi cập nhật trạng thái sản phẩm ${sanPham.id}`;

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

<style scoped>
.btn-permission-muted {
  opacity: 0.45;
  cursor: pointer;
}

.btn-permission-muted:hover {
  opacity: 0.65;
}
</style>
