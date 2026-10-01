<template>
  <div class="container mt-3">
    <h4>Quản lý Thông Báo</h4>

    <!-- Component Tìm kiếm Thông báo -->
    <ThongBaoSearch v-model="filter" @submit="retrieveThongBaos" />

    <button class="btn btn-primary mb-3" @click="goToAddThongBao">
      <i class="fas fa-plus"></i> Thêm mới Thông Báo
    </button>

    <button class="btn btn-danger mb-3 ms-2" @click="deleteAllThongBaos">
      <i class="fas fa-trash"></i> Xóa tất cả Thông Báo
    </button>

    <button class="btn btn-success mb-3" @click="goToGuiThongBao">
      <i class="fas fa-paper-plane me-1"></i> Gửi Thông Báo
    </button>

    <table class="table table-bordered table-striped align-middle">
      <thead class="table-dark">
        <tr>
          <th>Mã Thông Báo</th>
          <th>Tiêu Đề</th>
          <th>Nội Dung</th>
          <th>Liên Kết</th>
          <th>Ngày Tạo</th>
          <th style="width: 220px">Hành động</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="thongBao in thongBaos" :key="thongBao.id">
          <td>{{ thongBao.id }}</td>
          <td class="fw-bold">{{ thongBao.tieu_de }}</td>
          <td>{{ truncateText(thongBao.noi_dung, 60) }}</td>
          <td>{{ truncateText(thongBao.lien_ket) }}</td>
          <td>{{ formatDate(thongBao.ngay_tao) }}</td>
          <td>
            <button
              class="btn btn-sm btn-success"
              @click="goToGuiThongBaoOne(thongBao.id)"
            >
              <i class="fas fa-paper-plane me-1"></i> Gửi Thông Báo
            </button>

            <button
              class="btn btn-sm btn-secondary me-2"
              @click="goToUpdateThongBao(thongBao.id)"
            >
              <i class="fas fa-edit"></i> Cập nhật
            </button>

            <button
              class="btn btn-sm btn-danger"
              @click="deleteThongBao(thongBao.id)"
            >
              <i class="fas fa-trash"></i> Xóa
            </button>
          </td>
        </tr>

        <!-- Hiển thị khi danh sách rỗng -->
        <tr v-if="thongBaos.length === 0">
          <td colspan="6" class="text-center">
            Không tìm thấy thông báo nào phù hợp.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import ThongBaoSearch from "@/components/ThongBao/ThongBaoSearch.vue";
import ThongBaoService from "@/services/thong-bao.service";

export default {
  name: "ThongBaoView",
  components: {
    ThongBaoSearch,
  },
  data() {
    return {
      thongBaos: [],
      filter: {
        id: "",
        title: "",
      },
    };
  },

  methods: {
    // Định dạng hiển thị ngày tạo (VD: 30/09/2026 17:30)
    formatDate(value) {
      if (!value) return "";
      const date = new Date(value);
      return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },

    // Rút gọn nội dung dài để hiển thị trên bảng
    truncateText(text, length = 50) {
      if (!text) return "";
      return text.length > length ? text.substring(0, length) + "..." : text;
    },

    // ==================== 1. Lấy danh sách Thông Báo theo bộ lọc ====================
    async retrieveThongBaos() {
      try {
        // Gửi tham số query { id: ..., title: ... } tới Backend
        this.thongBaos = await ThongBaoService.getAll(this.filter);
      } catch (error) {
        console.error("Lỗi khi tải danh sách thông báo:", error);
      }
    },

    // ==================== 2. Điều hướng tới Form Thêm Mới ====================
    goToAddThongBao() {
      this.$router.push({ name: "thong-bao.add" });
    },

    // ==================== 3. Điều hướng tới Form Cập Nhật ====================
    goToUpdateThongBao(id) {
      this.$router.push({
        name: "thong-bao.edit",
        params: { id: id },
      });
    },

    // ==================== 4. Điều hướng tới form gửi Thông Báo cho khách hàng ====================
    async goToGuiThongBao() {
      this.$router.push({ name: "gui-thong-bao" });
    },

    async goToGuiThongBaoOne(id) {
      this.$router.push({
        name: "gui-thong-bao",
        params: { id: id },
      });
    },

    // ==================== 5. Xóa một Thông Báo đơn lẻ ====================
    async deleteThongBao(id) {
      if (confirm(`Bạn có chắc chắn muốn xóa Thông Báo có mã "${id}" không?`)) {
        try {
          await ThongBaoService.delete(id);
          alert("Xóa Thông Báo thành công!");
          this.retrieveThongBaos();
        } catch (error) {
          console.error(error);

          const errorMessage =
            error.response?.data?.message ||
            error.response?.data ||
            `Có lỗi xảy ra khi xóa thông báo ${id}`;

          alert(errorMessage);
        }
      }
    },

    // ==================== 6. Xóa tất cả Thông Báo ====================
    async deleteAllThongBaos() {
      const confirm1 = confirm(
        "CẢNH BÁO: Bạn có chắc chắn muốn xóa TẤT CẢ Thông Báo không? Hành động này không thể hoàn tác!",
      );

      if (confirm1) {
        const confirm2 = confirm(
          "BẠN CÓ THỰC SỰ CHẮC CHẮN? Tất cả dữ liệu Thông Báo sẽ bị xóa sạch hoàn toàn!",
        );

        if (confirm2) {
          try {
            await ThongBaoService.deleteAll();
            alert("Đã xóa thành công tất cả Thông Báo khỏi hệ thống!");
            this.retrieveThongBaos();
          } catch (error) {
            console.error(error);

            const errorMessage =
              error.response?.data?.message ||
              error.response?.data ||
              "Đã xảy ra lỗi khi xóa tất cả Thông Báo.";

            alert(errorMessage);
          }
        }
      }
    },
  },

  // Tự động tải dữ liệu khi component được gắn vào DOM
  mounted() {
    this.retrieveThongBaos();
  },
};
</script>
