<template>
  <div class="container mt-3">
    <h4>Quản lý Nhà Cung Cấp</h4>

    <!-- Component Tìm kiếm Nhà Cung Cấp -->
    <NhaCungCapSearch v-model="filter" @submit="retrieveNhaCungCaps" />

    <button class="btn btn-primary mb-3" @click="goToAddNhaCungCap">
      <i class="fas fa-plus"></i> Thêm mới Nhà Cung Cấp
    </button>

    <button class="btn btn-danger mb-3 ms-2" @click="deleteAllNhaCungCaps">
      <i class="fas fa-trash"></i> Xóa tất cả Nhà Cung Cấp
    </button>

    <table class="table table-bordered table-striped">
      <thead class="table-dark">
        <tr>
          <th>Mã NCC</th>
          <th>Tên Nhà Cung Cấp</th>
          <th>Số Điện Thoại</th>
          <th>Email</th>
          <th>Địa Chỉ</th>
          <th style="width: 220px">Hành động</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="ncc in nhaCungCaps" :key="ncc.id">
          <td>{{ ncc.id }}</td>
          <td>{{ ncc.ten_ncc }}</td>
          <td>{{ ncc.so_dien_thoai }}</td>
          <td>{{ ncc.email || "Chưa có email" }}</td>
          <td>{{ ncc.dia_chi }}</td>
          <td>
            <button
              class="btn btn-sm btn-secondary me-2"
              @click="goToUpdateNhaCungCap(ncc.id)"
            >
              <i class="fas fa-edit"></i> Cập nhật
            </button>

            <button
              class="btn btn-sm btn-danger"
              @click="deleteNhaCungCap(ncc.id)"
            >
              <i class="fas fa-trash"></i> Xóa
            </button>
          </td>
        </tr>

        <!-- Hiển thị khi danh sách rỗng -->
        <tr v-if="nhaCungCaps.length === 0">
          <td colspan="6" class="text-center">
            Không tìm thấy nhà cung cấp nào phù hợp.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import NhaCungCapSearch from "@/components/NhaCungCap/NhaCungCapSearch.vue";
import NhaCungCapService from "@/services/nha-cung-cap.service";

export default {
  name: "NhaCungCapView",
  components: {
    NhaCungCapSearch,
  },
  data() {
    return {
      nhaCungCaps: [],
      filter: {
        id: "",
        name: "",
      },
    };
  },

  methods: {
    // ==================== 1. Lấy danh sách Nhà Cung Cấp theo bộ lọc ====================
    async retrieveNhaCungCaps() {
      try {
        this.nhaCungCaps = await NhaCungCapService.getAll(this.filter);
      } catch (error) {
        console.error("Lỗi khi tải danh sách nhà cung cấp:", error);
      }
    },

    // ==================== 2. Điều hướng tới Form Thêm Mới ====================
    goToAddNhaCungCap() {
      this.$router.push({ name: "nha-cung-cap.add" });
    },

    // ==================== 3. Điều hướng tới Form Cập Nhật ====================
    goToUpdateNhaCungCap(id) {
      this.$router.push({
        name: "nha-cung-cap.edit",
        params: { id: id },
      });
    },

    // ==================== 4. Xóa một Nhà Cung Cấp đơn lẻ ====================
    async deleteNhaCungCap(id) {
      if (confirm(`Bạn có chắc chắn muốn xóa Nhà Cung Cấp có mã "${id}" không?`)) {
        try {
          await NhaCungCapService.delete(id);
          alert("Xóa Nhà Cung Cấp thành công!");
          this.retrieveNhaCungCaps();
        } catch (error) {
          console.error(error);

          const errorMessage =
            error.response?.data?.message ||
            error.response?.data ||
            `Có lỗi xảy ra khi xóa nhà cung cấp ${id}`;

          alert(errorMessage);
        }
      }
    },

    // ==================== 5. Xóa tất cả Nhà Cung Cấp ====================
    async deleteAllNhaCungCaps() {
      const confirm1 = confirm(
        "CẢNH BÁO: Bạn có chắc chắn muốn xóa TẤT CẢ Nhà Cung Cấp không? Hành động này không thể hoàn tác!"
      );

      if (confirm1) {
        const confirm2 = confirm(
          "BẠN CÓ THỰC SỰ CHẮC CHẮN? Tất cả dữ liệu Nhà Cung Cấp sẽ bị xóa sạch hoàn toàn!"
        );

        if (confirm2) {
          try {
            await NhaCungCapService.deleteAll();
            alert("Đã xóa thành công tất cả Nhà Cung Cấp khỏi hệ thống!");
            this.retrieveNhaCungCaps();
          } catch (error) {
            console.error(error);

            const errorMessage =
              error.response?.data?.message ||
              error.response?.data ||
              "Đã xảy ra lỗi khi xóa tất cả Nhà Cung Cấp.";

            alert(errorMessage);
          }
        }
      }
    },
  },

  mounted() {
    this.retrieveNhaCungCaps();
  },
};
</script>