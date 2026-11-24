// Địa chỉ Python FastAPI Service
const PYTHON_RAG_URL = process.env.PYTHON_RAG_URL || "http://localhost:8000";

let syncTimer = null;

/**
 * Kích hoạt đồng bộ dữ liệu sang Python ChromaDB (Chạy ngầm + Debounce 2 giây)
 * @param {string} reason - Lý do kích hoạt (để dễ theo dõi log trên terminal)
 */
function triggerRagSync(reason = "Dữ liệu sản phẩm thay đổi") {
  if (syncTimer) {
    clearTimeout(syncTimer);
  }

  syncTimer = setTimeout(async () => {
    try {
      console.log(
        `🔄 [RAG Sync] Bắt đầu đồng bộ ChromaDB (Lý do: ${reason})...`,
      );

      const response = await fetch(`${PYTHON_RAG_URL}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        console.warn(`⚠️ [RAG Sync] Python trả về lỗi HTTP ${response.status}`);
        return;
      }

      const data = await response.json();
      console.log(`✅ [RAG Sync] Đồng bộ thành công!`, data.message || "");
    } catch (error) {
      console.warn(
        `⚠️ [RAG Sync] Không thể kết nối Python RAG Service (${error.message}). Bỏ qua đồng bộ.`,
      );
    }
  }, 5000);
}

module.exports = {
  triggerRagSync,
};
