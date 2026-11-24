<template>
  <div class="container-fluid mt-3">
    <!-- Tiêu đề trang & Nút Thêm mới -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="text-primary fw-bold mb-0">
        <i class="fas fa-users-cog me-2"></i>Quản Lý Nhân Viên
      </h4>
      <button class="btn btn-primary" @click="goToAddNhanVien">
        <i class="fas fa-user-plus me-1"></i> Thêm Nhân Viên Mới
      </button>
    </div>

    <!-- Component Tìm Kiếm -->
    <NhanVienSearch v-model="searchParams" @submit="retrievenhanViens" />

    <!-- Thông báo Alert (Nếu có) -->
    <div
      v-if="message"
      class="alert alert-info alert-dismissible fade show py-2 mb-3"
      role="alert"
    >
      {{ message }}
      <button
        type="button"
        class="btn-close py-2"
        @click="message = ''"
      ></button>
    </div>

    <!-- Bảng Danh Sách Nhân Viên -->
    <table class="table table-bordered table-striped">
      <thead class="table-dark">
        <tr>
          <th class="text-center" style="width: 60px">STT</th>
          <th>Mã NV</th>
          <th>Họ Và Tên</th>
          <th>Email</th>
          <th class="text-center">Vai Trò</th>
          <th class="text-center">Trạng Thái</th>
          <th style="width: 220px">Hành Động</th>
        </tr>
      </thead>
      <tbody>
        <!-- Trạng thái trống -->
        <tr v-if="dsNhanVien.length === 0">
          <td colspan="7" class="text-center text-muted py-4">
            <i class="fas fa-user-slash fa-2x mb-2 d-block"></i>
            Không tìm thấy nhân viên nào!
          </td>
        </tr>

        <!-- Duyệt danh sách nhân viên -->
        <tr v-for="(nv, index) in dsNhanVien" :key="nv.id">
          <td class="text-center fw-bold">{{ index + 1 }}</td>
          <td>
            <span class="badge bg-light text-dark border">{{ nv.id }}</span>
          </td>
          <td class="fw-bold">{{ nv.ho_ten }}</td>
          <td>{{ nv.email }}</td>

          <!-- Vai trò (Lấy từ object relation vai_tro hoặc id_vai_tro) -->
          <td class="text-center">
            <span class="badge bg-secondary">
              {{ nv.vai_tro?.ten_vai_tro || nv.id_vai_tro }}
            </span>
          </td>

          <!-- Trạng thái (true: Hoạt động / false: Bị khóa) -->
          <td class="text-center">
            <span
              :class="['badge', nv.trang_thai ? 'bg-success' : 'bg-danger']"
            >
              {{ nv.trang_thai ? "Hoạt động" : "Đã khóa" }}
            </span>
          </td>

          <!-- Nút thao tác -->
          <td class="text-center">
            <button
              class="btn btn-sm btn-secondary me-2"
              title="Chỉnh sửa nhân viên"
              @click="goToEditNhanVien(nv.id)"
            >
              <i class="fas fa-user-edit"></i> Cập nhật
            </button>

            <!-- Nút Khóa / Mở khóa tài khoản -->
            <button
              class="btn btn-sm"
              :class="nv.trang_thai ? 'btn-warning' : 'btn-success'"
              @click="toggleStatusnhanVien(nv)"
              :title="nv.trang_thai ? 'Khóa tài khoản' : 'Mở khóa tài khoản'"
            >
              <i
                :class="
                  nv.trang_thai ? 'fas fa-user-lock' : 'fas fa-user-check'
                "
              ></i>
              {{ nv.trang_thai ? " Khóa" : " Mở khóa" }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import NhanVienSearch from "@/components/NhanVien/NhanVienSearch.vue";
import NhanVienService from "@/services/nhan-vien.service";

export default {
  name: "NhanVienView",
  components: {
    NhanVienSearch,
  },
  data() {
    return {
      dsNhanVien: [],
      searchParams: {
        id: "",
        ho_ten: "",
        email: "",
      },
      message: "",
    };
  },
  methods: {
    // Lấy danh sách nhân viên kết hợp bộ lọc searchParams
    async retrievenhanViens() {
      try {
        if (NhanVienService) {
          this.dsNhanVien = await NhanVienService.getAll(this.searchParams);
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách nhân viên:", error);
        this.message = "Không thể tải danh sách nhân viên.";
      }
    },

    // Chuyển hướng sang trang tạo mới nhân viên
    goToAddNhanVien() {
      this.$router.push({ name: "nhan-vien.add" });
    },

    // Chuyển hướng sang trang sửa nhân viên theo ID
    goToEditNhanVien(id) {
      this.$router.push({ name: "nhan-vien.edit", params: { id } });
    },

    // ==================== 2. Khóa (Delete) / Mở khóa (Restore) Tài Khoản Nhân Viên ====================
    async toggleStatusnhanVien(nhanVien) {
      const isLocking = nhanVien.trang_thai;
      const actionText = isLocking ? "KHÓA" : "MỞ KHÓA";

      if (
        confirm(
          `Bạn có chắc chắn muốn ${actionText} tài khoản của nhân viên "${nhanVien.ho_ten}" không?`,
        )
      ) {
        try {
          if (isLocking) {
            // Nếu tài khoản đang hoạt động -> Gọi hàm delete để Khóa tài khoản
            await NhanVienService.delete(nhanVien.id);
          } else {
            // Nếu tài khoản đang bị khóa -> Gọi hàm restore để Khôi phục/Mở khóa tài khoản
            await NhanVienService.restore(nhanVien.id);
          }

          alert(`${actionText} tài khoản thành công!`);
          this.retrievenhanViens();
        } catch (error) {
          console.error(error);
          const errorMessage =
            error.response?.data?.message ||
            error.response?.data ||
            `Có lỗi xảy ra khi ${actionText.toLowerCase()} tài khoản ${nhanVien.id}`;

          alert(errorMessage);
        }
      }
    },
  },
  mounted() {
    this.retrievenhanViens();
  },
};
</script>
