const Groq = require("groq-sdk");
const PhienChatAIService = require("./phien-chat-ai.service");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Địa chỉ Python FastAPI Service đang chạy ở cổng 8000
const PYTHON_RAG_URL = process.env.PYTHON_RAG_URL || "http://localhost:8000";

class ChatbotService {
  constructor() {
    this.phienChatAIService = new PhienChatAIService();
  }

  // 1. Phân loại ý định (Xã giao vs Hỏi sản phẩm) + Viết lại câu hỏi theo ngữ cảnh
  async analyzeIntentAndRewrite(userMessage, history = []) {
    const historyText =
      history && history.length > 0
        ? history
            .map(
              (msg) =>
                `${msg.role === "user" ? "Khách" : "Tư vấn viên"}: ${msg.content}`,
            )
            .join("\n")
        : "Chưa có lịch sử hội thoại.";

    const analyzerPrompt = `
Phân tích câu nhắn mới nhất của khách hàng dựa trên lịch sử hội thoại và trả về kết quả dưới dạng JSON hợp lệ.

NHIỆM VỤ:
1. "is_product_query" (boolean):
   - Trả về false nếu khách chỉ đang chào hỏi, cảm ơn, khen ngợi, tạm biệt, xác nhận ngắn gọn (VD: "cảm ơn bạn", "ok shop", "dạ vâng", "chào bạn", "tạm biệt", "oke") mà KHÔNG hỏi thêm thông tin sản phẩm, giá cả, cấu hình hay tư vấn mua hàng.
   - Trả về true nếu khách đang tìm kiếm laptop, hỏi cấu hình, giá bán, khuyến mãi, so sánh, hoặc hỏi sâu về một mẫu máy đã nhắc ở lịch sử.
2. "rewritten_query" (string):
   - Nếu "is_product_query" là true: Viết lại câu hỏi mới nhất thành một câu truy vấn tìm kiếm độc lập, đầy đủ ngữ cảnh (thay thế các đại từ "máy này", "con đó", "nó", "biến thể màu trắng"... bằng tên dòng laptop cụ thể trong lịch sử). Nếu câu đã rõ nghĩa hoặc chuyển sang nhu cầu mới thì giữ nguyên ý chính.
   - Nếu "is_product_query" là false: Trả về nguyên văn câu nhắn của khách.

CHỈ TRẢ VỀ JSON ĐÚNG CẤU TRÚC SAU (không giải thích thêm):
{
  "is_product_query": true,
  "rewritten_query": "..."
}

Lịch sử hội thoại:
${historyText}

Câu nhắn mới của khách: "${userMessage}"
    `.trim();

    try {
      const completion = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: analyzerPrompt }],
        temperature: 0.1,
        max_tokens: 200,
        response_format: { type: "json_object" },
      });

      const rawContent = completion.choices[0]?.message?.content?.trim();
      const parsed = JSON.parse(rawContent);

      const isProductQuery = Boolean(parsed.is_product_query);
      const rewrittenQuery = parsed.rewritten_query?.trim() || userMessage;

      console.log(
        `🧠 [Intent & Rewrite]: isProduct=${isProductQuery} | "${userMessage}" --> "${rewrittenQuery}"`,
      );

      return {
        isProductQuery,
        rewrittenQuery,
      };
    } catch (error) {
      console.warn(
        "⚠️ Lỗi phân tích ý định, mặc định tìm kiếm theo câu gốc:",
        error.message,
      );
      return {
        isProductQuery: true,
        rewrittenQuery: userMessage,
      };
    }
  }

  // 2. Gọi sang Python ChromaDB để truy xuất Top-K biến thể phù hợp & còn hàng
  async retrieveRelevantLaptops(searchQuery, topK = 5) {
    try {
      const response = await fetch(`${PYTHON_RAG_URL}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          top_k: topK,
          only_in_stock: true, // Chỉ lấy biến thể có so_luong > 0
        }),
      });

      if (!response.ok) {
        throw new Error(`Python RAG trả về lỗi HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("Lỗi kết nối Python RAG Service:", error.message);
      throw new Error("RAG_SERVICE_UNAVAILABLE");
    }
  }

  // 3. Lọc danh sách metadata chỉ giữ lại những biến thể thực sự được AI nhắc đến trong câu trả lời
  filterMentionedSources(botReply, retrievedItems) {
    if (!retrievedItems || retrievedItems.length === 0) return [];

    // Bắt các tag dạng [ID: SP05 | BT: BT05] hoặc [ID: SP05]
    const tagRegex =
      /\[ID:\s*([A-Za-z0-9_-]+)(?:\s*\|\s*BT:\s*([A-Za-z0-9_-]+))?\]/gi;
    const mentionedPairs = [];
    let match;

    while ((match = tagRegex.exec(botReply)) !== null) {
      mentionedPairs.push({
        id_san_pham: match[1]?.toUpperCase(),
        id_bien_the: match[2]?.toUpperCase() || null,
      });
    }

    // Nếu AI không gắn tag nào (VD: báo hết hàng / không có máy phù hợp), không hiện thẻ rác
    if (mentionedPairs.length === 0) {
      return [];
    }

    const allMetadata = retrievedItems.map((item) => item.metadata);

    // Lọc khớp chính xác theo id_bien_the (nếu có) hoặc id_san_pham
    const filtered = allMetadata.filter((meta) => {
      const metaSp = String(meta.id_san_pham || "").toUpperCase();
      const metaBt = String(meta.id_bien_the || "").toUpperCase();

      return mentionedPairs.some((pair) => {
        if (pair.id_bien_the) {
          return pair.id_san_pham === metaSp && pair.id_bien_the === metaBt;
        }
        return pair.id_san_pham === metaSp;
      });
    });

    // Loại bỏ trùng lặp theo id_bien_the (phòng trường hợp AI nhắc lại 1 máy 2 lần trong câu trả lời)
    const uniqueMap = new Map();
    filtered.forEach((item) => {
      const key = item.id_bien_the || item.id_san_pham;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    });

    return Array.from(uniqueMap.values());
  }

  // 4. Luồng chính: Quản lý Phiên DB -> Intent & Rewrite -> Retrieval (nếu cần) -> Generation -> Lọc Sources -> Lưu DB
  async askAdvisor({
    userMessage,
    id_phien_chat_ai = null,
    id_khach_hang = null,
  }) {
    let currentSessionId = id_phien_chat_ai;
    let recentHistory = [];

    // Bước A: Kiểm tra hoặc tự động tạo phiên chat mới trong PostgreSQL
    if (!currentSessionId) {
      const autoTitle =
        userMessage.length > 45
          ? `${userMessage.substring(0, 45)}...`
          : userMessage;

      const newSession = await this.phienChatAIService.create({
        id_khach_hang: id_khach_hang || null,
        tieu_de: autoTitle,
      });
      currentSessionId = newSession.id;
    } else {
      recentHistory = await this.phienChatAIService.getRecentMessages(
        currentSessionId,
        6,
      );
    }

    // Bước B: Phân loại ý định & Viết lại câu hỏi theo ngữ cảnh
    const { isProductQuery, rewrittenQuery } =
      await this.analyzeIntentAndRewrite(userMessage, recentHistory);

    let retrievedItems = [];
    let systemPrompt = "";

    if (!isProductQuery) {
      // TRƯỜNG HỢP 1: Khách chào hỏi / cảm ơn / xã giao -> Không cần tìm ChromaDB
      systemPrompt = `
Bạn là chuyên viên tư vấn bán laptop thân thiện, lịch sự của cửa hàng công nghệ.
Khách hàng vừa gửi một câu chào hỏi, cảm ơn hoặc xác nhận xã giao.
Hãy phản hồi ngắn gọn, ấm áp, tự nhiên bằng tiếng Việt và sẵn sàng hỗ trợ nếu khách cần tư vấn thêm. KHÔNG tự ý liệt kê danh sách sản phẩm nếu khách không hỏi.
      `.trim();
    } else {
      // TRƯỜNG HỢP 2: Khách hỏi về sản phẩm -> Truy xuất ChromaDB và ép tag [ID: ... | BT: ...]
      retrievedItems = await this.retrieveRelevantLaptops(rewrittenQuery, 5);

      const contextText =
        retrievedItems.length > 0
          ? retrievedItems
              .map((item, index) => `[Kết quả ${index + 1}]: ${item.document}`)
              .join("\n\n")
          : "Hiện không tìm thấy mẫu laptop nào còn hàng khớp với mô tả trong kho.";

      systemPrompt = `
Bạn là chuyên viên tư vấn bán laptop chuyên nghiệp của cửa hàng công nghệ.
Dưới đây là thông tin các mẫu laptop phù hợp nhất (đang còn hàng) được truy xuất từ hệ thống kho của cửa hàng:

${contextText}

QUY TẮC TƯ VẤN BẮT BUỘC:
1. Chỉ được tư vấn dựa trên danh sách các mẫu laptop được cung cấp ở trên. Tuyệt đối KHÔNG tự bịa ra sản phẩm, cấu hình hay giá bán khác.
2. Nếu khách chỉ hỏi sâu về 1 mẫu/biến thể cụ thể (ví dụ hỏi chi tiết giá, màu sắc, cấu hình của 1 máy đang bàn tới), CHỈ trả lời tập trung vào đúng biến thể đó, KHÔNG liệt kê lan man các máy khác trong danh sách.
3. Nếu danh sách trên chưa có máy phù hợp với tầm giá hoặc nhu cầu của khách, hãy thẳng thắn báo cửa hàng hiện tạm hết mẫu đó và gợi ý mẫu gần nhất có trong danh sách.
4. Khi đề xuất một biến thể máy cụ thể, hãy trình bày rõ: Tên sản phẩm, cấu hình (CPU, GPU, RAM, SSD, màu sắc), giá bán sau khuyến mãi (kèm giá gốc nếu đang giảm) và lý do phù hợp.
5. QUAN TRỌNG: Mỗi khi nhắc tên một biến thể sản phẩm có trong danh sách, BẮT BUỘC gắn kèm cả mã sản phẩm và mã biến thể theo đúng cú pháp: [ID: mã_sp | BT: mã_bt] (Ví dụ: Laptop Acer Nitro V 15 [ID: SP05 | BT: BT05]). Tuyệt đối không bỏ sót mã biến thể BT.
6. Trả lời bằng tiếng Việt tự nhiên, thân thiện, trình bày bằng gạch đầu dòng ngắn gọn, dễ đọc.
      `.trim();
    }

    // Bước C: Gọi Groq LLM để sinh câu trả lời
    try {
      const completion = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: systemPrompt },
          ...recentHistory,
          { role: "user", content: userMessage },
        ],
        temperature: 0.4,
        max_tokens: 1024,
      });

      const rawBotReply =
        completion.choices[0]?.message?.content ||
        "Xin lỗi, hiện tại mình chưa thể phản hồi. Bạn thử lại sau nhé!";

      // Lọc ra đúng các thẻ biến thể được AI nhắc đến trong câu trả lời
      const filteredSources = isProductQuery
        ? this.filterMentionedSources(rawBotReply, retrievedItems)
        : [];

      // (Tùy chọn làm đẹp giao diện) Ẩn phần "| BT: BT05" trong văn bản hiển thị cho khách gọn mắt, chỉ giữ lại [ID: SP05]
      const cleanBotReply = rawBotReply.replace(
        /\[ID:\s*([A-Za-z0-9_-]+)\s*\|\s*BT:\s*[A-Za-z0-9_-]+\]/gi,
        "[ID: $1]",
      );

      // Bước D: Lưu tin nhắn hai chiều vào PostgreSQL
      await this.phienChatAIService.addMessage({
        id_phien_chat_ai: currentSessionId,
        vai_tro: "user",
        noi_dung: userMessage,
      });

      await this.phienChatAIService.addMessage({
        id_phien_chat_ai: currentSessionId,
        vai_tro: "assistant",
        noi_dung: cleanBotReply,
        san_pham_goi_y: filteredSources,
      });

      return {
        id_phien_chat_ai: currentSessionId,
        rewritten_query: rewrittenQuery,
        reply: cleanBotReply,
        sources: filteredSources,
      };
    } catch (error) {
      if (error?.status === 429) {
        throw new Error("GROQ_RATE_LIMIT");
      }
      if (
        error.message === "PHIEN_CHAT_KHONG_TON_TAI" ||
        error.message === "KHACH_HANG_KHONG_TON_TAI"
      ) {
        throw error;
      }
      throw error;
    }
  }
}

module.exports = ChatbotService;
