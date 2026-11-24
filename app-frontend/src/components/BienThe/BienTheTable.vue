<template>
  <table class="table table-bordered">
    <thead class="table-dark">
      <tr>
        <th class="text-center" style="width: 50px">Mã BT</th>
        <th class="text-center">Ảnh biến thể</th>
        <th>Cấu Hình (CPU / GPU / RAM / ROM)</th>
        <th class="text-end">Giá Bán</th>
        <th class="text-end">Giá áp dụng</th>
        <th class="text-center">Tồn Kho</th>
        <th class="text-center">Trạng thái</th>
        <th style="width: 220px">Hành Động</th>
      </tr>
    </thead>

    <tbody>
      <!-- Trường hợp không có biến thể -->
      <tr v-if="!dsBienThe || dsBienThe.length === 0">
        <td colspan="8" class="text-center text-muted py-4">
          <i class="fas fa-inbox fa-2x mb-2 d-block"></i>
          {{
            isTrash
              ? "Thùng rác biến thể đang trống."
              : "Chưa có biến thể nào được tạo cho sản phẩm này."
          }}
        </td>
      </tr>

      <!-- Duyệt danh sách biến thể -->
      <tr v-for="(item, index) in dsBienThe" :key="item.id || index">
        <td class="text-center fw-bold">{{ item.id }}</td>

        <!-- Hiển thị ảnh biến thể -->
        <td class="text-center">
          <img
            v-if="item.duong_dan_anh"
            :src="`${API_URL}/uploads/BienThe/${item.duong_dan_anh}`"
            :alt="item.san_pham?.ten_san_pham"
            class="img-thumbnail"
            style="max-height: 60px; max-width: 100px; object-fit: contain"
          />
          <span v-else class="badge bg-secondary">Không có ảnh</span>
        </td>

        <!-- Hiển thị cấu hình lồng object từ API -->
        <td>
          <strong>{{ item.cpu?.ten_cpu || item.id_cpu }}</strong> /
          <span>{{ item.gpu?.ten_gpu || item.id_gpu }}</span
          ><br />
          <small class="text-muted">
            RAM: {{ item.dung_luong_ram?.dung_luong_ram }} | ROM:
            {{ item.dung_luong_rom?.dung_luong_rom }} | Màu Sắc:
            {{ item.mau_sac?.ten_mau_sac }}
          </small>
        </td>

        <!-- Giá bán -->
        <td class="text-end fw-bold text-primary">
          {{ formatCurrency(item.gia) }}
        </td>

        <!-- Giá áp dụng (sau khi tính khuyến mãi) -->
        <td class="text-end fw-bold text-primary">
          {{ formatCurrency(item.don_gia_ap_dung) }}
        </td>

        <!-- Số lượng tồn kho -->
        <td class="text-center">
          <span
            :class="['badge', item.so_luong > 0 ? 'bg-success' : 'bg-danger']"
          >
            {{ item.so_luong }}
          </span>
        </td>

        <!-- Trạng thái biến thể -->
        <td class="text-center">
          <span v-if="item.trang_thai" class="badge bg-success">
            Đang kinh doanh
          </span>
          <span v-else class="badge bg-secondary"> Ngừng kinh doanh </span>
        </td>

        <!-- Thao tác Sửa / Xóa hoặc Khôi phục -->
        <td>
          <!-- Nút Cập nhật (Ẩn đi hoặc giữ lại tùy bạn, ở thùng rác thường chỉ cần khôi phục) -->
          <button
            v-if="!isTrash"
            class="btn btn-sm btn-secondary me-1"
            title="Chỉnh sửa"
            @click="onEdit(item)"
            :class="{ 'btn-permission-muted': !canManageSanPham }"
            :disabled="item.san_pham.is_delete"
          >
            <i class="fas fa-edit"></i> Sửa
          </button>

          <!-- Nút Đổi trạng thái (Chỉ hiện khi ở trang quản lý chính, ẩn ở thùng rác nếu muốn) -->
          <button
            v-if="!isTrash"
            class="btn btn-sm me-2"
            :class="[
              item.trang_thai ? 'btn-warning' : 'btn-success',
              { 'btn-permission-muted': !canManageSanPham },
            ]"
            @click="onToggleStatus(item)"
            :disabled="item.san_pham.is_delete"
          >
            <i :class="item.trang_thai ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            {{ item.trang_thai ? " Ngừng" : " Mở bán" }}
          </button>

          <!-- Nút Xóa mềm (khi ở danh sách chính) hoặc Khôi phục (khi ở thùng rác) -->
          <button
            class="btn btn-sm"
            :class="[
              item.is_delete ? 'btn-success' : 'btn-danger',
              { 'btn-permission-muted': !canManageSanPham },
            ]"
            @click="onDeleteOrRestore(item)"
            :disabled="item.san_pham.is_delete"
            :title="item.is_delete ? 'Khôi phục biến thể' : 'Xóa mềm biến thể'"
          >
            <i
              :class="item.is_delete ? 'fas fa-trash-restore' : 'fas fa-trash'"
            ></i>
            {{ item.is_delete ? " Khôi phục" : " Xóa" }}
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script>
const API_URL = import.meta.env.VITE_API_BASE_URL;

export default {
  name: "BienTheTable",
  data() {
    return {
      API_URL,
    };
  },
  props: {
    dsBienThe: {
      type: Array,
      default: () => [],
    },
    // Nhận cờ phân biệt đang ở danh sách chính hay thùng rác
    isTrash: {
      type: Boolean,
      default: false,
    },
    canManageSanPham: {
      type: Boolean,
      default: false, // người dùng hiện tại có quyền thêm/sửa sản phẩm hay không
    },
  },
  emits: ["edit:bienThe", "toggle-status", "delete:bienThe", "restore:bienThe"],
  methods: {
    // ==================== Phát tín hiệu không có quyền thực hiện thao tác ====================
    notifyAccessDenied(message = "Bạn không có quyền thực hiện thao tác này!") {
      window.dispatchEvent(
        new CustomEvent("admin-access-denied", {
          detail: { message },
        }),
      );
    },

    // Hàm format số tiền sang định dạng VNĐ (VD: 15.000.000 ₫)
    formatCurrency(value) {
      if (!value && value !== 0) return "0 ₫";
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value);
    },

    // Phát sự kiện Yêu cầu Sửa ra cho Component cha
    onEdit(item) {
      if (!this.canManageSanPham) {
        this.notifyAccessDenied();
        return;
      }
      this.$emit("edit:bienThe", item);
    },

    onToggleStatus(item) {
      if (!this.canManageSanPham) {
        this.notifyAccessDenied();
        return;
      }
      this.$emit("toggle-status", item);
    },

    // Xử lý chung: Nếu ở thùng rác thì phát sự kiện restore, ở ngoài thì phát sự kiện delete
    onDeleteOrRestore(item) {
      if (!this.canManageSanPham) {
        this.notifyAccessDenied();
        return;
      }
      if (this.isTrash) {
        this.$emit("restore:bienThe", item);
      } else {
        this.$emit("delete:bienThe", item);
      }
    },
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
