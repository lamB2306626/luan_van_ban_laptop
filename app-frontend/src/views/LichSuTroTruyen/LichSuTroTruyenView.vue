<template>
  <div class="container-fluid my-4">
    <div class="card shadow-sm border-0 rounded-3">
      <!-- Header Trang Admin CSKH -->
      <div
        class="card-header bg-dark text-white py-3 d-flex justify-content-between align-items-center"
      >
        <div class="d-flex align-items-center">
          <i class="fas fa-users-comments fa-2x me-3 text-warning"></i>
          <div>
            <h5 class="mb-0 fw-bold">Quản lý Tin nhắn & CSKH</h5>
            <small class="text-white-50">
              Danh sách khách hàng cần tư vấn và hỗ trợ
            </small>
          </div>
        </div>
      </div>

      <!-- Body: Danh sách thẻ Lịch sử theo Khách hàng -->
      <div class="card-body p-3 bg-light">
        <div
          class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3"
          v-if="lichSuList.length > 0"
        >
          <div v-for="item in lichSuList" :key="item.id" class="col">
            <div
              class="card h-100 shadow-sm border-0 rounded-3 cursor-pointer chat-card-hover position-relative"
              :class="{
                'border-start border-4 border-danger': getTotalUnread(item) > 0,
              }"
              @click="goToDetail(item)"
            >
              <div class="card-body">
                <!-- Thông tin Khách hàng & Badge Unread -->
                <div
                  class="d-flex justify-content-between align-items-start mb-2"
                >
                  <div class="d-flex align-items-center">
                    <UserAvatar
                      :avatar-file-name="item.khach_hang?.avatar"
                      :name="item.khach_hang?.ho_ten"
                      user-type="KhachHang"
                      :size="36"
                      class="me-2"
                    />
                    <div>
                      <h6 class="fw-bold text-dark mb-0">
                        {{ item.khach_hang?.ho_ten || "Khách hàng" }}
                      </h6>
                      <small
                        class="text-muted style-xs"
                        v-if="item.khach_hang?.so_dien_thoai"
                      >
                        <i class="fas fa-phone me-1"></i>
                        {{ item.khach_hang.so_dien_thoai }}
                      </small>
                    </div>
                  </div>

                  <!-- Badge báo tổng số tin nhắn chưa đọc màu đỏ -->
                  <span
                    v-if="getTotalUnread(item) > 0"
                    class="badge bg-danger rounded-pill animation-pulse"
                  >
                    <i class="fas fa-comment-dots me-1"></i>
                    {{ getTotalUnread(item) }} tin mới
                  </span>
                </div>

                <!-- Thông tin Chủ đề / Ngữ cảnh mới nhất -->
                <div
                  class="mb-2 p-2 bg-light rounded border border-light-subtle"
                >
                  <div
                    class="d-flex justify-content-between align-items-center mb-1"
                  >
                    <small
                      class="fw-bold text-primary style-xs text-truncate"
                      style="max-width: 180px"
                    >
                      <i class="fas fa-bookmark me-1"></i>
                      {{ getLatestThread(item)?.tieu_de || "Tư vấn hỗ trợ" }}
                    </small>
                    <small class="text-muted style-xs">
                      <i class="far fa-clock me-1"></i>
                      {{ formatDate(item.updated_at) }}
                    </small>
                  </div>

                  <!-- Tag hiển thị Sản phẩm hoặc Đơn hàng của chủ đề mới nhất -->
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

                <!-- Tin nhắn xem trước mới nhất -->
                <p
                  class="small text-truncate mb-0 p-2 rounded"
                  :class="
                    getTotalUnread(item) > 0
                      ? 'bg-warning-subtle fw-bold text-dark'
                      : 'bg-white text-muted border'
                  "
                >
                  <i class="far fa-comment-dots me-1"></i>
                  {{ getSenderName(getLatestMessage(item)) }}:
                  {{ getLatestMessage(item)?.noi_dung || "Chưa có tin nhắn" }}
                </p>
              </div>

              <div
                class="card-footer bg-white border-top-0 d-flex justify-content-between align-items-center"
              >
                <span class="text-primary small fw-bold">
                  Mở lịch sử tư vấn <i class="fas fa-arrow-right ms-1"></i>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Trạng thái trống -->
        <div v-else class="text-center py-5 bg-white rounded shadow-sm">
          <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
          <h5 class="text-secondary">
            Không có cuộc trò chuyện nào trong mục này
          </h5>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import UserAvatar from "@/components/Common/UserAvatar.vue";
