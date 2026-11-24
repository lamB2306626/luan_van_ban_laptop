<template>
  <div
    class="messages-body flex-grow-1 p-3 overflow-auto bg-light"
    ref="messageBox"
  >
    <template v-if="threads && threads.length > 0">
      <!-- VÒNG LẶP OUT: Lặp qua từng Cuộc trò chuyện / Chủ đề (Threads) -->
      <div v-for="thread in threads" :key="thread.id" class="thread-group mb-4">
        <!-- Phân cách Ngữ cảnh của Chủ đề (Divider Context) -->
        <div class="d-flex align-items-center my-3">
          <div class="border-bottom flex-grow-1"></div>
          <div class="px-3 text-center">
            <span
              class="badge bg-white text-secondary border shadow-sm px-3 py-2 rounded-pill"
            >
              <i class="fas fa-comments me-1 text-primary"></i>
              <strong class="text-dark me-2">{{
                thread.tieu_de || "Tư vấn hỗ trợ"
              }}</strong>

              <!-- Tag Sản phẩm nếu có -->
              <span v-if="thread.san_pham" class="text-info fw-normal me-2">
                <i class="fas fa-laptop me-1"></i
                >{{ thread.san_pham.ten_san_pham }}
              </span>

              <!-- Tag Đơn hàng nếu có -->
              <span v-if="thread.don_hang" class="text-warning fw-normal me-2">
                <i class="fas fa-file-invoice me-1"></i>Đơn #{{
                  thread.don_hang.id
                }}
              </span>

              <small class="text-muted border-start ps-2">
                {{ formatDate(thread.created_at) }}
              </small>
            </span>
          </div>
          <div class="border-bottom flex-grow-1"></div>
        </div>

        <!-- VÒNG LẶP IN: Lặp qua từng Tin nhắn bên trong Chủ đề -->
        <template v-if="thread.tin_nhan && thread.tin_nhan.length > 0">
          <div
            v-for="(msg, index) in thread.tin_nhan"
            :key="msg.id"
            class="d-flex mb-3"
            :class="
              isMyMessage(msg) ? 'justify-content-end' : 'justify-content-start'
            "
          >
            <!-- Avatar người gửi (Bên trái nếu KHÔNG PHẢI tin nhắn của mình) -->
            <div v-if="!isMyMessage(msg)" class="me-2">
              <UserAvatar
                v-if="msg.vai_tro_nguoi_gui === 'customer'"
                :avatar-file-name="msg.khach_hang?.avatar"
                :name="msg.khach_hang?.ho_ten"
                user-type="KHACH_HANG"
                :size="32"
              />
              <UserAvatar
                v-else
                :avatar-file-name="msg.nhan_vien?.avatar"
                :name="msg.nhan_vien?.ho_ten"
                user-type="NHAN_VIEN"
                :size="32"
              />
            </div>

            <!-- Khung bong bóng tin nhắn + Trạng thái đã xem -->
            <div class="d-flex flex-column" style="max-width: 70%">
              <!-- Bong bóng tin nhắn -->
              <div
                class="p-3 rounded-3 shadow-sm"
                :class="
                  isMyMessage(msg)
                    ? 'bg-primary text-white'
                    : 'bg-white text-dark border'
                "
              >
                <div class="small fw-bold mb-1 opacity-75 style-xs">
                  {{ getSenderName(msg) }}
                </div>
                <div class="text-break">{{ msg.noi_dung }}</div>
                <div class="text-end mt-1 opacity-50 style-xs">
                  {{ formatTime(msg.created_at) }}
                </div>
              </div>

              <!-- HIỂN THỊ TRẠNG THÁI "ĐÃ XEM" (Chỉ hiện cho tin nhắn do chính mình gửi & là tin nhắn cuối cùng trong chủ đề) -->
              <div
                v-if="isMyMessage(msg) && isLastMessageInThread(thread, index)"
                class="text-end mt-1"
                style="font-size: 0.75rem"
              >
                <span v-if="msg.da_doc" class="text-primary fw-bold">
                  <i class="fas fa-check-double me-1"></i>Đã xem
                </span>
                <span v-else class="text-muted">
                  <i class="fas fa-check me-1"></i>Đã gửi
                </span>
              </div>
            </div>

            <!-- Avatar người gửi (Bên phải nếu LÀ tin nhắn của mình) -->
            <div v-if="isMyMessage(msg)" class="ms-2">
              <UserAvatar
                v-if="msg.vai_tro_nguoi_gui === 'customer'"
                :avatar-file-name="msg.khach_hang?.avatar"
                :name="msg.khach_hang?.ho_ten"
                user-type="KHACH_HANG"
                :size="32"
              />
              <UserAvatar
                v-else
                :avatar-file-name="msg.nhan_vien?.avatar"
                :name="msg.nhan_vien?.ho_ten"
                user-type="NHAN_VIEN"
                :size="32"
              />
            </div>
          </div>
        </template>

        <div v-else class="text-center text-muted small py-2 fst-italic">
          Chưa có tin nhắn nào trong chủ đề này
        </div>
      </div>
    </template>
  </div>
</template>
<script>
import UserAvatar from "@/components/Common/UserAvatar.vue";

export default {
  name: "MessageList",
  components: {
    UserAvatar,
  },
  props: {
    threads: {
      type: Array,
      default: () => [],
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    currentStaffId: {
      type: [String, Number],
      default: null,
    },
    currentUserId: {
      type: [String, Number],
      default: null,
    },
  },
  methods: {
    isMyMessage(msg) {
      if (!msg) return false;
      if (this.isAdmin) {
        return msg.id_nhan_vien === this.currentStaffId;
      }
      return msg.id_khach_hang === this.currentUserId;
    },

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

    formatDate(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    },

    formatTime(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    },

    // Hàm hỗ trợ cuộn xuống đáy để component cha có thể gọi thông qua ref nếu cần
    scrollToBottom() {
      const box = this.$refs.messageBox;
      if (box) {
        box.scrollTop = box.scrollHeight;
      }
    },

    // Helper kiểm tra tin nhắn có phải là tin cuối cùng trong danh sách hay không
    isLastMessageInThread(thread, currentIndex) {
      if (!thread?.tin_nhan || thread.tin_nhan.length === 0) return false;
      return currentIndex === thread.tin_nhan.length - 1;
    },
  },
};
</script>
