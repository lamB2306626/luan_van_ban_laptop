<template>
  <div class="d-flex flex-column h-100">
    <template v-if="customerThreads && customerThreads.length > 0">
      <!-- Header hiển thị thông tin Khách hàng -->
      <div
        class="p-3 border-bottom bg-white d-flex justify-content-between align-items-center"
      >
        <div class="d-flex align-items-center">
          <UserAvatar
            :avatar-file-name="customerInfo?.avatar"
            :name="customerInfo?.ho_ten"
            user-type="KHACH_HANG"
            :size="38"
            class="me-3"
          />
          <div>
            <h6 class="mb-0 fw-bold text-dark">
              {{ customerInfo?.ho_ten || "Khách hàng" }}
            </h6>
            <small class="text-muted" v-if="customerInfo?.so_dien_thoai">
              <i class="fas fa-phone me-1"></i>{{ customerInfo.so_dien_thoai }}
            </small>
          </div>
        </div>

        <div class="text-end">
          <span
            class="badge bg-primary-subtle text-primary border border-primary-subtle"
          >
            <i class="fas fa-layer-group me-1"></i>
            {{ customerThreads.length }} chủ đề hỗ trợ
          </span>
        </div>
      </div>

      <!-- COMPONENT CON TINNHAN_LIST -->
      <TinNhanList
        ref="messageListRef"
        :threads="customerThreads"
        :is-admin="isAdmin"
        :current-staff-id="currentStaffId"
        :current-user-id="currentUserId"
      />
    </template>

    <!-- Trạng thái trống chưa có dữ liệu lịch sử -->
    <div
      v-else
      class="h-100 d-flex align-items-center justify-content-center text-muted"
    >
      <div class="text-center p-4">
        <i class="fas fa-comments fa-3x mb-3 text-secondary opacity-50"></i>
        <p class="mb-0 text-secondary">
          Bắt đầu trò chuyện với Cửa hàng ngay bên dưới nhé!
        </p>
      </div>
    </div>

    <!-- KHUNG XEM TRƯỚC NGỮ CẢNH (CHỈ HIỂN THỊ KHI KHÁC NGỮ CẢNH VỚI THREAD CUỐI CÙNG) -->
    <div
      v-if="showPendingBanner"
      class="bg-warning-subtle border-top border-warning p-2 px-3 d-flex align-items-center justify-content-between"
    >
      <div class="small text-dark d-flex align-items-center">
        <i class="fas fa-info-circle text-warning fs-6 me-2"></i>
        <span>
          Bạn đang chuẩn bị mở chủ đề tư vấn mới cho:
          <strong v-if="pendingContext.id_san_pham" class="text-primary">
            {{ pendingContext.tieu_de }}
          </strong>
          <strong v-else-if="pendingContext.id_don_hang" class="text-danger">
            {{ pendingContext.tieu_de }}
          </strong>
          <strong v-else class="text-success">
            {{ pendingContext.tieu_de }}
          </strong>
        </span>
      </div>
      <span class="badge bg-warning text-dark style-xs">Chủ đề mới</span>
    </div>

    <!-- Ô nhập tin nhắn & Nút gửi -->
    <div class="p-3 bg-white border-top">
      <form @submit.prevent="handleSend" class="input-group">
        <input
          type="text"
          class="form-control"
          placeholder="Nhập nội dung phản hồi..."
          v-model="messageText"
          :disabled="sending"
        />
        <button
          class="btn btn-primary px-4"
          type="submit"
          :disabled="!messageText.trim() || sending"
        >
          <i class="fas fa-paper-plane me-1"></i> Gửi
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import UserAvatar from "@/components/Common/UserAvatar.vue";
import TinNhanList from "@/components/TrangLienHe/TinNhanList.vue";

export default {
  name: "TinNhanFrom",
  components: {
    UserAvatar,
    TinNhanList,
  },
  props: {
    // Mảng danh sách tất cả các cuộc trò chuyện / chủ đề của Khách hàng (trả về từ findByKhachHang)
    history: {
      type: Object,
      required: true,
    },
    pendingContext: {
      type: Object,
      default: null,
    },
    sending: {
      type: Boolean,
      default: false,
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
  data() {
    return {
      messageText: "",
    };
  },
  computed: {
    // Thông tin khách hàng từ chủ đề đầu tiên
    customerInfo() {
      return this.history?.khach_hang || null;
    },

    customerThreads() {
      return this.history?.cuoc_tro_truyen || [];
    },

    // Lấy cuộc trò chuyện mới nhất trong lịch sử
    latestThread() {
      if (!this.customerThreads || this.customerThreads.length === 0) {
        return null;
      }
      return this.customerThreads[this.customerThreads.length - 1];
    },

    // Kiểm tra xem có cần hiển thị Banner báo "Tạo chủ đề mới" hay không
    showPendingBanner() {
      // 1. Nếu không có pendingContext -> Không hiện
      if (!this.pendingContext) return false;

      // 2. Nếu chưa từng có cuộc trò chuyện nào trước đó -> Bắt buộc hiện banner chủ đề mới
      if (!this.latestThread) return true;

      const pendingProduct = this.pendingContext.id_san_pham || null;
      const pendingOrder = this.pendingContext.id_don_hang || null;

      const latestProduct = this.latestThread.id_san_pham || null;
      const latestOrder = this.latestThread.id_don_hang || null;

      // 3. So sánh: Nếu CÙNG ngữ cảnh với cuộc trò chuyện gần nhất -> TRẢ VỀ FALSE để ẨN BANNER
      const isSameContext =
        pendingProduct === latestProduct && pendingOrder === latestOrder;

      return !isSameContext;
    },
  },
  watch: {
    // Tự động cuộn xuống tin nhắn mới nhất khi mảng lịch sử thay đổi
    history: {
      handler() {
        this.scrollToBottom();
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    // 1. Bắt sự kiện gửi tin nhắn
    handleSend() {
      if (!this.messageText.trim() || this.sending) return;
      this.$emit("send-message", this.messageText.trim());
      this.messageText = "";
    },

    // 2. Cuộn xuống cuối tin nhắn
    scrollToBottom() {
      this.$nextTick(() => {
        if (this.$refs.messageListRef?.scrollToBottom) {
          this.$refs.messageListRef.scrollToBottom();
        }
      });
    },
  },
  mounted() {
    this.scrollToBottom();
  },
};
</script>

<style scoped>
.style-xs {
  font-size: 0.75rem;
}
.messages-body {
  scroll-behavior: smooth;
}
</style>
