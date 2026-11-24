<template>
  <div class="card shadow-sm border-0 chat-main-card">
    <!-- Khu vực hiển thị tin nhắn -->
    <div class="card-body chat-messages-box p-3" ref="chatContainer">
      <!-- Màn hình chào mừng khi chưa có tin nhắn nào -->
      <div v-if="messages.length === 0" class="text-center my-auto py-5 px-3">
        <div class="mb-3">
          <span
            class="badge bg-primary bg-opacity-10 text-primary p-3 rounded-circle"
          >
            <i class="fas fa-laptop-code fa-2x"></i>
          </span>
        </div>
        <h5 class="fw-bold text-dark">
          Xin chào{{ currentUser ? ` ${currentUser.ho_ten}` : "" }}! Mình có thể
          giúp gì cho bạn?
        </h5>
        <p class="text-muted small mb-4">
          Hãy mô tả nhu cầu sử dụng, tầm giá hoặc cấu hình mong muốn, mình sẽ
          tìm mẫu laptop phù hợp nhất đang còn hàng cho bạn.
        </p>

        <!-- Các câu hỏi gợi ý nhanh -->
        <div class="d-flex flex-wrap justify-content-center gap-2">
          <button
            v-for="(sample, idx) in sampleQuestions"
            :key="idx"
            class="btn btn-light border btn-sm rounded-pill px-3 py-2 text-secondary"
            @click="sendQuickQuestion(sample)"
          >
            "{{ sample }}"
          </button>
        </div>
      </div>

      <!-- Danh sách tin nhắn hội thoại -->
      <div v-else>
        <div v-for="(msg, index) in messages" :key="index" class="mb-4">
          <!-- Tin nhắn của KHÁCH HÀNG -->
          <div v-if="msg.vai_tro === 'user'" class="d-flex justify-content-end">
            <div
              class="bg-primary text-white rounded-3 px-3 py-2 shadow-sm user-bubble"
            >
              {{ msg.noi_dung }}
            </div>
          </div>

          <!-- Tin nhắn phản hồi của AI ASSISTANT -->
          <div v-else class="d-flex align-items-start gap-2">
            <div
              class="bot-avatar bg-danger text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            >
              <i class="fas fa-robot small"></i>
            </div>

            <div class="bot-content-wrapper">
              <!-- Nội dung văn bản AI trả lời -->
              <div
                class="bg-light border rounded-3 px-3 py-2 shadow-sm bot-bubble"
                v-html="formatBotReply(msg.noi_dung)"
              ></div>

              <!-- Nhúng component SanPhamGoiYCard -->
              <div
                v-if="msg.san_pham_goi_y && msg.san_pham_goi_y.length > 0"
                class="mt-2"
              >
                <small class="text-muted fw-semibold d-block mb-2">
                  <i class="fas fa-tag text-danger me-1"></i>Sản phẩm liên quan
                  đang còn hàng:
                </small>
                <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-2">
                  <div
                    class="col"
                    v-for="(item, sIdx) in msg.san_pham_goi_y"
                    :key="sIdx"
                  >
                    <SanPhamGoiYCard
                      :item="item"
                      @select="goToViewDetailSanPham(item)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Hiệu ứng đang suy nghĩ (Loading) -->
        <div v-if="isLoading" class="d-flex align-items-center gap-2 mb-3">
          <div
            class="bot-avatar bg-danger text-white rounded-circle d-flex align-items-center justify-content-center"
          >
            <i class="fas fa-robot small"></i>
          </div>
          <div class="bg-light border rounded-3 px-3 py-2 text-muted small">
            <span
              class="spinner-border spinner-border-sm text-primary me-2"
              role="status"
            ></span>
            Trợ lý AI đang kiểm tra cấu hình và tồn kho...
          </div>
        </div>
      </div>
    </div>

    <!-- Thanh nhập tin nhắn ở đáy khung chat -->
    <div class="card-footer bg-white border-top p-3">
      <form @submit.prevent="submitForm" class="d-flex gap-2">
        <input
          v-model="inputMessage"
          type="text"
          class="form-control"
          placeholder="Nhập nhu cầu tìm laptop của bạn (VD: Laptop gaming dưới 20 triệu)..."
          :disabled="isLoading"
        />
        <button
          type="submit"
          class="btn btn-primary px-4 fw-semibold"
          :disabled="isLoading || !inputMessage.trim()"
        >
          <i class="fas fa-paper-plane me-1"></i> Gửi
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import SanPhamGoiYCard from "./SanPhamGoiYCard.vue";

export default {
  name: "KhungChatAI",
  components: {
    SanPhamGoiYCard,
  },
  props: {
    currentUser: {
      type: Object,
      default: null,
    },
    messages: {
      type: Array,
      default: () => [],
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["send-message", "view-product"],
  data() {
    return {
      inputMessage: "",
      sampleQuestions: [
        "Tư vấn laptop gaming dưới 20 triệu",
        "Laptop mỏng nhẹ cho sinh viên văn phòng",
        "So sánh các mẫu có card RTX 3050",
        "Cửa hàng đang có mẫu MSI nào còn hàng?",
      ],
    };
  },
  watch: {
    // Tự động cuộn xuống đáy mỗi khi danh sách tin nhắn thay đổi hoặc trạng thái loading bật lên
    messages: {
      deep: true,
      handler() {
        this.scrollToBottom();
      },
    },
    isLoading() {
      this.scrollToBottom();
    },
  },
  methods: {
    submitForm() {
      const text = this.inputMessage.trim();
      if (!text || this.isLoading) return;

      this.$emit("send-message", text);
      this.inputMessage = "";
    },

    sendQuickQuestion(question) {
      if (this.isLoading) return;
      this.$emit("send-message", question);
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.chatContainer;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    },

    formatBotReply(text) {
      if (!text) return "";
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br>");
    },

    goToViewDetailSanPham(item) {
      this.$router.push({
        name: "chi-tiet-san-pham.home",
        params: { id: item.id_san_pham },
        query: { variant: item.id_bien_the },
      });
    },
  },
};
</script>

<style scoped>
.chat-main-card {
  height: 75vh;
  min-height: 520px;
  display: flex;
  flex-direction: column;
}

.chat-messages-box {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.user-bubble {
  max-width: 75%;
  white-space: pre-wrap;
  line-height: 1.5;
}

.bot-avatar {
  width: 34px;
  height: 34px;
}

.bot-content-wrapper {
  max-width: 85%;
  flex: 1;
}

.bot-bubble {
  line-height: 1.6;
  color: #212529;
}
</style>
