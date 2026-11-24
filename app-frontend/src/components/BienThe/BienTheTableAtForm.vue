<template>
  <div class="table-responsive w-100">
    <table class="table table-bordered">
      <thead class="table-dark text-center align-middle">
        <tr>
          <th style="width: 50px">STT</th>
          <th>Cấu Hình (CPU / GPU / RAM / ROM)</th>
          <th style="width: 140px" class="text-end">Giá Bán</th>
          <th style="width: 100px">Hành Động</th>
        </tr>
      </thead>

      <tbody>
        <!-- Trường hợp chưa có biến thể tạm nào -->
        <tr v-if="!dsBienThe || dsBienThe.length === 0">
          <td colspan="6" class="text-center text-muted py-4">
            <i class="fas fa-inbox fa-2x mb-2 d-block"></i>
            Chưa có biến thể nào được thêm vào danh sách tạm.
          </td>
        </tr>

        <!-- Duyệt danh sách biến thể tạm -->
        <tr v-for="(item, index) in dsBienThe" :key="item.id || index">
          <!-- Số thứ tự 1, 2, 3... -->
          <td class="text-center fw-bold">{{ index + 1 }}</td>

          <!-- Cấu hình phần cứng -->
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

          <!-- Giá bán lẻ -->
          <td class="text-end fw-bold text-success">
            {{ formatCurrency(item.gia) }}
          </td>

          <!-- Nút Sửa và Xóa khỏi danh sách tạm -->
          <td class="text-center">
            <!-- Thêm type="button" để tránh kích hoạt submit Form cha -->
            <button
              type="button"
              class="btn btn-sm btn-secondary"
              @click="onEdit(item)"
            >
              <i class="fas fa-edit"></i> Cập nhật
            </button>

            <button
              type="button"
              class="btn btn-sm btn-outline-danger"
              title="Xóa biến thể tạm này"
              @click="onRemove(item)"
            >
              <i class="fas fa-trash-alt me-1"></i> Xóa
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: "BienTheTableAtForm",
  props: {
    dsBienThe: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["edit:bienThe", "delete:bienThe"],
  methods: {
    // Định dạng số tiền sang chuẩn Việt Nam (VD: 15.000.000 ₫)
    formatCurrency(value) {
      if (!value && value !== 0) return "0 ₫";
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value);
    },

    // Phát sự kiện Yêu cầu Sửa ra cho Component cha
    onEdit(item) {
      this.$emit("edit:bienThe", item);
    },

    // Phát sự kiện xóa phần tử khỏi mảng tạm
    onRemove(item) {
      this.$emit("delete:bienThe", item);
    },
  },
};
</script>

<style scoped>
th {
  white-space: nowrap;
}
</style>
