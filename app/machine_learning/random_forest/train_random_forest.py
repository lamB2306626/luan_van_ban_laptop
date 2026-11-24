import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split

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
# Giữ cố định random_state=42 để công bằng khi so sánh với Logistic Regression
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(
    f"✅ Đã chia dữ liệu: {len(X_train)} dòng để Train, {len(X_test)} dòng để Test."
)

# ==========================================
# 3. HUẤN LUYỆN MÔ HÌNH RANDOM FOREST
# ==========================================
print("\n🌲 Đang huấn luyện mô hình Random Forest Classifier...")
# n_estimators=100: Tạo rừng gồm 100 cây quyết định
# max_depth=6: Giới hạn độ sâu để tránh học vẹt (overfitting)
# rf_model = RandomForestClassifier(
#     n_estimators=100, max_depth=6, random_state=42, n_jobs=-1
# )

rf_model = RandomForestClassifier(
    n_estimators=100,
    max_depth=6,           # Không cho cây chia quá sâu vào nhiễu
    min_samples_leaf=5,   # Mỗi lá phải có ít nhất 15 mẫu mới được chốt điểm
    random_state=42
)
rf_model.fit(X_train, y_train)

# ==========================================
# 4. ĐÁNH GIÁ VÀ IN KẾT QUẢ RA TERMINAL
# ==========================================
y_pred = rf_model.predict(X_test)
y_pred_proba = rf_model.predict_proba(X_test)[:, 1]

acc = accuracy_score(y_test, y_pred)
auc = roc_auc_score(y_test, y_pred_proba)

# Lấy độ quan trọng của thuộc tính (Feature Importance)
importances = rf_model.feature_importances_
feature_importance_df = pd.DataFrame(
    {"Feature": feature_cols, "Importance": importances}
).sort_values(by="Importance", ascending=False)

print("\n================ SẮC THÁI ĐÁNH GIÁ MÔ HÌNH (RANDOM FOREST) ================")
print(f"🎯 Độ chính xác toàn cục (Accuracy): {acc * 100:.2f}%")
print(f"📈 Chỉ số AUC-ROC: {auc:.4f}")
print("\n--- Báo cáo chi tiết (Precision, Recall, F1-Score) ---")
print(classification_report(y_test, y_pred))

print("\n--- BẢNG ĐỘ QUAN TRỌNG THUỘC TÍNH (FEATURE IMPORTANCE) ---")
print(feature_importance_df.to_string(index=False))
print("===========================================================================\n")

# ==========================================
# 5. TRỰC QUAN HÓA FEATURE IMPORTANCE (VẼ BIỂU ĐỒ .PNG)
# ==========================================
plt.figure(figsize=(10, 6))
plt.barh(
    feature_importance_df["Feature"],
    feature_importance_df["Importance"],
    color="skyblue",
)
plt.title("Mức độ quan trọng của các thuộc tính (Random Forest Feature Importance)")
plt.xlabel("Độ quan trọng (Importance Score)")
plt.gca().invert_yaxis()
plt.tight_layout()
plt.savefig("random_forest_feature_importance.png")
print(
    "📊 Đã lưu biểu đồ độ quan trọng thuộc tính vào file 'random_forest_feature_importance.png'"
)

# ==========================================
# 6. LƯU MÔ HÌNH THÀNH FILE .PKL
# ==========================================
model_filename = "random_forest_model.pkl"
joblib.dump(rf_model, model_filename)
print(f"💾 Đã lưu file mô hình thành công: '{model_filename}'")