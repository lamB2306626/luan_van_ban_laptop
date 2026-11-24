from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import uvicorn

# Import hàm sync và cấu hình từ file rag_service.py bạn đã tạo ở Bước 2
from rag_service import chroma_client, vietnamese_ef, sync_products_to_vector_db

app = FastAPI(title="Laptop Store RAG Service")

# Định nghĩa cấu trúc dữ liệu nhận từ Node.js
class SearchRequest(BaseModel):
    query: str
    top_k: int = 5
    only_in_stock: bool = True # Mặc định chỉ tìm các biến thể còn hàng (so_luong > 0)

@app.post("/search")
def search_laptops(req: SearchRequest):
    try:
        collection = chroma_client.get_collection(
            name="laptop_store",
            embedding_function=vietnamese_ef
        )

        # Bộ lọc Metadata: Chỉ lấy những biến thể có so_luong > 0 nếu only_in_stock = True
        where_filter = {"so_luong": {"$gt": 0}} if req.only_in_stock else None

        results = collection.query(
            query_texts=[req.query],
            n_results=req.top_k,
            where=where_filter
        )

        # Đóng gói kết quả gọn gàng trả về cho Node.js
        matched_items = []
        if results and results.get("documents") and len(results["documents"][0]) > 0:
            docs = results["documents"][0]
            metas = results["metadatas"][0]
            distances = results["distances"][0]

            for i in range(len(docs)):
                matched_items.append({
                    "document": docs[i],
                    "metadata": metas[i],
                    "distance": distances[i] # Khoảng cách vector (càng nhỏ càng sát nghĩa)
                })

        return {
            "success": True,
            "total": len(matched_items),
            "results": matched_items
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi truy xuất ChromaDB: {str(e)}")

@app.post("/sync")
def trigger_sync():
    result = sync_products_to_vector_db()
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("message"))
    return result

if __name__ == "__main__":
    # Chạy Python AI Service ở cổng 8000 (tránh trùng cổng 5000 của Node.js)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)