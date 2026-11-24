import os
from contextlib import asynccontextmanager
from typing import List, Optional
import joblib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# ==========================================
# 1. ĐỊNH NGHĨA CẤU TRÚC DỮ LIỆU ĐẦU VÀO
# ==========================================

class ProductFeatureItem(BaseModel):
    product_id: str
    is_brand_match: float
    is_category_match: float
    color_match_score: float
    cpu_match_score: float
    gpu_match_score: float
    ram_match_score: float
    rom_match_score: float
    price_diff_ratio: float
    keyword_sim_score: float
    item_sales_log: float
    item_avg_rating: float


class PredictRequest(BaseModel):
    model_name: Optional[str] = "random_forest"
    products: List[ProductFeatureItem]


# ==========================================
# 2. QUẢN LÝ TẢI MÔ HÌNH VÀO BỘ NHỚ RAM
# ==========================================
models = {}
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

@asynccontextmanager
async def lifespan(app: FastAPI):
    rf_path = os.path.join(BASE_DIR, "random_forest", "random_forest_model.pkl")
    xgb_path = os.path.join(BASE_DIR, "xgboost", "xgboost_model.pkl")

    # Load Random Forest
    if os.path.exists(rf_path):
        models["random_forest"] = joblib.load(rf_path)
        print(f"✅ Đã load thành công mô hình Random Forest từ '{rf_path}'")
    else:
        rf_alt = os.path.join(BASE_DIR, "random_forest_model.pkl")
        if os.path.exists(rf_alt):
            models["random_forest"] = joblib.load(rf_alt)
            print(f"✅ Đã load thành công mô hình Random Forest từ '{rf_alt}'")

    # Load XGBoost
    if os.path.exists(xgb_path):
        models["xgboost"] = joblib.load(xgb_path)
        print(f"✅ Đã load thành công mô hình XGBoost từ '{xgb_path}'")
    else:
        xgb_alt = os.path.join(BASE_DIR, "xgboost_model.pkl")
        if os.path.exists(xgb_alt):
            models["xgboost"] = joblib.load(xgb_alt)
            print(f"✅ Đã load thành công mô hình XGBoost từ '{xgb_alt}'")

    yield
    models.clear()
    print("🧹 Đã giải phóng bộ nhớ RAM.")


app = FastAPI(
    title="Laptop Recommendation ML Service",
    version="1.0.0",
    lifespan=lifespan,
)

# ==========================================
# 3. ENDPOINT DỰ ĐOÁN (KHÔNG DÙNG PANDAS)
# ==========================================

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Laptop Recommendation Microservice đang hoạt động!",
        "loaded_models": list(models.keys()),
    }


@app.post("/predict")
def predict_recommendations(payload: PredictRequest):
    model_name = payload.model_name.lower()

    if model_name not in models:
        raise HTTPException(
            status_code=400,
            detail=f"Mô hình '{model_name}' chưa được nạp. Các mô hình khả dụng: {list(models.keys())}",
        )

    model = models[model_name]

    if not payload.products:
        return {"scores": []}

    # 1. Chuyển đổi dữ liệu JSON thành Ma trận mảng 2D thô (List of Lists)
    product_ids = []
    X = []
    
    for item in payload.products:
        product_ids.append(item.product_id)
        # Đúng 11 đặc trưng theo đúng thứ tự huấn luyện
        X.append([
            item.is_brand_match,
            item.is_category_match,
            item.color_match_score,
            item.cpu_match_score,
            item.gpu_match_score,
            item.ram_match_score,
            item.rom_match_score,
            item.price_diff_ratio,
            item.keyword_sim_score,
            item.item_sales_log,
            item.item_avg_rating,
        ])

    # 2. Thực hiện Predict xác suất nhãn 1 (Dùng Ma trận thô X)
    try:
        probabilities = model.predict_proba(X)[:, 1]
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Lỗi khi tính toán điểm xác suất: {str(e)}"
        )

    # 3. GHÉP PRODUCT_ID VÀ SẮP XẾP ĐIỂM DỰ ĐOÁN
    results = []
    for product_id, score in zip(product_ids, probabilities):
        results.append({"product_id": product_id, "score": round(float(score), 4)})

    results.sort(key=lambda x: x["score"], reverse=True)

    return {
        "model_used": model_name,
        "total_products": len(results),
        "scores": results,
    }