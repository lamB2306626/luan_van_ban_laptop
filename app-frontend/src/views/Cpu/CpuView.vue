<template>
  <div class="container mt-3">
    <h4>Quản lý CPU (Vi xử lý)</h4>

    <!-- Component Tìm kiếm CPU -->
    <CpuSearch v-model="filter" @submit="retrieveCpus" />

    <button
      class="btn btn-primary mb-3"
      :class="{ 'btn-permission-muted': !canManageCPU }"
      @click="goToAddCpu"
    >
      <i class="fas fa-plus"></i> Thêm mới CPU
    </button>

    <button
      class="btn btn-danger mb-3 ms-2"
      :class="{ 'btn-permission-muted': !canManageCPU }"
      @click="deleteAllCpus"
    >
      <i class="fas fa-trash"></i> Xóa tất cả CPU
    </button>

    <table class="table table-bordered table-striped">
      <thead class="table-dark">
        <tr>
          <th>Mã CPU</th>
          <th>Tên CPU</th>
          <th style="width: 220px">Hành động</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="cpu in cpus" :key="cpu.id">
          <td>{{ cpu.id }}</td>
          <td>{{ cpu.ten_cpu }}</td>
          <td>
            <button
              class="btn btn-sm btn-secondary me-2"
              :class="{ 'btn-permission-muted': !canManageCPU }"
              @click="goToUpdateCpu(cpu.id)"
            >
              <i class="fas fa-edit"></i> Cập nhật
            </button>

            <button
              class="btn btn-sm btn-danger"
              :class="{ 'btn-permission-muted': !canManageCPU }"
              @click="deleteCpu(cpu.id)"
            >
              <i class="fas fa-trash"></i> Xóa
            </button>
          </td>
        </tr>

        <!-- Hiển thị khi danh sách rỗng -->
        <tr v-if="cpus.length === 0">
          <td colspan="3" class="text-center">
            Không tìm thấy CPU nào phù hợp.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import CpuSearch from "@/components/Cpu/CpuSearch.vue";
import CpuService from "@/services/cpu.service";

const ALLOWED_CPU_ROLES = ["Nhân viên kho", "Quản trị viên"];

export default {
  name: "CpuView",
  components: {
    CpuSearch,
  },
  data() {
    return {
      cpus: [],
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

    canManageCPU() {
      return !!this.adminRole && ALLOWED_CPU_ROLES.includes(this.adminRole);
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

    // ==================== 1. Lấy danh sách CPU theo bộ lọc ====================
    async retrieveCpus() {
      try {
        this.cpus = await CpuService.getAll(this.filter);
      } catch (error) {
        console.error("Lỗi khi tải danh sách CPU:", error);
      }
    },

    // ==================== 2. Điều hướng tới Form Thêm Mới ====================
    goToAddCpu() {
      if (!this.canManageCPU) {
        this.notifyAccessDenied();
        return;
      }
      this.$router.push({ name: "cpu.add" });
    },

    // ==================== 3. Điều hướng tới Form Cập Nhật ====================
    goToUpdateCpu(id) {
      if (!this.canManageCPU) {
        this.notifyAccessDenied();
        return;
      }
      this.$router.push({
        name: "cpu.edit",
        params: { id: id },
      });
    },

    // ==================== 4. Xóa một CPU đơn lẻ ====================
    async deleteCpu(id) {
      if (!this.canManageCPU) {
        this.notifyAccessDenied();
        return;
      }
      if (confirm(`Bạn có chắc chắn muốn xóa CPU có mã "${id}" không?`)) {
        try {
          await CpuService.delete(id);
          alert("Xóa CPU thành công!");
          this.retrieveCpus();
        } catch (error) {
          console.error(error);

          const errorMessage =
            error.response?.data?.message ||
            error.response?.data ||
            `Có lỗi xảy ra khi xóa CPU ${id}`;

          alert(errorMessage);
        }
      }
    },

    // ==================== 5. Xóa tất cả CPU ====================
    async deleteAllCpus() {
      if (!this.canManageCPU) {
        this.notifyAccessDenied();
        return;
      }
      const confirm1 = confirm(
        "CẢNH BÁO: Bạn có chắc chắn muốn xóa TẤT CẢ CPU không? Hành động này không thể hoàn tác!",
      );

      if (confirm1) {
        const confirm2 = confirm(
          "BẠN CÓ THỰC SỰ CHẮC CHẮN? Tất cả dữ liệu CPU sẽ bị xóa sạch hoàn toàn!",
        );

        if (confirm2) {
          try {
            await CpuService.deleteAll();
            alert("Đã xóa thành công tất cả CPU khỏi hệ thống!");
            this.retrieveCpus();
          } catch (error) {
            console.error(error);

            const errorMessage =
              error.response?.data?.message ||
              error.response?.data ||
              "Đã xảy ra lỗi khi xóa tất cả CPU.";

            alert(errorMessage);
          }
        }
      }
    },
  },

  mounted() {
    this.retrieveCpus();
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