import LichSuTroTruyenService from "@/services/lich-su-tro-truyen.service";
import socketService from "@/services/socket.service"; // Import Socket Service

export default {
  name: "QuanLyLichSuTroTruyenView",
  components: {
    UserAvatar,
  },
  data() {
    return {
      lichSuList: [], // Danh sách dữ liệu thô từ LichSuTroTruyenService.getAll
      filterTrangThai: "OPEN",
    };
  },
  computed: {
    currentUser() {
      try {
        const userStr = localStorage.getItem("adminUser");
        return userStr ? JSON.parse(userStr) : null;
      } catch (e) {
        return null;
      }
    },
  },

  methods: {
    // 1. Tải danh sách Hộp thư lịch sử từ Backend
    async loadLichSuList() {
      try {
        this.lichSuList = await LichSuTroTruyenService.getAll();
      } catch (error) {
        console.error("Lỗi khi lấy danh sách lịch sử trò chuyện:", error);
      }
    },

    // 2. Xử lý khi có thông báo tin nhắn mới từ Kênh tổng
    handleStaffNotification(data) {
      if (!data || !data.history_id) return;

      // Tìm vị trí của Hộp thư khách hàng trong mảng hiện tại
      const index = this.lichSuList.findIndex(
        (item) => item.id === data.history_id,
      );

      // TH1: KHÁCH HÀNG CŨ (Đã có trong danh sách)
      if (index !== -1) {
        // Bóc tách đối tượng ra khỏi vị trí cũ
        const [targetItem] = this.lichSuList.splice(index, 1);

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
        this.lichSuList.unshift(targetItem);
      }
      // TH2: KHÁCH HÀNG MỚI HOÀN TOÀN (Chưa có trong danh sách)
      else {
        // Tải lại API 1 lần duy nhất để lấy đủ thông tin Khách hàng mới
        this.loadLichSuList();
      }
    },

    // 3. Helper lấy Chủ đề mới nhất (cuoc_tro_truyen[0])
    getLatestThread(historyItem) {
      return historyItem?.cuoc_tro_truyen?.[0] || null;
    },

    // 4. Helper lấy Tin nhắn mới nhất
    getLatestMessage(historyItem) {
      const latestThread = this.getLatestThread(historyItem);
      return latestThread?.tin_nhan?.[0] || null;
    },

    // 6. Tính tổng tin chưa đọc từ tất cả các cuộc trò chuyện của khách này
    getTotalUnread(historyItem) {
      if (!historyItem?.cuoc_tro_truyen) return 0;
      return historyItem.cuoc_tro_truyen.reduce(
        (sum, thread) => sum + (thread._count?.tin_nhan || 0),
        0,
      );
    },

    // 7. Lấy tên người gửi cho phần xem trước tin nhắn
    getSenderName(msg) {
      if (!msg) return "";
      if (msg.id_nhan_vien === this.currentUser?.id) {
        return "Bạn";
      }
      if (msg.vai_tro_nguoi_gui === "customer") {
        return msg.khach_hang?.ho_ten || "Khách hàng";
      }
      return msg.nhan_vien?.ho_ten || "Tư vấn viên";
    },

    // 8. Điều hướng tới trang chi tiết lịch sử tư vấn
    goToDetail(historyItem) {
      if (!historyItem?.id) return;

      this.$router.push({
        name: "lich-su-tro-truyen.detail",
        params: { id: historyItem.id },
      });
    },

    // 9. Format thời gian
    formatDate(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      return (
        date.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }) +
        " " +
        date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
      );
    },
  },

  async mounted() {
    await this.loadLichSuList();

    // -------------------------------------------------------------
    // KẾT NỐI SOCKET VÀ LẮNG NGHE KÊNH TỔNG CỦA NHÂN VIÊN
    // -------------------------------------------------------------
    socketService.connect();
    socketService.joinStaffRoom();

    socketService.off("staff_notification", this.handleStaffNotification);
    socketService.on("staff_notification", this.handleStaffNotification);
  },

  unmounted() {
    // Tắt lắng nghe khi Nhân viên rời khỏi trang danh sách
    socketService.off("staff_notification", this.handleStaffNotification);
  },
};
</script>

<style scoped>
.chat-card-hover:hover {
  transform: translateY(-3px);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
}
.cursor-pointer {
  cursor: pointer;
}
</style>
