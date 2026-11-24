const prisma = require("../utils/prisma");
const SanPhamService = require("./san-pham.service");
const logisticWeights = require("../machine_learning/logistic_regression/logistic_weights.json");
const axios = require("axios");

class GoiYSanPhamService {
  /**
   * API chính: Lấy danh sách sản phẩm gợi ý cá nhân hóa cho Khách hàng (dùng ở Trang chủ)
   * @param {string} id_khach_hang
   * @param {number} limit
   */

  constructor() {
    this.sanPhamService = new SanPhamService();
  }

  // ========================================= GƠI Ý SẢN PHẨM CHO KHÁCH HÀNG ======================================================//
  async getPersonalizedRecommendations(id_khach_hang, limit = 10) {
    // 1. Trích xuất hồ sơ sở thích
    const userProfile = await this.buildUserProfile(id_khach_hang);

    // TRƯỜNG HỢP 1: Khách hàng mới, lấy Fallback danh sách sản phẩm phổ biến
    if (!userProfile.hasHistory) {
      const fallback = await this.getPopularFallbackProducts(limit);
      const formattedFallback = fallback.map((sp) => {
        const bestVariant = sp.bien_the_dai_dien;
        const { bien_the, ...sanPhamClean } = sp;
        return {
          ...sanPhamClean,
          score: 0,
          bien_the_dai_dien: bestVariant,
        };
      });

      return {
        userProfile,
        products: formattedFallback,
      };
    }

    // 2. Lấy tất cả sản phẩm đang kinh doanh
    const allProducts =
      await this.sanPhamService.getAllProductsForRecommendation();

    // 3. Bóc tách 11 đặc trưng cho từng sản phẩm (Đã chọn sẵn bestVariant trong này)
    const variantMap = new Map();
    const extractedFeaturesList = allProducts.map((sp) => {
      // tìm bestVariant và lưu lại trong variantMap
      const bestVariant = this.selectBestVariant(sp.bien_the, userProfile);
      variantMap.set(sp.id, bestVariant);

      // Truyền thẳng bestVariant đã chọn vào hàm trích xuất đặc trưng
      return this.extractProductFeatures(sp, userProfile, bestVariant);
    });

    // 4. CHỌN MÔ HÌNH CHẤM ĐIỂM
    // Option A: Dùng Logistic Regression
    // const scoreMap = this.calculateLogisticScores(extractedFeaturesList);

    // Option B: Dùng Random Forest/Xgboost
    const scoreMap = await this.getMLProductScores(
      extractedFeaturesList,
      "random_forest", // "xgboost"
    );

    // 5. Gán score cho từng sản phẩm (Đồng thời ở đây xác định luôn biến thể đại diện
    // cho từng sản phẩm chung trong vòng lặp này luôn cho gọn)
    const scoredProducts = allProducts.map((sanPham) => {
      return {
        ...sanPham,
        score: scoreMap.get(sanPham.id) || 0,
        bien_the_dai_dien: variantMap.get(sanPham.id) || null,
      };
    });

    // 6. Lọc điểm > 0 và sắp xếp giảm dần
    const recommended = scoredProducts
      .filter((sp) => sp.score > 0)
      .sort((a, b) => b.score - a.score);

    // Helper function: Tách mảng bien_the thô ra khỏi sản phẩm trả về
    const formatProductOutput = (sp) => {
      const { bien_the, ...sanPhamClean } = sp;
      return sanPhamClean;
    };

    // TRƯỜNG HỢP 2: Đủ số lượng gợi ý cá nhân hóa
    if (recommended.length >= limit) {
      const formattedRecommended = recommended
        .slice(0, limit)
        .map(formatProductOutput);

      return {
        userProfile, // In ra hồ sơ sở thích
        products: formattedRecommended,
      };
    }

    // TRƯỜNG HỢP 3: Không đủ -> Bù thêm bằng Fallback danh sách sản phẩm phổ biến
    const existingIds = recommended.map((p) => p.id);
    const needMore = limit - recommended.length;
    const fallbackProducts = await this.getPopularFallbackProducts(
      needMore,
      existingIds,
    );

    const formattedRecommended = recommended.map(formatProductOutput);

    const formattedFallback = fallbackProducts.map((sp) => {
      const bestVariant = sp.bien_the_dai_dien;
      return {
        ...sp,
        score: 0,
        bien_the_dai_dien: bestVariant,
      };
    });

    return {
      userProfile, // In ra hồ sơ sở thích đầy đủ các điểm trọng số
      products: [...formattedRecommended, ...formattedFallback],
    };
  }

