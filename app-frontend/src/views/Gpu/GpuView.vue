<template>
  <div class="container mt-3">
    <h4>Quản lý GPU (Vi xử lý)</h4>

    <!-- Component Tìm kiếm GPU -->
    <GpuSearch v-model="filter" @submit="retrieveGpus" />

    <button
      class="btn btn-primary mb-3"
      :class="{ 'btn-permission-muted': !canManageGPU }"
      @click="goToAddGpu"
    >
      <i class="fas fa-plus"></i> Thêm mới GPU
    </button>

    <button
      class="btn btn-danger mb-3 ms-2"
      :class="{ 'btn-permission-muted': !canManageGPU }"
      @click="deleteAllGpus"
    >
      <i class="fas fa-trash"></i> Xóa tất cả GPU
    </button>

    <table class="table table-bordered table-striped">
      <thead class="table-dark">
        <tr>
          <th>Mã GPU</th>
          <th>Tên GPU</th>
          <th style="width: 220px">Hành động</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="Gpu in Gpus" :key="Gpu.id">
          <td>{{ Gpu.id }}</td>
          <td>{{ Gpu.ten_gpu }}</td>
          <td>
            <button
              class="btn btn-sm btn-secondary me-2"
              :class="{ 'btn-permission-muted': !canManageGPU }"
              @click="goToUpdateGpu(Gpu.id)"
            >
              <i class="fas fa-edit"></i> Cập nhật
            </button>

            <button
              class="btn btn-sm btn-danger"
              :class="{ 'btn-permission-muted': !canManageGPU }"
              @click="deleteGpu(Gpu.id)"
            >
              <i class="fas fa-trash"></i> Xóa
            </button>
          </td>
        </tr>

        <!-- Hiển thị khi danh sách rỗng -->
        <tr v-if="Gpus.length === 0">
          <td colspan="3" class="text-center">
            Không tìm thấy GPU nào phù hợp.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import GpuSearch from "@/components/Gpu/GpuSearch.vue";
import GpuService from "@/services/gpu.service";

const ALLOWED_GPU_ROLES = ["Nhân viên kho", "Quản trị viên"];

export default {
  name: "GpuView",
  components: {
    GpuSearch,
  },
  data() {
    return {
      Gpus: [],
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

    canManageGPU() {
      return !!this.adminRole && ALLOWED_GPU_ROLES.includes(this.adminRole);
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

    // ==================== 1. Lấy danh sách GPU theo bộ lọc ====================
    async retrieveGpus() {
      try {
        this.Gpus = await GpuService.getAll(this.filter);
      } catch (error) {
        console.error("Lỗi khi tải danh sách GPU:", error);
      }
    },

    // ==================== 2. Điều hướng tới Form Thêm Mới ====================
    goToAddGpu() {
      if (!this.canManageGPU) {
        this.notifyAccessDenied();
        return;
      }
      this.$router.push({ name: "gpu.add" });
    },

    // ==================== 3. Điều hướng tới Form Cập Nhật ====================
    goToUpdateGpu(id) {
      if (!this.canManageGPU) {
        this.notifyAccessDenied();
        return;
      }
      this.$router.push({
        name: "gpu.edit",
        params: { id: id },
      });
    },

    // ==================== 4. Xóa một GPU đơn lẻ ====================
    async deleteGpu(id) {
      if (!this.canManageGPU) {
        this.notifyAccessDenied();
        return;
      }
      if (confirm(`Bạn có chắc chắn muốn xóa GPU có mã "${id}" không?`)) {
        try {
          await GpuService.delete(id);
          alert("Xóa GPU thành công!");
          this.retrieveGpus();
        } catch (error) {
          console.error(error);

          const errorMessage =
            error.response?.data?.message ||
            error.response?.data ||
            `Có lỗi xảy ra khi xóa GPU ${id}`;

          alert(errorMessage);
        }
      }
    },

    // ==================== 5. Xóa tất cả GPU ====================
    async deleteAllGpus() {
      if (!this.canManageGPU) {
        this.notifyAccessDenied();
        return;
      }
      const confirm1 = confirm(
        "CẢNH BÁO: Bạn có chắc chắn muốn xóa TẤT CẢ GPU không? Hành động này không thể hoàn tác!",
      );

      if (confirm1) {
        const confirm2 = confirm(
          "BẠN CÓ THỰC SỰ CHẮC CHẮN? Tất cả dữ liệu GPU sẽ bị xóa sạch hoàn toàn!",
        );

        if (confirm2) {
          try {
            await GpuService.deleteAll();
            alert("Đã xóa thành công tất cả GPU khỏi hệ thống!");
            this.retrieveGpus();
          } catch (error) {
            console.error(error);

            const errorMessage =
              error.response?.data?.message ||
              error.response?.data ||
              "Đã xảy ra lỗi khi xóa tất cả GPU.";

            alert(errorMessage);
          }
        }
      }
    },
  },

  mounted() {
    this.retrieveGpus();
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
