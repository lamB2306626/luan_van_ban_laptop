const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class CpuService {
  // Lọc lấy các trường thuộc tính hợp lệ
  extractCpuData(payload) {
    const cpu = {
      id: payload.id,
      ten_cpu: payload.ten_cpu,
    };
    Object.keys(cpu).forEach(
      (key) => cpu[key] === undefined && delete cpu[key],
    );
    return cpu;
  }

  // 1. Tạo CPU mới (Tự sinh mã CPU01, CPU02 nếu client không truyền id)
  async create(payload) {
    if (!payload.id) {
      // Tìm 1 CPU có ID lớn nhất hiện tại
      const lastCpu = await prisma.cpu.findFirst({
        orderBy: {
          id: "desc", // Sắp xếp ID giảm dần (ví dụ: CPU05, CPU04, CPU03...)
        },
      });

      if (!lastCpu) {
        // Nếu database chưa có CPU nào
        payload.id = "CPU01";
      } else {
        // Lấy phần số ra khỏi chuỗi (VD: "CPU05" -> lấy số 5)
        const currentNumber = parseInt(lastCpu.id.replace(/\D/g, ""), 10) || 0;
        // Cộng thêm 1 và format lại thành chuỗi CPU06
        payload.id = `CPU${String(currentNumber + 1).padStart(2, "0")}`;
      }
    }

    const data = this.extractCpuData(payload);
    try {
      return await prisma.cpu.create({
        data: data,
      });
    } catch (error) {
      // Mã P2002 của Prisma đại diện cho lỗi vi phạm ràng buộc UNIQUE (trùng ten_cpu hoặc id)
      if (error.code === "P2002") {
        throw new Error("TEN_CPU_DA_TON_TAI");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm CPU theo mã (id) hoặc tên (ten_cpu)
  async find(filterData) {
    const where = {};

    // Tìm kiếm chính xác theo mã
    if (filterData.id) {
      where.id = filterData.id;
    }

    // Tìm kiếm gần đúng (chứa từ khóa, không phân biệt hoa thường) theo tên
    if (filterData.ten_cpu) {
      where.ten_cpu = {
        contains: filterData.ten_cpu,
        mode: "insensitive",
      };
    }

    return await prisma.cpu.findMany({
      where: where,
    });
  }

  // ==================== Cập nhật thông tin một CPU dựa trên id ======================
  async update(id, payload) {
    const updateData = this.extractCpuData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính (id)

    try {
      const result = await prisma.cpu.update({
        where: { id: id },
        data: updateData,
      });
      return result;
    } catch (error) {
      // 1. Lỗi không tìm thấy bản ghi cần update => Mã lỗi của Prisma là P2025
      if (error.code === "P2025") {
        return null;
      }
      // 2. Lỗi bị trùng tên CPU với bản ghi khác (UNIQUE constraint) => Mã lỗi là P2002
      if (error.code === "P2002") {
        throw new Error("TEN_CPU_DA_TON_TAI");
      }
      throw error;
    }
  }

  // ======================== Xóa CPU dựa trên id ==============================
  async delete(id) {
    try {
      const result = await prisma.cpu.delete({
        where: { id: id },
      });
      return result;
    } catch (error) {
      // 1. Không tìm thấy bản ghi cần xóa
      if (error.code === "P2025") {
        return null;
      }
      // 2. Lỗi vi phạm khóa ngoại (P2003): CPU này đang được sử dụng ở bảng khác (ví dụ: biến thể)
      if (error.code === "P2003") {
        throw new Error("CPU_DANG_DUOC_SU_DUNG");
      }
      throw error;
    }
  }

  // ====================== Xóa tất cả các CPU chưa được sử dụng ========================
  async deleteAll() {
    try {
      // Chỉ xóa các CPU KHÔNG gắn với biến thể nào (nếu schema đã nối quan hệ bien_the)
      const result = await prisma.cpu.deleteMany({
        where: {
          bien_the: {
            none: {},
          },
        },
      });
      return result.count; // Trả về số lượng CPU đã bị xóa
    } catch (error) {
      throw error;
    }
  }

  // ==================== Tìm một CPU dựa trên id ======================
  async findById(id) {
    return await prisma.cpu.findUnique({
      where: { id: id },
    });
  }
}

module.exports = CpuService;
