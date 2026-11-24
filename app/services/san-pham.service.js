const prisma = require("../utils/prisma");
const BienTheService = require("./bien-the.service");
const AnhSanPhamService = require("./anh-san-pham.service");
const ThongSoService = require("./thong-so.service");
const NhaCungCapSanPhamService = require("./nha-cung-cap-san-pham.service");
const DanhGiaService = require("./danh-gia.service");
const YeuThichService = require("./yeu-thich.service");
const ChiTietDonHangService = require("./chi-tiet-don-hang.service");

class SanPhamService {
  constructor() {
    this.bienTheService = new BienTheService();
    this.anhSanPhamService = new AnhSanPhamService();
    this.thongSoService = new ThongSoService();
    this.nhaCungCapSanPhamService = new NhaCungCapSanPhamService();
    this.danhGiaService = new DanhGiaService();
    this.yeuThichService = new YeuThichService();
    this.chiTietDonHangService = new ChiTietDonHangService();
  }

  // Lọc lấy các trường thuộc tính hợp lệ của san_pham
  extractSanPhamData(payload) {
    const sanPham = {
      id: payload.id,
      ten_san_pham: payload.ten_san_pham,
      mo_ta: payload.mo_ta,
      trang_thai: payload.trang_thai,
      is_delete: payload.is_delete,
      id_thuong_hieu: payload.id_thuong_hieu,
      id_danh_muc: payload.id_danh_muc,
    };
    Object.keys(sanPham).forEach(
      (key) => sanPham[key] === undefined && delete sanPham[key],
    );
    return sanPham;
  }

  // HELPER: Tìm biến thể rẻ nhất từ danh sách biến thể
  getBienTheReNhat(listBienThe) {
    if (!listBienThe || listBienThe.length === 0) return null;

    return [...listBienThe].sort((a, b) => {
      // 1. Kiểm tra trạng thái còn hàng (true = còn hàng, false = hết hàng)
      const inStockA = Number(a.so_luong || 0) > 0;
      const inStockB = Number(b.so_luong || 0) > 0;

      // Nếu trạng thái còn hàng khác nhau -> Đẩy biến thể còn hàng lên trước (return -1)
      if (inStockA !== inStockB) {
        return inStockA ? -1 : 1;
      }

      // 2. Nếu cùng trạng thái (cùng còn hàng hoặc cùng hết hàng) -> Xếp theo giá tăng dần
      const priceA = Number(a.don_gia_ap_dung ?? a.gia ?? 0);
      const priceB = Number(b.don_gia_ap_dung ?? b.gia ?? 0);

      return priceA - priceB;
    })[0]; // Lấy phần tử đầu tiên sau khi sắp xếp
  }

