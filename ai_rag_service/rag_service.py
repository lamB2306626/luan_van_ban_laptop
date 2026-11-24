import requests
import chromadb
from chromadb.utils import embedding_functions

# Đường dẫn API chuẩn hóa dữ liệu từ Backend Node.js của bạn
NODE_API_URL = "http://localhost:5000/api/san-pham/for-rag" 

# 1. Khởi tạo mô hình Embedding hỗ trợ tiếng Việt tốt (chạy offline trên máy)
vietnamese_ef = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="paraphrase-multilingual-MiniLM-L12-v2"
)

# 2. Khởi tạo ChromaDB lưu trữ cố định trên ổ cứng tại ./chroma_db
chroma_client = chromadb.PersistentClient(path="./chroma_db")

def sync_products_to_vector_db():
    print(f"⏳ Đang lấy dữ liệu sản phẩm đã làm phẳng từ {NODE_API_URL}...")
    try:
        response = requests.get(NODE_API_URL, timeout=15)
        response.raise_for_status()
        payload = response.json()
        items = payload.get("data", [])
        print(f"✅ Lấy thành công {len(items)} biến thể sản phẩm từ Node.js!")
    except Exception as e:
        print("❌ Lỗi khi gọi API Node.js:", e)
        return {"success": False, "message": f"Không thể kết nối Node.js: {str(e)}"}

    # Xóa collection cũ (nếu có) để nạp mới toàn bộ, tránh dữ liệu cũ bị trùng hoặc sai giá
    try:
        chroma_client.delete_collection(name="laptop_store")
    except Exception:
        pass

    # Tạo lại collection mới gắn kèm hàm Embedding tiếng Việt
    collection = chroma_client.create_collection(
        name="laptop_store",
        embedding_function=vietnamese_ef
    )

    if not items:
        return {"success": True, "count": 0, "message": "Không có sản phẩm nào để nạp."}

    # Tách dữ liệu thành 3 mảng theo đúng chuẩn đầu vào của ChromaDB
    ids = [item["vector_id"] for item in items]
    documents = [item["document"] for item in items]
    metadatas = [item["metadata"] for item in items]

    print(f"⏳ Đang tạo Vector Embedding và lưu {len(ids)} mục vào ChromaDB...")
    collection.add(
        ids=ids,
        documents=documents,
        metadatas=metadatas
    )

    total_saved = collection.count()
    print(f"🎉 Hoàn tất! Đã lưu {total_saved} biến thể laptop vào ./chroma_db")
    return {
        "success": True,
        "count": total_saved,
        "message": f"Đồng bộ thành công {total_saved} biến thể sản phẩm vào Vector DB."
    }

# Cho phép chạy trực tiếp file này bằng lệnh: python rag_service.py
if __name__ == "__main__":
    sync_products_to_vector_db()