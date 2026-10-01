const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const BienTheService = require("./bien-the.service");
const AnhSanPhamService = require("./anh-san-pham.service");

class SanPhamService {
  constructor() {
    this.bienTheService = new BienTheService();
    this.anhSanPhamService = new AnhSanPhamService();
  }

  // Lọc lấy các trường thuộc tính hợp lệ của san_pham
  extractSanPhamData(payload) {
    const sanPham = {
      id: payload.id,
      ten_san_pham: payload.ten_san_pham,
      mo_ta: payload.mo_ta,
      trang_thai: payload.trang_thai,
      id_thuong_hieu: payload.id_thuong_hieu,
      id_danh_muc: payload.id_danh_muc,
      id_nha_cc: payload.id_nha_cc,
    };
    Object.keys(sanPham).forEach(
      (key) => sanPham[key] === undefined && delete sanPham[key],
    );
    return sanPham;
  }

  // HELPER: Tìm biến thể rẻ nhất từ danh sách biến thể
  getBienTheReNhat(listBienThe) {
    if (!listBienThe || listBienThe.length === 0) return null;

    // Clone mảng bằng [...listBienThe] để tránh làm thay đổi thứ tự mảng gốc
    return [...listBienThe].sort((a, b) => {
      const PriceA = a.don_gia_ap_dung;
      const PriceB = b.don_gia_ap_dung;

      // Number(PriceA) - Number(PriceB) là sắp xếp tăng dần, biến thể rẻ hơn sẽ ở đầu
      return Number(PriceA) - Number(PriceB);
    })[0]; // Lấy ngay phần tử đầu tiên sau khi sort
  }

