<template>
    <table class="table table-bordered align-middle mb-0">
      <thead class="table-dark">
        <tr>
          <th class="text-center" style="width: 50px">STT</th>
          <th class="text-center" style="width: 120px">Mã SP</th>
          <th>Tên Sản Phẩm</th>
          <th class="text-center" style="width: 160px">Loại Giảm Giá</th>
          <th class="text-center" style="width: 160px">Giá Trị Giảm</th>
          <th class="text-center" style="width: 120px">Hành Động</th>
        </tr>
      </thead>

      <tbody>
        <!-- Trường hợp chưa có sản phẩm khuyến mãi nào -->
        <tr v-if="!dsChiTiet || dsChiTiet.length === 0">
          <td colspan="6" class="text-center text-muted py-4">
            <i class="fas fa-tags fa-2x mb-2 d-block"></i>
            Chưa có sản phẩm nào trong đợt khuyến mãi này.
          </td>
        </tr>

        <!-- Duyệt danh sách chi tiết khuyến mãi -->
        <tr v-for="(item, index) in dsChiTiet" :key="item.id || index">
          <td class="text-center fw-bold">{{ index + 1 }}</td>

          <!-- Mã Sản Phẩm -->
          <td class="text-center fw-bold text-secondary">
            {{ item.san_pham?.id || item.id_san_pham }}
          </td>

          <!-- Tên Sản Phẩm -->
          <td>
            <div class="fw-bold text-dark">
              {{ item.san_pham?.ten_san_pham || "Chưa xác định" }}
            </div>
          </td>

          <!-- Loại giảm giá -->
          <td class="text-center">
            <span
              class="badge"
              :class="item.loai_giam_gia === 'PHAN_TRAM' ? 'bg-info text-dark' : 'bg-primary'"
            >
              {{ item.loai_giam_gia === 'PHAN_TRAM' ? 'Theo Phần Trăm' : 'Số Tiền Cố Định' }}
            </span>
          </td>

          <!-- Giá trị giảm -->
          <td class="text-center fw-bold text-danger">
            <span v-if="item.loai_giam_gia === 'PHAN_TRAM'">
              -{{ item.gia_tri_giam }}%
            </span>
            <span v-else>
              -{{ formatCurrency(item.gia_tri_giam) }}
            </span>
          </td>

          <!-- Thao tác Sửa / Xóa chi tiết -->
          <td class="text-center">
            <button
              class="btn btn-sm btn-outline-warning me-1"
              title="Chỉnh sửa mức giảm giá"
              @click="onEdit(item)"
            >
              <i class="fas fa-edit"></i>
            </button>
            <button
              class="btn btn-sm btn-outline-danger"
              title="Xóa khỏi đợt khuyến mãi"
              @click="onDelete(item)"
            >
              <i class="fas fa-trash-alt"></i>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
</template>

<script>
export default {
  name: "ChiTietKhuyenMaiTable",
  props: {
    dsChiTiet: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["edit:chiTiet", "delete:chiTiet"],
  methods: {
    // Format số tiền sang định dạng VNĐ
    formatCurrency(value) {
      if (!value && value !== 0) return "0 ₫";
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value);
    },

    // Phát sự kiện Yêu cầu Sửa ra cho Component cha
    onEdit(item) {
      this.$emit("edit:chiTiet", item);
    },

    // Phát sự kiện Yêu cầu Xóa ra cho Component cha
    onDelete(item) {
      this.$emit("delete:chiTiet", item);
    },
  },
};
</script>