const prisma = require("../utils/prisma");
const CuocTroTruyenService = require("./cuoc-tro-truyen.service");

class TinNhanService {
  constructor() {
    this.cuocTroTruyenService = new CuocTroTruyenService();
  }
  // Lọc lấy các trường thuộc tính hợp lệ của tin nhắn
  extractTinNhanData(payload) {
    const tinNhan = {
      id: payload.id,
      id_cuoc_tro_truyen: payload.id_cuoc_tro_truyen,
      id_khach_hang: payload.id_khach_hang,
      id_nhan_vien: payload.id_nhan_vien,
      vai_tro_nguoi_gui: payload.vai_tro_nguoi_gui,
      noi_dung: payload.noi_dung,
      da_doc: payload.da_doc,
    };
    Object.keys(tinNhan).forEach(
      (key) => tinNhan[key] === undefined && delete tinNhan[key],
    );
    return tinNhan;
  }

  // Hàm phụ trợ: Tự sinh mã tin nhắn TN01, TN02...
  async generateNextTinNhanId() {
    const lastTinNhan = await prisma.tin_nhan.findFirst({
      orderBy: { id: "desc" },
    });

    if (!lastTinNhan) return "TN0001";

    const currentNumber = parseInt(lastTinNhan.id.replace(/\D/g, ""), 10) || 0;
    return `TN${String(currentNumber + 1).padStart(4, "0")}`;
  }

  // 1. Khách hàng gửi tin nhắn vào một cuộc trò chuyện đã có sẵn ID
  // async guiTinNhanKhachHang(payload) {
  //   const {
  //     id_cuoc_tro_truyen,
  //     id_khach_hang,
  //     noi_dung,
  //     id_san_pham,
  //     id_don_hang,
  //     tieu_de,
  //   } = payload;

  //   // SỬA LỖI 2: Chỉ validate id_khach_hang và noi_dung (không bắt tieu_de phải có)
  //   if (!id_khach_hang || !noi_dung) {
  //     throw new Error("Thiếu id_khach_hang, hoặc noi_dung!");
  //   }

  //   let targetThreadId = id_cuoc_tro_truyen;
  //   let historyId = null;

  //   // 2. Nếu Frontend KHÔNG truyền id_cuoc_tro_truyen -> Tự động tạo mới cuộc trò chuyện
  //   if (!targetThreadId) {
  //     const data = {
  //       id_khach_hang: id_khach_hang,
  //       id_san_pham: id_san_pham || null,
  //       id_don_hang: id_don_hang || null,
  //       tieu_de: tieu_de,
  //     };

  //     // SỬA LỖI 1: Tạo cuộc trò chuyện mới qua Service
  //     const newThread = await this.cuocTroTruyenService.create(data);
  //     targetThreadId = newThread.id;
  //     historyId = newThread.id_lich_su_tro_truyen;
  //   } else {
  //     // SỬA LỖI 3: Nếu dùng cuộc trò chuyện cũ -> Tìm ID Hộp thư tổng (lich_su_tro_truyen)
  //     const existingThread = await prisma.cuoc_tro_truyen.findUnique({
  //       where: { id: targetThreadId },
  //       select: { id_lich_su_tro_truyen: true },
  //     });

  //     if (!existingThread) {
  //       throw new Error("Không tìm thấy cuộc trò chuyện!");
  //     }
  //     historyId = existingThread.id_lich_su_tro_truyen;
  //   }

  //   // 3. Chèn tin nhắn mới & cập nhật updated_at của Hộp thư
  //   const nextTinNhanId = await this.generateNextTinNhanId();

  //   const [tinNhanMoi] = await prisma.$transaction([
  //     prisma.tin_nhan.create({
  //       data: {
  //         id: nextTinNhanId,
  //         id_cuoc_tro_truyen: targetThreadId,
  //         id_khach_hang: id_khach_hang,
  //         id_nhan_vien: null,
  //         vai_tro_nguoi_gui: "customer",
  //         noi_dung: noi_dung,
  //         da_doc: false,
  //       },
  //     }),

  //     prisma.lich_su_tro_truyen.update({
  //       where: { id: historyId }, // SỬA LỖI 3: Dùng historyId đã xác định an toàn
  //       data: {
  //         updated_at: new Date(),
  //       },
  //     }),
  //   ]);

