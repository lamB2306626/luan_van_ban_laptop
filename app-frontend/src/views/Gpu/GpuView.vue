<template>
  <div class="container mt-3">
    <h4>Quản lý GPU (Vi xử lý)</h4>

    <!-- Component Tìm kiếm GPU -->
    <GpuSearch v-model="filter" @submit="retrieveGpus" />

    <button class="btn btn-primary mb-3" @click="goToAddGpu">
      <i class="fas fa-plus"></i> Thêm mới GPU
    </button>

    <button class="btn btn-danger mb-3 ms-2" @click="deleteAllGpus">
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
              @click="goToUpdateGpu(Gpu.id)"
            >
              <i class="fas fa-edit"></i> Cập nhật
            </button>

            <button
              class="btn btn-sm btn-danger"
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

  methods: {
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
      this.$router.push({ name: "gpu.add" });
    },

    // ==================== 3. Điều hướng tới Form Cập Nhật ====================
    goToUpdateGpu(id) {
      this.$router.push({
        name: "gpu.edit",
        params: { id: id },
      });
    },

    // ==================== 4. Xóa một GPU đơn lẻ ====================
    async deleteGpu(id) {
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
      const confirm1 = confirm(
        "CẢNH BÁO: Bạn có chắc chắn muốn xóa TẤT CẢ GPU không? Hành động này không thể hoàn tác!"
      );

      if (confirm1) {
        const confirm2 = confirm(
          "BẠN CÓ THỰC SỰ CHẮC CHẮN? Tất cả dữ liệu GPU sẽ bị xóa sạch hoàn toàn!"
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