  // 1. Tạo Sản Phẩm mới (Tự sinh mã SP01, SP02 nếu client không truyền id)
  async create(payload, files = []) {
    // payload: chứa thông tin sản phẩm, mảng cấu hình ảnh và danh sách nhà cung cấp (ví dụ: danh_sach_nha_cung_cap)

    // A. Tự sinh mã SP01, SP02 nếu client không truyền id
    if (!payload.id) {
      const lastSanPham = await prisma.san_pham.findFirst({
        orderBy: {
          id: "desc",
        },
      });

      if (!lastSanPham) {
        payload.id = "SP01";
      } else {
        const currentNumber =
          parseInt(lastSanPham.id.replace(/\D/g, ""), 10) || 0;
        payload.id = `SP${String(currentNumber + 1).padStart(2, "0")}`;
      }
    }

    const data = this.extractSanPhamData(payload);

    try {
      // B. Bắt đầu dùng Prisma Transaction để đảm bảo tính toàn vẹn dữ liệu
      const result = await prisma.$transaction(
        async (tx) => {
          // 1. Tạo bản ghi Sản Phẩm
          const newSanPham = await tx.san_pham.create({
            data: data,
            include: {
              thuong_hieu: true,
              danh_muc: true,
            },
          });

          // 2. Tạo các bản ghi Ảnh Sản Phẩm (nếu có truyền files/ảnh)
          if (files && files.length > 0) {
            const rawImages = files.map((file, i) => {
              const isMain = payload.la_anh_chinh
                ? payload.la_anh_chinh[i]?.la_anh_chinh
                : i === 0;

              return {
                id_san_pham: newSanPham.id,
                duong_dan_anh: file.filename,
                la_anh_chinh: !!isMain,
              };
            });

            if (rawImages.length > 0) {
              await this.anhSanPhamService.create(rawImages, tx);
            }
          }

          // 3. Tạo các bản ghi Nhà Cung Cấp - Sản Phẩm (nếu client truyền danh_sach_nha_cung_cap)
          if (
            Array.isArray(payload.danh_sach_nha_cung_cap) &&
            payload.danh_sach_nha_cung_cap.length > 0
          ) {
            // Gọi hàm create của NhaCungCapSanPhamService và truyền tx vào để chạy chung transaction
            await this.nhaCungCapSanPhamService.create(
              {
                id_san_pham: newSanPham.id,
                danh_sach_nha_cung_cap: payload.danh_sach_nha_cung_cap,
              },
              tx,
            );
          }

          // 4. Tạo các bản ghi Thông Số Kỹ Thuật - Sản Phẩm (nếu client có truyền vào)
          if (payload.thong_so_ky_thuat) {
            const preparedThongSo = {
              ...payload.thong_so_ky_thuat,
              id_san_pham: newSanPham.id,
            };

            await this.thongSoService.create(preparedThongSo, tx);
          }

          // 5. Thêm danh sách Biến Thể (nếu có gửi kèm)
          const dsBienThe = payload.danh_sach_bien_the;

          if (Array.isArray(dsBienThe) && dsBienThe.length > 0) {
            // Gán id_san_pham vừa tạo cho tất cả biến thể trong mảng
            const preparedBienThe = dsBienThe.map((bt) => ({
              ...bt,
              id_san_pham: newSanPham.id,
            }));

            await this.bienTheService.create(preparedBienThe, tx);
          }

          // Trả về thông tin sản phẩm hoàn chỉnh kèm các quan hệ nếu cần
          return await tx.san_pham.findUnique({
            where: { id: newSanPham.id },
            include: {
              thuong_hieu: true,
              danh_muc: true,
              nha_cung_cap_san_pham: {
                include: {
                  nha_cung_cap: true,
                },
              },
              anh_san_pham: true,
            },
          });
        },
        {
          maxWait: 10000, // Thời gian chờ lấy connection pool (10s)
          timeout: 15000, // Mở rộng timeout lên 15 giây để chống triệt để lỗi P2028
        },
      );

      return result;
    } catch (error) {
      // Bắt các lỗi custom ném ra từ service con hoặc mã lỗi Prisma
      if (error.message === "NHA_CUNG_CAP_HOAC_SAN_PHAM_KHONG_TON_TAI") {
        throw new Error("MOT_HOAC_NHIEU_NHA_CUNG_CAP_KHONG_TON_TAI");
      }
      if (error.message === "TAT_CA_LIEN_KET_DA_TON_TAI_TRUOC_DO") {
        throw new Error("DANH_SACH_NHA_CUNG_CAP_BI_TRUNG");
      }

      // P2002: Vi phạm ràng buộc UNIQUE (trùng tên sản phẩm)
      if (error.code === "P2002") {
        throw new Error("TEN_SAN_PHAM_DA_TON_TAI");
      }
      // P2003: Vi phạm ràng buộc Khóa ngoại
      if (error.code === "P2003") {
        const fieldName = error.meta?.field_name || "";
        if (fieldName.includes("id_thuong_hieu")) {
          throw new Error("ID_THUONG_HIEU_KHONG_TON_TAI");
        }
        if (fieldName.includes("id_danh_muc")) {
          throw new Error("ID_DANH_MUC_KHONG_TON_TAI");
        }
        throw new Error("KHOA_NGOAI_KHONG_TON_TAI");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm sản phẩm theo tên, danh mục, thương hiệu VÀ cấu hình biến thể (CPU, RAM, ROM, Giá...)
  async find(filterData, tx) {
    const db = tx || prisma;
    const where = {};
    const now = new Date();

    // Tiêu chí lọc sản phẩm cơ bản
    if (filterData.id) where.id = filterData.id;

    if (filterData.ten_san_pham) {
      where.ten_san_pham = {
        contains: filterData.ten_san_pham,
        mode: "insensitive",
      };
    }

    if (filterData.id_thuong_hieu)
      where.id_thuong_hieu = filterData.id_thuong_hieu;

    if (filterData.id_danh_muc) where.id_danh_muc = filterData.id_danh_muc;

    if (filterData.da_xoa !== undefined) {
      where.is_delete =
        filterData.da_xoa === "true" || filterData.da_xoa === true;
    }
    if (filterData.trang_thai) where.trang_thai = filterData.trang_thai;

    // Tiêu chí lọc nâng cao theo biến thể
    const bienTheWhere = {};

    if (filterData.id_cpu) {
      bienTheWhere.id_cpu = Array.isArray(filterData.id_cpu)
        ? { in: filterData.id_cpu }
        : filterData.id_cpu;
    }
    if (filterData.id_gpu) {
      bienTheWhere.id_gpu = Array.isArray(filterData.id_gpu)
        ? { in: filterData.id_gpu }
        : filterData.id_gpu;
    }
    if (filterData.id_ram) {
      bienTheWhere.id_ram = Array.isArray(filterData.id_ram)
        ? { in: filterData.id_ram }
        : filterData.id_ram;
    }
    if (filterData.id_rom) {
      bienTheWhere.id_rom = Array.isArray(filterData.id_rom)
        ? { in: filterData.id_rom }
        : filterData.id_rom;
    }
    if (filterData.id_mau_sac) {
      bienTheWhere.id_mau_sac = Array.isArray(filterData.id_mau_sac)
        ? { in: filterData.id_mau_sac }
        : filterData.id_mau_sac;
    }

    if (filterData.min_price || filterData.max_price) {
      bienTheWhere.gia = {};
      if (filterData.min_price)
        bienTheWhere.gia.gte = parseFloat(filterData.min_price);
      if (filterData.max_price)
        bienTheWhere.gia.lte = parseFloat(filterData.max_price);
    }

    if (filterData.trang_thai_bien_the !== undefined) {
      bienTheWhere.trang_thai =
        filterData.trang_thai_bien_the === "true" ||
        filterData.trang_thai_bien_the === true;
    }

    if (filterData.da_xoa_bien_the !== undefined) {
      bienTheWhere.is_delete =
        filterData.da_xoa_bien_the === "true" ||
        filterData.da_xoa_bien_the === true;
    }

    // Kiểm tra xem người dùng có truyền bộ lọc biến thể nào không
    const hasBienTheFilter = Object.keys(bienTheWhere).length > 0;

    if (hasBienTheFilter) {
      where.bien_the = { some: bienTheWhere };
    }

    // Lấy thông tin sản phẩm và danh sách ID biến thể thuộc về sản phẩm đó
    const listSanPham = await db.san_pham.findMany({
      where: where,
      include: {
        thuong_hieu: true,
        danh_muc: true,
        anh_san_pham: true,
        bien_the: {
          where: hasBienTheFilter ? bienTheWhere : {}, // CHỈ LẤY BIẾN THỂ KHỚP VỚI ĐIỀU KIỆN LỌC
          select: { id: true },
        },
        chi_tiet_khuyen_mai: {
          where: {
            dot_khuyen_mai: {
              ngay_bat_dau: { lte: now },
              ngay_ket_thuc: { gte: now },
            },
          },
          include: {
            dot_khuyen_mai: true,
          },
        },
      },
    });

    if (listSanPham.length === 0) return [];
    const sanPhamIds = listSanPham.map((sp) => sp.id);

    // Lấy mảng ID sản phẩm và gọi hàm thống kê số sao trung bình và số lượng yêu thích cho các sản phẩm
    const [thongKeDanhGiaMap, thongKeYeuThichMap, thongKeLuotMuaMap] =
      await Promise.all([
        this.danhGiaService.getThongKeDanhGia(sanPhamIds),
        this.yeuThichService.getThongKeYeuThich(sanPhamIds),
        this.chiTietDonHangService.getThongKeLuotMua(sanPhamIds),
      ]);

    // Gom tất cả ID biến thể của các sản phẩm tìm được
    const allBienTheIds = [
      ...new Set(listSanPham.flatMap((sp) => sp.bien_the.map((bt) => bt.id))),
    ];

    if (allBienTheIds.length === 0) {
      return listSanPham.map((sp) => ({
        ...sp,
        bien_the_dai_dien: null,
        top_1_khuyen_mai: [],
        thong_ke_danh_gia: { trung_binh_sao: 0, tong_so_danh_gia: 0 },
        tong_luot_yeu_thich: 0,
      }));
    }

    // Tính giá khuyến mãi cho toàn bộ các biến thể thu thập được
    const listBienTheCalculated = await this.bienTheService.find(
      { danh_sach_id: allBienTheIds },
      tx,
    );

    // Nhóm biến thể theo id_san_pham, kết quả thu được 1 Map với Key là id sản phẩm và
    // Value là danh sách các thuộc tính của sản phẩm đó
    const bienTheMapBySanPham = new Map(); // khởi tạo bienTheMapBySanPham rỗng
    listBienTheCalculated.forEach((bt) => {
      // với mỗi phần từ trong listBienTheCalculated
      if (!bienTheMapBySanPham.has(bt.id_san_pham)) {
        // (nếu thấy bt.id_san_pham của phần tử hiện tại chưa có trong bienTheMapBySanPham thì thêm vào làm Key mới)
        bienTheMapBySanPham.set(bt.id_san_pham, []);
      }
      bienTheMapBySanPham.get(bt.id_san_pham).push(bt); // thực hiện thêm biến thể đó vào bộ Value của Key bt.id_san_pham
    });

    // THU THẬP DỮ LIỆU TRẢ VỀ
    // với mỗi phần tử trong listSanPham
    return listSanPham.map((sp) => {
      // 1. Tìm biến thể có giá thấp nhất làm đại diện
      const listBienTheOfSp = bienTheMapBySanPham.get(sp.id) || []; // lấy Value (danh sách biến thể) của phần tử đó dựa trên key là id sản phẩm (sp.id) và lưu vào listBienTheOfSp
      const bienTheDaiDien = this.getBienTheReNhat(listBienTheOfSp); // Gọi hàm getBienTheReNhat để lấy biến thể rẻ nhất trong số các biển thể nằm trong listBienTheOfSp

      // Lấy 2 đợt khuyến mãi có mức giảm lớn nhất tính trên biến thể đại diện
      const top1KhuyenMai = this.getTop1KhuyenMai(
        bienTheDaiDien,
        sp.chi_tiet_khuyen_mai,
      );

      // 2. Tìm dữ liệu thống kê của sản phẩm đó
      const thongKeDanhGia = thongKeDanhGiaMap.get(sp.id) || {
        // lấy Value (dữ liệu thống kê) của phần tử đó dựa trên key là id sản phẩm (sp.id) và lưu vào thongKeDanhGia
        trung_binh_sao: 0,
        tong_so_danh_gia: 0,
      };

      // 2. Tìm số lượng yêu thích của sản phẩm đó
      const thongKeYeuThich = thongKeYeuThichMap.get(sp.id) || {
        tong_luot_yeu_thich: 0,
      };

      const thongKeLuotMua = thongKeLuotMuaMap.get(sp.id) || {
        tong_so_luot_mua: 0,
        tong_so_luong_ban: 0,
      };

      // Loại bỏ mảng bien_the cũ (chỉ gồm {id}), thay bằng bien_the_dai_dien
      const { bien_the, ...sanPhamData } = sp;

      return {
        ...sanPhamData,
        bien_the_dai_dien: bienTheDaiDien,
        top_1_khuyen_mai: top1KhuyenMai,
        thong_ke_danh_gia: thongKeDanhGia,
        tong_luot_yeu_thich: thongKeYeuThich.tong_luot_yeu_thich,
        thong_ke_luot_mua: thongKeLuotMua,
      };
    });
  }

  // 3. Cập nhật thông tin một Sản Phẩm dựa trên id
  async update(id, payload, files = []) {
    const updateData = this.extractSanPhamData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính (id)

    try {
      const result = await prisma.$transaction(
        async (tx) => {
          // 1. Cập nhật thông tin cơ bản của Sản Phẩm
          const updatedSanPham = await tx.san_pham.update({
            where: { id: id },
            data: updateData,
            include: {
              thuong_hieu: true,
              danh_muc: true,
            },
          });

          // =========================================================================
          // 2. CẬP NHẬT DANH SÁCH NHÀ CUNG CẤP (XÓA CŨ & TẠO MỚI)
          // =========================================================================
          if (payload.danh_sach_nha_cung_cap) {
            let dsNhaCungCap = payload.danh_sach_nha_cung_cap;

            if (Array.isArray(dsNhaCungCap)) {
              await tx.nha_cung_cap_san_pham.deleteMany({
                where: { id_san_pham: id },
              });

              if (dsNhaCungCap.length > 0) {
                const dataNhaCungCapInsert = dsNhaCungCap.map((idNcc) => ({
                  id_san_pham: id,
                  id_nha_cc: String(idNcc),
                }));

                await tx.nha_cung_cap_san_pham.createMany({
                  data: dataNhaCungCapInsert,
                });
              }
            }
          }

          // =========================================================================
          // 3. CẬP NHẬT HÌNH ẢNH SẢN PHẨM (XÓA CŨ & TẠO MỚI HÀNG LOẠT)
          // =========================================================================
          if (
            payload.la_anh_chinh !== undefined &&
            payload.la_anh_chinh !== null
          ) {
            const imageMetadata = Array.isArray(payload.la_anh_chinh)
              ? payload.la_anh_chinh
              : [];

            // Xóa toàn bộ bản ghi ảnh cũ của sản phẩm này trong database
            await tx.anh_san_pham.deleteMany({
              where: { id_san_pham: id },
            });

            if (imageMetadata.length > 0) {
              let fileIndex = 0;

              // Chuẩn bị danh sách ảnh thô để truyền vào createMultiple
              const rawImages = imageMetadata
                .map((imgItem) => {
                  let fileName = imgItem.duong_dan_anh;
                  if (!imgItem.isOld && files[fileIndex]) {
                    fileName = files[fileIndex].filename;
                    fileIndex++;
                  }

                  return fileName
                    ? {
                        id_san_pham: id,
                        duong_dan_anh: fileName,
                        la_anh_chinh: !!imgItem.la_anh_chinh,
                      }
                    : null;
                })
                .filter(Boolean);

              if (rawImages.length > 0) {
                // Gọi hàm createMultiple bên anhSanPhamService để vừa sinh ID chuẩn ASPxx vừa insert nhanh
                await this.anhSanPhamService.create(rawImages, tx);
              }
            }
          }

          return updatedSanPham;
        },
        {
          maxWait: 10000, // Thời gian chờ lấy connection pool (10s)
          timeout: 15000, // Mở rộng timeout lên 15 giây để chống triệt để lỗi P2028
        },
      );

      return result;
    } catch (error) {
      // P2025: Không tìm thấy sản phẩm cần update
      if (error.code === "P2025") {
        return null;
      }
      // P2002: Trùng tên sản phẩm với bản ghi khác
      if (error.code === "P2002") {
        console.log("Lỗi là: ", error);
        throw new Error("TEN_SAN_PHAM_DA_TON_TAI");
      }
      // P2003: Lỗi khóa ngoại không tồn tại (id_thuong_hieu, id_danh_muc, id_nha_cc)
      if (error.code === "P2003") {
        const fieldName = error.meta?.field_name || "";
        if (fieldName.includes("id_thuong_hieu")) {
          throw new Error("ID_THUONG_HIEU_KHONG_TON_TAI");
        }
        if (fieldName.includes("id_danh_muc")) {
          throw new Error("ID_DANH_MUC_KHONG_TON_TAI");
        }
        if (fieldName.includes("id_nha_cc")) {
          throw new Error("ID_NHA_CUNG_CAP_KHONG_TON_TAI");
        }
        throw new Error("KHOA_NGOAI_KHONG_TON_TAI");
      }
      throw error;
    }
  }

  // Lấy danh sách sản phẩm gợi ý kèm đầy đủ thông tin thống kê và khuyến mãi

  // tham số type = Recommen dùng cho chức năng gợi ý, khi tìm sẽ lọc sản phẩm có số lượng = 0 ra

  // tham số type = Chatbot dùng cho chức năng tư vấn AI, khi tìm không lóc sản phẩm số lương = 0 ra để nếu khách hàng có hỏi thì vẫn cho trả lời

  async getAllProductsForRecommendation(tx) {
    const db = tx || prisma;
    const now = new Date();
    const listSanPham = await db.san_pham.findMany({
      where: { trang_thai: "DANG_KINH_DOANH", is_delete: false },
      include: {
        thuong_hieu: true,
        danh_muc: true,
        anh_san_pham: {
          where: { la_anh_chinh: true },
          select: { duong_dan_anh: true }, // dành cho hiển thị bên trang chatbot
        },
        bien_the: {
          where: {
            trang_thai: true,
            is_delete: false,
          },
          select: { id: true },
        },
        chi_tiet_khuyen_mai: {
          where: {
            dot_khuyen_mai: {
              ngay_bat_dau: { lte: now },
              ngay_ket_thuc: { gte: now },
            },
          },
          include: { dot_khuyen_mai: true },
        },
      },
    });
    if (listSanPham.length === 0) return [];

    const sanPhamIds = listSanPham.map((sp) => sp.id);

    // 2. Lấy đồng thời các dữ liệu thống kê qua Bulk Query
    const [thongKeDanhGiaMap, thongKeYeuThichMap, thongKeLuotMuaMap] =
      await Promise.all([
        this.danhGiaService.getThongKeDanhGia(sanPhamIds),
        this.yeuThichService.getThongKeYeuThich(sanPhamIds),
        this.chiTietDonHangService.getThongKeLuotMua(sanPhamIds),
      ]);

    const allBienTheIds = [
      ...new Set(listSanPham.flatMap((sp) => sp.bien_the.map((bt) => bt.id))),
    ];

    if (allBienTheIds.length === 0) {
      return listSanPham.map((sp) => ({
        ...sp,
        bien_the: [],
        bien_the_dai_dien: null,
        top_1_khuyen_mai: [],
        thong_ke_danh_gia: { trung_binh_sao: 0, tong_so_danh_gia: 0 },
        tong_luot_yeu_thich: 0,
      }));
    }

    const listBienTheCalculated = await this.bienTheService.find(
      { danh_sach_id: allBienTheIds },
      tx,
    );

    const bienTheMapBySanPham = new Map();
    listBienTheCalculated.forEach((bt) => {
      if (!bienTheMapBySanPham.has(bt.id_san_pham)) {
        bienTheMapBySanPham.set(bt.id_san_pham, []);
      }
      bienTheMapBySanPham.get(bt.id_san_pham).push(bt);
    });

    return listSanPham.map((sp) => {
      const listBienTheOfSp = bienTheMapBySanPham.get(sp.id) || [];
      // (Phần chọn biến thể đại diện tốt nhất sẽ được truyền vào từ GoiYSanPhamService,
      // ở đây ta có thể tạm gán giá trị mặc định hoặc để mảng biến thể đầy đủ để GoiYSanPhamService xử lý)
      const top1KhuyenMai = this.getTop1KhuyenMai(
        listBienTheOfSp[0],
        sp.chi_tiet_khuyen_mai,
      );

      const thongKeDanhGia = thongKeDanhGiaMap.get(sp.id) || {
        trung_binh_sao: 0,
        tong_so_danh_gia: 0,
      };

      const thongKeYeuThich = thongKeYeuThichMap.get(sp.id) || {
        tong_luot_yeu_thich: 0,
      };

      const thongKeLuotMua = thongKeLuotMuaMap.get(sp.id) || {
        tong_so_luot_mua: 0,
        tong_so_luong_ban: 0,
      };

      const { bien_the, ...sanPhamData } = sp;

      return {
        ...sanPhamData,
        bien_the: listBienTheOfSp, // Trả về danh sách biến thể đã tính giá để hàm selectBestVariant lựa chọn
        top_1_khuyen_mai: top1KhuyenMai,
        thong_ke_danh_gia: thongKeDanhGia,
        tong_luot_yeu_thich: thongKeYeuThich.tong_luot_yeu_thich,
        thong_ke_luot_mua: thongKeLuotMua,
      };
    });
  }

  // ================== Chuẩn hóa & làm phẳng dữ liệu cho Vector RAG ==================
  async getFlattenedDataForRAG() {
    // 1. Tận dụng lại hàm lấy đầy đủ thông tin (đã tính sẵn khuyến mãi) của bạn
    const allProducts = await this.getAllProductsForRecommendation();

    const flattenedList = [];

    for (const sp of allProducts) {
      // Bỏ qua sản phẩm đã xóa hoặc ngừng kinh doanh
      if (sp.is_delete || sp.trang_thai !== "DANG_KINH_DOANH") {
        continue;
      }

      const tenSP = sp.ten_san_pham?.trim() || "";
      const thuongHieu = sp.thuong_hieu?.ten_thuong_hieu?.trim() || "Không rõ";
      const danhMuc = sp.danh_muc?.ten_danh_muc?.trim() || "Laptop";
      const moTa = sp.mo_ta?.trim() || "Phù hợp nhu cầu sử dụng đa năng";
      const diemDanhGia = sp.thong_ke_danh_gia?.trung_binh_sao || 0;
      const duongDanAnhSP = sp.anh_san_pham?.[0]?.duong_dan_anh.trim() || null;

      // Lấy tên chương trình khuyến mãi đang áp dụng (nếu có)
      const tenKhuyenMai =
        sp.top_1_khuyen_mai && sp.top_1_khuyen_mai.length > 0
          ? sp.top_1_khuyen_mai[0].dot_khuyen_mai?.ten_dot || "Đang khuyến mãi"
          : null;

      // Duyệt qua từng biến thể của sản phẩm
      const danhSachBienThe = sp.bien_the || [];
      for (const bt of danhSachBienThe) {
        // Chỉ lấy biến thể đang hoạt động, chưa bị xóa và CÒN HÀNG (so_luong > 0)
        // if (bt.is_delete || !bt.trang_thai || Number(bt.so_luong) <= 0) {
        //   continue;
        // }
        if (bt.is_delete || !bt.trang_thai) {
          continue;
        }

        const cpu = bt.cpu?.ten_cpu?.trim() || "Không rõ";
        const gpu = bt.gpu?.ten_gpu?.trim() || "Card tích hợp (Onboard)";
        const ram = bt.dung_luong_ram?.dung_luong_ram?.trim() || "Không rõ";
        const rom = bt.dung_luong_rom?.dung_luong_rom?.trim() || "Không rõ";
        const mauSac = bt.mau_sac?.ten_mau_sac?.trim() || "Tiêu chuẩn";
        const duongDanAnhBT = bt.duong_dan_anh?.trim() || "";

        const giaGoc = Number(bt.gia || 0);
        const giaSauGiam = Number(bt.don_gia_ap_dung || giaGoc);
        const coGiamGia = giaSauGiam < giaGoc;

        // Tạo chuỗi thông tin giá rõ ràng để AI đọc hiểu tự nhiên
        const thongTinGia = coGiamGia
          ? `${giaSauGiam.toLocaleString("vi-VN")} VNĐ (Đang giảm giá từ giá gốc ${giaGoc.toLocaleString("vi-VN")} VNĐ${tenKhuyenMai ? ` - Chương trình: ${tenKhuyenMai}` : ""})`
          : `${giaGoc.toLocaleString("vi-VN")} VNĐ (Giá niêm yết)`;

        // 2. Tạo đoạn văn bản giàu ngữ cảnh (Document) để Vector Embedding hiểu sâu
        const documentText = [
          `Sản phẩm: ${tenSP} (Mã SP: ${sp.id}, Mã biến thể: ${bt.id}).`,
          `Thương hiệu: ${thuongHieu}. Phân loại nhu cầu: ${danhMuc}.`,
          `Cấu hình chi tiết: CPU ${cpu}, Card đồ họa (GPU) ${gpu}, RAM ${ram}, Ổ cứng SSD ${rom}, Màu sắc ${mauSac}.`,
          `Giá bán: ${thongTinGia}.`,
          `Tình trạng kho: Còn hàng (${bt.so_luong} sản phẩm). Đánh giá: ${diemDanhGia}/5 sao.`,
          `Mô tả thêm: ${moTa}.`,
        ].join(" ");

        // 3. Gom vào mảng kết quả kèm Metadata chuẩn để ChromaDB lọc được theo số học
        flattenedList.push({
          vector_id: `${sp.id}_${bt.id}`, // ID duy nhất trong ChromaDB (VD: SP05_BT05)
          document: documentText, // Đoạn văn sẽ được mã hóa thành Vector
          metadata: {
            id_san_pham: String(sp.id),
            id_bien_the: String(bt.id),
            ten_san_pham: tenSP,
            thuong_hieu: thuongHieu,
            danh_muc: danhMuc,
            gia_ban: giaSauGiam, // Kiểu số (Number) để sau này lọc theo tầm giá
            so_luong: Number(bt.so_luong),
            cpu: cpu,
            ram: ram,
            rom: rom,
            gpu: gpu,
            mau_sac: mauSac,
            duong_dan_anh_bt: duongDanAnhBT,
            duong_dan_anh_sp: duongDanAnhSP,
          },
        });
      }
    }

    return flattenedList;
  }

  // 4. Xóa (khóa) Sản Phẩm + các Biến thể liên quan dựa trên id
  async delete(id) {
    try {
      return await prisma.$transaction(async (tx) => {
        // 1. Cập nhật tất cả biến thể thuộc sản phẩm này thành false trước
        // await tx.bien_the.updateMany({
        //   where: {
        //     id_san_pham: id,
        //     is_delete: false,
        //   },
        //   data: { is_delete: true },
        // });

        // 2. Cập nhật trạng thái sản phẩm cha và nhận về dữ liệu ĐÃ CẬP NHẬT (is_delete = false)
        const updatedSanPham = await tx.san_pham.update({
          where: { id: id },
          data: { is_delete: true },
        });

        return updatedSanPham;
      });
    } catch (error) {
      if (error.code === "P2025") {
        return null; // Không tìm thấy sản phẩm
      }
      throw error;
    }
  }

  // 5. Mở khóa Sản Phẩm dựa trên id
  async restore(id) {
    try {
      return await prisma.$transaction(async (tx) => {
        // 1. Cập nhật tất cả biến thể thuộc sản phẩm này thành true trước
        // await tx.bien_the.updateMany({
        //   where: {
        //     id_san_pham: id,
        //     is_delete: true,
        //   },
        //   data: { is_delete: false },
        // });

        // 2. Cập nhật trạng thái sản phẩm cha và nhận về dữ liệu ĐÃ CẬP NHẬT (is_delete = true)
        const updatedSanPham = await tx.san_pham.update({
          where: { id: id },
          data: { is_delete: false },
        });

        return updatedSanPham;
      });
    } catch (error) {
      if (error.code === "P2025") {
        return null; // Không tìm thấy sản phẩm
      }
      throw error;
    }
  }

  // 6. Xóa (khóa) tất cả các Sản Phẩm
  async deleteAll() {
    const result = await prisma.san_pham.updateMany({
      where: {
        is_delete: false,
      },
      data: {
        is_delete: true,
      },
    });

    return result.count;
  }

  // 7. Tìm một Sản Phẩm dựa trên id
  async findById(id, tx) {
    const db = tx || prisma;
    const now = new Date();

    // Lấy thông tin cơ bản của 1 sản phẩm kèm các ID biến thể
    const sanPham = await db.san_pham.findUnique({
      where: { id: id },
      include: {
        thuong_hieu: true,
        danh_muc: true,
        nha_cung_cap_san_pham: {
          include: { nha_cung_cap: true },
        },
        thong_so: true,
        anh_san_pham: true,
        bien_the: {
          select: { id: true }, // Lấy danh sách ID các biến thể thuộc sản phẩm này
        },
        chi_tiet_khuyen_mai: {
          where: {
            dot_khuyen_mai: {
              ngay_bat_dau: { lte: now },
              ngay_ket_thuc: { gte: now },
            },
          },
          include: {
            dot_khuyen_mai: true,
          },
        },
      },
    });

    if (!sanPham) return null;

    // Lấy mảng ID biến thể của sản phẩm
    const bienTheIds = sanPham.bien_the.map((bt) => bt.id);

    let bienTheCalculated = [];
    if (bienTheIds.length > 0) {
      // Gọi BienTheService tính giá KM cho danh sách biến thể này
      bienTheCalculated = await this.bienTheService.find(
        { danh_sach_id: bienTheIds },
        tx,
      );
    }

    // Lấy số sao trung bình và số lượng đánh giá của sản phẩm này
    // 2. Lấy đồng thời các dữ liệu thống kê qua Bulk Query
    const [thongKeDanhGia, thongKeYeuThich, thongKeLuotMua] = await Promise.all(
      [
        this.danhGiaService.getThongKeDanhGia(id),
        this.yeuThichService.getThongKeYeuThich(id),
        this.chiTietDonHangService.getThongKeLuotMua(id),
      ],
    );

    // Trả về dữ liệu sản phẩm hoàn chỉnh
    return {
      ...sanPham,
      bien_the: bienTheCalculated,
      thong_ke_danh_gia: thongKeDanhGia,
      tong_luot_yeu_thich: thongKeYeuThich.tong_luot_yeu_thich,
      thong_ke_luot_mua: thongKeLuotMua,
    };
  }

  // ==================== Hàm Helper: Tính toán giá khuyến mãi cho 1 biến thể ====================
  getTop1KhuyenMai(bienTheDaiDien, listChiTietKhuyenMai = []) {
    if (
      !bienTheDaiDien ||
      !listChiTietKhuyenMai ||
      listChiTietKhuyenMai.length === 0
    ) {
      return [];
    }

    // Lấy giá trị gốc của biến thể đại diện
    const giaGoc = Number(bienTheDaiDien.don_gia_ap_dung);

    // Tính số tiền được giảm thực tế cho từng đợt khuyến mãi
    const kmWithDiscount = listChiTietKhuyenMai.map((ctkm) => {
      const giaTriGiam = Number(ctkm.gia_tri_giam);
      let soTienGiam = 0;

      if (ctkm.loai_giam_gia === "PHAN_TRAM") {
        soTienGiam = (giaGoc * giaTriGiam) / 100;
      } else if (ctkm.loai_giam_gia === "CO_DINH") {
        soTienGiam = giaTriGiam;
      }

      // Giới hạn số tiền giảm không vượt quá giá gốc của sản phẩm
      soTienGiam = Math.min(soTienGiam, giaGoc);

      return {
        ...ctkm,
        so_tien_giam_thuc_te: soTienGiam, // Lưu lại để sắp xếp
      };
    });

    // Sắp xếp giảm dần theo số tiền giảm thực tế và cắt lấy 1 đợt đầu tiên
    return kmWithDiscount
      .sort((a, b) => b.so_tien_giam_thuc_te - a.so_tien_giam_thuc_te)
      .slice(0, 1);
  }
}

module.exports = SanPhamService;
