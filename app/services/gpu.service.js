const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class GpuService {
  // Lọc lấy các trường thuộc tính hợp lệ
  extractGpuData(payload) {
    const gpu = {
      id: payload.id,
      ten_gpu: payload.ten_gpu,
    };
    Object.keys(gpu).forEach(
      (key) => gpu[key] === undefined && delete gpu[key],
    );
    return gpu;
  }

  // 1. Tạo GPU mới (Tự sinh mã GPU01, GPU02 nếu client không truyền id)
  async create(payload) {
    if (!payload.id) {
      // Tìm 1 GPU có ID lớn nhất hiện tại
      const lastGpu = await prisma.gpu.findFirst({
        orderBy: {
          id: "desc", // Sắp xếp ID giảm dần (ví dụ: GPU05, GPU04, GPU03...)
        },
      });

      if (!lastGpu) {
        // Nếu database chưa có GPU nào
        payload.id = "GPU01";
      } else {
        // Lấy phần số ra khỏi chuỗi (VD: "GPU05" -> lấy số 5)
        const currentNumber = parseInt(lastGpu.id.replace(/\D/g, ""), 10) || 0;
        // Cộng thêm 1 và format lại thành chuỗi GPU06
        payload.id = `GPU${String(currentNumber + 1).padStart(2, "0")}`;
      }
    }

    const data = this.extractGpuData(payload);
    try {
      return await prisma.gpu.create({
        data: data,
      });
    } catch (error) {
      // Mã P2002 của Prisma đại diện cho lỗi vi phạm ràng buộc UNIQUE (trùng ten_gpu hoặc id)
      if (error.code === "P2002") {
        throw new Error("TEN_GPU_DA_TON_TAI");
      }
      throw error;
    }
  }

  // 2. Tìm kiếm GPU theo mã (id) hoặc tên (ten_gpu)
  async find(filterData) {
    const where = {};

    // Tìm kiếm chính xác theo mã
    if (filterData.id) {
      where.id = filterData.id;
    }

    // Tìm kiếm gần đúng (chứa từ khóa, không phân biệt hoa thường) theo tên
    if (filterData.ten_gpu) {
      where.ten_gpu = {
        contains: filterData.ten_gpu,
        mode: "insensitive",
      };
    }

    return await prisma.gpu.findMany({
      where: where,
    });
  }

  // ==================== Cập nhật thông tin một GPU dựa trên id ======================
  async update(id, payload) {
    const updateData = this.extractGpuData(payload);
    delete updateData.id; // Không cho phép cập nhật khóa chính (id)

    try {
      const result = await prisma.gpu.update({
        where: { id: id },
        data: updateData,
      });
      return result;
    } catch (error) {
      // 1. Lỗi không tìm thấy bản ghi cần update => Mã lỗi của Prisma là P2025
      if (error.code === "P2025") {
        return null;
      }
      // 2. Lỗi bị trùng tên GPU với bản ghi khác (UNIQUE constraint) => Mã lỗi là P2002
      if (error.code === "P2002") {
        throw new Error("TEN_GPU_DA_TON_TAI");
      }
      throw error;
    }
  }

  // ======================== Xóa GPU dựa trên id ==============================
  async delete(id) {
    try {
      const result = await prisma.gpu.delete({
        where: { id: id },
      });
      return result;
    } catch (error) {
      // 1. Không tìm thấy bản ghi cần xóa
      if (error.code === "P2025") {
        return null;
      }
      // 2. Lỗi vi phạm khóa ngoại (P2003): GPU này đang được sử dụng ở bảng khác (ví dụ: biến thể)
      if (error.code === "P2003") {
        throw new Error("GPU_DANG_DUOC_SU_DUNG");
      }
      throw error;
    }
  }

  // ====================== Xóa tất cả các GPU chưa được sử dụng ========================
  async deleteAll() {
    try {
      // Chỉ xóa các GPU KHÔNG gắn với biến thể nào (nếu schema đã nối quan hệ bien_the)
      const result = await prisma.gpu.deleteMany({
        where: {
          bien_the: {
            none: {},
          },
        },
      });
      return result.count; // Trả về số lượng GPU đã bị xóa
    } catch (error) {
      throw error;
    }
  }

  // ==================== Tìm một GPU dựa trên id ======================
  async findById(id) {
    return await prisma.gpu.findUnique({
      where: { id: id },
    });
  }
}

module.exports = GpuService;
