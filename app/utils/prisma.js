const { PrismaClient } = require("@prisma/client");
const { triggerRagSync } = require("./rag-sync.helper");

// Danh sách các bảng có ảnh hưởng đến dữ liệu tư vấn của AI Chatbot
// (Các bảng khác như yeu_thich, tin_nhan_chat_ai, gio_hang... sẽ được bỏ qua hoàn toàn)
const RAG_TRACKED_MODELS = [
  "san_pham",
  "bien_the",
  "dot_khuyen_mai",
  "chi_tiet_khuyen_mai",
  "chi_tiet_don_hang",
  "don_hang",
];

// Các thao tác làm thay đổi dữ liệu trong Database
const WRITE_OPERATIONS = [
  "create",
  "createMany",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
  "upsert",
];

const basePrisma = new PrismaClient();

// Mở rộng PrismaClient với bộ lắng nghe tập trung ở tầng Database
const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        // 1. Thực thi câu lệnh truy vấn PostgreSQL gốc trước để lấy kết quả
        const result = await query(args);

        // 2. Nếu thao tác ghi rơi vào nhóm bảng sản phẩm / biến thể / khuyến mãi
        // => Tự động kích hoạt đồng bộ ngầm sang ChromaDB (có sẵn Debounce 2s)
        if (
          model &&
          RAG_TRACKED_MODELS.includes(model) &&
          WRITE_OPERATIONS.includes(operation)
        ) {
          triggerRagSync(`Bảng [${model}] thực hiện [${operation}]`);
        }

        return result;
      },
    },
  },
});

module.exports = prisma;
