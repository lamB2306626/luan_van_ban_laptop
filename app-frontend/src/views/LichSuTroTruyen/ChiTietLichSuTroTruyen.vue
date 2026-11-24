<template>
  <div class="container-fluid my-4">
    <div class="card shadow-sm border-0 rounded-3">
      <!-- Header Trang Chi Tiết Chat -->
      <div
        class="card-header bg-dark text-white py-3 d-flex justify-content-between align-items-center"
      >
        <div class="d-flex align-items-center">
          <button
            class="btn btn-sm btn-outline-light me-3"
            @click="$router.push({ name: 'admin-tin-nhan-danh-sach' })"
          >
            <i class="fas fa-arrow-left me-1"></i> Quay lại danh sách
          </button>
          <div>
            <h5 class="mb-0 fw-bold">Chi tiết Lịch sử CSKH</h5>
            <small class="text-white-50" v-if="selectedCustomerInfo">
              Khách hàng: {{ selectedCustomerInfo.ho_ten }}
              <span v-if="selectedCustomerInfo.so_dien_thoai">
                ({{ selectedCustomerInfo.so_dien_thoai }})
              </span>
            </small>
          </div>
        </div>
      </div>

      <div class="card-body p-0">
        <div class="row g-0">
          <!-- Cột bên trái (4 Cột): Danh sách Lịch sử Khách hàng tư vấn -->
          <div class="col-md-4 border-end" style="height: 600px">
            <DSLichSuTroTruyen
              :lich-su-list="historyList"
              :selected-id="currentHistoryId"
              @select-chat="selectHistoryChat"
              :is-admin="true"
              :current-staff-id="currentStaff?.id"
            />
          </div>

          <!-- Cột bên phải (8 Cột): Khung hiển thị chuỗi lịch sử & nhập tin nhắn -->
          <div class="col-md-8" style="height: 600px">
            <TinNhanFrom
              :history="historyDetail"
              :sending="sending"
              @send-message="sendMessage"
              :is-admin="true"
              :current-staff-id="currentStaff?.id"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TinNhanFrom from "@/components/TrangLienHe/TinNhanFrom.vue";
import DSLichSuTroTruyen from "@/components/TrangLienHe/DSLichSuTroTruyen.vue";
import LichSuTroTruyenService from "@/services/lich-su-tro-truyen.service";
import TinNhanService from "@/services/tin-nhan.service";
import socketService from "@/services/socket.service";

