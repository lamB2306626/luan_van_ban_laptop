import { io } from "socket.io-client";

// Thay đổi URL theo cổng chạy Backend của bạn (vd: http://localhost:5000)
const SOCKET_URL = "http://localhost:5000";

class SocketService {
  socket = null;

  // Khởi tạo kết nối Socket (chỉ tạo 1 instance duy nhất)
  connect() {
    // Nếu đã có socket và đang kết nối thì không tạo mới nữa
    if (this.socket && this.socket.connected) {
      return;
    }

    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: true,
      });

      this.socket.on("connect", () => {
        console.log(
          "[Socket Client] Kết nối thành công với ID:",
          this.socket.id,
        );
      });

      this.socket.on("disconnect", () => {
        console.log("[Socket Client] Đã ngắt kết nối");
      });
    }
  }

  // Tham gia vào phòng chat (history_id)
  joinRoom(historyId) {
    if (this.socket && historyId) {
      this.socket.emit("join_room", historyId);
    }
  }

  // Rời khỏi phòng chat
  leaveRoom(historyId) {
    if (this.socket && historyId) {
      this.socket.emit("leave_room", historyId);
    }
  }

  // =========================================================================
  // Kênh CÁ NHÂN dành cho Khách hàng
  // =========================================================================
  joinUserRoom(userId) {
    if (this.socket && userId) {
      this.socket.emit("join_user_room", userId);
    }
  }

  leaveUserRoom(userId) {
    if (this.socket && userId) {
      this.socket.emit("leave_user_room", userId);
    }
  }

  // =========================================================================
  // Kênh TỔNG dành cho Nhân viên / Admin
  // =========================================================================
  joinStaffRoom() {
    if (this.socket) {
      this.socket.emit("join_staff_room");
    }
  }

  leaveStaffRoom() {
    if (this.socket) {
      this.socket.emit("leave_staff_room");
    }
  }

  // Đăng ký lắng nghe sự kiện từ Server
  on(eventName, callback) {
    if (this.socket) {
      // Luôn tắt sự kiện cũ trước khi đăng ký sự kiện mới
      this.socket.off(eventName, callback);
      this.socket.on(eventName, callback);
    }
  }

  // Hủy lắng nghe sự kiện để tránh trùng lặp handler
  off(eventName, callback) {
    if (this.socket) {
      this.socket.off(eventName, callback);
    }
  }

  // Ngắt kết nối hoàn toàn
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new SocketService();