  // 1. Tạo Sản Phẩm mới (Tự sinh mã SP01, SP02 nếu client không truyền id)
  async create(payload, files = []) {
    // payload: chứa thông tin sản phẩm và mảng cấu hình ảnh

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
      // (Nếu lưu ảnh lỗi thì sản phẩm vừa tạo cũng sẽ rollback lại)
      const result = await prisma.$transaction(async (tx) => {
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
          for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Lấy thông tin la_anh_chinh tương ứng gửi từ client (hoặc mặc định file đầu tiên là ảnh chính)
            const isMain = payload.la_anh_chinh
              ? JSON.parse(payload.la_anh_chinh)[i]?.la_anh_chinh
              : i === 0;

            await this.anhSanPhamService.create(
              {
                id_san_pham: newSanPham.id,
                duong_dan_anh: file.filename,
                la_anh_chinh: isMain,
              },
              tx, 
            );
          }
        }
        return newSanPham;
      });

      return result;
    } catch (error) {
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
        if (fieldName.includes("id_ncc")) {
          throw new Error("ID_NHA_CUNG_CAP_KHONG_TON_TAI");
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

    if (filterData.id_nha_cc) where.id_nha_cc = filterData.id_nha_cc;

    if (filterData.trang_thai !== undefined) {
      where.trang_thai =
        filterData.trang_thai === "true" || filterData.trang_thai === true;
    }

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

    if (Object.keys(bienTheWhere).length > 0) {
      where.bien_the = { some: bienTheWhere };
    }

    // Lấy thông tin sản phẩm và danh sách ID biến thể thuộc về sản phẩm đó
    const listSanPham = await db.san_pham.findMany({
      where: where,
      include: {
        thuong_hieu: true,
        danh_muc: true,
        nha_cung_cap: true,
        thong_so: true,
        anh_san_pham: true,
        bien_the: {
          select: { id: true },
        },
      },
    });

    if (listSanPham.length === 0) return [];

    // Gom tất cả ID biến thể của các sản phẩm tìm được
    const allBienTheIds = [
      ...new Set(listSanPham.flatMap((sp) => sp.bien_the.map((bt) => bt.id))),
    ];

    if (allBienTheIds.length === 0) {
      return listSanPham.map((sp) => ({
        ...sp,
        bien_the_dai_dien: null,
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

    // Tìm biến thể có giá thấp nhất làm đại diện
    return listSanPham.map((sp) => {
      // với mỗi phần tử trong listSanPham
      const listBienTheOfSp = bienTheMapBySanPham.get(sp.id) || []; // lấy Value (danh sách biến thể) của phần tử đó dựa trên key là id sản phẩm (sp.id) và lưu vào listBienTheOfSp
      const bienTheDaiDien = this.getBienTheReNhat(listBienTheOfSp); // Gọi hàm getBienTheReNhat để lấy biến thể rẻ nhất trong số các biển thể nằm trong listBienTheOfSp

      // Loại bỏ mảng bien_the cũ (chỉ gồm {id}), thay bằng bien_the_dai_dien
      const { bien_the, ...sanPhamData } = sp;

      return {
        ...sanPhamData,
        bien_the_dai_dien: bienTheDaiDien,
      };
    });
  }

  // 3. Cập nhật thông tin một Sản Phẩm dựa trên id
  async update(id, payload, files = []) {
    const updateData = this.extractSanPhamData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính (id)

    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Cập nhật thông tin cơ bản của Sản Phẩm
        const updatedSanPham = await tx.san_pham.update({
          where: { id: id },
          data: updateData,
          include: {
            thuong_hieu: true,
            danh_muc: true,
          },
        });

        // Parse danh sách thông tin ảnh được truyền từ client (gồm ảnh cũ giữ lại & ảnh mới)
        const imageMetadata = payload.la_anh_chinh
          ? JSON.parse(payload.la_anh_chinh)
          : [];

        // 2. Xóa toàn bộ bản ghi ảnh cũ của sản phẩm này trong database
        await tx.anh_san_pham.deleteMany({
          where: { id_san_pham: id },
        });

        // 3. Thêm lại danh sách ảnh (bao gồm ảnh cũ còn giữ lại + ảnh mới vừa upload)
        let fileIndex = 0;
        for (const imgItem of imageMetadata) {
          let fileName = imgItem.duong_dan_anh;

          // Nếu là ảnh mới tải lên, lấy tên file từ multer
          if (!imgItem.isOld && files[fileIndex]) {
            fileName = files[fileIndex].filename;
            fileIndex++;
          }

          // Gọi service tạo lại bản ghi ảnh sản phẩm
          if (fileName) {
            await this.anhSanPhamService.create({
              id_san_pham: id,
              duong_dan_anh: fileName,
              la_anh_chinh: !!imgItem.la_anh_chinh, // Thuộc tính la_anh_chinh
            });
          }
        }

        return updatedSanPham;
      });

      return result;
    } catch (error) {
      // P2025: Không tìm thấy sản phẩm cần update
      if (error.code === "P2025") {
        return null;
      }
      // P2002: Trùng tên sản phẩm với bản ghi khác
      if (error.code === "P2002") {
        throw new Error("TEN_SAN_PHAM_DA_TON_TAI");
      }
      // P2003: Cập nhật id_thuong_hieu hoặc id_danh_muc nhưng mã đó không tồn tại
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

  // 4. Xóa (khóa) Sản Phẩm + các Biến thể liên quan dựa trên id
  async delete(id) {
    try {
      return await prisma.$transaction(async (tx) => {
        // 1. Cập nhật tất cả biến thể thuộc sản phẩm này thành false trước
        await tx.bien_the.updateMany({
          where: {
            id_san_pham: id,
            trang_thai: true,
          },
          data: { trang_thai: false },
        });

        // 2. Cập nhật trạng thái sản phẩm cha và nhận về dữ liệu ĐÃ CẬP NHẬT (trang_thai = false)
        const updatedSanPham = await tx.san_pham.update({
          where: { id: id },
          data: { trang_thai: false },
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
        await tx.bien_the.updateMany({
          where: {
            id_san_pham: id,
            trang_thai: false,
          },
          data: { trang_thai: true },
        });

        // 2. Cập nhật trạng thái sản phẩm cha và nhận về dữ liệu ĐÃ CẬP NHẬT (trang_thai = true)
        const updatedSanPham = await tx.san_pham.update({
          where: { id: id },
          data: { trang_thai: true },
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
        trang_thai: true,
      },
      data: {
        trang_thai: false,
      },
    });
    return result.count;
  }

  // 7. Tìm một Sản Phẩm dựa trên id
  async findById(id, tx) {
    const db = tx || prisma;

    // Lấy thông tin cơ bản của 1 sản phẩm kèm các ID biến thể
    const sanPham = await db.san_pham.findUnique({
      where: { id: id },
      include: {
        thuong_hieu: true,
        danh_muc: true,
        nha_cung_cap: true,
        thong_so: true,
        anh_san_pham: true,
        bien_the: {
          select: { id: true }, // Lấy danh sách ID các biến thể thuộc sản phẩm này
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

    // Trả về dữ liệu sản phẩm hoàn chỉnh
    return {
      ...sanPham,
      bien_the: bienTheCalculated,
    };
  }
}

module.exports = SanPhamService;
