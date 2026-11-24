<template>
  <tr>
    <!-- 0. Ô CHECKBOX CHỌN SẢN PHẨM (MỚI THÊM) -->
    <td class="ps-3 py-3 text-center" style="width: 40px">
      <input
        type="checkbox"
        class="form-check-input cursor-pointer"
        :checked="isSelected"
        :disabled="!isSelectable || isDisabledSelect"
        @change="$emit('toggle-select', item)"
      />
    </td>

    <!-- 1. THÔNG TIN SẢN PHẨM & BIẾN THỂ -->
    <td class="ps-3 py-3">
      <div class="d-flex align-items-center gap-3">
        <img
          :src="getAnh(item)"
          alt="Ảnh biến thể"
          class="rounded border object-fit-cover"
          style="width: 70px; height: 70px"
        />
        <div>
          <h6
            class="fw-bold text-dark mb-1 cursor-pointer hover-title"
            @click="$emit('view-detail', item)"
          >
            {{ item.bien_the?.san_pham?.ten_san_pham || "Sản phẩm" }}
          </h6>
          <!-- Tổ hợp cấu hình -->
          <div class="small text-secondary">
            {{ item.bien_the?.mau_sac?.ten_mau_sac || "" }}
            <span v-if="item.bien_the?.cpu"
              >| {{ item.bien_the.cpu.ten_cpu }}</span
            >
            <span v-if="item.bien_the?.dung_luong_ram"
              >| {{ item.bien_the.dung_luong_ram.dung_luong_ram }}</span
            >
            <span v-if="item.bien_the?.dung_luong_rom"
              >| {{ item.bien_the.dung_luong_rom.dung_luong_rom }}</span
            >
          </div>

          <!-- Cảnh báo trạng thái kinh doanh / tồn kho -->
          <div class="mt-1">
            <span
              v-if="!item.bien_the?.trang_thai"
              class="badge bg-danger-subtle text-danger"
            >
              Ngừng kinh doanh
            </span>
            <span
              v-else-if="item.bien_the?.so_luong <= 0"
              class="badge bg-secondary-subtle text-secondary"
            >
              Tạm hết hàng
            </span>
            <span
              v-else-if="item.so_luong > item.bien_the?.so_luong"
              class="badge bg-warning-subtle text-warning-emphasis"
            >
              Số lượng không đủ chỉ còn {{ item.bien_the.so_luong }} sản phẩm
            </span>
          </div>
        </div>
      </div>
    </td>

    <!-- 2. ĐƠN GIÁ (Ưu tiên don_gia_ap_dung từ backend) -->
    <td class="text-center fw-semibold text-dark">
      <div v-if="item.gia_goc && item.don_gia_ap_dung < item.gia_goc">
        <span class="text-decoration-line-through text-muted small me-1">
          {{ formatCurrency(item.gia_goc) }}
        </span>
        <br />
        <span class="text-danger fw-bold">
          {{ formatCurrency(item.don_gia_ap_dung) }}
        </span>
      </div>
      <div v-else>
        {{ formatCurrency(item.don_gia_ap_dung) }}
      </div>
    </td>

    <!-- 3. TĂNG GIẢM SỐ LƯỢNG -->
    <td class="text-center" style="min-width: 130px">
      <div class="input-group input-group-sm mx-auto" style="width: 110px">
        <button
          class="btn btn-outline-secondary"
          type="button"
          @click="changeQuantity(item.so_luong - 1)"
          :disabled="item.so_luong <= 1 || !item.bien_the?.trang_thai"
        >
          -
        </button>
        <input
          type="number"
          class="form-control text-center fw-bold"
          :value="item.so_luong"
          @change="onInputChange"
          :disabled="!item.bien_the?.trang_thai"
          min="1"
          :max="maxQuantity"
        />
        <button
          class="btn btn-outline-secondary"
          type="button"
          @click="changeQuantity(item.so_luong + 1)"
          :disabled="item.so_luong >= maxQuantity || !item.bien_the?.trang_thai"
        >
          +
        </button>
      </div>
    </td>

    <!-- 4. THÀNH TIỀN -->
    <td class="text-end pe-3 fw-bold text-danger">
      {{ formatCurrency((item.don_gia_ap_dung || 0) * item.so_luong) }}
    </td>

    <!-- 5. NÚT XÓA ITEM -->
    <td class="text-center pe-3">
      <button
        class="btn btn-link text-danger p-0 border-0"
        title="Xóa khỏi giỏ hàng"
        @click="$emit('remove-item', item)"
      >
        <i class="fas fa-trash-alt"></i>
      </button>
    </td>
  </tr>
