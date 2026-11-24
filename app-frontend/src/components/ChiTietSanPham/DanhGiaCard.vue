<template>
  <div
    class="review-item border-bottom pb-3 mb-3 p-3 rounded transition-all"
    :class="{ 'bg-subtle shadow-sm': isMyReview }"
  >
    <!-- HÀNG TRÊN: AVATAR, TÊN, HUY HIỆU VÀ NÚT SỬA + PHIÊN BẢN MÁY GÓC PHẢI -->
    <div class="d-flex justify-content-between align-items-start mb-1">
      <div class="d-flex align-items-center gap-2">
        <!-- Avatar dạng ảnh -->
        <UserAvatar
          :avatar-file-name="item.khach_hang.avatar"
          :name="item.khach_hang.ho_ten"
          user-type="NhanVien"
          :size="38"
        />
        <div>
          <div class="d-flex align-items-center flex-wrap gap-2 ml-1">
            <h6 class="mb-0 fw-bold text-dark fs-7">
              {{ item.khach_hang?.ho_ten || "Khách hàng" }}
            </h6>

            <!-- Huy hiệu: Đã mua tại Laptop Store (hoặc Huy hiệu Đánh giá của bạn) -->
            <span
              v-if="isMyReview"
              class="badge bg-primary px-2 py-1 ml-1"
              style="font-size: 10px"
            >
              <i class="fas fa-user-check mr-1"></i>Đánh giá của bạn
            </span>
          </div>
        </div>
      </div>

      <!-- GÓC PHẢI TRÊN: Nút Sửa (nếu là bài của mình) & Thông tin phiên bản biến thể -->
      <div class="d-flex align-items-center gap-2">
        <!-- Nút Chỉnh sửa đánh giá nằm ở góc trên bên phải (giống mẫu) -->
        <button
          v-if="isMyReview"
          class="btn btn-sm filter-pill filter-btn d-flex align-items-center mr-2"
          style="font-size: 11px"
          @click="$emit('edit-review', item)"
          title="Chỉnh sửa đánh giá"
        >
          <i class="fas fa-edit mr-1"></i> Chỉnh sửa đánh giá
        </button>

        <!-- Tên phiên bản máy đã mua -->
        <span
          v-if="item.chi_tiet_don_hang?.bien_the"
          class="badge text-secondary border bg-light px-2 py-1 fw-normal"
          style="font-size: 11px"
        >
          Bản: {{ getTenBienThe(item) }}
        </span>
      </div>
    </div>

    <!-- HÀNG THỨ HAI: SỐ SAO VÀ THỜI GIAN -->
    <div class="d-flex align-items-center gap-2 mb-2 ms-5 ps-1">
      <!-- Số sao vàng -->
      <div class="text-warning" style="font-size: 11px">
        <i
          v-for="i in 5"
          :key="i"
          class="fa-star mr-1"
          :class="i <= item.so_sao ? 'fas text-warning' : 'far text-secondary'"
        ></i>
      </div>

      <!-- Thời gian đánh giá -->
      <small class="text-muted" style="font-size: 12px">
        {{ formatDate(item.ngay_danh_gia) }}
      </small>
    </div>

    <!-- NỘI DUNG ĐÁNH GIÁ (CÓ THỤT LỀ CÂN ĐỐI VỚI AVATAR) -->
    <div class="ms-5 ps-1">
      <p
        class="mb-0 text-secondary small"
        style="line-height: 1.6; font-size: 0.9rem"
      >
        {{ item.noi_dung || "Khách hàng không để lại lời nhắn." }}
      </p>
    </div>
  </div>
</template>

<script>
import UserAvatar from "@/components/Common/UserAvatar.vue";

export default {
  name: "DanhGiaCard",
  components: {
    UserAvatar,
  },
  props: {
    item: {
      type: Object,
      required: true,
    },
    isMyReview: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    },

    getTenBienThe(item) {
      const bt = item.chi_tiet_don_hang?.bien_the;
      if (!bt) return "Tiêu chuẩn";

      const cpu = bt.cpu?.ten_cpu || "";
      const gpu = bt.gpu?.ten_gpu || "";
      const mau = bt.mau_sac?.ten_mau_sac || "";
      const ram = bt.dung_luong_ram?.dung_luong_ram || "";
      const rom = bt.dung_luong_rom?.dung_luong_rom || "";

      return [cpu, gpu, mau, ram, rom].filter(Boolean).join(" | ");
    },
  },
};
</script>

<style scoped>
.bg-subtle {
  background-color: #f4f8ff;
}

.filter-btn {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  color: #333;
  font-size: 0.85rem;
  padding: 6px 14px;
  transition: all 0.2s ease-in-out;
}

.filter-btn:hover {
  background-color: #e9ecef;
  border-color: #ced4da;
}

.filter-pill {
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  padding: 5px 12px;
  transition: all 0.2s ease;
}
</style>