export default {
  name: "ChiTietCuocTroTruyen",
  components: {
    TinNhanFrom,
    DSLichSuTroTruyen,
  },
  data() {
    return {
      historyList: [], // Danh sách Hộp thư lịch sử thô từ find()
      historyDetail: {}, // Toàn bộ lịch sử trò truyện
      currentHistoryId: null, // ID của lịch sử trò chuyện hiện tại
      sending: false,
    };
  },
  computed: {
    currentStaff() {
      try {
        const staffStr = localStorage.getItem("adminUser");
        return staffStr ? JSON.parse(staffStr) : null;
      } catch (e) {
        return null;
      }
    },

    // Lấy cuộc trò chuyện / chủ đề mới nhất để hàm sendMessage sẽ tạo tin nhắn cho cuộc trò truyện này
    latestThread() {
      if (
        !this.historyDetail.cuoc_tro_truyen ||
        this.historyDetail.cuoc_tro_truyen.length === 0
      )
        return null;
      return this.historyDetail.cuoc_tro_truyen[
        this.historyDetail.cuoc_tro_truyen.length - 1
      ];
    },

    // Thông tin khách hàng đang được chọn
    selectedCustomerInfo() {
      return this.historyDetail?.khach_hang || null;
    },
  },
  watch: {
    // Theo dõi tham số URL route params (id của Hộp thư lich_su_tro_truyen)
    "$route.params.id": {
      async handler(newHistoryId, oldHistoryId) {
        // Rời khỏi phòng chat cũ nếu có
        if (oldHistoryId) {
          socketService.leaveRoom(oldHistoryId);
        }

        if (newHistoryId) {
          await this.loadHistoryDetail(newHistoryId);
        }
      },
      immediate: true,
    },
  },
  methods: {
    // 1. Tải danh sách Hộp thư lịch sử cho cột bên trái
    async loadLichSuList() {
      try {
        this.historyList = await LichSuTroTruyenService.getAll();
      } catch (error) {
        console.error("Lỗi khi tải danh sách lịch sử trò chuyện:", error);
      }
    },

    // 2. Tải toàn bộ chi tiết 1 Hộp thư Lịch sử theo ID cho cột bên phải
    async loadHistoryDetail(historyId) {
      if (!historyId) return;
      this.currentHistoryId = historyId;

      try {
        // Gọi hàm get lấy nguyên đối tượng Hộp thư tổng
        this.historyDetail = await LichSuTroTruyenService.get(historyId);

        if (this.historyDetail?.id) {
          // Đánh dấu ĐÃ ĐỌC các tin nhắn do Khách gửi
          await LichSuTroTruyenService.markAsRead(this.historyDetail.id, {
            readerRole: "staff",
          });

          // -------------------------------------------------------------
          // KẾT NỐI SOCKET VÀ JOIN ROOM VÀO PHÒNG CHAT CHI TIẾT
          // -------------------------------------------------------------
          socketService.connect();
          socketService.joinRoom(this.historyDetail.id);

          // Đăng ký nhận sự kiện tin nhắn mới
          socketService.off("receive_message", this.handleIncomingMessage);
          socketService.on("receive_message", this.handleIncomingMessage);

          // ĐĂNG KÝ LẮNG NGHE SỰ KIỆN ĐÃ XEM (READ RECEIPT)
          socketService.off("messages_read", this.handleMessagesRead);
          socketService.on("messages_read", this.handleMessagesRead);
        }

        // Tải lại danh sách cột bên trái để cập nhật badge tin chưa đọc
        await this.loadLichSuList();
      } catch (error) {
        console.error("Lỗi khi tải chi tiết lịch sử tư vấn:", error);
      }
    },

    // 3. Xử lý khi có tin nhắn Real-time qua Socket (Phòng Chi Tiết)
    handleIncomingMessage(tinNhanMoi) {
      if (!this.historyDetail?.cuoc_tro_truyen) return;

      // TH1: Tin nhắn thuộc cuộc trò chuyện đang hiển thị ở khung bên phải
      const targetThread = this.historyDetail.cuoc_tro_truyen.find(
        (t) => t.id === tinNhanMoi.id_cuoc_tro_truyen,
      );

      if (targetThread) {
        if (!targetThread.tin_nhan) {
          targetThread.tin_nhan = [];
        }

        const isExisted = targetThread.tin_nhan.some(
          (m) => m.id === tinNhanMoi.id,
        );

        if (!isExisted) {
          targetThread.tin_nhan.push(tinNhanMoi);

          // Nếu nhân viên đang mở đúng khung chat này mà khách nhắn đến -> Đánh dấu đã đọc ngầm
          if (tinNhanMoi.vai_tro_nguoi_gui === "customer") {
            LichSuTroTruyenService.markAsRead(this.historyDetail.id, {
              readerRole: "staff",
            });
          }
        }
      } else {
        // TH2: Tin nhắn của một chủ đề mới chưa có trên giao diện -> Tải lại chi tiết
        this.loadHistoryDetail(this.currentHistoryId);
      }

      // Cập nhật lại danh sách bên trái để đẩy khách hàng có tin nhắn mới lên đầu/cập nhật badge
      this.loadLichSuList();
    },

    // 4. XỬ LÝ KHI KHÁCH HÀNG ĐÃ XEM TIN NHẮN REAL-TIME
    handleMessagesRead(data) {
      // Chỉ xử lý nếu đúng lịch sử trò chuyện này và ĐỦ ĐIỀU KIỆN người đọc là "customer"
      if (
        data.history_id === this.historyDetail?.id &&
        data.reader_role === "customer"
      ) {
        if (Array.isArray(this.historyDetail.cuoc_tro_truyen)) {
          // Duyệt qua tất cả các chủ đề và cập nhật tin nhắn của Staff gửi thành da_doc = true
          this.historyDetail.cuoc_tro_truyen.forEach((thread) => {
            if (Array.isArray(thread.tin_nhan)) {
              thread.tin_nhan.forEach((msg) => {
                if (msg.vai_tro_nguoi_gui === "staff") {
                  msg.da_doc = true;
                }
              });
            }
          });
        }
      }
    },

    // 4. Xử lý khi nhận được Thông báo Kênh Tổng
    handleStaffNotification(data) {
      if (!data || !data.history_id) return;

      // Tìm vị trí của Hộp thư khách hàng trong mảng hiện tại
      const index = this.historyList.findIndex(
        (item) => item.id === data.history_id,
      );

      // TH1: KHÁCH HÀNG CŨ (Đã có trong danh sách)
      if (index !== -1) {
        // Bóc tách đối tượng ra khỏi vị trí cũ
        const [targetItem] = this.historyList.splice(index, 1);

        // Cập nhật tin nhắn mới nhất vào chủ đề tương ứng (nếu có payload tin_nhan)
        if (data.tin_nhan && targetItem.cuoc_tro_truyen?.length > 0) {
          const latestThread = targetItem.cuoc_tro_truyen[0];

          if (!latestThread.tin_nhan) {
            latestThread.tin_nhan = [];
          }
          // Thêm tin nhắn mới vào đầu mảng tin_nhan
          latestThread.tin_nhan.unshift(data.tin_nhan);
        }

        // Tăng số lượng tin nhắn chưa đọc (_count.tin_nhan) cho chủ đề mới nhất
        if (targetItem.cuoc_tro_truyen?.[0]?._count) {
          targetItem.cuoc_tro_truyen[0]._count.tin_nhan =
            (targetItem.cuoc_tro_truyen[0]._count.tin_nhan || 0) + 1;
        }

        // Đưa Hộp thư này lên vị trí ĐẦU TIÊN (index 0) của danh sách
        this.historyList.unshift(targetItem);
      }
      // TH2: KHÁCH HÀNG MỚI HOÀN TOÀN (Chưa có trong danh sách)
      else {
        // Tải lại API 1 lần duy nhất để lấy đủ thông tin Khách hàng mới
        this.loadLichSuList();
      }
    },

    // 5. Chọn 1 Khách hàng/Hộp thư từ danh sách cột bên trái
    selectHistoryChat(historyItem) {
      if (!historyItem?.id) return;

      // Chuyển route bằng ID Hộp thư lịch sử
      if (this.$route.params.id !== historyItem.id) {
        this.$router.push({
          name: "lich-su-tro-truyen.detail",
          params: { id: historyItem.id },
        });
      }
    },

    // 6. Nhân viên gửi tin nhắn (Gửi vào Chủ đề mới nhất)
    async sendMessage(noiDungText) {
      if (!this.latestThread?.id || !this.currentStaff?.id) {
        alert("Không tìm thấy thông tin nhân viên hoặc chủ để chat!");
        return;
      }

      this.sending = true;
      try {
        const payload = {
          id_cuoc_tro_truyen: this.latestThread.id,
          id_nhan_vien: this.currentStaff.id,
          noi_dung: noiDungText,
        };

        await TinNhanService.guiTinNhanNV(payload);
      } catch (error) {
        console.error("Lỗi khi nhân viên gửi tin nhắn:", error);
      } finally {
        this.sending = false;
      }
    },
  },
  async mounted() {
    await this.loadLichSuList();

    // Lắng nghe sự kiện Kênh tổng staff_notification để cập nhật cột danh sách bên trái
    socketService.connect();
    socketService.joinStaffRoom();
    socketService.off("staff_notification", this.handleStaffNotification);
    socketService.on("staff_notification", this.handleStaffNotification);
  },

  unmounted() {
    // Hủy lắng nghe sự kiện và rời phòng chat khi Nhân viên chuyển trang
    if (this.currentHistoryId) {
      socketService.leaveRoom(this.currentHistoryId);
    }
    socketService.off("receive_message", this.handleIncomingMessage);
    socketService.off("messages_read", this.handleMessagesRead);
    socketService.off("staff_notification", this.handleStaffNotification);
  },
};
</script>
