<template>
  <table class="table table-bordered table-striped">
    <thead class="table-dark">
      <tr>
        <th class="text-center" style="width: 50px">Mã BT</th>
        <th class="text-center">Ảnh biến thể</th>
        <th>Cấu Hình (CPU / GPU / RAM / ROM)</th>
        <th class="text-end">Giá Bán</th>
        <th class="text-end">Giá áp dụng</th>
        <th class="text-center">Tồn Kho</th>
        <th class="text-center">Trạng Thái</th>
        <th style="width: 220px">Hành Động</th>
      </tr>
    </thead>

    <tbody>
      <!-- Trường hợp không có biến thể -->
      <tr v-if="!dsBienThe || dsBienThe.length === 0">
        <td colspan="7" class="text-center text-muted py-4">
          <i class="fas fa-inbox fa-2x mb-2 d-block"></i>
          Chưa có biến thể nào được tạo cho sản phẩm này.
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

        <!-- Hiển thị cấu hình lồng object từ API (hoặc mã nếu chưa populate) -->
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

        <!-- Trạng thái -->
        <td class="text-center">
          <span
            :class="[
              'badge',
              item.trang_thai ? 'bg-info text-dark' : 'bg-secondary',
            ]"
          >
            {{ item.trang_thai ? "Kinh doanh" : "Ngừng kinh doanh" }}
          </span>
        </td>

        <!-- Thao tác Sửa / Xóa -->
        <td>
          <button
            class="btn btn-sm btn-secondary"
            title="Chỉnh sửa"
            @click="onEdit(item)"
          >
            <i class="fas fa-edit"></i> Cập nhật
          </button>
          <button
            class="btn btn-sm btn-danger"
            title="Xóa biến thể"
            @click="onDelete(item)"
          >
            <i class="fas fa-trash-alt"></i> Xóa
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
  },
  emits: ["edit:bienThe", "delete:bienThe"],
  methods: {
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
      this.$emit("edit:bienThe", item);
    },

    // Phát sự kiện Yêu cầu Xóa ra cho Component cha
    onDelete(item) {
      this.$emit("delete:bienThe", item);
    },
  },
};
</script>
