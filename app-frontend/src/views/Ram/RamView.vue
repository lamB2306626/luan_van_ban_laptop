<template>
  <div class="container mt-3">
    <h4>Quản lý Dung Lượng RAM</h4>

    <!-- Component Tìm kiếm RAM -->
    <RamSearch v-model="filter" @submit="retrieveRams" />

    <button class="btn btn-primary mb-3" @click="goToAddRam">
      <i class="fas fa-plus"></i> Thêm mới RAM
    </button>

    <button class="btn btn-danger mb-3 ms-2" @click="deleteAllRams">
      <i class="fas fa-trash"></i> Xóa tất cả RAM
    </button>

    <table class="table table-bordered table-striped">
      <thead class="table-dark">
        <tr>
          <th>Mã RAM</th>
          <th>Dung Lượng RAM</th>
          <th style="width: 220px">Hành động</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="ram in rams" :key="ram.id">
          <td>{{ ram.id }}</td>
          <td>{{ ram.dung_luong_ram }}</td>
          <td>
            <button
              class="btn btn-sm btn-secondary me-2"
              @click="goToUpdateRam(ram.id)"
            >
              <i class="fas fa-edit"></i> Cập nhật
            </button>

            <button
              class="btn btn-sm btn-danger"
              @click="deleteRam(ram.id)"
            >
              <i class="fas fa-trash"></i> Xóa
            </button>
          </td>
        </tr>

        <!-- Hiển thị khi danh sách rỗng -->
        <tr v-if="rams.length === 0">
          <td colspan="3" class="text-center">
            Không tìm thấy dung lượng RAM nào phù hợp.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import RamSearch from "@/components/Ram/RamSearch.vue";
import RamService from "@/services/ram.service";

export default {
  name: "RamView",
  components: {
    RamSearch,
  },
  data() {
    return {
      rams: [],
      filter: {
        id: "",
        name: "",
      },
    };
  },

  methods: {
    // ==================== 1. Lấy danh sách RAM theo bộ lọc ====================
    async retrieveRams() {
      try {
        this.rams = await RamService.getAll(this.filter);
      } catch (error) {
        console.error("Lỗi khi tải danh sách RAM:", error);
      }
    },

    // ==================== 2. Điều hướng tới Form Thêm Mới ====================
    goToAddRam() {
      this.$router.push({ name: "ram.add" });
    },

    // ==================== 3. Điều hướng tới Form Cập Nhật ====================
    goToUpdateRam(id) {
      this.$router.push({
        name: "ram.edit",
        params: { id: id },
      });
    },

    // ==================== 4. Xóa một RAM đơn lẻ ====================
    async deleteRam(id) {
      if (confirm(`Bạn có chắc chắn muốn xóa RAM có mã "${id}" không?`)) {
        try {
          await RamService.delete(id);
          alert("Xóa RAM thành công!");
          this.retrieveRams();
        } catch (error) {
          console.error(error);

          const errorMessage =
            error.response?.data?.message ||
            error.response?.data ||
            `Có lỗi xảy ra khi xóa RAM ${id}`;

          alert(errorMessage);
        }
      }
    },

    // ==================== 5. Xóa tất cả RAM ====================
    async deleteAllRams() {
      const confirm1 = confirm(
        "CẢNH BÁO: Bạn có chắc chắn muốn xóa TẤT CẢ RAM không? Hành động này không thể hoàn tác!"
      );

      if (confirm1) {
        const confirm2 = confirm(
          "BẠN CÓ THỰC SỰ CHẮC CHẮN? Tất cả dữ liệu RAM sẽ bị xóa sạch hoàn toàn!"
        );

        if (confirm2) {
          try {
            await RamService.deleteAll();
            alert("Đã xóa thành công tất cả RAM khỏi hệ thống!");
            this.retrieveRams();
          } catch (error) {
            console.error(error);

            const errorMessage =
              error.response?.data?.message ||
              error.response?.data ||
              "Đã xảy ra lỗi khi xóa tất cả RAM.";

            alert(errorMessage);
          }
        }
      }
    },
  },

  mounted() {
    this.retrieveRams();
  },
};
</script>