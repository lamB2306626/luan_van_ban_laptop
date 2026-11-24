import numpy as np
import pandas as pd

# 1. Cấu hình số lượng dòng dữ liệu
NUM_SAMPLES = 3000
np.random.seed(42)  # Cố định seed để tái lập kết quả


# 2. Hàm sinh điểm tương thích mềm (Normalized Score) phản ánh đúng Map [0.0 - 1.0]
def generate_soft_match_score(p_top1=0.25, p_sub_top=0.35):
    """Sinh điểm match liên tục từ [0.0 - 1.0]

    - p_top1: Tỷ lệ rơi vào Top 1 (Điểm = 1.0)
    - p_sub_top: Tỷ lệ rơi vào Top 2 - Top K (Điểm từ 0.2 đến 0.8)
    - Còn lại: Không thuộc Top (Điểm = 0.0)
    """
    rand_val = np.random.rand()
    if rand_val < p_top1:
        return 1.0  # Top 1 match tuyệt đối
    elif rand_val < (p_top1 + p_sub_top):
        # Trả về điểm tương thích mềm ngẫu nhiên cho các vị trí Top 2, Top 3
        return round(np.random.uniform(0.25, 0.85), 4)
    else:
        return 0.0  # Nằm ngoài Top K


# 3. Định nghĩa hàm tính điểm hấp dẫn (Attractiveness Score S)
def calculate_laptop_attractiveness(row, persona):
    """Tính điểm hấp dẫn S (0.0 đến 1.0) dựa trên trọng số Persona."""
    # Trọng số mặc định cho người dùng Phổ thông (Normal)
    w_brand = 0.14  # Thương hiệu
    w_cat = 0.14  # Nhu cầu / Danh mục
    w_cpu = 0.14  # Vi xử lý
    w_gpu = 0.10  # Card đồ họa
    w_ram = 0.08  # Dung lượng RAM
    w_rom = 0.05  # Dung lượng SSD
    w_color = 0.02  # Màu sắc hợp gu
    w_price = 0.15  # Vừa túi tiền (1 - price_diff_ratio)
    w_keyword = 0.06  # Từ khóa tương đồng
    w_sales = 0.06  # Lượt bán
    w_rating = 0.06  # Đánh giá sao

    # Tùy chỉnh trọng số theo từng nhóm Persona
    if persona == "Gamer":
        w_gpu, w_cpu, w_ram = 0.25, 0.20, 0.12
        w_brand, w_color = 0.05, 0.01
    elif persona == "BrandFan":
        w_brand = 0.35
        w_gpu, w_cpu = 0.08, 0.10
    elif persona == "BudgetSaver":
        w_price = 0.35
        w_brand, w_cpu, w_gpu = 0.05, 0.08, 0.08

    # Chuẩn hóa item_avg_rating (3.5 - 5.0) về thang điểm [0.0, 1.0]
    rating_score = (row["item_avg_rating"] - 3.5) / (5.0 - 3.5)

    # Công thức tính điểm hấp dẫn tổng hợp S
    score = (
        w_brand * row["is_brand_match"]
        + w_cat * row["is_category_match"]
        + w_color * row["color_match_score"]
        + w_cpu * row["cpu_match_score"]
        + w_gpu * row["gpu_match_score"]
        + w_ram * row["ram_match_score"]
        + w_rom * row["rom_match_score"]
        + w_price * (1.0 - row["price_diff_ratio"])
        + w_keyword * row["keyword_sim_score"]
        + w_sales * (row["item_sales_log"] / 5.0)
        + w_rating * rating_score
    )

    return np.clip(score, 0.0, 1.0)


# 4. Tiến hành sinh dữ liệu giả lập
data = []
personas = ["Gamer", "BrandFan", "BudgetSaver", "Normal"]
persona_probs = [0.25, 0.25, 0.30, 0.20]

for i in range(1, NUM_SAMPLES + 1):
    user_id = f"USER_{np.random.randint(1, 151):03d}"
    product_id = f"SP{np.random.randint(1, 101):04d}"

    persona = np.random.choice(personas, p=persona_probs)

    # Sinh các đặc trưng Match liên tục [0.0 - 1.0] phù hợp với Normalized Map
    is_brand_match = generate_soft_match_score(p_top1=0.25, p_sub_top=0.35)
    is_category_match = generate_soft_match_score(
        p_top1=0.30, p_sub_top=0.40
    )

    color_match_score = generate_soft_match_score(p_top1=0.20, p_sub_top=0.20)
    cpu_match_score = generate_soft_match_score(p_top1=0.30, p_sub_top=0.40)
    gpu_match_score = generate_soft_match_score(p_top1=0.25, p_sub_top=0.35)
    ram_match_score = generate_soft_match_score(p_top1=0.35, p_sub_top=0.35)
    rom_match_score = generate_soft_match_score(p_top1=0.35, p_sub_top=0.35)

    price_diff_ratio = round(np.random.uniform(0.0, 0.6), 4)
    keyword_sim_score = np.random.choice([0.0, 0.5, 1.0], p=[0.7, 0.2, 0.1])

    # Thuộc tính lượt bán & rating
    item_sales_count = np.random.randint(1, 150)
    item_sales_log = round(float(np.log1p(item_sales_count)), 4)
    item_avg_rating = round(np.random.uniform(3.5, 5.0), 1)

    row = {
        "user_id": user_id,
        "product_id": product_id,
        "is_brand_match": is_brand_match,
        "is_category_match": is_category_match,
        "color_match_score": color_match_score,
        "cpu_match_score": cpu_match_score,
        "gpu_match_score": gpu_match_score,
        "ram_match_score": ram_match_score,
        "rom_match_score": rom_match_score,
        "price_diff_ratio": price_diff_ratio,
        "keyword_sim_score": keyword_sim_score,
        "item_sales_count": item_sales_count,
        "item_sales_log": item_sales_log,
        "item_avg_rating": item_avg_rating,
    }

    # Tính điểm hấp dẫn S và gán nhãn y_target
    score_S = calculate_laptop_attractiveness(row, persona)

    BASE_CUTOFF = 0.45
    if score_S >= BASE_CUTOFF:
        y_target = np.random.choice([1, 0], p=[0.8, 0.2])
    else:
        y_target = np.random.choice([0, 1], p=[0.8, 0.2])

    row["y_target"] = y_target
    data.append(row)

# 5. Xuất file CSV
df = pd.DataFrame(data)
csv_file_name = "laptop_recommendation_dataset.csv"
df.to_csv(csv_file_name, index=False)

print(
    f"✅ Đã tạo thành công dữ liệu laptop {NUM_SAMPLES} dòng vào file '{csv_file_name}'!"
)
print("\n--- Mẫu 5 dòng dữ liệu đầu tiên: ---")
print(df.head())

print("\n--- Thống kê tỷ lệ Nhãn Target (0 và 1) ---")
print(df["y_target"].value_counts(normalize=True))