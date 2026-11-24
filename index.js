const app = require("./app");
const config = require("./app/config");
const { PrismaClient } = require("@prisma/client");
const { khoiDongTatCaCronJob } = require("./app/jobs/cron.job.js");

// 1. Import module http và Socket.IO
const http = require("http");
const { Server } = require("socket.io");

const prisma = new PrismaClient();

async function startServer() {
  try {
    // Kiểm tra kết nối tới PostgreSQL qua Prisma
    await prisma.$connect();
    console.log("Connected to the PostgreSQL database!");

    // Khởi động toàn bộ Cron Job (Quét hủy đơn quá hạn + Đồng bộ AI)
    khoiDongTatCaCronJob();

    // 2. Tạo HTTP Server từ Express app
    const server = http.createServer(app);

    // 3. Khởi tạo Socket.IO với cấu hình CORS
    const io = new Server(server, {
      cors: {
        origin: "*", // Bạn có thể thay "*" thành domain Frontend cụ thể (vd: "http://localhost:5173")
        methods: ["GET", "POST"],
      },
    });

    // 4. Lắng nghe các kết nối Socket.IO
    io.on("connection", (socket) => {
      console.log(`[Socket] Người dùng kết nối: ${socket.id}`);

      // Tham gia vào phòng chat (room) theo ID lịch sử trò chuyện
      socket.on("join_room", (historyId) => {
        if (historyId) {
          const roomName = `history_${historyId}`;

          if (!socket.rooms.has(roomName)) {
            socket.join(roomName);
            console.log(
              `[Socket] ${socket.id} đã vào phòng chat (chi tiết): ${roomName}`,
            );
          }
        }
      });

      // Rời khỏi phòng chat
      socket.on("leave_room", (historyId) => {
        if (historyId) {
          const roomName = `history_${historyId}`;
          socket.leave(roomName);
          console.log(`[Socket] ${socket.id} đã rời phòng: ${roomName}`);
        }
      });

      // =========================================================================
      // Kênh CÁ NHÂN dành riêng cho Khách hàng (user_room)
      // =========================================================================

      socket.on("join_user_room", (userId) => {
        if (userId) {
          const userRoomName = `user_${userId}`;

          // Kiểm tra nếu chưa có trong room thì mới join và log
          if (!socket.rooms.has(userRoomName)) {
            socket.join(userRoomName);
            console.log(
              `[Socket] Client ${socket.id} (khách hàng) đã vào phòng CÁ NHÂN: ${userRoomName}`,
            );
          }
        }
      });

      socket.on("leave_user_room", (userId) => {
        if (userId) {
          const userRoomName = `user_${userId}`;
          socket.leave(userRoomName);
          console.log(
            `[Socket] Client ${socket.id} đã rời phòng CÁ NHÂN: ${userRoomName}`,
          );
        }
      });

      // =========================================================================
      // Kênh TỔNG dành riêng cho Nhân viên / Admin (staff_room)
      // =========================================================================
      socket.on("join_staff_room", () => {
        const staffRoomName = "staff_room";
        if (!socket.rooms.has(staffRoomName)) {
          socket.join(staffRoomName);
          console.log(
            `[Socket] Client ${socket.id} (Nhân viên) đã vào KÊNH TỔNG: ${staffRoomName}`,
          );
        }
      });

      socket.on("leave_staff_room", () => {
        const staffRoomName = "staff_room";
        socket.leave(staffRoomName);
        console.log(
          `[Socket] Client ${socket.id} đã rời KÊNH TỔNG: ${staffRoomName}`,
        );
      });

      // Ngắt kết nối
      socket.on("disconnect", () => {
        console.log(`[Socket] Người dùng ngắt kết nối: ${socket.id}`);
      });
    });

    // 5. Gắn io vào app để Controller có thể lấy ra sử dụng qua req.app.get("io")
    app.set("io", io);

    const PORT = config.app.port || 5000;

    // 6. LƯU Ý QUAN TRỌNG: Lắng nghe bằng server (HTTP Server) thay vì app.listen
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.log("Cannot connect to the database!", error);
    process.exit(1);
  }
}

startServer();