  /**
   * BƯỚC 1: Trích xuất Hồ sơ Sở thích (User Profile) bằng Sliding Window 30 ngày
   */
  async buildUserProfile(id_khach_hang) {
    if (!id_khach_hang) return { hasHistory: false };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Lấy Lịch sử Yêu thích (Toàn bộ)
    const dsYeuThich = await prisma.yeu_thich.findMany({
      where: {
        id_khach_hang,
        san_pham: {
          trang_thai: "DANG_KINH_DOANH",
          is_delete: false,
        },
      },
      include: {
        san_pham: {
          include: {
            bien_the: {
              where: {
                trang_thai: true,
                is_delete: false,
              },
            },
          },
        },
      },
    });

    // 2. Lấy Lịch sử Xem trong 30 ngày (Đã orderBy desc: index 0 là mới nhất)
    const dsLichSuXem = await prisma.lich_su_xem.findMany({
      where: {
        id_khach_hang,
        thoi_gian_xem: { gte: thirtyDaysAgo },
        san_pham: {
          trang_thai: "DANG_KINH_DOANH",
          is_delete: false,
        },
      },
      include: {
        san_pham: {
          include: {
            bien_the: {
              where: {
                trang_thai: true,
                is_delete: false,
              },
            },
          },
        },
      },
      orderBy: { thoi_gian_xem: "desc" },
      take: 30,
    });

    // 3. Lấy Lịch sử Tìm kiếm trong 30 ngày (orderBy desc: index 0 là mới nhất)
    const dsLichSuTimKiem = await prisma.lich_su_tim_kiem.findMany({
      where: {
        id_khach_hang,
        thoi_gian_tim: { gte: thirtyDaysAgo },
      },
      orderBy: { thoi_gian_tim: "desc" },
      take: 20,
    });

    // Nếu không có bất kỳ tương tác nào -> Trả về Cold Start
    if (
      dsYeuThich.length === 0 &&
      dsLichSuXem.length === 0 &&
      dsLichSuTimKiem.length === 0
    ) {
      return { hasHistory: false };
    }

    // Khởi tạo bộ lưu điểm
    const scores = {
      thuongHieu: {},
      danhMuc: {},
      cpu: {},
      gpu: {},
      ram: {},
      rom: {},
      mauSac: {},
      keywords: [],
      pricePoints: [],
    };

    // A. Xử lý Lịch sử Yêu thích (Base Score = 5.0)
    dsYeuThich.forEach((yt) => {
      const sp = yt.san_pham;
      if (!sp) return;
      this.accumulateProductAttributes(
        sp,
        5.0,
        {
          kBrand: 1.0,
          kCat: 0.8,
          kCpu: 0.4,
          kGpu: 0.3,
          kRam: 0.3,
          kRom: 0.3,
          kColor: 0.2,
        },
        scores,
      );
    });

    // B. Xử lý Lịch sử Xem (Áp dụng Time-Decay & Recency Boost)
    dsLichSuXem.forEach((xem, index) => {
      const sp = xem.san_pham;
      if (!sp) return;

      const baseScore = 2.0;

      // Time-decay: index 0 = 1.0; index 1 = 0.85; index 2 = 0.72... tối thiểu 0.2
      const recencyFactor = Math.max(0.2, Math.pow(0.85, index));

      // Thưởng thêm nếu là 3 tương tác xem MỚI NHẤT (index 0, 1, 2)
      const recencyBoost = index < 3 ? 1.4 : 1.0;

      const finalWeight = baseScore * recencyFactor * recencyBoost;

      this.accumulateProductAttributes(
        sp,
        finalWeight,
        {
          kBrand: 1.0,
          kCat: 0.8,
          kCpu: 0.3,
          kGpu: 0.2,
          kRam: 0.2,
          kRom: 0.2,
          kColor: 0.1,
        },
        scores,
      );
    });

    // C. Xử lý Lịch sử Tìm kiếm (Áp dụng Time-Decay cho lượt tìm kiếm mới)
    dsLichSuTimKiem.forEach((tk, index) => {
      const BASE_SEARCH = 3.0;
      const recencyFactor = Math.max(0.3, Math.pow(0.8, index));
      const recencyBoost = index < 2 ? 1.3 : 1.0;
      const searchWeight = BASE_SEARCH * recencyFactor * recencyBoost;

      this.accumulateSearchAttribute(tk, searchWeight, scores);
    });

    // Tính toán Biên độ Giá trung bình kỳ vọng
    const priceRange = this.calculateTargetPriceRange(scores.pricePoints);

    // D. CHUẨN HÓA VÀ TRẢ VỀ MAP ĐIỂM CHUẨN THEO ĐÚNG TOP ĐÃ CHỌN
    return {
      hasHistory: true,
      thuongHieuMap: this.getTopNormalizedMap(scores.thuongHieu, 3), // Top 3 Thương hiệu
      danhMucMap: this.getTopNormalizedMap(scores.danhMuc, 3), // Top 3 Danh mục
      cpuMap: this.getTopNormalizedMap(scores.cpu, 3), // Top 3 CPU
      gpuMap: this.getTopNormalizedMap(scores.gpu, 3), // Top 3 GPU
      ramMap: this.getTopNormalizedMap(scores.ram, 3), // Top 3 RAM
      romMap: this.getTopNormalizedMap(scores.rom, 3), // Top 3 ROM
      mauSacMap: this.getTopNormalizedMap(scores.mauSac, 2), // Top 2 Màu sắc
      keywords: scores.keywords,
      priceRange,
    };
  }

