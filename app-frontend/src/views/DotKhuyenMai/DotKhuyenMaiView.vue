<template>
  <div class="container mt-3">
    <h4>Quản lý Đợt Khuyến Mãi</h4>

    <!-- Component Tìm kiếm Đợt Khuyến Mãi -->
    <SearchDotKhuyenMai v-model="filter" @submit="retrieveDotKhuyenMais" />

    <button
      class="btn btn-primary mb-3"
      :class="{ 'btn-permission-muted': !canManageDotKhuyenMai }"
      @click="goToAddDotKhuyenMai"
    >
      <i class="fas fa-plus"></i> Thêm mới Đợt Khuyến Mãi
    </button>

    <button
      class="btn btn-danger mb-3 ms-2"
      :class="{ 'btn-permission-muted': !canManageDotKhuyenMai }"
      @click="deleteAllDotKhuyenMais"
    >
      <i class="fas fa-trash"></i> Xóa tất cả Đợt Khuyến Mãi
    </button>

    <table class="table table-bordered table-striped align-middle">
      <thead class="table-dark">
        <tr>
          <th>Mã Đợt</th>
          <th>Tên Đợt Khuyến Mãi</th>
          <th>Ngày Bắt Đầu</th>
          <th>Ngày Kết Thúc</th>
          <th>Trạng Thái</th>
          <th style="width: 220px">Hành động</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="dotKM in dotKhuyenMais" :key="dotKM.id">
          <td class="fw-bold">{{ dotKM.id }}</td>
          <td>{{ dotKM.ten_dot }}</td>
          <td>{{ formatDate(dotKM.ngay_bat_dau) }}</td>
          <td>{{ formatDate(dotKM.ngay_ket_thuc) }}</td>
          <td>
            <span
              class="badge"
              :class="
                isKhaDung(dotKM.ngay_bat_dau, dotKM.ngay_ket_thuc)
                  ? 'bg-success'
                  : 'bg-secondary'
              "
            >
              {{
                isKhaDung(dotKM.ngay_bat_dau, dotKM.ngay_ket_thuc)
                  ? "Còn hiệu lực"
                  : "Hết hiệu lực"
              }}
            </span>
          </td>
          <td>
            <button
              class="btn btn-sm btn-secondary me-2"
              @click="goToDotKhuyenMaiDetail(dotKM.id)"
            >
              <i class="fas fa-info"></i> Chi tiết
            </button>

            <button
              class="btn btn-sm btn-danger"
              :class="{ 'btn-permission-muted': !canManageDotKhuyenMai }"
              @click="deleteDotKhuyenMai(dotKM.id)"
            >
              <i class="fas fa-trash"></i> Xóa
            </button>
          </td>
        </tr>

        <!-- Hiển thị khi danh sách rỗng -->
        <tr v-if="dotKhuyenMais.length === 0">
          <td colspan="6" class="text-center">
            Không tìm thấy đợt khuyến mãi nào phù hợp.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import SearchDotKhuyenMai from "@/components/DotKhuyenMai/DotKhuyenMaiSearch.vue";
import DotKhuyenMaiService from "@/services/dot-khuyen-mai.service";

const ALLOWED_DOT_KHUYEN_MAI_ROLES = ["Nhân viên Marketing", "Quản trị viên"];

export default {
  name: "DotKhuyenMaiView",
  components: {
    SearchDotKhuyenMai,
  },
  data() {
    return {
      dotKhuyenMais: [],
      filter: {
        id: "",
        name: "",
        tu_ngay: "",
        den_ngay: "",
        kha_dung: "",
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

    canManageDotKhuyenMai() {
      return (
        !!this.adminRole &&
        ALLOWED_DOT_KHUYEN_MAI_ROLES.includes(this.adminRole)
      );
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

    // ==================== 1. Lấy danh sách Đợt Khuyến Mãi theo bộ lọc ====================
    async retrieveDotKhuyenMais() {
      try {
        // Gửi query filter khớp 100% với req.query bên Controller Node.js
        this.dotKhuyenMais = await DotKhuyenMaiService.getAll(this.filter);
      } catch (error) {
        console.error("Lỗi khi tải danh sách đợt khuyến mãi:", error);
      }
    },

    // ==================== 2. Điều hướng tới Form Thêm Mới ====================
    goToAddDotKhuyenMai() {
      if (!this.canManageDotKhuyenMai) {
        this.notifyAccessDenied();
        return;
      }
      this.$router.push({ name: "dot-khuyen-mai.add" });
    },

    // ==================== 3. Điều hướng tới Form Cập Nhật ====================
    goToDotKhuyenMaiDetail(id) {
      this.$router.push({
        name: "dot-khuyen-mai.detail",
        params: { id: id },
      });
    },

    // ==================== 4. Xóa một Đợt Khuyến Mãi ====================
    async deleteDotKhuyenMai(id) {
      if (!this.canManageDotKhuyenMai) {
        this.notifyAccessDenied();
        return;
      }
      if (
        confirm(`Bạn có chắc chắn muốn xóa Đợt Khuyến Mãi có mã "${id}" không?`)
      ) {
        try {
          await DotKhuyenMaiService.delete(id);
          alert("Xóa Đợt Khuyến Mãi thành công!");
          this.retrieveDotKhuyenMais();
        } catch (error) {
          console.error(error);
          const errorMessage =
            error.response?.data?.message ||
            error.response?.data ||
            `Có lỗi xảy ra khi xóa đợt khuyến mãi ${id}`;

          alert(errorMessage);
        }
      }
    },

    // ==================== 5. Xóa tất cả Đợt Khuyến Mãi ====================
    async deleteAllDotKhuyenMais() {
      if (!this.canManageDotKhuyenMai) {
        this.notifyAccessDenied();
        return;
      }
      const confirm1 = confirm(
        "CẢNH BÁO: Bạn có chắc chắn muốn xóa TẤT CẢ Đợt Khuyến Mãi không? Hành động này không thể hoàn tác!",
      );

      if (confirm1) {
        const confirm2 = confirm(
          "BẠN CÓ THỰC SỰ CHẮC CHẮN? Tất cả dữ liệu Đợt Khuyến Mãi sẽ bị xóa sạch hoàn toàn!",
        );

        if (confirm2) {
          try {
            await DotKhuyenMaiService.deleteAll();
            alert("Đã xóa thành công tất cả Đợt Khuyến Mãi khỏi hệ thống!");
            this.retrieveDotKhuyenMais();
          } catch (error) {
            console.error(error);
            const errorMessage =
              error.response?.data?.message ||
              error.response?.data ||
              "Đã xảy ra lỗi khi xóa tất cả Đợt Khuyến Mãi.";

            alert(errorMessage);
          }
        }
      }
    },

    // ==================== Helper: Format Ngày Tháng (DD/MM/YYYY) ====================
    formatDate(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN");
    },

    // ==================== Helper: Kiểm tra Trạng thái Khả dụng ====================
    isKhaDung(tuNgay, denNgay) {
      const now = new Date();
      const start = new Date(tuNgay);
      const end = new Date(denNgay);
      return now >= start && now <= end;
    },
  },

  mounted() {
    this.retrieveDotKhuyenMais();
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
