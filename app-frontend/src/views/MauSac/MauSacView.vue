<template>
  <div class="container mt-3">
    <h4>Quản lý Màu Sắc</h4>

    <!-- Component Tìm kiếm Màu Sắc -->
    <MauSacSearch v-model="filter" @submit="retrieveMauSacs" />

    <button
      class="btn btn-primary mb-3"
      :class="{ 'btn-permission-muted': !canManageMauSac }"
      @click="goToAddMauSac"
    >
      <i class="fas fa-plus"></i> Thêm mới Màu Sắc
    </button>

    <button
      class="btn btn-danger mb-3 ms-2"
      :class="{ 'btn-permission-muted': !canManageMauSac }"
      @click="deleteAllMauSacs"
    >
      <i class="fas fa-trash"></i> Xóa tất cả Màu Sắc
    </button>

    <table class="table table-bordered table-striped">
      <thead class="table-dark">
        <tr>
          <th>Mã Màu</th>
          <th>Tên Màu Sắc</th>
          <th style="width: 220px">Hành động</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="mauSac in mauSacs" :key="mauSac.id">
          <td>{{ mauSac.id }}</td>
          <td>{{ mauSac.ten_mau_sac }}</td>
          <td>
            <button
              class="btn btn-sm btn-secondary me-2"
              :class="{ 'btn-permission-muted': !canManageMauSac }"
              @click="goToUpdateMauSac(mauSac.id)"
            >
              <i class="fas fa-edit"></i> Cập nhật
            </button>

            <button
              class="btn btn-sm btn-danger"
              :class="{ 'btn-permission-muted': !canManageMauSac }"
              @click="deleteMauSac(mauSac.id)"
            >
              <i class="fas fa-trash"></i> Xóa
            </button>
          </td>
        </tr>

        <!-- Hiển thị khi danh sách rỗng -->
        <tr v-if="mauSacs.length === 0">
          <td colspan="3" class="text-center">
            Không tìm thấy màu sắc nào phù hợp.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import MauSacSearch from "@/components/MauSac/MauSacSearch.vue";
import MauSacService from "@/services/mau-sac.service";

const ALLOWED_MAU_SAC_ROLES = ["Nhân viên kho", "Quản trị viên"];

export default {
  name: "MauSacView",
  components: {
    MauSacSearch,
  },
  data() {
    return {
      mauSacs: [],
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

    canManageMauSac() {
      return !!this.adminRole && ALLOWED_MAU_SAC_ROLES.includes(this.adminRole);
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

    // ==================== 1. Lấy danh sách Màu Sắc theo bộ lọc ====================
    async retrieveMauSacs() {
      try {
        this.mauSacs = await MauSacService.getAll(this.filter);
      } catch (error) {
        console.error("Lỗi khi tải danh sách màu sắc:", error);
      }
    },

    // ==================== 2. Điều hướng tới Form Thêm Mới ====================
    goToAddMauSac() {
      if (!this.canManageMauSac) {
        this.notifyAccessDenied();
        return;
      }
      this.$router.push({ name: "mau-sac.add" });
    },

    // ==================== 3. Điều hướng tới Form Cập Nhật ====================
    goToUpdateMauSac(id) {
      if (!this.canManageMauSac) {
        this.notifyAccessDenied();
        return;
      }
      this.$router.push({
        name: "mau-sac.edit",
        params: { id: id },
      });
    },

    // ==================== 4. Xóa một Màu Sắc đơn lẻ ====================
    async deleteMauSac(id) {
      if (!this.canManageMauSac) {
        this.notifyAccessDenied();
        return;
      }
      if (confirm(`Bạn có chắc chắn muốn xóa Màu Sắc có mã "${id}" không?`)) {
        try {
          await MauSacService.delete(id);
          alert("Xóa Màu Sắc thành công!");
          this.retrieveMauSacs();
        } catch (error) {
          console.error(error);

          const errorMessage =
            error.response?.data?.message ||
            error.response?.data ||
            `Có lỗi xảy ra khi xóa màu sắc ${id}`;

          alert(errorMessage);
        }
      }
    },

    // ==================== 5. Xóa tất cả Màu Sắc ====================
    async deleteAllMauSacs() {
      if (!this.canManageMauSac) {
        this.notifyAccessDenied();
        return;
      }
      const confirm1 = confirm(
        "CẢNH BÁO: Bạn có chắc chắn muốn xóa TẤT CẢ Màu Sắc không? Hành động này không thể hoàn tác!",
      );

      if (confirm1) {
        const confirm2 = confirm(
          "BẠN CÓ THỰC SỰ CHẮC CHẮN? Tất cả dữ liệu Màu Sắc sẽ bị xóa sạch hoàn toàn!",
        );

        if (confirm2) {
          try {
            await MauSacService.deleteAll();
            alert("Đã xóa thành công tất cả Màu Sắc khỏi hệ thống!");
            this.retrieveMauSacs();
          } catch (error) {
            console.error(error);

            const errorMessage =
              error.response?.data?.message ||
              error.response?.data ||
              "Đã xảy ra lỗi khi xóa tất cả Màu Sắc.";

            alert(errorMessage);
          }
        }
      }
    },
  },

  mounted() {
    this.retrieveMauSacs();
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
