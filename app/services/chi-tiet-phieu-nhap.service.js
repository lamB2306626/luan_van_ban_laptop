const prisma = require("../utils/prisma");

class ChiTietPhieuNhapService {
  // Lọc lấy các trường thuộc tính hợp lệ
  extractChiTietPhieuNhapData(payload) {
    const chiTietPN = {
      id: payload.id,
      id_phieu_nhap: payload.id_phieu_nhap,
      id_bien_the: payload.id_bien_the,
      so_luong_nhap:
        payload.so_luong_nhap !== undefined
          ? parseInt(payload.so_luong_nhap, 10)
          : undefined,
      gia_nhap:
        payload.gia_nhap !== undefined ? Number(payload.gia_nhap) : undefined,
    };
    Object.keys(chiTietPN).forEach(
      (key) => chiTietPN[key] === undefined && delete chiTietPN[key],
    );
    return chiTietPN;
  }

  // ==================== HELPER 1: Tính & Cập nhật lại tong_tien cho PhieuNhap ====================
  async recalculateTongTienPhieuNhap(id_phieu_nhap, tx) {
    // Sử dụng instance 'tx' của Transaction nếu có, nếu không thì dùng 'prisma' mặc định
    const db = tx || prisma;

    // 1. Lấy tất cả danh sách chi tiết thuộc phiếu nhập này
    const allDetails = await db.chi_tiet_phieu_nhap.findMany({
      where: { id_phieu_nhap: id_phieu_nhap },
    });

    // 2. Tính tổng tiền: SUM(so_luong_nhap * gia_nhap)
    const newTongTien = allDetails.reduce((sum, item) => {
      return sum + Number(item.so_luong_nhap) * Number(item.gia_nhap);
    }, 0);

    // 3. Cập nhật lại cột tong_tien trong bảng phieu_nhap
    await db.phieu_nhap.update({
      where: { id: id_phieu_nhap },
      data: { tong_tien: newTongTien },
    });
  }

  // ==================== HELPER 2: Cập nhật số lượng kho cho Biến Thể ====================
  async updateKhoBienThe(id_bien_the, deltaSoLuong, tx) {
    const db = tx || prisma;

    // Tăng/giảm số lượng tồn kho dựa trên deltaSoLuong (dương là cộng thêm, âm là trừ đi)
    await db.bien_the.update({
      where: { id: id_bien_the },
      data: {
        so_luong: {
          increment: deltaSoLuong,
        },
      },
    });
  }

  // ==================== 1. Tạo Chi Tiết Phiếu Nhập & Cập nhật Kho ====================
  async create(payload, externalTx = null) {
    // Hàm thực thi chính (Nhận client tx từ ngoài hoặc dùng prisma mặc định)
    const execute = async (tx) => {
      // Ép payload về dạng Mảng để xử lý đồng nhất (dù client truyền 1 object hay mảng object)
      const items = Array.isArray(payload) ? payload : [payload];
      if (items.length === 0) return [];

      const results = [];

      // Lấy mã CTPN lớn nhất hiện tại trong DB
      const lastChiTiet = await tx.chi_tiet_phieu_nhap.findFirst({
        orderBy: { id: "desc" },
      });

      let currentNumber = lastChiTiet
        ? parseInt(lastChiTiet.id.replace(/\D/g, ""), 10) || 0
        : 0;

      for (const item of items) {
        const data = this.extractChiTietPhieuNhapData(item);

        // Kiểm tra trùng biến thể trong cùng phiếu nhập
        const existingDetail = await tx.chi_tiet_phieu_nhap.findFirst({
          where: {
            id_phieu_nhap: data.id_phieu_nhap,
            id_bien_the: data.id_bien_the,
          },
        });

        if (existingDetail) {
          throw new Error(`BIEN_THE_DA_TON_TAI_TRONG_PHIEU_NHAP`);
        }

        // Tự động tăng số đếm để sinh mã CTPN01, CTPN02 duy nhất cho từng item
        if (!data.id) {
          currentNumber += 1;
          data.id = `CTPN${String(currentNumber).padStart(4, "0")}`;
        }

        // Thao tác 1: Tạo bản ghi chi tiết
        const newDetail = await tx.chi_tiet_phieu_nhap.create({
          data: data,
          include: {
            phieu_nhap: true,
            bien_the: true,
          },
        });

        // Thao tác 2: Cộng số lượng nhập vào kho biến thể (sử dụng tx)
        await this.updateKhoBienThe(data.id_bien_the, data.so_luong_nhap, tx);

        results.push(newDetail);
      }

      // Thao tác 3: Tính toán lại tổng tiền phiếu nhập 1 lần duy nhất sau khi xong hết mảng
      if (items.length > 0 && items[0].id_phieu_nhap) {
        await this.recalculateTongTienPhieuNhap(items[0].id_phieu_nhap, tx);
      }

      // Nếu truyền 1 item thì trả về object, truyền mảng thì trả về mảng
      return Array.isArray(payload) ? results : results[0];
    };

    // Nếu service cha truyền `externalTx` vào thì dùng luôn, nếu không thì tự mở transaction riêng
    if (externalTx) {
      return await execute(externalTx);
    } else {
      return await prisma.$transaction(async (tx) => {
        return await execute(tx);
      });
    }
  }

  // 2. Tìm kiếm Phiếu Nhập theo mã (id), mã nhà cung cấp (id_ncc) hoặc mã nhân viên (id_nhan_vien)
  // async find(filterData) {
  //   const where = {};

