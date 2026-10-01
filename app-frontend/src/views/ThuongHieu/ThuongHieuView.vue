<template>
  <div class="container mt-3">
    <h4>Quản lý Thương Hiệu</h4>

    <!-- Component Tìm kiếm Thương hiệu -->
    <ThuongHieuSearch v-model="filter" @submit="retrieveThuongHieus" />

    <button class="btn btn-primary mb-3" @click="goToAddThuongHieu">
      <i class="fas fa-plus"></i> Thêm mới Thương Hiệu
    </button>

    <button class="btn btn-danger mb-3 ms-2" @click="deleteAllThuongHieus">
      <i class="fas fa-trash"></i> Xóa tất cả Thương Hiệu
    </button>

    <table class="table table-bordered table-striped">
      <thead class="table-dark">
        <tr>
          <th>Mã Thương Hiệu</th>
          <th>Tên Thương Hiệu</th>
          <th>Logo</th>
          <th>Mô tả</th>
          <th style="width: 220px">Hành động</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="thuongHieu in thuongHieus" :key="thuongHieu.id">
          <td>{{ thuongHieu.id }}</td>
          <td>{{ thuongHieu.ten_thuong_hieu }}</td>
          <td class="text-center">
            <img
              v-if="thuongHieu.lo_go"
              :src="`${API_URL}/uploads/ThuongHieu/${thuongHieu.lo_go}`"
              :alt="thuongHieu.ten_thuong_hieu"
              class="img-thumbnail"
              style="max-height: 60px; max-width: 100px; object-fit: contain"
            />
            <span v-else class="badge bg-secondary">Không có logo</span>
          </td>
          <td>{{ thuongHieu.mo_ta || "Chưa có mô tả" }}</td>
          <td>
            <button
              class="btn btn-sm btn-secondary me-2"
              @click="goToUpdateThuongHieu(thuongHieu.id)"
            >
              <i class="fas fa-edit"></i> Cập nhật
            </button>

            <button
              class="btn btn-sm btn-danger"
              @click="deleteThuongHieu(thuongHieu.id)"
            >
              <i class="fas fa-trash"></i> Xóa
            </button>
          </td>
        </tr>

        <!-- Hiển thị khi danh sách rỗng -->
        <tr v-if="thuongHieus.length === 0">
          <td colspan="5" class="text-center">
            Không tìm thấy thương hiệu nào phù hợp.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import ThuongHieuSearch from "@/components/ThuongHieu/ThuongHieuSearch.vue";
import ThuongHieuService from "@/services/thuong-hieu.service";
const API_URL = import.meta.env.VITE_API_BASE_URL;

export default {
  name: "ThuongHieuView",
  components: {
    ThuongHieuSearch,
  },
  data() {
    return {
      API_URL,
      thuongHieus: [],
      filter: {
        id: "",
        name: "",
      },
    };
  },

  methods: {
    // ==================== 1. Lấy danh sách Thương Hiệu theo bộ lọc ====================
    async retrieveThuongHieus() {
      try {
        this.thuongHieus = await ThuongHieuService.getAll(this.filter);
      } catch (error) {
        console.error("Lỗi khi tải danh sách thương hiệu:", error);
      }
    },

    // ==================== 2. Điều hướng tới Form Thêm Mới ====================
    goToAddThuongHieu() {
      this.$router.push({ name: "thuong-hieu.add" });
    },

    // ==================== 3. Điều hướng tới Form Cập Nhật ====================
    goToUpdateThuongHieu(id) {
      this.$router.push({
        name: "thuong-hieu.edit",
        params: { id: id },
      });
    },

    // ==================== 4. Xóa một Thương Hiệu đơn lẻ ====================
    async deleteThuongHieu(id) {
      if (
        confirm(`Bạn có chắc chắn muốn xóa Thương Hiệu có mã "${id}" không?`)
      ) {
        try {
          await ThuongHieuService.delete(id);
          alert("Xóa Thương Hiệu thành công!");
          this.retrieveThuongHieus();
        } catch (error) {
          console.error(error);

          const errorMessage =
            error.response?.data?.message ||
            error.response?.data ||
            `Có lỗi xảy ra khi xóa thương hiệu ${id}`;

          alert(errorMessage);
        }
      }
    },

    // ==================== 5. Xóa tất cả Thương Hiệu ====================
    async deleteAllThuongHieus() {
      const confirm1 = confirm(
        "CẢNH BÁO: Bạn có chắc chắn muốn xóa TẤT CẢ Thương Hiệu không? Hành động này không thể hoàn tác!",
      );

      if (confirm1) {
        const confirm2 = confirm(
          "BẠN CÓ THỰC SỰ CHẮC CHẮN? Tất cả dữ liệu Thương Hiệu sẽ bị xóa sạch hoàn toàn!",
        );

        if (confirm2) {
          try {
            await ThuongHieuService.deleteAll();
            alert("Đã xóa thành công tất cả Thương Hiệu khỏi hệ thống!");
            this.retrieveThuongHieus();
          } catch (error) {
            console.error(error);

            const errorMessage =
              error.response?.data?.message ||
              error.response?.data ||
              "Đã xảy ra lỗi khi xóa tất cả Thương Hiệu.";

            alert(errorMessage);
          }
        }
      }
    },
  },

  mounted() {
    this.retrieveThuongHieus();
  },
};
</script>
