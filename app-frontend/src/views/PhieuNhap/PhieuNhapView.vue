<template>
  <div class="container mt-3">
    <h4>Quản lý Phiếu Nhập</h4>

    <!-- Component Tìm kiếm Phiếu nhập -->
    <SearchPhieuNhap v-model="filter" @submit="retrievePhieuNhaps" />

    <button class="btn btn-primary mb-3" @click="goToAddPhieuNhap">
      <i class="fas fa-plus"></i> Tạo Phiếu Nhập Mới
    </button>

    <button class="btn btn-danger mb-3 ms-2" @click="deleteAllPhieuNhaps">
      <i class="fas fa-trash"></i> Xóa tất cả Phiếu Nhập
    </button>

    <table class="table table-bordered table-striped">
      <thead class="table-dark">
        <tr>
          <th>Mã Phiếu</th>
          <th>Nhân Viên Lập</th>
          <th>Ngày Nhập</th>
          <th>Tổng Tiền</th>
          <th style="width: 220px">Hành động</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="phieuNhap in phieuNhaps" :key="phieuNhap.id">
          <td>{{ phieuNhap.id }}</td>
          <td>
            {{ phieuNhap.nhan_vien?.ho_ten || phieuNhap.id_nhan_vien }}
          </td>
          <td>{{ formatDate(phieuNhap.ngay_nhap) }}</td>
          <td class="fw-bold text-success">
            {{ formatCurrency(phieuNhap.tong_tien) }}
          </td>
          <td>
            <button
              class="btn btn-sm btn-secondary me-2"
              @click="goToPhieuNhapDetail(phieuNhap.id)"
            >
              <i class="fas fa-info"></i> Chi tiết
            </button>

            <button
              class="btn btn-sm btn-danger"
              @click="deletePhieuNhap(phieuNhap.id)"
            >
              <i class="fas fa-trash"></i> Xóa
            </button>
          </td>
        </tr>

        <!-- Hiển thị khi danh sách rỗng -->
        <tr v-if="phieuNhaps.length === 0">
          <td colspan="5" class="text-center">
            Không tìm thấy phiếu nhập nào phù hợp.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import SearchPhieuNhap from "@/components/PhieuNhap/PhieuNhapSearch.vue";
import PhieuNhapService from "@/services/phieu-nhap.service";

export default {
  name: "PhieuNhapView",
  components: {
    SearchPhieuNhap,
  },
  data() {
    return {
      phieuNhaps: [],
      filter: {
        id: "",
        ngay_bat_dau: "",
        ngay_ket_thuc: "",
      },
    };
  },

  methods: {
    // Định dạng tiền tệ VNĐ
    formatCurrency(value) {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value || 0);
    },

    // Định dạng ngày tháng
    formatDate(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleString("vi-VN");
    },

    // ==================== 1. Lấy danh sách Phiếu Nhập theo bộ lọc ====================
    async retrievePhieuNhaps() {
      try {
        // Gửi các tham số query { id: ..., ngay_bat_dau: ..., ngay_ket_thuc: ... } tới Backend
        this.phieuNhaps = await PhieuNhapService.getAll(this.filter);
      } catch (error) {
        console.error("Lỗi khi tải danh sách phiếu nhập:", error);
      }
    },

    // ==================== 2. Điều hướng tới Form Tạo Mới Phiếu Nhập ====================
    goToAddPhieuNhap() {
      this.$router.push({ name: "phieu-nhap.add" });
    },

    // ==================== 3. Điều hướng tới Form Cập Nhật Phiếu Nhập ====================
    goToPhieuNhapDetail(id) {
      this.$router.push({
        name: "phieu-nhap.detail",
        params: { id: id },
      });
    },

    // ==================== 4. Xóa một Phiếu Nhập đơn lẻ ====================
    async deletePhieuNhap(id) {
      if (confirm(`Bạn có chắc chắn muốn xóa Phiếu Nhập có mã "${id}" không?`)) {
        try {
          await PhieuNhapService.delete(id);
          alert("Xóa Phiếu Nhập thành công!");
          this.retrievePhieuNhaps();
        } catch (error) {
          console.error(error);

          // Trích xuất chính xác thông báo lỗi từ Backend Controller gửi về
          const errorMessage =
            error.response?.data?.message ||
            error.response?.data ||
            `Có lỗi xảy ra khi xóa phiếu nhập ${id}`;

          // Hiển thị trực tiếp thông báo đó ra màn hình
          alert(errorMessage);
        }
      }
    },

    // ==================== 5. Xóa tất cả Phiếu Nhập ====================
    async deleteAllPhieuNhaps() {
      const confirm1 = confirm(
        "CẢNH BÁO: Bạn có chắc chắn muốn xóa TẤT CẢ Phiếu Nhập không? Hành động này không thể hoàn tác!"
      );

      if (confirm1) {
        const confirm2 = confirm(
          "BẠN CÓ THỰC SỰ CHẮC CHẮN? Tất cả dữ liệu Phiếu Nhập sẽ bị xóa sạch hoàn toàn!"
        );

        if (confirm2) {
          try {
            await PhieuNhapService.deleteAll();
            alert("Đã xóa thành công tất cả Phiếu Nhập khỏi hệ thống!");
            this.retrievePhieuNhaps();
          } catch (error) {
            console.error(error);

            // Trích xuất thông báo lỗi từ Backend Controller gửi về
            const errorMessage =
              error.response?.data?.message ||
              error.response?.data ||
              "Đã xảy ra lỗi khi xóa tất cả Phiếu Nhập.";

            alert(errorMessage);
          }
        }
      }
    },
  },

  // Tự động tải dữ liệu khi component được gắn vào DOM
  mounted() {
    this.retrievePhieuNhaps();
  },
};
</script>