  /**
   * BƯỚC 2A: Chấm điểm Sản phẩm dựa trên Mô hình Logistic Regression (Sigmoid Probability)
   */
  calculateLogisticScores(extractedFeaturesList) {
    const { intercept, coefficients } = logisticWeights;
    const scoreMap = new Map();

    extractedFeaturesList.forEach((f) => {
      const z =
        intercept +
        coefficients.is_brand_match * f.is_brand_match +
        coefficients.is_category_match * f.is_category_match +
        coefficients.color_match_score * f.color_match_score +
        coefficients.cpu_match_score * f.cpu_match_score +
        coefficients.gpu_match_score * f.gpu_match_score +
        coefficients.ram_match_score * f.ram_match_score +
        coefficients.rom_match_score * f.rom_match_score +
        coefficients.price_diff_ratio * f.price_diff_ratio +
        coefficients.keyword_sim_score * f.keyword_sim_score +
        coefficients.item_sales_log * f.item_sales_log +
        coefficients.item_avg_rating * f.item_avg_rating;

      const probability = 1.0 / (1.0 + Math.exp(-z));
      scoreMap.set(f.product_id, probability);
    });

    return scoreMap;
  }

  /**
   * BƯỚC 2B: Chấm điểm bằng FastAPI (Random Forest / XGBoost)
   */
  async getMLProductScores(extractedFeaturesList, modelName = "random_forest") {
    if (!extractedFeaturesList || extractedFeaturesList.length === 0)
      return new Map();

    try {
      const response = await axios.post("http://127.0.0.1:8001/predict", {
        model_name: modelName,
        products: extractedFeaturesList, // Gửi trực tiếp mảng features đã bóc tách
      });

      const scoreMap = new Map();
      if (response.data && response.data.scores) {
        response.data.scores.forEach((item) => {
          scoreMap.set(item.product_id, item.score);
        });
      }
      return scoreMap;
    } catch (error) {
      console.error("❌ Lỗi khi kết nối FastAPI Microservice:", error.message);
      return new Map();
    }
  }

  // Lấy danh sách sản phẩm Phổ biến (Nổi bật / Xem nhiều)
  async getPopularFallbackProducts(limit = 10, excludeIds = []) {
    // 1. Lấy tất cả sản phẩm đang kinh doanh kèm biến thể và khuyến mãi
    const allProducts = await this.sanPhamService.find({
      trang_thai: "DANG_KINH_DOANH",
      da_xoa: false,
      trang_thai_bien_the: true,
      da_xoa_bien_the: false,
    });

    // Lọc bỏ các sản phẩm đã có trong danh sách cá nhân hóa
    const candidates = allProducts.filter((sp) => !excludeIds.includes(sp.id));

    if (candidates.length === 0) return [];

    // 2. Định nghĩa các trọng số tính điểm độ HOT (Trọng số điều chỉnh tùy nhu cầu kinh doanh)
    const W_LIKE = 2.0; // Mỗi lượt thích được +2 điểm
    const W_BUY = 3.0; // Mỗi lượt mua (hoặc số lượng bán) được +3 điểm
    const W_RATING = 5.0; // Điểm sao trung bình (1-5 sao) x 5.0
    const W_REVIEW_COUNT = 1.0; // Mỗi lượt đánh giá được +1 điểm
    // const W_VIEW = 0.5;    // (Dành sẵn chỗ cho lượt xem sau này)

    // 3. Tính điểm Phổ biến (Popularity Score) cho từng sản phẩm
    const scoredCandidates = candidates.map((sp) => {
      const luotThich = sp.tong_luot_yeu_thich || 0;
      const luotBan = sp.thong_ke_luot_mua?.tong_so_luong_ban || 0;
      const trungBinhSao = sp.thong_ke_danh_gia?.trung_binh_sao || 0;
      const tongSoDanhGia = sp.thong_ke_danh_gia?.tong_so_danh_gia || 0;
      // const luotXem = sp.so_luot_xem || 0; // Sẽ mở lại khi bạn làm hàm tính lượt xem

      // Công thức tính điểm tổng hợp
      const popularityScore =
        luotThich * W_LIKE +
        luotBan * W_BUY +
        trungBinhSao * W_RATING +
        tongSoDanhGia * W_REVIEW_COUNT;
      // + luotXem * W_VIEW;

      return {
        ...sp,
        popularityScore,
      };
    });

    // 4. Sắp xếp giảm dần theo điểm độ HOT
    scoredCandidates.sort((a, b) => b.popularityScore - a.popularityScore);

    // 5. Lấy ra số lượng sản phẩm yêu cầu
    return scoredCandidates.slice(0, limit);
  }

