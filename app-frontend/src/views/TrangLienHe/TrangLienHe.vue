<template>
  <div class="container my-4">
    <div class="card shadow-sm border-0 rounded-3">
      <!-- Header Trang Chat -->
      <div
        class="card-header bg-primary text-white py-3 d-flex justify-content-between align-items-center"
      >
        <div class="d-flex align-items-center">
          <i class="fas fa-headset fa-2x me-3"></i>
          <div>
            <h5 class="mb-0 fw-bold">Liên hệ Hỗ trợ Cửa hàng</h5>
            <small class="text-white-50">
              Tư vấn sản phẩm & giải đáp thắc mắc đơn hàng
            </small>
          </div>
        </div>
        <button class="btn btn-sm btn-outline-light" @click="$router.back()">
          <i class="fas fa-arrow-left me-1"></i> Quay lại
        </button>
      </div>

      <div class="card-body p-0">
        <!-- Khung nhắn tin chi tiết chiếm trọn 12 cột -->
        <div class="col-12" style="height: 620px">
          <TinNhanFrom
            :history="history"
            :pendingContext="pendingContext"
            :sending="sending"
            @send-message="sendMessage"
            :is-admin="false"
            :current-user-id="currentUser?.id"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import LichSuTroTruyenService from "@/services/lich-su-tro-truyen.service";
import TinNhanService from "@/services/tin-nhan.service";
import socketService from "@/services/socket.service";
import TinNhanFrom from "@/components/TrangLienHe/TinNhanFrom.vue";

