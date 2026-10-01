<template>
  <div class="container mt-3">
    <h4>Quản lý Hạng Thành Viên</h4>

    <!-- Component Tìm kiếm Hạng thành viên -->
    <HangThanhVienSearch v-model="filter" @submit="retrieveHangThanhViens" />

    <button class="btn btn-primary mb-3" @click="goToAddHangThanhVien">
      <i class="fas fa-plus"></i> Thêm mới Hạng Thành Viên
    </button>

    <button class="btn btn-danger mb-3 ms-2" @click="deleteAllHangThanhViens">
      <i class="fas fa-trash"></i> Xóa tất cả Hạng Thành Viên
    </button>

    <table class="table table-bordered table-striped align-middle">
      <thead class="table-dark">
        <tr>
          <th>Mã Hạng</th>
          <th>Tên Hạng Thành Viên</th>
          <th>Mốc Chi Tiêu Tối Thiểu</th>
          <th>Tặng phiếu</th>
          <th style="width: 220px">Hành động</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="hang in hangThanhViens" :key="hang.id">
          <td>{{ hang.id }}</td>
          <td class="fw-bold">{{ hang.ten_hang }}</td>
          <td>{{ formatCurrency(hang.moc_chi_tieu) }}</td>
          <td>
            <!-- Lặp danh sách phiếu qua quan hệ phieu_hang_thanh_vien -->
            <div
              v-if="
                hang.phieu_hang_thanh_vien &&
                hang.phieu_hang_thanh_vien.length > 0
              "
              class="d-flex flex-wrap gap-1"
            >
              <span
                v-for="phtv in hang.phieu_hang_thanh_vien"
                :key="phtv.id"
                class="badge bg-info text-dark"
              >
                <i class="fas fa-ticket-alt me-1"></i>
                {{ phtv.phieu_giam_gia?.ten_phieu}}
              </span>
            </div>
            <span v-else class="text-muted fst-italic">Không có phiếu</span>
          </td>
          <td>
            <button
              class="btn btn-sm btn-secondary me-2"
              @click="goToUpdateHangThanhVien(hang.id)"
            >
              <i class="fas fa-edit"></i> Cập nhật
            </button>

            <button
              class="btn btn-sm btn-danger"
              @click="deleteHangThanhVien(hang.id)"
            >
              <i class="fas fa-trash"></i> Xóa
            </button>
          </td>
        </tr>

        <!-- Hiển thị khi danh sách rỗng -->
        <tr v-if="hangThanhViens.length === 0">
          <td colspan="4" class="text-center">
            Không tìm thấy hạng thành viên nào phù hợp.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import HangThanhVienSearch from "@/components/HangThanhVien/HangThanhVienSearch.vue";
import HangThanhVienService from "@/services/hang-thanh-vien.service";

export default {
  name: "HangThanhVienView",
  components: {
    HangThanhVienSearch,
  },
  data() {
    return {
      hangThanhViens: [],
      filter: {
        id: "",
        name: "",
      },
    };
  },

  methods: {
    // Định dạng hiển thị mốc chi tiêu theo đơn vị VNĐ
    formatCurrency(value) {
      if (!value && value !== 0) return "0 đ";
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value);
    },

    // ==================== 1. Lấy danh sách Hạng Thành Viên theo bộ lọc ====================
    async retrieveHangThanhViens() {
      try {
        // Gửi các tham số query { id: ..., name: ... } tới Backend
        this.hangThanhViens = await HangThanhVienService.getAll(this.filter);
      } catch (error) {
        console.error("Lỗi khi tải danh sách hạng thành viên:", error);
      }
    },

    // ==================== 2. Điều hướng tới Form Thêm Mới ====================
    goToAddHangThanhVien() {
      this.$router.push({ name: "hang-thanh-vien.add" });
    },

    // ==================== 3. Điều hướng tới Form Cập Nhật ====================
    goToUpdateHangThanhVien(id) {
      this.$router.push({
        name: "hang-thanh-vien.edit",
        params: { id: id },
      });
    },

    // ==================== 4. Xóa một Hạng Thành Viên đơn lẻ ====================
    async deleteHangThanhVien(id) {
      if (
        confirm(
          `Bạn có chắc chắn muốn xóa Hạng Thành Viên có mã "${id}" không?`,
        )
      ) {
        try {
          await HangThanhVienService.delete(id);
          alert("Xóa Hạng Thành Viên thành công!");
          this.retrieveHangThanhViens();
        } catch (error) {
          console.error(error);

          const errorMessage =
            error.response?.data?.message ||
            error.response?.data ||
            `Có lỗi xảy ra khi xóa hạng thành viên ${id}`;

          alert(errorMessage);
        }
      }
    },

    // ==================== 5. Xóa tất cả Hạng Thành Viên ====================
    async deleteAllHangThanhViens() {
      const confirm1 = confirm(
        "CẢNH BÁO: Bạn có chắc chắn muốn xóa TẤT CẢ Hạng Thành Viên không? Hành động này không thể hoàn tác!",
      );

      if (confirm1) {
        const confirm2 = confirm(
          "BẠN CÓ THỰC SỰ CHẮC CHẮN? Tất cả dữ liệu Hạng Thành Viên sẽ bị xóa sạch hoàn toàn!",
        );

        if (confirm2) {
          try {
            await HangThanhVienService.deleteAll();
            alert("Đã xóa thành công tất cả Hạng Thành Viên khỏi hệ thống!");
            this.retrieveHangThanhViens();
          } catch (error) {
            console.error(error);

            const errorMessage =
              error.response?.data?.message ||
              error.response?.data ||
              "Đã xảy ra lỗi khi xóa tất cả Hạng Thành Viên.";

            alert(errorMessage);
          }
        }
      }
    },
  },

  // Tự động tải dữ liệu khi component được gắn vào DOM
  mounted() {
    this.retrieveHangThanhViens();
  },
};
</script>
