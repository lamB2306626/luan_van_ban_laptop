<template>
  <div class="h-100 border-end bg-light">
    <!-- Tiêu đề danh sách -->
    <div
      class="p-3 border-bottom bg-white fw-bold text-secondary d-flex justify-content-between align-items-center"
    >
      <span><i class="fas fa-users-comments me-2"></i>Lịch sử tư vấn</span>
      <span class="badge bg-secondary rounded-pill">
        {{ lichSuList.length }}
      </span>
    </div>

    <!-- Danh sách Hộp thư lịch sử theo từng khách hàng -->
    <div class="chat-list overflow-auto" style="max-height: 520px">
      <div
        v-for="item in lichSuList"
        :key="item.id"
        class="chat-item p-3 border-bottom cursor-pointer transition-all position-relative"
        :class="{
          'bg-white shadow-sm border-start border-4 border-primary':
            isItemActive(item),
          'border-start border-4 border-danger':
            getTotalUnread(item) > 0 && !isItemActive(item),
        }"
        @click="$emit('select-chat', item)"
      >
        <!-- Khách hàng & Số tin chưa đọc -->
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div class="d-flex align-items-center text-truncate me-2">
            <UserAvatar
              :avatar-file-name="item.khach_hang?.avatar"
              :name="item.khach_hang?.ho_ten"
              user-type="KhachHang"
              :size="28"
              class="me-2 flex-shrink-0"
            />
            <span class="fw-bold text-dark text-truncate small">
              {{ item.khach_hang?.ho_ten || "Khách hàng" }}
            </span>
          </div>

          <!-- Badge báo tổng số tin nhắn chưa đọc (Tính tổng toàn bộ các chủ đề) -->
          <span
            v-if="getTotalUnread(item) > 0"
            class="badge bg-danger rounded-pill animation-pulse flex-shrink-0"
          >
            {{ getTotalUnread(item) }} mới
          </span>
          <small v-else class="text-muted flex-shrink-0 style-xs">
            {{ formatDate(getLatestMessageAt(item)) }}
          </small>
        </div>

        <!-- Chủ đề / Ngữ cảnh mới nhất (item.cuoc_tro_truyen[0]) -->
        <div class="mb-2 p-2 bg-light rounded border border-light-subtle">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <small
              class="fw-bold text-primary style-xs text-truncate"
              style="max-width: 170px"
            >
              <i class="fas fa-bookmark me-1"></i>
              {{ getLatestThread(item)?.tieu_de || "Tư vấn hỗ trợ" }}
            </small>
          </div>

          <!-- Tag Sản phẩm hoặc Đơn hàng của chủ đề mới nhất -->
          <div class="d-flex flex-wrap gap-1">
            <span
              v-if="getLatestThread(item)?.san_pham"
              class="badge bg-info-subtle text-info-emphasis border border-info-subtle text-truncate"
              style="max-width: 100%"
              :title="getLatestThread(item).san_pham.ten_san_pham"
            >
              <i class="fas fa-laptop me-1"></i>
              {{ getLatestThread(item).san_pham.ten_san_pham }}
            </span>
            <span
              v-if="getLatestThread(item)?.don_hang"
              class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle"
            >
              <i class="fas fa-file-invoice me-1"></i>
              Đơn #{{ getLatestThread(item).don_hang.id }}
            </span>
            <span
              v-if="
                !getLatestThread(item)?.san_pham &&
                !getLatestThread(item)?.don_hang
              "
              class="badge bg-secondary-subtle text-secondary border border-secondary-subtle"
            >
              <i class="fas fa-headset me-1"></i> Hỗ trợ chung
            </span>
          </div>
        </div>

        <!-- Preview tin nhắn mới nhất -->
        <p
          class="small text-truncate mb-0 p-1 px-2 rounded"
          :class="
            getTotalUnread(item) > 0
              ? 'bg-warning-subtle text-dark fw-bold'
              : 'text-muted'
          "
        >
          {{ getSenderName(getLatestMessage(item)) }}:
          {{ getLatestMessage(item)?.noi_dung || "Chưa có tin nhắn" }}
        </p>
      </div>

      <!-- Khi danh sách rỗng -->
      <div v-if="lichSuList.length === 0" class="text-center py-5 text-muted">
        <i class="far fa-comment-dots fa-2x mb-2"></i>
        <p class="mb-0">Chưa có lịch sử tư vấn nào</p>
      </div>
    </div>
  </div>
</template>

<script>
import UserAvatar from "@/components/Common/UserAvatar.vue";

export default {
  name: "DanhSachLichSuTroTruyen",
  components: {
    UserAvatar,
  },
  props: {
    // Đổi tên prop thành lichSuList cho rõ nghĩa (nhận dữ liệu thô từ API find)
    lichSuList: {
      type: Array,
      default: () => [],
    },
    selectedId: {
      type: String,
      default: "",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    currentUserId: {
      type: String,
      default: "",
    },
    currentStaffId: {
      type: String,
      default: "",
    },
  },

  methods: {
    // 1. Helper lấy Chủ đề mới nhất trong Hộp thư tổng
    getLatestThread(historyItem) {
      return historyItem?.cuoc_tro_truyen?.[0] || null;
    },

    // 2. Helper lấy Tin nhắn mới nhất của Chủ đề mới nhất
    getLatestMessage(historyItem) {
      const latestThread = this.getLatestThread(historyItem);
      return latestThread?.tin_nhan?.[0] || null;
    },

    // 3. Helper lấy Thời gian cập nhật tin nhắn cuối cùng
    getLatestMessageAt(historyItem) {
      return historyItem?.updated_at;
    },

    // 4. Tính tổng số tin chưa đọc từ tất cả các cuộc trò chuyện của khách này
    getTotalUnread(historyItem) {
      if (!historyItem?.cuoc_tro_truyen) return 0;
      return historyItem.cuoc_tro_truyen.reduce(
        (sum, thread) => sum + (thread._count?.tin_nhan || 0),
        0,
      );
    },

    // 5. Kiểm tra thẻ này có đang active (được chọn) hay không
    isItemActive(historyItem) {
      if (!this.selectedId) return false;
      return this.selectedId === historyItem.id;
    },

    // 6. Kiểm tra xem tin nhắn có phải do người đang xem gửi không
    isMyMessage(msg) {
      if (!msg) return false;
      if (this.isAdmin) {
        return msg.id_nhan_vien === this.currentStaffId;
      }
      return msg.id_khach_hang === this.currentUserId;
    },

    // 7. Hiển thị nhãn tên người gửi
    getSenderName(msg) {
      if (!msg) return "";
      if (this.isMyMessage(msg)) {
        return "Bạn";
      }
      if (msg.vai_tro_nguoi_gui === "customer") {
        return msg.khach_hang?.ho_ten || "Khách hàng";
      }
      return msg.nhan_vien?.ho_ten || "Tư vấn viên";
    },

    // 8. Format thời gian
    formatDate(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  },
};
</script>

<style scoped>
.chat-item {
  transition: all 0.2s ease;
}
.chat-item:hover {
  background-color: #f8f9fa;
}
.cursor-pointer {
  cursor: pointer;
}
.style-xs {
  font-size: 0.75rem;
}
</style>