  // Bóc tách và chuẩn hóa 11 đặc trưng của sản phẩm về thang [0.0 - 1.0]
  extractProductFeatures(sanPham, userProfile, bestVariant) {
    // 1. Thương hiệu & Danh mục: Lấy trực tiếp điểm tương quan từ Map (mặc định 0.0 nếu ngoài Top K)
    const is_brand_match =
      userProfile.thuongHieuMap?.[sanPham.id_thuong_hieu] || 0.0;
    const is_category_match =
      userProfile.danhMucMap?.[sanPham.id_danh_muc] || 0.0;

    // 2. Trích xuất điểm tương quan cấu hình & màu sắc TỪ BIẾN THỂ ĐẠI DIỆN ĐÃ TRUYỀN VÀO
    let cpu_match_score = 0.0;
    let gpu_match_score = 0.0;
    let ram_match_score = 0.0;
    let rom_match_score = 0.0;
    let color_match_score = 0.0;
    let price_diff_ratio = 1.0; // Mặc định chênh lệch tối đa nếu không có biến thể/giá

    if (bestVariant) {
      if (bestVariant.id_cpu && userProfile.cpuMap) {
        cpu_match_score = userProfile.cpuMap[bestVariant.id_cpu] || 0.0;
      }
      if (bestVariant.id_gpu && userProfile.gpuMap) {
        gpu_match_score = userProfile.gpuMap[bestVariant.id_gpu] || 0.0;
      }
      if (bestVariant.id_ram && userProfile.ramMap) {
        ram_match_score = userProfile.ramMap[bestVariant.id_ram] || 0.0;
      }
      if (bestVariant.id_rom && userProfile.romMap) {
        rom_match_score = userProfile.romMap[bestVariant.id_rom] || 0.0;
      }
      if (bestVariant.id_mau_sac && userProfile.mauSacMap) {
        color_match_score =
          userProfile.mauSacMap[bestVariant.id_mau_sac] || 0.0;
      }

      // 3. Tính tỷ lệ chênh lệch giá của CHÍNH BIẾN THỂ ĐẠI DIỆN
      const priceVal = parseFloat(
        bestVariant.don_gia_ap_dung || bestVariant.gia,
      );
      if (!isNaN(priceVal) && userProfile.priceRange) {
        const targetMin = userProfile.priceRange.min;
        const targetMax = userProfile.priceRange.max;

        if (priceVal >= targetMin && priceVal <= targetMax) {
          price_diff_ratio = 0.0; // Vừa vặn ngân sách!
        } else if (priceVal > targetMax) {
          price_diff_ratio = Math.min((priceVal - targetMax) / targetMax, 1.0); // Đắt hơn
        } else {
          price_diff_ratio = Math.min((targetMin - priceVal) / targetMin, 1.0); // Rẻ hơn
        }
      }
    }

    // 4. Chuẩn hóa điểm Từ khóa tìm kiếm (chia 10.0 để nén về 0.0 - 1.0)
    let keyword_sim_score = 0.0;
    if (userProfile.keywords && userProfile.keywords.length > 0) {
      const rawKwScore = this.calculateKeywordMatchingScore(
        sanPham.ten_san_pham,
        userProfile.keywords,
      );
      keyword_sim_score = Math.min(rawKwScore / 10.0, 1.0);
    }

    // 5. Lượt bán (Nén logarithm: log1p / 5.0)
    const rawSalesCount = sanPham.thong_ke_luot_mua?.tong_so_luong_ban || 0;
    const item_sales_log = Math.min(Math.log1p(rawSalesCount) / 5.0, 1.0);

    // 6. Đánh giá Sao trung bình (Chuẩn hóa Min-Max [3.5 - 5.0] về [0.0 - 1.0])
    const rawRating = sanPham.thong_ke_danh_gia?.trung_binh_sao || 3.5;
    const item_avg_rating = Math.max(
      0.0,
      Math.min((rawRating - 3.5) / 1.5, 1.0),
    );

    const featureVector = {
      product_id: sanPham.id,
      is_brand_match,
      is_category_match,
      color_match_score,
      cpu_match_score,
      gpu_match_score,
      ram_match_score,
      rom_match_score,
      price_diff_ratio,
      keyword_sim_score,
      item_sales_log,
      item_avg_rating,
    };

    // =========================================================================
    // 🔍 CHỈ IN OUTPUT CỦA SP06 (Sản phẩm A) VÀ SP08 (Sản phẩm B)
    // =========================================================================
    // if (
    //   sanPham.id === "SP06" ||
    //   sanPham.id === "SP08" ||
    //   sanPham.id === "SP01" ||
    //   sanPham.id === "SP17"
    // ) {
    //   console.log(`\n==== [FEATURE VECTOR] SẢN PHẨM: ${sanPham.id} ====`);
    //   console.table(featureVector);
    //   if (bestVariant) {
    //     console.log(
    //       `-> Biến thể đại diện được chọn: ${bestVariant.id || bestVariant.ma_bien_the || "N/A"}`,
    //     );
    //   }
    // }

    return featureVector;
  }
  // ===========================================================================================================================

