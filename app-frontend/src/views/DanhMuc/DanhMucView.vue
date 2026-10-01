<template>
  <div class="container mt-3">
    <h4>Quản lý Danh Mục</h4>

    <!-- Component Tìm kiếm Danh mục -->
    <SearchDanhMuc v-model="filter" @submit="retrieveDanhMucs" />

    <button class="btn btn-primary mb-3" @click="goToAddDanhMuc">
      <i class="fas fa-plus"></i> Thêm mới Danh Mục
    </button>

    <button class="btn btn-danger mb-3 ms-2" @click="deleteAllDanhMucs">
      <i class="fas fa-trash"></i> Xóa tất cả Danh Mục
    </button>

    <table class="table table-bordered table-striped">
      <thead class="table-dark">
        <tr>
          <th>Mã Danh Mục</th>
          <th>Tên Danh Mục</th>
          <th>Mô tả</th>
          <th style="width: 220px">Hành động</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="danhMuc in danhMucs" :key="danhMuc.id">
          <td>{{ danhMuc.id }}</td>
          <td>{{ danhMuc.ten_danh_muc }}</td>
          <td>{{ danhMuc.mo_ta || "Chưa có mô tả" }}</td>
          <td>
            <button
              class="btn btn-sm btn-secondary me-2"
              @click="goToUpdateDanhMuc(danhMuc.id)"
            >
              <i class="fas fa-edit"></i> Cập nhật
            </button>

            <button
              class="btn btn-sm btn-danger"
              @click="deleteDanhMuc(danhMuc.id)"
            >
              <i class="fas fa-trash"></i> Xóa
            </button>
          </td>
        </tr>

        <!-- Hiển thị khi danh sách rỗng -->
        <tr v-if="danhMucs.length === 0">
          <td colspan="4" class="text-center">
            Không tìm thấy danh mục nào phù hợp.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import SearchDanhMuc from "@/components/DanhMuc/DanhMucSearch.vue";
import DanhMucService from "@/services/danh-muc.service";

export default {
  name: "DanhMucView",
  components: {
    SearchDanhMuc,
  },
  data() {
    return {
      danhMucs: [],
      filter: {
        id: "",
        name: "",
      },
    };
  },

  methods: {
    // ==================== 1. Lấy danh sách Danh Mục theo bộ lọc ====================
    async retrieveDanhMucs() {
      try {
        // Gửi các tham số query { id: ..., name: ... } tới Backend
        this.danhMucs = await DanhMucService.getAll(this.filter);
      } catch (error) {
        console.error("Lỗi khi tải danh sách danh mục:", error);
      }
    },

    // ==================== 2. Điều hướng tới Form Thêm Mới Danh Mục ====================
    goToAddDanhMuc() {
      this.$router.push({ name: "danh-muc.add" });
    },

    // ==================== 3. Điều hướng tới Form Cập Nhật Danh Mục ====================
    goToUpdateDanhMuc(id) {
      this.$router.push({
        name: "danh-muc.edit",
        params: { id: id },
      });
    },

    // ==================== 4. Xóa một Danh Mục đơn lẻ ====================
    async deleteDanhMuc(id) {
      if (confirm(`Bạn có chắc chắn muốn xóa Danh Mục có mã "${id}" không?`)) {
        try {
          await DanhMucService.delete(id);
          alert("Xóa Danh Mục thành công!");
          this.retrieveDanhMucs();
        } catch (error) {
          console.error(error);

          // Trích xuất chính xác thông báo lỗi từ Backend Controller gửi về
          const errorMessage =
            error.response?.data?.message || // Lấy từ res.status(400).send({ message: "..." }) hoặc ApiError
            error.response?.data || // Nếu Backend gửi trực tiếp chuỗi text res.status(400).send("...")
            `Có lỗi xảy ra khi xóa danh mục ${id}`;

          // Hiển thị trực tiếp thông báo đó ra màn hình
          alert(errorMessage);
        }
      }
    },

    // ==================== 5. Xóa tất cả Danh Mục ====================
    async deleteAllDanhMucs() {
      const confirm1 = confirm(
        "CẢNH BÁO: Bạn có chắc chắn muốn xóa TẤT CẢ Danh Mục không? Hành động này không thể hoàn tác!",
      );

      if (confirm1) {
        const confirm2 = confirm(
          "BẠN CÓ THỰC SỰ CHẮC CHẮN? Tất cả dữ liệu Danh Mục sẽ bị xóa sạch hoàn toàn!",
        );

        if (confirm2) {
          try {
            await DanhMucService.deleteAll();
            alert("Đã xóa thành công tất cả Danh Mục khỏi hệ thống!");
            this.retrieveDanhMucs();
          } catch (error) {
            console.error(error);

            // Trích xuất thông báo lỗi từ Backend Controller gửi về
            const errorMessage =
              error.response?.data?.message ||
              error.response?.data ||
              "Đã xảy ra lỗi khi xóa tất cả Danh Mục.";

            alert(errorMessage);
          }
        }
      }
    },
  },

  // Tự động tải dữ liệu khi component được gắn vào DOM
  mounted() {
    this.retrieveDanhMucs();
  },
};
</script>
