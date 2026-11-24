const prisma = require("../utils/prisma");

class LichSuTroTruyenService {
  // Lọc lấy các trường thuộc tính hợp lệ của cuộc trò chuyện
  extractCuocTroTruyenData(payload) {
    const cuocTroTruyen = {
      id: payload.id,
      id_khach_hang: payload.id_khach_hang,
      id_san_pham: payload.id_san_pham,
      id_don_hang: payload.id_don_hang,
      tieu_de: payload.tieu_de,
      trang_thai: payload.trang_thai,
    };
    Object.keys(cuocTroTruyen).forEach(
      (key) => cuocTroTruyen[key] === undefined && delete cuocTroTruyen[key],
    );
    return cuocTroTruyen;
  }

  // 1. Lấy danh sách Hộp thư CSKH cho Admin (Trả về dữ liệu thô từ Prisma)
  async find(filterData = {}) {
    const whereCuocTroTruyen = {};

    // Lọc chủ đề theo trạng thái ('OPEN' hoặc 'CLOSE')
    if (filterData.trang_thai) {
      whereCuocTroTruyen.trang_thai = filterData.trang_thai;
    }

    // Tìm kiếm theo tiêu đề chủ đề
    if (filterData.tieu_de) {
      whereCuocTroTruyen.tieu_de = {
        contains: filterData.tieu_de,
        mode: "insensitive",
      };
    }

    // Truy vấn danh sách Hộp thư tổng của Khách hàng kèm các Chủ đề và Tin nhắn
    return await prisma.lich_su_tro_truyen.findMany({
      where: {
        cuoc_tro_truyen: {
          some: whereCuocTroTruyen, // Chỉ lấy những hộp thư có chủ đề thỏa điều kiện
        },
      },
      include: {
        khach_hang: {
          select: {
            id: true,
            ho_ten: true,
            email: true,
            so_dien_thoai: true,
            avatar: true,
          },
        },
        cuoc_tro_truyen: {
          where: whereCuocTroTruyen,
          include: {
            san_pham: {
              select: { id: true, ten_san_pham: true },
            },
            don_hang: {
              select: {
                id: true,
                tong_tien_thanh_toan: true,
                trang_thai_don_hang: true,
              },
            },
            tin_nhan: {
              include: {
                khach_hang: {
                  select: { id: true, ho_ten: true, avatar: true },
                },
                nhan_vien: { select: { id: true, ho_ten: true, avatar: true } },
              },
              orderBy: { created_at: "desc" },
              take: 1, // Preview 1 tin nhắn mới nhất của từng chủ đề
            },
            _count: {
              select: {
                tin_nhan: {
                  where: {
                    da_doc: false,
                    vai_tro_nguoi_gui: "customer", // Đếm tin nhắn chưa đọc do khách gửi
                  },
                },
              },
            },
          },
          orderBy: {
            created_at: "desc", // Sắp xếp chủ đề mới tương tác lên đầu
          },
        },
      },
      orderBy: {
        updated_at: "desc", // Hộp thư nào có tương tác mới nhất sẽ nằm lên đầu
      },
    });
  }