  // ========================================= TÌM SẢN PHẨM TƯƠNG TỰ ======================================================//
  // Gợi ý Sản phẩm Tương tự dựa trên Sản phẩm Đang xem (Item-to-Item Similarity)
  async getSimilarProducts(id_san_pham, limit = 10) {
    if (!id_san_pham) {
      const fallback = await this.getPopularFallbackProducts(limit);
      return { targetItemProfile: null, products: fallback };
    }

    // 1. Chuyển đổi Sản phẩm Gốc thành Profile So sánh
    const targetItemProfile = await this.buildItemProfile(id_san_pham);

    // TRƯỜNG HỢP KHÔNG TÌM THẤY SẢN PHẨM GỐC: Trả về Fallback ngay
    if (!targetItemProfile) {
      const fallback = await this.getPopularFallbackProducts(limit);
      return { targetItemProfile: null, products: fallback };
    }

    // 2. Lấy tất cả sản phẩm đang kinh doanh và LOẠI BỎ sản phẩm gốc ra khỏi danh sách
    const allProducts =
      await this.sanPhamService.getAllProductsForRecommendation("RECOMMEND");
    const candidateProducts = allProducts.filter((sp) => sp.id !== id_san_pham);

    // 3. Bóc tách 11 đặc trưng tương đồng (Tận dụng lại extractProductFeatures)
    const variantMap = new Map();
    const extractedFeaturesList = candidateProducts.map((sp) => {
      const bestVariant = this.selectBestVariant(
        sp.bien_the,
        targetItemProfile,
      );
      variantMap.set(sp.id, bestVariant);

      return this.extractProductFeatures(sp, targetItemProfile, bestVariant);
    });

    // 4. CHỌN MÔ HÌNH CHẤM ĐIỂM
    // Option A: Dùng Logistic Regression
    // const scoreMap = this.calculateLogisticScores(extractedFeaturesList);

    // Option B: Dùng Random Forest/Xgboost
    const scoreMap = await this.getMLProductScores(
      extractedFeaturesList,
      "random_forest", // Có thể thay bằng "xgboost"
    );

    // 5. Gán score và xác định luôn biến thể đại diện tương đồng nhất
    const scoredProducts = candidateProducts.map((sanPham) => {
      return {
        ...sanPham,
        score: scoreMap.get(sanPham.id) || 0,
        bien_the_dai_dien: variantMap.get(sanPham.id) || null,
      };
    });

    // 6. Lọc các sản phẩm có điểm tương đồng > 0 và sắp xếp giảm dần
    const recommended = scoredProducts
      .filter((sp) => sp.score > 0)
      .sort((a, b) => b.score - a.score);

    // Helper function: Tách mảng bien_the thô ra khỏi sản phẩm trả về
    const formatProductOutput = (sp) => {
      const { bien_the, ...sanPhamClean } = sp;
      return sanPhamClean;
    };

    // TRƯỜNG HỢP 1: Đủ số lượng sản phẩm tương tự
    if (recommended.length >= limit) {
      const formattedRecommended = recommended
        .slice(0, limit)
        .map(formatProductOutput);

      return {
        targetItemProfile,
        products: formattedRecommended,
      };
    }

    // TRƯỜNG HỢP 2: Không đủ số lượng -> Bù thêm bằng Sản phẩm phổ biến
    const existingIds = [id_san_pham, ...recommended.map((p) => p.id)];
    const needMore = limit - recommended.length;
    const fallbackProducts = await this.getPopularFallbackProducts(
      needMore,
      existingIds,
    );

    const formattedRecommended = recommended.map(formatProductOutput);

    const formattedFallback = fallbackProducts.map((sp) => {
      const bestVariant = sp.bien_the_dai_dien;
      return {
        ...sp,
        score: 0,
        bien_the_dai_dien: bestVariant,
      };
    });

    return {
      targetItemProfile,
      products: [...formattedRecommended, ...formattedFallback],
    };
  }

