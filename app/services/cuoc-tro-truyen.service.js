const prisma = require("../utils/prisma");

class CuocTroTruyenService {
  // 1. Hàm phụ trợ: Sinh mã ID cuộc trò chuyện (CT01, CT02...)
  async generateNextCuocTroTruyenId() {
    const lastCuoc = await prisma.cuoc_tro_truyen.findFirst({
      orderBy: { id: "desc" },
    });

    if (!lastCuoc) return "CT0001";

    const currentNumber = parseInt(lastCuoc.id.replace(/\D/g, ""), 10) || 0;
    return `CT${String(currentNumber + 1).padStart(4, "0")}`;
  }

  // 2. Hàm phụ trợ: Sinh mã ID lịch sử trò chuyện tổng (LS01, LS02...)
  async generateNextLichSuId() {
    const lastLichSu = await prisma.lich_su_tro_truyen.findFirst({
      orderBy: { id: "desc" },
    });

    if (!lastLichSu) return "LS0001";

    const currentNumber = parseInt(lastLichSu.id.replace(/\D/g, ""), 10) || 0;
    return `LS${String(currentNumber + 1).padStart(4, "0")}`;
  }

  // 3. TẠO MỚI LUÔN CUỘC TRÒ CHUYỆN (CHỦ ĐỀ) MỖI LẦN KHÁCH BẤM CHAT
  async create(payload) {
    const { id_khach_hang, id_san_pham, id_don_hang, tieu_de } = payload;

    if (!id_khach_hang) {
      throw new Error("Thiếu id_khach_hang để tạo cuộc trò chuyện!");
    }

    // BƯỚC 1: Lấy hoặc khởi tạo Hộp thư tổng (lich_su_tro_truyen) cho Khách hàng
    let history = await prisma.lich_su_tro_truyen.findUnique({
      where: { id_khach_hang: id_khach_hang },
    });

    if (!history) {
      const nextHistoryId = await this.generateNextLichSuId();
      history = await prisma.lich_su_tro_truyen.create({
        data: {
          id: nextHistoryId,
          id_khach_hang: id_khach_hang,
        },
      });
    }

    // BƯỚC 2: Đặt tiêu đề mặc định nếu người dùng không truyền vào
    let defaultTitle = tieu_de || "Tư vấn hỗ trợ";
    if (!tieu_de) {
      if (id_san_pham) defaultTitle = "Hỏi về sản phẩm";
      else if (id_don_hang) defaultTitle = `Hỗ trợ đơn hàng #${id_don_hang}`;
    }

    // BƯỚC 3: LUÔN TẠO MỚI 1 CUỘC TRÒ CHUYỆN (CHỦ ĐỀ) MỚI
    const nextThreadId = await this.generateNextCuocTroTruyenId();

    const newThread = await prisma.cuoc_tro_truyen.create({
      data: {
        id: nextThreadId,
        id_lich_su_tro_truyen: history.id,
        id_san_pham: id_san_pham || null,
        id_don_hang: id_don_hang || null,
        tieu_de: defaultTitle,
      },
      include: {
        san_pham: true,
        don_hang: true,
      },
    });

    return newThread;
  }

  // Lấy cuộc trò chuyện mới nhất của khách hàng theo thời gian tạo (created_at giảm dần)
  async getLatestByKhachHang(id_khach_hang) {
    if (!id_khach_hang) return null;

    const latestThread = await prisma.cuoc_tro_truyen.findFirst({
      where: {
        lich_su_tro_truyen: {
          id_khach_hang: id_khach_hang,
        },
      },
      orderBy: {
        created_at: "desc", // Lấy bản ghi mới nhất vừa được tạo
      },
    });

    return latestThread;
  }
}

module.exports = CuocTroTruyenService;
