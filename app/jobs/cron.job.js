const cron = require("node-cron");
const DonHangService = require("../services/don-hang.service");
const prisma = require("../utils/prisma");
const { triggerRagSync } = require("../utils/rag-sync.helper");

const donHangService = new DonHangService();

// 1. Cron Job quét đơn hàng quá hạn thanh toán
const khoiDongCronHuyDon = () => {
  // Lên lịch chạy mỗi 30 phút một lần: '*/30 * * * *'
  // (Nếu muốn test nhanh, bạn có thể đổi thành '*/1 * * * *' để nó chạy mỗi 1 phút)
  cron.schedule("*/30 * * * *", async () => {
    console.log("⏰ [CRON JOB] Bắt đầu quét đơn hàng quá hạn thanh toán...");
    try {
      const ketQua = await donHangService.quetVaHuyDonQuaHan();
      if (ketQua.count > 0) {
        console.log(
          `✅ [CRON JOB] Đã tự động hủy thành công ${ketQua.count}/${ketQua.total} đơn hàng quá hạn.`,
        );
      } else {
        console.log(
          "✨ [CRON JOB] Không có đơn hàng nào cần hủy trong đợt này.",
        );
      }
    } catch (error) {
      console.error(
        "❌ [CRON JOB] Lỗi hệ thống khi chạy Cron Job hủy đơn:",
        error,
      );
    }
  });
};

// 2. Cron Job đồng bộ giá khuyễn mãi (và đánh giá sản phẩm) cho AI Chatbot (chạy mỗi ngày)
const khoiDongCronDongBoAI = () => {
  // Chạy vào 00:01 sáng mỗi ngày: '1 0 * * *'
  // (Nếu muốn test nhanh khi bảo vệ đồ án, bạn có thể đổi thành '*/1 * * * *' để chạy mỗi 1 phút)
  cron.schedule(
    "1 0 * * *",
    // "*/1 * * * *",

    async () => {
      try {
        console.log(`✅ [CRON JOB] Kích hoạt đồng bộ AI định kỳ...`);
        triggerRagSync(`Đồng bộ định kỳ`);
      } catch (error) {
        console.error(
          "❌ [CRON JOB] Lỗi hệ thống khi chạy Cron Job đồng bộ AI định kỳ:",
          error,
        );
      }
    },
  );
};

// Hàm khởi động tất cả Cron Job của hệ thống
const khoiDongTatCaCronJob = () => {
  khoiDongCronHuyDon();
  khoiDongCronDongBoAI();
};

module.exports = {
  khoiDongTatCaCronJob,
  khoiDongCronHuyDon,
  khoiDongCronDongBoAI,
};