export default {
  name: "TrangLienHe",
  components: {
    TinNhanFrom,
  },
  data() {
    return {
      history: {}, // Toàn bộ lịch sử trò chuyện của Khách
      sending: false,
      pendingContext: null, // Lưu tạm ngữ cảnh Sản phẩm / Đơn hàng
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

    // Lấy cuộc trò chuyện / chủ đề mới nhất để hàm sendMessage sẽ tạo tin nhắn cho cuộc trò truyện này
    latestThread() {
      const threads = this.history?.cuoc_tro_truyen;
      if (!Array.isArray(threads) || threads.length === 0) return null;
      return threads[threads.length - 1];
    },
  },

  watch: {
    // Theo dõi thay đổi query trên URL
    "$route.query": {
      async handler() {
        await this.initChatSession();
      },
      deep: true,
      immediate: true,
    },
  },

  methods: {
    // 1. Khởi tạo ngữ cảnh tạm
    async initChatSession() {
      if (!this.currentUser?.id) return;

      const queryProductId = this.$route.query.product_id;
      const queryOrderId = this.$route.query.order_id;
      const queryType = this.$route.query.type;

      // TH1: Đến từ Sản phẩm hoặc Đơn hàng cụ thể
      if (queryProductId || queryOrderId) {
        const context = {
          id_san_pham: queryProductId || null,
          id_don_hang: queryOrderId || null,
          tieu_de: queryProductId
            ? `Hỗ trợ tư vấn sản phẩm ${queryProductId}`
            : `Hỗ trợ đơn hàng #${queryOrderId}`,
        };
        sessionStorage.setItem("pending_chat_context", JSON.stringify(context));
        this.pendingContext = context;
      }
      // TH2: Đến từ nút "Liên hệ chung"
      else if (queryType === "general") {
        const context = {
          id_san_pham: null,
          id_don_hang: null,
          tieu_de: "Tư vấn & Hỗ trợ chung",
        };
        sessionStorage.setItem("pending_chat_context", JSON.stringify(context));
        this.pendingContext = context;
      }

      this.loadPendingContext();

      await this.loadCustomerHistory();
    },

    // Hàm phụ trợ lấy context từ sessionStorage
    loadPendingContext() {
      try {
        const saved = sessionStorage.getItem("pending_chat_context");
        this.pendingContext = saved ? JSON.parse(saved) : null;
      } catch (e) {
        this.pendingContext = null;
      }
    },

    // 2. Tải toàn bộ chuỗi chủ đề & tin nhắn của Khách hàng
    async loadCustomerHistory() {
      if (!this.currentUser?.id) return;

      try {
        const res = await LichSuTroTruyenService.getByKhachHang(
          this.currentUser.id,
        );
        this.history = res || {};

        if (this.history?.id) {
          await LichSuTroTruyenService.markAsRead(this.history.id, {
            readerRole: "customer",
          });

          // -------------------------------------------------------------
          // KẾT NỐI REAL-TIME VÀ JOIN ROOM CHAT
          // -------------------------------------------------------------
          socketService.connect();
          socketService.joinRoom(this.history.id);

          // Đăng ký lắng nghe tin nhắn mới từ Server (Hủy nghe trước đó để tránh trùng lắng nghe)
          socketService.off("receive_message", this.handleIncomingMessage);
          socketService.on("receive_message", this.handleIncomingMessage);

          // ĐĂNG KÝ LẮNG NGHE SỰ KIỆN ĐÃ XEM TỪ SERVER
          socketService.off("messages_read", this.handleMessagesRead);
          socketService.on("messages_read", this.handleMessagesRead);
        }
      } catch (error) {
        console.error("Lỗi khi tải lịch sử tư vấn:", error);
      }
    },

    // 3. Xử lý khi nhận được tin nhắn Real-time qua Socket
    handleIncomingMessage(tinNhanMoi) {
      if (!this.history?.cuoc_tro_truyen) return;

      // Tìm cuộc trò chuyện ứng với tin nhắn vừa nhận
      const targetThread = this.history.cuoc_tro_truyen.find(
        (t) => t.id === tinNhanMoi.id_cuoc_tro_truyen,
      );

      if (targetThread) {
        if (!targetThread.tin_nhan) {
          targetThread.tin_nhan = [];
        }

        // Kiểm tra tránh trùng lặp tin nhắn đã hiển thị (cho an toàn)
        const isExisted = targetThread.tin_nhan.some(
          (m) => m.id === tinNhanMoi.id,
        );

        if (!isExisted) {
          targetThread.tin_nhan.push(tinNhanMoi);

          // Nếu khách hàng đang ở trong trang liên hệ này mà nhân viên nhắn đến -> Đánh dấu đã đọc ngầm
          if (tinNhanMoi.vai_tro_nguoi_gui === "staff") {
            LichSuTroTruyenService.markAsRead(this.history.id, {
              readerRole: "customer",
            });
          }
        }
      } else {
        // Nếu là cuộc trò chuyện mới được tạo lần đầu -> Tải lại lịch sử để lấy đủ cấu trúc thread mới
        this.loadCustomerHistory();
      }
    },

    // 4. Khách hàng gửi tin nhắn
    async sendMessage(noiDungText) {
      if (!this.currentUser?.id) {
        alert("Vui lòng đăng nhập để gửi tin nhắn!");
        return;
      }

      // Đảm bảo lấy pendingContext mới nhất (trực tiếp từ sessionStorage hoặc data)
      this.loadPendingContext();

      this.sending = true;
      try {
        const payload = {
          id_khach_hang: this.currentUser.id,
          noi_dung: noiDungText,
        };

        if (this.pendingContext) {
          payload.id_san_pham = this.pendingContext.id_san_pham;
          payload.id_don_hang = this.pendingContext.id_don_hang;
          payload.tieu_de = this.pendingContext.tieu_de;
        } else if (this.latestThread?.id) {
          payload.id_cuoc_tro_truyen = this.latestThread.id;
        }

        console.log("Pending Context hiện tại:", this.pendingContext);
        console.log("Payload chuẩn bị gửi đi:", payload);

        await TinNhanService.guiTinNhanKH(payload);

        // XÓA SẠCH sessionStorage SAU KHI GỬI THÀNH CÔNG
        sessionStorage.removeItem("pending_chat_context");
        this.pendingContext = null;
      } catch (error) {
        console.error("Lỗi khi gửi tin nhắn:", error);
      } finally {
        this.sending = false;
      }
    },

    // 5. XỬ LÝ KHI NHÂN VIÊN ĐÃ XEM TIN NHẮN
    handleMessagesRead(data) {
      // Chỉ xử lý nếu đúng lịch sử trò chuyện này và ĐỦ ĐIỀU KIỆN người đọc là "staff"
      if (
        data.history_id === this.history?.id &&
        data.reader_role === "staff"
      ) {
        if (Array.isArray(this.history.cuoc_tro_truyen)) {
          // Duyệt qua tất cả các chủ đề và cập nhật tin nhắn của khách thành da_doc = true
          this.history.cuoc_tro_truyen.forEach((thread) => {
            if (Array.isArray(thread.tin_nhan)) {
              thread.tin_nhan.forEach((msg) => {
                if (msg.vai_tro_nguoi_gui === "customer") {
                  msg.da_doc = true;
                }
              });
            }
          });
        }
      }
    },
  },

  unmounted() {
    // Hủy lắng nghe các sự kiện và rời phòng khi khách chuyển trang
    if (this.history?.id) {
      socketService.leaveRoom(this.history.id);
    }
    socketService.off("receive_message", this.handleIncomingMessage);
    socketService.off("messages_read", this.handleMessagesRead);
  },
};
</script>

<style scoped>
.chat-item:hover {
  background-color: #f8f9fa;
}
.cursor-pointer {
  cursor: pointer;
}
.transition-all {
  transition: all 0.2s ease;
}
.text-break {
  word-break: break-word;
}
</style>
