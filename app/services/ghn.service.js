const axios = require("axios");
const prisma = require("../utils/prisma");

const ThongBaoService = require("./thong-bao.service");

class GHNService {
  constructor() {
    this.thongBaoService = new ThongBaoService();

    this.apiUrl =
      process.env.GHN_API_URL ||
      "https://dev-online-gateway.ghn.vn/shiip/public-api";

    this.token = (process.env.GHN_TOKEN || "").trim();
    this.shopId = Number(process.env.GHN_SHOP_ID) || 0;

    // Axios client dùng chung
    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        "Content-Type": "application/json",
        Token: this.token,
      },
    });
  }

  // 1. Lấy danh sách Tỉnh / Thành (Chỉ cần Token, không gửi ShopId)
  async getProvinces() {
    try {
      const response = await this.client.get("/master-data/province");
      return response.data.data;
    } catch (error) {
      console.error(
        "Lỗi API GHN (getProvinces):",
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  // 2. Lấy danh sách Quận / Huyện
  async getDistricts(provinceId) {
    try {
      const response = await this.client.post("/master-data/district", {
        province_id: Number(provinceId),
      });
      return response.data.data;
    } catch (error) {
      console.error(
        "Lỗi API GHN (getDistricts):",
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  // 3. Lấy danh sách Phường / Xã
  async getWards(districtId) {
    try {
      const response = await this.client.post("/master-data/ward", {
        district_id: Number(districtId),
      });
      return response.data.data;
    } catch (error) {
      console.error(
        "Lỗi API GHN (getWards):",
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  // 4. Tính phí vận chuyển
  async calculateFee(orderData) {
    try {
      const { to_district_id, to_ward_code, items, tong_tien } = orderData;

      // Tính tổng trọng lượng từ danh sách sản phẩm trong giỏ hàng
      let totalWeight = 0;
      const ghnItems = (items || []).map((item) => {
        const itemWeight = item.trong_luong || 2500; // Mặc định 2.5kg cho 1 laptop
        const quantity = item.so_luong || 1;
        totalWeight += itemWeight * quantity;

        return {
          name: item.ten_san_pham || "Laptop",
          quantity: quantity,
          weight: itemWeight,
        };
      });

      // Lấy ID quận/huyện của kho hàng shop từ file .env
      const shopDistrictId = Number(process.env.SHOP_DISTRICT_ID) || 0;

      const feePayload = {
        from_district_id: shopDistrictId,
        to_district_id: Number(to_district_id),
        to_ward_code: String(to_ward_code),
        weight: totalWeight, // Tổng trọng lượng (gram)
        length: 40, // Kích thước hộp đựng laptop tiêu chuẩn (cm)
        width: 30,
        height: 10,
        service_type_id: 2, // Gói dịch vụ tiêu chuẩn
        insurance_value: Number(tong_tien) || 0, // Giá trị bảo hiểm tương ứng tổng tiền đơn hàng
        items: ghnItems,
      };

      const response = await this.client.post(
        "/v2/shipping-order/fee",
        feePayload,
        {
          headers: {
            ShopId: this.shopId,
          },
        },
      );

      return response.data.data;
    } catch (error) {
      console.error(
        "Lỗi API GHN (calculateFee):",
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  // 6. Tạo đơn GHN
  async createOrder(id_don_hang) {
    try {
      // 1. Tìm đơn hàng kèm thông tin khách hàng và chi tiết sản phẩm
      const donHang = await prisma.don_hang.findUnique({
        where: { id: id_don_hang },
        include: {
          khach_hang: true,
          chi_tiet_don_hang: {
            include: {
              bien_the: {
                include: {
                  san_pham: true,
                },
              },
            },
          },
        },
      });

      if (!donHang) {
        throw new Error("KHONG_TIM_THAY_DON_HANG");
      }

      // 2. Chuẩn bị danh sách sản phẩm theo chuẩn GHN
      const ghnItems = donHang.chi_tiet_don_hang.map((item) => ({
        name: item.bien_the?.san_pham?.ten_san_pham || "Laptop",
        code: String(item.laptop_id || ""),
        quantity: item.so_luong,
        price: Number(item.don_gia_ap_dung || 0),
        weight: item.bien_the?.san_pham?.trong_luong || 2500,
      }));

      // Tính tổng trọng lượng
      const totalWeight = ghnItems.reduce(
        (sum, item) => sum + item.weight * item.quantity,
        0,
      );

      const shopDistrictId = Number(process.env.SHOP_DISTRICT_ID) || 0;
      const tongTienThanhToan = Number(donHang.tong_tien_thanh_toan) || 0;
      const tienVanChuyen = Number(donHang.tien_van_chuyen) || 0;

      // 3. Đóng gói payload gửi GHN
      const ghnPayload = {
        to_name: donHang.khach_hang?.ho_ten,
        to_phone: donHang.so_dien_thoai || "0900000000",
        to_address: donHang.dia_chi,
        to_ward_code: String(donHang.ward_code),
        to_district_id: Number(donHang.district_id), // Sửa lại biến nếu cần
        from_district_id: shopDistrictId,
        weight: totalWeight,
        length: 40,
        width: 30,
        height: 10,
        service_type_id: 2,
        payment_type_id: donHang.phuong_thuc_thanh_toan === "COD" ? 2 : 1,
        required_note: "KHONGCHOXEMHANG",
        cod_amount:
          donHang.phuong_thuc_thanh_toan === "COD" ? tongTienThanhToan : 0,
        insurance_value: Math.max(0, tongTienThanhToan - tienVanChuyen),
        items: ghnItems,
      };

      // 4. Gọi trực tiếp API tạo đơn sang GHN bằng Axios client
      const response = await this.client.post(
        "/v2/shipping-order/create",
        ghnPayload,
        {
          headers: {
            ShopId: this.shopId,
          },
        },
      );

      const ghnResponse = response.data.data; // Lấy dữ liệu trả về từ GHN (chứa order_code)

      return ghnResponse;
    } catch (error) {
      console.error(
        "Lỗi API GHN (createOrderFromDb):",
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  // Lấy chi tiết đơn hàng từ GHN (kiểm tra tiền COD, hành trình, thông tin người nhận)
  async getOrderDetail(orderCode) {
    try {
      if (!orderCode) {
        throw new Error("MA_VAN_DON_KHONG_HOP_LE");
      }

      const response = await this.client.post(
        "/v2/shipping-order/detail",
        {
          order_code: String(orderCode),
        },
        {
          headers: {
            ShopId: this.shopId,
          },
        },
      );

      return response.data.data;
    } catch (error) {
      console.error(
        "Lỗi API GHN (getOrderDetail):",
        error.response?.data || error.message,
      );
      throw error;
    }
  }
}

module.exports = GHNService;