  // Xây dựng hồ sơ đặc trưng cho sản phẩm gốc
  async buildItemProfile(id_san_pham) {
    if (!id_san_pham) return null;

    // Lấy thông tin chi tiết của Sản phẩm Gốc đang xem
    const targetProduct = await this.sanPhamService.findById(id_san_pham);
    if (!targetProduct) return null;

    const variants = targetProduct.bien_the || [];
    const prices = [];

    const cpuMap = {};
    const gpuMap = {};
    const ramMap = {};
    const romMap = {};
    const mauSacMap = {};

    // Bóc tách đặc trưng từ các biến thể của sản phẩm gốc
    variants.forEach((v) => {
      if (v.id_cpu) cpuMap[v.id_cpu] = 1.0;
      if (v.id_gpu) gpuMap[v.id_gpu] = 1.0;
      if (v.id_ram) ramMap[v.id_ram] = 1.0;
      if (v.id_rom) romMap[v.id_rom] = 1.0;
      if (v.id_mau_sac) mauSacMap[v.id_mau_sac] = 1.0;

      const priceVal = parseFloat(v.don_gia_ap_dung || v.gia);
      if (!isNaN(priceVal)) prices.push(priceVal);
    });

    // Tính mức giá trung bình của sản phẩm gốc
    let priceRange = null;
    if (prices.length > 0) {
      const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      // Tạo khoảng giá kỳ vọng tương đồng (+- 15% giá của sản phẩm gốc)
      priceRange = {
        min: avgPrice * 0.85,
        max: avgPrice * 1.15,
      };
    }

    return {
      hasHistory: true,
      thuongHieuMap: targetProduct.id_thuong_hieu
        ? { [targetProduct.id_thuong_hieu]: 1.0 }
        : {},
      danhMucMap: targetProduct.id_danh_muc
        ? { [targetProduct.id_danh_muc]: 1.0 }
        : {},
      cpuMap,
      gpuMap,
      ramMap,
      romMap,
      mauSacMap,
      keywords: [], // Không dùng từ khóa tìm kiếm khi so sánh sản phẩm - sản phẩm
      priceRange,
    };
  }
  // ====================================================================================================

  // ==================== HÀM BỔ TRỢ TOÁN HỌC & XỬ LÝ DỮ LIỆU ====================

