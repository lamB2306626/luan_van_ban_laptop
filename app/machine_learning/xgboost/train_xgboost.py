import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

# ==========================================
# 1. ĐỌC VÀ TIỀN XỬ LÝ DỮ LIỆU
# ==========================================
print("📂 Đang tải tập dữ liệu...")
df = pd.read_csv("../dataset/laptop_recommendation_dataset.csv")

feature_cols = [
    "is_brand_match",
    "is_category_match",
    "color_match_score",
    "cpu_match_score",
    "gpu_match_score",
    "ram_match_score",
    "rom_match_score",
    "price_diff_ratio",
    "keyword_sim_score",
    "item_sales_log",
    "item_avg_rating",
]

X = df[feature_cols]
y = df["y_target"]

# ==========================================
# 2. CHIA TẬP DỮ LIỆU TRAIN / TEST (80% / 20%)
# ==========================================
# Cố định random_state=42 để đảm bảo tính công bằng khi so sánh với Logistic Regression & Random Forest
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(
    f"✅ Đã chia dữ liệu: {len(X_train)} dòng để Train, {len(X_test)} dòng để Test."
)

# ==========================================
# 3. HUẤN LUYỆN MÔ HÌNH XGBOOST
# ==========================================
print("\n⚡ Đang huấn luyện mô hình XGBoost Classifier...")
# n_estimators=100: Tạo 100 cây học sửa sai liên tiếp
# learning_rate=0.05: Tốc độ học vừa phải để tránh overfit
# max_depth=6: Độ sâu vừa đủ cho mô hình cây boosting
xgb_model = XGBClassifier(
    n_estimators=100,
    learning_rate=0.05,
    max_depth=6,
    random_state=42,
    eval_metric="logloss",
    n_jobs=-1,
)

xgb_model.fit(X_train, y_train)

# ==========================================
# 4. ĐÁNH GIÁ VÀ IN KẾT QUẢ RA TERMINAL
# ==========================================
y_pred = xgb_model.predict(X_test)
y_pred_proba = xgb_model.predict_proba(X_test)[:, 1]

acc = accuracy_score(y_test, y_pred)
auc = roc_auc_score(y_test, y_pred_proba)

# Lấy độ quan trọng thuộc tính (Feature Importance)
importances = xgb_model.feature_importances_
feature_importance_df = pd.DataFrame(
    {"Feature": feature_cols, "Importance": importances}
).sort_values(by="Importance", ascending=False)

print(
    "\n================ SẮC THÁI ĐÁNH GIÁ MÔ HÌNH (XGBOOST) ================"
)
print(f"🎯 Độ chính xác toàn cục (Accuracy): {acc * 100:.2f}%")
print(f"📈 Chỉ số AUC-ROC: {auc:.4f}")
print("\n--- Báo cáo chi tiết (Precision, Recall, F1-Score) ---")
print(classification_report(y_test, y_pred))

print("\n--- BẢNG ĐỘ QUAN TRỌNG THUỘC TÍNH (FEATURE IMPORTANCE) ---")
print(feature_importance_df.to_string(index=False))
print(
    "=======================================================================\n"
)

# ==========================================
# 5. TRỰC QUAN HÓA FEATURE IMPORTANCE (VẼ BIỂU ĐỒ .PNG)
# ==========================================
plt.figure(figsize=(10, 6))
plt.barh(
    feature_importance_df["Feature"],
    feature_importance_df["Importance"],
    color="orange",
)
plt.title("Mức độ quan trọng của các thuộc tính (XGBoost Feature Importance)")
plt.xlabel("Độ quan trọng (Importance Score)")
plt.gca().invert_yaxis()
plt.tight_layout()
plt.savefig("xgboost_feature_importance.png")
print(
    "📊 Đã lưu biểu đồ độ quan trọng thuộc tính vào file 'xgboost_feature_importance.png'"
)

# ==========================================
# 6. LƯU MÔ HÌNH THÀNH FILE .PKL
# ==========================================
model_filename = "xgboost_model.pkl"
joblib.dump(xgb_model, model_filename)
print(f"💾 Đã lưu file mô hình thành công: '{model_filename}'")