  // 2. Lấy TOÀN BỘ lịch sử các chủ đề & tin nhắn của 1 Khách hàng
  async findByKhachHang(id_khach_hang) {
    if (!id_khach_hang) return [];

    // Tìm Hộp thư CSKH duy nhất của Khách hàng
    const history = await prisma.lich_su_tro_truyen.findUnique({
      where: {
        id_khach_hang: id_khach_hang,
      },
      include: {
        khach_hang: {
          select: {
            id: true,
            ho_ten: true,
            avatar: true,
          },
        },
        cuoc_tro_truyen: {
          include: {
            san_pham: {
              include: {
                danh_muc: { select: { id: true, ten_danh_muc: true } },
                thuong_hieu: { select: { id: true, ten_thuong_hieu: true } },
              },
            },
            don_hang: {
              select: {
                id: true,
                tong_tien_thanh_toan: true,
                trang_thai_don_hang: true,
              },
            },
            // Lấy TOÀN BỘ tin nhắn của chủ đề, xếp từ cũ -> mới để chạy luồng chat
            tin_nhan: {
              include: {
                khach_hang: {
                  select: { id: true, ho_ten: true, avatar: true },
                },
                nhan_vien: { select: { id: true, ho_ten: true, avatar: true } },
              },
              orderBy: { created_at: "asc" },
            },
            _count: {
              select: {
                tin_nhan: {
                  where: {
                    da_doc: false,
                    vai_tro_nguoi_gui: "staff", // Đếm tin chưa đọc do Nhân viên gửi cho Khách
                  },
                },
              },
            },
          },
          orderBy: {
            created_at: "asc", // Sắp xếp các chủ đề cũ ở trên, mới ở dưới theo thời gian
          },
        },
      },
    });

    // Trả về mảng các cuộc trò chuyện (chủ đề) của khách hàng đó (hoặc mảng rỗng nếu chưa nhắn bao giờ)
    return history || null;
  }

  // 3. Lấy TOÀN BỘ lịch sử các chủ đề & tin nhắn của 1 id lịch sử trò truyện
  async findById(id) {
    if (!id) return [];

    // Tìm Hộp thư CSKH duy nhất của Khách hàng
    const history = await prisma.lich_su_tro_truyen.findUnique({
      where: {
        id: id,
      },
      include: {
        khach_hang: {
          select: {
            id: true,
            ho_ten: true,
            avatar: true,
          },
        },
        cuoc_tro_truyen: {
          include: {
            san_pham: {
              include: {
                danh_muc: { select: { id: true, ten_danh_muc: true } },
                thuong_hieu: { select: { id: true, ten_thuong_hieu: true } },
              },
            },
            don_hang: {
              select: {
                id: true,
                tong_tien_thanh_toan: true,
                trang_thai_don_hang: true,
              },
            },
            // Lấy TOÀN BỘ tin nhắn của chủ đề, xếp từ cũ -> mới để chạy luồng chat
            tin_nhan: {
              include: {
                khach_hang: {
                  select: { id: true, ho_ten: true, avatar: true },
                },
                nhan_vien: { select: { id: true, ho_ten: true, avatar: true } },
              },
              orderBy: { created_at: "asc" },
            },
            _count: {
              select: {
                tin_nhan: {
                  where: {
                    da_doc: false,
                    vai_tro_nguoi_gui: "customer", // Đếm tin chưa đọc do Khách gửi cho Nhân viên
                  },
                },
              },
            },
          },
          orderBy: {
            created_at: "asc", // Sắp xếp các chủ đề cũ ở trên, mới ở dưới theo thời gian
          },
        },
      },
    });

    // Trả về mảng các cuộc trò chuyện (chủ đề) của khách hàng đó (hoặc mảng rỗng nếu chưa nhắn bao giờ)
    return history || null;
  }

  // 4. Đánh dấu tất cả tin nhắn đối phương gửi là Đã Đọc
  async markAsRead(id_lich_su_tro_truyen, readerRole = "staff", io = null) {
    if (!id_lich_su_tro_truyen) {
      return { count: 0 };
    }

    // Xác định vai trò người gửi của tin nhắn CẦN ĐÁNH DẤU ĐỌC
    // Admin/Staff xem -> Đánh dấu tin nhắn do 'customer' gửi
    // Khách xem -> Đánh dấu tin nhắn do 'staff' gửi
    const senderRoleToMark = readerRole === "staff" ? "customer" : "staff";

    // 1. Cập nhật trạng thái da_doc = true trong Database
    const result = await prisma.tin_nhan.updateMany({
      where: {
        da_doc: false,
        vai_tro_nguoi_gui: senderRoleToMark,
        cuoc_tro_truyen: {
          id_lich_su_tro_truyen: id_lich_su_tro_truyen,
        },
      },
      data: {
        da_doc: true,
      },
    });

    // 2. Nếu có tin nhắn được cập nhật (hoặc luôn phát tín hiệu) -> Phát sự kiện Socket Real-time
    if (io) {
      io.to(`history_${id_lich_su_tro_truyen}`).emit("messages_read", {
        history_id: id_lich_su_tro_truyen,
        reader_role: readerRole, // "staff" hoặc "customer" vừa xem tin nhắn
        read_at: new Date(),
      });
    }

    return result;
  }