  accumulateProductAttributes(sanPham, baseScore, coefficients, scores) {
    const { kBrand, kCat, kCpu, kGpu, kRam, kRom, kColor } = coefficients;

    // 1. Tích lũy điểm Thương hiệu & Danh mục (Mỗi sản phẩm chỉ có 1)
    if (sanPham.id_thuong_hieu) {
      scores.thuongHieu[sanPham.id_thuong_hieu] =
        (scores.thuongHieu[sanPham.id_thuong_hieu] || 0) + baseScore * kBrand;
    }
    if (sanPham.id_danh_muc) {
      scores.danhMuc[sanPham.id_danh_muc] =
        (scores.danhMuc[sanPham.id_danh_muc] || 0) + baseScore * kCat;
    }

    const variants = sanPham.bien_the || [];
    if (variants.length === 0) return;

    // 2. Lọc danh sách thuộc tính DUY NHẤT bằng Set (Mỗi cấu hình chỉ tính 1 lần / 1 sản phẩm)
    const uniqueCpus = new Set();
    const uniqueGpus = new Set();
    const uniqueRams = new Set();
    const uniqueRoms = new Set();
    const uniqueColors = new Set();
    const prices = [];

    variants.forEach((v) => {
      if (v.id_cpu) uniqueCpus.add(v.id_cpu);
      if (v.id_gpu) uniqueGpus.add(v.id_gpu);
      if (v.id_ram) uniqueRams.add(v.id_ram);
      if (v.id_rom) uniqueRoms.add(v.id_rom);
      if (v.id_mau_sac) uniqueColors.add(v.id_mau_sac);

      const priceVal = parseFloat(v.gia);
      if (!isNaN(priceVal)) prices.push(priceVal);
    });

    // 3. Tích lũy điểm cho các thuộc tính đã được loại bỏ trùng lặp
    uniqueCpus.forEach((idCpu) => {
      scores.cpu[idCpu] = (scores.cpu[idCpu] || 0) + baseScore * kCpu;
    });

    uniqueGpus.forEach((idGpu) => {
      scores.gpu[idGpu] = (scores.gpu[idGpu] || 0) + baseScore * kGpu;
    });

    uniqueRams.forEach((idRam) => {
      scores.ram[idRam] = (scores.ram[idRam] || 0) + baseScore * kRam;
    });

    uniqueRoms.forEach((idRom) => {
      scores.rom[idRom] = (scores.rom[idRom] || 0) + baseScore * kRom;
    });

    uniqueColors.forEach((idColor) => {
      scores.mauSac[idColor] =
        (scores.mauSac[idColor] || 0) + baseScore * kColor;
    });

    // 4. Tính giá trung bình đại diện cho sản phẩm
    if (prices.length > 0) {
      const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      scores.pricePoints.push({ price: avgPrice, weight: baseScore });
    }
  }

  /**
   * HÀM HỖ TRỢ: Tích lũy điểm từ một bản ghi Tìm kiếm
   */
  accumulateSearchAttribute(tk, searchWeight, scores) {
    if (!tk || !tk.tu_khoa) return;

    const key = tk.tu_khoa;

    switch (tk.loai_tim_kiem) {
      case "THUONG_HIEU":
        scores.thuongHieu[key] = (scores.thuongHieu[key] || 0) + searchWeight;
        break;
      case "DANH_MUC":
        scores.danhMuc[key] = (scores.danhMuc[key] || 0) + searchWeight;
        break;
      case "CPU":
        scores.cpu[key] = (scores.cpu[key] || 0) + searchWeight;
        break;
      case "GPU":
        scores.gpu[key] = (scores.gpu[key] || 0) + searchWeight;
        break;
      case "RAM":
        scores.ram[key] = (scores.ram[key] || 0) + searchWeight;
        break;
      case "ROM":
        scores.rom[key] = (scores.rom[key] || 0) + searchWeight;
        break;
      case "MAU_SAC":
        scores.mauSac[key] = (scores.mauSac[key] || 0) + searchWeight;
        break;
      case "TU_KHOA":
        scores.keywords.push({ keyword: key, weight: searchWeight });
        break;
      case "GIA": {
        const representativePrice =
          this.extractRepresentativePriceFromSearch(tk);
        if (representativePrice) {
          scores.pricePoints.push({
            price: representativePrice,
            weight: searchWeight,
          });
        }
        break;
      }
      default:
        break;
    }
  }

  extractRepresentativePriceFromSearch(tk) {
    const min = tk.gia_tu ? parseFloat(tk.gia_tu) : null;
    const max = tk.gia_den ? parseFloat(tk.gia_den) : null;

    if (min && max) return (min + max) / 2;
    if (min && !max) return (min + min * 1.5) / 2; // Giả định trần giá min * 1.5
    if (!min && max) return (max * 0.5 + max) / 2; // Giả định sàn giá max * 0.5
    return null;
  }

  calculateTargetPriceRange(pricePoints) {
    if (!pricePoints || pricePoints.length === 0) return null;

    const totalWeight = pricePoints.reduce((sum, pt) => sum + pt.weight, 0);
    const weightedSum = pricePoints.reduce(
      (sum, pt) => sum + pt.price * pt.weight,
      0,
    );

    const expectedPrice = weightedSum / totalWeight;

    // Biên độ nới rộng +-20%
    return {
      min: expectedPrice * 0.8,
      max: expectedPrice * 1.2,
    };
  }