  //   // Tìm kiếm chính xác theo mã phiếu nhập
  //   if (filterData.id) {
  //     where.id = filterData.id;
  //   }

  //   // Tìm kiếm theo mã nhà cung cấp
  //   if (filterData.id_ncc) {
  //     where.id_ncc = filterData.id_ncc;
  //   }

  //   // Tìm kiếm theo mã nhân viên lập phiếu
  //   if (filterData.id_nhan_vien) {
  //     where.id_nhan_vien = filterData.id_nhan_vien;
  //   }

  //   return await prisma.phieu_nhap.findMany({
  //     where: where,
  //     include: {
  //       nha_cung_cap: true,
  //       nhan_vien: true,
  //     },
  //   });
  // }

  // ==================== 2. Lấy danh sách Chi Tiết Phiếu Nhập ====================
  async find(filterData) {
    const where = {};

    if (filterData.id) where.id = filterData.id;
    if (filterData.id_phieu_nhap)
      where.id_phieu_nhap = filterData.id_phieu_nhap;

    return await prisma.chi_tiet_phieu_nhap.findMany({
      where: where,
      include: {
        phieu_nhap: true,
        bien_the: {
          include: {
            san_pham: true,
            mau_sac: true,
            cpu: true,
            gpu: true,
            dung_luong_ram: true,
            dung_luong_rom: true,
          },
        },
      },
    });
  }

  // ==================== 3. Cập nhật Chi Tiết Phiếu Nhập & Cập nhật Kho ====================
  async update(id, payload) {
    const updateData = this.extractChiTietPhieuNhapData(payload);

    delete updateData.id;
    delete updateData.id_phieu_nhap;
    delete updateData.id_bien_the;

    // Lấy thông tin bản ghi cũ trước khi cập nhật để tính chênh lệch số lượng
    const existingDetail = await prisma.chi_tiet_phieu_nhap.findUnique({
      where: { id: id },
    });

    if (!existingDetail) {
      return null;
    }

    try {
      return await prisma.$transaction(async (tx) => {
        // Thao tác 1: Cập nhật thông tin chi tiết phiếu nhập
        const updatedDetail = await tx.chi_tiet_phieu_nhap.update({
          where: { id: id },
          data: updateData,
          include: {
            phieu_nhap: true,
            bien_the: true,
          },
        });

        // Thao tác 2: Điều chỉnh số lượng kho theo chênh lệch (Số lượng mới - Số lượng cũ)
        if (
          updateData.so_luong_nhap !== undefined &&
          updateData.so_luong_nhap !== existingDetail.so_luong_nhap
        ) {
          const delta = updateData.so_luong_nhap - existingDetail.so_luong_nhap;
          await this.updateKhoBienThe(existingDetail.id_bien_the, delta, tx);
        }

        // Thao tác 3: Cập nhật lại tổng tiền phiếu nhập
        await this.recalculateTongTienPhieuNhap(
          updatedDetail.id_phieu_nhap,
          tx,
        );

        return updatedDetail;
      });
    } catch (error) {
      if (error.code === "P2025") {
        return null;
      }
      throw error;
    }
  }

  // ==================== 4. Xóa một Chi Tiết Phiếu Nhập & Cập nhật Kho ====================
  async delete(id) {
    const existingDetail = await prisma.chi_tiet_phieu_nhap.findUnique({
      where: { id: id },
    });

    if (!existingDetail) {
      return null;
    }

    try {
      return await prisma.$transaction(async (tx) => {
        // Thao tác 1: Thực hiện xóa bản ghi
        const deletedDetail = await tx.chi_tiet_phieu_nhap.delete({
          where: { id: id },
        });

        // Thao tác 2: Trừ số lượng đã nhập ra khỏi kho biến thể (truyền số âm)
        await this.updateKhoBienThe(
          existingDetail.id_bien_the,
          -existingDetail.so_luong_nhap,
          tx,
        );

        // Thao tác 3: Tính toán lại tổng tiền phiếu nhập
        await this.recalculateTongTienPhieuNhap(
          existingDetail.id_phieu_nhap,
          tx,
        );

        return deletedDetail;
      });
    } catch (error) {
      if (error.code === "P2025") {
        return null;
      }
      throw error;
    }
  }

  // ==================== 5. Xóa tất cả Chi Tiết Phiếu Nhập & Trừ Kho ====================
  async deleteAll() {
    return await prisma.$transaction(async (tx) => {
      // 1. Lấy tất cả chi tiết phiếu nhập hiện có để hoàn trả lại số lượng kho
      const allDetails = await tx.chi_tiet_phieu_nhap.findMany();

      // 2. Trừ lại số lượng tồn kho tương ứng của từng biến thể
      for (const item of allDetails) {
        await this.updateKhoBienThe(item.id_bien_the, -item.so_luong_nhap, tx);
      }

      // 3. Xóa toàn bộ các chi tiết
      const result = await tx.chi_tiet_phieu_nhap.deleteMany({});

      // 4. Đưa tất cả tong_tien của bảng phieu_nhap về 0
      await tx.phieu_nhap.updateMany({
        data: { tong_tien: 0 },
      });

      return result.count;
    });
  }

  // ==================== 6. Tìm một Chi Tiết Phiếu Nhập theo id ====================
  async findById(id) {
    return await prisma.chi_tiet_phieu_nhap.findUnique({
      where: { id: id },
      include: {
        phieu_nhap: true,
        bien_the: true,
      },
    });
  }
}

module.exports = ChiTietPhieuNhapService;