  //   return tinNhanMoi;
  // }

  // 1. Khách hàng gửi tin nhắn
  async guiTinNhanKhachHang(payload, io) {
    const {
      id_cuoc_tro_truyen,
      id_khach_hang,
      noi_dung,
      id_san_pham,
      id_don_hang,
      tieu_de,
    } = payload;

    if (!id_khach_hang || !noi_dung) {
      throw new Error("Thiếu id_khach_hang hoặc noi_dung!");
    }

    let targetThreadId = id_cuoc_tro_truyen;
    let historyId = null;

    // 2. Nếu Frontend KHÔNG truyền id_cuoc_tro_truyen -> Kiểm tra cuộc trò chuyện gần nhất
    if (!targetThreadId) {
      const targetProductId = id_san_pham || null;
      const targetOrderId = id_don_hang || null;

      // Lấy cuộc trò chuyện mới nhất của khách hàng
      const latestThread =
        await this.cuocTroTruyenService.getLatestByKhachHang(id_khach_hang);

      // Kiểm tra xem latestThread có CÙNG NGHỮ CẢNH với yêu cầu gửi tin hiện tại không
      const isSameContext =
        latestThread &&
        latestThread.id_san_pham === targetProductId &&
        latestThread.id_don_hang === targetOrderId;

      if (isSameContext) {
        // Cùng ngữ cảnh -> TÁI SỬ DỤNG cuộc trò chuyện mới nhất đó
        targetThreadId = latestThread.id;
        historyId = latestThread.id_lich_su_tro_truyen;
      } else {
        // Khác ngữ cảnh (hoặc chưa từng có cuộc trò chuyện nào) -> TẠO MỚI cuộc trò chuyện
        const data = {
          id_khach_hang: id_khach_hang,
          id_san_pham: targetProductId,
          id_don_hang: targetOrderId,
          tieu_de: tieu_de,
        };

        const newThread = await this.cuocTroTruyenService.create(data);
        targetThreadId = newThread.id;
        historyId = newThread.id_lich_su_tro_truyen;
      }
    } else {
      // Trường hợp Frontend CÓ truyền id_cuoc_tro_truyen -> Dùng đúng ID đó
      const existingThread = await prisma.cuoc_tro_truyen.findUnique({
        where: { id: targetThreadId },
        select: { id_lich_su_tro_truyen: true },
      });

      if (!existingThread) {
        throw new Error("Không tìm thấy cuộc trò chuyện!");
      }
      historyId = existingThread.id_lich_su_tro_truyen;
    }

    // 3. Chèn tin nhắn mới & cập nhật updated_at của Hộp thư
    const nextTinNhanId = await this.generateNextTinNhanId();

    const [tinNhanMoi] = await prisma.$transaction([
      prisma.tin_nhan.create({
        data: {
          id: nextTinNhanId,
          id_cuoc_tro_truyen: targetThreadId,
          id_khach_hang: id_khach_hang,
          id_nhan_vien: null,
          vai_tro_nguoi_gui: "customer",
          noi_dung: noi_dung,
          da_doc: false,
        },
        // include thêm thông tin khách hàng cho đầy đủ để lúc tin nhắn được bắn qua
        // socket fontend lấy dữ liệu này để thêm vào danh sách tin nhắn để render
        include: {
          khach_hang: {
            select: { id: true, ho_ten: true, avatar: true },
          },
          nhan_vien: {
            select: { id: true, ho_ten: true, avatar: true },
          },
        },
      }),

      prisma.lich_su_tro_truyen.update({
        where: { id: historyId },
        data: {
          updated_at: new Date(),
        },
      }),
    ]);

    // BẮN SỰ KIỆN REAL-TIME QUA SOCKET.IO DÀNH CHO CÁC TIN NHẮN TRONG MÀNG HÌNH CHAT MÀ KHÁCH HÀNG ĐANG MỞ (Phòng history_...)
    if (io) {
      // -------------------------------------------------------------------------
      // LUỒNG 1: Bắn tin nhắn trực tiếp vào Phòng Chat (`history_<id>`)
      // (Dành cho KH và NV đang mở màn hình Chat trực tiếp)
      // -------------------------------------------------------------------------
      if (historyId) {
        io.to(`history_${historyId}`).emit("receive_message", {
          ...tinNhanMoi,
          id_lich_su_tro_truyen: historyId,
        });
      }

      // -------------------------------------------------------------------------
      // LUỒNG 2: Bắn Thông báo vào Kênh Tổng Nhân Viên (staff_room)
      // (Dành cho TẤT CẢ Nhân viên đang online ở bất kỳ trang quản lý nào)
      // -------------------------------------------------------------------------
      io.to("staff_room").emit("staff_notification", {
        type: "NEW_CUSTOMER_MESSAGE",
        tieu_de: "Tin nhắn mới từ Khách hàng",
        noi_dung: tinNhanMoi.noi_dung,
        history_id: historyId,
        tin_nhan: tinNhanMoi,
        khach_hang: tinNhanMoi.khach_hang || khachHangInfo,
      });

      console.log(
        `[Socket] Đã bắn staff_notification tới KÊNH TỔNG staff_room`,
      );
    }

    return tinNhanMoi;
  }

