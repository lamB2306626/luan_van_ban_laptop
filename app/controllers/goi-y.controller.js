const goiYSanPhamService = require("../services/goi-y.service");

class GoiYSanPhamController {
  /**
   * GET /api/goiy/canhan
   * Lấy danh sách gợi ý trang chủ (Truyền query id_khach_hang và limit)
   */
  async getPersonalized(req, res) {
    try {
      const { id_khach_hang, limit } = req.query;
      const parsedLimit = limit ? parseInt(limit) : 10;

      // Hàm service bây giờ trả về { userProfile, products }
      const { userProfile, products } =
        await goiYSanPhamService.getPersonalizedRecommendations(
          id_khach_hang || null,
          parsedLimit,
        );

      return res.status(200).json({
        success: true,
        message: "Lấy danh sách sản phẩm gợi ý thành công",
        userProfile, // Trả về thông tin phân tích hồ sơ người dùng
        total: products.length,
        data: products,
      });
    } catch (error) {
      console.error("Lỗi khi lấy gợi ý sản phẩm:", error);
      return res.status(500).json({
        success: false,
        message: "Đã xảy ra lỗi máy chủ nội bộ",
        error: error.message,
      });
    }
  }

  /**
   * GET /api/goiy/noibat
   * API gọi trực tiếp danh sách sản phẩm nổi bật (Fallback công khai)
   */
  async getPopular(req, res) {
    try {
      const { limit } = req.query;
      const parsedLimit = limit ? parseInt(limit) : 10;

      const products =
        await goiYSanPhamService.getPopularFallbackProducts(parsedLimit);

      return res.status(200).json({
        success: true,
        message: "Lấy danh sách sản phẩm nổi bật thành công",
        total: products.length,
        data: products,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Đã xảy ra lỗi máy chủ",
        error: error.message,
      });
    }
  }

  /**
   * GET /api/goiy/tuongtu
   * tìm sản phẩm tương tự (Truyền query id_san_pham và limit)
   */
  async getSimilarProducts(req, res) {
    try {
      const { id_san_pham, limit } = req.query;

      if (!id_san_pham) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp id_san_pham để lấy sản phẩm tương tự",
        });
      }

      const parsedLimit = limit ? parseInt(limit, 10) : 10;

      // Hàm service trả về { targetItemProfile, products }
      const { targetItemProfile, products } =
        await goiYSanPhamService.getSimilarProducts(id_san_pham, parsedLimit);

      return res.status(200).json({
        success: true,
        message: "Lấy danh sách sản phẩm tương tự thành công",
        targetItemProfile, // Thông tin profile đặc trưng bóc tách từ sản phẩm gốc
        total: products.length,
        data: products,
      });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách sản phẩm tương tự:", error);
      return res.status(500).json({
        success: false,
        message: "Đã xảy ra lỗi máy chủ nội bộ",
        error: error.message,
      });
    }
  }
}

module.exports = new GoiYSanPhamController();