  // 5. Xóa Lịch sử trò chuyện dựa trên id
  async delete(id) {
    try {
      return await prisma.lich_su_tro_truyen.delete({
        where: { id: id },
      });
    } catch (error) {
      // Mã P2025: Bản ghi không tồn tại trong DB
      if (error.code === "P2025") {
        return null;
      }
      throw error;
    }
  }

  // 6. Lấy thống kê số tin nhắn chưa đọc theo từng lịch sử trò chuyện
  async getUnreadSummary() {
    // Dùng groupBy của Prisma đếm trực tiếp số tin nhắn chưa đọc do khách gửi
    const unreadMessages = await prisma.tin_nhan.groupBy({
      by: ["id_cuoc_tro_truyen"],
      where: {
        da_doc: false,
        vai_tro_nguoi_gui: "customer", // Chỉ đếm tin nhắn do khách gửi
      },
      _count: {
        id: true,
      },
    });

    if (unreadMessages.length === 0) {
      return {};
    }

    // Lấy danh sách id_cuoc_tro_truyen có tin nhắn chưa đọc
    const cuocTroTruyenIds = unreadMessages.map(
      (item) => item.id_cuoc_tro_truyen,
    );

    // Map ngược lại để lấy id_lich_su_tro_truyen tương ứng
    const cuocTroTruyenList = await prisma.cuoc_tro_truyen.findMany({
      where: {
        id: { in: cuocTroTruyenIds },
      },
      select: {
        id: true,
        id_lich_su_tro_truyen: true,
      },
    });

    // Tạo dictionary ánh ánh id_cuoc_tro_truyen -> id_lich_su_tro_truyen
    const threadToHistoryMap = {};
    cuocTroTruyenList.forEach((ctt) => {
      threadToHistoryMap[ctt.id] = ctt.id_lich_su_tro_truyen;
    });

    // Gom tổng số tin nhắn chưa đọc theo id_lich_su_tro_truyen
    const unreadSummary = {};
    unreadMessages.forEach((item) => {
      const historyId = threadToHistoryMap[item.id_cuoc_tro_truyen];
      if (historyId) {
        unreadSummary[historyId] =
          (unreadSummary[historyId] || 0) + item._count.id;
      }
    });

    // Trả về Object gọn nhẹ dạng: { "LS01": 2, "LS02": 1 }
    return unreadSummary;
  }

  // 7. Lấy tổng số tin nhắn chưa đọc của 1 Khách hàng (do Nhân viên gửi)
  async getUnreadByKhachHang(idKhachHang) {
    if (!idKhachHang) {
      return { count: 0 };
    }

    // Đếm trực tiếp số tin nhắn chưa đọc do Nhân viên gửi thuộc về các cuộc trò chuyện của Khách hàng này
    const unreadCount = await prisma.tin_nhan.count({
      where: {
        da_doc: false,
        vai_tro_nguoi_gui: "staff", // Chỉ đếm tin nhắn do Nhân viên/Admin gửi cho Khách
        cuoc_tro_truyen: {
          lich_su_tro_truyen: {
            id_khach_hang: idKhachHang, // Lọc chính xác theo Khách hàng đang đăng nhập
          },
        },
      },
    });

    // Trả về kết quả đếm đơn giản
    return { count: unreadCount };
  }
}

module.exports = LichSuTroTruyenService;
