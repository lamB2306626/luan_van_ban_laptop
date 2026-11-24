import json
import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
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
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ==========================================
# 3. HUẤN LUYỆN MÔ HÌNH LOGISTIC REGRESSION
# ==========================================
print("\n🤖 Đang huấn luyện mô hình Logistic Regression...")
model = LogisticRegression(random_state=42, max_iter=1000)
model.fit(X_train, y_train)

# ==========================================
# 4. ĐÁNH GIÁ VÀ IN KẾT QUẢ RA TERMINAL
# ==========================================
y_pred = model.predict(X_test)
y_pred_proba = model.predict_proba(X_test)[:, 1]

acc = accuracy_score(y_test, y_pred)
auc = roc_auc_score(y_test, y_pred_proba)

# Lấy trọng số các thuộc tính
coefficients = model.coef_[0]
intercept = model.intercept_[0]
feature_importance = pd.DataFrame(
    {"Feature": feature_cols, "Coefficient": coefficients}
).sort_values(by="Coefficient", ascending=False)

print("\n================ SẮC THÁI ĐÁNH GIÁ MÔ HÌNH ================")
print(f"🎯 Độ chính xác toàn cục (Accuracy): {acc * 100:.2f}%")
print(f"📈 Chỉ số AUC-ROC: {auc:.4f}")
print("\n--- Báo cáo chi tiết (Precision, Recall, F1-Score) ---")
print(classification_report(y_test, y_pred))

print("\n--- BẢNG TRỌNG SỐ THUỘC TÍNH (COEFFICIENTS) ---")
print(f"- Intercept (Hệ số tự do): {intercept:.4f}")
print(feature_importance.to_string(index=False))
print("===========================================================\n")

# ==========================================
# 5. TRỰC QUAN HÓA TRỌNG SỐ (VẼ BIỂU ĐỒ .PNG)
# ==========================================
plt.figure(figsize=(10, 6))
colors = [
    "green" if c > 0 else "red" for c in feature_importance["Coefficient"]
]
plt.barh(
    feature_importance["Feature"],
    feature_importance["Coefficient"],
    color=colors,
)
plt.axvline(x=0, color="black", linestyle="--", linewidth=0.8)
plt.title("Trọng số ảnh hưởng của các thuộc tính (Logistic Regression)")
plt.xlabel("Hệ số (Coefficient)")
plt.gca().invert_yaxis()
plt.tight_layout()
plt.savefig("logistic_regression_coefficients.png")
print(
    "📊 Đã lưu biểu đồ trọng số vào file 'logistic_regression_coefficients.png'"
)

# ==========================================
# 6. LƯU MÔ HÌNH THÀNH FILE .PKL
# ==========================================
# model_filename = "logistic_model.pkl"
# joblib.dump(model, model_filename)
# print(f"💾 Đã lưu file mô hình thành công: '{model_filename}'")

# ==========================================
# 7. XUẤT FILE JSON CHỨA TRỌNG SỐ CHO BACKEND (NODE.JS)
# ==========================================
coef_dict = dict(zip(feature_cols, coefficients))

weights_data = {
    "intercept": round(float(intercept), 6),
    "coefficients": {k: round(float(v), 6) for k, v in coef_dict.items()},
}

json_filename = "logistic_weights.json"
with open(json_filename, "w", encoding="utf-8") as f:
    json.dump(weights_data, f, indent=4, ensure_ascii=False)

print(
    f"🔗 Đã xuất thành công file trọng số cho Backend Node.js: '{json_filename}'!"
)