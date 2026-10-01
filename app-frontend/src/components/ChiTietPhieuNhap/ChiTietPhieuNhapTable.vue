<template>
  <div class="table-responsive">
    <table class="table table-bordered table-hover align-middle mb-0">
      <thead class="table-dark">
        <tr>
          <th class="text-center" style="width: 50px">STT</th>
          <th>Sản Phẩm / Biến Thể</th>
          <th class="text-center" style="width: 120px">Số Lượng</th>
          <th class="text-end">Giá Nhập</th>
          <th class="text-end">Thành Tiền</th>
          <th class="text-center" style="width: 120px">Hành Động</th>
        </tr>
      </thead>

      <tbody>
        <!-- Trường hợp chưa có chi tiết phiếu nhập -->
        <tr v-if="!dsChiTiet || dsChiTiet.length === 0">
          <td colspan="6" class="text-center text-muted py-4">
            <i class="fas fa-box-open fa-2x mb-2 d-block"></i>
            Chưa có sản phẩm nào trong phiếu nhập này.
          </td>
        </tr>

        <!-- Duyệt danh sách chi tiết phiếu nhập -->
        <tr v-for="(item, index) in dsChiTiet" :key="item.id || index">
          <td class="text-center fw-bold">{{ index + 1 }}</td>

          <!-- Hiển thị thông tin Sản Phẩm / Biến Thể -->
          <td>
            <div class="fw-bold">
              <strong>{{ item.bien_the?.san_pham?.ten_san_pham }}</strong>
              <br />
              <span
                >{{ item.bien_the.cpu?.ten_cpu }} /
                {{ item.bien_the.gpu?.ten_gpu }}</span
              ><br />
              <small class="text-muted">
                RAM: {{ item.bien_the.dung_luong_ram?.dung_luong_ram }} | ROM:
                {{ item.bien_the.dung_luong_rom?.dung_luong_rom }} | Màu Sắc:
                {{ item.bien_the.mau_sac?.ten_mau_sac }}
              </small>
            </div>
          </td>

          <!-- Số lượng nhập -->
          <td class="text-center fw-bold">
            <span class="badge bg-info text-dark px-3 py-2 fs-6">
              {{ item.so_luong_nhap }}
            </span>
          </td>

          <!-- Giá nhập -->
          <td class="text-end fw-bold text-secondary">
            {{ formatCurrency(item.gia_nhap) }}
          </td>

          <!-- Thành tiền (Số lượng * Giá nhập) -->
          <td class="text-end fw-bold text-success fs-6">
            {{
              formatCurrency((item.so_luong_nhap || 0) * (item.gia_nhap || 0))
            }}
          </td>

          <!-- Thao tác Sửa / Xóa -->
          <td class="text-center">
            <button
              class="btn btn-sm btn-outline-warning me-1"
              title="Chỉnh sửa"
              @click="onEdit(item)"
            >
              <i class="fas fa-edit"></i>
            </button>
            <button
              class="btn btn-sm btn-outline-danger"
              title="Xóa sản phẩm"
              @click="onDelete(item)"
            >
              <i class="fas fa-trash-alt"></i>
            </button>
          </td>
        </tr>
      </tbody>

      <!-- Tổng tiền toàn bộ phiếu nhập ở chân bảng -->
      <tfoot v-if="dsChiTiet && dsChiTiet.length > 0" class="table-light">
        <tr>
          <td colspan="4" class="text-end fw-bold">Tổng Cộng Phiếu Nhập:</td>
          <td class="text-end fw-bold text-danger fs-5">
            {{ formatCurrency(tongTienPhieuNhap) }}
          </td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<script>
export default {
  name: "ChiTietPhieuNhapTable",
  props: {
    dsChiTiet: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["edit:chiTiet", "delete:chiTiet"],
  computed: {
    // Tự động tính tổng tiền của cả phiếu nhập từ danh sách chi tiết
    tongTienPhieuNhap() {
      return this.dsChiTiet.reduce((total, item) => {
        const sl = Number(item.so_luong_nhap) || 0;
        const gia = Number(item.gia_nhap) || 0;
        return total + sl * gia;
      }, 0);
    },
  },
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
