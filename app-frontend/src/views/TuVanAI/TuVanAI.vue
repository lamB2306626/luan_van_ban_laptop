<template>
  <div class="container my-4">
    <!-- TIÊU ĐỀ TRANG -->
    <div class="d-flex align-items-center justify-content-between mb-3">
      <div>
        <h4 class="fw-bold m-0 text-primary">
          <i class="fas fa-robot me-2"></i>Trợ lý AI Tư vấn Laptop
        </h4>
        <small class="text-muted">
          Hỏi đáp thông minh về cấu hình, giá bán và tình trạng tồn kho thực tế
          tại cửa hàng
        </small>
      </div>
      <button
        class="btn btn-outline-primary btn-sm fw-semibold"
        @click="startNewChat"
      >
        <i class="fas fa-plus me-1"></i> Cuộc trò chuyện mới
      </button>
    </div>

    <div class="row g-3">
      <!-- CỘT TRÁI: COMPONENT DANH SÁCH PHIÊN CHAT -->
      <div class="col-12 col-md-4 col-lg-3">
        <PhienChatList
          :current-user="currentUser"
          :sessions="sessions"
          :active-session-id="currentSessionId"
          @select-session="selectSession"
          @delete-session="deleteSession"
        />
      </div>

      <!-- CỘT PHẢI: COMPONENT KHUNG CHAT CHI TIẾT -->
      <div class="col-12 col-md-8 col-lg-9">
        <KhungChatAI
          :current-user="currentUser"
          :messages="messages"
          :is-loading="isLoading"
          @send-message="handleSendMessage"
          @view-product="goToProductDetail"
        />
      </div>
    </div>
  </div>
</template>

<script>
import PhienChatList from "@/components/TuVanAI/PhienChatList.vue";
import KhungChatAI from "@/components/TuVanAI/KhungChatAI.vue";
import ChatbotService from "@/services/chatbot.service";
import PhienChatService from "@/services/phien-chat.service";

export default {
  name: "TuVanAIView",
  components: {
    PhienChatList,
    KhungChatAI,
  },
  data() {
    return {
      sessions: [],
      currentSessionId: null,
      messages: [],
      isLoading: false,
    };
  },

  computed: {
    currentUser() {
      try {
        const userStr = localStorage.getItem("user");
        return userStr ? JSON.parse(userStr) : null;
      } catch (e) {
        return null;
      }
    },
  },

  mounted() {
    this.loadUserSessions();
  },

  methods: {
    async loadUserSessions() {
      if (!this.currentUser?.id) return;

      try {
        const data = await PhienChatService.getAll({
          id_khach_hang: this.currentUser.id,
        });
        this.sessions = Array.isArray(data) ? data : [];

        if (this.sessions.length > 0 && !this.currentSessionId) {
          await this.selectSession(this.sessions[0].id);
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách phiên chat:", error);
      }
    },

    async selectSession(sessionId) {
      try {
        this.currentSessionId = sessionId;
        const sessionDetail = await PhienChatService.getById(sessionId);
        this.messages = sessionDetail.tin_nhan_chat_ai || [];
      } catch (error) {
        console.error("Lỗi khi tải chi tiết phiên chat:", error);
      }
    },

    startNewChat() {
      this.currentSessionId = null;
      this.messages = [];
    },

    async deleteSession(sessionId) {
      if (!confirm("Bạn có chắc muốn xóa cuộc trò chuyện này?")) return;

      try {
        await PhienChatService.delete(sessionId);
        this.sessions = this.sessions.filter((s) => s.id !== sessionId);
        if (this.currentSessionId === sessionId) {
          this.startNewChat();
        }
      } catch (error) {
        console.error("Lỗi khi xóa phiên chat:", error);
      }
    },

    async handleSendMessage(text) {
      this.messages.push({
        vai_tro: "user",
        noi_dung: text,
      });
      this.isLoading = true;

      try {
        const isFirstMessageOfSession = !this.currentSessionId;

        const response = await ChatbotService.chat({
          message: text,
          id_phien_chat_ai: this.currentSessionId,
          id_khach_hang: this.currentUser ? this.currentUser.id : null,
        });

        const resultData = response.data;

        if (resultData.id_phien_chat_ai) {
          this.currentSessionId = resultData.id_phien_chat_ai;
        }

        this.messages.push({
          vai_tro: "assistant",
          noi_dung: resultData.reply,
          san_pham_goi_y: resultData.sources || [],
        });

        if (isFirstMessageOfSession && this.currentUser?.id) {
          await this.loadUserSessions();
        }
      } catch (error) {
        console.error("Lỗi giao tiếp Chatbot:", error);
        const errorMsg =
          error.response?.data?.message ||
          "Xin lỗi, hệ thống tư vấn đang gặp sự cố kết nối. Bạn vui lòng thử lại sau nhé!";

        this.messages.push({
          vai_tro: "assistant",
          noi_dung: `⚠️ ${errorMsg}`,
          san_pham_goi_y: [],
        });
      } finally {
        this.isLoading = false;
      }
    },

    goToProductDetail(metadataItem) {
      this.$router.push({
        name: "chi-tiet-san-pham.home",
        params: { id: metadataItem.id_san_pham },
        query: { variant: metadataItem.id_bien_the },
      });
    },
  },
};
</script>