  calculateKeywordMatchingScore(ten_san_pham, keywords) {
    if (!ten_san_pham) return 0;
    const productNameLower = ten_san_pham.toLowerCase();
    let maxScore = 0;

    keywords.forEach((item) => {
      const kwLower = item.keyword.toLowerCase().trim();
      if (!kwLower) return;

      // 1. Khớp chính xác toàn bộ cụm từ
      if (productNameLower.includes(kwLower)) {
        maxScore = Math.max(maxScore, 10.0);
      }
      // 2. Khớp từng từ đơn lẻ
      else {
        const words = kwLower.split(" ").filter((w) => w.length > 1);
        const matchedWords = words.filter((word) =>
          productNameLower.includes(word),
        );
        if (matchedWords.length > 0) {
          const score = (matchedWords.length / words.length) * 5.0;
          maxScore = Math.max(maxScore, score);
        }
      }
    });

    return maxScore;
  }

  // Lấy Top K thuộc tính có điểm cao nhất và chuẩn hóa về dải [0.0 - 1.0]
  getTopNormalizedMap(scoreObj, limit = 3) {
    const entries = Object.entries(scoreObj);
    if (entries.length === 0) return {};

    // 1. Sắp xếp giảm dần theo điểm tích lũy và lấy Top K
    const topEntries = entries.sort((a, b) => b[1] - a[1]).slice(0, limit);

    // 2. Lấy điểm của mục đứng đầu (Top 1) làm mốc chuẩn MaxScore
    const maxScore = topEntries[0][1];
    if (maxScore === 0) return {};

    // 3. Quy đổi điểm các mục trong Top K theo tỷ lệ [0.0 - 1.0]
    const normalizedMap = {};
    topEntries.forEach(([key, val]) => {
      normalizedMap[key] = parseFloat((val / maxScore).toFixed(4));
    });

    return normalizedMap;
  }

  selectBestVariant(variants, userProfile) {
    if (!variants || variants.length === 0) return null;

    // Helper chọn biến thể rẻ nhất làm mặc định
    const getCheapestVariant = () => {
      return [...variants].sort((a, b) => {
        const priceA = parseFloat(a.don_gia_ap_dung || 0);
        const priceB = parseFloat(b.don_gia_ap_dung || 0);
        return priceA - priceB;
      })[0];
    };

    // Nếu là khách hàng mới (Cold Start) hoặc profile không có lịch sử -> Chọn biến thể rẻ nhất
    if (!userProfile || !userProfile.hasHistory) {
      return getCheapestVariant();
    }

    let bestVariant = variants[0];
    let maxScore = -1;

    // Chấm điểm từng biến thể dựa trên thang điểm mềm [0.0 - 1.0] của userProfile
    variants.forEach((v) => {
      let score = 0;

      // Chỉ tính điểm nếu biến thể còn hàng. Nếu hết hàng -> mặc định 0 điểm
      // 1. Khớp CPU ưa thích (Trọng số tối đa: 3.0)
      if (v.id_cpu && userProfile.cpuMap?.[v.id_cpu]) {
        score += 3.0 * userProfile.cpuMap[v.id_cpu];
      }

      // 2. Khớp GPU ưa thích (Trọng số tối đa: 2.5)
      if (v.id_gpu && userProfile.gpuMap?.[v.id_gpu]) {
        score += 2.5 * userProfile.gpuMap[v.id_gpu];
      }

      // 3. Khớp RAM ưa thích (Trọng số tối đa: 2.5)
      if (v.id_ram && userProfile.ramMap?.[v.id_ram]) {
        score += 2.5 * userProfile.ramMap[v.id_ram];
      }

      // 4. Khớp ROM ưa thích (Trọng số tối đa: 2.0)
      if (v.id_rom && userProfile.romMap?.[v.id_rom]) {
        score += 2.0 * userProfile.romMap[v.id_rom];
      }

      // 5. Khớp Màu sắc ưa thích (Trọng số tối đa: 1.0)
      if (v.id_mau_sac && userProfile.mauSacMap?.[v.id_mau_sac]) {
        score += 1.0 * userProfile.mauSacMap[v.id_mau_sac];
      }

      // 6. Nằm trong khoảng giá kỳ vọng (Trọng số: 3.0)
      if (userProfile.priceRange && v.don_gia_ap_dung) {
        const price = parseFloat(v.don_gia_ap_dung);
        if (
          price >= userProfile.priceRange.min &&
          price <= userProfile.priceRange.max
        ) {
          score += 3.0;
        }
      }

      // Cập nhật biến thể có số điểm cao nhất
      if (score > maxScore) {
        maxScore = score;
        bestVariant = v;
      }
    });

    // Nếu tất cả biến thể đều không khớp tiêu chí nào (maxScore = 0), lấy biến thể rẻ nhất
    if (maxScore === 0 || !bestVariant) {
      return getCheapestVariant();
    }

    return bestVariant;
  }
}

module.exports = new GoiYSanPhamService();
