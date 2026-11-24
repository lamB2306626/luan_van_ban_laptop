<!-- src/components/SanPham/SanPhamTable.vue -->
<template>
  <table class="table table-bordered table-striped align-middle">
    <thead class="table-dark">
      <tr>
        <th>Mã SP</th>
        <th>Ảnh SP</th>
        <th>Tên Sản Phẩm</th>
        <th>Thương Hiệu</th>
        <th>Danh Mục</th>
        <!-- <th>Nhà Cung Cấp</th> -->
        <th>Mô Tả</th>
        <th>Trạng Thái</th>
        <th style="width: 220px">Hành động</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="sanPham in sanPhams" :key="sanPham.id">
        <td>{{ sanPham.id }}</td>
        <td class="text-center">
          <img
            :src="getAnh(sanPham)"
            :alt="sanPham.ten_san_pham"
            class="img-thumbnail"
            style="max-height: 60px; max-width: 100px; object-fit: contain"
          />
        </td>
        <td>
          <strong>{{ sanPham.ten_san_pham }}</strong>
        </td>
        <td>{{ sanPham.thuong_hieu?.ten_thuong_hieu }}</td>
        <td>{{ sanPham.danh_muc?.ten_danh_muc }}</td>
        <!-- <td>
          <span
            v-for="item in sanPham.nha_cung_cap_san_pham"
            :key="item.id"
            class="badge bg-info text-dark me-1 mb-1"
          >
            {{ item.nha_cung_cap?.ten_ncc }}
          </span>
        </td> -->
        <td>{{ sanPham.mo_ta || "Chưa có mô tả" }}</td>

        <!-- Trạng thái sản phẩm -->
        <td class="text-center">
          <span
            v-if="sanPham.trang_thai === 'DANG_KINH_DOANH'"
            class="badge bg-success"
          >
            Đang kinh doanh
          </span>
          <span
            v-else-if="sanPham.trang_thai === 'NGUNG_KINH_DOANH'"
            class="badge bg-secondary"
          >
            Ngừng kinh doanh
          </span>
          <span
            v-else-if="sanPham.trang_thai === 'DANG_HOAN_THIEN'"
            class="badge bg-warning text-dark"
          >
            Đang hoàn thiện
          </span>
          <span v-else class="badge bg-light text-dark">Khác</span>
        </td>

        <td>
          <!-- Nút Chi tiết -->
          <button
            class="btn btn-sm btn-secondary me-2"
            @click="$emit('view-detail', sanPham.id)"
          >
            <i class="fas fa-info"></i> Chi tiết
          </button>

          <!-- Nút Đổi trạng thái (Chỉ hiện khi ở trang quản lý chính, ẩn ở thùng rác nếu muốn) -->
          <button
            v-if="!isTrash && sanPham.trang_thai !== 'DANG_HOAN_THIEN'"
            class="btn btn-sm me-2"
            :class="[
              sanPham.trang_thai === 'DANG_KINH_DOANH'
                ? 'btn-warning'
                : 'btn-success',
              { 'btn-permission-muted': !canManageSanPham },
            ]"
            @click="$emit('toggle-status', sanPham)"
          >
            <i
              :class="
                sanPham.trang_thai === 'DANG_KINH_DOANH'
                  ? 'fas fa-eye-slash'
                  : 'fas fa-eye'
              "
            ></i>
            {{
              sanPham.trang_thai === "DANG_KINH_DOANH" ? " Ngừng" : " Mở bán"
            }}
          </button>

          <!-- Nút Xóa (ở trang chính) hoặc Khôi phục (ở trang thùng rác) -->
          <button
            class="btn btn-sm"
            :class="[
              isTrash ? 'btn-success' : 'btn-danger',
              { 'btn-permission-muted': !canManageSanPham },
            ]"
            @click="$emit('delete-or-restore', sanPham, isTrash)"
          >
            <i :class="isTrash ? 'fas fa-trash-restore' : 'fas fa-trash'"></i>
            {{ isTrash ? "Khôi phục" : "Xóa" }}
          </button>
        </td>
      </tr>

      <!-- Hiển thị khi danh sách rỗng -->
      <tr v-if="sanPhams.length === 0">
        <td colspan="8" class="text-center">
          Không tìm thấy sản phẩm nào phù hợp.
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script>
const API_URL = import.meta.env.VITE_API_BASE_URL;

export default {
  name: "SanPhamTable",
  props: {
    sanPhams: {
      type: Array,
      default: () => [],
    },
    canManageSanPham: {
      type: Boolean,
      default: false, // người dùng hiện tại có quyền thêm/sửa sản phẩm hay không
    },
    isTrash: {
      type: Boolean,
      default: false, // Xác định đang ở trang danh sách chính hay trang thùng rác
    },
  },
  emits: ["view-detail", "toggle-status", "delete-or-restore"],
  methods: {
    // Lấy ảnh chính của sản phẩm
    getAnh(sp) {
      const anhChinhSanPham =
        sp.anh_san_pham?.find((img) => img.la_anh_chinh)?.duong_dan_anh ||
        sp.anh_san_pham?.[0]?.duong_dan_anh;

      if (anhChinhSanPham) {
        return `${API_URL}/uploads/AnhSanPham/${anhChinhSanPham}`;
      }

      // 3. Nếu cả hai đều không có, trả về ảnh mặc định
      return `${API_URL}/images/placeholder-laptop.png`;
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
