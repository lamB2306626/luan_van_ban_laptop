const prisma = require("../utils/prisma");

class PhienChatAIService {
  // Lọc lấy các trường thuộc tính hợp lệ cho bảng phien_chat_ai
  extractPhienChatData(payload) {
    const phienChat = {
      id: payload.id,
      id_khach_hang: payload.id_khach_hang,
      tieu_de: payload.tieu_de,
    };
    Object.keys(phienChat).forEach(
      (key) => phienChat[key] === undefined && delete phienChat[key],
    );
    return phienChat;
  }

  // 1. Tạo phiên chat mới (Tự sinh mã PC000001, PC000002... nếu client không truyền id)
  async create(payload = {}) {
    if (!payload.id) {
      // Tìm 1 phiên chat có ID lớn nhất hiện tại
      const lastPhienChat = await prisma.phien_chat_ai.findFirst({
        orderBy: {
          id: "desc",
        },
      });

      if (!lastPhienChat) {
        payload.id = "PC000001";
      } else {
        // Lấy phần số ra khỏi chuỗi (VD: "PC000005" -> lấy số 5)
        const currentNumber =
          parseInt(lastPhienChat.id.replace(/\D/g, ""), 10) || 0;
        // Cộng thêm 1 và format lại thành chuỗi 8 ký tự (VD: PC000006)
        payload.id = `PC${String(currentNumber + 1).padStart(6, "0")}`;
      }
    }

    const data = this.extractPhienChatData(payload);

    try {
      return await prisma.phien_chat_ai.create({
        data: data,
      });
    } catch (error) {
      // Mã P2003: id_khach_hang truyền vào không tồn tại trong bảng khach_hang
      if (error.code === "P2003") {
        throw new Error("KHACH_HANG_KHONG_TON_TAI");
      }
      throw error;
    }
  }

  // 2. Lấy danh sách các phiên chat (Lọc theo id_khach_hang hoặc id)
  async find(filterData = {}) {
    const where = {};

    if (filterData.id) {
      where.id = filterData.id;
    }

    if (filterData.id_khach_hang) {
      where.id_khach_hang = filterData.id_khach_hang;
    }

    return await prisma.phien_chat_ai.findMany({
      where: where,
      orderBy: {
        ngay_cap_nhat: "desc", // Phiên vừa nhắn tin mới nhất luôn nổi lên đầu
      },
    });
  }

  // 3. Tìm chi tiết một Phiên Chat kèm toàn bộ lịch sử tin nhắn (Dùng khi mở lại phiên cũ / F5 trang)
  async findById(id) {
    return await prisma.phien_chat_ai.findUnique({
      where: { id: id },
      include: {
        tin_nhan_chat_ai: {
          orderBy: {
            id: "asc", // Sắp xếp tin nhắn từ cũ đến mới theo thứ tự hội thoại
          },
        },
      },
    });
  }

  // 4. Cập nhật thông tin phiên chat (VD: Đổi tiêu đề cuộc trò chuyện)
  async update(id, payload) {
    const updateData = this.extractPhienChatData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính
    delete updateData.id_khach_hang; // Không đổi chủ sở hữu phiên chat

    try {
      return await prisma.phien_chat_ai.update({
        where: { id: id },
        data: updateData,
      });
    } catch (error) {
      if (error.code === "P2025") {
        return null;
      }
      throw error;
    }
  }

  // 5. Xóa một phiên chat dựa trên id (Tự động xóa kèm các tin nhắn nhờ onDelete: Cascade)
  async delete(id) {
    try {
      return await prisma.phien_chat_ai.delete({
        where: { id: id },
      });
    } catch (error) {
      if (error.code === "P2025") {
        return null;
      }
      throw error;
    }
  }

  // =========================================================================
  // CÁC HÀM CHUYÊN DỤNG CHO TIN NHẮN & CẤP NGỮ CẢNH CHO CHATBOT AI
  // =========================================================================

  // 6. Lưu một tin nhắn mới vào bảng tin_nhan_chat_ai và cập nhật thời gian của phien_chat_ai
  async addMessage({
    id_phien_chat_ai,
    vai_tro,
    noi_dung,
    san_pham_goi_y = null,
  }) {
    try {
      // Dùng $transaction để đảm bảo lưu tin nhắn và cập nhật thời gian phiên diễn ra đồng bộ
      const [newMessage] = await prisma.$transaction([
        prisma.tin_nhan_chat_ai.create({
          data: {
            id_phien_chat_ai: id_phien_chat_ai,
            vai_tro: vai_tro, // "user" hoặc "assistant"
            noi_dung: noi_dung,
            san_pham_goi_y: san_pham_goi_y ?? undefined,
          },
        }),
        prisma.phien_chat_ai.update({
          where: { id: id_phien_chat_ai },
          data: {
            ngay_cap_nhat: new Date(), // Đẩy phiên này lên đầu danh sách lịch sử
          },
        }),
      ]);

      return newMessage;
    } catch (error) {
      if (error.code === "P2003" || error.code === "P2025") {
        throw new Error("PHIEN_CHAT_KHONG_TON_TAI");
      }
      throw error;
    }
  }

  // 7. Lấy N tin nhắn gần nhất của phiên để ChatbotService nạp ngữ cảnh (Query Rewriting + Groq Prompt)
  async getRecentMessages(id_phien_chat_ai, limit = 6) {
    const messages = await prisma.tin_nhan_chat_ai.findMany({
      where: {
        id_phien_chat_ai: id_phien_chat_ai,
      },
      orderBy: {
        id: "desc", // Lấy N tin mới nhất từ dưới lên
      },
      take: limit,
      select: {
        vai_tro: true,
        noi_dung: true,
      },
    });

    // Đảo ngược lại mảng để đúng trình tự thời gian (cũ trước -> mới sau) khi đưa vào LLM
    return messages.reverse().map((msg) => ({
      role: msg.vai_tro === "user" ? "user" : "assistant",
      content: msg.noi_dung,
    }));
  }
}

module.exports = PhienChatAIService;