  // 2. Nhân viên / Admin gửi tin nhắn trả lời vào cuộc trò chuyện
  async guiTinNhanNhanVien(payload, io) {
    const { id_cuoc_tro_truyen, id_nhan_vien, noi_dung } = payload;

    // 1. Kiểm tra cuộc trò chuyện có tồn tại không
    const cuocTroTruyen = await prisma.cuoc_tro_truyen.findUnique({
      where: { id: id_cuoc_tro_truyen },
      include: { lich_su_tro_truyen: true },
    });

    if (!cuocTroTruyen) {
      return null;
    }

    const nextTinNhanId = await this.generateNextTinNhanId();

    // 2. Thực hiện chèn tin nhắn và cập nhật thời gian cuộc trò chuyện
    const [tinNhanMoi] = await prisma.$transaction([
      prisma.tin_nhan.create({
        data: {
          id: nextTinNhanId,
          id_cuoc_tro_truyen: id_cuoc_tro_truyen,
          id_khach_hang: null,
          id_nhan_vien: id_nhan_vien,
          vai_tro_nguoi_gui: "staff",
          noi_dung: noi_dung,
          da_doc: false,
        },
        // Include thông tin người gửi để Frontend có sẵn avatar/tên render trực tiếp
        include: {
          khach_hang: {
            select: { id: true, ho_ten: true, avatar: true },
          },
          nhan_vien: {
            select: { id: true, ho_ten: true, avatar: true },
          },
        },
      }),
      prisma.lich_su_tro_truyen.update({
        where: { id: cuocTroTruyen.id_lich_su_tro_truyen },
        data: {
          updated_at: new Date(),
        },
      }),
    ]);

    const historyId = cuocTroTruyen.id_lich_su_tro_truyen;
    const idKhachHang = cuocTroTruyen.lich_su_tro_truyen?.id_khach_hang;

    if (io) {
      // -------------------------------------------------------------------------
      // LUỒNG 1: Bắn tin nhắn trực tiếp vào Phòng Chat (`history_<id>`)
      // (Dành cho KH và NV đang mở màn hình Chat trực tiếp)
      // -------------------------------------------------------------------------
      if (historyId) {
        io.to(`history_${historyId}`).emit("receive_message", {
          ...tinNhanMoi,
          id_lich_su_tro_truyen: historyId,
        });
      }

      // -------------------------------------------------------------------------
      // LUỒNG 2: Bắn Thông báo Toàn cục vào Phòng Cá Nhân của Khách (`user_<id>`)
      // (Dành cho KH đang lướt trang khác như Trang chủ, Giỏ hàng, Chi tiết SP)
      // -------------------------------------------------------------------------
      if (idKhachHang) {
        io.to(`user_${idKhachHang}`).emit("global_notification", {
          type: "NEW_MESSAGE",
          tieu_de: "Phản hồi từ CSKH",
          noi_dung: tinNhanMoi.noi_dung,
          history_id: historyId,
          tin_nhan: tinNhanMoi,
        });
        console.log(
          `[Socket] Đã gửi global_notification tới phòng: user_${idKhachHang}`,
        );
      }
    }

    return tinNhanMoi;
  }
}

module.exports = TinNhanService;
