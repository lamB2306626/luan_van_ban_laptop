<template>
  <div class="container mt-3">
    <h4>Quản lý Khách Hàng</h4>

    <!-- Component Tìm kiếm Khách hàng -->
    <SearchKhachHang v-model="filter" @submit="retrieveKhachHangs" />

    <button class="btn btn-danger mb-3" @click="deleteAllKhachHangs">
      <i class="fas fa-trash"></i> Xóa tất cả Khách Hàng
    </button>

    <table class="table table-bordered table-striped align-middle">
      <thead class="table-dark">
        <tr>
          <th>Mã KH</th>
          <th>Họ và Tên</th>
          <th>Email</th>
          <th>Số điện thoại</th>
          <th class="text-center">Trạng thái</th>
          <th style="width: 160px" class="text-center">Hành động</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="khachHang in khachHangs" :key="khachHang.id">
          <td class="fw-bold">{{ khachHang.id }}</td>
          <td>{{ khachHang.ho_ten }}</td>
          <td>{{ khachHang.email || "Chưa cập nhật" }}</td>
          <td>{{ khachHang.so_dien_thoai || "Chưa cập nhật" }}</td>

          <!-- Trạng thái tài khoản -->
          <td class="text-center">
            <span
              class="badge"
              :class="khachHang.trang_thai ? 'bg-success' : 'bg-danger'"
            >
              {{ khachHang.trang_thai ? "Hoạt động" : "Đã khóa" }}
            </span>
          </td>

          <!-- Các nút thao tác -->
          <td class="text-center">
            <!-- Nút Khóa / Mở khóa tài khoản -->
            <button
              class="btn btn-sm"
              :class="khachHang.trang_thai ? 'btn-warning' : 'btn-success'"
              @click="toggleStatusKhachHang(khachHang)"
              :title="
                khachHang.trang_thai ? 'Khóa tài khoản' : 'Mở khóa tài khoản'
              "
            >
              <i
                :class="
                  khachHang.trang_thai
                    ? 'fas fa-user-lock'
                    : 'fas fa-user-check'
                "
              ></i>
              {{ khachHang.trang_thai ? " Khóa" : " Mở khóa" }}
            </button>
          </td>
        </tr>

        <!-- Hiển thị khi danh sách rỗng -->
        <tr v-if="khachHangs.length === 0">
          <td colspan="6" class="text-center py-3">
            Không tìm thấy khách hàng nào phù hợp.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import SearchKhachHang from "@/components/KhachHang/KhachHangSearch.vue";
import KhachHangService from "@/services/khach-hang.service";

export default {
  name: "KhachHangView",
  components: {
    SearchKhachHang,
  },
  data() {
    return {
      khachHangs: [],
      filter: {
        id: "",
        name: "",
        email: "",
        phone: "",
        id_hang_thanh_vien: "",
      },
    };
  },

  methods: {
    // ==================== 1. Lấy danh sách Khách Hàng theo bộ lọc ====================
    async retrieveKhachHangs() {
      try {
        // Gửi các tham số query tới Backend
        this.khachHangs = await KhachHangService.getAll(this.filter);
      } catch (error) {
        console.error("Lỗi khi tải danh sách khách hàng:", error);
      }
    },

    // ==================== 2. Khóa (Delete) / Mở khóa (Restore) Tài Khoản Khách Hàng ====================
    async toggleStatusKhachHang(khachHang) {
      const isLocking = khachHang.trang_thai;
      const actionText = isLocking ? "KHÓA" : "MỞ KHÓA";

      if (
        confirm(
          `Bạn có chắc chắn muốn ${actionText} tài khoản của khách hàng "${khachHang.ho_ten}" không?`,
        )
      ) {
        try {
          if (isLocking) {
            // Nếu tài khoản đang hoạt động -> Gọi hàm delete để Khóa tài khoản
            await KhachHangService.delete(khachHang.id);
          } else {
            // Nếu tài khoản đang bị khóa -> Gọi hàm restore để Khôi phục/Mở khóa tài khoản
            await KhachHangService.restore(khachHang.id);
          }

          alert(`${actionText} tài khoản thành công!`);
          this.retrieveKhachHangs();
        } catch (error) {
          console.error(error);
          const errorMessage =
            error.response?.data?.message ||
            error.response?.data ||
            `Có lỗi xảy ra khi ${actionText.toLowerCase()} tài khoản ${khachHang.id}`;

          alert(errorMessage);
        }
      }
    },

    // ==================== 3. Xóa tất cả Khách Hàng ====================
    async deleteAllKhachHangs() {
      const confirm1 = confirm(
        "CẢNH BÁO: Bạn có chắc chắn muốn xóa TẤT CẢ Khách Hàng không? Hành động này không thể hoàn tác!",
      );

      if (confirm1) {
        const confirm2 = confirm(
          "BẠN CÓ THỰC SỰ CHẮC CHẮN? Tất cả dữ liệu Khách Hàng sẽ bị xóa sạch hoàn toàn!",
        );

        if (confirm2) {
          try {
            await KhachHangService.deleteAll();
            alert("Đã xóa thành công tất cả Khách Hàng khỏi hệ thống!");
            this.retrieveKhachHangs();
          } catch (error) {
            console.error(error);

            // Trích xuất thông báo lỗi từ Backend Controller gửi về
            const errorMessage =
              error.response?.data?.message ||
              error.response?.data ||
              "Đã xảy ra lỗi khi xóa tất cả Khách Hàng.";

            alert(errorMessage);
          }
        }
      }
    },
  },

  // Tự động tải dữ liệu khi component được gắn vào DOM
  mounted() {
    this.retrieveKhachHangs();
  },
};
</script>
