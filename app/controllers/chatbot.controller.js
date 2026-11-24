const ChatbotService = require("../services/chatbot.service");
const ApiError = require("../api-error");

exports.chat = async (req, res, next) => {
  // Đổi thành id_phien_chat_ai cho khớp với tên bảng/cột của bạn
  const { message, id_phien_chat_ai, id_khach_hang } = req.body;

  if (!message || String(message).trim() === "") {
    return next(new ApiError(400, "Nội dung tin nhắn không được để trống"));
  }

  try {
    const service = new ChatbotService();
    const result = await service.askAdvisor({
      userMessage: message.trim(),
      id_phien_chat_ai: id_phien_chat_ai || null,
      id_khach_hang: id_khach_hang || null,
    });

    return res.send({
      message: "Phản hồi tư vấn thành công",
      data: {
        id_phien_chat_ai: result.id_phien_chat_ai,
        rewritten_query: result.rewritten_query,
        reply: result.reply,
        sources: result.sources,
      },
    });
  } catch (error) {
    console.error("Chatbot Error:", error);

    if (error.message === "PHIEN_CHAT_KHONG_TON_TAI") {
      return next(new ApiError(404, "Phiên chat không tồn tại trong hệ thống"));
    }

    if (error.message === "KHACH_HANG_KHONG_TON_TAI") {
      return next(new ApiError(400, "Mã khách hàng không hợp lệ"));
    }

    if (error.message === "GROQ_RATE_LIMIT") {
      return next(
        new ApiError(
          429,
          "Hệ thống tư vấn đang bận, bạn vui lòng đợi vài giây rồi gửi lại nhé",
        ),
      );
    }

    if (error.message === "RAG_SERVICE_UNAVAILABLE") {
      return next(
        new ApiError(
          503,
          "Dịch vụ tìm kiếm sản phẩm AI tạm thời gián đoạn, vui lòng thử lại sau",
        ),
      );
    }

    return next(
      new ApiError(500, "Đã xảy ra lỗi trong quá trình xử lý tư vấn Chatbot"),
    );
  }
};