</template>

<script>
const API_URL = import.meta.env.VITE_API_BASE_URL;

export default {
  name: "GioHangItem",
  data() {
    return {
      API_URL,
      MAX_QUANTITY_SYSTEM: 3,
    };
  },
  props: {
    item: {
      type: Object,
      required: true,
    },
    isSelected: {
      type: Boolean,
      default: false,
    },
    isDisabledSelect: { type: Boolean, default: false },
  },
  emits: ["update-quantity", "remove-item", "view-detail", "toggle-select"],
  computed: {
    // Chỉ cho phép tick chọn nếu biến thể đang kinh doanh (trang_thai = true) và còn đủ hàng
    isSelectable() {
      return (
        Boolean(this.item.bien_the?.trang_thai) &&
        Number(this.item.so_luong) <= Number(this.item.bien_the?.so_luong)
      );
    },

    maxQuantity() {
      const tonKho = Number(this.item?.bien_the?.so_luong || 0);
      return Math.min(this.MAX_QUANTITY_SYSTEM, tonKho);
    },
  },

  methods: {
    changeQuantity(newQty) {
      const maxStock = this.item.bien_the?.so_luong || 0;

      // Chỉ cho phép cập nhật khi nằm trong khoảng [1, maxQuantity]
      // hoặc trường hợp người dùng giảm số lượng thì mặc định luôn cho phép cập nhật cho đến khi
      if (
        (newQty >= 1 && newQty <= this.maxQuantity) ||
        (newQty >= 1 && newQty <= Number(this.item.so_luong))
      ) {
        this.$emit("update-quantity", { item: this.item, newQuantity: newQty });
      }
    },

    onInputChange(event) {
      let val = parseInt(event.target.value, 10);

      // Nếu nhập số hợp lệ >= 1
      if (!isNaN(val) && val >= 1) {
        // Nếu người dùng cố tình gõ số lớn hơn maxQuantity (ví dụ gõ 5 trong khi tối đa là 2)
        if (val > this.maxQuantity) {
          val = this.maxQuantity; // Ép về mức tối đa cho phép
          event.target.value = val; // Cập nhật lại số hiển thị trên ô input ngay lập tức
        }

        // Chỉ emit lên cha nếu số lượng mới thực sự khác số lượng hiện tại (tránh gọi API thừa)
        if (val !== this.item.so_luong) {
          this.changeQuantity(val);
        }
      } else {
        // Reset về giá trị cũ nếu nhập sai (chữ, số âm, số 0 hoặc để trống)
        event.target.value = this.item.so_luong;
      }
    },

    formatCurrency(value) {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value || 0);
    },

    // Lấy ảnh của sản phẩm (ưu tiên biến thể đại diện, nếu không có thì lấy ảnh chính của sản phẩm)
    getAnh(item) {
      // 1. Kiểm tra xem biến thể đại diện có ảnh hay không
      const anhBienThe = item.bien_the?.duong_dan_anh;
      if (anhBienThe) {
        return `${API_URL}/uploads/BienThe/${anhBienThe}`;
      }

      // 2. Nếu không có ảnh biến thể, tìm ảnh chính trong mảng anh_san_pham của sản phẩm
      const anhChinhSanPham =
        item.bien_the?.san_pham.anh_san_pham?.find((img) => img.la_anh_chinh)
          ?.duong_dan_anh ||
        item.bien_the?.san_pham.anh_san_pham?.[0]?.duong_dan_anh;

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
.hover-title:hover {
  color: #0d6efd !important;
}
.cursor-pointer {
  cursor: pointer;
}
.object-fit-cover {
  object-fit: cover;
}
</style>
