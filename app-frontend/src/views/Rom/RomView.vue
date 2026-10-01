<template>
  <div class="container mt-3">
    <h4>Quản lý Dung Lượng ROM</h4>

    <!-- Component Tìm kiếm ROM -->
    <RomSearch v-model="filter" @submit="retrieveRoms" />

    <button class="btn btn-primary mb-3" @click="goToAddRom">
      <i class="fas fa-plus"></i> Thêm mới ROM
    </button>

    <button class="btn btn-danger mb-3 ms-2" @click="deleteAllRoms">
      <i class="fas fa-trash"></i> Xóa tất cả ROM
    </button>

    <table class="table table-bordered table-striped">
      <thead class="table-dark">
        <tr>
          <th>Mã ROM</th>
          <th>Dung Lượng ROM</th>
          <th style="width: 220px">Hành động</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="rom in roms" :key="rom.id">
          <td>{{ rom.id }}</td>
          <td>{{ rom.dung_luong_rom }}</td>
          <td>
            <button
              class="btn btn-sm btn-secondary me-2"
              @click="goToUpdateRom(rom.id)"
            >
              <i class="fas fa-edit"></i> Cập nhật
            </button>

            <button
              class="btn btn-sm btn-danger"
              @click="deleteRom(rom.id)"
            >
              <i class="fas fa-trash"></i> Xóa
            </button>
          </td>
        </tr>

        <!-- Hiển thị khi danh sách rỗng -->
        <tr v-if="roms.length === 0">
          <td colspan="3" class="text-center">
            Không tìm thấy dung lượng ROM nào phù hợp.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import RomSearch from "@/components/Rom/RomSearch.vue";
import RomService from "@/services/rom.service";

export default {
  name: "RomView",
  components: {
    RomSearch,
  },
  data() {
    return {
      roms: [],
      filter: {
        id: "",
        name: "",
      },
    };
  },

  methods: {
    // ==================== 1. Lấy danh sách ROM theo bộ lọc ====================
    async retrieveRoms() {
      try {
        this.roms = await RomService.getAll(this.filter);
      } catch (error) {
        console.error("Lỗi khi tải danh sách ROM:", error);
      }
    },

    // ==================== 2. Điều hướng tới Form Thêm Mới ====================
    goToAddRom() {
      this.$router.push({ name: "rom.add" });
    },

    // ==================== 3. Điều hướng tới Form Cập Nhật ====================
    goToUpdateRom(id) {
      this.$router.push({
        name: "rom.edit",
        params: { id: id },
      });
    },

    // ==================== 4. Xóa một ROM đơn lẻ ====================
    async deleteRom(id) {
      if (confirm(`Bạn có chắc chắn muốn xóa ROM có mã "${id}" không?`)) {
        try {
          await RomService.delete(id);
          alert("Xóa ROM thành công!");
          this.retrieveRoms();
        } catch (error) {
          console.error(error);

          const errorMessage =
            error.response?.data?.message ||
            error.response?.data ||
            `Có lỗi xảy ra khi xóa ROM ${id}`;

          alert(errorMessage);
        }
      }
    },

    // ==================== 5. Xóa tất cả ROM ====================
    async deleteAllRoms() {
      const confirm1 = confirm(
        "CẢNH BÁO: Bạn có chắc chắn muốn xóa TẤT CẢ ROM không? Hành động này không thể hoàn tác!"
      );

      if (confirm1) {
        const confirm2 = confirm(
          "BẠN CÓ THỰC SỰ CHẮC CHẮN? Tất cả dữ liệu ROM sẽ bị xóa sạch hoàn toàn!"
        );

        if (confirm2) {
          try {
            await RomService.deleteAll();
            alert("Đã xóa thành công tất cả ROM khỏi hệ thống!");
            this.retrieveRoms();
          } catch (error) {
            console.error(error);

            const errorMessage =
              error.response?.data?.message ||
              error.response?.data ||
              "Đã xảy ra lỗi khi xóa tất cả ROM.";

            alert(errorMessage);
          }
        }
      }
    },
  },

  mounted() {
    this.retrieveRoms();
  },
};
</script>